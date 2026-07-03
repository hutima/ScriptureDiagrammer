import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { DiscourseFirstLoadModal } from '@/ui/discourse/DiscourseFirstLoadModal';

/**
 * Phase 7 — the first-load guidance modal is a real dialog (role="dialog",
 * aria-modal), with three actions and Escape/backdrop dismissal. Presentation
 * + accessibility only; the WHEN-to-show and persistence live in the store
 * (covered by discourse-default-demo.test.ts).
 */

afterEach(cleanup);

function setup(overrides: Partial<Parameters<typeof DiscourseFirstLoadModal>[0]> = {}) {
  const onUseDemo = vi.fn();
  const onStartOwn = vi.fn();
  const onDismiss = vi.fn();
  render(
    createElement(DiscourseFirstLoadModal, {
      open: true,
      onUseDemo,
      onStartOwn,
      onDismiss,
      ...overrides,
    }),
  );
  return { onUseDemo, onStartOwn, onDismiss };
}

describe('DiscourseFirstLoadModal', () => {
  it('renders nothing when closed', () => {
    render(
      createElement(DiscourseFirstLoadModal, {
        open: false,
        onUseDemo: vi.fn(),
        onStartOwn: vi.fn(),
        onDismiss: vi.fn(),
      }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders as an accessible dialog with the three actions', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Discourse mode is self-directed')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Use demo passage' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start with my own passage' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
  });

  it('"Use demo passage" fires onUseDemo only', () => {
    const { onUseDemo, onStartOwn, onDismiss } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Use demo passage' }));
    expect(onUseDemo).toHaveBeenCalledTimes(1);
    expect(onStartOwn).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('"Start with my own passage" fires onStartOwn only', () => {
    const { onUseDemo, onStartOwn, onDismiss } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Start with my own passage' }));
    expect(onStartOwn).toHaveBeenCalledTimes(1);
    expect(onUseDemo).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('"Dismiss", Escape, and backdrop click each dismiss', () => {
    const { onDismiss } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(document.querySelector('.modal-backdrop')!);
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  it('a click inside the dialog does not dismiss', () => {
    const { onDismiss } = setup();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
