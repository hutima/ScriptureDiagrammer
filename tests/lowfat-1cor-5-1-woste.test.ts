import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import type { KrDocument } from '@/domain/schema';
import { layoutDocument } from '@/domain/layout';

/**
 * 1 Corinthians 5:1 — the result clause "ὥστε γυναῖκά τινα τοῦ πατρὸς ἔχειν"
 * ("so that a man has his father's wife"). Both editions wrap it as
 * `<wg rule="sub-CL">` = [ ὥστε (conj) + <wg class="cl"> ], attached
 * appositionally to πορνεία. Because that inner clause predicates with an
 * INFINITIVE (ἔχειν), it is laid out like a prepositional phrase — a path that
 * draws no connector label — so stashing ὥστε as a connector label (the ὅτι/ἵνα
 * convention) made it vanish from every view. The converter must instead attach
 * ὥστε as a real `conjunction` child of the clause so it is preserved and drawn.
 */

const nfc = (s: string) => s.normalize('NFC');

function woste(d: KrDocument) {
  const tok = d.tokens.find((t) => t.lemma && nfc(t.lemma) === nfc('ὥστε'));
  expect(tok, 'ὥστε token').toBeDefined();
  const node = d.syntax.nodes.find((n) => n.tokenIds.includes(tok!.id));
  expect(node, 'ὥστε node').toBeDefined();
  return { tok: tok!, node: node! };
}

function assertConnectsInfinitivalClause(d: KrDocument) {
  const { tok, node } = woste(d);
  // (a) the source word survives as a real token + node.
  expect(nfc(tok.surface)).toBe(nfc('ὥστε'));

  // (b) it is connected as the clause's connector/subordinator: a `conjunction`
  // relation whose dependent is the ὥστε node and whose head is a clause node.
  const conj = d.syntax.relations.find(
    (r) => r.type === 'conjunction' && r.dependentId === node.id,
  );
  expect(conj, 'conjunction relation carrying ὥστε').toBeDefined();
  const head = d.syntax.nodes.find((n) => n.id === conj!.headId);
  expect(head?.kind).toBe('clause');

  // The clause it introduces predicates with the infinitive ἔχειν.
  const pred = d.syntax.relations.find(
    (r) => r.headId === head!.id && (r.type === 'predicate' || r.type === 'copula'),
  );
  const predNode = d.syntax.nodes.find((n) => n.id === pred?.dependentId);
  const predTok = d.tokens.find((t) => predNode?.tokenIds.includes(t.id));
  expect(predTok?.pos).toBe('infinitive');

  // ὥστε must not be left orphaned (unattached AND not a referenced label).
  const attached = d.syntax.relations.some((r) => r.dependentId === node.id);
  expect(attached).toBe(true);

  // It actually reaches the diagram: the layout emits a text element for ὥστε.
  const texts = layoutDocument(d).elements.filter((e) => e.kind === 'text');
  expect(texts.some((e) => nfc((e as { text: string }).text) === nfc('ὥστε'))).toBe(true);
}

describe('1 Cor 5:1 — ὥστε survives as the infinitival result clause’s connector', () => {
  it('Nestle 1904 Lowfat', () => {
    const docs = lowfatToDocuments(readFileSync('tests/fixtures-lowfat-1cor-5-1.xml', 'utf8'), {
      book: '1 Corinthians',
    });
    const d = docs.find((x) => x.tokens.some((t) => nfc(t.lemma ?? '') === nfc('ὥστε')))!;
    expect(d, 'sentence document with ὥστε').toBeDefined();
    assertConnectsInfinitivalClause(d);
  });

  it('SBLGNT Lowfat', () => {
    const docs = lowfatToDocuments(readFileSync('tests/fixtures-sblgnt-lowfat-1cor-5-1.xml', 'utf8'), {
      book: '1 Corinthians',
      dialect: sblgntDialect,
      docIdPrefix: 'sblgnt',
      sourceId: 'macula-greek-sblgnt-lowfat',
    });
    const d = docs.find((x) => x.tokens.some((t) => nfc(t.lemma ?? '') === nfc('ὥστε')))!;
    expect(d, 'sentence document with ὥστε').toBeDefined();
    assertConnectsInfinitivalClause(d);
  });
});
