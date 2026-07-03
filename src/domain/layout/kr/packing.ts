import { measureText, SMALL_FONT } from '../measure';
import type { DiagramElement } from '../types';

/**
 * BAND PACKER — occupied-region tracking for the sibling-placement cascades.
 *
 * The classic engine places each hanging block at the previous sibling's FULL
 * subtree right edge, even when the previous sibling is deep-but-narrow-topped
 * and the bands don't overlap — stranding wide empty pockets. The packer lets a
 * call site reclaim such a pocket, under a strict SAFE-FALLBACK CONTRACT:
 *
 *   1. The caller draws the new block at its CLASSIC position first, then asks
 *      `reclaim(newElements, maxShift)` how far LEFT it may slide. The answer
 *      is 0 whenever a tighter placement cannot be PROVEN clash-free — zero
 *      shift means byte-identical output. The packer can therefore only ever
 *      move content left of today's position, never right, never reflow.
 *   2. Footprints are CONSERVATIVE over-approximations (axis-aligned rects per
 *      primitive, diagonal lines subdivided, rotated text as its rotated-quad
 *      bbox). Over-covering can only cost a missed opportunity, never a clash.
 *   3. A shifted placement must keep a `PACK_PAD` clearance from EVERYTHING
 *      already occupied, so a reclaimed placement is strictly farther from its
 *      neighbours than many classic adjacencies.
 *
 * Pure geometry — no syntax knowledge (concern 3 of kr/README.md). Geometry is
 * computed LTR and mirrored for RTL afterwards, so the packer stays
 * direction-agnostic.
 */

export interface PackRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Minimum clearance a reclaimed placement keeps from occupied content. */
export const PACK_PAD = 10;

/** Longest diagonal-line chunk before subdividing its bounding box. A single
 *  bbox around a long slant over-covers a huge triangle and blocks every tuck
 *  beneath it; chunked boxes hug the line. */
const LINE_CHUNK = 40;
const LINE_CHUNK_CAP = 8;

/** Word-glyph vertical metrics (px at the layout's font sizes): text `y` is the
 *  baseline anchor; glyphs reach ~asc above and ~desc below. Slightly generous
 *  on purpose — over-covering is the safe direction. */
const TEXT_ASC = 14;
const TEXT_DESC = 4;
const SMALL_ASC = 11;
const SMALL_DESC = 3;

/**
 * Conservative axis-aligned footprint of drawn primitives. Each element yields
 * one or more rects that fully cover it.
 */
export function elementRects(els: readonly DiagramElement[]): PackRect[] {
  const rects: PackRect[] = [];
  for (const el of els) {
    if (el.kind === 'line') {
      const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
      const isDiagonal = Math.abs(el.x2 - el.x1) > 0.5 && Math.abs(el.y2 - el.y1) > 0.5;
      const chunks = isDiagonal
        ? Math.min(LINE_CHUNK_CAP, Math.max(1, Math.ceil(len / LINE_CHUNK)))
        : 1;
      for (let i = 0; i < chunks; i++) {
        const ax = el.x1 + ((el.x2 - el.x1) * i) / chunks;
        const ay = el.y1 + ((el.y2 - el.y1) * i) / chunks;
        const bx = el.x1 + ((el.x2 - el.x1) * (i + 1)) / chunks;
        const by = el.y1 + ((el.y2 - el.y1) * (i + 1)) / chunks;
        rects.push({
          x0: Math.min(ax, bx),
          y0: Math.min(ay, by),
          x1: Math.max(ax, bx),
          y1: Math.max(ay, by),
        });
      }
    } else if (el.kind === 'curve') {
      rects.push({
        x0: Math.min(el.x1, el.cx, el.x2),
        y0: Math.min(el.y1, el.cy, el.y2),
        x1: Math.max(el.x1, el.cx, el.x2),
        y1: Math.max(el.y1, el.cy, el.y2),
      });
    } else {
      const w = measureText(el.text, el.small ? SMALL_FONT : undefined);
      const asc = el.small ? SMALL_ASC : TEXT_ASC;
      const desc = el.small ? SMALL_DESC : TEXT_DESC;
      const x0 = el.anchor === 'middle' ? -w / 2 : el.anchor === 'end' ? -w : 0;
      const x1 = x0 + w;
      if (el.rotate) {
        // Bounding box of the rotated glyph rect about the anchor.
        const th = (el.rotate * Math.PI) / 180;
        const cos = Math.cos(th);
        const sin = Math.sin(th);
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const [px, py] of [
          [x0, -asc],
          [x1, -asc],
          [x1, desc],
          [x0, desc],
        ] as const) {
          const rx = el.x + px * cos - py * sin;
          const ry = el.y + px * sin + py * cos;
          minX = Math.min(minX, rx);
          maxX = Math.max(maxX, rx);
          minY = Math.min(minY, ry);
          maxY = Math.max(maxY, ry);
        }
        rects.push({ x0: minX, y0: minY, x1: maxX, y1: maxY });
      } else {
        rects.push({ x0: el.x + x0, y0: el.y - asc, x1: el.x + x1, y1: el.y + desc });
      }
    }
  }
  return rects;
}

export class BandPacker {
  private occupied: PackRect[] = [];

  /** Record already-drawn primitives (in the caller's local coordinates). */
  occupy(els: readonly DiagramElement[]): void {
    this.occupied.push(...elementRects(els));
  }

  /** Record an explicit region (e.g. space deliberately reserved by a caller). */
  occupyRect(rect: PackRect): void {
    this.occupied.push(rect);
  }

  /**
   * How far LEFT the just-drawn `els` (at their classic position) can slide
   * while provably keeping `PACK_PAD` clearance from everything occupied.
   *
   * CONTINUOUS-SLIDE semantics: the block slides left from its classic
   * position and stops the moment it comes within `PACK_PAD` of anything —
   * it can pack flush against an obstacle but can never jump PAST one into
   * free space on its far side, so the horizontal order of siblings is
   * preserved by construction. Returns a shift in [0, maxShift]; 0 — the
   * safe fallback, byte-identical output — whenever no strictly tighter
   * placement can be proven clash-free (including when the classic position
   * itself is already within `PACK_PAD` of occupied content: such
   * grandfathered adjacency is left exactly as it is). The caller translates
   * the elements by −shift and then `occupy`s them at their final position.
   */
  reclaim(els: readonly DiagramElement[], maxShift: number): number {
    if (!(maxShift > 0) || els.length === 0) return 0;
    let stop = maxShift;
    const fp = elementRects(els);
    for (const f of fp) {
      for (const o of this.occupied) {
        // Vertical bands must come within PACK_PAD for the pair to matter.
        if (!(f.y0 - PACK_PAD < o.y1 && o.y0 - PACK_PAD < f.y1)) continue;
        // Sliding left by `s`, the pair is in horizontal conflict for
        // s ∈ (lo, hi) where lo = flush-right-of-obstacle. hi ≤ 0 means the
        // obstacle sits right of the block and can never be hit going left.
        const hi = f.x1 - o.x0 + PACK_PAD;
        if (hi <= 0) continue;
        const lo = f.x0 - o.x1 - PACK_PAD;
        stop = Math.min(stop, Math.max(0, lo));
        if (stop === 0) return 0;
      }
    }
    return stop;
  }
}
