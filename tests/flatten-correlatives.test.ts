import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { flattenCorrelativeCoordinations } from '@/domain/model';
import { layoutForMode } from '@/domain/layout';
import { KrDocumentSchema, type KrDocument } from '@/domain/schema';

/**
 * CORRELATIVE-CHAIN FLATTENING — Colossians 1:16.
 *
 * "… τὰ ὁρατὰ καὶ τὰ ἀόρατα, εἴτε θρόνοι εἴτε κυριότητες εἴτε ἀρχαὶ εἴτε
 * ἐξουσίαι". Both Lowfat editions bracket the four-member εἴτε list into two
 * juxtaposed PAIRS with no conjunction between them, which the converter's
 * juxtaposed-sibling default labelled APPOSITION — so the diagram claimed
 * "ἀρχαί/ἐξουσίαι rename θρόνοι/κυριότητες" instead of continuing one
 * alternation. `flattenCorrelativeCoordinations` re-reads same-lemma
 * correlative pairs (εἴτε/οὔτε/μήτε) as ONE flat coordination; the layout
 * engine then draws its usual correlative fork (one εἴτε per member).
 */

const nestle = (): KrDocument =>
  lowfatToDocuments(readFileSync('tests/fixtures-lowfat-col-1-9-16.xml', 'utf8'), {
    book: 'Colossians',
  })[0]!;

const sblgnt = (): KrDocument =>
  lowfatToDocuments(readFileSync('tests/fixtures-sblgnt-lowfat-col-1-16.xml', 'utf8'), {
    book: 'Colossians',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
  })[0]!;

const nodeOfSurface = (d: KrDocument, surface: string) => {
  const tok = d.tokens.find((t) => t.surface.startsWith(surface))!;
  return d.syntax.nodes.find((n) => n.tokenIds.includes(tok.id))!;
};
const surfaceOf = (d: KrDocument, nodeId: string) => {
  const n = d.syntax.nodes.find((x) => x.id === nodeId)!;
  return n.tokenIds.map((t) => d.tokens.find((x) => x.id === t)!.surface).join(' ');
};

describe.each([
  ['Nestle1904', nestle],
  ['SBLGNT', sblgnt],
])('%s Colossians 1:16 — εἴτε chain is one flat coordination', (_label, doc) => {
  it('is valid, complete, and lays out in KR mode', () => {
    const d = doc();
    expect(() => KrDocumentSchema.parse(d)).not.toThrow();
    const ids = new Set(d.syntax.nodes.map((n) => n.id));
    for (const r of d.syntax.relations) {
      expect(ids.has(r.headId)).toBe(true);
      expect(ids.has(r.dependentId)).toBe(true);
    }
    const layout = layoutForMode('kellogg-reed', d);
    expect(layout.elements.length).toBeGreaterThan(0);
  });

  it('lists κυριότητες, ἀρχαί, ἐξουσίαι as conjuncts of θρόνοι, in reading order', () => {
    const d = doc();
    const thr = nodeOfSurface(d, 'θρόνοι');
    const conjuncts = d.syntax.relations
      .filter((r) => r.headId === thr.id && r.type === 'conjunct')
      .map((r) => surfaceOf(d, r.dependentId));
    expect(conjuncts).toEqual(['κυριότητες', 'ἀρχαὶ', 'ἐξουσίαι']);
  });

  it('keeps all four εἴτε as coordinators inside the fork', () => {
    const d = doc();
    const memberIds = new Set([
      nodeOfSurface(d, 'θρόνοι').id,
      nodeOfSurface(d, 'κυριότητες').id,
      nodeOfSurface(d, 'ἀρχα').id,
      nodeOfSurface(d, 'ἐξουσίαι').id,
    ]);
    const eite = d.syntax.relations.filter(
      (r) => r.type === 'coordinator' && surfaceOf(d, r.dependentId).startsWith('εἴτε'),
    );
    expect(eite).toHaveLength(4);
    // Each εἴτε rides the fork: its head is the list head or a member of it
    // (SBLGNT parses some marks onto their member; the layout hoists those).
    for (const r of eite) expect(memberIds.has(r.headId)).toBe(true);
  });

  it('drops the pair-appositions but keeps the list appositive to τὰ ὁρατὰ/ἀόρατα', () => {
    const d = doc();
    const four = ['θρόνοι', 'κυριότητες', 'ἀρχα', 'ἐξουσίαι'].map(
      (s) => nodeOfSurface(d, s).id,
    );
    const appos = d.syntax.relations.filter((r) => r.type === 'apposition');
    // no apposition BETWEEN list members …
    expect(appos.some((r) => four.includes(r.headId) && four.includes(r.dependentId))).toBe(false);
    // … but the list as a whole still renames the ὁρατά/ἀόρατα group.
    const horata = nodeOfSurface(d, 'ὁρατὰ');
    expect(
      appos.some((r) => r.headId === horata.id && r.dependentId === nodeOfSurface(d, 'θρόνοι').id),
    ).toBe(true);
  });
});

describe('flattenCorrelativeCoordinations — conservatism', () => {
  const mkDoc = (lemma: string): KrDocument =>
    KrDocumentSchema.parse({
      schemaVersion: 1,
      id: 'doc_test',
      title: 'synthetic',
      language: 'grc',
      text: '',
      notes: '',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      layoutHints: {},
      tokens: ['A', lemma, 'B', 'C', lemma, 'D'].map((s, i) => ({
        id: `t${i}`,
        index: i,
        surface: s,
        lemma: s,
        language: 'grc',
        pos: s === lemma ? 'conjunction' : 'noun',
      })),
      syntax: {
        rootId: 'root',
        nodes: [
          { id: 'root', kind: 'clause', clauseType: 'independent', tokenIds: [] },
          ...[0, 1, 2, 3, 4, 5].map((i) => ({
            id: `n${i}`,
            kind: 'word' as const,
            tokenIds: [`t${i}`],
          })),
        ],
        relations: [
          { id: 'r_subj', type: 'subject', headId: 'root', dependentId: 'n0' },
          { id: 'r_c1', type: 'coordinator', headId: 'n0', dependentId: 'n1' },
          { id: 'r_j1', type: 'conjunct', headId: 'n0', dependentId: 'n2' },
          { id: 'r_c2', type: 'coordinator', headId: 'n3', dependentId: 'n4' },
          { id: 'r_j2', type: 'conjunct', headId: 'n3', dependentId: 'n5' },
          { id: 'r_ap', type: 'apposition', headId: 'n0', dependentId: 'n3' },
        ],
      },
    });

  it('flattens same-lemma correlative pairs (μήτε) into one list', () => {
    const out = flattenCorrelativeCoordinations(mkDoc('μήτε'));
    const conj = out.syntax.relations.filter((r) => r.headId === 'n0' && r.type === 'conjunct');
    expect(conj.map((r) => r.dependentId)).toEqual(['n2', 'n3', 'n5']);
    expect(out.syntax.relations.filter((r) => r.type === 'apposition')).toHaveLength(0);
    // relation ids are preserved — the pair link became the n3 conjunct.
    expect(out.syntax.relations.find((r) => r.id === 'r_ap')!.type).toBe('conjunct');
  });

  it('leaves plain καί coordinations in apposition untouched', () => {
    const doc = mkDoc('καί');
    expect(flattenCorrelativeCoordinations(doc)).toBe(doc);
  });

  // 1 Cor 3:22 shape: every εἴτε rides the head; other members default to
  // apposition. Marks (2) vs members (1) ⇒ the apposition is a member.
  const mkMarked = (conjunct: boolean): KrDocument =>
    KrDocumentSchema.parse({
      schemaVersion: 1,
      id: 'doc_test2',
      title: 'synthetic',
      language: 'grc',
      text: '',
      notes: '',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      layoutHints: {},
      tokens: ['εἴτε', 'A', 'εἴτε', 'B', 'C'].map((s, i) => ({
        id: `t${i}`,
        index: i,
        surface: s,
        lemma: s,
        language: 'grc',
        pos: s === 'εἴτε' ? 'conjunction' : 'noun',
      })),
      syntax: {
        rootId: 'root',
        nodes: [
          { id: 'root', kind: 'clause', clauseType: 'independent', tokenIds: [] },
          ...[0, 1, 2, 3, 4].map((i) => ({
            id: `n${i}`,
            kind: 'word' as const,
            tokenIds: [`t${i}`],
          })),
        ],
        relations: [
          { id: 'r_subj', type: 'subject', headId: 'root', dependentId: 'n1' },
          { id: 'r_c1', type: 'coordinator', headId: 'n1', dependentId: 'n0' },
          { id: 'r_c2', type: 'coordinator', headId: 'n1', dependentId: 'n2' },
          // balanced control: B already a conjunct, so C's apposition is real.
          ...(conjunct
            ? [{ id: 'r_j1', type: 'conjunct', headId: 'n1', dependentId: 'n3' }]
            : [{ id: 'r_a1', type: 'apposition', headId: 'n1', dependentId: 'n3' }]),
          { id: 'r_a2', type: 'apposition', headId: 'n1', dependentId: 'n4' },
        ],
      },
    });

  it('claims appositions as members while a head has unclaimed correlative marks', () => {
    const out = flattenCorrelativeCoordinations(mkMarked(false));
    // 2 marks, 1 member ⇒ the FIRST apposition (B) becomes the second member;
    // the marks are then balanced, so C's apposition survives as a real one.
    expect(out.syntax.relations.find((r) => r.id === 'r_a1')!.type).toBe('conjunct');
    expect(out.syntax.relations.find((r) => r.id === 'r_a2')!.type).toBe('apposition');
  });

  it('leaves a genuine apposition on a mark-balanced list untouched', () => {
    const doc = mkMarked(true);
    expect(flattenCorrelativeCoordinations(doc)).toBe(doc);
  });
});
