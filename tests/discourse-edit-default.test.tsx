import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { ModeSwitcher } from '@/ui/shell/ModeSwitcher';
import { useEditorStore } from '@/state';

/**
 * Discourse mode is manual-first: the mode switcher drops **Explore** and
 * offers **Edit** + **Study** only. (Entering Discourse also defaults the app
 * mode to Edit — that lives in ResponsiveShell's effect.)
 */

beforeEach(() => useEditorStore.getState().setAppMode('explore'));
afterEach(cleanup);

describe('ModeSwitcher — Discourse mode', () => {
  it('shows Edit and Study but not Explore in Discourse', () => {
    render(createElement(ModeSwitcher, { canEdit: true, discourse: true }));
    const labels = Array.from(document.querySelectorAll('.mode-switcher button')).map((b) => b.textContent);
    expect(labels).toContain('Edit');
    expect(labels).toContain('Study');
    expect(labels).not.toContain('Explore');
  });

  it('still shows Explore in non-Discourse modes', () => {
    render(createElement(ModeSwitcher, { canEdit: true, discourse: false }));
    const labels = Array.from(document.querySelectorAll('.mode-switcher button')).map((b) => b.textContent);
    expect(labels).toContain('Explore');
    expect(labels).toContain('Edit');
    expect(labels).toContain('Study');
  });

  it('hides Edit when editing is unavailable (non-desktop), even in Discourse', () => {
    render(createElement(ModeSwitcher, { canEdit: false, discourse: true }));
    const labels = Array.from(document.querySelectorAll('.mode-switcher button')).map((b) => b.textContent);
    expect(labels).not.toContain('Explore');
    expect(labels).not.toContain('Edit');
    expect(labels).toContain('Study');
    expect(screen.getByRole('group', { name: 'App mode' })).toBeTruthy();
  });
});
