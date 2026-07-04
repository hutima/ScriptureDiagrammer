import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { layoutDocument } from '@/domain/layout';
import type { LineElement } from '@/domain/layout';
import { getNode } from '@/domain/model';

/**
 * Hebrews 1:1–4 (SBLGNT) — predicate-nominative slash → coordination-fork
 * connectivity regression.
 *
 * "ὃς ὢν ἀπαύγασμα τῆς δόξης καὶ χαρακτὴρ τῆς ὑποστάσεως αὐτοῦ": the
 * participle ὢν takes a COORDINATED predicate nominative (ἀπαύγασμα καὶ
 * χαρακτήρ), drawn as an open Kellogg-Reed fork. The back-slant separator's
 * FOOT rests on the baseline at sepX + 10, but the fork carries no baseline
 * of its own past its junction — so unless the fork's vertex is placed ON the
 * slash foot, the slash ends in empty space, visually detached from the very
 * complement it introduces.
 *
 * The assertions are purely geometric (no generated element ids): every
 * predicate-nominative/adjective separator whose dependent is a coordination
 * node must have its baseline-end touching the vertex of that fork's prongs.
 */

const docs = lowfatToDocuments(
  readFileSync('tests/fixtures-sblgnt-lowfat-heb-1-1-4.xml', 'utf8'),
  { book: 'Hebrews', dialect: sblgntDialect, docIdPrefix: 'sblgnt' },
);

const isLine = (e: { kind: string }): e is LineElement => e.kind === 'line';
const EPS = 0.5;
const touches = (x: number, y: number, l: LineElement) =>
  (Math.hypot(l.x1 - x, l.y1 - y) <= EPS) || (Math.hypot(l.x2 - x, l.y2 - y) <= EPS);

describe('Hebrews 1:1–4 predicate slash meets the coordination fork', () => {
  const doc = docs[0]!;

  it('covers the expected passage', () => {
    expect(doc.title).toContain('1:1');
    expect(doc.text).toContain('ἀπαύγασμα');
    expect(doc.text).toContain('χαρακτὴρ');
  });

  it('connects every fork-bound predicate separator to the fork vertex', () => {
    const layout = layoutDocument(doc, { mode: 'kellogg-reed' });
    const lines = layout.elements.filter(isLine);

    // Every predicateNominative/-Adjective relation whose dependent heads a
    // coordination (has conjunct children) — in this passage, r_s0_48
    // (ὢν → ἀπαύγασμα + χαρακτήρ).
    const forkComplementRels = doc.syntax.relations.filter(
      (r) =>
        (r.type === 'predicateNominative' || r.type === 'predicateAdjective') &&
        doc.syntax.relations.some((c) => c.headId === r.dependentId && c.type === 'conjunct') &&
        getNode(doc.syntax, r.dependentId)?.kind === 'word',
    );
    expect(forkComplementRels.length).toBeGreaterThanOrEqual(1);

    for (const rel of forkComplementRels) {
      const sep = lines.find((l) => l.relationId === rel.id && l.role === 'separator');
      expect(sep, `separator for ${rel.id}`).toBeTruthy();
      // The slash foot is the separator's lower end (larger y).
      const foot =
        sep!.y1 >= sep!.y2 ? { x: sep!.x1, y: sep!.y1 } : { x: sep!.x2, y: sep!.y2 };

      // The fork's prongs are solid coordination-role lines; the vertex is the
      // prong endpoint the slash must land on. At least two prongs (upper and
      // lower conjunct) must originate exactly at the slash foot.
      const prongsAtFoot = lines.filter(
        (l) => l.role === 'coordination' && l.style === 'solid' && touches(foot.x, foot.y, l),
      );
      expect(
        prongsAtFoot.length,
        `fork prongs meeting the slash foot of ${rel.id} at (${foot.x}, ${foot.y})`,
      ).toBeGreaterThanOrEqual(2);

      // And the main baseline must be drawn out to the foot (the bridge), so
      // the slash visibly stands on the line rather than floating.
      const baselineAtFoot = lines.some(
        (l) =>
          l.role === 'baseline' &&
          Math.abs(l.y1 - foot.y) <= EPS &&
          Math.abs(l.y2 - foot.y) <= EPS &&
          (Math.abs(l.x1 - foot.x) <= EPS || Math.abs(l.x2 - foot.x) <= EPS),
      );
      expect(baselineAtFoot, `baseline reaching the slash foot of ${rel.id}`).toBe(true);
    }
  });
});
