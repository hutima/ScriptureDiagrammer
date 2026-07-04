import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { layoutDocument, type LineElement } from '@/domain/layout';
import type { KrDocument } from '@/domain/schema';

/**
 * Colossians 2:11–12 — the "ἐν τῷ βαπτισμῷ ἐν ᾧ … συνηγέρθητε" shape, and the
 * GENERAL rule behind it: a word/noun in APPOSITION to a whole CLAUSE must be
 * drawn on the clause's own main line with the Reed-Kellogg apposition "="
 * (two short strokes across the baseline), never trailed off as a stray
 * right-hand modifier (the pre-fix "βαπτισμῷ hanging at the end of the raised
 * clause's cascade" bug).
 *
 * The two base editions parse this passage DIFFERENTLY, so both are checked:
 *  - SBLGNT (macula-greek) makes the raised-with-him clause the object of the
 *    first ἐν and hangs τῷ βαπτισμῷ on that clause by an `apposition` relation
 *    (clause head → noun dependent). THIS is the shape the layout fix targets.
 *  - Nestle1904 instead attaches the ἐν ᾧ clause `adjectival`-ly to βαπτίσματι
 *    (a noun-headed relative clause) with ἐν → βαπτίσματι as a plain
 *    prepositional object — already a faithful drawing, and unaffected by the
 *    fix. Asserting the asymmetry documents it and guards against a regression
 *    that would silently re-route one edition through the other's path.
 */

const isLine = (e: { kind: string }): e is LineElement => e.kind === 'line';

function convert(file: string, sblgnt: boolean): KrDocument {
  const opts = sblgnt
    ? { book: 'Colossians', dialect: sblgntDialect, docIdPrefix: 'sblgnt' }
    : { book: 'Colossians' };
  const docs = lowfatToDocuments(readFileSync(file, 'utf8'), opts);
  // The fixture holds exactly the Col 2:8–12 sentence.
  const doc = docs.find((d) => /2:(8|9|10|11|12)/.test(d.title)) ?? docs[0];
  expect(doc).toBeTruthy();
  return doc!;
}

/** Relations whose head is a clause and whose dependent is a bare word. */
function clauseHeadedWordAppositions(doc: KrDocument) {
  const kind = new Map(doc.syntax.nodes.map((n) => [n.id, n.kind] as const));
  return doc.syntax.relations.filter(
    (r) =>
      r.type === 'apposition' &&
      kind.get(r.headId) === 'clause' &&
      kind.get(r.dependentId) === 'word',
  );
}

/** Union-find over lines by endpoint contact — a coarse connectivity probe. */
function connectedToDivider(lines: LineElement[], seed: LineElement): boolean {
  const EPS = 3.5;
  const near = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by) <= EPS;
  const touch = (a: LineElement, b: LineElement) =>
    near(a.x1, a.y1, b.x1, b.y1) ||
    near(a.x1, a.y1, b.x2, b.y2) ||
    near(a.x2, a.y2, b.x1, b.y1) ||
    near(a.x2, a.y2, b.x2, b.y2) ||
    // endpoint of a lying on segment b (only the common axis-aligned cases matter here)
    (Math.abs(a.x1 - a.x2) < 0.6 && Math.abs(b.y1 - b.y2) < 0.6 &&
      Math.abs(a.x1 - Math.max(Math.min(a.x1, b.x2), b.x1)) < EPS) ;
  const seen = new Set<LineElement>([seed]);
  const stack = [seed];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const l of lines) {
      if (seen.has(l)) continue;
      if (touch(cur, l) || touch(l, cur)) {
        seen.add(l);
        stack.push(l);
      }
    }
  }
  return [...seen].some((l) => l.role === 'divider');
}

describe('Colossians 2:11–12 — clause-headed apposition draws the "=" (Side 1)', () => {
  it('SBLGNT: τῷ βαπτισμῷ appositive to the raised clause draws the apposition "=" (not a trailing stem)', () => {
    const doc = convert('tests/fixtures-sblgnt-lowfat-col-2-8-12.xml', true);
    const appos = clauseHeadedWordAppositions(doc);
    // The base tree encodes at least the βαπτισμῷ-on-clause apposition this way.
    expect(appos.length).toBeGreaterThanOrEqual(1);

    const layout = layoutDocument(doc, doc.layoutHints);
    const lines = layout.elements.filter(isLine);

    for (const rel of appos) {
      // The "=" is two short SEPARATOR strokes tagged with the apposition rel id.
      const marks = lines.filter((l) => l.role === 'separator' && l.relationId === rel.id);
      expect(marks.length).toBe(2);
      // …and the appositive stays connected to a real clause diagram (a divider),
      // rather than floating off the end of the cascade.
      const bridge = lines.find((l) => l.role === 'baseline' && l.relationId === rel.id);
      expect(bridge, `apposition ${rel.id} should carry a main-line bridge`).toBeTruthy();
      expect(connectedToDivider(lines, bridge!)).toBe(true);
    }
  });

  it('Nestle1904: the ἐν ᾧ clause is a noun-headed relative (adjectival on βαπτίσματι), already faithful', () => {
    const doc = convert('tests/fixtures-lowfat-col-2-8-12.xml', false);
    // No clause-headed apposition in this edition — nothing for the fix to change.
    expect(clauseHeadedWordAppositions(doc)).toHaveLength(0);
    // βαπτίσματι carries the raised clause adjectivally; ἐν governs it as a plain
    // prepositional object.
    const nodeById = new Map(doc.syntax.nodes.map((n) => [n.id, n] as const));
    const adjToClause = doc.syntax.relations.filter(
      (r) => r.type === 'adjectival' && nodeById.get(r.dependentId)?.kind === 'clause',
    );
    expect(adjToClause.length).toBeGreaterThanOrEqual(1);
    // The relative clause hangs on a dashed stem (the subordinate-clause convention).
    const layout = layoutDocument(doc, doc.layoutHints);
    const dashedStems = layout.elements.filter(
      (e): e is LineElement => e.kind === 'line' && e.style === 'dashed' && e.role === 'stem',
    );
    expect(dashedStems.length).toBeGreaterThanOrEqual(1);
  });
});
