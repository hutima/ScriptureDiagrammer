import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDiscourseStore } from '@/state';
import type { DiscourseDocument } from '@/domain/schema';
import {
  childUnits,
  discourseRows,
  visibleRelationEndpoints,
} from '@/domain/discourse';
import { DiscourseUnitBlock } from './DiscourseUnitBlock';
import { DiscourseRelationLayer, type ArcSpec } from './DiscourseRelationLayer';
import { DiscourseRelationPicker } from './DiscourseRelationPicker';

/** Width of the RIGHT gutter the relation arcs live in. */
const ARC_GUTTER = 132;

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
  const extendMultiSelect = useDiscourseStore((s) => s.extendMultiSelect);
  const pendingRelationSource = useDiscourseStore((s) => s.pendingRelationSource);
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
  const setUnitIndent = useDiscourseStore((s) => s.setUnitIndent);
  const nudgeUnitIndent = useDiscourseStore((s) => s.nudgeUnitIndent);
  const mergeWithPrevious = useDiscourseStore((s) => s.mergeWithPrevious);
  const deleteUnit = useDiscourseStore((s) => s.deleteUnit);
  const undo = useDiscourseStore((s) => s.undo);
  const redo = useDiscourseStore((s) => s.redo);

  const rows = useMemo(() => discourseRows(doc), [doc]);
  const visibleRows = useMemo(() => rows.filter((r) => r.visible), [rows]);

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
  const unitEls = useRef(new Map<string, HTMLElement>());
  const registerEl = useCallback((unitId: string, el: HTMLElement | null) => {
    if (el) unitEls.current.set(unitId, el);
    else unitEls.current.delete(unitId);
  }, []);

  const [arcs, setArcs] = useState<ArcSpec[]>([]);
  const [contentHeight, setContentHeight] = useState(0);

  const measure = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    const cTop = content.getBoundingClientRect().top;
    const endpoints = visibleRelationEndpoints(doc, rows);
    const mid = (id: string): number | null => {
      const el = unitEls.current.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.top - cTop + r.height / 2;
    };
    const next: ArcSpec[] = [];
    for (const e of endpoints) {
      const y1 = mid(e.sourceId);
      const y2 = mid(e.targetId);
      if (y1 == null || y2 == null) continue;
      next.push({ relation: e.relation, y1, y2 });
    }
    setArcs(next);
    setContentHeight(content.scrollHeight);
  }, [doc, rows]);

  useEffect(() => {
    measure();
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(content);
    return () => ro.disconnect();
  }, [measure, view]);

  // --- selection / edit interactions ---------------------------------------------
  const onUnitSelect = useCallback(
    (unitId: string, opts: { shift: boolean }) => {
      if (editing && pendingRelationSource && pendingRelationSource !== unitId) {
        // Target picked → create the connector immediately (untyped); the type
        // modal opens next for optional metadata.
        pickRelationTarget(unitId);
        return;
      }
      if (editing && opts.shift) {
        extendMultiSelect(unitId);
        return;
      }
      select(selection.unitId === unitId ? {} : { unitId });
    },
    [editing, pendingRelationSource, selection.unitId, select, pickRelationTarget, extendMultiSelect],
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
        else if (editing && splitPickUnitId) beginSplit(null);
        // Before a target is picked → cancel, no link is created.
        else if (editing && pendingRelationSource) cancelRelation();
        // After the link exists (modal open) → close the modal, KEEP the link.
        else if (editing && typeEditRelationId) closeRelationTypeEditor();
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
    [editing, studyMode, studySelection, clearStudySelection, doc, selection.unitId, splitPickUnitId, highlightPickUnitId, pendingRelationSource, typeEditRelationId, beginSplit, beginHighlight, cancelRelation, closeRelationTypeEditor, select, undo, redo, nudgeUnitIndent, mergeWithPrevious, deleteUnit],
  );

  const multiSet = useMemo(() => new Set(multiSelected), [multiSelected]);

  return (
    <div className="discourse-view" onKeyDown={onKeyDown}>
      {editing && pendingRelationSource && (
        <div className="discourse-relate-banner" role="status">
          Relating — click another unit to connect to it. <kbd>Esc</kbd> to cancel.
        </div>
      )}
      <div
        className="discourse-scroll"
        onClick={() => {
          if (pendingRelationSource) cancelRelation();
          else if (studyMode && studySelection) clearStudySelection();
          else select({});
        }}
      >
        <div
          className="discourse-content"
          ref={contentRef}
          style={{ paddingRight: view.showRelations ? ARC_GUTTER : 16 }}
        >
          {view.showRelations && (
            <div className="discourse-gutter" style={{ width: ARC_GUTTER }}>
              <DiscourseRelationLayer
                arcs={arcs}
                height={contentHeight}
                gutter={ARC_GUTTER}
                selectedRelationId={selection.relationId}
                onSelect={(relationId) => select({ relationId })}
              />
            </div>
          )}
          <div role="list" aria-label={`Discourse units for ${doc.title}`}>
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
              />
            ))}
          </div>
        </div>
      </div>

      {editing && typeEditRelationId && <DiscourseRelationPicker />}

    </div>
  );
}
