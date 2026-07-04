import type { DiscourseRelation } from '@/domain/schema';
import {
  relationTypeLabel,
  resolvedRelationColor,
  resolvedRelationDashArray,
  resolvedRelationStrokeWidth,
} from './layout';

/**
 * DISCOURSE RELATION LAYOUT — the ONE pure, deterministic geometry helper that
 * both the on-screen SVG overlay (`ui/discourse/DiscourseRelationLayer`) and the
 * SVG/PDF outline export (`renderOutlineArcs` in `./export`) consume, replacing
 * the two hand-rolled greedy lane packers that had drifted apart.
 *
 * WHY a shared helper: relation "arcs" are really bracket-style perpendicular
 * paths in a gutter beside the text column — out from the source unit's y
 * midpoint, a vertical run in a lane, back to the target's y midpoint, with an
 * arrowhead at the target pointing back toward the text. The view and the export
 * MUST pack lanes and offset coincident endpoints identically or a printed page
 * won't match the screen. Keeping the math here — free of the DOM, React, and
 * any `src/ui` import — makes that guarantee mechanical and unit-testable.
 *
 * COORDINATE CONVENTION — the "outward axis" `u`:
 *   - `u = 0` sits at the text/gutter boundary;
 *   - `u` INCREASES away from the text (rightward for `side:'right'`, leftward
 *     for `side:'left'`).
 * The helper is side-agnostic in geometry: `side` is carried through but changes
 * no number today; a caller mirrors `u` to a screen x for a left gutter. The
 * path a consumer draws from a `LaidOutRelation` is:
 *
 *     M(a1, y1)  H(laneU)  V(y2)  H(a2)     + arrowhead at (a2, y2) toward -u
 *
 * so `a1`/`a2` are the endpoint tips (near the text), `laneU` is the outward
 * coordinate of the vertical run, and `y1`/`y2` are the (possibly nudged)
 * endpoint midpoints.
 */

export type RelationSide = 'left' | 'right';

/**
 * One relation to lay out, with its two endpoint y midpoints in content-relative
 * pixels. `a1`/`a2` optionally push a tip PAST the gutter's inner edge toward (or
 * into) the text along the outward axis: `0` sits on the boundary, negative
 * reaches into the text column (used by indent-aware left-side endpoints so a
 * bracket lands next to a deeply-indented row). Defaults to `0`.
 */
export interface RelationEndpointInput {
  relation: DiscourseRelation;
  /** Source unit y midpoint (content-relative px). */
  y1: number;
  /** Target unit y midpoint (content-relative px). */
  y2: number;
  /** Outward-axis tip of the source endpoint. ≤ 0 reaches into the text. Default 0. */
  a1?: number;
  /** Outward-axis tip of the target endpoint. ≤ 0 reaches into the text. Default 0. */
  a2?: number;
}

export interface RelationLayoutOptions {
  side: RelationSide;
  /** Render rotated labels beside each vertical run (widens the gutter). */
  showLabels: boolean;
  /** Distance between adjacent lanes' vertical runs. Defaults depend on `showLabels`. */
  laneStep?: number;
  /** Extra outward width reserved for the rotated labels (only when shown). */
  labelAllowance?: number;
  /** Per-collision endpoint nudge, in px (symmetric ±). Default 2. */
  endpointOffsetStep?: number;
  /** Clamp for the cumulative endpoint nudge, in px. Default 4. */
  maxEndpointOffset?: number;
  /** Padding from the text/gutter boundary to lane 0's vertical run. Default 8. */
  innerPad?: number;
}

export interface LaidOutRelation {
  relation: DiscourseRelation;
  /** 0-based lane index (0 hugs the text). */
  lane: number;
  /** Outward coordinate of the vertical run (`innerPad + lane * laneStep`). */
  laneU: number;
  /** Outward-axis tip of the source endpoint (resolved from input `a1`). */
  a1: number;
  /** Outward-axis tip of the target endpoint (resolved from input `a2`). */
  a2: number;
  /** Source y after deterministic endpoint-collision nudging. */
  y1: number;
  /** Target y after deterministic endpoint-collision nudging. */
  y2: number;
  /** min(y1, y2) after nudging. */
  top: number;
  /** max(y1, y2) after nudging. */
  bottom: number;
  /** `relation.label || relationTypeLabel(relation.type)`, or '' when hidden/none. */
  label: string;
  /** `resolvedRelationColor(relation)`. */
  color: string;
  /** `resolvedRelationDashArray(relation)` — an explicit `strokeDash` override,
   *  else the type-derived default (paired/structural relations — chiasm ·
   *  parallel · inclusio — dashed, everything else solid). */
  dashArray: string | undefined;
  /** `resolvedRelationStrokeWidth(relation)` — an explicit `strokeWidth`
   *  override, else the current default weight (1.6px). */
  strokeWidth: number;
}

export interface RelationLayoutResult {
  /** Laid-out relations in a stable, input-order-independent order. */
  relations: LaidOutRelation[];
  laneCount: number;
  laneStep: number;
  /** Total gutter px the caller should reserve; `0` when there are no relations. */
  gutterWidth: number;
}

/** Small clearance so lanes only share when spans are comfortably disjoint. */
const LANE_CLEARANCE = 3;
/** Outward slack beyond the last lane for the arrowhead / bracket corner. */
const OUTER_ALLOWANCE = 6;
/** Default lane pitch WITH rotated labels (needs room for the 90°-turned text). */
const LANE_STEP_LABELLED = 16;
/** Default lane pitch WITHOUT labels (tighter — only the stroke needs room). */
const LANE_STEP_BARE = 11;
/** Default outward width reserved for rotated labels when shown. */
const LABEL_ALLOWANCE = 12;

/**
 * A single endpoint occurrence — one tip of one relation. We group ALL tips
 * (both source and target) by rounded y so that two horizontal runs which would
 * otherwise coincide at the same y are nudged apart, regardless of which end
 * each tip belongs to.
 */
interface Endpoint {
  relationId: string;
  end: 'source' | 'target';
  y: number;
}

/**
 * Deterministic symmetric nudges for a group of `count` coincident endpoints:
 * index 0 → 0, 1 → +step, 2 → −step, 3 → +2·step, 4 → −2·step, … clamped to
 * ±max. Symmetric so the group stays centred on the original y; deterministic
 * because callers feed the group in a fixed (relation-id, end) order, so the
 * same relation always gets the same nudge no matter the INPUT order.
 */
function symmetricOffset(index: number, step: number, max: number): number {
  if (index === 0) return 0;
  const magnitude = Math.ceil(index / 2) * step;
  const signed = index % 2 === 1 ? magnitude : -magnitude;
  return Math.max(-max, Math.min(max, signed));
}

/**
 * Lay out discourse relations as gutter brackets: deterministic endpoint nudging,
 * greedy first-fit lane packing (shorter spans hug the text), and a compact
 * gutter width. Pure and side-agnostic — identical input yields identical output
 * regardless of array order, so the canvas and the export never disagree.
 */
export function layoutDiscourseRelations(
  endpoints: RelationEndpointInput[],
  opts: RelationLayoutOptions,
): RelationLayoutResult {
  const laneStep = opts.laneStep ?? (opts.showLabels ? LANE_STEP_LABELLED : LANE_STEP_BARE);
  const labelAllowance = opts.labelAllowance ?? LABEL_ALLOWANCE;
  const step = opts.endpointOffsetStep ?? 2;
  const maxOffset = opts.maxEndpointOffset ?? 4;
  const innerPad = opts.innerPad ?? 8;

  if (endpoints.length === 0) {
    return { relations: [], laneCount: 0, laneStep, gutterWidth: 0 };
  }

  // --- 1. Nudge coincident endpoints apart ------------------------------------
  // Collect every tip, group by rounded y, and assign a deterministic symmetric
  // offset within each group ordered by (relation id, end). This keeps two
  // relations attaching at the same unit from drawing their horizontal runs on
  // top of one another, while staying centred on the true midpoint.
  const tips: Endpoint[] = [];
  for (const e of endpoints) {
    tips.push({ relationId: e.relation.id, end: 'source', y: e.y1 });
    tips.push({ relationId: e.relation.id, end: 'target', y: e.y2 });
  }
  const byRoundedY = new Map<number, Endpoint[]>();
  for (const t of tips) {
    const key = Math.round(t.y);
    (byRoundedY.get(key) ?? byRoundedY.set(key, []).get(key)!).push(t);
  }
  // offsets keyed by `${relationId}:${end}` → nudge px.
  const nudge = new Map<string, number>();
  for (const group of byRoundedY.values()) {
    group.sort((a, b) =>
      a.relationId === b.relationId
        ? a.end.localeCompare(b.end)
        : a.relationId.localeCompare(b.relationId),
    );
    group.forEach((t, i) => {
      nudge.set(`${t.relationId}:${t.end}`, symmetricOffset(i, step, maxOffset));
    });
  }

  // --- 2. Resolve adjusted endpoints ------------------------------------------
  interface Prepared {
    input: RelationEndpointInput;
    y1: number;
    y2: number;
    a1: number;
    a2: number;
    top: number;
    bottom: number;
  }
  const prepared: Prepared[] = endpoints.map((e) => {
    const y1 = e.y1 + (nudge.get(`${e.relation.id}:source`) ?? 0);
    const y2 = e.y2 + (nudge.get(`${e.relation.id}:target`) ?? 0);
    return {
      input: e,
      y1,
      y2,
      a1: e.a1 ?? 0,
      a2: e.a2 ?? 0,
      top: Math.min(y1, y2),
      bottom: Math.max(y1, y2),
    };
  });

  // --- 3. Deterministic order: shorter spans first (hug the text), then top,
  // then relation id (unique) as the total-order tie-break so any input
  // permutation collapses to the same sequence.
  prepared.sort((a, b) => {
    const spanA = a.bottom - a.top;
    const spanB = b.bottom - b.top;
    if (spanA !== spanB) return spanA - spanB;
    if (a.top !== b.top) return a.top - b.top;
    return a.input.relation.id.localeCompare(b.input.relation.id);
  });

  // --- 4. Greedy first-fit lane packing --------------------------------------
  // Two relations may share a lane ONLY when their vertical spans (expanded by a
  // small clearance) are disjoint; otherwise the shorter one already took a
  // lower lane and the current one steps outward. Reusing lanes for far-apart
  // relations keeps the lane count — and the gutter — minimal.
  const placed: { lane: number; top: number; bottom: number }[] = [];
  const out: LaidOutRelation[] = prepared.map((p) => {
    const taken = new Set(
      placed
        .filter((q) => q.top - LANE_CLEARANCE < p.bottom && q.bottom + LANE_CLEARANCE > p.top)
        .map((q) => q.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane++;
    placed.push({ lane, top: p.top, bottom: p.bottom });

    const { relation } = p.input;
    const label = opts.showLabels ? relation.label || relationTypeLabel(relation.type) : '';
    return {
      relation,
      lane,
      laneU: innerPad + lane * laneStep,
      a1: p.a1,
      a2: p.a2,
      y1: p.y1,
      y2: p.y2,
      top: p.top,
      bottom: p.bottom,
      label,
      color: resolvedRelationColor(relation),
      dashArray: resolvedRelationDashArray(relation),
      strokeWidth: resolvedRelationStrokeWidth(relation),
    };
  });

  const laneCount = out.length ? Math.max(...out.map((r) => r.lane)) + 1 : 0;
  const gutterWidth =
    innerPad + laneCount * laneStep + OUTER_ALLOWANCE + (opts.showLabels ? labelAllowance : 0);

  return { relations: out, laneCount, laneStep, gutterWidth };
}
