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

Phase 1 — Hebrews 1:1–4 KR slash/fork regression.

## Goal

1. Fix KR predicate-noun slash connection in Hebrews 1:1–4 (slash bottom must
   meet the fork vertex of the coordinated predicate complement
   `ὢν ἀπαύγασμα τῆς δόξης καὶ χαρακτὴρ τῆς ὑποστάσεως αὐτοῦ`).
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

- Created handoff document.

## In progress

- Phase 1: inspecting KR layout modules, reproducing the Hebrews 1:1–4 bug.

## Remaining

- Phase 1: fix + regression test + closeout (typecheck/test/build).
- Phase 2: guided-mode infrastructure (modal, store state, curated picker,
  pan/zoom focus, Greek term panel, bundled guided fixture + check script).
- Phase 3: guided content proposal for Tim (candidate list already specified in
  the task brief) + one sample guide.
- Phase 4: Phrase/Block dynamic drag preview (`previewMoveNodeUnder`, ghost,
  conflict detection; commit only on drop).
- Phase 5: Edit-mode right-panel "Preview" tab (base vs current, KR default,
  blue/yellow/red diff).
- Final validation + report.

## Important architectural decisions

- (Phase 0) Single designated branch, phase-delimited commits — see above.

## Files changed and why

- `docs/agent-handoff-grammar-highlights.md` — this handoff document (new).

## Test commands run and results

- None yet.

## Known failing tests / regressions

- None known yet.

## Ids discovered via `npm run dump-syntax`

- None yet. (Phase 1 will record Hebrews 1:1–4 SBLGNT ids here.)

## Visual QA notes

- None yet.

## Next recommended action

1. Read `src/domain/layout/kr/README.md` (done — module map understood).
2. Run `npm install` if `node_modules` missing, then
   `npm run dump-syntax -- "Hebrews 1:1-4"` (may need the SBLGNT source flag —
   check `scripts/dump-passage-syntax.mts` usage).
3. Reproduce the slash/fork disconnect in layout output (write a scratch
   render or extend `tests/kr-characterization.test.ts` corpus).
4. Fix in `src/domain/layout/kr/clause.ts` / `coordination.ts`.

## Decisions still needing Tim's approval

- Final guided-example list + all theological copy (Phase 3 proposal).
