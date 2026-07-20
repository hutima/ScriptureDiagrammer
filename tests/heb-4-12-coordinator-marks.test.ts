import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
import { measureText, SMALL_FONT } from '@/domain/layout/measure';
import type { KrDocument } from '@/domain/schema';
import { validateConvertedDocument } from './helpers/validateConvertedDocument';

/**
 * COORDINATOR-MARK REGRESSION — Hebrews 4:12 (SBLGNT, doc sblgnt_hebrews_54):
 * "Ζῶν γὰρ ὁ λόγος τοῦ θεοῦ καὶ ἐνεργὴς καὶ τομώτερος … καὶ κριτικὸς …" —
 * FIVE coordinated predicate nominatives on one open Kellogg-Reed fork.
 *
 * With three or more conjuncts the solid fan arms from the junction sweep the
 * whole throat, so the per-join καὶ marks placed there (rotated −90 beside the
 * dashed bar, nodes w_n58004012007 / w_n58004012009 / w_n58004012026) were
 * GUARANTEED to be struck through by arms to the outer members. Fixed in
 * src/domain/layout/kr/coordination.ts: per-join multi marks now ride the
 * OPEN side of the dashed bar — where the infinitive and preposition forks
 * already place theirs. Single marks still rest ON the bar; correlative
 * stacks (the τε…καὶ of ἁρμῶν τε καὶ μυελῶν here) keep their throat-side
 * corner treatment by design, so the guards below are scoped to the three
 * per-join marks.
 *
 * Guards (empty-list style, nothing frozen):
 *  1. no SOLID line crosses a per-join mark's rotated quad — crossing the
 *     DASHED bar is the accepted rides-the-bar convention, so dashed is
 *     exempt;
 *  2. each per-join mark sits strictly on the OPEN side: its x is greater
 *     than the dashed coordination bar's x for this right-opening fork (the
 *     full-height dashed bar tagged w_n58004012001, spanning all five member
 *     baselines).
 */

const doc = (): KrDocument =>
  lowfatToDocuments(readFileSync('tests/fixtures-sblgnt-lowfat-heb-4-12.xml', 'utf8'), {
    book: 'Hebrews',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
    sourceId: 'macula-greek-sblgnt-lowfat',
  })[0]!;

/** The three per-join coordinator marks of the five-member fork. */
const PER_JOIN_MARK_NODES = ['w_n58004012007', 'w_n58004012009', 'w_n58004012026'];
/** The fork's first member — the full-height dashed bar carries its node id. */
const BAR_NODE = 'w_n58004012001';

const isLine = (e: { kind: string }): e is LineElement => e.kind === 'line';
const isText = (e: { kind: string }): e is TextElement => e.kind === 'text';

// Rotated texts are modelled as their ROTATED BOUNDING QUAD (measured width;
// ascent 13 / descent 3, small 10 / 3), shrunk 3px per side, then tested with
// the separating-axis theorem — same modelling as the characterization guard
// (kr-characterization.test.ts, mirrored here as in the Heb 2:8 regression;
// the helpers are file-local there, not shared).
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

/** The three per-join marks, as drawn (small rotated texts). */
function perJoinMarks(layout: ReturnType<typeof layoutDocument>): TextElement[] {
  const marks = layout.elements.filter(
    (e): e is TextElement =>
      isText(e) && !!e.small && !!e.rotate && PER_JOIN_MARK_NODES.includes(e.nodeId ?? ''),
  );
  expect(
    marks.map((m) => m.nodeId).sort(),
    'the three per-join καὶ marks',
  ).toEqual([...PER_JOIN_MARK_NODES].sort());
  return marks;
}

describe('Hebrews 4:12 — per-join coordinator marks ride the open side (SBLGNT)', () => {
  it('converts the expected sentence to a valid document', () => {
    const d = doc();
    expect(validateConvertedDocument(d).errors).toEqual([]);
    expect(d.text).toContain('Ζῶν');
    expect(d.text).toContain('τομώτερος');
    expect(d.text).toContain('κριτικὸς');
  });

  it('no solid line crosses a per-join καὶ mark (dashed bar exempt)', () => {
    const layout = layoutDocument(doc());
    const solids = layout.elements.filter(
      (e): e is LineElement => isLine(e) && e.style === 'solid',
    );
    const clashes: string[] = [];
    for (const mark of perJoinMarks(layout)) {
      const quad = rotatedQuad(mark);
      for (const l of solids) {
        if (quadsOverlap(quad, lineQuad(l))) {
          clashes.push(`${l.role}/${l.style} × ${mark.text} (${mark.nodeId})`);
        }
      }
    }
    expect(clashes.sort()).toEqual([]);
  });

  it('places every per-join mark strictly on the open side of the dashed bar', () => {
    const layout = layoutDocument(doc());
    // The fork's dashed bar (possibly gapped into segments) carries the first
    // member's node id and spans all five member baselines full-height.
    const barSegs = layout.elements.filter(
      (e): e is LineElement =>
        isLine(e) && e.role === 'coordination' && e.style === 'dashed' && e.nodeId === BAR_NODE,
    );
    expect(barSegs.length).toBeGreaterThanOrEqual(1);
    const barX = Math.max(...barSegs.flatMap((l) => [l.x1, l.x2]));
    const misplaced = perJoinMarks(layout)
      .filter((m) => !(m.x > barX))
      .map((m) => `${m.text} (${m.nodeId}) x=${m.x.toFixed(1)} ≤ bar x=${barX.toFixed(1)}`);
    expect(misplaced).toEqual([]);
  });
});
