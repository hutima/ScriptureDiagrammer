import { describe, it, expect } from 'vitest';
import { layoutDocument } from '@/domain/layout';
import { layoutToSvg } from '@/domain/render';
import { cloneSample } from '@/fixtures';

describe('SVG renderer', () => {
  it('emits a well-formed standalone SVG', () => {
    const doc = cloneSample('doc_sample_fox')!;
    const svg = layoutToSvg(layoutDocument(doc), { standalone: true, background: true });
    expect(svg).toMatch(/^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('<line');
    expect(svg).toContain('<text');
    expect(svg).toContain('font-family');
  });

  it('escapes XML-significant characters in labels', () => {
    const doc = cloneSample('doc_sample_fox')!;
    doc.tokens[3]!.surface = 'fox & <hound>';
    const svg = layoutToSvg(layoutDocument(doc));
    expect(svg).toContain('fox &amp; &lt;hound&gt;');
    expect(svg).not.toContain('<hound>');
  });

  it('preserves polytonic Greek text in output', () => {
    const doc = cloneSample('doc_sample_john_1_1a')!;
    const svg = layoutToSvg(layoutDocument(doc));
    expect(svg).toContain('λόγος');
  });

  it('layers words over lines: halos, then repainted baselines, then glyph ink', () => {
    // A word's paper-coloured halo must mask lines drawn BEFORE it (the dashed
    // verb spine) but must never erase the baseline the word SITS ON — deep
    // Greek descenders reach past the 6px textRise, and a paint-order halo bit
    // through the baseline stroke (Heb 2:10 ἀρχηγὸν). The serializer emits:
    // all structural lines/paths, then stroke-only halo underlays, then the
    // solid baseline strokes REPAINTED, then every word's ink on top.
    const doc = cloneSample('doc_sample_phil_1_1_2_grc')!;
    const svg = layoutToSvg(layoutDocument(doc, doc.layoutHints));
    const tags = [...svg.matchAll(/<(text|line|path)[^>]*>/g)].map((m) => m[0]);
    const isHalo = (t: string) => t.startsWith('<text') && t.includes('fill="none"');
    const isInk = (t: string) => t.startsWith('<text') && !t.includes('fill="none"');
    const isStroke = (t: string) => !t.startsWith('<text');
    const firstHalo = tags.findIndex(isHalo);
    const firstInk = tags.findIndex(isInk);
    const lastStroke = tags.length - 1 - [...tags].reverse().findIndex(isStroke);
    expect(firstHalo).toBeGreaterThan(-1);
    expect(firstInk).toBeGreaterThan(-1);
    // Every word's ink is painted after every line — including the repainted
    // baselines, which themselves come after the halo underlays.
    expect(firstInk).toBeGreaterThan(lastStroke);
    expect(lastStroke).toBeGreaterThan(firstHalo);
    // The strokes after the first halo are exactly the repainted solid
    // baselines: solid (no dasharray) horizontal lines.
    const repainted = tags.slice(firstHalo).filter(isStroke);
    expect(repainted.length).toBeGreaterThan(0);
    for (const t of repainted) {
      expect(t.startsWith('<line')).toBe(true);
      expect(t).not.toContain('stroke-dasharray');
    }
  });

  it('paints a word-highlight swash behind the text, under all lines', () => {
    const doc = cloneSample('doc_sample_fox')!;
    const layout = layoutDocument(doc);
    const word = layout.elements.find((e) => e.kind === 'text' && e.nodeId && !e.box);
    expect(word).toBeDefined();
    const svg = layoutToSvg(layout, {
      highlights: { nodeFills: new Map([[word!.nodeId!, '#fde047']]) },
    });
    // The swash rect exists and is emitted BEFORE every line/path/text so it
    // sits behind the whole diagram, exactly like the canvas.
    const rect = svg.indexOf('fill="#fde047"');
    expect(rect).toBeGreaterThan(-1);
    expect(rect).toBeLessThan(svg.indexOf('<line'));
    expect(rect).toBeLessThan(svg.indexOf('<text'));
  });

  it('paints a soft swash along a highlighted relation connector', () => {
    const doc = cloneSample('doc_sample_fox')!;
    const layout = layoutDocument(doc);
    const stroke = layout.elements.find((e) => e.kind !== 'text' && e.relationId);
    expect(stroke).toBeDefined();
    const svg = layoutToSvg(layout, {
      highlights: { relationFills: new Map([[stroke!.relationId!, '#a7f3d0']]) },
    });
    expect(svg).toContain('stroke="#a7f3d0" stroke-width="7" stroke-linecap="round" opacity="0.55"');
  });

  it('emits no swashes when no highlights are passed', () => {
    const doc = cloneSample('doc_sample_fox')!;
    const svg = layoutToSvg(layoutDocument(doc), { highlights: {} });
    expect(svg).not.toContain('opacity="0.55"');
    expect(svg).toBe(layoutToSvg(layoutDocument(doc)));
  });

  it('marks low-confidence relations as tentative for ambiguity colouring', () => {
    const doc = cloneSample('doc_sample_fox')!;
    const rel = doc.syntax.relations[0]!;
    rel.provenance = { source: 'inferred', confidence: 'low' };
    const layout = layoutDocument(doc, doc.layoutHints);
    const tentative = layout.elements.filter(
      (e) => (e as { tentative?: boolean }).tentative,
    );
    expect(tentative.length).toBeGreaterThan(0);
    expect(tentative.every((e) => e.relationId === rel.id)).toBe(true);
  });
});
