import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import type { TextElement } from '@/domain/layout';
import { elementRects } from '@/domain/layout/kr/packing';
import { getGuidedDocument } from '@/fixtures/guided';
import { glossDoc } from '@/domain/model/queries';
import type { KrDocument } from '@/domain/schema';

/**
 * REGRESSION — a floating vocative's modifier cascade must clear the clause
 * beneath it.
 *
 * Matthew 6:9 (`sblgnt_matthew_142`): Πάτερ ἡμῶν ὁ ἐν τοῖς οὐρανοῖς is a
 * vocative on ἁγιασθήτω τὸ ὄνομά σου. A vocative floats on its own short line
 * ABOVE the clause — but this one carries a hanging cascade (ἡμῶν "of us" and
 * the PP ἐν τοῖς οὐρανοῖς "in the heavens") that descends `block.height`
 * BELOW its baseline. The float placement used to anchor the vocative's
 * BASELINE at the clear level, letting the cascade drop straight down into
 * the clause: the PP object οὐρανοῖς / "heavens" printed on top of
 * ἁγιασθήτω / "hallowed be" on the main baseline. The fix lifts each floating
 * block by its own height so the cascade bottoms out at the clear level.
 *
 * Guard: no two upright words in this passage overlap, in the source
 * language OR glossed.
 */

const PASSAGE = 'sblgnt_matthew_142';

/** Pairs of upright words whose glyph boxes overlap: `"a" × "b"`. */
function wordOverlapClashes(doc: KrDocument): string[] {
  const layout = layoutDocument(doc);
  const words = layout.elements.filter((e): e is TextElement => e.kind === 'text' && !e.rotate);
  const boxes = words.map((w) => ({ w, box: elementRects([w])[0]! }));
  // A slant's label may legitimately abut its neighbour by a hair; only a
  // real two-dimensional overlap of glyph boxes counts as a clash.
  const PAD = 2;
  const clashes: string[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const ox = Math.min(a.box.x1, b.box.x1) - Math.max(a.box.x0, b.box.x0);
      const oy = Math.min(a.box.y1, b.box.y1) - Math.max(a.box.y0, b.box.y0);
      if (ox > PAD && oy > PAD) clashes.push(`"${a.w.text}" × "${b.w.text}"`);
    }
  }
  return clashes;
}

describe('floating vocative cascade clears the clause (Matthew 6:9)', () => {
  it('Greek: no two words overlap', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(wordOverlapClashes(doc!)).toEqual([]);
  });

  it('English gloss: no two words overlap', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(wordOverlapClashes(glossDoc(doc!))).toEqual([]);
  });
});
