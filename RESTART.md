# RESTART — KR rendering clashes: Hebrews 2:8 / 2:10 / 4:12  (IN PROGRESS)

Branch: `claude/kr-rendering-clashes-7ic377`

## Task (from user)
Investigate clashes in the Kellogg-Reed rendering engine:
1. **Hebrews 2:8** — element clashes/overlaps in the rendered diagram.
2. **Hebrews 2:10** — missing baseline under ἀρχηγὸν ("archegon").
3. **Hebrews 4:12** — renders correctly but messy; evaluate whether the 5-way
   coordination can be shown more cleanly. If not, leave alone.

Fixes (if any) should land on this branch with tests; keep this file updated
so the work is resumable if the session dies.

## Current state (update on every milestone)
- [x] Branch checked out, clean tree at `ccfa8b3`.
- [ ] **Repro**: subagent building a repeatable render script
      (goal: `scratchpad/repro/render-heb.mts` + cached Hebrews lowfat XML +
      per-passage SVGs + programmatic overlap report). **If the script/XML are
      missing on resume, redo this** — see "How to reproduce" below.
- [ ] **Engine map**: subagent mapping `src/domain/layout/kr/` (packing /
      word baselines / coordination) with file:line anchors.
- [ ] Diagnosis per passage (record findings here as they land).
- [ ] Fix Heb 2:8 clash (+ regression test).
- [ ] Fix Heb 2:10 missing baseline (+ regression test).
- [ ] Heb 4:12 evaluation → improve or document "leave alone" verdict here.
- [ ] Full suite + typecheck green; push; final summary.

## How to reproduce (for a fresh session)
- Passages come from the default **Nestle1904 Lowfat** GNT source; see
  `scripts/dump-passage-syntax.mts` (`npm run dump-syntax`) for how a book
  loads into `KrDocument`s, `scripts/fetch-gnt.mjs` for the upstream XML URL,
  and `scripts/render-samples.mts` for the `layoutDocument` → `layoutToSvg`
  invocation. Run scripts with `vite-node` like the existing npm scripts.
- Note: sentences span verses — render the document(s) *containing* 2:8, 2:10,
  4:12 and note the true verse range.
- Relevant tests for conventions: `tests/kr-packing.test.ts`,
  `tests/layout.regressions.test.ts`, `tests/kr-characterization.test.ts`,
  `tests/sblgnt-coordination-regression.test.ts`.

## Findings so far
(none recorded yet — fill in as diagnosis lands)

## Notes
- No PR requested. Delete this file when the work is finished/merged.
