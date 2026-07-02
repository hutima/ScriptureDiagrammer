import { LAYOUT } from '../constants';
import { measureText, SMALL_FONT } from '../measure';
import type { GrammarTone, TextElement } from '../types';
import type { Block } from './types';
import { eid } from './primitives';

/**
 * PURE GEOMETRY helpers for the Kellogg-Reed engine — slant angles and runs,
 * diagonal text placement, block extent measurements. No syntax knowledge.
 */
export const DEG = 180 / Math.PI;

/**
 * Where along a leaf-modifier diagonal the word is centred. Pushing it past the
 * midpoint (toward the low end) keeps the word clear of the head's baseline —
 * which, for an appositive or coordinated head, runs horizontally right over the
 * diagonal's upper end. 0.5 = midpoint; >0.5 = nearer the bottom.
 */
export const DIAG_TEXT_FRAC = 0.72;

/**
 * Geometry of a leaf-modifier diagonal carrying `text` (e.g. an article, a
 * possessive like ἡμῶν). The run is scaled to the word so a long modifier gets a
 * longer, less crowded slant, and the drop is grown to match so the word — set
 * low on the line (DIAG_TEXT_FRAC) — clears the head's baseline above it. Both
 * stay at least the constant minimums, so short words look exactly as before.
 */
/**
 * The ONE slant angle every downward modifier diagonal uses, so all of them read
 * as parallel (an article, a possessive, a prepositional phrase's stem). Length
 * varies with the modifier; the angle never does.
 */
export const SLANT_ANGLE = 57 / DEG;

/** Horizontal run of a standard-angle slant that drops by `drop`. */
export function slantRun(drop: number): number {
  return drop / Math.tan(SLANT_ANGLE);
}

export function diagLeafGeom(text: string): { run: number; drop: number } {
  const w = measureText(text);
  // The word sits between DIAG_TEXT_FRAC±half along the line; size the line so
  // that band (plus headroom for the upper end) is at least the word's length.
  const len = Math.max(LAYOUT.diagRun * 2, w + LAYOUT.fontSize * 1.4);
  return { run: len * Math.cos(SLANT_ANGLE), drop: len * Math.sin(SLANT_ANGLE) };
}

/** Text written along a diagonal, rotated to lie on the line from (x1,y1)→(x2,y2). */
export function diagonalText(
  text: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  relationId?: string,
  nodeId?: string,
  frac = 0.5,
  tone?: GrammarTone,
): TextElement {
  const angle = Math.atan2(y2 - y1, x2 - x1) * DEG;
  // Point `frac` of the way down the line, nudged just above it so the word
  // rests on the diagonal rather than straddling it.
  return {
    kind: 'text',
    id: eid(),
    x: x1 + (x2 - x1) * frac,
    y: y1 + (y2 - y1) * frac - 3,
    text,
    anchor: 'middle',
    rotate: angle,
    relationId,
    nodeId,
    tone,
  };
}

/**
 * How far below the baseline (y = 0) a word written along the diagonal
 * (x1,y1)→(x2,y2) actually reaches. A long word on a steep diagonal overhangs
 * its endpoint, so the layout must reserve this much room or it runs into the
 * row below.
 */
export function diagonalDepth(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  text: string,
  frac = 0.5,
): number {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const w = measureText(text);
  const midY = y1 + (y2 - y1) * frac - 3;
  const along = (w / 2) * Math.abs(Math.sin(angle)); // half the word, projected on y
  const across = LAYOUT.fontSize * 0.75 * Math.abs(Math.cos(angle)); // glyph ascent/descent
  return midY + along + across + 2;
}

/**
 * How far a block's drawing rises ABOVE its baseline (y = 0). Most blocks sit at
 * or below the baseline, but a coordination fork lifts its upper conjunct into
 * negative y; stacking must reserve that room or the block pokes into the row
 * above. Returns ≥ 0.
 */
export function blockAscent(block: Block): number {
  let minY = 0;
  for (const el of block.elements) {
    if (el.kind === 'line') minY = Math.min(minY, el.y1, el.y2);
    else if (el.kind === 'curve') minY = Math.min(minY, el.y1, el.cy, el.y2);
    else minY = Math.min(minY, el.y - (el.small ? LAYOUT.smallFontSize : LAYOUT.fontSize));
  }
  return Math.max(0, -minY);
}

/**
 * Extra vertical room a member needs ABOVE its baseline beyond a normal one-line
 * clause — i.e. the height of a pedestal/platform it raises into negative y (a
 * substantival subject or a predicate-nominative platform). When such a member
 * follows another clause on a stacked spine, this is the clearance that must be
 * added to the inter-clause gap so the platform clears the clause above it
 * rather than crowding into its descenders. Returns ≥ 0.
 */
export function pedestalRoom(block: Block): number {
  return Math.max(0, blockAscent(block) - (LAYOUT.dividerUp + LAYOUT.fontSize));
}

/**
 * The rightmost x reached by any of `block`'s primitives whose TOP edge sits at
 * or above `band` (y ≤ band) — i.e. everything that vertically overlaps the strip
 * from the baseline down to `band`. Used to place a subject|predicate divider
 * clear of only the subject's SHALLOW content, so the predicate can tuck into the
 * empty space above a deep-but-narrow-topped subject dependent (a relative clause
 * on the subject) instead of being flung past that dependent's whole width.
 */
export function rightWithinBand(block: Block, band: number): number {
  let right = 0;
  for (const el of block.elements) {
    let topY: number;
    let maxX: number;
    if (el.kind === 'line') {
      topY = Math.min(el.y1, el.y2);
      maxX = Math.max(el.x1, el.x2);
    } else if (el.kind === 'curve') {
      topY = Math.min(el.y1, el.cy, el.y2);
      maxX = Math.max(el.x1, el.cx, el.x2);
    } else {
      const w = el.small ? measureText(el.text, SMALL_FONT) : measureText(el.text);
      topY = el.y - (el.small ? LAYOUT.smallFontSize : LAYOUT.fontSize);
      maxX = el.anchor === 'end' ? el.x : el.anchor === 'middle' ? el.x + w / 2 : el.x + w;
    }
    if (topY <= band) right = Math.max(right, maxX);
  }
  return right;
}
