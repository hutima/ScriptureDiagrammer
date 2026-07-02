import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { maculaHebrewToDocuments } from '@/io/macula-hebrew';
import { sampleDocuments } from '@/fixtures';
import { layoutDocument } from '@/domain/layout';
import type { DiagramLayout, LineElement } from '@/domain/layout';
import type { KrDocument } from '@/domain/schema';

/**
 * KELLOGG-REED CHARACTERIZATION HARNESS — the safety net for the KR layout
 * refactor (see docs/kr-refactor-status.md).
 *
 * Two guards, both deliberately tolerant of harmless x/y drift:
 *
 * 1. STRUCTURAL SNAPSHOTS — per passage: line counts by role/style, every text
 *    label in draw order, the sets of node/relation ids stamped on primitives
 *    (the selection/hover/export contract), and coarse overall bounds. A pure
 *    code-motion refactor must keep these byte-identical; a genuine geometry
 *    change shows up as a reviewable snapshot diff.
 *
 * 2. CONNECTIVITY INVARIANT — every line in a diagram must reach, through
 *    touching or crossing segments, a component that is a real clause diagram
 *    (contains a subject|predicate divider) or a deliberate float (vocative /
 *    interjection / introductory particle / conjunction). This catches the
 *    "locally plausible but detached" bug class (the Gen 1:11 rail stub, the
 *    Colossians 1 disconnects of #199) in ANY corpus passage, regardless of
 *    where positions land.
 */

type Named = { name: string; doc: KrDocument };

const nestle = (file: string, book: string): Named[] =>
  lowfatToDocuments(readFileSync(`tests/${file}`, 'utf8'), { book }).map((doc) => ({
    name: `nestle ${doc.title}`,
    doc,
  }));
const sblgnt = (file: string, book: string): Named[] =>
  lowfatToDocuments(readFileSync(`tests/${file}`, 'utf8'), {
    book,
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
  }).map((doc) => ({ name: `sblgnt ${doc.title}`, doc }));
const hebrew = (file: string, book: string): Named[] =>
  maculaHebrewToDocuments(readFileSync(`tests/${file}`, 'utf8'), { book }).map((doc) => ({
    name: `wlc ${doc.title}`,
    doc,
  }));

const corpus: Named[] = [
  ...nestle('fixtures-lowfat-col-1-9-16.xml', 'Colossians'),
  ...nestle('fixtures-lowfat-mark-1-19-20.xml', 'Mark'),
  ...nestle('fixtures-lowfat-mark-5-25-34.xml', 'Mark'),
  ...nestle('fixtures-lowfat-phil-1-1-2.xml', 'Philippians'),
  ...sblgnt('fixtures-sblgnt-lowfat-2cor-5-4.xml', '2 Corinthians'),
  ...sblgnt('fixtures-sblgnt-lowfat-col-1-15.xml', 'Colossians'),
  ...sblgnt('fixtures-sblgnt-lowfat-col-1-16.xml', 'Colossians'),
  ...sblgnt('fixtures-sblgnt-lowfat-col-1-9-20.xml', 'Colossians'),
  ...sblgnt('fixtures-sblgnt-lowfat-eph-5-3-33.xml', 'Ephesians'),
  ...sblgnt('fixtures-sblgnt-lowfat-mark-1-19-20.xml', 'Mark'),
  ...sblgnt('fixtures-sblgnt-lowfat-mark-5-21-43.xml', 'Mark'),
  ...sblgnt('fixtures-sblgnt-lowfat-mark-5-25-34.xml', 'Mark'),
  ...sblgnt('fixtures-sblgnt-lowfat-philemon.xml', 'Philemon'),
  ...sblgnt('fixtures-sblgnt-lowfat-rom-9-11.xml', 'Romans'),
  ...sblgnt('fixtures-sblgnt-lowfat-titus-2-13.xml', 'Titus'),
  ...hebrew('fixtures-macula-hebrew-gen-1-1.xml', 'Genesis'),
  ...hebrew('fixtures-macula-hebrew-gen-1-1-3.xml', 'Genesis'),
  ...hebrew('fixtures-macula-hebrew-gen-1-11.xml', 'Genesis'),
  ...hebrew('fixtures-macula-hebrew-psa-1-1-2.xml', 'Psalms'),
  ...hebrew('fixtures-macula-hebrew-deu-6-4.xml', 'Deuteronomy'),
  ...sampleDocuments.map((doc) => ({ name: `sample ${doc.id}`, doc })),
];

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
