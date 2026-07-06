import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
import { measureText, SMALL_FONT } from '@/domain/layout/measure';
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

/**
 * REGRESSION — the dashed lead stem / spine bar must not pass through a word's
 * text, even "gapped".
 *
 * The compound-sentence convention lets a dashed vertical pass BEHIND the
 * member verbs standing ON its column (gapDashedLinesBehindWords splits it at
 * their glyph bands) — that is sanctioned, because the bar runs verb-to-verb
 * by definition. But in Matthew 6:9 the LEAD stem also fell inside a word that
 * merely happened to span its x: the vocative row was clamped to x = 0, which
 * slid its hanging cascade under the verb column, and the stem dropped through
 * the MIDDLE of οὐρανοῖς (Greek) and grazed the edge of "heavens" (gloss). The
 * gapping pass split the line 2px above/below the glyphs, so it still read as
 * a line drawn straight through the word. The layout now reserves the lead
 * row's full width LEFT of the column (shifting the spine right when needed),
 * so the stem never needs to be gapped behind an off-column word at all.
 *
 * Invariant checked here (dashed verticals, roles stem + coordination,
 * reassembled to their FULL pre-gap extent): every upright word overlapping a
 * dashed column's vertical extent is either CENTERED on the column (a verb the
 * bar legitimately passes behind) or keeps a real horizontal clearance from it.
 *
 * Fixture-scoped (repo convention): corpus-wide, a member's verb can sit ON
 * the column without being glyph-centred (its verbX is a divider, or a wide
 * gloss shifts the text), so the strict centred-or-clear rule cannot be a
 * global invariant — but in this passage every legitimate crossing IS the
 * centred petition verb, so any other hit is a real regression.
 */
const COLUMN_EPS = 1; // |word centre − column x| below this = an on-column verb
const WORD_CLEAR = 2; // minimum gap between a dashed column and an off-column word

function dashedColumnThroughWordClashes(doc: KrDocument): string[] {
  const layout = layoutDocument(doc);
  const isLine = (e: (typeof layout.elements)[number]): e is LineElement => e.kind === 'line';
  const verticals = layout.elements
    .filter(isLine)
    .filter(
      (e) =>
        e.style === 'dashed' &&
        (e.role === 'stem' || e.role === 'coordination') &&
        Math.abs(e.x1 - e.x2) < 0.5,
    );
  // Reassemble gapped segments into full columns: group by x, take the union
  // of the segments' vertical extents. (gapDashedLinesBehindWords splits a
  // line into pieces around the glyphs it crosses; the CLASS under test is the
  // crossing itself, so the check must see the original extent.)
  const columns = new Map<number, { x: number; yLo: number; yHi: number }>();
  for (const l of verticals) {
    const key = Math.round(l.x1 * 2);
    const lo = Math.min(l.y1, l.y2);
    const hi = Math.max(l.y1, l.y2);
    const col = columns.get(key);
    if (col) {
      col.yLo = Math.min(col.yLo, lo);
      col.yHi = Math.max(col.yHi, hi);
    } else {
      columns.set(key, { x: l.x1, yLo: lo, yHi: hi });
    }
  }
  const words = layout.elements.filter(
    (e): e is TextElement => e.kind === 'text' && !e.rotate && !e.box,
  );
  const clashes: string[] = [];
  for (const col of columns.values()) {
    for (const w of words) {
      const b = textBox(w);
      if (b.y1 <= col.yLo + 0.5 || b.y0 >= col.yHi - 0.5) continue; // outside the column's run
      const centre = (b.x0 + b.x1) / 2;
      if (Math.abs(centre - col.x) < COLUMN_EPS) continue; // on-column verb: sanctioned pass-behind
      if (col.x > b.x0 - WORD_CLEAR && col.x < b.x1 + WORD_CLEAR) {
        clashes.push(`x=${col.x.toFixed(1)} through "${w.text}" [${b.x0.toFixed(1)}..${b.x1.toFixed(1)}]`);
      }
    }
  }
  return clashes;
}

function textBox(w: TextElement): { x0: number; x1: number; y0: number; y1: number } {
  const width = measureText(w.text, w.small ? SMALL_FONT : undefined);
  const x0 = w.anchor === 'middle' ? w.x - width / 2 : w.anchor === 'end' ? w.x - width : w.x;
  const asc = w.small ? 11 : 14;
  const desc = w.small ? 3 : 4;
  return { x0, x1: x0 + width, y0: w.y - asc, y1: w.y + desc };
}

describe('dashed stem / spine columns never run through off-column words', () => {
  it('Matthew 6:9 Greek: the lead stem clears οὐρανοῖς', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(dashedColumnThroughWordClashes(doc!)).toEqual([]);
  });

  it('Matthew 6:9 English gloss: the lead stem clears "heavens"', () => {
    const doc = getGuidedDocument(PASSAGE);
    expect(doc).toBeTruthy();
    expect(dashedColumnThroughWordClashes(glossDoc(doc!))).toEqual([]);
  });
});
