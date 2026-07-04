import { describe, it, expect } from 'vitest';
import { getGuidedDocument } from '@/fixtures/guided';
import { getGuide, guideDisplayDoc } from '@/data/grammarHighlights';
import {
  getReadingById,
  getIssueById,
  applyAlternateReadingPreview,
} from '@/domain/contested';
import type { KrDocument } from '@/domain/schema';

/**
 * Colossians 2:11–12 (SBLGNT) — Side 2: the manual alternate readings and the
 * guide's DISPLAYED construal.
 *
 * The bundled SBLGNT base encodes the two ἐν-phrases as parallel/appositional:
 * the first ἐν governs the raised clause (cl_s13_67) and τῷ βαπτισμῷ hangs on
 * that clause by an apposition relation (r_s13_86). Two alternates overlay it:
 *  - `alt_col_2_12_baptism_relative_sblgnt` — the nearest-noun reading drawn as a
 *    noun-headed relative clause (ᾧ = baptism); what the guide DISPLAYS.
 *  - `alt_col_2_12_raised_in_christ_sblgnt` — ᾧ = Christ; the raised clause hangs
 *    on συνταφέντες.
 */

const BAPTISM = 'w_n51002012005'; // βαπτισμῷ
const RAISED_CLAUSE = 'cl_s13_67'; // ἐν ᾧ … συνηγέρθητε
const SYNTAPHENTES = 'w_n51002012001'; // συνταφέντες
const EN1 = 'w_n51002012003'; // the first ἐν (its prepositionObject is r_s13_87)

function base(): KrDocument {
  const doc = getGuidedDocument('sblgnt_colossians_13');
  expect(doc).toBeTruthy();
  return doc!;
}

const rels = (doc: KrDocument) => doc.syntax.relations;
const childrenOf = (doc: KrDocument, headId: string) => rels(doc).filter((r) => r.headId === headId);

describe('Colossians 2:12 — issue registry (SBLGNT)', () => {
  it('the issue lists both alternates, baptism-relative first', () => {
    const issue = getIssueById('iss_col_2_12_raised_antecedent_sblgnt');
    expect(issue).toBeTruthy();
    expect(issue!.passageId).toBe('sblgnt_colossians_13');
    expect(issue!.alternateReadingIds).toEqual([
      'alt_col_2_12_baptism_relative_sblgnt',
      'alt_col_2_12_raised_in_christ_sblgnt',
    ]);
  });

  it('the SBLGNT base really encodes the βαπτισμῷ apposition (r_s13_86)', () => {
    const b = base();
    const appos = rels(b).find((r) => r.id === 'r_s13_86');
    expect(appos?.type).toBe('apposition');
    expect(appos?.headId).toBe(RAISED_CLAUSE);
    expect(appos?.dependentId).toBe(BAPTISM);
    // …and the first ἐν governs the whole raised clause as its object.
    const prep = rels(b).find((r) => r.id === 'r_s13_87');
    expect(prep?.type).toBe('prepositionObject');
    expect(prep?.dependentId).toBe(RAISED_CLAUSE);
  });
});

describe('Colossians 2:12 — baptism-relative alternate (the guide\'s reading)', () => {
  it('applies cleanly, producing the noun-headed relative clause on βαπτισμῷ', () => {
    const reading = getReadingById('alt_col_2_12_baptism_relative_sblgnt')!;
    expect(reading.confidence).toBe('low');
    const doc = applyAlternateReadingPreview(base(), reading);
    // ἐν now governs βαπτισμῷ (the noun), not the clause.
    const prep = rels(doc).find((r) => r.id === 'r_s13_87');
    expect(prep?.dependentId).toBe(BAPTISM);
    // The apposition is gone…
    expect(rels(doc).some((r) => r.id === 'r_s13_86')).toBe(false);
    // …replaced by an ADJECTIVAL relative clause hanging on βαπτισμῷ.
    const adj = childrenOf(doc, BAPTISM).filter((r) => r.type === 'adjectival');
    expect(adj.map((r) => r.dependentId)).toContain(RAISED_CLAUSE);
    // Every token still represented (nothing orphaned/dropped).
    expect(doc.tokens).toHaveLength(base().tokens.length);
  });

  it('the guide DISPLAYS this construal at load', () => {
    const guide = getGuide('guide-colossians-2-11-12')!;
    expect(guide.displayAlternateReadingId).toBe('alt_col_2_12_baptism_relative_sblgnt');
    const shown = guideDisplayDoc(guide, base());
    // The displayed doc carries the relative-clause attachment, not the apposition.
    expect(shown.syntax.relations.some((r) => r.id === 'r_s13_86')).toBe(false);
    const adj = shown.syntax.relations.filter(
      (r) => r.headId === BAPTISM && r.type === 'adjectival' && r.dependentId === RAISED_CLAUSE,
    );
    expect(adj).toHaveLength(1);
  });
});

describe('Colossians 2:12 — in-Christ alternate stays clean on both bases', () => {
  const inChrist = () => getReadingById('alt_col_2_12_raised_in_christ_sblgnt')!;

  function assertInChrist(doc: KrDocument) {
    // The raised clause hangs adverbially on συνταφέντες…
    const adv = doc.syntax.relations.filter(
      (r) => r.headId === SYNTAPHENTES && r.type === 'adverbial' && r.dependentId === RAISED_CLAUSE,
    );
    expect(adv).toHaveLength(1);
    // …and is NOT also parented by βαπτισμῷ (no double attachment).
    expect(
      doc.syntax.relations.some((r) => r.headId === BAPTISM && r.dependentId === RAISED_CLAUSE),
    ).toBe(false);
    // βαπτισμῷ is the plain object of the first ἐν.
    const prep = doc.syntax.relations.find((r) => r.id === 'r_s13_87');
    expect(prep?.dependentId).toBe(BAPTISM);
    expect(prep?.headId).toBe(EN1);
  }

  it('overlays the pristine (apposition) base', () => {
    assertInChrist(applyAlternateReadingPreview(base(), inChrist()));
  });

  it('overlays the guide\'s already-relativized display doc without double-parenting', () => {
    const guide = getGuide('guide-colossians-2-11-12')!;
    const displayed = guideDisplayDoc(guide, base());
    assertInChrist(applyAlternateReadingPreview(displayed, inChrist()));
  });
});
