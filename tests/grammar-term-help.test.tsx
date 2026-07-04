import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, fireEvent, screen, act } from '@testing-library/react';
import { GuidedStepCard } from '@/ui/guided/GuidedStepCard';
import { useEditorStore, useGuidedStore } from '@/state';
import { grammarHighlightGuides } from '@/data/grammarHighlights';

/**
 * Guided-mode grammar-term help: a known glossary term ("genitive") appearing
 * in a step's prose renders as a dashed-underline help control; activating it
 * (click or keyboard) opens its definition, and Escape closes it. Companion
 * to the term-link tests in `tests/guided-ui.test.tsx`.
 */

function setWidth(px: number) {
  Object.defineProperty(window, 'innerWidth', { value: px, configurable: true, writable: true });
  window.dispatchEvent(new Event('resize'));
}

describe('guided mode grammar-term help', () => {
  beforeEach(() => {
    setWidth(1280);
    useEditorStore.getState().setForceDesktop(false);
    useGuidedStore.getState().leave();
    useGuidedStore.setState({ introOpen: false });
    useEditorStore.getState().newDocument('en', 'Grammar term help');
    useEditorStore.getState().setAppMode('explore');
  });
  afterEach(cleanup);

  function openColossiansGenitiveStep() {
    useGuidedStore.getState().enter('greek');
    act(() => useGuidedStore.getState().openGuide('guide-colossians-2-11-12'));
    const guide = grammarHighlightGuides.find((g) => g.id === 'guide-colossians-2-11-12')!;
    const stepIndex = guide.steps.findIndex((s) => /\bgenitive\b/i.test(s.body));
    expect(stepIndex).toBeGreaterThanOrEqual(0);
    act(() => useGuidedStore.getState().setStep(stepIndex));
    return guide.steps[stepIndex]!;
  }

  it('renders a known grammar term with the dashed-underline help class and an accessible name', () => {
    openColossiansGenitiveStep();
    const { container } = render(createElement(GuidedStepCard));
    const helpEls = screen.getAllByRole('button', { name: /genitive/i });
    const genitiveHelp = helpEls.find((el) => el.classList.contains('grammar-term-help'));
    expect(genitiveHelp).toBeTruthy();
    expect(genitiveHelp!.classList.contains('grammar-term-help')).toBe(true);
    expect(genitiveHelp!.textContent).toBe('genitive');
    expect(genitiveHelp!.getAttribute('aria-label')).toMatch(/genitive.*definition/i);
    // The step body's prose uses "genitive" twice, but only its FIRST
    // occurrence is highlighted within that block — noise-avoidance, not a
    // missed match (the caution paragraph is a separate prose block and gets
    // its own independent first occurrence).
    const body = container.querySelector('.guided-step-body')!;
    const inBody = Array.from(body.querySelectorAll('.grammar-term-help')).filter(
      (el) => el.textContent === 'genitive',
    );
    expect(inBody.length).toBe(1);
  });

  it('does not alter the plain-text content available for copy/paste', () => {
    const step = openColossiansGenitiveStep();
    const { container } = render(createElement(GuidedStepCard));
    const body = container.querySelector('.guided-step-body')!;
    // The rendered text still reads the same prose (markers resolved, no stray
    // markup characters), even though "genitive" is now wrapped in a control.
    expect(body.textContent).not.toContain('[[');
    expect(body.textContent).toContain('genitive');
    expect(step.body).toContain('genitive');
  });

  it('opens the definition popover on click, and again via keyboard Enter/Space', () => {
    openColossiansGenitiveStep();
    const { container } = render(createElement(GuidedStepCard));
    const help = container.querySelector<HTMLButtonElement>('.grammar-term-help')!;

    expect(container.querySelector('.grammar-term-popover')).toBeNull();
    fireEvent.click(help);
    let popover = container.querySelector('.grammar-term-popover');
    expect(popover).toBeTruthy();
    expect(popover!.textContent).toMatch(/genitive case/i);

    // Close by clicking the term again, then reopen with the keyboard.
    fireEvent.click(help);
    expect(container.querySelector('.grammar-term-popover')).toBeNull();

    fireEvent.keyDown(help, { key: 'Enter' });
    expect(container.querySelector('.grammar-term-popover')).toBeTruthy();
    fireEvent.click(help); // close before testing Space
    expect(container.querySelector('.grammar-term-popover')).toBeNull();

    fireEvent.keyDown(help, { key: ' ' });
    popover = container.querySelector('.grammar-term-popover');
    expect(popover).toBeTruthy();
  });

  it('closes the popover on Escape', () => {
    openColossiansGenitiveStep();
    const { container } = render(createElement(GuidedStepCard));
    const help = container.querySelector<HTMLButtonElement>('.grammar-term-help')!;
    fireEvent.click(help);
    expect(container.querySelector('.grammar-term-popover')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('.grammar-term-popover')).toBeNull();
  });

  it('is visually distinct from the Greek term-link convention (dashed vs. dotted underline, help vs. pointer cursor)', () => {
    openColossiansGenitiveStep();
    const { container } = render(createElement(GuidedStepCard));
    const help = container.querySelector('.grammar-term-help')!;
    const termLink = container.querySelector('.guided-term-link');
    expect(termLink).toBeTruthy();
    expect(help.classList.contains('guided-term-link')).toBe(false);
    expect(termLink!.classList.contains('grammar-term-help')).toBe(false);
  });
});
