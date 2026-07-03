import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore } from '@/state';
import { DEFAULT_MODE } from '@/domain/layout';

const store = useEditorStore;
const DIAGRAM_MODE_KEY = 'kr:diagramMode';

describe('store — diagramMode persistence + leave-discourse resets app mode', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    // Start from a known-clean interaction/visualization state.
    store.setState({ diagramMode: DEFAULT_MODE, appMode: 'explore' });
  });

  it('resets app mode to explore when leaving discourse', () => {
    store.getState().setDiagramMode('discourse');
    // Simulate the ResponsiveShell explore→edit effect having run in discourse.
    store.getState().setAppMode('edit');
    expect(store.getState().appMode).toBe('edit');

    store.getState().setDiagramMode('kellogg-reed');
    expect(store.getState().diagramMode).toBe('kellogg-reed');
    expect(store.getState().appMode).toBe('explore');
  });

  it('does NOT touch app mode when switching between two non-discourse modes', () => {
    store.getState().setDiagramMode('kellogg-reed');
    store.getState().setAppMode('sermon');

    store.getState().setDiagramMode('dependency');
    // Neither previous nor next is discourse → appMode is left untouched.
    expect(store.getState().appMode).toBe('sermon');
  });

  it('leaves app mode untouched when ENTERING discourse (ResponsiveShell owns that)', () => {
    store.getState().setAppMode('explore');
    store.getState().setDiagramMode('discourse');
    // Store must not force edit itself — that is the shell effect's job.
    expect(store.getState().appMode).toBe('explore');
  });

  it('persists the visualization to localStorage (override only)', () => {
    store.getState().setDiagramMode('dependency');
    expect(localStorage.getItem(DIAGRAM_MODE_KEY)).toBe('dependency');

    // The default is stored as the ABSENCE of a key.
    store.getState().setDiagramMode(DEFAULT_MODE);
    expect(localStorage.getItem(DIAGRAM_MODE_KEY)).toBeNull();
  });

  it('round-trips a persisted value into a freshly created store', async () => {
    localStorage.setItem(DIAGRAM_MODE_KEY, 'constituency');
    vi.resetModules();
    const fresh = await import('@/state/store');
    expect(fresh.useEditorStore.getState().diagramMode).toBe('constituency');
  });

  it('falls back to DEFAULT_MODE on an invalid stored value', async () => {
    localStorage.setItem(DIAGRAM_MODE_KEY, 'not-a-real-mode');
    vi.resetModules();
    const fresh = await import('@/state/store');
    expect(fresh.useEditorStore.getState().diagramMode).toBe(DEFAULT_MODE);
  });
});
