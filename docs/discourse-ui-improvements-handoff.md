# Discourse UI improvements — handoff notes (Phase 1 complete)

Branch: `claude/discourse-ui-improvements-1zp06b`. This file is the working
plan for the staged implementation of the Discourse-mode UI overhaul, Study
highlighting fix, top-toolbar cleanup, and syntax-view zoom/gloss fixes.
Phase 1 (repo inspection + risk map + architecture decisions) is DONE — all
findings and decisions are recorded below. Nothing else has been implemented
yet. Implement phases in order, **one commit per phase**, reviewable patches,
no broad refactors. Delete this file in the final cleanup commit.

Model routing (from the task): keep high-risk work (layout geometry, state
semantics, schema, selection/highlight architecture, zoom math) with the
strongest available model; delegate mechanical work (gloss tables, tests,
label renames, validation runs) to cheaper subagents.

---

## 1. Verified file map (from 4 exploration passes; line numbers at commit 6ac7663)

Top toolbar / modes
- `src/ui/components/TopBar.tsx` — the ONLY global top bar: brand, `ModeSwitcher`,
  spacer, Sources (mobile), Export button, overflow `⋯` menu, save status.
  `canEdit = vp.isDesktop` at :53; bounces appMode edit→explore on mobile :66-68.
- `src/ui/shell/ModeSwitcher.tsx` — `AppMode = 'explore'|'edit'|'sermon'`
  (`src/state/types.ts:31`); `'sermon'` is LABELED "Study" in the UI.
- `src/ui/shell/ResponsiveShell.tsx` — :56-58 mobile forces diagramMode off
  discourse; :60-65 entering discourse forces appMode explore→edit (desktop);
  :100-116 right-panel slot: sermon→`SermonPrepDrawer`, discourse→`DiscourseRightPanel`,
  else `RightPanel`. NO effect resets appMode when LEAVING discourse (gap, Phase 7).
- `src/ui/shell/VisualizationSwitcher.tsx` — only mounted in DiscourseCanvas header.
  `DiagramCanvas.tsx:892-910` has its OWN separate inline mode `<select>` (duplication).
- `appMode` and `diagramMode` are NOT persisted. Store has hand-rolled per-field
  localStorage persistence precedents: `treeOrientation` (`store.ts` ~192-208),
  `constituencyVariant` (~170-189), `flipDiagram`, `versesInPanel`, `forceDesktop`.
  Follow that pattern for diagramMode (Phase 7). `diagramMode` initial =
  `DEFAULT_MODE` = 'phrase-block' (`src/domain/layout/modes/index.ts:53`);
  setter `setDiagramMode` `store.ts:1555-1564`.

Outline + Load Range
- Outline button: `src/ui/discourse/DiscourseCanvas.tsx:172-179`, local state
  `outlineOpen` (:60), conditionally renders `<DiscourseOutlineNav doc={doc}/>`
  in `.discourse-body` (:226).
- `src/ui/discourse/DiscourseOutlineNav.tsx` — search/jump input + flat unit list
  (indent = depth*12px), `jumpTo` (:55-73) selects unit in discourse store,
  expands ancestors, smooth-scrolls via `[data-unit-id]` querySelector — works
  from anywhere in the DOM, so it can move to the left panel safely.
- Load Range: `src/ui/panels/LeftPanel.tsx` (:36 switches on discourse; tabs
  Range/New text/Search :83-107; body :153-156) → `src/ui/discourse/DiscourseRangeSelector.tsx`
  (panel section: source/book/from/to selects, shortcuts, unit-size, Load range
  button :248-256).

Discourse rendering
- `src/ui/discourse/DiscourseView.tsx` — `ARC_GUTTER = 116` (:14); measures unit
  y-midpoints via `unitEls` Map + `contentRef` getBoundingClientRect (:82-97);
  ResizeObserver re-measure (:99-106); left gutter div `.discourse-gutter`
  (:210-221) with `.discourse-content` inline `padding-left` (116 when
  `view.showRelations` else 16); Escape priority chain (:132-141): highlight-pick
  → split-pick → cancelRelation (pre-target) → closeRelationTypeEditor → deselect;
  background click cancels relate (:203-208); relate banner :198-202;
  `onUnitSelect` (:109-124) routes to `pickRelationTarget` when
  `pendingRelationSource` set. `editing` prop is HARDCODED true from
  `DiscourseCanvas.tsx:227-231` (why Explore isn't clean — Phase 7/3 fix:
  pass `appMode === 'edit'`).
- `src/ui/discourse/DiscourseRelationLayer.tsx` — SVG `.discourse-arcs` overlay;
  greedy lane packer (:38-58) sorted by span length, laneStep clamp(12,22,
  (gutter-16)/laneCount), arc x = max(8, gutter-10-lane*laneStep); bracket path
  `M x0 y1 H x V y2 H x0` + arrowhead + rotated -90° label (:98-125). Arc geometry
  is already indent-independent (pure vertical measurement). To mirror to the
  RIGHT: x0 becomes content right edge, arcs step outward to the right, label
  rotation likely +90°.
- `src/ui/discourse/DiscourseUnitBlock.tsx` — DEFAULT text render is a single
  joined string `tokens.map(t=>t.surface).join(' ')` (:282-291) — token ids are
  thrown away unless: `unit.textHighlights?.length` → `renderTokensWithHighlights`
  (:17-32, per-token `<span key={t.id}>`, class `discourse-hl hl-<color>`);
  splitPicking (:292-317, `<button className="discourse-split-word">`);
  highlightPicking (:318-344, `<span data-token-id data-token-index>` +
  `tokenIndexAt` :149-154 pointer-drag selection). Indent handle: inline `⋮⋮`
  button (:228-242) shown when `editing && onSetIndent`; drag logic :94-127,
  `INDENT_STEP_PX=26` snap, local `dragIndent` preview → single undo entry;
  keyboard ←/→ :128-142; marginLeft = `(depth+shownIndent)*26` (:204).
  Marker chips block :349-355 gated by `view.showMarkers && !splitPicking &&
  !highlightPicking`.
- `src/domain/discourse/layout.ts` — `discourseRows(doc)` (:19-59) resolves
  `unit.tokenIds` → tokens via Map (stable ids available at render);
  `markersByUnit` (:34-38); `relationColor(type)` (:119-146) hardcoded switch:
  brown=support, green=consequence, red=opposition, olive=condition,
  blue=structure, purple=quotation, slate=coordinate, gray default.

Discourse editing UI
- `src/ui/discourse/DiscourseToolbar.tsx` — 6 `.discourse-toolbar-group`s:
  Split/Merge (:60-77), Indent/Move (:79-116), Group/Ungroup/Label (:118-141),
  Delete w/ 2-step confirm (:143-179), Relate (:181-190), Undo/Redo/Reset
  (:192-225, reset gated by `localHasPatch`), hint line (:227-235). All `.mini`.
- `src/ui/discourse/DiscourseSidePanel.tsx` — relation editor section
  `.discourse-relation-editor` (:233-342): head+✕ (:237-246), Type select
  (:247-264), Label input (:265-275), Confidence (:276-291), Notes textarea
  rows=2 (:292-303), **Marker evidence checkbox fieldset (:304-329) — REMOVE
  from UI (keep `markerIds` data)**, Delete relation (:330-340). `unitName()`
  helper :87-91.
- `src/ui/discourse/DiscourseRelationPicker.tsx` — post-link type modal
  (chooseType :27-30, Leave untyped :31-35, Delete link :36-39).
- `src/ui/discourse/DiscourseMarkerChip.tsx` — chip w/ "possible …" label.

Discourse state/persistence
- `src/state/discourse.ts` — selection `{unitId?,relationId?,markerId?}` (:74-78);
  state fields: `multiSelectedUnitIds` (:134), `pendingRelationSource` (:109),
  `typeEditRelationId` (:115), `splitPickUnitId` (:120), `highlightPickUnitId`
  (:127), `highlightColor` (:129), `view: DiscourseViewToggles` (:81-88, has
  `compact`, `showMarkers`, `showRelations`, `showSourceText`…; DEFAULT_VIEW
  :372-379). Undo/redo = full-doc snapshot stacks `past`/`future`,
  HISTORY_LIMIT=100 (:269), `commit()` (:392-399) pushes + `persistEdits`;
  undo/redo :735-748; `resetEdits` :750-765 (deletes patch, restores baseDoc).
  Actions incl. `startRelation` (:681-687), `pickRelationTarget` (:689-700 —
  creates untyped relation immediately, opens type modal), `setRelationType`,
  `beginSplit`, `beginHighlight`, `addTextHighlight`, `removeTextHighlight`,
  `setUnitIndent`/`nudgeUnitIndent`, `enterDiscourseMode` (:523-540 — never
  touches appMode).
- `src/domain/schema/discourse.ts` — `DiscourseUnitSchema` :97-146 incl.
  `color?` (:126-128) and **`textHighlights?: {id, tokenIds, color}[]`**
  (:129-143); `DiscourseRelationSchema` :176-195 (**no color field yet**);
  `DiscoursePatchSchema` :391-405.
- `src/domain/discourse/patch.ts` — `diffEntities` (:46-80) is generic/
  field-agnostic; `applyDiscoursePatch` :130-147. **CRITICAL: zod strips unknown
  keys on load (`DiscoursePatchSchema.safeParse` in `persistence/discourse.ts:76`)
  — every new persisted field MUST be added to the zod schemas or it silently
  disappears on reload.**
- `src/persistence/discourse.ts` — `kr:discourse:<baseDocId>` patches (:68-85),
  `kr:lastDiscourse` range restore, `kr:discoursePref:*` flags; `applyStoredDiscoursePatch`
  guards sourceId/baseHash (:94-110).
- `src/domain/discourse/mutations.ts` — pure mutations; `MIN/MAX_USER_INDENT`
  0–8 (:441-442). Merge keeps primary unit's fields; split inherits indent.
- `src/domain/discourse/export.ts` — JSON (:25-32), Markdown outline (:62-98),
  relations MD/CSV (:101-126, :425-447), HTML print (:175-242, text-only),
  **SVG outline arcs in LEFT gutter `GUTTER=132`** (:271-346, `renderOutlineArcs`
  :354-396 w/ lane packing), `discourseOutlineSvgPrintHtml` (:405-422).
  Phase 3 must mirror exports to the right gutter too (keep parity with canvas).

Study / sermon
- `src/domain/schema/sermon.ts` — `HighlightCategorySchema` :75-89 = exactly the
  12 categories (mainIdea, repeatedWord, command, promise, warning,
  theologicalClaim, illustration, application, question, contrast, conjunction,
  emphasis). `AnchorSchema` :38-47 `{type, id?, tokenIds?, nodeId?, relationId?,
  blockId?, verseRef?}`, anchor types incl. `tokenRange` (:17-29). Highlight
  :91-100 `{id, anchor, category, noteId?, createdAt, updatedAt}`. Notes :64-73
  (separate category enum :50-62), Observations :103-110, Outline :112-125,
  SermonPrepData :127-146.
- `src/ui/sermon/SermonPrepDrawer.tsx` — This selection (:54-63),
  `HighlightToolbar` (:63), quick note (:64-73), Big idea & outline (:76-106),
  Highlights list (:108-128), Notes (:130-153), Observations (:155-177).
  `selectionAnchor()` :7-12 falls back to `{type:'passage'}`.
- `src/ui/sermon/HighlightToolbar.tsx` — chips call
  `toggleHighlight({anchor, category})` on `useEditorStore` (:40).
- `src/ui/sermon/highlights.ts` — `HIGHLIGHT_CATEGORIES` :5-18 labels+colors.
- Persistence: `src/persistence/userData.ts` `kr:sermon:<passageId>` (:26,
  :116-131) — keyed by SYNTAX doc id only; never loaded for discourse.
- **ROOT CAUSE of broken Study highlighting in Discourse:** SermonPrepDrawer/
  HighlightToolbar read `useEditorStore.selection`, but discourse clicks only
  set `useDiscourseStore.selection`. Chips fire `toggleHighlight` with a
  passage-type anchor against the (possibly stale/absent) syntax doc → appears
  to do nothing. Two stores, no bridge; plus no sermon record exists for the
  discourse doc.

Syntax canvas (zoom/selection) — for Phase 6
- `src/ui/components/DiagramCanvas.tsx` (1453 lines) renders ALL syntax modes.
  Zoom = `useState<View>({x,y,scale})` :256, applied as CSS transform
  :1140-1142; `crispScale` baking for fine pointers :269-275. `fit()` :318-326
  (fit-to-viewport, cap 1.5×); `useLayoutEffect(fit, [doc.id, diagramMode])`
  :331-334 ← the existing reset hook to replace; ResizeObserver refit :335-345;
  clamp effect :352-356; Reset-zoom button :1027. `minScale()` :291-296 via
  `minZoomScale` (`src/ui/zoom.ts:40-51`, MIN_SCALE 0.1, MAX_SCALE 24);
  `zoomBy(factor,cx,cy)` :358-373; wheel :377-391; pointer pan/pinch :407-451
  (no pointer capture; `moved` ref 2px threshold distinguishes tap).
  Selection: `useEditorStore.selection` `{nodeId?,relationId?,tokenId?,glossKey?}`
  (`state/types.ts:79-85`), `select` `store.ts:1551`. Word `<text>` onClick →
  `onLabelClick` :1243-1251 → `onNode` :481-504. **No double-click handling
  anywhere in src/.** SVG is real React elements (:1163-1330), NOT innerHTML.
  Per-word geometry: filter `layout.elements` for `kind==='text' &&
  e.nodeId===id` — see `anchorFor(nodeId)` :525-531 and popover anchoring
  :560-582 (projects layout coords through view.x/y/scale). A locator `<circle>`
  can be appended inside the same `<svg>` (inherits transform) with
  `vector-effect="non-scaling-stroke"`; make radius ∝ 1/scale for constant
  screen size.
- Tests: `tests/zoom.test.ts` covers zoom.ts helpers.

Constituency/dependency glosses — for Phase 8
- `src/domain/layout/modes/constituency.ts` — `srcMeta()` :332-335 builds
  `"<rule> · art."` (rule = raw Lowfat `<wg rule>`, e.g. "Np-Appos"); rendered
  :458-464 with **no glossKey** (the gap). Category chip glossKeys `phrase:<cat>`
  :453-456; POS `pos:<cat>` :423,436; helpers :476-482. Reuses `SHORT_ROLE`
  from `src/domain/layout/modes/dependency.ts:24-58`.
- `src/domain/model/glossary.ts` — `GLOSSARY` map (:25+), `lookupGloss` :322-325
  (case-insensitive), `hasGloss` :328-330. `phrase:*`/`pos:*` entries :206-271.
- Tests live flat in `tests/` (vitest, happy-dom, alias `@`→src). Scripts:
  `npm run typecheck` (tsc -b --noEmit), `npm test` (vitest run), `npm run build`,
  `npm run lint` (eslint).

CSS
- Single stylesheet `src/ui/styles/global.css` (~3176 lines). Tokens in `:root`
  :1-32 (`--accent` #b90e31 etc.). Button classes: `.btn`(+.primary/.danger),
  `.mini`(+.accept/.reject/.danger), `.lang-toggle` segmented, `.mode-switcher`.
  Discourse CSS ~:2674-3103: `.discourse-gutter` :2748-2754, `.discourse-arcs`
  :2755, `.discourse-scroll{overflow:auto}` :2746, `.discourse-content` :2747
  (padding-left 116px default), `.discourse-unit{max-width:760px}` :2767,
  indent handle :2772-2796, `.selected` :2798-2802, clamp (compact 1-line)
  :2848-2854, `.compact` :2855, multi-selected :2911, outline nav :3070-3103.
  Known dead/duplicate CSS: `.modeswitch` (legacy vs `.mode-switcher`),
  `.viz-switcher select` vs `.mode-select select`.

---

## 2. Architecture decisions (MADE — do not relitigate)

D1. **Shared span model = extend `DiscourseUnit.textHighlights` entries** with
optional fields (all zod-optional, fully backward compatible; old entries =
plain manual color highlights, unchanged behavior):
```
scope?: 'study' | 'relation'      // absent = existing manual unit highlight
category?: HighlightCategory      // study scope; reuse sermon enum (import or duplicate values in discourse schema to avoid cross-schema coupling — prefer importing HighlightCategorySchema)
relationId?: string               // relation scope
note?: string                     // study scope, optional short note
```
Color resolution at render: relation-scope → relation's color (see D3);
study-scope → category color (from `ui/sermon/highlights.ts`, move/mirror the
color map somewhere importable by the discourse renderer); legacy → existing
`hl-<color>` classes. Persistence/undo/redo/export are automatic via the
existing patch pipeline ONCE the zod schema is extended (see CRITICAL note
above). `resetEdits` wipes structural edits AND highlights by design; if cheap,
preserve study-scope highlights across reset by re-applying them onto base
units whose ids still exist (nice-to-have, not required).

D2. **Highlight creation UX = hybrid token-span pointer drag** (NO checkboxes,
NO native browser text selection): reuse the proven `highlightPicking`
mechanism (`data-token-index` spans + `tokenIndexAt` + pointer drag across
tokens, contiguous range within ONE unit). Tap = single token toggle; drag =
range. Cross-unit selection: out of scope — show the existing single-unit
behavior (selection is per unit).
- Study mode: whenever `appMode==='sermon'` in discourse, unit text ALWAYS
  renders as token spans; drag/tap sets a transient `studySelection
  {unitId, tokenIds}` in the discourse store (NOT a highlight yet); category
  chips in the Study panel then create `{scope:'study', category, tokenIds}`
  on that unit. Clicking a chip with no selection: disabled state + hint.
- Relation highlights: with a relation selected in Edit mode, a "Highlight
  words…" action in the relation editor enters a relation-highlight pick mode
  (new store field, e.g. `relationHighlightPickRelationId`); all unit texts
  render as token spans; drag/tap creates/toggles `{scope:'relation',
  relationId, tokenIds}` on the unit where the drag happened. Esc exits (wire
  into the existing Escape priority chain in DiscourseView). Existing
  highlights for the selected relation listed in the editor with remove
  buttons (summary list of spans, NOT tokens as checkboxes).

D3. **Relation color = new optional `color` field on `DiscourseRelationSchema`**
(zod + patch schema pickup is automatic once declared). Value = small named
palette (reuse/extend `DiscourseUnitColorSchema` palette if suitable — check
`schema/discourse.ts` :126 region — or a restrained hex set of ~8). Fallback
when unset = existing `relationColor(type)`. Apply to: canvas arcs + labels
(`DiscourseRelationLayer`), relation-scope text highlights, SVG/PDF export arcs
(`export.ts renderOutlineArcs`). Color picker = row of swatch buttons in the
relation editor (no `<input type=color>`).

D4. **Study data for discourse**: highlights live in the discourse doc (D1).
Notes/observations/big-idea-outline: give the discourse doc its own
`SermonPrepData` record keyed `kr:sermon:<discourseDocId>` reusing the existing
schema + `saveSermonPrep`/`loadSermonPrep` + pure `domain/sermon` mutations;
held in `useDiscourseStore` (new `sermon` field + actions), loaded on range
load. `SermonPrepDrawer` branches on `diagramMode==='discourse'` to read the
discourse store (selection info, highlight list from doc units, notes from the
discourse sermon record). Do NOT try to bridge the two selection stores.

D5. **Modes in discourse** (Phase 3/7): `DiscourseCanvas` passes
`editing={appMode==='edit'}` to `DiscourseView` (currently hardcoded true).
Explore = clean read: arcs (colored), indentation, labels, selection allowed;
NO toolbar, NO indent handles, NO marker chips, NO relate/split affordances,
study highlights visible. Edit = current behavior + relation highlight tools;
study highlights render muted (e.g. reduced opacity class). Study = token-span
selection + SermonPrepDrawer (right panel already swaps). Marker chips: set
`DEFAULT_VIEW.showMarkers = false`; keep the "Markers" toggle but only render
it in Edit mode. Keep `DiscourseToolbar` mounted only in Edit mode.

D6. **Leaving discourse → Explore** (Phase 7): implement inside `setDiagramMode`
(store.ts:1555) — if previous mode was 'discourse' and next isn't, `appMode`
becomes 'explore'. Entering discourse keeps the existing ResponsiveShell
explore→edit effect. Persist `diagramMode` via hand-rolled
`loadDiagramMode`/`saveDiagramMode` (validate against known DiagramMode values;
mobile guard in ResponsiveShell already handles discourse-on-mobile). Do NOT
persist appMode.

D7. **Outline relocation** (Phase 2): delete the Outline button + `outlineOpen`
+ conditional nav from `DiscourseCanvas`; render `DiscourseOutlineNav` inside
the left panel's discourse Range tab as a collapsible **"Passage outline"**
section below the Load-range button (only when a doc is loaded). Adjust
`.discourse-outline` CSS for the panel width. Keep jump/scroll behavior
(querySelector by `[data-unit-id]` works across the DOM). Do not touch the
Study "big idea & outline".

---

## 3. Phase plan (commit per phase)

- **Phase 2** — Outline → left panel (D7). Files: DiscourseCanvas.tsx,
  LeftPanel.tsx / DiscourseRangeSelector.tsx, DiscourseOutlineNav.tsx,
  global.css. Low coupling; do first.
- **Phase 3** — Discourse layout (high-risk):
  (a) arcs to RIGHT gutter: `.discourse-gutter` right:0; content
  `padding-right: ARC_GUTTER`, `padding-left: 16`; mirror lane packer x math;
  label rotation; keep DOM y-measurement; verify Full/Compact + long-passage
  scrolling; mirror `export.ts` SVG arcs to right gutter.
  (b) relation editor vertical layout (Type/Label/Confidence/Color/Notes
  full-width/Highlights summary), REMOVE marker-evidence fieldset (UI only).
  (c) toolbar hierarchy: groups Primary(Relate→, visually primary) /
  Structure(Split, Merge←, Group, Ungroup) / Indent-order(→ ← ↑ ↓) /
  Annotation(Label…) / History(Undo, Redo, Reset…) / Destructive(Delete unit,
  separated). Section labels or dividers; reuse `.mini`/tokens; must work at
  narrow widths.
  (d) marker chips default off (D5 part), toggle Edit-only.
  (e) indent handle: Edit-only, tall vertical line (~80% unit height) between
  unit border and text, adequate hit area, left/right drag only, 26px snap
  (keep existing drag logic, restyle + reposition).
  (f) empty/cropped frame fix: containers/units with no visible content should
  not draw an empty bordered frame; check `.discourse-unit` borders + compact
  clamp + deep-indent overflow.
  (g) relation `color` schema field + swatch picker in editor + arcs/labels
  use it (D3). (Text highlights in relation color come in Phase 5.)
- **Phase 4** — Study highlights (D1, D2 study half, D4). Schema first, then
  store (studySelection, addStudyHighlight, removeHighlight, note editing,
  discourse sermon record), then UnitBlock token-span render in study mode +
  drag selection, then SermonPrepDrawer discourse branch (chips create,
  list/remove/note, disabled-until-selection, muted non-clickable states).
- **Phase 5** — Relation highlights (D2 relation half) + relation-color text
  rendering; renderTokensWithHighlights extended for scope colors (relation
  color, category colors); Explore renders relation highlights (emphasized when
  its relation selected); Edit add/remove; persistence automatic — verify
  undo/redo/export/reset behaviors + `applyStoredDiscoursePatch` roundtrip test.
- **Phase 6** — Syntax zoom (DiagramCanvas.tsx + zoom.ts, independent of
  discourse; can run parallel with 2–5): replace fit-on-[doc.id, diagramMode]
  with reset to scale 0.5 (clamped to [minScale,maxScale]) centered on FIRST
  word = text element (with nodeId) for the node containing doc.tokens[0]
  (helper via syntax queries; fallback = first text element w/ nodeId).
  Reset-zoom button does the same. Resize → clamp only (no full reset).
  Double-click word: select + zoom to 1.0 centered on its anchor (add
  onDoubleClick next to onClick; single-click behavior unchanged). Locator:
  red `<circle>` around selected word anchor when `view.scale <= 0.5`, inside
  the SVG, `vector-effect="non-scaling-stroke"`, `r = C/scale` for constant
  screen radius (~16px screen), stroke only, no fill, pointer-events none;
  hide when zoomed in past 0.5. Mind the crispScale baking (fine-pointer path)
  when converting coords.
- **Phase 7** — diagramMode persistence + leave-discourse→explore (D6). Small;
  store.ts + maybe ResponsiveShell. Add tests if store logic is extractable.
- **Phase 8** (cheap model OK, then review): composite gloss lookup in
  glossary.ts — split combined labels on `·`, `•`, whitespace, `-`, `/`, `.`;
  normalize (trim, strip trailing period, case-insensitive); try whole label
  first, then components with prefixes (`rule:`, `phrase:`, `pos:`, bare);
  join found component glosses; unknown components silently skipped; no gloss
  if nothing matches. Add glossary entries for Lowfat rule components (grep
  `src/io/lowfat.ts` for rule names: Np-Appos, DetNP, AdjpNp, NpAdjp, NpPp …)
  + `art.` (articular). Set glossKey on the srcMeta text element in
  constituency.ts. Tests: "Np-Appos · art.", "DetNP · art.", unknown-component
  cases. Also check dependency/constituency gloss duplication (SHORT_ROLE
  already shared).
- **Phase 9** — typecheck, vitest, build, lint; fix fallout; final cleanup
  commit (remove this file); push `git push -u origin
  claude/discourse-ui-improvements-1zp06b` (retry w/ backoff on network fail).
  NO PR unless the user asks.

## 4. Verification notes
- Manual verify (Playwright/chromium is preinstalled; `npm run dev`) at least:
  arcs right-side with indented units + compact mode + scrolled long passage;
  study highlight create/remove + reload persistence; relation highlight in
  relation color + reload; zoom reset/dblclick/locator. Screenshots for the
  deliverable if feasible.
- Watch out: zod strips undeclared keys (schema first!); `DiscourseView`
  Escape priority chain ordering when adding pick modes; exports must stay in
  step with canvas (right gutter); don't let `.discourse-content` padding swap
  break `measure()` x-independence (it only measures y — safe).
- Deliverable at the end: summary of changed files, schema/persistence changes,
  where Outline moved, chosen highlight UX (= hybrid token drag/tap, D2),
  screenshots/visual notes, test/build results, remaining risks.
