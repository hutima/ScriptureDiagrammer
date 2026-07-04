import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import { DiagramCanvas } from '@/ui/components/DiagramCanvas';
import { useEditorStore } from '@/state';
import { resetTouchDeviceCache } from '@/ui/responsive';
import { sampleDocuments } from '@/fixtures';

/**
 * Row-spacing (↕) and zoom (−/⤢/+) buttons are redundant on a touch screen —
 * pinch-to-zoom (DiagramCanvas's own pointer handlers) already covers zooming
 * there, so both `.canvas-zoom` groups are dropped when `isTouchDevice()` is
 * true, even under a forced-desktop layout (a phone stays a touch screen no
 * matter what layout it renders). See `ui/responsive/viewport.ts` for the
 * detection itself.
 *
 * Retitled so `bookForDoc` finds no matching GNT book and the parallel-BSB
 * fetch effect is a no-op — keeps this test fully synchronous/offline,
 * mirroring `source-strip-zoom.test.tsx`.
 */
const johnOneOneA = {
  ...sampleDocuments.find((d) => d.id === 'doc_sample_john_1_1a')!,
  title: 'Sample sentence (touch device test)',
};

const originalMatchMedia = window.matchMedia;

function mockCoarsePointer() {
  window.matchMedia = ((query: string) => ({
    matches: query === '(pointer: coarse)',
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  resetTouchDeviceCache();
});

function setupDoc() {
  useEditorStore.setState({
    doc: johnOneOneA,
    baseDoc: null,
    selection: {},
    sourceTextVersion: 'grc',
    versesInPanel: false,
    appMode: 'explore',
    // The zoom/spacing groups only render for the SVG (non-"html-mode")
    // diagrams — kellogg-reed is one, so pin it regardless of test order.
    diagramMode: 'kellogg-reed',
  });
}

describe('touch-device zoom/spacing controls', () => {
  it('keeps the row-spacing and zoom button groups on a non-touch (mouse) device', () => {
    resetTouchDeviceCache();
    setupDoc();
    const { container } = render(createElement(DiagramCanvas));
    expect(container.querySelectorAll('.canvas-zoom').length).toBe(2);
  });

  it('drops both button groups on a touch device (coarse primary pointer)', () => {
    mockCoarsePointer();
    resetTouchDeviceCache();
    setupDoc();
    const { container } = render(createElement(DiagramCanvas));
    expect(container.querySelectorAll('.canvas-zoom').length).toBe(0);
  });
});
