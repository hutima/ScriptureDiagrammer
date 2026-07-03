import { memo } from 'react';
import type { LaidOutRelation, RelationSide } from '@/domain/discourse';
import { relationTypeLabel } from '@/domain/discourse';

/**
 * SVG overlay drawing relation arcs/brackets beside the discourse outline —
 * the RIGHT gutter by default, or the LEFT gutter when `side:'left'`. Pure
 * presentation: every geometric decision (lane packing, endpoint nudging,
 * the gutter width) was already made by `layoutDiscourseRelations`
 * (`domain/discourse/relationLayout.ts`), the same helper the SVG/PDF export
 * uses, so a printed page matches the screen. This component only maps the
 * helper's side-agnostic "outward axis" `u` to a screen x and draws paths.
 *
 * SELECTABILITY: each relation gets its own wide (12px) INVISIBLE hit path
 * with `pointerEvents:'stroke'`, separate from the thin visible stroke (which
 * has `pointerEvents:'none'`). Earlier this component put `pointerEvents:'all'`
 * on a <g> wrapping both — with several arcs' paths overlapping in the
 * gutter, a selected/coloured arc's group could sit on top and swallow clicks
 * meant for a neighbour, and there was no forgiving hit target at all for a
 * thin 1.6px stroke. Splitting hit vs. visible geometry, and keeping hit
 * paths in stable (non-reordered) input order, means each relation only ever
 * claims its own stroke — a selected arc never monopolizes clicks.
 */

/** Outward-axis `u` (0 at the gutter/text boundary) → screen x. For a RIGHT
 *  gutter `u` already increases in screen-x direction (identity); for a LEFT
 *  gutter the axis points the other way, so it mirrors around the gutter's
 *  own width. Every path/arrowhead/label below is built in local `u`
 *  coordinates and passed through this one function, so the same shapes
 *  automatically point the right way on either side. */
function outwardToScreenX(u: number, side: RelationSide, gutterWidth: number): number {
  return side === 'right' ? u : gutterWidth - u;
}

export const DiscourseRelationLayer = memo(function DiscourseRelationLayer({
  relations,
  gutterWidth,
  side,
  height,
  selectedRelationId,
  onSelect,
}: {
  relations: LaidOutRelation[];
  gutterWidth: number;
  side: RelationSide;
  height: number;
  selectedRelationId?: string;
  onSelect?: (relationId: string) => void;
}) {
  if (!relations.length || height <= 0 || gutterWidth <= 0) return null;

  const sx = (u: number) => outwardToScreenX(u, side, gutterWidth);

  // The SELECTED relation's visible stroke draws LAST (on top of any
  // overlapping neighbour) — but this is a purely visual re-order; the hit
  // paths below are rendered in normal (stable, input) order so selecting one
  // relation never changes which one "wins" a click at an overlap.
  const visualOrder = selectedRelationId
    ? [...relations].sort(
        (a, b) =>
          (a.relation.id === selectedRelationId ? 1 : 0) -
          (b.relation.id === selectedRelationId ? 1 : 0),
      )
    : relations;

  return (
    <svg
      className="discourse-arcs"
      width={gutterWidth}
      height={height}
      viewBox={`0 0 ${gutterWidth} ${height}`}
      // Decorative overlay: the side panel's relation list / unit inspector is
      // the accessible path to the same correspondences, so the arcs (despite
      // being clickable for sighted mouse users) stay out of the AT tree.
      aria-hidden="true"
    >
      {/* Invisible WIDE hit targets — one per relation, stable input order. */}
      {relations.map((r) => {
        const { relation } = r;
        const typeLabel = relationTypeLabel(relation.type);
        const title = [relation.label, typeLabel].filter(Boolean).join(' — ') || 'link';
        const d = `M ${sx(r.a1)} ${r.y1} H ${sx(r.laneU)} V ${r.y2} H ${sx(r.a2)}`;
        return (
          <path
            key={`hit-${relation.id}`}
            d={d}
            fill="none"
            stroke="transparent"
            strokeWidth={12}
            style={{ cursor: onSelect ? 'pointer' : 'default', pointerEvents: 'stroke' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(relation.id);
            }}
          >
            <title>
              {title}
              {relation.confidence ? ` (${relation.confidence})` : ''}
            </title>
          </path>
        );
      })}

      {/* Visible strokes + labels. pointerEvents:'none' throughout — all
          interaction happens on the hit paths above. */}
      {visualOrder.map((r) => {
        const { relation } = r;
        const selected = relation.id === selectedRelationId;
        const laneX = sx(r.laneU);
        const tipX = sx(r.a2);
        const wingX = sx(r.a2 + 5); // 5px outward from the tip, toward the lane
        const midY = (r.top + r.bottom) / 2;
        return (
          <g
            key={relation.id}
            className={`discourse-arc${selected ? ' selected' : ''}`}
            style={{ pointerEvents: 'none' }}
          >
            {/* Bracket-style path: out from the source, down/up in its lane, back
                to the target. */}
            <path
              d={`M ${sx(r.a1)} ${r.y1} H ${laneX} V ${r.y2} H ${tipX}`}
              fill="none"
              stroke={r.color}
              strokeWidth={selected ? 2.4 : 1.6}
              strokeDasharray={r.dashed ? '5 3' : undefined}
              opacity={selected ? 1 : 0.8}
            />
            {/* Arrowhead at the target tip, pointing back toward the text. */}
            <path
              d={`M ${wingX} ${r.y2 - 4} L ${tipX} ${r.y2} L ${wingX} ${r.y2 + 4}`}
              fill="none"
              stroke={r.color}
              strokeWidth={selected ? 2.2 : 1.6}
            />
            {r.label && (
              <text
                x={sx(r.laneU + 3)}
                y={midY}
                className="discourse-arc-label"
                fill={r.color}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(90 ${sx(r.laneU + 3)} ${midY})`}
              >
                {r.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});
