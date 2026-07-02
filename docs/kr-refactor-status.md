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
- [x] **Stage 8 — orchestration**: `kr/document.ts` (layoutDocument,
  layoutNode dispatch, LayoutOptions, mirrorLayout); `engine.ts` is now an
  8-line re-export bridge preserving the public import path. (`kr/discourse.ts`
  already landed with stage 7.)
- [x] **Stage 9 — docs**: `src/domain/layout/kr/README.md` (data flow, the
  four concerns, module map, recursion-through-Ctx rule, how to add a
  convention, stability contracts, stress cases).
- [x] **Stage 10 — cleanup**: 8 extraction-artifact exports made module-
  private again (DIAGONAL_POS, layoutClauseSpine, subjectFillerLabel,
  layoutOpenPredicateFork, COORD_PAD, coordinatorSpan, collectInfinitiveFork,
  FORK_MEMBER_MAX); `tests/kr-units.test.ts` pins the pure helpers
  (classify predicates, slantRun/blockAscent/pedestalRoom, join spans +
  coordinator marks, translate/bounds/mirrorX/eid). The per-layout id
  allocator was consciously SKIPPED — resetEid() already gives
  deterministic ids and swapping the mechanism risks selection behavior
  for no user-visible gain.

## Post-refactor follow-ups (not part of extraction)

- [DONE] Connectivity-offender triage: 40 frozen signatures → 2.
  Benign classes (exempted in the harness with rationale): clause-spine
  coordinator words (γάρ/ὅτι/וַ ride beside the dashed spine) and
  first-member connector label stubs (Ἐὰν …). Real bug FIXED in
  `kr/clause.ts`: the main line is now BRIDGED across a complement whose
  hanging content widened the cursor past its drawn baseline (deep
  genitive cascades, pedestals) — previously the adjunct rail, apposition
  stems, and later complements floated (Col 1:13, Rom 9:25, Mark 5:41,
  Philemon 1:10-13 …). Open forks still reroute under the verb (Gen 1:11
  policy). Remaining 2 frozen: the hand-authored phil sample's spine
  micro-gap and Rom 11:33's divider-less exclamation line (both cosmetic
  test false-negatives, not user-visible defects).
- Compactness ("band packing") — INVESTIGATED, groundwork landed, packer
  deferred. Diagnosis of the reported Rom 1:1–7 corner: the ἀγαπητοῖς
  phrase is (a) connected as of the hollow-baseline bridge fix, (b) its
  vertical drop is REQUIRED (the ἁγίοις pedestal must clear the head's
  baseline: oTop ≥ block ascent), and (c) its horizontal slot is the
  natural cascade position — the residual width is the Reed-Kellogg
  genitive/apposition staircase, which is convention-inherent. A generic
  packer (attach each hanging block at the first x whose occupied band is
  free, instead of always past the previous sibling's full subtree width)
  is the real win, but it must be validated against an OVERLAP invariant —
  now in place: the harness asserts no two horizontal word texts overprint
  (currently ZERO collisions corpus-wide, frozen as snapshots). A future
  packer change is safe to attempt: connectivity + overlap + structural
  snapshots together make its effects fully reviewable.

## Validation per stage

`npm test` · `npm run typecheck` · `npm run build` (must all pass before PR).
