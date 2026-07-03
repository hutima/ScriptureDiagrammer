import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { VisualizationSwitcher } from '@/ui/shell/VisualizationSwitcher';
import { useEditorStore } from '@/state';

/**
 * Discourse is a desktop-only analysis layer. On mobile it is dropped from the
 * visualization selectors so it can't be entered; on desktop it stays listed.
 */

function setWidth(px: number) {
  Object.defineProperty(window, 'innerWidth', { value: px, configurable: true, writable: true });
  window.dispatchEvent(new Event('resize'));
}

beforeEach(() => {
  // Never leave the force-desktop override on between cases.
  useEditorStore.getState().setForceDesktop(false);
});
afterEach(cleanup);

describe('discourse mode gating in the visualization switcher', () => {
  it('omits the Discourse option on mobile widths', () => {
    setWidth(360);
    render(createElement(VisualizationSwitcher));
    const labels = Array.from(document.querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toContain('Phrase / Block');
    expect(labels).not.toContain('Discourse');
    expect(screen.queryByRole('option', { name: 'Discourse' })).toBeNull();
  });

  it('keeps the Discourse option on desktop widths', () => {
    setWidth(1280);
    render(createElement(VisualizationSwitcher));
    const labels = Array.from(document.querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toContain('Discourse');
  });

  it('shows Discourse when force-desktop is on, even at a mobile width', () => {
    setWidth(360);
    useEditorStore.getState().setForceDesktop(true);
    render(createElement(VisualizationSwitcher));
    const labels = Array.from(document.querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toContain('Discourse');
    useEditorStore.getState().setForceDesktop(false);
  });
});
