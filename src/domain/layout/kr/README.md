# Kellogg-Reed layout engine (`src/domain/layout/kr/`)

Maps the syntax model to pure geometry. The engine walks the syntax graph
top-down from the root clause and **never consults surface token order for
structure** (only for rendering a node's own text). The output is a flat list
of `DiagramElement` primitives (`../types.ts`) that the SVG renderer draws
verbatim — the renderer cannot see tokens, roles, or word order.

## Data flow

```
KrDocument ──▶ layoutDocument (document.ts)
                 │  builds Ctx (incl. recursion dispatchers), resets eid
                 ▼
               layoutNode (document.ts)          ── dispatch by node kind ──
                 ├─ clause            → layoutClause      (clause.ts)
                 ├─ word coordination → layoutCoordination (coordination.ts)
                 └─ word              → layoutHead         (word.ts)
                 ▼
               Block { width, height, elements, wordLeft/Right, verbX }
                 ▼
               tentative flagging → bounds normalization → RTL mirroring
                 ▼
               DiagramLayout { width, height, elements: DiagramElement[] }
```

Everything below `layoutNode` composes recursively: a clause's complement can
be a coordination whose member is a word carrying a relative clause, etc.
Blocks are LOCAL coordinate systems (baseline at y = 0, x ∈ [0, width]);
parents place children with `translate`.

## Four distinct concerns — keep them apart

1. **Syntax classification** (`classify.ts`) — pure predicates over the
   syntax graph: is this node a clause child / infinitival / diagonal leaf /
   word coordination? Which roles sit on the baseline (`BASELINE_COMPLEMENTS`)?
   No geometry here.
2. **KR convention selection** — the drawing functions' branch structure
   (`clause.ts`, `word.ts`, `coordination.ts`, …): a direct object gets an
   upright tick, a predicate nominative a back-slant, an adverbial PP hangs
   beneath the verb, a subordinate clause stacks on a dotted stem.
3. **Geometry placement** (`geometry.ts`, `primitives.ts`) — slant runs,
   text measurement, block extents, element constructors. No syntax here.
4. **Rendering** (`../../render/`) — consumes `DiagramElement[]` only. Never
   teach it syntax.

## Module map

| Module | Owns |
|---|---|
| `types.ts` | `Block`, `Ctx` (including the recursion dispatchers) |
| `document.ts` | `layoutDocument`, `layoutNode` dispatch, `LayoutOptions`, tentative flagging, bounds normalization, RTL mirroring, `mirrorLayout` |
| `clause.ts` | `layoutClause` (subject \| predicate baseline, complements inline + pedestalled, verb modifiers, clause adjuncts, introductory/floating words), `stackClauses`, `layoutClauseSpine`, `subjectFillerLabel` |
| `word.ts` | `layoutHead` — head word baseline + modifier cascade, inline "=" and pedestalled appositions, clause dependents on the dotted stem |
| `coordination.ts` | word-coordination fork, compound predicate (shared-object and per-verb), open predicate fork, `layoutPredicateArm` |
| `coordinators.ts` | conjunction words riding a coordination bar: correlative (one per member) vs per-join placement, join spacing |
| `prepositions.ts` | `drawPp` (prep on the slant, object baseline below, shared-preposition objects), `drawPpCoordination` |
| `diagonal.ts` | diagonal leaf modifiers, sub-modifier chains, parallel-slant coordination of modifiers |
| `infinitives.ts` | `drawInfinitive`, the double-stroke infinitive mark, the coordinated-infinitive fork |
| `discourse.ts` | several loaded passages stacked down one canvas |
| `geometry.ts` | slant angle/run, diagonal text + depth, `blockAscent`, `pedestalRoom`, `rightWithinBand` |
| `primitives.ts` | `line`/`wordText`/`smallText`/`translate`/`bounds`/`mirrorX`/`emptyBlock`/`impliedBlock`, `eid` + `resetEid` |
| `classify.ts` | the syntax predicates + `BASELINE_COMPLEMENTS` |

## Recursion without import cycles

`layoutClause` ↔ `layoutHead` ↔ coordination/PP paths are mutually recursive.
The graph entrypoints are injected into `Ctx` (`ctx.layoutNode`,
`ctx.stackClauses`) by `layoutDocument`, so leaf modules recurse **through the
context** and never import `document.ts`/`clause.ts` upward. If you add a
module that needs to recurse, take the same route.

## Adding a new KR convention — which layer?

1. New **role/POS mapping** (e.g. a role should sit on the baseline): add the
   value in `schema/`, teach the inference rules, then extend `classify.ts`
   (e.g. `BASELINE_COMPLEMENTS`). Often no drawing change is needed.
2. New **shape for an existing structure**: the drawing function that owns
   that structure (`clause.ts` for baseline furniture, `word.ts` for things
   hanging under a head, `coordination.ts` for forks…). Use `primitives.ts` /
   `geometry.ts` helpers; do not hand-roll element objects.
3. New **decoration** (marks like the apposition "="): draw it next to the
   connector in the owning module; keep it a short stroke so the
   characterization harness's mark exemption recognizes it.
4. Never: infer structure from token order, or teach the renderer syntax.

## Stability contracts

- `nodeId`/`relationId` stamped on primitives drive selection, hover, detail
  cards and export — preserve them when changing drawing code.
- Element ids (`el_N`) come from a per-layout counter (`resetEid` in
  `layoutDocument`); they are deterministic but order-sensitive — never
  assert them in tests.
- `tests/kr-characterization.test.ts` snapshots structure + connectivity over
  the whole fixture corpus. A pure refactor must keep snapshots byte-identical;
  a deliberate geometry change should show a small, reviewable diff.

## Known stress cases (all in the characterization corpus)

- **Mark 5:26** — accusative/articular PP regression (`mark5-regression`).
- **Mark 1:19–20** — coordinated object + participial clause (both editions).
- **Col 1:9–20** — long-sentence stress; correlative εἴτε lists (v16).
- **Gen 1:11** — open-fork object + clause-level PP adjunct (the rail-stub
  disconnect regression, `gen-1-11-adjunct-regression`).
- **Hebrew RTL** — Gen 1, Psa 1, Deu 6 mirror-smoke via the corpus.
