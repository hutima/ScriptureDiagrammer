# Kellogg-Reed layout engine refactor — status

Staged extraction of `src/domain/layout/engine.ts` (~2,900 lines) into
`src/domain/layout/kr/` modules. **Refactor, not rewrite**: behavior first,
then structure. Each stage lands as its own merged PR; the app builds and all
tests pass after every stage. This file is the pickup point if work pauses —
update the checklist as stages land.

## Ground rules (from the plan)

- Do NOT change: the persisted `KrDocument` schema, non-KR modes, the renderer
  contract (flat `DiagramElement` primitives in `layout/types.ts`), or diagram
  semantics/geometry (except explicitly-tested bug fixes).
- Keep `layoutDocument` / `mirrorLayout` / `LayoutOptions` exported from
  `engine.ts` (compatibility re-exports are fine) and
  `layoutForMode('kellogg-reed', …)` working unchanged.
- Keep `nodeId`/`relationId` stamping on primitives stable — selection, hover,
  detail cards and export depend on it. (Element `el_N` ids come from a
  call-order counter; don't write tests against them.)
- Prefer pure helpers; no geometry "tidying" while moving code.

## Amendments adopted during review

1. **Connectivity invariant in the harness** (not just snapshots): every line
   must reach a clause diagram or deliberate float through touching/crossing
   segments — catches "locally plausible but detached" bugs (the Gen 1:11
   rail stub class) anywhere in the corpus.
2. **Mutual recursion**: `layoutClause` ↔ `layoutHead` ↔ coordination/PP paths
   all recurse via `layoutNode`. When splitting modules, pass a `layoutNode`
   dispatcher through the context object rather than importing across sibling
   modules (avoids cycles).
3. **Closures over clause-local state**: `drawHanging` (and friends) close
   over `belowMaxBottom`/`elements` inside `layoutClause`. Extraction needs
   small explicit accumulator objects — introduce them in stages 4–7 without
   changing algorithms.
4. **Compactness work is post-refactor**: the right-hand rails/pedestals that
   push content far right (Rom 1:1–7 report) are a follow-up "band packing"
   stage after extraction, guarded by the Stage 0 harness.

## Stage checklist

- [x] **Stage 0 — safety baseline.** `tests/kr-characterization.test.ts`:
  210 structural snapshots (line counts by role/style, text labels in order,
  node/relation id sets, coarse bounds) + 210 connectivity tests over the
  whole fixture corpus (Nestle Col 1:9–16, Mark 1/5, Phil 1; SBLGNT 2 Cor 5,
  Col 1, Eph 5, Mark 1/5, whole Philemon, Rom 9–11, Titus 2; WLC Gen 1,
  Psa 1, Deu 6; all bundled sample docs). Pre-existing detached components
  are FROZEN as snapshots (40 signatures) — the refactor must not add any.
  No 1 Tim 2:11–12 fixture exists; coordinated-infinitive coverage comes from
  the existing `constructions`/`sblgnt-coordination` tests.
- [x] **Stages 1–3 — pure moves** (one PR): `kr/types.ts` (Block, Ctx),
  `kr/primitives.ts` (line/smallText/wordText/translate/bounds/mirrorX/eid),
  `kr/geometry.ts` (slant helpers, blockAscent, pedestalRoom, …),
  `kr/coordinators.ts` (coordinatorTexts/Span/Marks, reserveJoinSpans),
  `kr/classify.ts` (BASELINE_COMPLEMENTS, isClauseChild, isInfinitival,
  isDiagonal*, prepObject*, isWordCoordination, showLabel, …).
  `engine.ts` imports from kr/ and keeps its public API. Landed: engine.ts
  2,884 → 2,285 lines; kr/ modules 697 lines; characterization snapshots
  byte-identical. `eid` moved with an exported `resetEid()` (layoutDocument
  resets the counter per layout).
- [x] **Stage 4 — PP + diagonal drawing**: `kr/prepositions.ts` (drawPp,
  drawPpCoordination), `kr/diagonal.ts` (drawDiagonalModifier,
  drawDiagonalCoordination); `kr/infinitives.ts` seeded early with
  drawInfinitive + infinitiveMark (layoutHead needs them). The draw functions
  were already parameterized (attachX/topY/out), so no accumulator object was
  needed yet — the clause-local `drawHanging` closure is a Stage 7 concern.
- [x] **Stage 5 — word/head layout**: `kr/word.ts` (layoutHead, appositions,
  modifier cascade, stacked clause dependents). Recursion runs through the
  new Ctx dispatchers (`ctx.layoutNode`, `ctx.stackClauses`) wired in
  layoutDocument — extracted modules never import the engine. Landed:
  engine.ts 2,285 → 1,732 lines; snapshots byte-identical.
- [x] **Stage 6 — coordination**: `kr/coordination.ts` (word fork,
  compound/open predicate forks, layoutPredicateArm) + `kr/infinitives.ts`
  gains collectInfinitiveFork/layoutInfinitiveFork.
  `isHeadlessCoordinateClause` went to `kr/classify.ts` (pure predicate) —
  that breaks what would otherwise be a coordination↔infinitives cycle.
  Landed: engine.ts 1,732 → 1,115 lines; snapshots byte-identical
  (Mark 1:19–20 included in the corpus).
- [x] **Stage 7 — clause layout** (riskiest, landed alone): `kr/clause.ts`
  (layoutClause, stackClauses, layoutClauseSpine, subjectFillerLabel —
  complements/pedestals, verb modifiers, introductory/floating words,
  open-fork adjunct reroute per the Gen 1:11 test). `kr/discourse.ts`
  pulled forward (layoutClause calls layoutDiscourse — avoiding a cycle).
  Landed: engine.ts 1,115 → ~185 lines; snapshots byte-identical.
- [ ] **Stage 8 — discourse + orchestration**: `kr/discourse.ts`,
  `kr/document.ts`; `engine.ts` becomes a thin bridge.
- [ ] **Stage 9 — docs**: `src/domain/layout/kr/README.md` (data flow, which
  module owns which concern, how to add a convention, stress cases).
- [ ] **Stage 10 (optional) — cleanup**: dead helpers, cycle reduction,
  per-layout id allocator (only if selection behavior provably unaffected).

## Post-refactor follow-ups (not part of extraction)

- Triage the 40 frozen connectivity offenders in
  `tests/__snapshots__/kr-characterization.test.ts.snap` — clause-spine
  coordinator stubs (e.g. Gen 1:11 וַ, likely fine) vs. candidate real
  disconnects (several SBLGNT Rom 9–11 / Eph 5 / Mark 5 passages).
- Compactness ("band packing"): hang appositions/adjuncts in the first
  horizontally-free band instead of always past `maxRight` (Rom 1:1–7).

## Validation per stage

`npm test` · `npm run typecheck` · `npm run build` (must all pass before PR).
