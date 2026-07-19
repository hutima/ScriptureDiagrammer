import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
import { measureText, SMALL_FONT } from '@/domain/layout/measure';
import type { KrDocument } from '@/domain/schema';
import { validateConvertedDocument } from './helpers/validateConvertedDocument';

/**
 * BASELINE-PACKING REGRESSION — Hebrews 2:8 (SBLGNT, doc sblgnt_hebrews_18):
 * "ἐν τῷ γὰρ ὑποτάξαι τὰ πάντα οὐδὲν ἀφῆκεν αὐτῷ ἀνυπότακτον".
 *
 * `packSlice` (src/domain/layout/kr/clause.ts) slid each baseline complement
 * from the position the PREVIOUS slice's pack left the cursor at — a slide
 * proven safe only for that slice's footprint. The follower αὐτῷ carries the
 * rotated ἀνυπότακτον diagonal hanging deep below the baseline; drawn at the
 * inherited slide it started out already colliding, and `reclaim` treats a
 * clash existing at the start position as grandfathered adjacency, so the
 * diagonal was drawn straight through the ἐν τῷ ὑποτάξαι sub-baseline and
 * through the word πάντα. Fixed by computing each slice's slide from its TRUE
 * classic position (drift-tracked): an over-inherited slide is pushed back
 * right just far enough to clear — never past classic.
 *
 * Guards (characterization-harness thresholds, but required EMPTY — this
 * passage must be fully clash-free, nothing is frozen):
 *  1. no word text overprints another (upright boxes + rotated quads, SAT);
 *  2. no SOLID line runs through an upright word (junction-on-own-baseline
 *     exempt, exactly as in kr-characterization.test.ts);
 *  3. specifically, the rotated ἀνυπότακτον quad crosses NO solid line except
 *     its own slant — in particular not the sub-baseline of ὑποτάξαι
 *     (w_n58002008010) / πάντα (w_n58002008012) — and does not overlap the
 *     πάντα text box.
 */

const doc = (): KrDocument =>
  lowfatToDocuments(readFileSync('tests/fixtures-sblgnt-lowfat-heb-2-8.xml', 'utf8'), {
    book: 'Hebrews',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
    sourceId: 'macula-greek-sblgnt-lowfat',
  })[0]!;

const isLine = (e: { kind: string }): e is LineElement => e.kind === 'line';
const isText = (e: { kind: string }): e is TextElement => e.kind === 'text';
const isUprightWord = (e: { kind: string }): e is TextElement =>
  isText(e) && !(e as TextElement).small && !(e as TextElement).rotate;

/** Glyph box of an UPRIGHT word text (ascent ≈ 14, descent ≈ 3 at 18px). */
function uprightBox(t: TextElement): { x0: number; x1: number; y0: number; y1: number } {
  const w = measureText(t.text);
  const x0 = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'end' ? t.x - w : t.x;
  return { x0, x1: x0 + w, y0: t.y - 14, y1: t.y + 3 };
}

// Rotated texts are modelled as their ROTATED BOUNDING QUAD (measured width;
// ascent 13 / descent 3, small 10 / 3), shrunk 3px per side, then tested with
// the separating-axis theorem — same modelling as the characterization guard.
type Quad = [number, number][];

function rotatedQuad(t: TextElement): Quad {
  const small = !!t.small;
  const w = measureText(t.text, small ? SMALL_FONT : undefined);
  const asc = small ? 10 : 13;
  const desc = 3;
  const SHRINK = 3;
  const x0 = Math.min(-w / 2 + SHRINK, -1);
  const x1 = Math.max(w / 2 - SHRINK, 1);
  const y0 = -asc + SHRINK;
  const y1 = desc - SHRINK;
  const th = ((t.rotate ?? 0) * Math.PI) / 180;
  const cos = Math.cos(th);
  const sin = Math.sin(th);
  const rot = (px: number, py: number): [number, number] => [
    t.x + px * cos - py * sin,
    t.y + px * sin + py * cos,
  ];
  return [rot(x0, y0), rot(x1, y0), rot(x1, y1), rot(x0, y1)];
}

function boxQuad(b: { x0: number; x1: number; y0: number; y1: number }, shrink: number): Quad {
  return [
    [b.x0 + shrink, b.y0 + shrink],
    [b.x1 - shrink, b.y0 + shrink],
    [b.x1 - shrink, b.y1 - shrink],
    [b.x0 + shrink, b.y1 - shrink],
  ];
}

/** A line as a hair-thin quad so segment × quad reuses the SAT test. */
function lineQuad(l: LineElement): Quad {
  const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) || 1;
  const nx = (-(l.y2 - l.y1) / len) * 0.25;
  const ny = ((l.x2 - l.x1) / len) * 0.25;
  return [
    [l.x1 + nx, l.y1 + ny],
    [l.x2 + nx, l.y2 + ny],
    [l.x2 - nx, l.y2 - ny],
    [l.x1 - nx, l.y1 - ny],
  ];
}

/** Separating-axis test for two convex quads. */
function quadsOverlap(a: Quad, b: Quad): boolean {
  for (const quad of [a, b]) {
    for (let i = 0; i < quad.length; i++) {
      const [px1, py1] = quad[i]!;
      const [px2, py2] = quad[(i + 1) % quad.length]!;
      const nx = py2 - py1;
      const ny = px1 - px2;
      let aMin = Infinity;
      let aMax = -Infinity;
      let bMin = Infinity;
      let bMax = -Infinity;
      for (const [x, y] of a) {
        const proj = x * nx + y * ny;
        aMin = Math.min(aMin, proj);
        aMax = Math.max(aMax, proj);
      }
      for (const [x, y] of b) {
        const proj = x * nx + y * ny;
        bMin = Math.min(bMin, proj);
        bMax = Math.max(bMax, proj);
      }
      if (aMax < bMin || bMax < aMin) return false;
    }
  }
  return true;
}

/** Length of the part of segment `l` inside `rect` (Liang–Barsky clip). */
function segmentLengthInRect(
  l: LineElement,
  rect: { x0: number; x1: number; y0: number; y1: number },
): number {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [l.x1 - rect.x0, rect.x1 - l.x1, l.y1 - rect.y0, rect.y1 - l.y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i]! < 0) return 0; // parallel and outside
    } else {
      const r = q[i]! / p[i]!;
      if (p[i]! < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
    }
  }
  if (t0 >= t1) return 0;
  return (t1 - t0) * Math.hypot(dx, dy);
}

describe('Hebrews 2:8 — packed complement keeps its diagonal clear (SBLGNT)', () => {
  it('converts the expected sentence to a valid document', () => {
    const d = doc();
    expect(validateConvertedDocument(d).errors).toEqual([]);
    expect(d.text).toContain('ὑποτάξαι');
    expect(d.text).toContain('ἀνυπότακτον');
  });

  it('no word text overprints another (upright or rotated)', () => {
    const layout = layoutDocument(doc());
    const upright = layout.elements.filter(isUprightWord);
    const rotated = layout.elements.filter((e): e is TextElement => isText(e) && !!e.rotate);
    const collisions: string[] = [];
    for (let i = 0; i < upright.length; i++) {
      for (let j = i + 1; j < upright.length; j++) {
        const a = uprightBox(upright[i]!);
        const b = uprightBox(upright[j]!);
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        // require a real overprint, not a near-touch
        if (ox > 4 && oy > 4) collisions.push(`${upright[i]!.text} × ${upright[j]!.text}`);
      }
    }
    for (let i = 0; i < rotated.length; i++) {
      const qa = rotatedQuad(rotated[i]!);
      for (let j = i + 1; j < rotated.length; j++) {
        if (quadsOverlap(qa, rotatedQuad(rotated[j]!))) {
          collisions.push(`${rotated[i]!.text} × ${rotated[j]!.text}`);
        }
      }
      for (const t of upright) {
        if (quadsOverlap(qa, boxQuad(uprightBox(t), 3))) {
          collisions.push(`${rotated[i]!.text} × ${t.text}`);
        }
      }
    }
    expect(collisions.sort()).toEqual([]);
  });

  it('no solid line runs through an upright word', () => {
    const layout = layoutDocument(doc());
    const words = layout.elements.filter(isUprightWord);
    const lines = layout.elements.filter((e): e is LineElement => isLine(e) && e.style === 'solid');
    const PAD = 2; // shrink the glyph box: abutting/grazing is legitimate
    const MIN_RUN = 4; // a line must run >4px inside the shrunk box to count
    // The word's baseline sits textRise (6px) below the text anchor; a line
    // TERMINATING there is a junction, not a crossing.
    const BASELINE_DROP = 6;
    const endsOnBaseline = (l: LineElement, b: ReturnType<typeof uprightBox>, ty: number) =>
      [
        [l.x1, l.y1],
        [l.x2, l.y2],
      ].some(
        ([x, y]) => x! >= b.x0 - 2 && x! <= b.x1 + 2 && Math.abs(y! - (ty + BASELINE_DROP)) <= 4,
      );
    const clashes: string[] = [];
    for (const t of words) {
      const b = uprightBox(t);
      const shrunk = { x0: b.x0 + PAD, x1: b.x1 - PAD, y0: b.y0 + PAD, y1: b.y1 - PAD };
      if (shrunk.x1 <= shrunk.x0 || shrunk.y1 <= shrunk.y0) continue;
      for (const l of lines) {
        if (endsOnBaseline(l, b, t.y)) continue; // junction, not a crossing
        if (segmentLengthInRect(l, shrunk) > MIN_RUN) {
          clashes.push(`${l.role}/${l.style} × ${t.text}`);
        }
      }
    }
    expect(clashes.sort()).toEqual([]);
  });

  it('keeps the rotated ἀνυπότακτον diagonal clear of the ὑποτάξαι/πάντα sub-baseline and of πάντα', () => {
    const d = doc();
    const layout = layoutDocument(d);
    const anypotakton = layout.elements.find(
      (e): e is TextElement => isText(e) && !!e.rotate && e.text.startsWith('ἀνυπότακτον'),
    );
    expect(anypotakton, 'rotated ἀνυπότακτον').toBeDefined();
    const quad = rotatedQuad(anypotakton!);

    // (a) The word rides ONE solid line — its own slant (the relation whose
    // dependent is its node). Every other solid line must miss its quad; the
    // pre-fix bug drove the πάντα baseline and the τὰ slant straight through.
    const ownRelIds = new Set(
      d.syntax.relations.filter((r) => r.dependentId === anypotakton!.nodeId).map((r) => r.id),
    );
    expect(ownRelIds.size).toBeGreaterThanOrEqual(1);
    const crossings = layout.elements
      .filter(
        (e): e is LineElement =>
          isLine(e) && e.style === 'solid' && !(e.relationId && ownRelIds.has(e.relationId)),
      )
      .filter((l) => quadsOverlap(quad, lineQuad(l)))
      .map((l) => `${l.role}/${l.style} nodeId=${l.nodeId ?? '-'}`);
    expect(crossings.sort()).toEqual([]);

    // (b) …and in particular the ἐν τῷ ὑποτάξαι sub-baseline: the solid
    // baseline segments of ὑποτάξαι (w_n58002008010) and πάντα
    // (w_n58002008012) must not touch the quad.
    const subBaselines = layout.elements.filter(
      (e): e is LineElement =>
        isLine(e) &&
        e.role === 'baseline' &&
        e.style === 'solid' &&
        (e.nodeId === 'w_n58002008010' || e.nodeId === 'w_n58002008012'),
    );
    expect(subBaselines.length).toBeGreaterThanOrEqual(2);
    for (const l of subBaselines) {
      expect(
        quadsOverlap(quad, lineQuad(l)),
        `ἀνυπότακτον quad × sub-baseline of ${l.nodeId}`,
      ).toBe(false);
    }

    // (c) …and the word πάντα itself (text-text overlap, unshrunk box).
    const panta = layout.elements.find(
      (e): e is TextElement => isUprightWord(e) && e.nodeId === 'w_n58002008012',
    );
    expect(panta, 'upright πάντα').toBeDefined();
    expect(
      quadsOverlap(quad, boxQuad(uprightBox(panta!), 0)),
      'ἀνυπότακτον quad × πάντα text box',
    ).toBe(false);
  });
});
