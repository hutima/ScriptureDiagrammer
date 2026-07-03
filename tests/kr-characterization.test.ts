import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import { measureText, SMALL_FONT } from '@/domain/layout/measure';
import type { DiagramLayout, LineElement, TextElement } from '@/domain/layout';
import type { KrDocument } from '@/domain/schema';
import { loadCorpus, type Named } from './kr-corpus';

/**
 * KELLOGG-REED CHARACTERIZATION HARNESS — the safety net for the KR layout
 * refactor and the compactness (band-packing) work (see
 * docs/kr-refactor-status.md).
 *
 * Guards, all deliberately tolerant of harmless x/y drift:
 *
 * 1. STRUCTURAL SNAPSHOTS — per passage: line counts by role/style, every text
 *    label in draw order, the sets of node/relation ids stamped on primitives
 *    (the selection/hover/export contract), coarse overall bounds, and the
 *    COMPACTNESS metric (width rounded to 10, area rounded to 1000 px²) that
 *    makes every packing PR's win measurable and any accidental growth visible.
 *    A pure code-motion refactor must keep these byte-identical; a genuine
 *    geometry change shows up as a reviewable snapshot diff.
 *
 * 2. CONNECTIVITY INVARIANT — every line in a diagram must reach, through
 *    touching or crossing segments, a component that is a real clause diagram
 *    (contains a subject|predicate divider) or a deliberate float (vocative /
 *    interjection / introductory particle / conjunction). This catches the
 *    "locally plausible but detached" bug class (the Gen 1:11 rail stub, the
 *    Colossians 1 disconnects of #199) in ANY corpus passage, regardless of
 *    where positions land.
 *
 * 3. CLASH GUARDS (frozen-offender snapshots, like connectivity):
 *    word-text × word-text overprint, line-through-word-text, and rotated
 *    (diagonal) text overprint. Pre-existing offenders are frozen; a layout
 *    change must never add one.
 */

const corpus: Named[] = loadCorpus();

const isLine = (e: { kind: string }): e is LineElement => e.kind === 'line';

/** Structural summary — stable under harmless position drift. */
function summarize(layout: DiagramLayout) {
  const lines = layout.elements.filter(isLine);
  const linesByRole: Record<string, number> = {};
  for (const l of lines) {
    const key = `${l.role}/${l.style}`;
    linesByRole[key] = (linesByRole[key] ?? 0) + 1;
  }
  return {
    bounds: `${Math.round(layout.width / 10) * 10}x${Math.round(layout.height / 10) * 10}`,
    // COMPACTNESS metric — width to the nearest 10 and area to the nearest
    // 1000 px² (px-level area rounding would flap on sub-pixel drift). A
    // packing PR must show these only shrinking; growth demands explanation.
    compactness: `w=${Math.round(layout.width / 10) * 10} areaK=${Math.round((layout.width * layout.height) / 1000)}`,
    lines: Object.fromEntries(Object.entries(linesByRole).sort(([a], [b]) => a.localeCompare(b))),
    texts: layout.elements.flatMap((e) => (e.kind === 'text' ? [e.text] : [])),
    nodeIds: [...new Set(layout.elements.flatMap((e) => (e.nodeId ? [e.nodeId] : [])))].sort(),
    relationIds: [
      ...new Set(layout.elements.flatMap((e) => (e.relationId ? [e.relationId] : []))),
    ].sort(),
  };
}

// ---------------------------------------------------------------------------
// Connectivity: segments touch when an endpoint of one lies on the other
// (within eps — the engine leaves deliberate ~2px micro-gaps beside dividers,
// covered by stroke width) or when they properly cross.
const EPS = 3;

function onSegment(x: number, y: number, l: LineElement): boolean {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - l.x1) * dx + (y - l.y1) * dy) / len2));
  return Math.hypot(l.x1 + t * dx - x, l.y1 + t * dy - y) <= EPS;
}
function crossProduct(ox: number, oy: number, ax: number, ay: number, bx: number, by: number) {
  return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
}
function properlyIntersect(a: LineElement, b: LineElement): boolean {
  const d1 = crossProduct(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
  const d2 = crossProduct(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
  const d3 = crossProduct(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
  const d4 = crossProduct(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}
function touches(a: LineElement, b: LineElement): boolean {
  return (
    onSegment(a.x1, a.y1, b) ||
    onSegment(a.x2, a.y2, b) ||
    onSegment(b.x1, b.y1, a) ||
    onSegment(b.x2, b.y2, a) ||
    properlyIntersect(a, b)
  );
}

/** Union-find over the layout's lines by geometric contact. */
function components(lines: LineElement[]): LineElement[][] {
  const parent = lines.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < lines.length; i++)
    for (let j = i + 1; j < lines.length; j++)
      if (touches(lines[i]!, lines[j]!)) parent[find(i)] = find(j);
  const groups = new Map<number, LineElement[]>();
  lines.forEach((l, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(l);
  });
  return [...groups.values()];
}

/** Relation types drawn deliberately unconnected from the clause baseline. */
const FLOAT_TYPES = new Set(['vocative', 'interjection', 'particle', 'conjunction']);

/** Clause-spine coordinator WORDS (γάρ, ὅτι, וַ …) ride beside the dashed
 *  spine on their own little baseline — deliberately unconnected. */
function spineCoordinatorNodes(doc: KrDocument): Set<string> {
  const clauses = new Set(
    doc.syntax.nodes.filter((n) => n.kind === 'clause').map((n) => n.id),
  );
  return new Set(
    doc.syntax.relations
      .filter((r) => r.type === 'coordinator' && clauses.has(r.headId))
      .map((r) => r.dependentId),
  );
}

/** All node/relation ids inside float-relation subtrees (their drawn blocks
 *  carry these as nodeId/relationId tags). */
function floatIds(doc: KrDocument): { nodes: Set<string>; rels: Set<string> } {
  const kids = new Map<string, string[]>();
  for (const r of doc.syntax.relations) {
    if (!kids.has(r.headId)) kids.set(r.headId, []);
    kids.get(r.headId)!.push(r.dependentId);
  }
  const nodes = new Set<string>();
  const stack = doc.syntax.relations
    .filter((r) => FLOAT_TYPES.has(r.type))
    .map((r) => r.dependentId);
  while (stack.length) {
    const id = stack.pop()!;
    if (nodes.has(id)) continue;
    nodes.add(id);
    stack.push(...(kids.get(id) ?? []));
  }
  const rels = new Set(
    doc.syntax.relations
      .filter((r) => nodes.has(r.dependentId) || nodes.has(r.headId))
      .map((r) => r.id),
  );
  return { nodes, rels };
}

describe('KR characterization — structural snapshots', () => {
  for (const { name, doc } of corpus) {
    it(name, () => {
      expect(summarize(layoutDocument(doc, doc.layoutHints))).toMatchSnapshot();
    });
  }
});

/** Glyph box of an UPRIGHT word text. `y` is the text baseline; glyphs sit
 *  mostly above it (ascent ≈ 14, descent ≈ 3 at the 18px word size). */
function uprightBox(t: TextElement): { x0: number; x1: number; y0: number; y1: number } {
  const w = measureText(t.text);
  const x0 = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'end' ? t.x - w : t.x;
  return { x0, x1: x0 + w, y0: t.y - 14, y1: t.y + 3 };
}

const isUprightWord = (e: { kind: string }): e is TextElement =>
  e.kind === 'text' && !(e as TextElement).small && !(e as TextElement).rotate;

describe('KR characterization — word texts do not overprint each other (frozen)', () => {
  // Guard for the COMPACTION work (band packing): two horizontal word
  // texts must not overlap. Pre-existing collisions are frozen the same way
  // as connectivity offenders — a layout change must not add one. Rotated
  // (diagonal) texts are covered by their own guard below; small connector
  // labels are out of scope here.
  for (const { name, doc } of corpus) {
    it(name, () => {
      const layout = layoutDocument(doc, doc.layoutHints);
      const words = layout.elements.filter(isUprightWord);
      const collisions: string[] = [];
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
          const a = uprightBox(words[i]!);
          const b = uprightBox(words[j]!);
          const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
          const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
          // require a real overprint, not a near-touch
          if (ox > 4 && oy > 4) collisions.push(`${words[i]!.text} × ${words[j]!.text}`);
        }
      }
      expect(collisions.sort()).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// Clash guard 2: no line may pass THROUGH an upright word's glyph box.
//
// Exemptions (designed, not incidental — see docs/kr-refactor-status.md):
//  - dashed `coordination` lines: the compound-sentence verb spine runs
//    verb-to-verb and deliberately passes BEHIND the verb-aligned words; the
//    renderer paints a paper-coloured halo under every upright word precisely
//    so this reads cleanly (kr/clause.ts "The dashed bar runs verb-to-verb",
//    render/svg.ts "paper-coloured halo"). Blanket-exempting the class keeps
//    the guard quiet for every such join without per-passage freezing.
//  - grazing contact: the box is shrunk 2px per side and a line must run more
//    than 4px INSIDE it to count, so separator ticks/dividers that legitimately
//    abut a word, and the word's own baseline ~6px under the anchor, never fire.
//  - a line TERMINATING on the word's own baseline (an endpoint within the
//    word's span, within 4px of the baseline sitting 6px below the text
//    anchor): that is a junction, not a crossing — the compound-spine lead
//    stem drops from the lead stub down to the spine top, which IS the first
//    verb's baseline, passing behind the verb (halo-backed, like the bar). A
//    line passing straight THROUGH a word (both endpoints beyond it) still
//    fires, so a packer regression cannot hide behind this.
//
// Pre-existing violations are FROZEN as snapshots (same discipline as the
// connectivity offenders): a layout change must never add one.

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

describe('KR characterization — lines do not run through word texts (frozen)', () => {
  for (const { name, doc } of corpus) {
    it(name, () => {
      const layout = layoutDocument(doc, doc.layoutHints);
      const words = layout.elements.filter(isUprightWord);
      const lines = layout.elements
        .filter(isLine)
        // The verb-to-verb coordination spine passes behind words by design
        // (halo-backed) — see the exemption rationale above.
        .filter((l) => !(l.role === 'coordination' && l.style === 'dashed'));
      const PAD = 2; // shrink the glyph box: abutting/grazing is legitimate
      const MIN_RUN = 4; // a line must run >4px inside the shrunk box to count
      // The word's baseline sits textRise (6px) below the text anchor.
      const BASELINE_DROP = 6;
      const endsOnBaseline = (l: LineElement, b: ReturnType<typeof uprightBox>, ty: number) =>
        [
          [l.x1, l.y1],
          [l.x2, l.y2],
        ].some(
          ([x, y]) =>
            x! >= b.x0 - 2 && x! <= b.x1 + 2 && Math.abs(y! - (ty + BASELINE_DROP)) <= 4,
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
      expect(clashes.sort()).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// Clash guard 3: ROTATED (diagonal) texts — the words written along modifier
// slants, prepositions on PP slants, and the -90° join labels — must not
// overprint each other or an upright word. Each rotated text is modelled as
// its ROTATED BOUNDING QUAD (measured width; ascent 13 / descent 3, small
// 10 / 3), shrunk 3px per side so near-touches between parallel slants don't
// fire, then tested with the separating-axis theorem. Pre-existing offenders
// are frozen; a layout change must never add one.

type Quad = [number, number][];

function rotatedQuad(t: TextElement): Quad {
  const small = !!t.small;
  const w = measureText(t.text, small ? SMALL_FONT : undefined);
  const asc = small ? 10 : 13;
  const desc = 3;
  const SHRINK = 3;
  // Local rect around the anchor (all rotated texts are anchor: middle).
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

describe('KR characterization — rotated texts do not overprint (frozen)', () => {
  for (const { name, doc } of corpus) {
    it(name, () => {
      const layout = layoutDocument(doc, doc.layoutHints);
      const rotated = layout.elements.filter(
        (e): e is TextElement => e.kind === 'text' && !!(e as TextElement).rotate,
      );
      const upright = layout.elements.filter(isUprightWord);
      const collisions: string[] = [];
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
      expect(collisions.sort()).toMatchSnapshot();
    });
  }
});

describe('KR characterization — line connectivity (frozen offender snapshot)', () => {
  // Detached components that are neither a clause diagram, a deliberate
  // float, nor a decoration mark are SNAPSHOTTED, not required to be empty:
  // the corpus has a tail of pre-existing detachments (clause-spine
  // coordinator stubs, and some candidate bugs to triage after the refactor —
  // see docs/kr-refactor-status.md). The refactor must not ADD any: a new
  // disconnect anywhere in the corpus changes the snapshot and fails.
  // Signatures are coarse (role/style, relation type, length rounded to 5)
  // so harmless position drift does not flap the test.
  for (const { name, doc } of corpus) {
    it(name, () => {
      const layout = layoutDocument(doc, doc.layoutHints);
      const lines = layout.elements.filter(isLine);
      const relType = new Map(doc.syntax.relations.map((r) => [r.id, r.type]));
      const floats = floatIds(doc);
      const spineCoords = spineCoordinatorNodes(doc);
      const offenders = components(lines).filter((group) => {
        const isClause = group.some((l) => l.role === 'divider');
        const isFloat = group.some(
          (l) =>
            (l.nodeId && (floats.nodes.has(l.nodeId) || spineCoords.has(l.nodeId))) ||
            (l.relationId &&
              (floats.rels.has(l.relationId) ||
                FLOAT_TYPES.has(relType.get(l.relationId) ?? ''))),
        );
        // Short strokes drawn deliberately BESIDE a line as marks — the
        // apposition "=" / "//" double strokes — are decorations, not
        // structure; a component made only of such marks is fine.
        const isMark = group.every((l) => Math.hypot(l.x2 - l.x1, l.y2 - l.y1) <= 16);
        // A clause-spine connector LABEL stub: the first spine member's
        // subordinator (Ἐὰν, ὅτι…) rides a short untagged baseline floating
        // above the member — deliberate. (A real detached rail always drags
        // its hanging slants/stems into the same component, so a lone short
        // baseline is safe to exempt.)
        const isLabelStub =
          group.length === 1 &&
          group[0]!.role === 'baseline' &&
          !group[0]!.relationId &&
          Math.hypot(group[0]!.x2 - group[0]!.x1, group[0]!.y2 - group[0]!.y1) <= 130;
        return !isClause && !isFloat && !isMark && !isLabelStub;
      });
      const signatures = offenders
        .map((g) =>
          g
            .map(
              (l) =>
                `${l.role}/${l.style}${l.relationId ? `[${relType.get(l.relationId)}]` : ''} len≈${Math.round(Math.hypot(l.x2 - l.x1, l.y2 - l.y1) / 5) * 5}`,
            )
            .sort()
            .join(' + '),
        )
        .sort();
      expect(signatures).toMatchSnapshot();
    });
  }
});
