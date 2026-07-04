// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { FirstRunTutorial } from '@/ui/tutorial/FirstRunTutorial';
import {
  TUTORIAL_KEY,
  isTutorialSeen,
  isTutorialResetPending,
  resetTutorialForDev,
  registerGntTutorialBridge,
  useTutorialStore,
} from '@/ui/tutorial/tutorialState';
import {
  TUTORIAL_STEPS,
  GLOSS_TOGGLE_TIP,
  BSB_TOGGLE_TIP,
  stepById,
} from '@/ui/tutorial/tutorialSteps';
import { useEditorStore, useGuidedStore } from '@/state';

/**
 * First-launch walkthrough: shows once on a first run, never after it has been
 * completed or dismissed, every step skippable (with or without its target on
 * screen), and exiting returns the app to normal immediately.
 */

function resetStores() {
  resetTutorialForDev();
  localStorage.removeItem('kr:tutorial:v1'); // clear any legacy flag between tests
  useTutorialStore.setState({ active: false, stepId: 'pick' });
  useEditorStore.setState({
    firstRun: false,
    glossMode: false,
    sourceTextVersion: 'grc',
    diagramMode: 'phrase-block',
    leftCollapsed: true,
  });
  useGuidedStore.setState({ introOpen: false });
}

beforeEach(() => {
  vi.useFakeTimers();
  resetStores();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  resetStores();
});

const advanceStart = () => act(() => void vi.advanceTimersByTime(1000));

describe('first-run auto-show', () => {
  it('shows on a first run when the tutorial has never been seen', () => {
    useEditorStore.setState({ firstRun: true });
    render(createElement(FirstRunTutorial));
    expect(screen.queryByRole('dialog')).toBeNull(); // waits for the shell to settle
    advanceStart();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pick John 1:1')).toBeInTheDocument();
  });

  it('does NOT show when the completed/dismissed key exists', () => {
    localStorage.setItem(TUTORIAL_KEY, 'completed');
    useEditorStore.setState({ firstRun: true });
    render(createElement(FirstRunTutorial));
    advanceStart();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does NOT show on a returning launch (not first run)', () => {
    render(createElement(FirstRunTutorial));
    advanceStart();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('re-shows ONCE for a returning user who saw an older tutorial version', () => {
    // A returning user (not first run) who completed the v1 tour: the version
    // bump should re-offer the tour exactly once.
    localStorage.setItem('kr:tutorial:v1', 'completed');
    expect(isTutorialResetPending()).toBe(true);
    render(createElement(FirstRunTutorial));
    advanceStart();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Finishing marks the CURRENT version seen and retires the legacy flag, so
    // the reset can never fire again (until the version is bumped anew).
    act(() => useTutorialStore.getState().exit({ completed: true }));
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('completed');
    expect(localStorage.getItem('kr:tutorial:v1')).toBeNull();
    expect(isTutorialResetPending()).toBe(false);
    cleanup();
    render(createElement(FirstRunTutorial));
    advanceStart();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does NOT re-show for a returning user who never saw ANY tutorial', () => {
    // No legacy flag present → no reset pending → returning users are not nagged.
    expect(isTutorialResetPending()).toBe(false);
    render(createElement(FirstRunTutorial));
    advanceStart();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('exit', () => {
  it('"Exit tour" hides the overlay and persists so it never auto-shows again', () => {
    useEditorStore.setState({ firstRun: true });
    render(createElement(FirstRunTutorial));
    advanceStart();
    fireEvent.click(screen.getByRole('button', { name: 'Exit tour' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('dismissed');
    expect(isTutorialSeen()).toBe(true);
    expect(useTutorialStore.getState().active).toBe(false);
  });

  it('Escape exits from any step and persists the dismissal', () => {
    act(() => useTutorialStore.getState().start());
    render(createElement(FirstRunTutorial));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('dismissed');
  });
});

describe('closing card offers Finish and a guided-mode hand-off', () => {
  it('Finish completes the tour without entering guided mode', () => {
    act(() => useTutorialStore.getState().start());
    useTutorialStore.setState({ stepId: 'done' });
    render(createElement(FirstRunTutorial));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('completed');
    expect(useGuidedStore.getState().introOpen).toBe(false);
  });

  it('"Start Guided Exploration" completes the tour and opens the guided intro', () => {
    act(() => useTutorialStore.getState().start());
    useTutorialStore.setState({ stepId: 'done' });
    render(createElement(FirstRunTutorial));
    fireEvent.click(screen.getByRole('button', { name: 'Start Guided Exploration' }));
    expect(useTutorialStore.getState().active).toBe(false);
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('completed');
    expect(useGuidedStore.getState().introOpen).toBe(true);
  });
});

describe('skipping', () => {
  it('every step is skippable with NO targets mounted, applying safe defaults', () => {
    act(() => useTutorialStore.getState().start());
    render(createElement(FirstRunTutorial));

    // Step 1 (pick) and 2 (open): no GntPicker mounted (bridge absent) — the
    // fallback text shows and skipping must not crash or block.
    expect(screen.getByText('Pick John 1:1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    expect(screen.getByText('Open the passage')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));

    // Step 3 (gloss): skipping turns the English-gloss display on.
    expect(screen.getByText('Read the diagram in English')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    expect(useEditorStore.getState().glossMode).toBe(true);

    // Step 4 (BSB): skipping switches the source strip to English.
    expect(screen.getByText('Show the English text')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    expect(useEditorStore.getState().sourceTextVersion).toBe('en');

    // Step 5 (Kellogg-Reed): skipping switches the visualization.
    expect(screen.getByText('Try the Kellogg-Reed view')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    expect(useEditorStore.getState().diagramMode).toBe('kellogg-reed');

    // Closing card; Finish persists completion.
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('completed');
  });

  it('skipping an early step never breaks a later one (each applies its own state)', () => {
    act(() => useTutorialStore.getState().start());
    render(createElement(FirstRunTutorial));
    // Skip pick + open with nothing selected/opened…
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    // …then perform gloss through the normal store action (as the real toggle would).
    act(() => useEditorStore.getState().setGlossMode(true));
    expect(screen.getByText('Show the English text')).toBeInTheDocument();
  });
});

describe('observing the app (steps advance on the real actions)', () => {
  it('advances when the user performs the action instead of pressing anything', () => {
    act(() => useTutorialStore.getState().start());
    useTutorialStore.setState({ stepId: 'gloss' });
    render(createElement(FirstRunTutorial));
    expect(screen.getByText('Read the diagram in English')).toBeInTheDocument();
    act(() => useEditorStore.getState().setGlossMode(true));
    expect(screen.getByText('Show the English text')).toBeInTheDocument();
    act(() => useEditorStore.getState().setSourceTextVersion('en'));
    expect(screen.getByText('Try the Kellogg-Reed view')).toBeInTheDocument();
    act(() => useEditorStore.getState().setDiagramMode('kellogg-reed'));
    expect(screen.getByText('That’s the tour!')).toBeInTheDocument();
  });

  it('a step that is ALREADY satisfied auto-advances instead of trapping', () => {
    useEditorStore.setState({ glossMode: true, sourceTextVersion: 'en' });
    act(() => useTutorialStore.getState().start());
    useTutorialStore.setState({ stepId: 'gloss' });
    render(createElement(FirstRunTutorial));
    // gloss and bsb are both already done — lands straight on Kellogg-Reed.
    expect(screen.getByText('Try the Kellogg-Reed view')).toBeInTheDocument();
  });

  it('uses the picker bridge for the pick step', () => {
    let checked = false;
    const unregister = registerGntTutorialBridge({
      johnListReady: () => true,
      listLoading: () => false,
      anyChecked: () => checked,
      isJohn11Checked: () => checked,
      checkJohn11: () => (checked = true),
      ensureJohn: () => undefined,
      openCheckedOrJohn11: () => true,
    });
    act(() => useTutorialStore.getState().start());
    render(createElement(FirstRunTutorial));
    expect(screen.getByText('Pick John 1:1')).toBeInTheDocument();
    checked = true; // the user ticks the box; the poll notices
    act(() => void vi.advanceTimersByTime(600));
    expect(screen.getByText('Open the passage')).toBeInTheDocument();
    unregister();
  });
});

describe('copy: English display aids never claim to change the syntax', () => {
  it('diagram gloss tooltip says the structure stays the Greek/Hebrew parse', () => {
    expect(GLOSS_TOGGLE_TIP).toMatch(/glosses/i);
    expect(GLOSS_TOGGLE_TIP).toMatch(/still follow the Greek\/Hebrew syntax/i);
  });

  it('BSB tooltip says it is a parallel translation, not the grammar source', () => {
    expect(BSB_TOGGLE_TIP).toMatch(/parallel English translation/i);
    expect(BSB_TOGGLE_TIP).toMatch(/still follows the Greek syntax/i);
  });

  it('the gloss and BSB steps carry the same clarification', () => {
    expect(stepById('gloss').note).toMatch(/structure still follows the Greek grammar/i);
    expect(stepById('bsb').note).toMatch(/diagram still follows the Greek parse/i);
  });

  it('has the five guided steps in the requested order', () => {
    expect(TUTORIAL_STEPS.map((s) => s.id)).toEqual([
      'pick',
      'open',
      'gloss',
      'bsb',
      'kellogg',
      'done',
    ]);
  });
});
