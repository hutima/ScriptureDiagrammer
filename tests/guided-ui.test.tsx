import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, fireEvent, screen, act } from '@testing-library/react';
import { TopBar } from '@/ui/components/TopBar';
import { LeftPanel } from '@/ui/panels/LeftPanel';
import { GuidedStepCard } from '@/ui/guided/GuidedStepCard';
import { useEditorStore, useGuidedStore } from '@/state';
import { grammarHighlightGuides } from '@/data/grammarHighlights';

/**
 * Grammar Highlights UI smoke — the entry flow (⋯ menu → intro modal → mode
 * choice), the top-bar Leave button, the curated left-panel library swap, and
 * the step card's term links / navigation. Rendering-level companions to the
 * store tests in guided.test.ts.
 */

describe('guided mode UI', () => {
  beforeEach(() => {
    useGuidedStore.getState().leave();
    useGuidedStore.setState({ introOpen: false });
    useEditorStore.getState().newDocument('en', 'Guided UI');
    useEditorStore.getState().setAppMode('explore');
  });
  afterEach(cleanup);

  it('offers Grammar highlights… in the ⋯ menu and opens the intro modal', () => {
    render(createElement(TopBar));
    fireEvent.click(screen.getByRole('button', { name: '⋯' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /grammar highlights/i }));
    expect(useGuidedStore.getState().introOpen).toBe(true);
    // The modal renders the Greek/English choice.
    expect(screen.getByRole('dialog', { name: /grammar highlights/i })).toBeTruthy();
    expect(screen.getByText(/greek mode/i)).toBeTruthy();
    expect(screen.getByText(/english mode/i)).toBeTruthy();
  });

  it('choosing Greek mode enters guided mode and shows Leave guided mode', () => {
    render(createElement(TopBar));
    act(() => useGuidedStore.getState().openIntro());
    fireEvent.click(screen.getByText(/greek mode/i));
    expect(useGuidedStore.getState().active).toBe(true);
    expect(useGuidedStore.getState().introOpen).toBe(false);
    const leave = screen.getByRole('button', { name: /leave guided mode/i });
    fireEvent.click(leave);
    expect(useGuidedStore.getState().active).toBe(false);
  });

  it('replaces the left-panel pickers with the curated guided library', () => {
    useGuidedStore.getState().enter('greek');
    render(createElement(LeftPanel));
    // The curated library label replaces the OT/GNT tabs…
    expect(screen.getByText('Grammar highlights')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'GNT' })).toBeNull();
    // …the source presents itself as a curated library, not unrestricted SBLGNT…
    expect(screen.getByText(/curated guided passages/i)).toBeTruthy();
    // …and every entry is an approved guide.
    for (const g of grammarHighlightGuides) {
      expect(screen.getByText(g.title)).toBeTruthy();
    }
  });

  it('step card renders term links, opens the detail panel, and navigates', () => {
    useGuidedStore.getState().enter('greek');
    render(createElement(GuidedStepCard));
    const guide = grammarHighlightGuides[0]!;
    expect(screen.getByText(`Step 1 of ${guide.steps.length}`)).toBeTruthy();
    // Tap the first inline Greek term link → the detail panel opens with parsing.
    const firstTermId = guide.steps[0]!.body.match(/\[\[([a-zA-Z0-9_-]+)\]\]/)?.[1];
    if (firstTermId) {
      const term = guide.greekTerms.find((t) => t.id === firstTermId)!;
      const links = screen.getAllByRole('button', { name: term.surface });
      fireEvent.click(links[0]!);
      expect(useGuidedStore.getState().selectedGreekTermId).toBe(term.id);
      expect(screen.getByText(term.parsing)).toBeTruthy();
      expect(screen.getByText(term.transliteration)).toBeTruthy();
    }
    // Navigate forward and back.
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(useGuidedStore.getState().stepIndex).toBe(1);
    expect(screen.getByText(`Step 2 of ${guide.steps.length}`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(useGuidedStore.getState().stepIndex).toBe(0);
  });
});
