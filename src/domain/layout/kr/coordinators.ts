import { LAYOUT } from '../constants';
import { measureText, SMALL_FONT } from '../measure';
import type { TextElement } from '../types';
import type { Ctx } from './types';
import { eid } from './primitives';
import { childRelations, getNode, nodeText } from '@/domain/model';

/**
 * COORDINATOR WORD placement — the conjunctions riding a coordination bar
 * (correlative one-per-member vs per-join) and the vertical room they need.
 */
/**
 * Every coordinator word on a coordination node, in relation order — one for a
 * plain "A καὶ B", but TWO (or more) for a correlative pairing (μέν…δέ, οὐ…ἀλλά,
 * both…and). Leedy stacks a correlative pair in the single conjunction slot,
 * top-with-top, to mark the intensified union.
 */
export function coordinatorTexts(
  ctx: Ctx,
  nodeId: string,
): { text: string; nodeId: string }[] {
  return childRelations(ctx.doc.syntax, nodeId)
    .filter((r) => r.type === 'coordinator')
    .map((r) => ({
      text: nodeText(ctx.doc, getNode(ctx.doc.syntax, r.dependentId)!) || '',
      nodeId: r.dependentId,
    }))
    .filter((c) => c.text);
}

/**
 * Vertical breathing room a coordinator riding a coordination bar needs between
 * the two members it joins: its own upright length (it is written rotated, so its
 * text WIDTH becomes a vertical extent) plus a small pad above and below, and the
 * lower member's text rises a line above its baseline — so reserve that too. Used
 * both to size the inter-member gap and (via `coordinatorMarks`) to place the word
 * dead-centre in the resulting clear band.
 */
const COORD_PAD = 5;
function coordinatorSpan(text: string): number {
  return measureText(text, SMALL_FONT) + LAYOUT.fontSize + COORD_PAD * 2;
}

/**
 * Place the coordinator words that ride a vertical coordination bar at `barX`.
 * `baselines` are the member baseline y's (ascending) in the bar's own coordinate
 * space. Two shapes:
 *
 *   - CORRELATIVE (one coordinator per member — μέν…δέ, οὐ…ἀλλά): each rides the
 *     bar at its OWN member's baseline, top-with-top, marking the intensified union.
 *   - PER-JOIN ("A οὐδέ B ἀλλά C" — one coordinator per join, or a lone "and" in
 *     "A, B and C"): each marks the JOIN between two consecutive members and rides
 *     the VISUAL middle of the gap — centred between the upper member's baseline
 *     (the line) and the lower member's text top, NOT the raw baseline midpoint —
 *     so it sits in the clear band and never overlaps either word.
 *
 * Coordinators map to the LAST joins when there are fewer of them than joins, so a
 * single conjunction in an asyndetic list ("A, B and C") lands in the final gap.
 *
 * `open` — which side of the bar a FORK opens toward (the side the arms fan out
 * to, away from the converging prongs). When given, and exactly ONE per-join mark
 * is drawn, the mark's text BASELINE is anchored ON the bar itself (`x = barX`;
 * the caller passes the RAW bar x in this mode) with its glyph bodies extending
 * into the open side: rotate +90 for a right-opening fork (the word reads
 * top-to-bottom, glyph bottoms resting on the line), the usual −90 for a
 * left-opening one — mirroring how the clause-spine marks rest on their bar.
 * Correlative and multi-mark placements ignore `open` entirely and keep the
 * legacy rotation (−90) at the x the caller passed — correlative stacks in the
 * throat at the member corners, per-join marks on the open side of the bar,
 * clear of the fan arms sweeping the throat (see the fork call sites).
 */
export function coordinatorMarks(
  coords: { text: string; nodeId: string }[],
  baselines: number[],
  barX: number,
  open?: 'left' | 'right',
): TextElement[] {
  const n = baselines.length;
  // A lone per-join fork mark rests its baseline ON the bar (see above). No
  // perpendicular nudge: the anchor sits exactly at barX, matching the approved
  // clause-spine treatment — the ~3px small-font descent over the dashed bar
  // reads fine there too.
  const correlative = coords.length >= 2 && coords.length === n;
  const rotate = open === 'right' && !correlative && coords.length === 1 ? 90 : -90;
  const mark = (y: number, text: string, nodeId?: string): TextElement => ({
    kind: 'text', id: eid(), x: barX, y, text, anchor: 'middle', small: true, rotate, nodeId,
  });
  if (correlative) {
    // Correlative: top-with-top at each member's own baseline.
    return coords.map((c, i) => mark(baselines[Math.min(i, n - 1)]!, c.text, c.nodeId));
  }
  const joins = Math.max(1, n - 1);
  return coords.map((c, i) => {
    const j = Math.max(0, Math.min(joins - 1, joins - coords.length + i));
    const upper = baselines[j]!;
    const lower = baselines[Math.min(j + 1, n - 1)]!;
    // Visual middle of the gap: between the upper member's baseline (the line) and
    // the top of the lower member's text (a font-size above its baseline).
    return mark((upper + lower - LAYOUT.fontSize) / 2, c.text, c.nodeId);
  });
}

/**
 * Per-join vertical clearance the coordinators need between consecutive members,
 * indexed by join (member i → i+1). A correlative set rides member baselines and
 * needs none. Callers Math.max this into their inter-member gap so a long
 * conjunction sits clear of the words above and below instead of overlapping them.
 */
export function reserveJoinSpans(
  coords: { text: string }[],
  memberCount: number,
  correlative: boolean,
): number[] {
  const spans = new Array(Math.max(0, memberCount - 1)).fill(0);
  if (correlative || memberCount < 2) return spans;
  const joins = memberCount - 1;
  coords.forEach((c, i) => {
    const j = Math.max(0, Math.min(joins - 1, joins - coords.length + i));
    spans[j] = Math.max(spans[j], coordinatorSpan(c.text));
  });
  return spans;
}
