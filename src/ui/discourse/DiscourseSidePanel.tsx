import { useDiscourseStore } from '@/state';
import { DiscourseRelationTypeSchema } from '@/domain/schema';
import { formatRange, relationTypeLabel } from '@/domain/discourse';
import { DiscourseToolbar } from './DiscourseToolbar';

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
 *   3. the selected RELATION's own detail card — type (optional), label,
 *      confidence, its OWN notes, marker evidence, delete. Clicking an arc in
 *      the gutter selects the relation directly (no unit needed).
 */
export function DiscourseSidePanel() {
  const doc = useDiscourseStore((s) => s.doc);
  const selection = useDiscourseStore((s) => s.selection);
  const select = useDiscourseStore((s) => s.select);
  const labelUnit = useDiscourseStore((s) => s.labelUnit);
  const setUnitNotes = useDiscourseStore((s) => s.setUnitNotes);
  const updateRelation = useDiscourseStore((s) => s.updateRelation);
  const deleteRelation = useDiscourseStore((s) => s.deleteRelation);

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
  // Markers on either end of the selected relation, offered as evidence.
  const relationMarkers = selectedRelation
    ? doc.markers.filter(
        (m) =>
          m.scopeUnitId === selectedRelation.sourceUnitId ||
          m.scopeUnitId === selectedRelation.targetUnitId,
      )
    : [];

  return (
    <aside className="discourse-side-panel" aria-label="Discourse tools and details">
      <DiscourseToolbar />

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
            <label className="field">
              <span>Notes</span>
              <textarea
                key={`n_${selectedUnit.id}`}
                defaultValue={selectedUnit.notes ?? ''}
                rows={2}
                placeholder="Observations about this unit…"
                onBlur={(e) => {
                  if (e.target.value !== (selectedUnit.notes ?? ''))
                    setUnitNotes(selectedUnit.id, e.target.value);
                }}
              />
            </label>
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
          <label className="field">
            <span>Notes</span>
            <textarea
              key={`rn_${selectedRelation.id}`}
              defaultValue={selectedRelation.notes ?? ''}
              rows={2}
              placeholder="Why these two units correspond…"
              onBlur={(e) =>
                updateRelation(selectedRelation.id, { notes: e.target.value.trim() || undefined })
              }
            />
          </label>
          {relationMarkers.length > 0 && (
            <fieldset className="discourse-relation-markers">
              <legend>Marker evidence</legend>
              {relationMarkers.map((m) => {
                const attached = selectedRelation.markerIds?.includes(m.id) ?? false;
                return (
                  <label key={m.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={attached}
                      onChange={(e) => {
                        const cur = selectedRelation.markerIds ?? [];
                        const next = e.target.checked
                          ? [...cur, m.id]
                          : cur.filter((id) => id !== m.id);
                        updateRelation(selectedRelation.id, {
                          markerIds: next.length ? next : undefined,
                        });
                      }}
                    />
                    <span className="greek">{m.surface}</span> <span>({m.ref})</span>
                  </label>
                );
              })}
            </fieldset>
          )}
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
