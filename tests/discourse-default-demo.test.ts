import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDiscourseStore } from '@/state';
import { ASV_URL, clearRemoteEnglishCache } from '@/io';
import { leafUnits } from '@/domain/discourse';
import {
  DEFAULT_DEMO_ID,
  dismissDiscourseFirstLoadModal,
  hideDefaultDemo,
  isDefaultDemoHidden,
  isDiscourseFirstLoadModalDismissed,
} from '@/persistence';

/**
 * Phase 5/7/8 — the default Ephesians 2:12–19 demo, the first-load guidance
 * modal, and their ordering. Fetch is always mocked (no live network). The
 * modal-dismissed flag and the demo-hidden flag are asserted to be SEPARATE
 * persisted preferences.
 */

/** A KJV Ephesians book stub whose chapter 2 covers verses 12–19. */
function kjvEphesiansJson() {
  const verses = [];
  for (let v = 10; v <= 22; v++) {
    verses.push({ verse: String(v), text: `Ephesians two verse ${v} text here.` });
  }
  return { book: 'Ephesians', chapters: [{ chapter: '2', verses }] };
}

function stubFetch() {
  const fn = vi.fn(async (url: string) => {
    if (url === ASV_URL)
      return { ok: true, status: 200, json: async () => ({ translation: 'ASV', books: [] }) } as Response;
    if (url.includes('aruljohn'))
      return { ok: true, status: 200, json: async () => kjvEphesiansJson() } as Response;
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

beforeEach(() => {
  localStorage.clear();
  clearRemoteEnglishCache();
  resetStore();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('default demo — loading & identity', () => {
  it('loadDefaultDemo loads Ephesians 2:12–19 from KJV and stamps the demo flag', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    const s = useDiscourseStore.getState();
    expect(s.status).toBe('loaded');
    expect(s.isDefaultDemo).toBe(true);
    expect(s.doc?.sourceId).toBe('english-kjv');
    expect(s.doc?.language).toBe('en');
    // Verses outside 12–19 are discarded.
    expect(leafUnits(s.doc!).map((u) => u.refStart)).toEqual(
      ['2:12', '2:13', '2:14', '2:15', '2:16', '2:17', '2:18', '2:19'],
    );
  });

  it('is idempotent — re-loading the already-loaded demo does not refetch', async () => {
    const fetchFn = stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    const callsAfterFirst = fetchFn.mock.calls.length;
    const docRef = useDiscourseStore.getState().doc;
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(useDiscourseStore.getState().doc).toBe(docRef); // no reload
    expect(fetchFn.mock.calls.length).toBe(callsAfterFirst);
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(true);
  });

  it('a user range load clears the demo stamp', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(true);
    // Load a different KJV range (still English, but not the demo signature).
    useDiscourseStore.getState().setRange('2:15', '2:17');
    await useDiscourseStore.getState().loadRange();
    expect(useDiscourseStore.getState().status).toBe('loaded');
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
    expect(s.doc?.sourceId).toBe('english-kjv');
  });

  it('an existing discourse document prevents the auto demo overwrite', async () => {
    stubFetch();
    dismissDiscourseFirstLoadModal();
    // Load the user's own plaintext first.
    useDiscourseStore.getState().loadPlainText('The boy ran. The boy ran home.', 'Mine');
    const mine = useDiscourseStore.getState().doc;
    await useDiscourseStore.getState().enterDiscourseMode();
    // Untouched — the demo never overwrote it.
    expect(useDiscourseStore.getState().doc).toBe(mine);
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(false);
  });

  it('a hidden demo is never auto-restored, even after a simulated reload/PWA update', async () => {
    const fetchFn = stubFetch();
    dismissDiscourseFirstLoadModal();
    hideDefaultDemo();
    await useDiscourseStore.getState().enterDiscourseMode();
    expect(useDiscourseStore.getState().doc).toBeNull();
    // Simulate a fresh mount (PWA update keeps localStorage): still hidden.
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

  it('resetting demo edits does NOT set the hide flag', async () => {
    stubFetch();
    await useDiscourseStore.getState().loadDefaultDemo();
    const first = leafUnits(useDiscourseStore.getState().doc!)[0]!;
    useDiscourseStore.getState().labelUnit(first.id, 'A');
    useDiscourseStore.getState().resetEdits();
    expect(useDiscourseStore.getState().doc!.units.find((u) => u.id === first.id)?.label).toBeUndefined();
    expect(isDefaultDemoHidden()).toBe(false);
  });

  it('a manual demo load works after hiding and does NOT clear the hide flag', async () => {
    stubFetch();
    hideDefaultDemo();
    await useDiscourseStore.getState().loadDefaultDemo();
    expect(useDiscourseStore.getState().isDefaultDemo).toBe(true);
    expect(useDiscourseStore.getState().doc?.sourceId).toBe('english-kjv');
    // Manual load leaves the hide flag intact (only "Restore" would clear it).
    expect(isDefaultDemoHidden()).toBe(true);
  });

  it('removing the demo leaves unrelated discourse patches intact', async () => {
    stubFetch();
    // 1. A user's own plaintext doc with an edit → its own patch key.
    useDiscourseStore.getState().loadPlainText('The boy ran. The boy ran home.', 'Mine');
    const mineId = useDiscourseStore.getState().baseDoc!.id;
    const mineFirst = leafUnits(useDiscourseStore.getState().doc!)[0]!;
    useDiscourseStore.getState().labelUnit(mineFirst.id, 'Keep');
    expect(localStorage.getItem(`kr:discourse:${mineId}`)).toBeTruthy();

    // 2. Load + edit the demo, then remove it.
    await useDiscourseStore.getState().loadDefaultDemo();
    const demoId = useDiscourseStore.getState().baseDoc!.id;
    const demoFirst = leafUnits(useDiscourseStore.getState().doc!)[0]!;
    useDiscourseStore.getState().labelUnit(demoFirst.id, 'Demo');
    useDiscourseStore.getState().removeDefaultDemo();

    // The demo's own patch is gone; the unrelated plaintext patch survives.
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
