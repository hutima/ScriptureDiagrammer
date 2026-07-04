import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
import { elementRects } from '@/domain/layout/kr/packing';
import { getGuidedDocument } from '@/fixtures/guided';
import { glossDoc } from '@/domain/model/queries';
import type { KrDocument } from '@/domain/schema';

/**
 * REGRESSION — a pedestalled clause's vertical riser must not run through the
 * embedded clause's own below-baseline modifier text.
 *
 * Romans 9:6 ("the word of God has failed") is the whole DIRECT OBJECT of an
 * implied copula, so it rides a pedestal above the main line; its subject
 * "λόγος / word" carries a genitive "τοῦ θεοῦ / of God" that hangs BELOW the
 * pedestal baseline, in the band the riser drops through. The riser used to
 * attach at the dead centre of the pedestal baseline — straight through that
 * genitive. It only grazes the narrow Greek "θεοῦ" but cuts clean through the
 * wider English gloss "of God", which is what the Romans 9:6-13 guide's ENGLISH
 * display mode showed. The fix (`clearStemX`) slides the riser to the nearest
 * gap keyed on the MEASURED text extents, so it holds in either language.
 *
 * Guard: no SOLID vertical stem may run through an upright word in this passage,
 * in the source language OR glossed. (The dashed coordination-fork spine that
 * passes behind conjunct text by design — halo-backed — is a separate, exempted
 * convention and is not asserted here.)
 */

const PASSAGE = 'sblgnt_romans_230';

const isVerticalSolidStem = (e: LineElement): boolean =>
  e.role === 'stem' && e.style === 'solid' && Math.abs(e.x1 - e.x2) < 0.6;

/** Length of the part of vertical segment `l` inside `rect` (y overlap × inside x). */
function stemRunThroughRect(
  l: LineElement,
  rect: { x0: number; x1: number; y0: number; y1: number },
): number {
  const x = l.x1;
  if (x <= rect.x0 || x >= rect.x1) return 0;
  const yLo = Math.max(Math.min(l.y1, l.y2), rect.y0);
  const yHi = Math.min(Math.max(l.y1, l.y2), rect.y1);
  return Math.max(0, yHi - yLo);
}

/** Solid-stem × upright-word clashes: "<word> ← run px". */
function stemThroughWordClashes(doc: KrDocument): string[] {
  const layout = layoutDocument(doc);
  const stems = layout.elements.filter(
    (e): e is LineElement => e.kind === 'line' && isVerticalSolidStem(e),
  );
  const words = layout.elements.filter(
    (e): e is TextElement => e.kind === 'text' && !e.rotate,
  );
  const PAD = 2; // abutting / grazing a glyph edge is legitimate
  const MIN_RUN = 4; // must run >4px inside the shrunk box to count as through
  const clashes: string[] = [];
  for (const w of words) {
    const [box] = elementRects([w]);
    if (!box) continue;
    const shrunk = { x0: box.x0 + PAD, x1: box.x1 - PAD, y0: box.y0 + PAD, y1: box.y1 - PAD };
    if (shrunk.x1 <= shrunk.x0) continue;
    for (const s of stems) {
      // A stem that ORIGINATES from this word's own node is its attachment, not
      // a crossing.
      if (s.nodeId && w.nodeId && s.nodeId === w.nodeId) continue;
      const run = stemRunThroughRect(s, shrunk);
      if (run > MIN_RUN) clashes.push(`${w.text} ← ${Math.round(run)}px`);
    }
  }
  return clashes.sort();
}

describe('Romans 9:6 pedestal riser clears the embedded genitive', () => {
  it('source Greek: no solid stem runs through a word', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeDefined();
    expect(stemThroughWordClashes(doc!)).toEqual([]);
  });

  it('English gloss ("of God"): no solid stem runs through a word', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeDefined();
    expect(stemThroughWordClashes(glossDoc(doc!))).toEqual([]);
  });
});
