import { memo } from 'react';
import type { DiscourseRelation } from '@/domain/schema';
import { resolvedRelationColor, relationTypeLabel } from '@/domain/discourse';

/**
 * SVG overlay drawing relation arcs/brackets in the RIGHT gutter of the
 * discourse view. Arcs connect the vertical midpoints of the two unit blocks;
 * nested (shorter) arcs sit closer to the text (smaller x) so crossings stay
 * readable, stepping OUTWARD (rightward) per lane. Arcs are never the ONLY
 * reading of a relation — the unit inspector lists relations textually for the
 * selected unit.
 */

export interface ArcSpec {
  relation: DiscourseRelation;
  /** Content-relative y midpoints of the two endpoint blocks. */
  y1: number;
  y2: number;
}

export const DiscourseRelationLayer = memo(function DiscourseRelationLayer({
  arcs,
  height,
  gutter,
  selectedRelationId,
  onSelect,
}: {
  arcs: ArcSpec[];
  height: number;
  gutter: number;
  selectedRelationId?: string;
  onSelect?: (relationId: string) => void;
}) {
  if (!arcs.length || height <= 0) return null;
  // Shorter spans hug the text; longer spans bow farther into the gutter.
  const sorted = [...arcs].sort(
    (a, b) => Math.abs(a.y1 - a.y2) - Math.abs(b.y1 - b.y2),
  );
  // Lane assignment by greedy interval-graph colouring (like the KR line packer):
  // two arcs share a lane ONLY when their vertical spans don't overlap, so a
  // relation nested inside another is pushed to its own lane while independent
  // arcs elsewhere in the passage reuse lane 0. This keeps clashing minimal
  // instead of spending one lane per relation.
  const lanes = new Map<string, number>();
  const placed: { lane: number; top: number; bottom: number }[] = [];
  for (const a of sorted) {
    const top = Math.min(a.y1, a.y2);
    const bottom = Math.max(a.y1, a.y2);
    // Strict overlap (touching endpoints don't count as a clash).
    const taken = new Set(
      placed.filter((p) => p.top < bottom && p.bottom > top).map((p) => p.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane++;
    lanes.set(a.relation.id, lane);
    placed.push({ lane, top, bottom });
  }
  const laneCount = Math.max(1, ...[...lanes.values()].map((l) => l + 1));
  const laneStep = Math.max(12, Math.min(22, (gutter - 16) / laneCount));

  return (
    <svg
      className="discourse-arcs"
      width={gutter}
      height={height}
      viewBox={`0 0 ${gutter} ${height}`}
      aria-hidden="true"
    >
      {sorted.map((a) => {
        const { relation } = a;
        const color = resolvedRelationColor(relation);
        const lane = lanes.get(relation.id) ?? 0;
        // Anchor at the LEFT edge of the (right-side) gutter, next to the text;
        // arcs bow OUTWARD to the right, deeper lanes stepping farther out.
        const x0 = 2;
        const x = Math.min(gutter - 8, x0 + 8 + lane * laneStep);
        const top = Math.min(a.y1, a.y2);
        const bottom = Math.max(a.y1, a.y2);
        const selected = relation.id === selectedRelationId;
        const midY = (top + bottom) / 2;
        const typeLabel = relationTypeLabel(relation.type);
        const label = relation.label || typeLabel; // '' for a bare untyped link
        // Tooltip: "<label> — <type>" collapses gracefully when either is empty.
        const title = [label, typeLabel].filter(Boolean).join(' — ') || 'link';
        const paired = relation.type === 'chiasm' || relation.type === 'parallel' || relation.type === 'inclusio';
        return (
          <g
            key={relation.id}
            className={`discourse-arc${selected ? ' selected' : ''}`}
            style={{ cursor: onSelect ? 'pointer' : 'default', pointerEvents: 'all' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(relation.id);
            }}
          >
            <title>
              {title}
              {relation.confidence ? ` (${relation.confidence})` : ''}
            </title>
            {/* Bracket-style path: out from the source, down/up, back to target. */}
            <path
              d={`M ${x0} ${a.y1} H ${x} V ${a.y2} H ${x0}`}
              fill="none"
              stroke={color}
              strokeWidth={selected ? 2.4 : 1.6}
              strokeDasharray={paired ? '5 3' : undefined}
              opacity={selected ? 1 : 0.8}
            />
            {/* Arrowhead pointing back (leftward) into the target end, toward
                the text the arc lands on. */}
            <path
              d={`M ${x0 + 5} ${a.y2 - 4} L ${x0} ${a.y2} L ${x0 + 5} ${a.y2 + 4}`}
              fill="none"
              stroke={color}
              strokeWidth={selected ? 2.2 : 1.6}
            />
            {label && (
              <text
                x={x + 3}
                y={midY}
                className="discourse-arc-label"
                fill={color}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(90 ${x + 3} ${midY})`}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});
