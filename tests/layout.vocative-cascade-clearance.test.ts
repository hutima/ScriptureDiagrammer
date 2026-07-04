import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
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

/**
 * REGRESSION — the lead-word dashed stem must not clash with a modifier slant.
 *
 * The Matthew 6:9 vocative Πάτερ … ὁ ἐν τοῖς οὐρανοῖς leads the three petitions
 * on a coordination spine. The spine drops a dashed vertical stem at the verb
 * column, down from the vocative's baseline to the first petition. The vocative
 * hangs an articular PP whose article slant (τοῖς / "the" beneath οὐρανοῖς /
 * "heavens") landed right at that stem's x — the stem sliced through the slant
 * (Greek) or grazed its foot by a hair (gloss). The layout now nudges the lead
 * row so the stem keeps a real gap from every slant it runs beside.
 */
const CLEAR = 2; // minimum acceptable horizontal gap, px

/** Smallest horizontal gap between a dashed vertical stem and any modifier slant
 *  it vertically overlaps. Negative when the stem passes THROUGH a slant. */
function minStemSlantGap(doc: KrDocument): number {
  const layout = layoutDocument(doc);
  const isLine = (e: (typeof layout.elements)[number]): e is LineElement => e.kind === 'line';
  const stems = layout.elements
    .filter(isLine)
    .filter((e) => e.style === 'dashed' && e.role === 'stem' && Math.abs(e.x1 - e.x2) < 0.5);
  const slants = layout.elements.filter(isLine).filter((e) => e.role === 'slant');
  let min = Infinity;
  for (const st of stems) {
    const sx = st.x1;
    const yLo = Math.min(st.y1, st.y2);
    const yHi = Math.max(st.y1, st.y2);
    for (const sl of slants) {
      const lo = Math.min(sl.y1, sl.y2);
      const hi = Math.max(sl.y1, sl.y2);
      if (hi <= yLo || lo >= yHi) continue; // no shared vertical band
      const mnx = Math.min(sl.x1, sl.x2);
      const mxx = Math.max(sl.x1, sl.x2);
      const gap = sx < mnx ? mnx - sx : sx > mxx ? sx - mxx : -Math.min(sx - mnx, mxx - sx);
      min = Math.min(min, gap);
    }
  }
  return min;
}

describe('lead-word dashed stem clears modifier slants (Matthew 6:9)', () => {
  it('Greek: stem keeps clearance from every slant', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(minStemSlantGap(doc!)).toBeGreaterThanOrEqual(CLEAR);
  });

  it('English gloss: stem keeps clearance from every slant', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(minStemSlantGap(glossDoc(doc!))).toBeGreaterThanOrEqual(CLEAR);
  });
});
