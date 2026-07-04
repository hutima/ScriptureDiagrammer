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
- `4e29b7d` Stacked secondary diagram infra; `a188a96` WLC bundle; `24b2a96`
  Acts 2:39 guide (Acts 2:39 ∥ Genesis 17:12 with stacked OT+NT view).
  Guide id chapter segments match plan, 2234 tests green, 16 guides validate.
- Guided (Grammar-highlights) mode is DESKTOP-ONLY, mirroring the
  `canEdit = vp.isDesktop` pattern (force-desktop counts as desktop): the
  TopBar launcher + ⋯-menu item hide on small screens, the intro modal swaps
  its enter buttons for a "desktop only" note, and `useGuidedStore.enter()`
  no-ops on non-desktop via `canEnterGuided()` (`src/state/guided.ts`,
  reading width via `classifyWidth` + the editor store's forceDesktop flag).
  Tests in `tests/guided-ui.test.tsx` (this commit).

## Done (handoff queue)

### 1. Fix: original-language ↔ BSB picker disappears on multi-verse OT load
Diagnosed and fixed: `parseHebrewId` regex at `src/io/parallel.ts:299` changed
from `/^t_o(\d{12})$/` to `/(?:^|_)t_o(\d{12})$/` to accept both unprefixed
and `combinePassage`-prefixed token ids. Test added in `tests/macula-hebrew.test.ts`
(Hebrew analogue of parallel.test.ts:51); demonstrates red/green via old/new
regex. Commit: `762dd0f`. 2235 tests green (+1).

### 2. Romans 8:28–30 guide — ordo salutis — DONE
Landed as `6063bed`. The whole 8:28–30 range is ONE SBLGNT sentence,
`sblgnt_romans_216` — which is exactly the passageId of the existing contested
entry `iss_rom_8_28_variant_sblgnt`, so the bonus applied cleanly: the 8:28
step carries `contested: { issueId: 'iss_rom_8_28_variant_sblgnt', … }` (the
"+ ὁ θεός" textual variant, romans-9-5 pattern). 7 steps
(`guide-romans-8-28-30`, intermediate), 10 Greek term chips incl. the five
chain verbs; all guardrails honored (aorist chain viewed as a whole,
ἐδόξασεν as confident anticipation, "confessional Reformed" label, fair
Arminian/corporate προέγνω views). Registry tests extended in
`tests/guided.test.ts`; 2237 green; 17 guides validate.

## Queue (in order; specs are complete — no re-planning needed)

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
`npm run typecheck` · `npm test` (2235 green as of `762dd0f`; grows with each
item) · `npm run guided:check` · `npm run contested:check`. Bundle JSON files
are GENERATED — never hand-edit; re-run `guided:build` after merges.

## Git conventions
Branch `claude/romans-9-5-alternate-reading-r4yk97` only. Focused commits.
Push with `-u origin`, retry on network errors only. The PR for this branch
already exists — do not open another.

## Follow-up phases (after queue completes)

Merge choreography: when the remaining queue items (Romans 8:28–30, Colossians
2:11–12 package) land, MERGE PR #233. Then restart this same branch from main
(`git fetch origin main && git checkout -B claude/romans-9-5-alternate-reading-r4yk97 origin/main`)
for each following phase; each phase gets its own PR, merged before the next.

### Phase B — Matt 6:11 ∥ Luke 11:3 stacked view
The stacked-view infra (secondaryPassageId/secondaryFocus/secondaryHighlights/
secondaryTitle, GuidedStackedDiagram) shipped with Acts 2:39. Convert the
Lord's-Prayer guide (src/data/guides/lords-prayer-bread.ts, passages
sblgnt_matthew_143 + sblgnt_luke_511) so the δός vs δίδου comparison shows both
passages AT ONCE via the secondary fields (e.g. Matthew primary with Luke
stacked on the comparison steps), instead of only alternating passages between
steps. guided:check + guided/guided-ui tests. Small task, cheap model.

### Phase C — final two fixes (one PR)
1. Gloss-mode regression, Matthew 28:19–20: in English gloss mode the diagram
   shows "(I) | I commanded | whatever" with "you" (ὑμῖν) as a rotated slant
   under the verb (user screenshot). Diagnose by comparing source vs glossDoc
   rendering (glossDoc must never change structure — ids/relations/layout
   unchanged; check connector-label suppression and dative complement
   placement in gloss mode), fix minimally, add a test.
2. LAST of all asks: guided mode Back button — UI-only, GuidedStepCard/
   EditModeToolbar area: add Back beside Next (store already supports stepping
   back; disable on step 1).
