import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { useDiscourseStore } from '@/state';
import { clearRemoteEnglishCache } from '@/io';
import { leafUnits } from '@/domain/discourse';
import {
  DEFAULT_DEMO_ID,
  dismissDiscourseFirstLoadModal,
  hideDefaultDemo,
  isDefaultDemoHidden,
  isDiscourseFirstLoadModalDismissed,
} from '@/persistence';

/**
 * The default BSB Ephesians 2:12–19 demo, its sample chiasm arcs, the first-load
 * guidance modal, and their ordering. Fetch is always mocked (no live network);
 * the demo's BSB data is served from the bundled parallel JSON on disk. The
 * modal-dismissed flag and the demo-hidden flag are asserted to be SEPARATE
 * persisted preferences.
 */

/** Serve the real bundled BSB Ephesians parallel JSON through a mocked fetch. */
function stubFetch() {
  const ephesians = JSON.parse(readFileSync('public/parallel/bsb/10-ephesians.json', 'utf8'));
  const fn = vi.fn(async (url: string) => {
    if (url.includes('10-ephesians.json'))
      return { ok: true, status: 200, json: async () => ephesians } as Response;
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Reset the discourse store to a pristine, nothing-loaded state. */
function resetStore() {
  useDiscourseStore.setState({
    baseDoc: null,
    doc: null,
    status: 'idle',
    error: null,
    past: [],
    future: [],
    selection: {},
    isDefaultDemo: false,
    firstLoadModalOpen: false,
    newTextRequest: 0,
    sourceId: 'macula-greek-sblgnt-lowfat',
    bookNum: 10,
    startRef: '5:3',
    endRef: '5:33',
    granularity: 'sentence',
  });
}

/** Map a loaded doc's leaf units to refStart → unitId. */
function refToUnit(): Map<string, string> {
  const doc = useDiscourseStore.getState().doc!;
  const m = new Map<string, string>();
  for (const u of leafUnits(doc)) if (u.refStart) m.set(u.refStart, u.id);
  return m;
}

beforeEach(() => {
  localStorage.clear();
  clearRemoteEnglishCache();
  resetStore();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('default demo — loading & identity (BSB)', () => {
  it('loads Ephesians 2:12–19 from BSB (NT), not 2 Samuel, and stamps the demo flag', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    const s = useDiscourseStore.getState();
    expect(s.status).toBe('loaded');
    expect(s.isDefaultDemo).toBe(true);
    expect(s.doc?.sourceId).toBe('english-bsb');
    expect(s.doc?.language).toBe('en');
    // Exactly eight verse-level units, 2:12 → 2:19 (verses outside are discarded).
    expect(leafUnits(s.doc!).map((u) => u.refStart)).toEqual(
      ['2:12', '2:13', '2:14', '2:15', '2:16', '2:17', '2:18', '2:19'],
    );
    // BSB text, not 2 Samuel — the demo range is Ephesians (Gentiles / covenants).
    expect(s.doc!.title.toLowerCase()).toContain('ephesians');
  });

  it('is idempotent — re-loading the already-loaded demo does not rebuild the doc', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    const docRef = useDiscourseStore.getState().doc;
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(useDiscourseStore.getState().doc).toBe(docRef); // no rebuild
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(true);
  });

  it('a user range load clears the demo stamp', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(true);
    // Load a different range from the same source (not the demo signature).
    useDiscourseStore.getState().setRange('2:15', '2:17');
    await useDiscourseStore.getState().loadRange();
    expect(useDiscourseStore.getState().status).toBe('loaded');
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(false);
  });
});

describe('default demo — sample chiasm arcs', () => {
  it('loads with four chiasm arcs connecting the mirrored verses', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    const doc = useDiscourseStore.getState().doc!;
    const chiasm = doc.relations.filter((r) => r.type === 'chiasm');
    expect(chiasm.length).toBe(4);

    const ref = refToUnit();
    const pairs = chiasm.map((r) => {
      const a = [...ref.entries()].find(([, id]) => id === r.sourceUnitId)?.[0];
      const b = [...ref.entries()].find(([, id]) => id === r.targetUnitId)?.[0];
      return `${a}↔${b}`;
    });
    expect(pairs.sort()).toEqual(['2:12↔2:19', '2:13↔2:18', '2:14↔2:17', '2:15↔2:16'].sort());
    // Labelled and clearly marked as sample/demo material (never authoritative).
    for (const r of chiasm) {
      expect(r.label).toBeTruthy();
      expect(r.provenance?.source).toBe('manual');
      expect(r.provenance?.reason?.toLowerCase()).toContain('sample');
    }
  });

  it('arcs are editable and deletable, and Reset restores them', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    const arc = useDiscourseStore.getState().doc!.relations.find((r) => r.type === 'chiasm')!;
    // Delete one arc.
    useDiscourseStore.getState().deleteRelation(arc.id);
    expect(useDiscourseStore.getState().doc!.relations.some((r) => r.id === arc.id)).toBe(false);
    // Reset restores the demo's seeded arcs (all four).
    useDiscourseStore.getState().resetEdits();
    expect(useDiscourseStore.getState().doc!.relations.filter((r) => r.type === 'chiasm').length).toBe(4);
  });

  it('arcs persist across a reload of the demo (patch round-trip)', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    // Fresh session: drop in-memory docs, then re-enter and auto-load the demo.
    dismissDiscourseFirstLoadModal();
    resetStore();
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(useDiscourseStore.getState().doc!.relations.filter((r) => r.type === 'chiasm').length).toBe(4);
  });

  it('a normal (non-demo) range load of Ephesians 2:12–19 gets NO sample arcs', async () => {
    stubFetch();
    useDiscourseStore.setState({ sourceId: 'english-bsb', bookNum: 10, startRef: '2:12', endRef: '2:19', granularity: 'verse' });
    await useDiscourseStore.getState().loadRange();
    expect(useDiscourseStore.getState().doc!.relations.filter((r) => r.type === 'chiasm').length).toBe(0);
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(false);
  });
});

describe('first entry — modal vs auto-load ordering', () => {
  it('first ever entry opens the modal and does NOT auto-load the demo', async () => {
    const fetchFn = stubFetch();
    await useDiscourseStore.getState().enterDiscourseMode();
    const s = useDiscourseStore.getState();
    expect(s.firstLoadModalOpen).toBe(true);
    expect(s.doc).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('after the modal is dismissed, a later entry auto-loads the demo', async () => {
    stubFetch();
    dismissDiscourseFirstLoadModal();
    await useDiscourseStore.getState().enterDiscourseMode();
    const s = useDiscourseStore.getState();
    expect(s.firstLoadModalOpen).toBe(false);
    expect(s.isDefaultDemo).toBe(true);
    expect(s.doc?.sourceId).toBe('english-bsb');
  });

  it('an existing discourse document prevents the auto demo overwrite', async () => {
    stubFetch();
    dismissDiscourseFirstLoadModal();
    useDiscourseStore.getState().loadPlainText('The boy ran. The boy ran home.', 'Mine');
    const mine = useDiscourseStore.getState().doc;
    await useDiscourseStore.getState().enterDiscourseMode();
    expect(useDiscourseStore.getState().doc).toBe(mine);
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(false);
  });

  it('a hidden demo is never auto-restored, even after a simulated reload/PWA update', async () => {
    const fetchFn = stubFetch();
    dismissDiscourseFirstLoadModal();
    hideDefaultDemo();
    await useDiscourseStore.getState().enterDiscourseMode();
    expect(useDiscourseStore.getState().doc).toBeNull();
    resetStore();
    await useDiscourseStore.getState().enterDiscourseMode();
    expect(useDiscourseStore.getState().doc).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('removing / resetting the demo', () => {
  it('removeDefaultDemo clears the doc and sets the persistent hide flag', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(isDefaultDemoHidden()).toBe(false);
    useDiscourseStore.getState().removeDefaultDemo();
    const s = useDiscourseStore.getState();
    expect(s.doc).toBeNull();
    expect(s.isDefaultDemo).toBe(false);
    expect(isDefaultDemoHidden()).toBe(true);
  });

  it('a manual demo load works after hiding and does NOT clear the hide flag', async () => {
    stubFetch();
    hideDefaultDemo();
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(true);
    expect(useDiscourseStore.getState().doc?.sourceId).toBe('english-bsb');
    expect(isDefaultDemoHidden()).toBe(true);
  });

  it('removing the demo leaves unrelated discourse patches intact', async () => {
    stubFetch();
    useDiscourseStore.getState().loadPlainText('The boy ran. The boy ran home.', 'Mine');
    const mineId = useDiscourseStore.getState().baseDoc!.id;
    const mineFirst = leafUnits(useDiscourseStore.getState().doc!)[0]!;
    useDiscourseStore.getState().labelUnit(mineFirst.id, 'Keep');
    expect(localStorage.getItem(`kr:discourse:${mineId}`)).toBeTruthy();

    await useDiscourseStore.getState().loadDefaultDemo();
    const demoId = useDiscourseStore.getState().baseDoc!.id;
    useDiscourseStore.getState().removeDefaultDemo();

    expect(localStorage.getItem(`kr:discourse:${demoId}`)).toBeNull();
    expect(localStorage.getItem(`kr:discourse:${mineId}`)).toBeTruthy();
  });
});

describe('modal-dismissed and demo-hidden are separate preferences', () => {
  it('dismissing the modal does not hide the demo', () => {
    dismissDiscourseFirstLoadModal();
    expect(isDiscourseFirstLoadModalDismissed()).toBe(true);
    expect(isDefaultDemoHidden()).toBe(false);
  });

  it('hiding the demo does not dismiss the modal', () => {
    hideDefaultDemo();
    expect(isDefaultDemoHidden()).toBe(true);
    expect(isDiscourseFirstLoadModalDismissed()).toBe(false);
  });

  it('they use distinct storage keys', () => {
    dismissDiscourseFirstLoadModal();
    hideDefaultDemo();
    expect(localStorage.getItem('kr:discoursePref:firstLoadModalDismissed')).toBe('1');
    expect(localStorage.getItem(`kr:discoursePref:hideDefaultDemo:${DEFAULT_DEMO_ID}`)).toBe('1');
  });

  it('dismissFirstLoadModal action persists and closes the modal', () => {
    useDiscourseStore.setState({ firstLoadModalOpen: true });
    useDiscourseStore.getState().dismissFirstLoadModal();
    expect(useDiscourseStore.getState().firstLoadModalOpen).toBe(false);
    expect(isDiscourseFirstLoadModalDismissed()).toBe(true);
  });

  it('openFirstLoadModal reopens the guidance modal manually', () => {
    useDiscourseStore.getState().openFirstLoadModal();
    expect(useDiscourseStore.getState().firstLoadModalOpen).toBe(true);
  });

  it('requestNewText bumps the New-text signal without loading anything', () => {
    const before = useDiscourseStore.getState().newTextRequest;
    useDiscourseStore.getState().requestNewText();
    expect(useDiscourseStore.getState().newTextRequest).toBe(before + 1);
    expect(useDiscourseStore.getState().doc).toBeNull();
  });
});
