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

Phase 2 — Grammar highlights guided-mode infrastructure (Phase 1 COMPLETE).

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

## In progress

- Phase 2 not yet started (next).

## Remaining

- Phase 2: guided-mode infrastructure (three-dot menu entry, intro modal with
  Greek/English choice, guided store state with prior-state save/restore,
  curated `GuidedPassagePicker` replacing sources, step card w/ pan-zoom focus,
  Greek term detail panel, bundled guided fixture + `guided:check` script,
  `Leave guided mode` top-bar button, Discourse hidden while active).
- Phase 3: guided content proposal for Tim (candidate list is in the task
  brief: Mark 5:25–34, Heb 1:1–4, 1 Pet 3:18–22, Matt 28:19–20, Matt 6:11 vs
  Luke 11:3, 1 John 2:1 vs 3:6–9 + optional contested list) + one sample guide.
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

## Files changed and why

- `docs/agent-handoff-grammar-highlights.md` — this handoff document.
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

## Test commands run and results

- `npm run typecheck` — clean.
- `npm test` — 113 files / 2187 tests, ALL PASS.
- `npm run build` — succeeds (PWA precache built).
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

- Rendered SVGs (scratchpad, not committed): `heb1-before.svg` /
  `heb1-after.svg`. After the fix the back-slant, the bridge baseline, and the
  two fork prongs all meet at one point (1916.31, 541.57); ἀπαύγασμα arm above,
  χαρακτὴρ arm below, καί on the dashed bar. No new text collisions (clash
  guards in the characterization harness stayed green).

## Next recommended action

1. Commit Phase 1 (done if this file is committed alongside).
2. Phase 2: read `src/ui/shell/` (top bar / three-dot menu), `src/state/`
   (store, `AppMode`, `DiagramMode`), `src/ui/panels/` (left panel / sources),
   and the tutorial (`src/ui/tutorial/`) for prior art on guided overlays.
3. Design `src/domain/schema/guided.ts` + `src/data/grammarHighlights.ts` +
   `src/state/guided.ts` (or a slice in the main store), then the UI under
   `src/ui/guided/`.
4. Build `scripts/build-guided-highlights.mts` to extract ONLY approved
   passages into `src/fixtures/guided/grammar-highlights-sblgnt.json` and
   `scripts/check-guided-highlights.mts` (`guided:check`) to validate ids.

## Decisions still needing Tim's approval

- Final guided-example list + all theological copy (Phase 3 proposal).
