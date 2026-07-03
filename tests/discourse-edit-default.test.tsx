import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import { ModeSwitcher } from '@/ui/shell/ModeSwitcher';
import { useEditorStore } from '@/state';

/**
 * Discourse mode keeps all three app modes available (Explore, Edit, Study) but
 * DEFAULTS to Edit on entry (that default lives in ResponsiveShell's effect;
 * here we only assert the switcher still offers every mode). Edit remains gated
 * on `canEdit` (desktop-only).
 */

beforeEach(() => useEditorStore.getState().setAppMode('explore'));
afterEach(cleanup);

describe('ModeSwitcher', () => {
  it('offers Explore, Edit, and Study when editing is available', () => {
    render(createElement(ModeSwitcher, { canEdit: true }));
    const labels = Array.from(document.querySelectorAll('.mode-switcher button')).map((b) => b.textContent);
    expect(labels).toContain('Explore');
    expect(labels).toContain('Edit');
    expect(labels).toContain('Study');
  });

  it('hides Edit when editing is unavailable (non-desktop)', () => {
    render(createElement(ModeSwitcher, { canEdit: false }));
    const labels = Array.from(document.querySelectorAll('.mode-switcher button')).map((b) => b.textContent);
    expect(labels).toContain('Explore');
    expect(labels).not.toContain('Edit');
    expect(labels).toContain('Study');
  });
});
