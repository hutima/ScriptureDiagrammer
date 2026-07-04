import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
import { elementRects } from '@/domain/layout/kr/packing';
import { getGuidedDocument } from '@/fixtures/guided';
import { glossDoc } from '@/domain/model/queries';
import type { KrDocument } from '@/domain/schema';

/**
 * REGRESSION — the parent clause baseline must not run through text hanging
 * beneath an ELEVATED conjunct of a coordination fork.
 *
 * Genesis 17:12 (`wlc_genesis_1_11`) coordinates יְלִיד ("one born") with
 * מִקְנָה ("a purchase") on a subject fork. The first conjunct carries בָּיִת /
 * "of [the] household" hanging BELOW its raised baseline — deep enough to
 * reach the fork's naive midpoint, which is exactly the level where the
 * parent's baseline keeps running across the fork's span. The junction used
 * to sit at that midpoint unconditionally, striking the hanging word — it
 * grazed the narrow Hebrew בָּיִת but cut clean through the wide English
 * gloss "of [the] household". The fix slides the junction to the nearest
 * text-clear level (see `layoutCoordination`'s JUNCTION_CLEAR bands), keyed
 * on measured text extents so it holds in either language.
 *
 * Guard: no solid horizontal baseline may run through an upright word in this
 * passage, in the source language OR glossed.
 */

const PASSAGE = 'wlc_genesis_1_11';

const isHorizontalBaseline = (e: LineElement): boolean =>
  e.role === 'baseline' && e.style === 'solid' && Math.abs(e.y1 - e.y2) < 0.6;

/** Horizontal-baseline × upright-word clashes: "<word> ← run px". */
function baselineThroughWordClashes(doc: KrDocument): string[] {
  const layout = layoutDocument(doc);
  const lines = layout.elements.filter(
    (e): e is LineElement => e.kind === 'line' && isHorizontalBaseline(e),
  );
  const words = layout.elements.filter((e): e is TextElement => e.kind === 'text' && !e.rotate);
  const PAD = 2; // a baseline abutting a glyph edge (its own word) is legitimate
  const MIN_RUN = 4;
  const clashes: string[] = [];
  for (const w of words) {
    const [box] = elementRects([w]);
    if (!box) continue;
    const shrunk = { x0: box.x0 + PAD, x1: box.x1 - PAD, y0: box.y0 + PAD, y1: box.y1 - PAD };
    for (const l of lines) {
      const y = l.y1;
      if (y <= shrunk.y0 || y >= shrunk.y1) continue;
      const run =
        Math.min(Math.max(l.x1, l.x2), shrunk.x1) - Math.max(Math.min(l.x1, l.x2), shrunk.x0);
      if (run > MIN_RUN) clashes.push(`${w.text} ← ${Math.round(run)}px`);
    }
  }
  return clashes;
}

describe('coordination junction clears hanging conjunct text (Genesis 17:12)', () => {
  it('Hebrew: no baseline runs through a word', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(baselineThroughWordClashes(doc!)).toEqual([]);
  });

  it('English gloss: no baseline runs through a word', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(baselineThroughWordClashes(glossDoc(doc!))).toEqual([]);
  });
});
