import { useState } from 'react';
import { useDiscourseStore } from '@/state';
import { childUnits, MAX_USER_INDENT, MIN_USER_INDENT } from '@/domain/discourse';
import { SwatchRow } from './DiscourseSwatchRow';

/**
 * DISCOURSE EDIT TOOLBAR — mounted in the discourse canvas while the app is in
 * Edit mode. Every keyboard shortcut has a button here (accessibility rule),
 * and every button routes to the discourse store's pure-mutation wrappers:
 * split, merge, indent/outdent, move, group/ungroup, label, notes, relate,
 * undo/redo, reset. Nothing here touches the syntax editor.
 */
export function DiscourseToolbar() {
  const doc = useDiscourseStore((s) => s.doc);
  const selection = useDiscourseStore((s) => s.selection);
  const multi = useDiscourseStore((s) => s.multiSelectedUnitIds);
  const splitPickUnitId = useDiscourseStore((s) => s.splitPickUnitId);
  const pendingRelationSource = useDiscourseStore((s) => s.pendingRelationSource);
  const pendingRelationAwaitingSource = useDiscourseStore((s) => s.pendingRelationAwaitingSource);
  const multiSelectMode = useDiscourseStore((s) => s.multiSelectMode);
  const setMultiSelectMode = useDiscourseStore((s) => s.setMultiSelectMode);
  const setUnitsColor = useDiscourseStore((s) => s.setUnitsColor);
  const past = useDiscourseStore((s) => s.past);
  const future = useDiscourseStore((s) => s.future);
  const beginSplit = useDiscourseStore((s) => s.beginSplit);
  const mergeWithPrevious = useDiscourseStore((s) => s.mergeWithPrevious);
  const nudgeUnitIndent = useDiscourseStore((s) => s.nudgeUnitIndent);
  const moveUnit = useDiscourseStore((s) => s.moveUnit);
  const wrapUnits = useDiscourseStore((s) => s.wrapUnits);
  const unwrapUnit = useDiscourseStore((s) => s.unwrapUnit);
  const startRelation = useDiscourseStore((s) => s.startRelation);
  const startRelationDraft = useDiscourseStore((s) => s.startRelationDraft);
  const cancelRelation = useDiscourseStore((s) => s.cancelRelation);
  const undo = useDiscourseStore((s) => s.undo);
  const redo = useDiscourseStore((s) => s.redo);
  const resetEdits = useDiscourseStore((s) => s.resetEdits);
  const labelUnit = useDiscourseStore((s) => s.labelUnit);
  const addCommentRow = useDiscourseStore((s) => s.addCommentRow);
  const deleteUnit = useDiscourseStore((s) => s.deleteUnit);
  const toolbarGroupsCollapsed = useDiscourseStore((s) => s.toolbarGroupsCollapsed);
  const setToolbarGroupsCollapsed = useDiscourseStore((s) => s.setToolbarGroupsCollapsed);

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!doc) return null;
  const unit = selection.unitId ? doc.units.find((u) => u.id === selection.unitId) : undefined;
  const isLeaf = !!unit && unit.tokenIds.length > 0;
  const isContainer = !!unit && unit.tokenIds.length === 0 && childUnits(doc, unit.id).length > 0;
  const siblings = unit ? childUnits(doc, unit.parentId) : [];
  const siblingIndex = unit ? siblings.findIndex((u) => u.id === unit.id) : -1;
  const prevSibling = siblingIndex > 0 ? siblings[siblingIndex - 1] : undefined;
  const canMergePrev = !!unit && !!prevSibling && isLeaf && prevSibling.tokenIds.length > 0;
  const splitting = splitPickUnitId != null;
  // Relating in EITHER phase — awaiting the source unit (a draft started with
  // nothing selected) or awaiting the target (the normal, unit-first flow).
  const relating = pendingRelationSource != null || pendingRelationAwaitingSource;
  const relateMultiConflict = !relating && multi.length > 1;
  // Indent applies to the multi-selection when one exists, else the active unit.
  const indentTargets = multi.length > 1 ? multi : unit ? [unit.id] : [];

  const onRelateClick = () => {
    if (relating) {
      cancelRelation();
      return;
    }
    if (relateMultiConflict) return; // no-op — the hint below explains why
    if (unit) startRelation(unit.id);
    else startRelationDraft();
  };

  const promptLabel = () => {
    if (!unit) return;
    // A tiny inline prompt keeps the flow keyboard-friendly; the inspector's
    // label field offers the richer editing surface.
    const next = window.prompt('Unit label (A, B′, “Household code”…)', unit.label ?? '');
    if (next !== null) labelUnit(unit.id, next);
  };

  return (
    <div className="discourse-toolbar" role="toolbar" aria-label="Discourse editing">
      {/* PRIMARY — the marquee action, accent-filled, bigger than every other
          button, and first. Two-phase: with nothing selected it starts a
          source-first draft (`startRelationDraft`); with one unit selected it
          jumps straight to awaiting-target (`startRelation`), as before. */}
      <div className="discourse-toolbar-group primary">
        <button
          className={`mini primary discourse-relate-btn${relating ? ' active' : ''}`}
          disabled={relateMultiConflict}
          title={
            relating
              ? 'Cancel relating'
              : relateMultiConflict
                ? 'Leave multi-select or select a single source unit first'
                : unit
                  ? 'Relate this unit to another — click the target unit, then pick the relation type'
                  : 'Start relating — click the source unit, then the target unit'
          }
          onClick={onRelateClick}
        >
          {relating ? 'Cancel relate' : 'Relate →'}
        </button>
      </div>

      {/* Collapsible wrapper around the four "detail" groups (Structure,
          Indent/order, Annotation, History) — Relate (above) and Delete unit
          + the selection hint (below) always stay visible. Open by default;
          the collapsed state is a persisted UI preference so it survives
          reloads (`kr:discoursePref:toolbarGroupsCollapsed`). Matches the left
          panel's "Passage outline" disclosure (`.discourse-outline-toggle`). */}
      <button
        type="button"
        className="discourse-outline-toggle discourse-toolbar-groups-toggle"
        aria-expanded={!toolbarGroupsCollapsed}
        aria-controls="discourse-toolbar-groups"
        onClick={() => setToolbarGroupsCollapsed(!toolbarGroupsCollapsed)}
      >
        <span aria-hidden="true">{toolbarGroupsCollapsed ? '▸' : '▾'}</span>
        Editing tools
      </button>
      {!toolbarGroupsCollapsed && (
        <div id="discourse-toolbar-groups" className="discourse-toolbar-groups">
          {/* STRUCTURE — reshape the unit boundaries and grouping. Group/Ungroup
              only appear in multi-select mode — grouping is a multi-select
              action, kept visually apart from the single-unit Relate flow above. */}
          <div className="discourse-toolbar-group">
            <span className="discourse-toolbar-group-label">Structure</span>
            <button
              className={`mini${splitting ? ' accept' : ''}`}
              disabled={!isLeaf && !splitting}
              title="Split this unit — then click the word that should START the new unit (Enter)"
              onClick={() => beginSplit(splitting ? null : unit?.id ?? null)}
            >
              {splitting ? 'Cancel split' : 'Split'}
            </button>
            <button
              className="mini"
              disabled={!canMergePrev}
              title="Merge this unit into the previous one (Backspace)"
              onClick={() => unit && mergeWithPrevious(unit.id)}
            >
              Merge ←
            </button>
            <button
              className={`mini discourse-multiselect-btn${multiSelectMode ? ' active' : ''}`}
              aria-pressed={multiSelectMode}
              title="Toggle multi-select mode — click units to add them to a group selection"
              onClick={() => setMultiSelectMode(!multiSelectMode)}
            >
              Multi-select
            </button>
            <button
              className="mini"
              title={
                unit
                  ? 'Insert a blank comment row after this unit (leave the prompt empty for a blank spacer)'
                  : 'Insert a blank comment row (leave the prompt empty for a blank spacer)'
              }
              onClick={() => {
                const text = window.prompt('Comment (leave empty for a blank row)', '');
                // Cancel (null) does nothing; empty string ⇒ a blank spacer row.
                if (text !== null) addCommentRow(unit?.id, text);
              }}
            >
              + Comment row
            </button>
            {multiSelectMode && (
              <>
                <span className="discourse-multiselect-count">{multi.length} selected</span>
                <button
                  className="mini"
                  disabled={multi.length < 1}
                  title="Wrap the selected unit(s) in a new parent group"
                  onClick={() => {
                    const label = window.prompt('Group label (“Household code”, “A”…)', '');
                    if (label !== null) wrapUnits(multi, { label });
                  }}
                >
                  Group
                </button>
                <button
                  className="mini"
                  disabled={!isContainer}
                  title="Unwrap this group — its members take its place"
                  onClick={() => unit && unwrapUnit(unit.id)}
                >
                  Ungroup
                </button>
              </>
            )}
          </div>

          {/* Batch unit color — multi-select mode only, once at least one unit is
              selected. Applies to every selected unit in ONE undoable step. */}
          {multiSelectMode && multi.length >= 1 && (
            <div className="discourse-toolbar-group">
              <span className="discourse-toolbar-group-label">Color selected</span>
              <SwatchRow
                active={undefined}
                onPick={(c) => setUnitsColor(multi, c)}
                onClear={() => setUnitsColor(multi, undefined)}
                ariaPrefix="Tag selected"
              />
            </div>
          )}

          {/* INDENT / ORDER — reposition without changing structure. */}
          <div className="discourse-toolbar-group">
            <span className="discourse-toolbar-group-label">Indent / order</span>
            {/* Indent buttons drive the EXPLICIT per-line userIndent — the same
                action as the drag handle. Every line (including the first) moves
                independently; multi-selection nudges each selected line by 1.
                Structural nesting lives in Group/Ungroup, not here. */}
            <button
              className="mini"
              disabled={!unit || (indentTargets.length === 1 && (unit.userIndent ?? 0) >= MAX_USER_INDENT)}
              title="Indent this line one step (Tab) — independent of other lines"
              onClick={() => indentTargets.length && nudgeUnitIndent(indentTargets, 1)}
            >
              → Indent
            </button>
            <button
              className="mini"
              disabled={!unit || (indentTargets.length === 1 && (unit.userIndent ?? 0) <= MIN_USER_INDENT)}
              title="Outdent this line one step (Shift+Tab)"
              onClick={() => indentTargets.length && nudgeUnitIndent(indentTargets, -1)}
            >
              ← Outdent
            </button>
            <button
              className="mini"
              disabled={!unit || siblingIndex <= 0}
              title="Move up among siblings"
              onClick={() => unit && moveUnit(unit.id, -1)}
            >
              ↑
            </button>
            <button
              className="mini"
              disabled={!unit || siblingIndex < 0 || siblingIndex >= siblings.length - 1}
              title="Move down among siblings"
              onClick={() => unit && moveUnit(unit.id, +1)}
            >
              ↓
            </button>
          </div>

          {/* ANNOTATION */}
          <div className="discourse-toolbar-group">
            <span className="discourse-toolbar-group-label">Annotation</span>
            <button className="mini" disabled={!unit} title="Label this unit (A, B′, …)" onClick={promptLabel}>
              Label…
            </button>
          </div>

          {/* HISTORY — secondary/muted. */}
          <div className="discourse-toolbar-group subtle">
            <span className="discourse-toolbar-group-label">History</span>
            <button className="mini" disabled={!past.length} title="Undo (Ctrl/Cmd+Z)" onClick={undo}>
              ↶ Undo
            </button>
            <button className="mini" disabled={!future.length} title="Redo (Ctrl/Cmd+Shift+Z)" onClick={redo}>
              ↷ Redo
            </button>
            {confirmReset ? (
              <>
                <button
                  className="mini reject"
                  title="Discard ALL discourse edits for this range (syntax edits and sermon notes are untouched)"
                  onClick={() => {
                    resetEdits();
                    setConfirmReset(false);
                  }}
                >
                  Really reset?
                </button>
                <button className="mini" onClick={() => setConfirmReset(false)}>
                  Keep edits
                </button>
              </>
            ) : (
              <button
                className="mini"
                disabled={!past.length && !localHasPatch(doc.id)}
                title="Discard all discourse edits for this range — syntax edits and sermon notes are untouched"
                onClick={() => setConfirmReset(true)}
              >
                Reset edits…
              </button>
            )}
          </div>
        </div>
      )}

      {/* DESTRUCTIVE — separated, danger-styled, last. */}
      <div className="discourse-toolbar-group destructive">
        {confirmDelete && isContainer ? (
          <>
            <button
              className="mini reject"
              title="Delete this group AND every unit inside it (undoable)"
              onClick={() => {
                if (unit) deleteUnit(unit.id);
                setConfirmDelete(false);
              }}
            >
              Delete group + contents?
            </button>
            <button className="mini" onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
          </>
        ) : (
          <button
            className="mini reject"
            disabled={!unit}
            title={
              isContainer
                ? 'Delete this group and everything inside it'
                : 'Remove this verse / unit from the analysis (undoable; source text is untouched)'
            }
            onClick={() => {
              if (!unit) return;
              // Deleting a container drops its whole subtree — confirm first.
              if (isContainer) setConfirmDelete(true);
              else deleteUnit(unit.id);
            }}
          >
            {isContainer ? 'Delete group…' : 'Delete unit'}
          </button>
        )}
      </div>

      {splitting && (
        <span className="discourse-toolbar-hint">Click the word that should start the new unit.</span>
      )}
      {pendingRelationAwaitingSource && (
        <span className="discourse-toolbar-hint">Select source unit.</span>
      )}
      {pendingRelationSource != null && (
        <span className="discourse-toolbar-hint">Select target unit.</span>
      )}
      {relateMultiConflict && (
        <span className="discourse-toolbar-hint">
          Leave multi-select or select a single source unit first.
        </span>
      )}
      {multiSelectMode && !relating && (
        <span className="discourse-toolbar-hint">
          Click units to add/remove them from the selection. Shift-click still works too.
        </span>
      )}
      {!unit && !splitting && !relating && !multiSelectMode && (
        <span className="discourse-toolbar-hint">Select a unit to edit. Shift-click extends the selection.</span>
      )}
    </div>
  );
}

/** Whether a stored patch exists for this doc (enables Reset before any
 *  in-session edit). Best-effort localStorage read. */
function localHasPatch(discourseDocId: string): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(`kr:discourse:${discourseDocId}`) != null;
  } catch {
    return false;
  }
}
