import { describe, it, expect } from 'vitest';
import { KrDocumentSchema, type KrDocument } from '@/domain/schema';
import {
  BASELINE_COMPLEMENTS,
  isClauseChild,
  isDiagonalModifier,
  isInfinitival,
  isWordCoordination,
  prepObjectId,
  prepObjectOf,
  subtreeMinIndex,
  wordConjunctRels,
} from '@/domain/layout/kr/classify';
import { blockAscent, pedestalRoom, slantRun } from '@/domain/layout/kr/geometry';
import { coordinatorMarks, reserveJoinSpans } from '@/domain/layout/kr/coordinators';
import { bounds, eid, mirrorX, resetEid, translate } from '@/domain/layout/kr/primitives';
import type { Block, Ctx } from '@/domain/layout/kr/types';
import type { DiagramElement } from '@/domain/layout';
import { LAYOUT } from '@/domain/layout/constants';

/**
 * NARROW UNIT TESTS for the pure kr/ helper modules (refactor Stage 10) —
 * the classification predicates and geometry helpers that every drawing
 * path leans on, pinned with tiny synthetic inputs.
 */

// ---------------------------------------------------------------------------
// A minimal document: "(he) saw the dog with Paul and Silas, to see"
//   clause → predicate saw; saw → directObject dog (determiner the)
//   saw → adverbial with[prep] → prepositionObject Paul (conjunct Silas)
//   saw → adverbial to-see[infinitive]
const doc: KrDocument = KrDocumentSchema.parse({
  schemaVersion: 1,
  id: 'doc_units',
  title: 'units',
  language: 'en',
  text: '',
  notes: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  layoutHints: {},
  tokens: [
    { id: 't_saw', index: 0, surface: 'saw', language: 'en', pos: 'verb' },
    { id: 't_the', index: 1, surface: 'the', language: 'en', pos: 'article' },
    { id: 't_dog', index: 2, surface: 'dog', language: 'en', pos: 'noun' },
    { id: 't_with', index: 3, surface: 'with', language: 'en', pos: 'preposition' },
    { id: 't_paul', index: 4, surface: 'Paul', language: 'en', pos: 'propernoun' },
    { id: 't_silas', index: 5, surface: 'Silas', language: 'en', pos: 'propernoun' },
    { id: 't_see', index: 6, surface: 'see', language: 'en', pos: 'infinitive' },
  ],
  syntax: {
    rootId: 'n_cl',
    nodes: [
      { id: 'n_cl', kind: 'clause', clauseType: 'independent', tokenIds: [] },
      { id: 'n_saw', kind: 'word', tokenIds: ['t_saw'] },
      { id: 'n_the', kind: 'word', tokenIds: ['t_the'] },
      { id: 'n_dog', kind: 'word', tokenIds: ['t_dog'] },
      { id: 'n_with', kind: 'word', tokenIds: ['t_with'] },
      { id: 'n_paul', kind: 'word', tokenIds: ['t_paul'] },
      { id: 'n_silas', kind: 'word', tokenIds: ['t_silas'] },
      { id: 'n_see', kind: 'word', tokenIds: ['t_see'] },
    ],
    relations: [
      { id: 'r_pred', type: 'predicate', headId: 'n_cl', dependentId: 'n_saw' },
      { id: 'r_obj', type: 'directObject', headId: 'n_saw', dependentId: 'n_dog' },
      { id: 'r_det', type: 'determiner', headId: 'n_dog', dependentId: 'n_the' },
      { id: 'r_pp', type: 'adverbial', headId: 'n_saw', dependentId: 'n_with' },
      { id: 'r_ppobj', type: 'prepositionObject', headId: 'n_with', dependentId: 'n_paul' },
      { id: 'r_conj', type: 'conjunct', headId: 'n_paul', dependentId: 'n_silas' },
      { id: 'r_inf', type: 'adverbial', headId: 'n_saw', dependentId: 'n_see' },
    ],
  },
});

const ctx: Ctx = {
  doc,
  hints: {},
  vScale: 1,
  color: false,
  layoutNode: () => {
    throw new Error('pure predicates must not recurse');
  },
  stackClauses: () => {
    throw new Error('pure predicates must not recurse');
  },
};

describe('kr/classify — baseline complement roster', () => {
  it('keeps direct objects and predicate complements on the main line', () => {
    for (const role of ['directObject', 'predicateNominative', 'predicateAdjective', 'objectComplement'])
      expect(BASELINE_COMPLEMENTS).toContain(role);
  });
  it('keeps the indirect object and adverbials OFF the main line', () => {
    // In Reed-Kellogg the indirect object hangs BELOW the verb on a slant.
    for (const role of ['indirectObject', 'adverbial', 'adjunct', 'genitive'])
      expect(BASELINE_COMPLEMENTS).not.toContain(role);
  });
});

describe('kr/classify — predicates', () => {
  it('prepObjectId finds the object through an adverbial rel to a preposition', () => {
    expect(prepObjectId(ctx, { type: 'adverbial', dependentId: 'n_with' })).toBe('n_paul');
  });
  it('prepObjectId is null for a non-preposition dependent', () => {
    expect(prepObjectId(ctx, { type: 'adverbial', dependentId: 'n_dog' })).toBeNull();
  });
  it('prepObjectOf reads the prepositionObject child', () => {
    expect(prepObjectOf(ctx, 'n_with')).toBe('n_paul');
    expect(prepObjectOf(ctx, 'n_dog')).toBeNull();
  });
  it('isInfinitival: infinitive word yes, verb no', () => {
    expect(isInfinitival(ctx, 'n_see')).toBe(true);
    expect(isInfinitival(ctx, 'n_saw')).toBe(false);
  });
  it('isWordCoordination: word conjuncts yes, plain word no', () => {
    expect(isWordCoordination(ctx, doc.syntax.nodes.find((n) => n.id === 'n_paul')!)).toBe(true);
    expect(isWordCoordination(ctx, doc.syntax.nodes.find((n) => n.id === 'n_dog')!)).toBe(false);
  });
  it('wordConjunctRels excludes clause conjuncts', () => {
    expect(wordConjunctRels(ctx, 'n_paul').map((r) => r.dependentId)).toEqual(['n_silas']);
    expect(isClauseChild(ctx, 'n_cl')).toBe(true);
  });
  it('isDiagonalModifier: bare article yes, noun no', () => {
    expect(isDiagonalModifier(ctx, 'n_the')).toBe(true);
    expect(isDiagonalModifier(ctx, 'n_dog')).toBe(false);
  });
  it('subtreeMinIndex reaches through the subtree', () => {
    expect(subtreeMinIndex(ctx, 'n_with')).toBe(3); // with(3) < Paul(4) < Silas(5)
    expect(subtreeMinIndex(ctx, 'n_cl')).toBe(0);
  });
});

describe('kr/geometry', () => {
  it('slantRun follows the standard 57° slant and scales linearly', () => {
    expect(slantRun(0)).toBe(0);
    expect(slantRun(100)).toBeCloseTo(100 / Math.tan(57 / (180 / Math.PI)), 6);
    expect(slantRun(50) * 2).toBeCloseTo(slantRun(100), 6);
  });
  it('blockAscent measures rise above the baseline, never negative', () => {
    const mk = (y1: number): Block => ({
      width: 10,
      height: 10,
      wordLeft: 0,
      wordRight: 10,
      elements: [
        { kind: 'line', id: 'l1', x1: 0, y1, x2: 10, y2: 5, style: 'solid', role: 'baseline' },
      ],
    });
    expect(blockAscent(mk(-24))).toBe(24);
    expect(blockAscent(mk(5))).toBe(0);
  });
  it('pedestalRoom only reports rise beyond a normal one-line clause', () => {
    const shallow: Block = { width: 1, height: 1, wordLeft: 0, wordRight: 1, elements: [] };
    expect(pedestalRoom(shallow)).toBe(0);
    const tall: Block = {
      width: 1,
      height: 1,
      wordLeft: 0,
      wordRight: 1,
      elements: [
        {
          kind: 'line',
          id: 'l',
          x1: 0,
          y1: -(LAYOUT.dividerUp + LAYOUT.fontSize + 30),
          x2: 1,
          y2: 0,
          style: 'solid',
          role: 'stem',
        },
      ],
    };
    expect(pedestalRoom(tall)).toBe(30);
  });
});

describe('kr/coordinators — join spans and marks', () => {
  it('correlative lists reserve no join space (marks ride beside members)', () => {
    expect(reserveJoinSpans([{ text: 'εἴτε' }, { text: 'εἴτε' }], 2, true)).toEqual([0]);
  });
  it('a lone conjunction lands in the LAST join of an asyndetic list', () => {
    const spans = reserveJoinSpans([{ text: 'and' }], 3, false);
    expect(spans).toHaveLength(2);
    expect(spans[0]).toBe(0);
    expect(spans[1]).toBeGreaterThan(0);
  });
  it('correlative marks: one per member, each at its member baseline', () => {
    const marks = coordinatorMarks(
      [
        { text: 'εἴτε', nodeId: 'a' },
        { text: 'εἴτε', nodeId: 'b' },
      ],
      [0, 40],
      100,
    );
    expect(marks).toHaveLength(2);
    expect(marks.map((m) => m.y)).toEqual([0, 40]);
  });
  it('per-join mark rides the visual middle of its join (text-top adjusted)', () => {
    const marks = coordinatorMarks([{ text: 'and', nodeId: 'a' }], [0, 40], 100);
    expect(marks).toHaveLength(1);
    // Midpoint between the upper baseline and the TOP of the lower member's
    // text (a font-size above its baseline).
    expect(marks[0]!.y).toBe((0 + 40 - LAYOUT.fontSize) / 2);
  });
});

describe('kr/primitives', () => {
  const els: DiagramElement[] = [
    { kind: 'line', id: 'l', x1: 0, y1: 0, x2: 10, y2: -5, style: 'solid', role: 'baseline' },
    { kind: 'text', id: 't', x: 4, y: 8, text: 'x', anchor: 'start' },
  ];
  const block: Block = { width: 10, height: 8, wordLeft: 0, wordRight: 10, elements: els };

  it('translate shifts every primitive and keeps counts', () => {
    const moved = translate(block, 5, 7);
    expect(moved).toHaveLength(2);
    const line = moved.find((e) => e.kind === 'line')!;
    expect([line.x1, line.y1, line.x2, line.y2]).toEqual([5, 7, 15, 2]);
  });
  it('bounds covers line endpoints', () => {
    const b = bounds(els);
    expect(b.minX).toBeLessThanOrEqual(0);
    expect(b.maxX).toBeGreaterThanOrEqual(10);
    expect(b.minY).toBeLessThanOrEqual(-5);
  });
  it('mirrorX twice is the identity for line geometry', () => {
    const once = mirrorX(els, 10);
    const twice = mirrorX(once, 10);
    const l0 = els[0] as { x1: number; x2: number };
    const l2 = twice[0] as { x1: number; x2: number };
    expect(l2.x1).toBeCloseTo(l0.x1, 9);
    expect(l2.x2).toBeCloseTo(l0.x2, 9);
  });
  it('resetEid makes element ids deterministic per layout', () => {
    resetEid();
    const a = eid();
    resetEid();
    expect(eid()).toBe(a);
  });
});
