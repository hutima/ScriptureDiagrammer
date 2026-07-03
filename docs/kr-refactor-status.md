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
## Compactness (band packing) — in progress

Priority order is absolute: (1) no clashes, (2) no disconnections,
(3) compactness. A tighter placement that cannot be PROVEN clash-free keeps
the current geometry.

- [x] **Stage A — clash guard strengthened** (own PR). The harness now has
  THREE clash guards (all frozen-offender snapshots, like connectivity):
  1. *word-text × word-text* (pre-existing; zero collisions corpus-wide);
  2. *line-through-word-text*: Liang–Barsky clip of every line against each
     upright word's glyph box shrunk 2px/side; fires only when >4px of line
     runs inside. Designed exemptions: (a) dashed `coordination` lines — the
     compound-sentence verb spine passes BEHIND verb-aligned words by design,
     halo-backed (kr/clause.ts, render/svg.ts); (b) a line TERMINATING on the
     word's own baseline (endpoint within the word's span, ±4px of baseline) —
     a junction, not a crossing (the spine lead stem ends at the first verb's
     baseline). A pass-through line still fires. 14 pre-existing offenders
     frozen across 13 passages — pedestal risers passing through words hanging
     below the platform's baseline mid-span, and three dashed adjunct stems
     crossing a below-verb modifier word (cosmetic, halo keeps words legible;
     a proper fix means moving riser connect points = geometry churn, deferred).
  3. *rotated (diagonal) texts*: each rotated text modelled as its rotated
     bounding quad (measured width; ascent 13/descent 3, small 10/3), shrunk
     3px/side, separating-axis test vs other rotated texts AND upright words.
     ONE pre-existing offender frozen (Eph 5:15–16: the ὡς connector label and
     ἀλλ coordinator both ride the spine bar at the same x, 3px apart — a real
     pre-existing overprint of two small rotated labels; candidate cheap fix
     is coordinator/label deconfliction in coordinatorMarks, deferred).
  - COMPACTNESS METRIC added to the structural snapshot (`compactness:
    w=<width/10> areaK=<area/1000>`) so every packing PR's win is measurable
    and accidental growth visible. Exact-number reporting:
    `npm run kr:compactness [-- save|diff <file.json>]`
    (scripts/kr-compactness-report.mts; corpus shared via tests/kr-corpus.ts).
    Baseline at Stage A: 210 documents, total area 127.46 Mpx².
  - CALIBRATED the same way the connectivity guard was (hack, confirm red,
    revert): shoving hanging blocks 80px left → 73 line-guard + 21
    rotated-guard + 4 overlap-guard failures; piling coordinated-PP slants
    10px apart → 9 rotated-guard (rotated×rotated) + overlap failures.
- [x] **Stage B0 — packer core** (`src/domain/layout/kr/packing.ts`), landed
  UNUSED (no call sites) with unit tests (tests/kr-packing.test.ts).
  `BandPacker`: `occupy(elements)` tracks conservative per-primitive rects
  (diagonal lines subdivided into ≤8 chunked boxes so a slant's bbox doesn't
  over-block the pocket beside it; texts as glyph boxes; rotated texts as
  rotated-quad bboxes). `reclaim(els, maxShift)` uses CONTINUOUS-SLIDE
  semantics: the caller draws the block at its CLASSIC position first, then
  slides it left until it first comes within PACK_PAD (10px) of anything
  occupied — it can pack flush against an obstacle but can never jump PAST
  one, so sibling order is preserved by construction. Safe-fallback contract:
  0 (byte-identical output) whenever a tighter placement isn't provably
  clash-free, including when the classic position is already within PACK_PAD
  of content (grandfathered adjacency stays as-is). The packer only ever
  moves content LEFT of today's position — it can never widen a diagram.
- [x] **Stage B1 — first call site**: kr/word.ts layoutHead modifier cascade.
  Pattern every later site copies: draw the modifier at its CLASSIC position,
  slice the just-drawn elements, `reclaim(slice, maxShift)`, translate the
  slice left by the provable shift, then `occupy` it. Branch bodies untouched;
  `railRight` adjusted exactly (`max(before, after − shift)` only when it
  grew). maxShift keeps feet ≥ dependentGap apart (first modifier never
  moves); when clause dependents exist the future dashed-stem column at
  wordW/2 is PRE-OCCUPIED so packed content can't land on a stem drawn later.
  `modRight` became a running max (packing breaks the final-cursor
  monotonicity). Results: −2.16% corpus area (127.46 → 124.71 Mpx²), 99/210
  docs changed, EVERY delta negative (the slide-only design cannot widen);
  structural snapshot diffs are bounds/compactness ONLY; two frozen
  line-guard offenders FIXED in passing (σκύλλεις, θεοῦ risers — the
  pedestalled clauses narrowed and the riser connect point moved off the
  hanging word). Before/after renders of the 5 biggest movers eyeballed.
  (Also fixed: the compactness report script now suffixes duplicate corpus
  names so diffs pair correctly.)
- [x] **Stage B2 — kr/clause.ts baseline slot vs verb-modifier band.** Each
  complement / pedestal is drawn at its classic position (past the verb
  cascade's and previous complements' FULL recursive width) and slid left;
  occupied excludes the horizontal y=0 main-line segments (the shared line a
  complement rides), so cascade feet, ticks, words and deep content bound the
  slide; a complement never starts before `xAfterVerb` (its no-cascade home).
  The pre-drawn cascade-extension line was replaced by each complement's own
  bridge to its PACKED separator (identical segment when nothing moves).
  NEW GLOBAL GUARANTEE (document.ts): packing must PAY FOR ITSELF — if any
  block shifted, the document is laid out again with packing off and the
  packed result is kept only when its bounding box is strictly smaller.
  Found the hard way: Mark 5:22–23's packed subject narrowed enough that the
  clause spine's verb-alignment OUTLIER rule (spineOutlierGap) stopped firing
  and verb alignment widened the compound by ~490px — width-sensitive policy
  flips are inherent to downstream coupling, so the fallback is wholesale.
  (Such a fallback disables B1 too for that document; net vs fully-classic is
  never worse.) Results: −4.1% further (124.71 → 119.55 Mpx², cumulative
  −6.20%), 80/210 docs changed, only real loss the Mark 5:22–23 fallback
  (+11px vs post-B1, still far better than the alignment flip); two more
  frozen line-guard offenders gone (κυρίῳ, Eph 5:17 κυρίου… now fixed by
  packed pedestals). Snapshot diffs bounds/compactness only.
- [x] **Stage B3 — kr/clause.ts clause-adjunct rail packing.** Same wrapper
  pattern: each rail entry drawn at its classic attach (past everything's
  full width) then slid left; never before the drawn complement row's end
  (`baselineWidth` + classic gap), feet keep the dependentGap rhythm; the
  rail extension line reaches every packed foot (railRight/maxRight adjusted
  exactly). −0.2 Mpx² (17/210 docs, all negative; biggest Rom 9:32 −97px).
  Snapshot diffs bounds/compactness only; no guard changes.
- [x] **Stage B4 — DECLINED with rationale.** Measured where the remaining
  width lives (top-10 widest docs): the extreme right is content DEEP inside
  stacked clause chains (Col 1:9–16 rightmost at y≈3100, Titus 2:11–14 at
  y≈2200). But stacked members sit at a FIXED indent off a shared spine (the
  connector must stay a short horizontal from the spine to the member's
  baseline) and compound-spine members are VERB-ALIGNED (the dashed bar runs
  verb-to-verb) — both are conventions this effort must not fight. Tucking a
  member left would lengthen/slant connectors or break verb alignment; there
  is no convention-safe horizontal reclaim inside the stack. The members'
  INTERNALS are already packed by B1–B3.
- [x] **Fork member spread (optional site 5) — DECLINED.** Visually the most
  sensitive site, and fork coordinator placement is under active user-driven
  rework (conjunction centering / open-side placement); packing the spread
  concurrently would double the churn in the same pixels for a small win.

## Compactness — final summary

Corpus (210 documents): **127.46 → 119.31 Mpx² (−6.39% total area)**;
summed width 164,729 → 154,510px (−6.2%) after B3.
- Stage B1 (word cascades): −2.16%, 99 docs, biggest −273 kpx².
- Stage B2 (baseline slot): −4.1% further, 80 docs, biggest −416 kpx².
- Stage B3 (adjunct rail): −0.2 Mpx², 17 docs.
- Every changed document shrank (the one pay-for-itself fallback, Mark
  5:22–23, is +11px vs post-B1 but never worse than fully-classic).
- Frozen guard exemptions after the program: line-guard 10 offenders (down
  from 14 — four risers moved off hanging words by packing), rotated-text 1
  (Eph 5:15–16 spine-bar label pair), connectivity 2 (unchanged, cosmetic).
- Remaining known pockets (all convention-inherent): the genitive/apposition
  staircase, pedestal ascents clearing baselines, stacked-clause spine
  indents, compound-spine verb alignment, fork geometry.

## Prior investigation (context for the packer)

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
