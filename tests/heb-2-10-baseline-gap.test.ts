import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
import type { KrDocument } from '@/domain/schema';
import { validateConvertedDocument } from './helpers/validateConvertedDocument';

/**
 * SUBJECT→DIVIDER BASELINE-GAP REGRESSION — Hebrews 2:10 (SBLGNT,
 * doc sblgnt_hebrews_21): "Ἔπρεπεν γὰρ αὐτῷ … τελειῶσαι".
 *
 * The subject of Ἔπρεπεν is the INFINITIVE clause (τελειῶσαι … τὸν ἀρχηγὸν
 * τῆς σωτηρίας αὐτῶν …), laid out inline on the main baseline left of the
 * subject|predicate divider. A clause block reports `wordRight` as its full
 * complement-cursor width, which counts the hollow y = 0 strip over the deep
 * τῆς σωτηρίας αὐτῶν cascade hanging below-right of ἀρχηγὸν — so the
 * subject-to-divider bridge in layoutClause (src/domain/layout/kr/clause.ts)
 * judged the subject "already reaches the divider" and drew nothing, while
 * the subject's ACTUALLY DRAWN main line stops right after ἀρχηγὸν. The
 * diagram showed the subject words, a long blank strip, then the divider +
 * Ἔπρεπεν. Fixed by starting the bridge from the subject block's drawn
 * y = 0 end (the same measure the complement bridges use), gated off for a
 * compound (fork) subject whose open mouth replaces the line.
 *
 * Guard: on the main baseline row (the y of ἀρχηγὸν's own baseline), the
 * union of solid horizontal segments must cover the span from the right end
 * of ἀρχηγὸν's baseline (w_n58002010019) to the subject|predicate divider's
 * x with no hole wider than 1px.
 */

const doc = (): KrDocument =>
  lowfatToDocuments(readFileSync('tests/fixtures-sblgnt-lowfat-heb-2-10.xml', 'utf8'), {
    book: 'Hebrews',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
    sourceId: 'macula-greek-sblgnt-lowfat',
  })[0]!;

const isLine = (e: { kind: string }): e is LineElement => e.kind === 'line';
const isText = (e: { kind: string }): e is TextElement => e.kind === 'text';

describe('Hebrews 2:10 — infinitival subject reaches the divider (SBLGNT)', () => {
  it('converts the expected sentence to a valid document', () => {
    const d = doc();
    expect(validateConvertedDocument(d).errors).toEqual([]);
    expect(d.text).toContain('Ἔπρεπεν');
    expect(d.text).toContain('τελειῶσαι');
    expect(d.text).toContain('ἀρχηγὸν');
  });

  it('main line runs unbroken from ἀρχηγὸν to the subject|predicate divider', () => {
    const layout = layoutDocument(doc());

    // ἀρχηγὸν's own baseline fixes the main row's y and the drawn end of the
    // subject's line (the σωτηρίας genitive stem attaches at its right end).
    const archegon = layout.elements.filter(
      (e): e is LineElement =>
        isLine(e) && e.role === 'baseline' && e.style === 'solid' && e.nodeId === 'w_n58002010019',
    );
    expect(archegon.length, 'ἀρχηγὸν baseline').toBe(1);
    const mainY = archegon[0]!.y1;
    expect(archegon[0]!.y2).toBeCloseTo(mainY, 5);
    const from = Math.max(archegon[0]!.x1, archegon[0]!.x2);

    // The subject|predicate divider is the solid divider-role vertical
    // crossing the main row. (The other two dividers in this sentence belong
    // to the δι’ ὃν / δι’ οὗ sub-clauses far below.)
    const dividers = layout.elements.filter(
      (e): e is LineElement =>
        isLine(e) &&
        e.role === 'divider' &&
        e.style === 'solid' &&
        Math.min(e.y1, e.y2) <= mainY &&
        Math.max(e.y1, e.y2) >= mainY,
    );
    expect(dividers.length, 'divider crossing the main row').toBe(1);
    const divX = dividers[0]!.x1;
    expect(dividers[0]!.x2).toBeCloseTo(divX, 5);

    // Anchor: Ἔπρεπεν's baseline begins just right of that divider — the
    // divider found really is the subject|predicate cross.
    const eprepen = layout.elements.find(
      (e): e is TextElement => isText(e) && e.nodeId === 'w_n58002010001',
    );
    expect(eprepen?.text).toBe('Ἔπρεπεν');
    const eprepenLine = layout.elements.find(
      (e): e is LineElement =>
        isLine(e) && e.role === 'baseline' && e.nodeId === 'w_n58002010001',
    );
    expect(eprepenLine).toBeDefined();
    const eprepenStart = Math.min(eprepenLine!.x1, eprepenLine!.x2);
    expect(eprepenStart).toBeGreaterThanOrEqual(divX);
    expect(eprepenStart - divX).toBeLessThanOrEqual(4);

    expect(from).toBeLessThan(divX); // the cascade makes the divider land far right

    // Union of solid horizontal segments on the main row must cover
    // [from, divX] with no hole wider than 1px.
    const spans = layout.elements
      .filter(
        (e): e is LineElement =>
          isLine(e) &&
          e.style === 'solid' &&
          Math.abs(e.y1 - mainY) <= 0.01 &&
          Math.abs(e.y2 - mainY) <= 0.01,
      )
      .map((l) => ({ x0: Math.min(l.x1, l.x2), x1: Math.max(l.x1, l.x2) }))
      .filter((s) => s.x1 > from && s.x0 < divX)
      .sort((a, b) => a.x0 - b.x0);
    let covered = from;
    let widestHole = 0;
    for (const s of spans) {
      if (s.x0 > covered) widestHole = Math.max(widestHole, s.x0 - covered);
      covered = Math.max(covered, s.x1);
    }
    if (covered < divX) widestHole = Math.max(widestHole, divX - covered);
    expect(widestHole).toBeLessThanOrEqual(1);
  });
});
