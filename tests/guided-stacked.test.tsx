import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import { GuidedStackedDiagram } from '@/ui/guided/GuidedStackedDiagram';
import { getGuidedDocument } from '@/fixtures/guided';
import { layoutForMode } from '@/domain/layout';
import { docDirection, glossDoc } from '@/domain/model';
import { resolveFocusIds, focusBounds } from '@/ui/guided/focus';
import type { GuidedStep } from '@/domain/schema';

/**
 * Companions to the guided-mode UI smoke tests: pure-function coverage of the
 * two behaviours added to `GuidedStackedDiagram`:
 *   A. a Hebrew (RTL) secondary passage flips to LTR once the guided display
 *      is glossed to English (never in Greek/source mode, never in Morphology).
 *   B. the stacked panel auto-scrolls, once per step, so the step's secondary
 *      focus (or highlights, if no focus is given) is centered.
 */

// A synthetic stacked step over the bundled WLC Hebrew (RTL) parallel document,
// exercising GuidedStackedDiagram directly (decoupled from any specific guide —
// the Acts 2:39 guide it used to borrow this from is now a discourse guide).
const step: GuidedStep = {
  id: 'stacked-hebrew-fixture',
  title: 'Genesis 17:12 — the covenant sign given to Abraham',
  body: '',
  focus: {},
  secondaryPassageId: 'wlc_genesis_1_11',
  secondaryFocus: {
    nodeIds: ['w_o010170120052', 'w_o010170120082', 'w_o010170120083', 'w_o010170120182'],
  },
};

function textXs(svg: Element): number[] {
  return Array.from(svg.querySelectorAll('text')).map((t) => Number(t.getAttribute('x')));
}

describe('GuidedStackedDiagram — RTL/LTR flip for glossed English display', () => {
  afterEach(cleanup);

  it('the bundled secondary passage really is Hebrew/RTL in its own direction', () => {
    const doc = getGuidedDocument(step.secondaryPassageId!)!;
    expect(doc.language).toBe('hbo');
    expect(docDirection(doc)).toBe('rtl');
  });

  it('layoutForMode actually moves geometry when the rtl flag flips (sanity: the flip is observable)', () => {
    const doc = getGuidedDocument(step.secondaryPassageId!)!;
    const rtlLayout = layoutForMode('kellogg-reed', doc, doc.layoutHints, { rtl: true });
    const ltrLayout = layoutForMode('kellogg-reed', doc, doc.layoutHints, { rtl: false });
    const rtlXs = rtlLayout.elements.filter((e) => e.kind === 'text').map((e) => e.x);
    const ltrXs = ltrLayout.elements.filter((e) => e.kind === 'text').map((e) => e.x);
    expect(rtlXs.length).toBeGreaterThan(0);
    expect(ltrXs).not.toEqual(rtlXs);
  });

  it('renders rtl=true (source-language Hebrew) when the guide is NOT glossed', () => {
    const rawDoc = getGuidedDocument(step.secondaryPassageId!)!;
    const expected = layoutForMode('kellogg-reed', rawDoc, rawDoc.layoutHints, { rtl: true });
    const { container } = render(
      createElement(GuidedStackedDiagram, { step, mode: 'kellogg-reed', glossMode: false }),
    );
    const svg = container.querySelector('svg.diagram-paper')!;
    expect(svg).toBeTruthy();
    expect(textXs(svg)).toEqual(expected.elements.filter((e) => e.kind === 'text').map((e) => e.x));
  });

  it('flips to rtl=false (LTR) once the guided display glosses the words to English', () => {
    const rawDoc = getGuidedDocument(step.secondaryPassageId!)!;
    const glossedDoc = glossDoc(rawDoc);
    const expectedLtr = layoutForMode('kellogg-reed', glossedDoc, glossedDoc.layoutHints, { rtl: false });
    const expectedIfStillRtl = layoutForMode('kellogg-reed', glossedDoc, glossedDoc.layoutHints, { rtl: true });
    // Confirm the flip actually changes something for the glossed doc too, so
    // the next assertion is a meaningful check and not a geometry coincidence.
    expect(expectedLtr.elements.filter((e) => e.kind === 'text').map((e) => e.x)).not.toEqual(
      expectedIfStillRtl.elements.filter((e) => e.kind === 'text').map((e) => e.x),
    );

    const { container } = render(
      createElement(GuidedStackedDiagram, { step, mode: 'kellogg-reed', glossMode: true }),
    );
    const svg = container.querySelector('svg.diagram-paper')!;
    expect(svg).toBeTruthy();
    expect(textXs(svg)).toEqual(expectedLtr.elements.filter((e) => e.kind === 'text').map((e) => e.x));
  });

  it('keeps rtl=true in Morphology mode even with glossMode on (Morphology is never glossed)', () => {
    const rawDoc = getGuidedDocument(step.secondaryPassageId!)!;
    const expected = layoutForMode('morphology', rawDoc, rawDoc.layoutHints, { rtl: true });
    const { container } = render(
      createElement(GuidedStackedDiagram, { step, mode: 'morphology', glossMode: true }),
    );
    const svg = container.querySelector('svg.diagram-paper')!;
    expect(svg).toBeTruthy();
    expect(textXs(svg)).toEqual(expected.elements.filter((e) => e.kind === 'text').map((e) => e.x));
  });
});

describe('GuidedStackedDiagram — auto-scroll to the secondary focus', () => {
  afterEach(cleanup);

  it('resolves the Hebrew stacked step secondary focus to non-empty bounds', () => {
    const doc = getGuidedDocument(step.secondaryPassageId!)!;
    const layout = layoutForMode('kellogg-reed', doc, doc.layoutHints, { rtl: true });
    const { nodeIds, relationIds } = resolveFocusIds(doc, { ...step, focus: step.secondaryFocus ?? {} });
    expect(nodeIds.size + relationIds.size).toBeGreaterThan(0);
    const bounds = focusBounds(layout, nodeIds, relationIds);
    expect(bounds).not.toBeNull();
    expect(bounds!.x2).toBeGreaterThan(bounds!.x1);
  });

  it('is a no-op (never throws, scroll stays at 0) when the frame is unmeasurable (jsdom: zero client size)', () => {
    const { container } = render(
      createElement(GuidedStackedDiagram, { step, mode: 'kellogg-reed', glossMode: false }),
    );
    const scrollDiv = container.querySelector('.vc-frame-scroll') as HTMLDivElement;
    expect(scrollDiv).toBeTruthy();
    expect(scrollDiv.scrollLeft).toBe(0);
    expect(scrollDiv.scrollTop).toBe(0);
  });

  it('centers the scroll container on the secondary focus bounds once the panel has a real size', () => {
    const rawDoc = getGuidedDocument(step.secondaryPassageId!)!;
    const layout = layoutForMode('kellogg-reed', rawDoc, rawDoc.layoutHints, { rtl: true });
    const { nodeIds, relationIds } = resolveFocusIds(rawDoc, { ...step, focus: step.secondaryFocus ?? {} });
    const bounds = focusBounds(layout, nodeIds, relationIds)!;
    expect(bounds).toBeTruthy();
    const W = 400;
    const H = 300;
    const cx = (bounds.x1 + bounds.x2) / 2;
    const cy = (bounds.y1 + bounds.y2) / 2;
    const expectedLeft = Math.max(0, cx - W / 2);
    const expectedTop = Math.max(0, cy - H / 2);

    const widthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')!;
    const heightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: W });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: H });
    try {
      const { container } = render(
        createElement(GuidedStackedDiagram, { step, mode: 'kellogg-reed', glossMode: false }),
      );
      const scrollDiv = container.querySelector('.vc-frame-scroll') as HTMLDivElement;
      expect(scrollDiv.scrollLeft).toBeCloseTo(expectedLeft, 5);
      expect(scrollDiv.scrollTop).toBeCloseTo(expectedTop, 5);
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', widthDesc);
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', heightDesc);
    }
  });
});
