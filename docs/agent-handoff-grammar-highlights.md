# Agent Handoff — Grammar Highlights / KR Fix / Edit Preview

> Living handoff document. A new agent must be able to resume from ONLY this
> file + `CLAUDE.md` + `README.md` + `git status` + recent `git log`.

## Current branch

`claude/grammar-highlights-hs6u2n`

**Branch decision (important):** the task description suggested a sequence of
small branches (`fix/kr-hebrews-1-slash-fork`, `feat/guided-grammar-infrastructure`,
…), but the session-level environment mandates that ALL development happen on
the single designated branch `claude/grammar-highlights-hs6u2n` (pushes to any
other branch are not permitted). So each "phase branch" is instead a clearly
delimited **sequence of commits on this one branch**, using the suggested commit
message prefixes (`fix(kr): …`, `feat(guided): …`, `feat(editor): …`).

## Current phase

Phase 3 — Guided content proposal (Phases 1 + 2 COMPLETE).

## Goal

1. ✅ Fix KR predicate-noun slash connection in Hebrews 1:1–4.
2. Add a data-driven "Grammar highlights" guided mode (syntax-only, KR-first).
3. Phrase/Block edit-mode dynamic drag preview.
4. KR-based read-only "Preview" tab in the Edit right panel (base vs current diff).

## Non-negotiable constraints (from Tim)

- KR is read-only / formal presentation; Phrase/Block is the editor.
- Semantic edits flow through the shared syntax graph only.
- Layout fixes go in `src/domain/layout/kr/`, never the SVG renderer.
- Preserve `nodeId`/`relationId` stamping on primitives.
- Guided mode is data-driven; only selected passages bundled (never whole SBLGNT).
- No changes to Discourse mode.
- Content tone: Bible-study/devotional; never overstate Greek aspect
  (no "aorist = once-for-all"); contested passages presented fairly.
- Full guided content list needs Tim's approval before authoring everything;
  a minimal sample guide entry is allowed for implementation/testing.

## Completed

### Phase 0
- Handoff document created (commit `docs: add grammar highlights agent handoff`).

### Phase 1 — Hebrews 1:1–4 KR slash/fork regression ✅
**Bug:** the predicate-nominative back-slant separator's FOOT is drawn at
`sepX + 10` on the baseline, but the complement block was always placed at
`sepX + 6`. A normal word complement carries its own baseline under the foot,
but an open coordination fork (`layoutCoordination`, `openLeft=false`) has NO
line at y = 0 beyond its junction (block-local x = 0, `wordLeft === wordRight
=== 0`) — so for Heb 1:3 (`ὢν \ ἀπαύγασμα … καὶ χαρακτὴρ …`) the slash foot
hung 4px past the fork vertex in empty space, connected to nothing.

**Fix (layout only, no renderer/data changes):** in the complement loops of
`src/domain/layout/kr/clause.ts` (`layoutClause`) and
`src/domain/layout/kr/coordination.ts` (`layoutPredicateArm`), when the
separator is the back-slant (`predicateNominative`/`predicateAdjective`) AND
the dependent is a word coordination, advance the cursor by **10** instead of
6 so the fork's junction lands exactly ON the slash foot. The existing bridge
line (`sepX → x` at y = 0) now runs out under the slash to the foot. All other
complements keep the classic `+ 6` (byte-identical geometry).

**Verified geometry (before → after)**, SBLGNT `sblgnt_hebrews_0`, relation
`r_s0_48`: slash foot (1916.31, 541.57); fork prongs previously started at
(1912.31, 541.57) (4px gap, 0 lines touching the foot); now both prongs AND
the bridge baseline touch the foot exactly (3 lines touching at < 1px).

**Regression coverage:**
- New corpus fixture `tests/fixtures-sblgnt-lowfat-heb-1-1-4.xml` (first
  sentence of SBLGNT Hebrews 1 = 1:1–4), registered in `tests/kr-corpus.ts` →
  covered by the characterization harness (structure snapshots, connectivity
  invariant, clash guards) from now on.
- New targeted test `tests/heb-1-3-predicate-fork.test.ts`: pure-geometry
  assertions (no generated element ids) that every fork-bound
  predicateNominative/-Adjective separator has ≥ 2 fork prongs and a baseline
  segment touching its foot.

**Snapshot diffs (intentional, explained):** only 2 snapshots changed —
`sblgnt Romans 11:9–10` and `sblgnt Romans 11:36`, both containing the same
slash-before-fork structure; only `bounds`/`compactness` moved (~4–10px wider),
line counts / texts / node-relation id sets identical. Updated with `-u`.
5 new snapshots were written for the new Hebrews fixture.

### Phase 2 — Grammar Highlights guided-mode infrastructure ✅

All acceptance criteria met (see "Phase 2 detail" below):
- ⋯ menu → `Grammar highlights…` opens the intro modal (Greek vs English mode).
- Entering: snapshots prior `{appMode, diagramMode, glossMode,
  sourceTextVersion}`, locks app mode to Explore (ModeSwitcher `locked` prop),
  sets the guide's default visualization (KR), auto-opens the first guide, and
  exits the first-run tutorial if it was running (they'd talk over each other).
- English mode = `glossMode: true` + `sourceTextVersion: 'en'`; the parse and
  diagram structure stay the Greek syntax (verified by test).
- Top bar shows `Leave guided mode`; leaving restores the snapshot; the normal
  pickers/right panel return (visually QA'd).
- Left panel swaps ALL source pickers for the curated `GuidedPassagePicker`
  (label: "Grammar Highlights — curated guided passages (SBLGNT text)", never
  presented as unrestricted SBLGNT).
- Discourse is filtered from the VisualizationSwitcher while guided is active,
  and ResponsiveShell forces KR if discourse was somehow active.
- Step card (right-panel slot on desktop, fixed bottom card on mobile):
  title/body with `[[termId]]` → tappable Greek term links, term chips, term
  detail panel (form/translit/lemma/gloss/parsing/explanation/implication/
  caution), implication + caution callouts, highlight LEGEND (text + swatch —
  never color alone), Back/Next, optional debateSummary disclosure.
- Pan/zoom focus: `focusNonce` bumps once per step/guide change; DiagramCanvas
  fits the focus targets' layout-space bbox (via `nodeId`/`relationId` stamps;
  tokens resolve to their carrying nodes) with padding + zoom caps, honoring
  `panZoom.fit: 'whole-diagram'`; the user pans/zooms freely afterwards (the
  nonce guard means we NEVER re-center between steps).
- Highlights: guided step highlights merge into the existing swash pipeline
  (`hlByNode`/`hlByRelation`) — emphasized violet `#c4b5fd`, added blue
  `#93c5fd`, changed yellow `#fde047`, removed red `#fca5a5`
  (`GUIDED_HIGHLIGHT_COLORS` in `src/ui/guided/focus.ts`).
- Data pipeline: `src/data/guidedPassages.ts` (approved ranges only) →
  `npm run guided:build` (`scripts/build-guided-highlights.mts`, normal Lowfat
  conversion so ids are identical to live loads) →
  `src/fixtures/guided/grammar-highlights-sblgnt.json` (68K, Heb 1:1–4 only)
  validated at module load; `npm run guided:check`
  (`scripts/check-guided-highlights.mts`) validates every guide id (incl.
  term surface ↔ token surface match) and fails non-zero.
- Sample guide `guide-hebrews-1-1-4` (4 steps, 7 terms) in
  `src/data/grammarHighlights.ts` — marked as the v1 SAMPLE; full list awaits
  Tim's approval.

## Remaining

- Phase 3: guided content proposal for Tim (candidate list is in the task
  brief: Mark 5:25–34, Heb 1:1–4, 1 Pet 3:18–22, Matt 28:19–20, Matt 6:11 vs
  Luke 11:3, 1 John 2:1 vs 3:6–9 + optional contested list). Record the
  proposal (with grammar hook / payoff / caution / difficulty / v1-or-later
  per candidate) in this file + stop for approval before authoring.
- Phase 4: Phrase/Block dynamic drag preview (`previewMoveNodeUnder` pure
  helper, ghost subtree, live reparent preview, cycle/conflict red feedback;
  commit via existing `dispatchEditIntent` moveNodeUnder only on drop).
- Phase 5: Edit-mode right-panel "Preview" tab (default tab in Edit mode, KR
  default, baseDoc vs doc diff, blue added / yellow changed / red removed,
  friendly empty state when no baseDoc).
- Final validation + report.

## Important architectural decisions

- (Phase 0) Single designated branch, phase-delimited commits — see above.
- (Phase 1) Fix lives in the KR layout complement loops (convention-selection
  layer), NOT the renderer and NOT source data. The fork keeps exposing its
  junction as `wordLeft === wordRight`; the clause/arm decides where the
  junction sits relative to the separator.
- (Phase 2) Guided mode is an ORTHOGONAL overlay (a second zustand store,
  `src/state/guided.ts`, mirroring the discourse-store pattern), NOT a new
  `DiagramMode` — so none of the `diagramMode === 'discourse'` branches were
  perturbed and Discourse is untouched. Guides load their passage through the
  NORMAL `loadDocument` path (same ids as a live SBLGNT load, so stored user
  patches still apply and every lens works). Guided focus resolves stable ids
  to geometry via the `nodeId`/`relationId` stamps on layout primitives —
  never DOM queries, never element ids. Only approved passages are bundled
  (built by script, validated at load + by `guided:check`).
- (Phase 2) Guided highlights ride the EXISTING sermon-highlight swash
  mechanism (merged maps), so they render identically on canvas without new
  renderer code; the renderer stays syntax-blind.

## Files changed and why

Phase 1:
- `src/domain/layout/kr/clause.ts` — complement loop: fork after back-slant
  advances +10 (to the slash foot) instead of +6.
- `src/domain/layout/kr/coordination.ts` — same rule in `layoutPredicateArm`;
  added `isWordCoordination` import.
- `tests/fixtures-sblgnt-lowfat-heb-1-1-4.xml` — new corpus fixture (SBLGNT
  Hebrews 1 first sentence, verses 1:1–4).
- `tests/kr-corpus.ts` — registered the new fixture.
- `tests/heb-1-3-predicate-fork.test.ts` — targeted slash→fork geometry test.
- `tests/__snapshots__/kr-characterization.test.ts.snap` — 2 intentional
  compactness/bounds updates (Rom 11:9–10, 11:36) + 5 new Hebrews snapshots.

Phase 2:
- `src/domain/schema/guided.ts` (+ export in `schema/index.ts`) — Zod schemas:
  `GrammarHighlightGuideSchema`, steps, focus, panZoom, highlights, Greek
  terms, debate summaries, registry.
- `src/data/guidedPassages.ts` — the approved passage ranges (build input).
- `src/data/grammarHighlights.ts` — the registry + the Hebrews sample guide.
- `src/fixtures/guided/grammar-highlights-sblgnt.json` — built guided bundle.
- `src/fixtures/guided/index.ts` — bundle loader (validates at module load,
  clones on hand-out).
- `scripts/build-guided-highlights.mts`, `scripts/check-guided-highlights.mts`
  + `guided:build`/`guided:check` npm scripts in `package.json`.
- `src/state/guided.ts` (+ export in `state/index.ts`) — the guided store.
- `src/ui/guided/` — `focus.ts` (pure focus/highlight helpers),
  `GrammarHighlightsIntroModal.tsx`, `GuidedPassagePicker.tsx`,
  `GuidedStepCard.tsx`, `GuidedGreekTermPanel.tsx`.
- `src/ui/components/TopBar.tsx` — menu item, Leave button, intro modal mount,
  ModeSwitcher lock.
- `src/ui/shell/ModeSwitcher.tsx` — `locked` prop.
- `src/ui/shell/VisualizationSwitcher.tsx` — Discourse filtered while guided.
- `src/ui/shell/ResponsiveShell.tsx` — step card in the right slot (desktop) /
  bottom card (mobile); KR fallback if discourse active; discourse Edit
  default suppressed during guided.
- `src/ui/panels/LeftPanel.tsx` — guided library swap.
- `src/ui/components/DiagramCanvas.tsx` — guided highlight merge + one-shot
  step focus pan/zoom effect.
- `src/ui/styles/global.css` — `.guided-*` styles + `.tabs-static-label`.
- `tests/guided.test.ts`, `tests/guided-ui.test.tsx` — 16 tests (registry
  integrity, focus helpers over a real layout, store state machine, UI smoke).

## Test commands run and results

- `npm run typecheck` — clean.
- `npm test` — 115 files / 2203 tests, ALL PASS (after Phase 2).
- `npm run build` — succeeds (precache 1130 KiB; +64K = the guided bundle).
- `npm run guided:check` — 1 guide validates.
- Stress cases (Mark 5:26, Mark 1:19–20, Col 1:9–20, Gen 1:11, Hebrew RTL)
  are all inside the characterization corpus → all pass.

## Known failing tests / regressions

- None.

## Ids discovered via `npm run dump-syntax -- 'sblgnt:Hebrews 1:1'`

- Passage: `sblgnt_hebrews_0` "Hebrews 1:1–4", root `cl_s0_0`.
- The contested structure: clause `cl_s0_38` (subject `w_n58001003001` ὃς,
  predicate `w_n58001003002` ὢν); relation `r_s0_48` predicateNominative
  `w_n58001003002 → w_n58001003003` (ἀπαύγασμα); `r_s0_47` conjunct
  `w_n58001003003 → w_n58001003007` (χαρακτήρ); `r_s0_46` coordinator καί
  (`w_n58001003006`); genitives `r_s0_42` (τῆς δόξης), `r_s0_45`
  (τῆς ὑποστάσεως), `r_s0_43` (αὐτοῦ).
- Other useful ids: main verb `w_n58001002006` (ἐλάλησεν), subject
  `w_n58001001006` (ὁ θεὸς), participle clause `cl_s0_3` (λαλήσας …),
  ἐν υἱῷ PP `w_n58001002008`/`cl_s0_23`, φέρων clause `cl_s0_50`,
  ἐκάθισεν conjunct `w_n58001003025`, ποιησάμενος clause `cl_s0_65`,
  κρείττων clause `cl_s0_82` (`r_s0_85` predicateAdjective).

## Visual QA notes

- Phase 1: rendered SVGs (scratchpad, not committed): after the fix the
  back-slant, the bridge baseline, and the two fork prongs all meet at one
  point (1916.31, 541.57); ἀπαύγασμα arm above, χαρακτὴρ arm below, καί on the
  dashed bar. No new text collisions (clash guards stayed green).
- Phase 2 (headless-Chromium walkthrough of the real dev app, desktop 1500×950):
  ⋯ menu shows "Grammar highlights…"; intro modal renders both mode choices;
  Greek mode → left panel becomes the curated library ("Source: Grammar
  Highlights — curated guided passages (SBLGNT text)"), top bar shows "Leave
  guided mode", right panel shows the step card (devotional frame, term links,
  legend "in focus"); step 1 highlights ἐλάλησεν + ὁ θεός with violet swashes;
  step 3 pans/zooms cleanly onto the ὢν → ἀπαύγασμα/χαρακτήρ fork (Phase 1 fix
  visibly correct on screen); tapping ἀπαύγασμα opens the term panel with
  translit/lemma/gloss/parsing/explanation; Leave restores the normal pickers,
  right panel, and prior visualization. Found + fixed during QA: the first-run
  tutorial overlay could sit on top of guided mode → `enter()` now exits an
  active tour.

## Next recommended action

1. Phase 3: write the guided-example PROPOSAL into this document (candidates +
   grammar hook / payoff / caution / difficulty / v1-or-later), commit, and
   STOP for Tim's approval — do not author the full registry first.
2. Then Phase 4 (Phrase/Block dynamic drag preview): inspect
   `src/ui/editor/block/PhraseBlockEditor.tsx`, `src/ui/editor/hierarchy.ts`,
   `src/ui/editor/dispatch.ts`; add a pure `previewMoveNodeUnder` helper.
3. Then Phase 5 (Edit right-panel Preview tab): inspect
   `src/ui/panels/RightPanel.tsx`, `src/ui/editor/EditCompareView.tsx`,
   `src/domain/patch/` diff utilities.

## Decisions still needing Tim's approval

- Final guided-example list + all theological copy (Phase 3 proposal).
