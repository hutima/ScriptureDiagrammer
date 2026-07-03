import { describe, it, expect } from 'vitest';
import { BandPacker, PACK_PAD, elementRects } from '@/domain/layout/kr/packing';
import { measureText } from '@/domain/layout/measure';
import type { DiagramElement, LineElement, TextElement } from '@/domain/layout';

/**
 * UNIT TESTS for the band packer (src/domain/layout/kr/packing.ts) — landed
 * BEFORE any call site, per the packing plan in docs/kr-refactor-status.md.
 * The safe-fallback contract is the load-bearing part: reclaim() returns 0
 * (byte-identical output) unless a strictly tighter placement is provably
 * clash-free, and never returns more than maxShift.
 */

const line = (x1: number, y1: number, x2: number, y2: number): LineElement => ({
  kind: 'line',
  id: 'l',
  x1,
  y1,
  x2,
  y2,
  style: 'solid',
  role: 'stem',
});

const text = (x: number, y: number, t = 'word', rotate?: number): TextElement => ({
  kind: 'text',
  id: 't',
  x,
  y,
  text: t,
  anchor: 'middle',
  ...(rotate !== undefined ? { rotate } : {}),
});

describe('elementRects — conservative footprints', () => {
  it('covers a horizontal line exactly', () => {
    const [r] = elementRects([line(10, 5, 60, 5)]);
    expect(r).toEqual({ x0: 10, y0: 5, x1: 60, y1: 5 });
  });

  it('subdivides a long diagonal so its footprint hugs the line', () => {
    const rects = elementRects([line(0, 0, 120, 120)]);
    expect(rects.length).toBeGreaterThan(1);
    // Every rect must still contain its stretch of the line…
    for (const r of rects) {
      expect(r.x1).toBeGreaterThan(r.x0 - 1e-9);
      expect(r.y1).toBeGreaterThan(r.y0 - 1e-9);
    }
    // …and the union must reach both endpoints.
    expect(Math.min(...rects.map((r) => r.x0))).toBe(0);
    expect(Math.max(...rects.map((r) => r.x1))).toBe(120);
    // The pocket beside the diagonal is NOT covered: a point clearly above the
    // line's lower-right run lies outside every chunk box.
    const covered = rects.some((r) => 100 >= r.x0 && 100 <= r.x1 && 20 >= r.y0 && 20 <= r.y1);
    expect(covered).toBe(false);
  });

  it('covers an upright word by its measured glyph box', () => {
    const t = text(100, 50, 'λόγος');
    const [r] = elementRects([t]);
    const w = measureText('λόγος');
    expect(r!.x0).toBeCloseTo(100 - w / 2);
    expect(r!.x1).toBeCloseTo(100 + w / 2);
    expect(r!.y0).toBe(50 - 14);
    expect(r!.y1).toBe(50 + 4);
  });

  it('covers a rotated word by its rotated-quad bounding box', () => {
    const upright = elementRects([text(0, 0, 'genitive')])[0]!;
    const rotated = elementRects([text(0, 0, 'genitive', 57)])[0]!;
    // Rotating shrinks the horizontal reach and grows the vertical.
    expect(rotated.x1 - rotated.x0).toBeLessThan(upright.x1 - upright.x0);
    expect(rotated.y1 - rotated.y0).toBeGreaterThan(upright.y1 - upright.y0);
    // …and still contains the anchor.
    expect(rotated.x0).toBeLessThan(0);
    expect(rotated.x1).toBeGreaterThan(0);
  });
});

describe('BandPacker.reclaim — safe-fallback contract', () => {
  it('returns 0 for non-positive maxShift', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 10, 0)]);
    expect(p.reclaim([line(50, 0, 60, 0)], 0)).toBe(0);
    expect(p.reclaim([line(50, 0, 60, 0)], -5)).toBe(0);
  });

  it('returns 0 for an empty block', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 10, 0)]);
    expect(p.reclaim([], 100)).toBe(0);
  });

  it('slides fully when nothing is occupied', () => {
    const p = new BandPacker();
    expect(p.reclaim([line(100, 0, 110, 0)], 40)).toBe(40);
  });

  it('returns 0 when every tighter position conflicts', () => {
    const p = new BandPacker();
    p.occupy([line(0, 10, 100, 10)]); // a wide bar in the same band
    expect(p.reclaim([line(105, 10, 120, 10)], 60)).toBe(0);
  });

  it('never returns more than maxShift even with a huge free pocket', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 10, 0)]);
    expect(p.reclaim([line(500, 100, 510, 100)], 30)).toBe(30);
  });

  it('tucks a shallow block into the pocket beside a deep-narrow neighbour', () => {
    // Neighbour: narrow at the top (x 0..30), deep reach far right at the
    // bottom (x 0..200 at y 100) — the genitive-staircase shape.
    const p = new BandPacker();
    p.occupy([line(0, 0, 30, 0), line(30, 0, 200, 100)]);
    // New block: shallow strip at y 0..0, classic position past the whole
    // subtree (x 220..260). The pocket above the staircase is free.
    const shift = p.reclaim([line(220, 0, 260, 0)], 180);
    expect(shift).toBeGreaterThan(0);
    // Must keep PACK_PAD clearance from the neighbour's top bar (ends x=30):
    // shifted left edge 220 - shift ≥ 30 + PACK_PAD.
    expect(220 - shift).toBeGreaterThanOrEqual(30 + PACK_PAD);
  });

  it('lands flush (PACK_PAD) against the blocking rect when the pocket allows', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 30, 0)]); // only obstacle, same band
    const shift = p.reclaim([line(200, 0, 240, 0)], 1000);
    expect(200 - shift).toBeCloseTo(30 + PACK_PAD);
  });

  it('respects vertical PACK_PAD: a band only 5px away stops the slide flush', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 100, 0)]);
    // 5px below the bar (vertical clearance < PACK_PAD): the block may slide
    // up flush beside the bar but never past/under it.
    expect(p.reclaim([line(150, 5, 190, 5)], 200)).toBe(150 - 100 - PACK_PAD);
  });

  it('never slides past an obstacle even when its far side is free', () => {
    const p = new BandPacker();
    // Obstacle in the middle of the runway; free space on its far (left) side.
    p.occupy([line(100, 0, 120, 0)]);
    const shift = p.reclaim([line(300, 0, 340, 0)], 1000);
    // Stops flush right of the obstacle — the free pocket at x < 100 is
    // unreachable by a continuous slide, so sibling order can never invert.
    expect(300 - shift).toBeCloseTo(120 + PACK_PAD);
  });

  it('ignores occupied content whose band is far away vertically', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 100, 0)]);
    // 50px below the bar — clear of it at any x.
    expect(p.reclaim([line(150, 50, 190, 50)], 120)).toBe(120);
  });

  it('stops at the NEAREST obstacle, not the widest', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 30, 0), line(60, 0, 80, 0)]);
    // Continuous slide: the block halts flush against the rightmost bar; the
    // slot between the bars is on the far side and unreachable.
    const shift = p.reclaim([line(200, 0, 210, 0)], 300);
    expect(200 - shift).toBeCloseTo(80 + PACK_PAD);
  });

  it('accounts for text footprints, not just lines', () => {
    const p = new BandPacker();
    p.occupy([text(50, 0, 'head')]);
    const w = measureText('head');
    const shift = p.reclaim([line(300, 0, 320, 0)], 500);
    expect(300 - shift).toBeCloseTo(50 + w / 2 + PACK_PAD);
  });

  it('a diagonal footprint can tuck over a diagonal obstacle where bands differ', () => {
    const p = new BandPacker();
    // Down-right slant occupying y 0..80 along x 0..80.
    p.occupy([line(0, 0, 80, 80)]);
    // A short strip near y = 0: can slide until it nears the slant's TOP chunk
    // (around x ≤ 20 for the y-band 0..10), so a shift well past the slant's
    // full width must be found.
    const shift = p.reclaim([line(200, 0, 220, 0)], 300);
    expect(shift).toBeGreaterThan(100); // reclaims most of the slant's width
    expect(200 - shift).toBeGreaterThanOrEqual(PACK_PAD); // still clear of the top chunk
  });

  it('occupying the reclaimed position blocks the next block correctly', () => {
    const p = new BandPacker();
    p.occupy([line(0, 0, 30, 0)]);
    const els: DiagramElement[] = [line(200, 0, 240, 0)];
    const shift = p.reclaim(els, 1000);
    const placed = els.map((e) =>
      e.kind === 'line' ? { ...e, x1: e.x1 - shift, x2: e.x2 - shift } : e,
    );
    p.occupy(placed);
    // Next identical block cannot land on top of the first; it packs after it.
    const shift2 = p.reclaim([line(400, 0, 440, 0)], 1000);
    expect(400 - shift2).toBeCloseTo(240 - shift + PACK_PAD);
  });
});
