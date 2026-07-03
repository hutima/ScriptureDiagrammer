import { describe, it, expect } from 'vitest';
import { glossDoc } from '@/domain/model';
import { KrDocumentSchema, type KrDocument } from '@/domain/schema';
import { lowfatToDocuments } from '@/io/lowfat';

/**
 * Regression coverage for the lowfat `labelNodeId` connector path: a relation
 * whose Greek connector label (a coordinator/subordinator surface, e.g. 'καὶ',
 * 'δὲ') also carries a `labelNodeId` pointing at the unattached word NODE that
 * holds the real token + gloss for that word (see `RelationSchema.labelNodeId`
 * and `LowfatConverter.rel`/`subordinatorNode` in `src/io/lowfat.ts`). Before
 * this fix, `glossDoc` only ran the string label through the
 * `GRC_FUNCTION_GLOSS` lexicon — which lacks coordinating conjunctions — so a
 * connector like καὶ stayed Greek in English-gloss mode even though the word
 * node it labels has a perfectly good English gloss.
 */

const BASE = {
  schemaVersion: 1 as const,
  id: 'd',
  title: 't',
  language: 'grc' as const,
  text: '…',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  layoutHints: {},
};

/** A root clause with two conjunct clauses joined by a labelled connector whose
 *  `labelNodeId` points at an unattached word node carrying the conjunction's
 *  token + gloss — the shape `LowfatConverter` produces for a bare-word
 *  subordinator/coordinator introducing a clause. */
function doc(opts: {
  label: string;
  labelToken?: { id: string; surface: string; gloss?: string };
  labelNodeId?: string;
}): KrDocument {
  const nodes: KrDocument['syntax']['nodes'] = [
    { id: 'c0', kind: 'clause', clauseType: 'independent', tokenIds: [] },
    { id: 'sub', kind: 'clause', clauseType: 'adverbial', tokenIds: [] },
    { id: 'v', kind: 'word', role: 'predicate', tokenIds: ['t_v'] },
  ];
  const tokens: KrDocument['tokens'] = [
    { id: 't_v', index: 1, surface: 'κάμψῃ', pos: 'verb', gloss: 'should bow' },
  ];
  if (opts.labelToken) {
    tokens.push({ id: opts.labelToken.id, index: 0, surface: opts.labelToken.surface, pos: 'conjunction', gloss: opts.labelToken.gloss });
    nodes.push({ id: 'lbl', kind: 'word', tokenIds: [opts.labelToken.id] });
  }
  return KrDocumentSchema.parse({
    ...BASE,
    tokens,
    syntax: {
      rootId: 'c0',
      nodes,
      relations: [
        { id: 'r1', type: 'predicate', headId: 'sub', dependentId: 'v' },
        {
          id: 'r2',
          type: 'adverbial',
          headId: 'c0',
          dependentId: 'sub',
          label: opts.label,
          ...(opts.labelNodeId ? { labelNodeId: opts.labelNodeId } : {}),
        },
      ],
    },
  });
}

describe('gloss mode: relation labelNodeId connector glossing', () => {
  it('glosses a labelNodeId connector (καὶ) from its labelled node\'s token gloss', () => {
    const d = doc({
      label: 'καὶ',
      labelToken: { id: 't_kai', surface: 'καὶ', gloss: 'and' },
      labelNodeId: 'lbl',
    });
    const g = glossDoc(d);
    expect(g.syntax.relations.find((r) => r.id === 'r2')!.label).toBe('and');
  });

  it('does not mutate the original document', () => {
    const d = doc({
      label: 'καὶ',
      labelToken: { id: 't_kai', surface: 'καὶ', gloss: 'and' },
      labelNodeId: 'lbl',
    });
    glossDoc(d);
    expect(d.syntax.relations.find((r) => r.id === 'r2')!.label).toBe('καὶ');
  });

  it('glosses a plain string label (no labelNodeId) via the lexicon', () => {
    const d = doc({ label: 'ὅτι' });
    const g = glossDoc(d);
    expect(g.syntax.relations.find((r) => r.id === 'r2')!.label).toBe('that');
  });

  it('glosses a coordinator (δὲ) with labelNodeId from the node token gloss', () => {
    const d = doc({
      label: 'δὲ',
      labelToken: { id: 't_de', surface: 'δὲ', gloss: 'but' },
      labelNodeId: 'lbl',
    });
    const g = glossDoc(d);
    expect(g.syntax.relations.find((r) => r.id === 'r2')!.label).toBe('but');
  });

  it('falls back to GRC_FUNCTION_GLOSS/surface when the labelled node token has no gloss', () => {
    // an ungrossed καὶ token still glosses through the lexicon fallback
    const d = doc({
      label: 'καὶ',
      labelToken: { id: 't_kai', surface: 'καὶ' },
      labelNodeId: 'lbl',
    });
    const g = glossDoc(d);
    expect(g.syntax.relations.find((r) => r.id === 'r2')!.label).toBe('and');
  });

  it('falls back to the raw surface when neither the node gloss nor the lexicon has an entry', () => {
    const d = doc({
      label: 'ξυζ', // not a real word, not in the lexicon
      labelToken: { id: 't_x', surface: 'ξυζ' },
      labelNodeId: 'lbl',
    });
    const g = glossDoc(d);
    expect(g.syntax.relations.find((r) => r.id === 'r2')!.label).toBe('ξυζ');
  });
});

describe('gloss mode: sanity check against the real Lowfat converter', () => {
  it('glosses a coordinating-conjunction connector (δέ) produced by lowfatToDocuments', () => {
    // Same shape as the converter's own "writes a subordinator (ὅτι) as the
    // connector label" test (tests/lowfat.test.ts) — a bare-word clause wrapper
    // with no verb of its own — but with a coordinating conjunction (δέ) instead
    // of a subordinator (ὅτι), so this exercises the same `labelNodeId` path for
    // a word missing from `GRC_FUNCTION_GLOSS` before this fix.
    const xml = `<book name="Test"><sentence><wg role="cl" class="cl" rule="S-V-CL">
      <w class="pron" role="s">ὅς</w>
      <w class="verb" role="v">λέγει</w>
      <wg class="cl" rule="sub"><w class="conj">δέ</w>
        <wg class="cl"><w class="verb" role="v">ἐκτίσθη</w><w class="noun" role="s">πάντα</w></wg>
      </wg>
    </wg></sentence></book>`;
    const [d] = lowfatToDocuments(xml, { book: 'Test' });
    const link = d!.syntax.relations.find((r) => r.label === 'δέ');
    expect(link).toBeDefined();
    expect(link!.labelNodeId).toBeDefined();
    const g = glossDoc(d!);
    expect(g.syntax.relations.find((r) => r.id === link!.id)!.label).toBe('and');
  });
});
