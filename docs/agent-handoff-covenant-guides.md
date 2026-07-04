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

### Phase D — final one fix — DONE
Gloss-mode issue, Matthew 28:19–20 (`sblgnt_matthew_1132`, sub-clause
`cl_s1132_30` "ὅσα ἐνετειλάμην ὑμῖν"). Landed as `06b4b6c` (see
`git log` for `fix(gloss): ...`).

**Root cause (a latent bug this passage exposed, NOT a recent regression).**
Two independent, correct behaviours collide in English-gloss mode:
- The sub-clause has NO written subject, so the KR layout imputes a pro-drop
  subject pronoun from the verb's morphology (`subjectFillerLabel` →
  `impliedSubjectPronoun`). In gloss mode `glossDoc` reports the doc as
  `language:'en'` (long-standing, PR #183), so the filler reads "(I)" for the
  first-singular ἐνετειλάμην.
- The verb TOKEN's own English data gloss is "I commanded" — a Greek finite
  verb's gloss fuses in its subject pronoun.

So the baseline printed "(I) | I commanded" — the subject twice. In SOURCE
mode there is no duplication (the imputed "(ἐγώ)" never textually appears in
"ἐνετειλάμην"), which is why this only ever surfaced glossed. Confirmed by
laying out the real fixture doc in both modes (scratch repro).

**ὑμῖν ("you") on a slant is CORRECT, not a bug.** `BASELINE_COMPLEMENTS`
(`kr/classify.ts`) deliberately EXCLUDES `indirectObject`: in Reed-Kellogg the
indirect object hangs below the verb on a slanted stem, distinct from the
direct object's upright tick. The code comment says so explicitly. Identical in
source and gloss modes, so it is not the regression. Left untouched.

**Fix (layout layer, display-only).** In `kr/clause.ts`, when a pro-drop clause
imputes its subject AND the verb's displayed text already leads with that same
pronoun, keep the pronoun in the subject slot only and strip its redundant copy
from the verb (new pure helper `stripLeadingImputedPronoun`; `layoutHead` gained
an optional `textOverride`). The diagram now reads "(I) | commanded", matching
the Greek "(ἐγώ) | ἐνετειλάμην" — same structure in both modes. The token gloss
is never mutated (three-concern separation intact); the strip cannot fire in
source mode (Greek surface never equals the pronoun) nor for a gloss that
doesn't lead with the pronoun ("(you) | disciple" is preserved). Regression
tests in `tests/gloss.test.ts` ("pro-drop subject fused into the verb gloss").
2255 tests green (+3); guided:check: 18 guides validate.

### Phase E — guided-mode narrow-viewport layout + invisible Back button — DONE
Two user-reported UI bugs in guided mode, both reproduced against the live
dev-server app (headless Chromium, iPhone width ~390×844, force-desktop
preference ON via `localStorage['kr:forceDesktop']`) before any code changed.

**Bug 1 — guided mode wasn't full-width on narrow viewports.** At a narrow
REAL width with force-desktop on, `ResponsiveShell` still renders its desktop
branch (three-column workspace), so `.guided-aside`'s explicit
`width: var(--right-w, 360px)` capped the step card to ~300px in a 390px-wide
stacked row (measured 300/390 ≈ 77%, matching the user's "~75%" — confirmed
via `getBoundingClientRect()` before/after). Fix: `ResponsiveShell` now computes
`guidedNarrow = guidedActive && vp.device !== 'desktop'` — `vp.device` is the
REAL width classification, unaffected by the forced-desktop override, per
CLAUDE.md §13 (`src/ui/responsive/viewport.ts`) — and adds a `guided-full-width`
modifier class to the `.guided-aside` element when true; `global.css` adds
`.guided-aside.guided-full-width { width: auto; }` so it fills its row (grid
column on tablet, stretched flex row on phone) instead of capping. A second,
one-time effect auto-collapses the left sources panel exactly when guided mode
is newly entered on a narrow real screen (mirroring the existing mobile
auto-collapse, but keyed off `vp.device` instead of `vp.isMobile` so it also
fires under forced-desktop) — the user can still reopen it manually to switch
guides. Real desktop widths are untouched (`guidedNarrow` is false there;
verified three-column layout unchanged at 1400px).

**Bug 2 — Back button invisible on step ≥ 2.** Reproduced: at step 3 the Back
button (`GuidedStepCard.tsx`) IS present in the DOM and enabled
(`disabled: false`), ruling out a conditional-render bug. Inspecting computed
styles showed the base `.btn` (`color: rgb(245,247,250)` on
`background: rgba(255,255,255,0.12)`, tuned for the dark TopBar per the
existing `.edit-guide-btn` comment) has almost no contrast against the light
`.guided-aside` panel (`#f8fafc`/`#fff`) in EITHER state — a 3×-scale
screenshot crop confirms both step 1 (disabled) and step 3 (enabled) render
as a barely-there ghost outline, with the enabled version if anything less
distinguishable once composited. So the earlier hypothesis ("disabled visible,
enabled invisible") was directionally right (styling, not a render bug) but
the real defect is that the whole light-on-light treatment is broken, not
just one state. Fix: `GuidedStepCard.tsx`'s Back button gets a new
`guided-nav-back` class; `global.css` gives it the same light-card secondary
treatment already used for modal buttons (`.modal .btn`) — visible border +
background + dark text when enabled, and a distinctly muted (not just
lower-opacity) look when disabled at step 1. Next's `.btn.primary` (already
visible everywhere) is untouched. Before/after 3×-zoom screenshots of both
states confirm the fix (Back now reads clearly in both the disabled and
enabled states, at both 390px and 1400px width).

Tests added to `tests/guided-ui.test.tsx`: Back present/enabled/carries
`guided-nav-back` at step ≥ 2 (and present/disabled at step 1); `ResponsiveShell`
carries `guided-full-width` on the aside + auto-collapses the left panel at a
narrow real width with force-desktop on; the same assertions show the class is
ABSENT at a real desktop width (three-column look preserved). 2258 tests green
(+3); `npm run typecheck` clean. Layout/CSS + two class additions only — no
document or syntax-state changes. This closes out the ledger.
