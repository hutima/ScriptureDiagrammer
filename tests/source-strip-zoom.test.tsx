import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { DiagramCanvas } from '@/ui/components/DiagramCanvas';
import { useEditorStore } from '@/state';
import { sampleDocuments } from '@/fixtures';

/**
 * Double-clicking a word in the verses/source-text strip should zoom/centre the
 * diagram on that word, exactly like double-clicking the word on the diagram
 * itself already does (both call the same `zoomToWord`, which explicitly
 * selects the node rather than toggling it — the two single clicks that precede
 * a dblclick may otherwise have left it deselected).
 *
 * Covers the Greek/Hebrew branch of `renderSourceStrip`, which renders from the
 * document synchronously (`buildSourceItems`) with no network dependency. The
 * English (BSB) branch shares the exact same `zoomToWord` call, but only
 * renders once the parallel BSB alignment has loaded async — wiring a parallel
 * fixture for that is disproportionate to this test's purpose.
 */

// Retitled so `bookForDoc` (io/parallel.ts) finds no matching GNT book and the
// component's parallel-BSB-alignment fetch effect is a no-op — keeps this test
// fully synchronous/offline without touching the fixture's tokens or syntax.
const johnOneOneA = {
  ...sampleDocuments.find((d) => d.id === 'doc_sample_john_1_1a')!,
  title: 'Sample sentence (John 1:1a)',
};

afterEach(() => {
  cleanup();
});

describe('source strip double-click zoom', () => {
  it('zooms/selects the Greek word\'s node on dblclick, overriding a different prior selection', () => {
    useEditorStore.setState({
      doc: johnOneOneA,
      baseDoc: null,
      selection: { nodeId: 'n_hn' }, // start selected on a DIFFERENT node (the verb)
      sourceTextVersion: 'grc',
      versesInPanel: false,
      appMode: 'explore',
    });

    const { container } = render(createElement(DiagramCanvas));

    // The final word carries its trailing period in `surface` ("λόγος."), so
    // match by prefix rather than exact equality.
    const words = Array.from(container.querySelectorAll('.src-word'));
    const target = words.find((el) => el.textContent?.trim().startsWith('λόγος'));
    expect(target).toBeTruthy();

    fireEvent.doubleClick(target!);

    // zoomToWord explicitly selects — unlike the single-click toggle handler,
    // it must land on the double-clicked word even though a different node
    // ('n_hn', the verb) was selected beforehand.
    expect(useEditorStore.getState().selection.nodeId).toBe('n_logos');
  });
});
