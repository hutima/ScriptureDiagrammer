import { LAYOUT } from '../constants';
import { measureText, SMALL_FONT } from '../measure';
import type { DiagramElement, GrammarTone, TextElement } from '../types';
import type { Block } from './types';
import { elementRects } from './packing';
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

/** Clearance a routed stem keeps on each side of hanging text it must miss. */
const STEM_CLEAR_PAD = 4;

/**
 * Choose the x for a vertical stem (a pedestal riser, a clause spine) that must
 * drop THROUGH the band between an elevated baseline and the main line, so it
 * misses any content already hanging in that band. The classic `preferred` x
 * (e.g. the centre of a pedestalled clause's baseline) is kept whenever it is
 * clear — byte-identical output — but when a below-baseline modifier sits under
 * it (the Rom 9:6 "τοῦ θεοῦ / of God" genitive under the pedestal riser, worse
 * once glossed because "of God" is wider than "θεοῦ"), it slides to the nearest
 * gap within `[lo, hi]`, biased RIGHT so a connector label written off the stem
 * runs into already-clear space rather than back into the obstacle.
 *
 * `els` are the already-placed primitives in the SAME coordinate space as
 * `preferred`; only those overlapping the open vertical band `(yTop, yBottom)`
 * (i.e. hanging strictly below the elevated baseline) count as obstacles — the
 * baseline row itself, which the stem legitimately meets, is excluded by the
 * caller keeping it out of the band.
 */
export function clearStemX(
  els: readonly DiagramElement[],
  band: { yTop: number; yBottom: number },
  preferred: number,
  lo: number,
  hi: number,
): number {
  const clamped = Math.min(Math.max(preferred, lo), hi);
  const obstacles = elementRects(els)
    .filter((r) => r.y1 > band.yTop + 0.5 && r.y0 < band.yBottom - 0.5)
    .map((r) => ({ x0: r.x0 - STEM_CLEAR_PAD, x1: r.x1 + STEM_CLEAR_PAD }));
  const inside = (x: number): boolean => obstacles.some((o) => x > o.x0 && x < o.x1);
  if (!inside(clamped)) return clamped;
  // Candidate landing spots: every obstacle edge (the flush-clear positions),
  // plus the bounds. Keep those inside range and clear of every obstacle.
  const cands = [lo, hi];
  for (const o of obstacles) cands.push(o.x0, o.x1);
  const clear = cands.filter((x) => x >= lo && x <= hi && !inside(x));
  if (!clear.length) return clamped; // no provably-clear gap: leave it (no worse)
  // Nearest to the classic centre, ties broken to the RIGHT (label-safe side).
  clear.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred) || b - a);
  return clear[0]!;
}

/**
 * The bottom end (max y, block-local) of a coordination SPINE block's dashed
 * bar, or null when the block is not a spine. A spine exposes its bar column as
 * the block's connection point (`wordLeft === wordRight`, see layoutClauseSpine);
 * a parent attaching from BELOW (a pedestal riser) must meet the bar at its
 * BOTTOM — the last member's baseline — not run a second vertical the spine's
 * whole height alongside it (which cut straight through the lower members'
 * verbs: "Esau I hated" in Rom 9:13).
 */
export function spineBarBottom(block: Block): number | null {
  if (block.wordLeft !== block.wordRight || block.wordLeft <= 0) return null;
  let bottom = -Infinity;
  for (const el of block.elements) {
    if (
      el.kind === 'line' &&
      el.style === 'dashed' &&
      el.role === 'coordination' &&
      Math.abs(el.x1 - block.wordLeft) < 1 &&
      Math.abs(el.x2 - block.wordLeft) < 1
    ) {
      bottom = Math.max(bottom, el.y1, el.y2);
    }
  }
  return Number.isFinite(bottom) ? bottom : null;
}

/** Vertical clearance a gapped line keeps above/below the glyphs it skips. */
const GAP_MARGIN = 2;
/** A line's first/last few px are its junctions — never gapped away, so the
 *  segment still touches whatever the original endpoint met (a baseline, the
 *  spine bar) and the diagram stays connected. */
const GAP_ENDPOINT_STUB = 3;

/**
 * Split DASHED VERTICAL lines so they visibly SKIP the upright words they
 * cross, instead of drawing through the glyphs. The compound-sentence spine
 * deliberately runs verb-to-verb down the verb column (see layoutClauseSpine),
 * and the lead stub's stem drops through the first verb to reach the bar top;
 * the renderer's paper halo kept the glyph strokes legible, but the line still
 * showed between letters and across word spaces (Gen 17:12 "he will be
 * circumcised" under its "and" lead). Gapping at the MEASURED glyph bands makes
 * the pass-behind real geometry — identical in every renderer and export, and
 * wider gloss text simply produces a taller word band, never a new crossing.
 *
 * Lines that cross nothing are returned as THE SAME OBJECT, so untouched
 * passages stay byte-identical. Solid/dotted lines are never gapped — a solid
 * structural line with a hole reads as two lines; a solid crossing is a layout
 * bug to fix at its source (see clearStemX / the pedestal riser).
 */
export function gapDashedLinesBehindWords(els: readonly DiagramElement[]): DiagramElement[] {
  // Upright word glyphs only: a rotated word lies ALONG its own line by design
  // (diagonal modifiers, the spine coordinator marks), and a boxed chip paints
  // its own opaque background.
  const words = els.filter(
    (el): el is TextElement => el.kind === 'text' && !el.rotate && !el.box,
  );
  if (!words.length) return [...els];
  const out: DiagramElement[] = [];
  for (const el of els) {
    if (el.kind !== 'line' || el.style !== 'dashed' || Math.abs(el.x1 - el.x2) > 0.5) {
      out.push(el);
      continue;
    }
    const yLo = Math.min(el.y1, el.y2);
    const yHi = Math.max(el.y1, el.y2);
    // Glyph bands this line actually crosses (≥1px inside both glyph edges, so
    // legitimately ABUTTING a word's edge never triggers a gap), clamped clear
    // of the line's endpoints so junctions survive.
    const bands: { lo: number; hi: number }[] = [];
    for (const w of words) {
      const width = measureText(w.text, w.small ? SMALL_FONT : undefined);
      const x0 = w.anchor === 'middle' ? w.x - width / 2 : w.anchor === 'end' ? w.x - width : w.x;
      if (el.x1 <= x0 + 1 || el.x1 >= x0 + width - 1) continue;
      const asc = w.small ? 11 : 14;
      const desc = w.small ? 3 : 4;
      const lo = Math.max(w.y - asc - GAP_MARGIN, yLo + GAP_ENDPOINT_STUB);
      const hi = Math.min(w.y + desc + GAP_MARGIN, yHi - GAP_ENDPOINT_STUB);
      if (hi > lo) bands.push({ lo, hi });
    }
    if (!bands.length) {
      out.push(el);
      continue;
    }
    // Merge the bands, then emit the surviving segments in top-to-bottom order.
    bands.sort((a, b) => a.lo - b.lo);
    const merged: { lo: number; hi: number }[] = [];
    for (const b of bands) {
      const last = merged[merged.length - 1];
      if (last && b.lo <= last.hi) last.hi = Math.max(last.hi, b.hi);
      else merged.push({ ...b });
    }
    let cursor = yLo;
    let piece = 0;
    for (const b of merged) {
      if (b.lo - cursor > 0.5) {
        out.push({ ...el, id: piece++ ? `${el.id}g${piece}` : el.id, y1: cursor, y2: b.lo });
      }
      cursor = Math.max(cursor, b.hi);
    }
    if (yHi - cursor > 0.5) {
      out.push({ ...el, id: piece++ ? `${el.id}g${piece}` : el.id, y1: cursor, y2: yHi });
    }
  }
  return out;
}
