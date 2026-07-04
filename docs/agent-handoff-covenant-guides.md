# Agent handoff — covenant guides & fixes (branch `claude/romans-9-5-alternate-reading-r4yk97`)

Status ledger for the current work queue. **Update this file as items land.** If a
session dies mid-queue: read this file top to bottom, check `git log` against the
"landed" list, and resume the first unfinished item. Conventions: CLAUDE.md is
binding; one writer at a time in the tree; every change verified with
`npm run typecheck && npm test && npm run guided:check && npm run contested:check`
(guided/contested checks when touching those areas) before push. PR exists for
this branch — keep pushing to it, do not open a new one.

## Landed (verify against git log)

- `c56b745` Romans 9:5 guide references the built-in alternate reading
  (`iss_rom_9_5_doxology_sblgnt` / `alt_rom_9_5_to_christ_sblgnt`) via new
  optional step field `contested: { issueId, note? }` + "See the alternate
  reading" button in `GuidedStepCard`. Includes guided-store fix:
  `setGuideReadingContext()` after every guided `loadDocument` so the merged
  contested base builds in guided mode.
- `65c3045` AI-content caution (amber `.guided-ai-note`) in
  `GrammarHighlightsIntroModal` — guide material is AI-generated, reviewed by
  the app author, read with discernment.
- `9a12581` Copy rename "Reformed-Anglican" → "confessional Reformed"
  everywhere (9 occurrences; the label to use going forward is exactly
  **"confessional Reformed"**).
- `6207de6` Tetragrammaton glosses render "LORD" (not "Yahweh") — override in
  `src/io/macula-hebrew.ts` `heGlossOf()`, keyed on lemma יהוה.

## In flight

- **Acts 2:39 ∥ Genesis 17:12 guide with stacked OT+NT view** (Opus agent).
  Full plan summary: new optional step fields `secondaryPassageId` /
  `secondaryFocus` / `secondaryHighlights` / `secondaryTitle` in
  `schema/guided.ts`; new `src/ui/guided/GuidedStackedDiagram.tsx` rendering the
  secondary doc READ-ONLY via `StaticDiagramFrame` (extended with optional
  `highlightFills` + `rtl` props, contested usage unchanged) mounted in
  `DiagramCanvas` below the main viewport; the secondary (Hebrew) doc is NEVER
  loaded into the editor store. Build: `GUIDED_HEBREW_PASSAGES` (Gen 17:12) in
  `guidedPassages.ts`; Hebrew loop in `scripts/build-guided-highlights.mts`
  fetching WLC lowfat remotely, output to NEW bundle
  `src/fixtures/guided/grammar-highlights-wlc.json`, concat in
  `fixtures/guided/index.ts`. Guide `guide-acts-2-39`, passages
  `sblgnt_acts_47` + `wlc_genesis_1_11` (id chapter segment reads `_1_` —
  expected), 6 steps (promise → children → STACKED Abraham parallel → sign
  changes/covenant stands → far off → effectual call), confessional Reformed
  frame, fair credobaptist debate note, προσκαλέσηται never "once-for-all".
  If this agent died mid-work: `git status`/`git log` to see how far it got;
  re-run `npm run guided:build` before checks.

## Queue (in order; specs are complete — no re-planning needed)

### 1. Fix: original-language ↔ BSB picker disappears on multi-verse OT load
Diagnosed. NOT discourse mode — syntax-mode Verses strip. Cause:
`parseHebrewId` (`src/io/parallel.ts:299`) uses start-anchored
`/^t_o(\d{12})$/`; `combinePassage` prefixes ids (`s0_t_o…`) on multi-verse
loads, so `alignParallelHebrew` finds 0 verses → `hasEnglish=false`
(`DiagramCanvas.tsx:257`) → picker replaced by "Source text" label.
**Fix:** change regex to `/(?:^|_)t_o(\d{12})$/`. **Test:** Hebrew analogue of
`tests/parallel.test.ts:51` — combinePassage two OT sentences, assert
`alignParallelHebrew` yields verses + nodeToEn entries (natural home:
`tests/macula-hebrew.test.ts`).

### 2. Romans 8:28–30 guide — ordo salutis (easy/medium)
Standard single-passage guide, no new infrastructure. Golden chain: foreknew →
predestined → called → justified → glorified (προέγνω, προώρισεν, ἐκάλεσεν,
ἐδικαίωσεν, ἐδόξασεν — the aorist chain viewed as a whole; NEVER "aorist =
once-for-all"; note ἐδόξασεν as confident anticipation). Confessional Reformed
frame: the unbreakable chain of salvation, God's purpose from foreknowledge to
glory; fair notes on corporate/Arminian construals of προέγνω ("foreknew" =
relational fore-love vs foresight of faith). Bonus: the existing contested
entry `sblgnt_romans_216` (Rom 8:28 textual variant, "God works all things" vs
"all things work together") can be referenced from step 1 via the step
`contested` field IF it applies to the loaded passage. Steps: add range
`{ Romans, 8, 28, 30 }` to `guidedPassages.ts`; `npm run guided:build`; dump
ids (`npm run dump-syntax -- 'sblgnt:Romans 8:28'` etc.); author
`src/data/guides/romans-8-28-30.ts`; register in `grammarHighlights.ts`;
`guided:check`; full verify; push.

### 3. Colossians 2:11–12 package (advanced) — guide + contested reading + gloss fix
User confirmed the contested reading must land in the SYNTAX-MODE registries
(both GNT sources), not just the guide.
- **Passage:** `sblgnt_colossians_13` (ONE sentence, Col 2:8–12; no merge).
  Key ids (verify with dump-syntax): περιετμήθητε `w_n51002011004`,
  συνταφέντες `w_n51002012001` (its clause `cl_s13_64` attaches to
  περιετμήθητε via `r_s13_89` — the base parse ALREADY draws the
  circumcision→baptism hinge; the confessional-Reformed-relevant attachment IS
  the base), βαπτισμῷ `w_n51002012005` (token `t_n51002012005`, EMPTY gloss),
  ᾧ(v12b) `w_n51002012007`, συνηγέρθητε `w_n51002012009`, raised-clause
  `cl_s13_67`, apposition `r_s13_86` (βαπτισμῷ↔clause), prepObject `r_s13_87`.
- **Contested entry (SBLGNT):** issue `iss_col_2_12_raised_antecedent_sblgnt`
  (kind attachment, sourceType syntax-only, severity review, verseRef
  Colossians 2:12; default reading "antecedent = baptism") + reading
  `alt_col_2_12_raised_in_christ_sblgnt` (syntaxPatch sketch: update
  `r_s13_87` dependentId → `w_n51002012005`; remove `r_s13_86`; upsert new
  adverbial rel `alt_col_2_12_r1` headId `w_n51002012001` → `cl_s13_67`,
  label "in whom (Christ)", provenance manual/low). Finalize ops against
  `npm run contested:check`; hand-verify the preview isn't orphaned.
- **Nestle1904 mirror:** add the same issue/reading to `contestedSyntax.ts`
  with FRESHLY DUMPED Nestle ids (`npm run dump-syntax -- 'Colossians 2:12'` —
  read the script for the non-sblgnt invocation). Never reuse SBLGNT ids.
- **Gloss fix:** `GRC_CONTENT_GLOSS = { βαπτισμός: 'baptism' }` in
  `src/domain/model/queries.ts` beside `GRC_FUNCTION_GLOSS`; fallback chain in
  `glossDoc` (~line 304) and `glossRelationLabel` (~line 273) becomes
  `tidyGloss(t.gloss) || GRC_FUNCTION_GLOSS[t.surface] ||
  GRC_CONTENT_GLOSS[t.lemma ?? ''] || t.surface`. Tests in
  `tests/gloss.test.ts` (empty-gloss βαπτισμῷ → "baptism"; real gloss wins).
- **Guide:** `guide-colossians-2-11-12`, 6 steps (circumcised-without-hands →
  circumcision of Christ → συνταφέντες hinge (highlight `r_s13_89`) → in
  baptism (gloss showcase) → CONTESTED step with
  `contested: { issueId: 'iss_col_2_12_raised_antecedent_sblgnt', … }` →
  through faith in the working of God). confessionalFrame labeled
  "confessional Reformed"; debateSummary fair (baptism vs Christ antecedent;
  circumcision-of-Christ = his death vs conversion-circumcision; credobaptist
  note). Term chip `baptismo` must use surface "βαπτισμῷ" with authored gloss
  "baptism". Range `{ Colossians, 2, 11, 12 }` in guidedPassages; build; check.

## Verification gate (every push)
`npm run typecheck` · `npm test` (2228 green as of `6207de6`; grows with each
item) · `npm run guided:check` · `npm run contested:check`. Bundle JSON files
are GENERATED — never hand-edit; re-run `guided:build` after merges.

## Git conventions
Branch `claude/romans-9-5-alternate-reading-r4yk97` only. Focused commits.
Push with `-u origin`, retry on network errors only. The PR for this branch
already exists — do not open another.
