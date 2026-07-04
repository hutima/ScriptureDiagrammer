import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useDiscourseStore } from '@/state';
import type { DiscourseDocument } from '@/domain/schema';
import {
  childUnits,
  discourseRows,
  layoutDiscourseRelations,
  visibleRelationEndpoints,
  type RelationEndpointInput,
} from '@/domain/discourse';
import { resolvedRelationColor } from '@/domain/discourse';
import { DiscourseUnitBlock } from './DiscourseUnitBlock';
import { DiscourseRelationLayer } from './DiscourseRelationLayer';
import { DiscourseRelationPicker } from './DiscourseRelationPicker';

/** Base padding on the side of `.discourse-content` that has NO gutter, and
 *  the fixed portion of the gutter side's padding (gutter width is added on
 *  top of this, not instead of it — see `contentStyle` below). */
const BASE_PAD = 16;
/** Fixed width budget for the unit column itself (`.discourse-unit`'s own
 *  max-width in CSS) — kept in sync here only for the content max-width math. */
const UNIT_MAX_WIDTH = 760;

/**
 * Two `RelationEndpointInput[]` are "the same" for re-render purposes when
 * every relation's (rounded) geometry matches AND every entry still points at
 * the SAME `relation` object — used to break the measure → resize →
 * re-measure loop a naive `setState` would create every time the
 * ResizeObserver fires (see the effect below).
 *
 * The reference-equality check matters for LIVE metadata edits: changing a
 * relation's color/type/label/dash/width never moves any unit, so geometry
 * alone would call the two arrays "the same" and `measure()` would keep the
 * STALE previous array — whose `relation` objects still carry the old
 * metadata — forever (until an unrelated resize happened to re-measure).
 * Zustand updates are immutable, so any edit produces a new relation object;
 * an unchanged document keeps identical references, so this still short-
 * circuits the loop exactly as before for pure resize/scroll events.
 */
function sameEndpoints(a: RelationEndpointInput[], b: RelationEndpointInput[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (
      x.relation !== y.relation ||
      x.relation.id !== y.relation.id ||
      x.y1 !== y.y1 ||
      x.y2 !== y.y2 ||
      (x.a1 ?? 0) !== (y.a1 ?? 0) ||
      (x.a2 ?? 0) !== (y.a2 ?? 0)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * The discourse outline itself: a scrollable vertical list of unit blocks
 * (indented by outline depth) with an SVG relation-arc overlay in the right
 * gutter and a textual inspector for the selected unit.
 *
 * In Edit mode (`editing`) the same list grows the structural affordances:
 * click-to-relate, shift-click multi-selection for grouping, word-level split
 * picking, keyboard shortcuts (Enter split · Tab/Shift+Tab indent/outdent ·
 * Backspace merge · Ctrl/Cmd+Z undo), and inline label/notes/relation editing
 * in the inspector. Every shortcut has a toolbar equivalent.
 */
export function DiscourseView({
  doc,
  editing = false,
  studyMode = false,
}: {
  doc: DiscourseDocument;
  editing?: boolean;
  /** Study (sermon) mode: unit text renders as drag/tap-selectable token spans. */
  studyMode?: boolean;
}) {
  const view = useDiscourseStore((s) => s.view);
  const selection = useDiscourseStore((s) => s.selection);
  const studySelection = useDiscourseStore((s) => s.studySelection);
  const setStudySelection = useDiscourseStore((s) => s.setStudySelection);
  const clearStudySelection = useDiscourseStore((s) => s.clearStudySelection);
  const select = useDiscourseStore((s) => s.select);
  const setUnitCollapsed = useDiscourseStore((s) => s.setUnitCollapsed);
  const multiSelected = useDiscourseStore((s) => s.multiSelectedUnitIds);
  const multiSelectMode = useDiscourseStore((s) => s.multiSelectMode);
  const setMultiSelectMode = useDiscourseStore((s) => s.setMultiSelectMode);
  const extendMultiSelect = useDiscourseStore((s) => s.extendMultiSelect);
  const pendingRelationSource = useDiscourseStore((s) => s.pendingRelationSource);
  const pendingRelationAwaitingSource = useDiscourseStore((s) => s.pendingRelationAwaitingSource);
  const startRelation = useDiscourseStore((s) => s.startRelation);
  const pickRelationTarget = useDiscourseStore((s) => s.pickRelationTarget);
  const typeEditRelationId = useDiscourseStore((s) => s.typeEditRelationId);
  const closeRelationTypeEditor = useDiscourseStore((s) => s.closeRelationTypeEditor);
  const cancelRelation = useDiscourseStore((s) => s.cancelRelation);
  const splitPickUnitId = useDiscourseStore((s) => s.splitPickUnitId);
  const beginSplit = useDiscourseStore((s) => s.beginSplit);
  const splitUnit = useDiscourseStore((s) => s.splitUnit);
  const highlightPickUnitId = useDiscourseStore((s) => s.highlightPickUnitId);
  const beginHighlight = useDiscourseStore((s) => s.beginHighlight);
  const addTextHighlight = useDiscourseStore((s) => s.addTextHighlight);
  const highlightColor = useDiscourseStore((s) => s.highlightColor);
  const relationHighlightPickRelationId = useDiscourseStore(
    (s) => s.relationHighlightPickRelationId,
  );
  const endRelationHighlight = useDiscourseStore((s) => s.endRelationHighlight);
  const addRelationHighlight = useDiscourseStore((s) => s.addRelationHighlight);
  const toggleRelationHighlightToken = useDiscourseStore((s) => s.toggleRelationHighlightToken);
  const setUnitIndent = useDiscourseStore((s) => s.setUnitIndent);
  const nudgeUnitIndent = useDiscourseStore((s) => s.nudgeUnitIndent);
  const mergeWithPrevious = useDiscourseStore((s) => s.mergeWithPrevious);
  const deleteUnit = useDiscourseStore((s) => s.deleteUnit);
  const undo = useDiscourseStore((s) => s.undo);
  const redo = useDiscourseStore((s) => s.redo);

  const rows = useMemo(() => discourseRows(doc), [doc]);
  const visibleRows = useMemo(() => rows.filter((r) => r.visible), [rows]);

  // relationId → resolved hex, so relation-scope text highlights paint in the
  // arc's colour (and an orphaned relationId, absent here, renders neutral).
  const relationColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of doc.relations) map.set(r.id, resolvedRelationColor(r));
    return map;
  }, [doc.relations]);

  const relationPicking = editing && !!relationHighlightPickRelationId;

  // Relations per unit (for the row badge + the inspector list).
  const relationsByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of doc.relations) {
      map.set(r.sourceUnitId, (map.get(r.sourceUnitId) ?? 0) + 1);
      map.set(r.targetUnitId, (map.get(r.targetUnitId) ?? 0) + 1);
    }
    return map;
  }, [doc.relations]);

  // --- arc geometry: measure the rendered blocks --------------------------------
  const contentRef = useRef<HTMLDivElement | null>(null);
  // The INNER unit-list element (not the padded `.discourse-content`) is what
  // the ResizeObserver watches. Observing the padded box would create a
  // feedback loop: a gutter-width change resizes `.discourse-content` (its
  // padding grew/shrank) → RO fires → re-measure → maybe a different lane
  // count → a different gutter width → resize again. The unit list's own
  // box only changes with the TEXT content (font load, viewport width,
  // collapse/expand), which is what we actually want to react to.
  const unitListRef = useRef<HTMLDivElement | null>(null);
  const unitEls = useRef(new Map<string, HTMLElement>());
  const registerEl = useCallback((unitId: string, el: HTMLElement | null) => {
    if (el) unitEls.current.set(unitId, el);
    else unitEls.current.delete(unitId);
  }, []);

  const side = view.relationSide ?? 'right';

  const [endpoints, setEndpoints] = useState<RelationEndpointInput[]>([]);
  const [contentHeight, setContentHeight] = useState(0);
  // The gutterWidth actually baked into the CURRENTLY PAINTED padding — read
  // by `measure()` below to place left-side endpoint tips (see `leftAttach`).
  // Using the value the DOM was last rendered with (rather than this render's
  // in-flight value) keeps the two in agreement without an extra render pass.
  const paintedGutterWidthRef = useRef(0);

  const measure = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    if (!view.showRelations) {
      setEndpoints((prev) => (prev.length ? [] : prev));
      setContentHeight(content.scrollHeight);
      return;
    }
    const cRect = content.getBoundingClientRect();
    const cTop = cRect.top;
    const cLeft = cRect.left;
    const relEndpoints = visibleRelationEndpoints(doc, rows);
    const mid = (id: string): number | null => {
      const el = unitEls.current.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top - cTop + r.height / 2);
    };
    // LEFT-SIDE ATTACH-POINT MAPPING (only meaningful when `side === 'left'`):
    // per `relationLayout.ts`'s convention, `u = 0` sits at the gutter/text
    // boundary and INCREASES away from the text. For a left gutter that
    // boundary is the gutter div's right edge, which currently sits
    // `paintedGutterWidthRef.current` px from `.discourse-content`'s left
    // edge (the gutter div is rendered flush left, `left:0`). A unit's own
    // rendered left edge, minus that boundary, is how far outward the
    // attach point would sit if it were positive; since a unit's left edge
    // always sits INSIDE the text column, this is always ≤ 0 — exactly the
    // "reaches into the text" tip the helper expects. Deeper indentation (or
    // the drag handle's own width) pushes the unit right, i.e. the tip
    // further negative, so clamp it to a sane max reach.
    const leftAttach = (id: string): number | undefined => {
      if (side !== 'left') return undefined;
      const el = unitEls.current.get(id);
      if (!el) return undefined;
      const unitLeft = el.getBoundingClientRect().left - cLeft;
      const a = -(unitLeft - paintedGutterWidthRef.current);
      return Math.round(Math.max(-240, Math.min(0, a)));
    };
    const next: RelationEndpointInput[] = [];
    for (const e of relEndpoints) {
      const y1 = mid(e.sourceId);
      const y2 = mid(e.targetId);
      if (y1 == null || y2 == null) continue;
      next.push({
        relation: e.relation,
        y1,
        y2,
        a1: leftAttach(e.sourceId),
        a2: leftAttach(e.targetId),
      });
    }
    setEndpoints((prev) => (sameEndpoints(prev, next) ? prev : next));
    setContentHeight(content.scrollHeight);
  }, [doc, rows, side, view.showRelations]);

  // Coalesce ResizeObserver callbacks into an animation frame: a callback
  // that synchronously triggers a state update (which can itself resize the
  // observed box — e.g. a gutter-width change nudging wrapped text) is
  // exactly the pattern that trips Chrome's "ResizeObserver loop completed
  // with undelivered notifications" warning. Scheduling `measure()` on the
  // next frame instead lets the current observation cycle finish before any
  // layout-affecting state change happens, without changing what gets
  // measured. The INITIAL `measure()` on mount stays synchronous so the first
  // paint already has arcs.
  const rafIdRef = useRef<number | null>(null);
  const scheduleMeasure = useCallback(() => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    measure();
    const list = unitListRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(list);
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      ro.disconnect();
    };
  }, [measure, scheduleMeasure]);

  // The ONE pure layout call — shared with the SVG/PDF export — turning
  // measured endpoints into lane-packed, endpoint-nudged geometry plus the
  // gutter width the content padding reserves.
  const relationLayout = useMemo(
    () => layoutDiscourseRelations(endpoints, { side, showLabels: view.showLabels }),
    [endpoints, side, view.showLabels],
  );
  const gutterWidth = relationLayout.gutterWidth;
  // Keep the "what's actually painted" ref in step BEFORE the next measure
  // pass (a layout effect runs after the DOM commit, ahead of the async
  // ResizeObserver callback that triggers the next `measure()`).
  useEffect(() => {
    paintedGutterWidthRef.current = gutterWidth;
  }, [gutterWidth]);

  // Base pad on both sides + the gutter width added on the gutter's side only
  // — so an empty/hidden gutter costs nothing (no gutter ⇒ no wasted width).
  const gutterSidePad = BASE_PAD + gutterWidth;
  const contentMaxWidth = UNIT_MAX_WIDTH + BASE_PAD + gutterWidth + BASE_PAD;
  const contentStyle: CSSProperties =
    side === 'right'
      ? { paddingLeft: BASE_PAD, paddingRight: gutterSidePad, maxWidth: contentMaxWidth }
      : { paddingLeft: gutterSidePad, paddingRight: BASE_PAD, maxWidth: contentMaxWidth };

  // A relation draft must be cancellable with Escape from ANYWHERE: the draft
  // starts from the side panel's Relate button, so focus usually still sits
  // OUTSIDE this component when the user reaches for Escape — the local
  // onKeyDown below would never see it. Window-level, active only while a
  // draft exists, and deferring to typing surfaces (their own Escape wins).
  useEffect(() => {
    if (!editing || (!pendingRelationSource && !pendingRelationAwaitingSource)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      cancelRelation();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, pendingRelationSource, pendingRelationAwaitingSource, cancelRelation]);

  // --- selection / edit interactions ---------------------------------------------
  const onUnitSelect = useCallback(
    (unitId: string, opts: { shift: boolean }) => {
      // Two-phase Relate draft: awaiting the SOURCE unit first (the toolbar's
      // "Relate" with nothing selected) — the next click picks it and moves
      // the flow into the normal awaiting-target phase.
      if (editing && pendingRelationAwaitingSource) {
        startRelation(unitId);
        return;
      }
      if (editing && pendingRelationSource) {
        // Clicking the SAME unit again keeps the mode (no-op) rather than
        // creating a self-link or falling through to selection.
        if (pendingRelationSource === unitId) return;
        // Target picked → create the connector immediately (untyped); the type
        // modal opens next for optional metadata.
        pickRelationTarget(unitId);
        return;
      }
      if (editing && opts.shift) {
        extendMultiSelect(unitId);
        return;
      }
      if (editing && multiSelectMode) {
        extendMultiSelect(unitId);
        return;
      }
      select(selection.unitId === unitId ? {} : { unitId });
    },
    [
      editing,
      pendingRelationAwaitingSource,
      pendingRelationSource,
      startRelation,
      multiSelectMode,
      selection.unitId,
      select,
      pickRelationTarget,
      extendMultiSelect,
    ],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Typing surfaces keep their native keys.
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      // Escape works in EVERY mode (Explore included): it cancels any pending
      // edit pick, else deselects — clean reading still needs "press Esc to
      // clear the selection".
      if (e.key === 'Escape') {
        if (editing && highlightPickUnitId) beginHighlight(null);
        else if (editing && relationHighlightPickRelationId) endRelationHighlight();
        else if (editing && splitPickUnitId) beginSplit(null);
        // Awaiting the SOURCE unit (Relate started with nothing selected) →
        // cancel the draft, same as the awaiting-target case below.
        else if (editing && pendingRelationAwaitingSource) cancelRelation();
        // Before a target is picked → cancel, no link is created.
        else if (editing && pendingRelationSource) cancelRelation();
        // After the link exists (modal open) → close the modal, KEEP the link.
        else if (editing && typeEditRelationId) closeRelationTypeEditor();
        // Multi-select mode: Escape exits the mode (clearing the selection).
        else if (editing && multiSelectMode) setMultiSelectMode(false);
        // Study mode: a pending token selection clears first (before deselect).
        else if (studyMode && studySelection) clearStudySelection();
        else select({});
        return;
      }
      // The remaining shortcuts are structural edits — Edit mode only.
      if (!editing) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      const unitId = selection.unitId;
      if (!unitId) return;
      const unit = doc.units.find((u) => u.id === unitId);
      if (!unit) return;
      if (e.key === 'Tab') {
        // Tab drives the EXPLICIT per-line userIndent (same reducer as the
        // toolbar buttons and the drag handle) — works on ANY line, including
        // the first, and never moves neighbours. Structural nesting is the
        // Group/Ungroup commands.
        e.preventDefault();
        nudgeUnitIndent(unitId, e.shiftKey ? -1 : 1);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (unit.tokenIds.length > 1) beginSplit(splitPickUnitId === unitId ? null : unitId);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const siblings = childUnits(doc, unit.parentId);
        const i = siblings.findIndex((u) => u.id === unitId);
        const prev = i > 0 ? siblings[i - 1] : undefined;
        // Shift+Delete/Backspace DELETES the unit; plain Delete/Backspace keeps
        // the existing "merge into previous" behaviour (no conflict).
        if (e.shiftKey) {
          e.preventDefault();
          const next = prev ?? siblings[i + 1];
          deleteUnit(unitId);
          select(next ? { unitId: next.id } : {});
          return;
        }
        if (prev && prev.tokenIds.length > 0 && unit.tokenIds.length > 0) {
          e.preventDefault();
          mergeWithPrevious(unitId);
          select({ unitId: prev.id });
        }
      }
    },
    [
      editing,
      studyMode,
      studySelection,
      clearStudySelection,
      doc,
      selection.unitId,
      splitPickUnitId,
      highlightPickUnitId,
      relationHighlightPickRelationId,
      endRelationHighlight,
      pendingRelationSource,
      pendingRelationAwaitingSource,
      typeEditRelationId,
      multiSelectMode,
      setMultiSelectMode,
      beginSplit,
      beginHighlight,
      cancelRelation,
      closeRelationTypeEditor,
      select,
      undo,
      redo,
      nudgeUnitIndent,
      mergeWithPrevious,
      deleteUnit,
    ],
  );

  const multiSet = useMemo(() => new Set(multiSelected), [multiSelected]);

  return (
    <div className="discourse-view" onKeyDown={onKeyDown}>
      {editing && pendingRelationAwaitingSource && (
        <div className="discourse-relate-banner" role="status">
          Relating — click the SOURCE unit to start. <kbd>Esc</kbd> to cancel.
        </div>
      )}
      {editing && pendingRelationSource && (
        <div className="discourse-relate-banner" role="status">
          Relating — click another unit to connect to it. <kbd>Esc</kbd> to cancel.
        </div>
      )}
      {relationPicking && (
        <div className="discourse-relate-banner" role="status">
          Highlighting this relation — drag across words to add them; tap a
          highlighted word to remove it. <kbd>Esc</kbd> or “Done” to finish.
        </div>
      )}
      <div
        className="discourse-scroll"
        onClick={() => {
          // A stray background click while picking relation words keeps the
          // relation selected + pick mode active (exit via Esc / Done).
          if (relationPicking) return;
          if (pendingRelationAwaitingSource || pendingRelationSource) cancelRelation();
          else if (studyMode && studySelection) clearStudySelection();
          else select({});
        }}
      >
        <div className="discourse-content" ref={contentRef} style={contentStyle}>
          {gutterWidth > 0 && (
            <div
              className="discourse-gutter"
              style={{ width: gutterWidth, ...(side === 'right' ? { right: 0 } : { left: 0 }) }}
            >
              <DiscourseRelationLayer
                relations={relationLayout.relations}
                gutterWidth={gutterWidth}
                side={side}
                height={contentHeight}
                selectedRelationId={selection.relationId}
                onSelect={(relationId) => select({ relationId })}
              />
            </div>
          )}
          <div role="list" aria-label={`Discourse units for ${doc.title}`} ref={unitListRef}>
            {visibleRows.map((row) => (
              <DiscourseUnitBlock
                key={row.unit.id}
                row={row}
                view={view}
                isEnglish={doc.language === 'en'}
                selected={selection.unitId === row.unit.id}
                multiSelected={multiSet.has(row.unit.id)}
                relateTarget={
                  editing && !!pendingRelationSource && pendingRelationSource !== row.unit.id
                }
                splitPicking={editing && splitPickUnitId === row.unit.id}
                relationCount={relationsByUnit.get(row.unit.id) ?? 0}
                registerEl={registerEl}
                onSelect={onUnitSelect}
                onToggleCollapsed={(unitId, collapsed) => setUnitCollapsed(unitId, collapsed)}
                onTokenSplit={(unitId, tokenId) => {
                  splitUnit(unitId, tokenId);
                  beginSplit(null);
                }}
                editing={editing}
                onSetIndent={setUnitIndent}
                highlightPicking={editing && highlightPickUnitId === row.unit.id}
                onAddHighlight={(unitId, tokenIds) => addTextHighlight(unitId, tokenIds)}
                highlightColor={highlightColor}
                studyMode={studyMode}
                studySelectionTokenIds={
                  studySelection?.unitId === row.unit.id ? studySelection.tokenIds : undefined
                }
                onStudySelect={(unitId, tokenIds) =>
                  setStudySelection(tokenIds.length ? { unitId, tokenIds } : null)
                }
                relationHighlightPicking={relationPicking}
                onAddRelationHighlight={addRelationHighlight}
                onToggleRelationHighlightToken={toggleRelationHighlightToken}
                relationColors={relationColors}
                selectedRelationId={selection.relationId}
              />
            ))}
          </div>
        </div>
      </div>

      {editing && typeEditRelationId && <DiscourseRelationPicker />}

    </div>
  );
}
