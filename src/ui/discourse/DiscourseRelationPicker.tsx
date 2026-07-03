import { useState } from 'react';
import { useDiscourseStore } from '@/state';
import { DiscourseRelationTypeSchema, type DiscourseRelationType } from '@/domain/schema';
import { formatRange, relationTypeLabel } from '@/domain/discourse';

/**
 * Optional relation-TYPE modal — shown AFTER the connector already exists (the
 * link is created the moment both ends are picked). Relation type is optional
 * metadata: choose one, add a label, leave it untyped, or delete the link.
 * Dismissing (✕ / Escape / "Leave untyped") NEVER removes the connector.
 */
export function DiscourseRelationPicker() {
  const doc = useDiscourseStore((s) => s.doc);
  const relationId = useDiscourseStore((s) => s.typeEditRelationId);
  const setRelationType = useDiscourseStore((s) => s.setRelationType);
  const deleteRelation = useDiscourseStore((s) => s.deleteRelation);
  const close = useDiscourseStore((s) => s.closeRelationTypeEditor);
  const relation = doc?.relations.find((r) => r.id === relationId);
  const [label, setLabel] = useState(relation?.label ?? '');

  if (!doc || !relation) return null;
  const name = (id: string) => {
    const u = doc.units.find((x) => x.id === id);
    return u ? u.label || formatRange(u.refStart, u.refEnd) || u.kind : id;
  };

  const chooseType = (type: DiscourseRelationType) => {
    setRelationType(relation.id, type, label.trim() || undefined);
    close();
  };
  const leaveUntyped = () => {
    // Persist a type-free link — keeping any label the user typed.
    setRelationType(relation.id, undefined, label.trim() || undefined);
    close();
  };
  const removeLink = () => {
    deleteRelation(relation.id);
    close();
  };

  return (
    <div className="discourse-relation-picker" role="dialog" aria-label="Relation type (optional)">
      <div className="discourse-relation-picker-head">
        <strong>
          {name(relation.sourceUnitId)} → {name(relation.targetUnitId)}
        </strong>
        <button className="mini" onClick={close} aria-label="Close — keep the link untyped">
          ✕
        </button>
      </div>
      <p className="discourse-note">
        The connection is created. Add a relation type (optional), or leave it untyped.
      </p>
      <label className="field">
        <span>Label (optional)</span>
        <input
          value={label}
          placeholder="e.g. “ground for the command”, “A ↔ A′”"
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <div className="discourse-relation-types">
        {DiscourseRelationTypeSchema.options.map((t) => (
          <button
            key={t}
            className={`mini${relation.type === t ? ' accept' : ''}`}
            onClick={() => chooseType(t)}
          >
            {relationTypeLabel(t)}
          </button>
        ))}
      </div>
      <div className="discourse-relation-picker-actions">
        <button className="mini" onClick={leaveUntyped}>
          Leave untyped
        </button>
        <button className="mini danger" onClick={removeLink} aria-label="Delete this link">
          Delete link
        </button>
      </div>
    </div>
  );
}
