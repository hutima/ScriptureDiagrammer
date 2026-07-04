import { useEditorStore, useDiscourseStore } from '@/state';
import {
  DISCOURSE_RELATION_COLORS,
  DiscourseRelationTypeSchema,
} from '@/domain/schema';
import type { DiscourseRelationColor } from '@/domain/schema';
import {
  DISCOURSE_RELATION_PALETTE,
  formatRange,
  isSafeHexColor,
  relationTypeLabel,
  resolvedRelationColor,
} from '@/domain/discourse';
import { DiscourseToolbar } from './DiscourseToolbar';
import { SwatchRow } from './DiscourseSwatchRow';

/**
 * A row of relation-colour swatches plus an "Auto" reset. Distinct from the
 * unit `SwatchRow` because the relation palette (`DISCOURSE_RELATION_COLORS`) is
 * its own named set; "Auto" clears the override so the arc reverts to its
 * type-derived default colour.
 */
function RelationColorRow({
  active,
  onPick,
  onClear,
}: {
  active: DiscourseRelationColor | undefined;
  onPick: (color: DiscourseRelationColor) => void;
  onClear: () => void;
}) {
  return (
    <div className="discourse-swatch-row">
      <button
        type="button"
        className={`mini${active === undefined ? ' active' : ''}`}
        aria-pressed={active === undefined}
        title="Use the relation type's default colour"
        onClick={onClear}
      >
        Auto
      </button>
      {DISCOURSE_RELATION_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`discourse-swatch${active === c ? ' active' : ''}`}
          style={{ background: DISCOURSE_RELATION_PALETTE[c] }}
          aria-label={`Relation colour ${c}`}
          aria-pressed={active === c}
          title={c}
          onClick={() => (active === c ? onClear() : onPick(c))}
        />
      ))}
    </div>
  );
}

/**
 * DISCOURSE SIDE PANEL — the tools + details column. Docked on the RIGHT of the
 * outline when there is enough horizontal space (CSS media query; it wraps
 * below the outline on narrow layouts). Available in EVERY app mode — Discourse
 * is manual-first, so the action buttons (relate, indent, split, merge…) and
 * the detail editors are not gated on Edit mode.
 *
 * Three stacked sections:
 *   1. the action toolbar (every keyboard shortcut has a button);
 *   2. the selected UNIT's details — label, notes, and its relations;
 *   3. the selected RELATION's own detail card — a vertical stack of type
 *      (optional), label, confidence, colour, its OWN notes, a relation-
 *      highlights placeholder, and delete. Clicking an arc selects the relation
 *      directly (no unit needed).
 */
export function DiscourseSidePanel() {
  const appMode = useEditorStore((s) => s.appMode);
  const doc = useDiscourseStore((s) => s.doc);
  const view = useDiscourseStore((s) => s.view);
  const setView = useDiscourseStore((s) => s.setView);
  const selection = useDiscourseStore((s) => s.selection);
  const select = useDiscourseStore((s) => s.select);
  const labelUnit = useDiscourseStore((s) => s.labelUnit);
  const setUnitNotes = useDiscourseStore((s) => s.setUnitNotes);
  const setUnitColor = useDiscourseStore((s) => s.setUnitColor);
  const highlightPickUnitId = useDiscourseStore((s) => s.highlightPickUnitId);
  const beginHighlight = useDiscourseStore((s) => s.beginHighlight);
  const highlightColor = useDiscourseStore((s) => s.highlightColor);
  const setHighlightColor = useDiscourseStore((s) => s.setHighlightColor);
  const removeTextHighlight = useDiscourseStore((s) => s.removeTextHighlight);
  const relationHighlightPickRelationId = useDiscourseStore(
    (s) => s.relationHighlightPickRelationId,
  );
  const beginRelationHighlight = useDiscourseStore((s) => s.beginRelationHighlight);
  const endRelationHighlight = useDiscourseStore((s) => s.endRelationHighlight);
  const updateRelation = useDiscourseStore((s) => s.updateRelation);
  const deleteRelation = useDiscourseStore((s) => s.deleteRelation);
  const relationDetailsCollapsed = useDiscourseStore((s) => s.relationDetailsCollapsed);
  const setRelationDetailsCollapsed = useDiscourseStore((s) => s.setRelationDetailsCollapsed);

  if (!doc) return null;

  const selectedUnit = selection.unitId
    ? doc.units.find((u) => u.id === selection.unitId)
    : undefined;
  const selectedRelation = selection.relationId
    ? doc.relations.find((r) => r.id === selection.relationId)
    : undefined;
  const unitRelations = selectedUnit
    ? doc.relations.filter(
        (r) => r.sourceUnitId === selectedUnit.id || r.targetUnitId === selectedUnit.id,
      )
    : [];
  const unitName = (id: string) => {
    const u = doc.units.find((x) => x.id === id);
    if (!u) return id;
    return u.label || formatRange(u.refStart, u.refEnd) || u.kind;
  };

  const relationSide = view.relationSide ?? 'right';

  return (
    <aside className="discourse-side-panel" aria-label="Discourse tools and details">
      {/* A pure reading/view preference (which side the relation-arc gutter
          renders on) — NOT a structural edit, so it lives here, always
          rendered, rather than inside the Edit-mode-only toolbar below. */}
      <div className="discourse-relation-side-row">
        <span className="discourse-toolbar-group-label">Relation side</span>
        <div className="lang-toggle" role="group" aria-label="Relation side">
          <button
            type="button"
            className={relationSide === 'left' ? 'active' : ''}
            aria-pressed={relationSide === 'left'}
            title="Draw relation arcs in a gutter on the left"
            onClick={() => setView({ relationSide: 'left' })}
          >
            Left
          </button>
          <button
            type="button"
            className={relationSide === 'right' ? 'active' : ''}
            aria-pressed={relationSide === 'right'}
            title="Draw relation arcs in a gutter on the right"
            onClick={() => setView({ relationSide: 'right' })}
          >
            Right
          </button>
        </div>
      </div>

      {/* The action toolbar is Edit-mode only (D5) — Explore/Study read cleanly
          without structural editing controls. */}
      {appMode === 'edit' && <DiscourseToolbar />}

      {selectedUnit && (
        <section className="discourse-inspector" aria-label="Selected unit details">
          <div className="discourse-inspector-head">
            <strong>
              {selectedUnit.label ||
                formatRange(selectedUnit.refStart, selectedUnit.refEnd) ||
                selectedUnit.kind}
            </strong>
            <span className="discourse-inspector-meta">
              {selectedUnit.kind}
              {selectedUnit.refStart &&
                ` · ${formatRange(selectedUnit.refStart, selectedUnit.refEnd)}`}
              {` · ${selectedUnit.provenance.source === 'manual' ? 'your structure' : 'from source boundaries'}`}
            </span>
            <button className="mini" onClick={() => select({})} aria-label="Close details">
              ✕
            </button>
          </div>

          <div className="discourse-inspector-edit">
            <label className="field">
              <span>Label</span>
              <input
                key={selectedUnit.id}
                defaultValue={selectedUnit.label ?? ''}
                placeholder="A, B′, “Household code”…"
                onBlur={(e) => {
                  if (e.target.value !== (selectedUnit.label ?? ''))
                    labelUnit(selectedUnit.id, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
              />
            </label>
            <label className="field discourse-notes-field">
              <span>Notes</span>
              <textarea
                key={`n_${selectedUnit.id}`}
                defaultValue={selectedUnit.notes ?? ''}
                placeholder="Observations about this unit…"
                onBlur={(e) => {
                  if (e.target.value !== (selectedUnit.notes ?? ''))
                    setUnitNotes(selectedUnit.id, e.target.value);
                }}
              />
            </label>
          </div>

          <div className="field discourse-color-field">
            <span>Color</span>
            <SwatchRow
              active={selectedUnit.color}
              onPick={(c) => setUnitColor(selectedUnit.id, c)}
              onClear={() => setUnitColor(selectedUnit.id, undefined)}
              ariaPrefix="Tag"
            />
          </div>

          <div className="field discourse-color-field">
            <span>Highlight text</span>
            <div className="discourse-swatch-row">
              <button
                type="button"
                className={`mini${highlightPickUnitId === selectedUnit.id ? ' active' : ''}`}
                aria-pressed={highlightPickUnitId === selectedUnit.id}
                onClick={() =>
                  beginHighlight(highlightPickUnitId === selectedUnit.id ? null : selectedUnit.id)
                }
              >
                {highlightPickUnitId === selectedUnit.id ? 'Click-drag the words…' : 'Highlight…'}
              </button>
              <SwatchRow active={highlightColor} onPick={setHighlightColor} ariaPrefix="Highlight color" />
            </div>
            {selectedUnit.textHighlights?.length ? (
              <ul className="discourse-inspector-relations" aria-label="Text highlights">
                {selectedUnit.textHighlights.map((h) => {
                  const words = h.tokenIds
                    .map((tid) => doc.tokens.find((t) => t.id === tid)?.surface ?? '')
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <li key={h.id}>
                      <span className={`discourse-swatch swatch-${h.color}`} aria-hidden="true" />{' '}
                      <span>{words}</span>{' '}
                      <button
                        className="mini"
                        aria-label="Remove highlight"
                        onClick={() => removeTextHighlight(selectedUnit.id, h.id)}
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="discourse-inspector-notes muted">No highlights yet.</p>
            )}
          </div>

          {unitRelations.length > 0 ? (
            <ul className="discourse-inspector-relations" aria-label="Relations for this unit">
              {unitRelations.map((r) => (
                <li key={r.id}>
                  <button
                    className={`discourse-rel-item${selection.relationId === r.id ? ' selected' : ''}`}
                    title="Show this relation's details"
                    onClick={() => select({ unitId: selectedUnit.id, relationId: r.id })}
                  >
                    <span className="discourse-rel-type">
                      {r.label || relationTypeLabel(r.type) || 'link'}
                    </span>{' '}
                    {unitName(r.sourceUnitId)} → {unitName(r.targetUnitId)}
                    {r.confidence ? ` (${r.confidence})` : ''}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="discourse-inspector-notes muted">
              No relations touch this unit yet. Use “Relate →” above to draw one.
            </p>
          )}
        </section>
      )}

      {selectedRelation && (
        <section className="discourse-relation-editor" aria-label="Relation details">
          <div className="discourse-inspector-head">
            <strong>
              {unitName(selectedRelation.sourceUnitId)} → {unitName(selectedRelation.targetUnitId)}
            </strong>
            <button
              className="mini"
              onClick={() => select({ unitId: selection.unitId })}
              aria-label="Close relation details"
            >
              ✕
            </button>
          </div>
          {/* Collapsible "Style & details" — Type/Label/Confidence/Color/Dash/
              Width. Open by default; collapsing frees vertical space for Notes
              below (the same flex chain #1 fixes). The header above and Notes/
              highlights/delete below always stay visible. Persisted separately
              from the toolbar's collapse pref
              (`kr:discoursePref:relationDetailsCollapsed`). */}
          <button
            type="button"
            className="discourse-outline-toggle discourse-relation-details-toggle"
            aria-expanded={!relationDetailsCollapsed}
            aria-controls="discourse-relation-details"
            onClick={() => setRelationDetailsCollapsed(!relationDetailsCollapsed)}
          >
            <span aria-hidden="true">{relationDetailsCollapsed ? '▸' : '▾'}</span>
            Style &amp; details
          </button>
          {!relationDetailsCollapsed && (
            <div id="discourse-relation-details" className="discourse-relation-details">
              <label className="field">
                <span>Type (optional)</span>
                <select
                  value={selectedRelation.type ?? ''}
                  onChange={(e) =>
                    updateRelation(selectedRelation.id, {
                      type: (e.target.value || undefined) as typeof selectedRelation.type,
                    })
                  }
                >
                  <option value="">(untyped)</option>
                  {DiscourseRelationTypeSchema.options.map((t) => (
                    <option key={t} value={t}>
                      {relationTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Label</span>
                <input
                  key={selectedRelation.id}
                  defaultValue={selectedRelation.label ?? ''}
                  placeholder="A ↔ A′, “ground for the command”…"
                  onBlur={(e) =>
                    updateRelation(selectedRelation.id, { label: e.target.value.trim() || undefined })
                  }
                />
              </label>
              <label className="field">
                <span>Confidence</span>
                <select
                  value={selectedRelation.confidence ?? ''}
                  onChange={(e) =>
                    updateRelation(selectedRelation.id, {
                      confidence: (e.target.value || undefined) as 'high' | 'medium' | 'low' | undefined,
                    })
                  }
                >
                  <option value="">—</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
              </label>
              <div className="field discourse-relation-color-field">
                <span>Color</span>
                <RelationColorRow
                  active={selectedRelation.color}
                  // Picking a NAMED swatch also clears any custom hex override, so
                  // the two controls never disagree about which one is "active".
                  onPick={(c) => updateRelation(selectedRelation.id, { color: c, customColor: undefined })}
                  onClear={() => updateRelation(selectedRelation.id, { color: undefined, customColor: undefined })}
                />
                <input
                  type="color"
                  aria-label="Custom relation colour"
                  title="Custom colour"
                  className="discourse-color-input"
                  value={
                    isSafeHexColor(selectedRelation.customColor)
                      ? selectedRelation.customColor
                      : resolvedRelationColor(selectedRelation)
                  }
                  onChange={(e) => updateRelation(selectedRelation.id, { customColor: e.target.value })}
                />
                <span className="discourse-color-input-label">Custom</span>
              </div>
              <label className="field">
                <span>Dash</span>
                <select
                  value={selectedRelation.strokeDash ?? 'default'}
                  onChange={(e) =>
                    updateRelation(selectedRelation.id, {
                      strokeDash:
                        e.target.value === 'default'
                          ? undefined
                          : (e.target.value as NonNullable<typeof selectedRelation.strokeDash>),
                    })
                  }
                >
                  <option value="default">Default</option>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="dash-dot">Dash-dot</option>
                </select>
              </label>
              <label className="field">
                <span>Width</span>
                <select
                  value={selectedRelation.strokeWidth ?? 'default'}
                  onChange={(e) =>
                    updateRelation(selectedRelation.id, {
                      strokeWidth:
                        e.target.value === 'default'
                          ? undefined
                          : (e.target.value as NonNullable<typeof selectedRelation.strokeWidth>),
                    })
                  }
                >
                  <option value="default">Default</option>
                  <option value="thin">Thin</option>
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="thick">Thick</option>
                </select>
              </label>
            </div>
          )}
          <label className="field discourse-notes-field">
            <span>Notes</span>
            <textarea
              key={`rn_${selectedRelation.id}`}
              defaultValue={selectedRelation.notes ?? ''}
              placeholder="Why these two units correspond…"
              onBlur={(e) =>
                updateRelation(selectedRelation.id, { notes: e.target.value.trim() || undefined })
              }
            />
          </label>
          {/* Relation-scope text highlights (D2 relation half): a "Highlight
              words in passage" pick mode + a summary list of this relation's
              spans (unit ref + words), each removable. NOT token checkboxes. */}
          {(() => {
            const picking = relationHighlightPickRelationId === selectedRelation.id;
            const spans = doc.units.flatMap((u) =>
              (u.textHighlights ?? [])
                .filter((h) => h.scope === 'relation' && h.relationId === selectedRelation.id)
                .map((h) => {
                  const words = h.tokenIds
                    .map((tid) => doc.tokens.find((t) => t.id === tid)?.surface ?? '')
                    .filter(Boolean)
                    .join(' ');
                  const shown = words.length > 42 ? `${words.slice(0, 42).trimEnd()}…` : words;
                  return { unitId: u.id, hid: h.id, ref: unitName(u.id), words: shown };
                }),
            );
            return (
              <div className="field discourse-relation-highlights">
                <span>Relation highlights</span>
                <button
                  type="button"
                  className={`mini${picking ? ' active' : ''}`}
                  aria-pressed={picking}
                  onClick={() =>
                    picking
                      ? endRelationHighlight()
                      : beginRelationHighlight(selectedRelation.id)
                  }
                >
                  {picking ? 'Done' : 'Highlight words in passage'}
                </button>
                {spans.length ? (
                  <ul className="discourse-inspector-relations" aria-label="Relation highlights">
                    {spans.map((s) => (
                      <li key={s.hid}>
                        <span className="discourse-rel-type">{s.ref}</span>{' '}
                        <span>{s.words}</span>{' '}
                        <button
                          className="mini"
                          aria-label="Remove relation highlight"
                          onClick={() => removeTextHighlight(s.unitId, s.hid)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="discourse-inspector-notes muted">
                    {picking
                      ? 'Drag across words in the passage to highlight them for this relation.'
                      : 'No highlighted words yet.'}
                  </p>
                )}
              </div>
            );
          })()}
          <div className="discourse-relation-picker-actions">
            <button
              className="mini danger"
              onClick={() => {
                deleteRelation(selectedRelation.id);
                select({ unitId: selection.unitId });
              }}
            >
              Delete relation
            </button>
          </div>
        </section>
      )}

      {!selectedUnit && !selectedRelation && (
        <p className="discourse-inspector-notes muted">
          Select a unit — or click an arc — to see its details here.
        </p>
      )}
    </aside>
  );
}
