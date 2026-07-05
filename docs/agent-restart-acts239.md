# Agent restart notes — Acts 2:39 ASV + highlights

**Branch:** `claude/acts-239-asv-highlights-fwm1fx` (base: `main` @ `02a93f4`, PR #242 merge)
**Task:** (1) default the Acts 2:39 discourse guide to ASV (fallback BSB) · (2) additive `seededHighlights` unit coloring in `GuidedDiscourseSpec`.

## Status

- [x] Change 1 — ASV default + BSB fallback + `guidedNotice` + tests (committed; typecheck/test/guided:check green)
- [x] Change 2 — seededHighlights in all three discourse guides + SVG-export unit color bars (committed)
- [x] Step-nav fix — Next closes "Where readers differ" + scrolls card to top (committed)
- [ ] Agent A — stacked-comparison symmetry: touch pan on stacked panel (`.vc-frame-scroll` has `touch-action:none`), label BOTH panels, word-tap details on stacked panel
- [ ] Agent B — Acts 2:39 rework: expand to 2:38–39, seeded phrase SPLITS (splitDiscourseUnit(doc, unitId, atTokenId, now); word-matching with ASV+BSB candidates), sub-ref addressing 'ref/N', FOUR parallelisms (you/children/far-off/baptized↔circumcised) with arcs+colors+per-parallelism steps, guided:check suffix handling, tests
- [ ] Final — build + lint, delete this file, push, open PR

## Verified facts (do not re-derive)

- Both `english-asv` and `english-bsb-all` use 66-book canonical numbering: **Acts = 44, Genesis = 1** (same numbers for primary and fallback). ASV loader: `src/io/english-bible-remote.ts` (`ASV_URL`, whole-Bible scrollmapper JSON, `books[num-1]`); bsb-all dispatch: `src/io/english-bible.ts:265`.
- Guided discourse hosting: `enterGuidedDiscourse(spec)` in `src/state/discourse.ts:811` (loads ranges via `loadDiscourseRange`, merges via `mergeDiscourseDocuments`, seeds arcs by `refStart` map). Guided store call site: `src/state/guided.ts:185`.
- Unit color: `unit.color` (`DiscourseUnitColorSchema`, `schema/discourse.ts:88`) is the single authority — canvas `DiscourseUnitBlock.tsx:434` (`color-<name>` class), exports `domain/discourse/export.ts:189` (`UNIT_COLOR_HEX`). Pure mutation: `setDiscourseUnitsColor` (`mutations.ts:182`).
- Fallback notice surface: `src/ui/guided/GuidedStepCard.tsx` (devotionalFrame renders at stepIndex 0, ~line 149); notice carried as new discourse-store field.
- Test mocking: `tests/guided-discourse.test.ts` stubs global fetch reading bundled JSON. Bundled BSB paths: NT `public/parallel/bsb/05-acts.json`, OT `public/parallel/bsb/ot/01-genesis.json`.
- `scripts/check-guided-highlights.mts` discourse branch: lines 47–61 (range spec presence only).

## Checks per commit

`npm run typecheck && npm test && npm run guided:check`; before PR also `npm run build && npm run lint`.

## Next command

Implement Change 1 (see task list); then commit `git commit` on this branch and update this file.
