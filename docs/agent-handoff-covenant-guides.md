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

### 3. Colossians 2:11–12 package (advanced) — guide + contested reading + gloss fix — DONE
Landed as three commits: `42c9c20` (contested — both registries), `5c059b9`
(gloss content-gloss fallback), and this doc commit (the guide + doc).
- **Contested — BOTH registries.** SBLGNT (`contestedSyntaxSblgnt.ts`): issue
  `iss_col_2_12_raised_antecedent_sblgnt` + reading
  `alt_col_2_12_raised_in_christ_sblgnt` on `sblgnt_colossians_13`, ops exactly
  as sketched — update `r_s13_87` dependentId → `w_n51002012005`, remove
  `r_s13_86`, upsert adverbial `alt_col_2_12_r1` (`w_n51002012001` → `cl_s13_67`,
  "in whom (Christ)", manual/low). Nestle1904 mirror LANDED
  (`contestedSyntax.ts`): `iss_col_2_12_raised_antecedent` +
  `alt_col_2_12_raised_in_christ` on `gnt_colossians_13`, freshly dumped ids.
  The Nestle base draws the raised clause ADJECTIVALLY under βαπτίσματι
  (`r_s13_87`), so the mirror is a single update op re-pointing that relation to
  συνταφέντες (`w_510020120010010`) as adverbial "in whom (Christ)". Preview
  hand-verified non-orphaned; diff touches only the sketched relations.
  contested:check: Nestle 33 + SBLGNT 28 passages, 0 errors.
- **Gloss fix.** `GRC_CONTENT_GLOSS = { βαπτισμός: 'baptism' }` in
  `queries.ts`, wired into `glossDoc` + `glossRelationLabel` after
  `tidyGloss(t.gloss)`/`GRC_FUNCTION_GLOSS[t.surface]`. Tests in
  `tests/gloss.test.ts`.
- **Guide.** `guide-colossians-2-11-12` (advanced, 6 steps), registered in
  `grammarHighlights.ts`, range in `guidedPassages.ts`, bundle rebuilt. Term
  chip `baptismo` = surface "βαπτισμῷ" + authored gloss "baptism".
  confessionalFrame labelled "confessional Reformed"; debateSummary fair
  (baptism/Christ antecedent, circumcision-of-Christ = his death vs conversion,
  credobaptist note). Tests extended in `tests/guided.test.ts`. guided:check:
  18 guides validate. Full suite 2248 green.

## Queue — COMPLETE

All handoff-queue items (1 picker fix, 2 Romans 8:28–30, 3 Colossians
2:11–12) have landed. **PR #233 is ready to merge.** See the merge choreography
below for the follow-up phases after the merge.

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

### Phase B — Back button for guided-mode step navigation — DONE
- Back button was implemented as part of the original guided-mode
  infrastructure (commit `96ceceb`). Located in `GuidedStepCard.tsx`
  (lines 152–154): disabled on step 1, mirrors Next styling/behavior
  (both use `className="btn"`, secondary uses `primary`, Back uses plain,
  matching CSS-defined patterns). Store action `prevStep()` already supported
  (implemented in `src/state/guided.ts`). Tests verify: Back disabled on step 1,
  clicking Next then Back returns to prior step (`tests/guided-ui.test.tsx`
  lines 108–110). 2248 tests green; no new files needed. This item is COMPLETE.

### Phase C — Matt 6:11 ∥ Luke 11:3 stacked view — DONE
Landed as this commit (guide + tests + this doc update all in one commit, per
the task's ask — a commit cannot cite its own final hash, so check `git log`
on this branch for the `feat(guided): stack Matthew and Luke in the
daily-bread comparison` commit). The Lord's-Prayer guide
(`src/data/guides/lords-prayer-bread.ts`) now uses the stacked-view fields
that shipped with Acts 2:39 instead of only alternating passages between
steps. Three comparison steps stack the OTHER gospel beneath the one
currently loaded: `step-luke-present` (primary Luke) stacks Matthew's δός so
both imperatives — δός and δίδου — render simultaneously; `step-luke-each-day`
(primary Luke) stacks Matthew's σήμερον beside Luke's τὸ καθ' ἡμέραν;
`step-two-pictures` (primary Luke) stacks the full Matthew close-up for the
final side-by-side summary. The opening step and the epiousios step stay
full-screen single-diagram looks at Matthew — the alternation is kept where
it still teaches well. All ids reused are the same real ids already in the
guide (re-verified via `npm run dump-syntax`); no bundle rebuild needed.
Tests extended in `tests/guided.test.ts` (registry + secondary highlight-map
resolution + store navigation) and `tests/guided-ui.test.tsx` (both Gospel
diagrams render with highlights on each). 2252 tests green (+4); guided:check:
18 guides validate.

### Phase D — final one fix
Gloss-mode regression, Matthew 28:19–20: in English gloss mode the diagram
shows "(I) | I commanded | whatever" with "you" (ὑμῖν) as a rotated slant
under the verb (user screenshot). Diagnose by comparing source vs glossDoc
rendering (glossDoc must never change structure — ids/relations/layout
unchanged; check connector-label suppression and dative complement
placement in gloss mode), fix minimally, add a test.
