import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import type { LineElement, TextElement } from '@/domain/layout';
import { measureText, SMALL_FONT } from '@/domain/layout/measure';
import { getGuidedDocument } from '@/fixtures/guided';
import { glossDoc } from '@/domain/model/queries';
import type { KrDocument } from '@/domain/schema';

/**
 * REGRESSION — the coordination-fork spine / stem class must not draw through
 * word text, in ANY renderer. Two mechanisms used to:
 *
 * 1. The compound-sentence spine runs verb-to-verb down the verb column, and
 *    the lead stub's stem drops through the FIRST member's verb to reach the
 *    bar top. The renderer halo kept glyph strokes legible but the line still
 *    showed between letters and across word spaces — Gen 17:12 ("he will be
 *    circumcised" under its "and" lead, the guided Acts 2:39 stacked diagram),
 *    far worse glossed because the English text is much wider than the Hebrew.
 *    Fixed by `gapDashedLinesBehindWords`: every dashed vertical is split at
 *    the measured glyph bands it crosses, so the pass-behind is real geometry.
 *
 * 2. A compound clause standing on a PEDESTAL (Rom 9:13 "Jacob I loved, but
 *    Esau I hated" as the object of "it is written") had its SOLID riser run
 *    the spine's full height alongside the bar — straight through the lower
 *    member's verb ("hated"). Fixed by `spineBarBottom`: the riser now meets
 *    the bar at its bottom end, at the bar's own column.
 *
 * The checks below mirror the characterization guard's thresholds (2px-shrunk
 * glyph box, >4px run inside it) over every vertical line — solid AND dashed,
 * no exemptions.
 */

function verticalLineThroughWordClashes(doc: KrDocument, opts?: { rtl?: boolean }): string[] {
  const layout = layoutDocument(doc, doc.layoutHints, opts);
  const words = layout.elements.filter(
    (e): e is TextElement => e.kind === 'text' && !e.rotate,
  );
  const verticals = layout.elements.filter(
    (e): e is LineElement => e.kind === 'line' && Math.abs(e.x1 - e.x2) < 0.6,
  );
  const PAD = 2; // abutting / grazing a glyph edge is legitimate
  const MIN_RUN = 4; // must run >4px inside the shrunk box to count as through
  const clashes: string[] = [];
  for (const w of words) {
    const width = measureText(w.text, w.small ? SMALL_FONT : undefined);
    const x0 = w.anchor === 'middle' ? w.x - width / 2 : w.anchor === 'end' ? w.x - width : w.x;
    const asc = w.small ? 11 : 14;
    const desc = w.small ? 3 : 4;
    const box = { x0: x0 + PAD, x1: x0 + width - PAD, y0: w.y - asc + PAD, y1: w.y + desc - PAD };
    if (box.x1 <= box.x0) continue;
    for (const l of verticals) {
      if (l.x1 <= box.x0 || l.x1 >= box.x1) continue;
      const run = Math.min(Math.max(l.y1, l.y2), box.y1) - Math.max(Math.min(l.y1, l.y2), box.y0);
      if (run > MIN_RUN) clashes.push(`${l.role}/${l.style} × ${w.text}`);
    }
  }
  return clashes.sort();
}

describe('Gen 17:12 — spine + lead stem clear the verbs (guided Acts 2:39 stacked diagram)', () => {
  const doc = () => getGuidedDocument('wlc_genesis_1_11')!;

  it('Hebrew source, RTL (default direction)', () => {
    expect(verticalLineThroughWordClashes(doc())).toEqual([]);
  });

  it('Hebrew source, forced RTL option', () => {
    expect(verticalLineThroughWordClashes(doc(), { rtl: true })).toEqual([]);
  });

  it('English gloss, RTL', () => {
    expect(verticalLineThroughWordClashes(glossDoc(doc()), { rtl: true })).toEqual([]);
  });

  it('English gloss, LTR (the guided stacked diagram flips glossed Hebrew)', () => {
    expect(verticalLineThroughWordClashes(glossDoc(doc()), { rtl: false })).toEqual([]);
  });
});

describe('Rom 9:13 — pedestalled compound quote ("Jacob I loved, but Esau I hated")', () => {
  const doc = () => getGuidedDocument('sblgnt_romans_236')!;

  it('source Greek: no vertical line runs through a word', () => {
    expect(verticalLineThroughWordClashes(doc())).toEqual([]);
  });

  it('English gloss: no vertical line runs through a word', () => {
    expect(verticalLineThroughWordClashes(glossDoc(doc()))).toEqual([]);
  });

  it('the riser meets the spine bar end-to-end at the bar column', () => {
    const layout = layoutDocument(glossDoc(doc()));
    const lines = layout.elements.filter((e): e is LineElement => e.kind === 'line');
    const riser = lines.find(
      (l) => l.role === 'stem' && l.style === 'solid' && l.relationId === 'r_s236_13',
    );
    expect(riser).toBeDefined();
    // The bar may be split into pass-behind segments; the riser's top must
    // meet the LOWEST bar segment's bottom at the same x, so the pedestal,
    // riser, and spine read as one connected vertical.
    const barSegs = lines.filter(
      (l) => l.role === 'coordination' && l.style === 'dashed' && Math.abs(l.x1 - riser!.x1) < 0.6,
    );
    expect(barSegs.length).toBeGreaterThan(0);
    const barBottom = Math.max(...barSegs.flatMap((l) => [l.y1, l.y2]));
    const riserTop = Math.min(riser!.y1, riser!.y2);
    expect(Math.abs(riserTop - barBottom)).toBeLessThan(0.6);
  });
});
