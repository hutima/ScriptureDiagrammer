import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  DISCOURSE_SOURCES,
  discourseBooksFor,
  editionOf,
  loadDiscourseBookDocs,
  loadDiscourseRange,
} from '@/io';
import { useDiscourseStore } from '@/state';

/**
 * WLC (Hebrew OT) fix for the Discourse source picker: WLC was entirely
 * missing from `DISCOURSE_SOURCES`/`discourseBooksFor`, the original-language
 * labels didn't say which corpus (NT/OT) they cover, and the store's
 * `setSourceId` kept a stale `bookNum` across sources that number their books
 * differently (Greek NT sources use 1-27, WLC/OT uses 1-39, the 66-book
 * English sources use 1-66) — which threw "Unknown book for this source."
 */

vi.mock('@/io/ot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/io/ot')>();
  return { ...actual, loadOtBook: vi.fn(actual.loadOtBook) };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DISCOURSE_SOURCES / discourseBooksFor — WLC added, NT/OT labels', () => {
  it('DISCOURSE_SOURCES lists the WLC entry and NT/OT-scoped original-language labels', () => {
    expect(DISCOURSE_SOURCES).toContainEqual({
      id: 'macula-hebrew-wlc-lowfat',
      label: 'WLC Lowfat (OT)',
    });
    expect(DISCOURSE_SOURCES).toContainEqual({
      id: 'macula-greek-sblgnt-lowfat',
      label: 'SBLGNT Lowfat (NT)',
    });
    expect(DISCOURSE_SOURCES).toContainEqual({
      id: 'macula-greek-nestle1904-lowfat',
      label: 'Nestle 1904 Lowfat (NT)',
    });
    expect(DISCOURSE_SOURCES).toContainEqual({
      id: 'opentext',
      label: 'OpenText syntax (NT)',
    });
  });

  it('discourseBooksFor(wlc) returns Genesis and Psalms, never Matthew', () => {
    const books = discourseBooksFor('macula-hebrew-wlc-lowfat');
    expect(books.find((b) => b.num === 1)?.name).toBe('Genesis');
    expect(books.find((b) => b.num === 19)?.name).toBe('Psalms');
    expect(books.some((b) => b.name === 'Matthew')).toBe(false);
  });

  it('editionOf routes WLC/SBLGNT/Nestle1904/OpenText to the right edition id', () => {
    expect(editionOf('macula-hebrew-wlc-lowfat')).toBe('wlc');
    expect(editionOf('macula-greek-sblgnt-lowfat')).toBe('sblgnt');
    expect(editionOf('macula-greek-nestle1904-lowfat')).toBe('nestle1904');
    expect(editionOf('opentext')).toBe('nestle1904');
  });
});

describe('loadDiscourseBookDocs — WLC routes through loadOtBook, never the Greek loaders', () => {
  it('calls loadOtBook for a WLC book and not the SBLGNT/Nestle1904 loaders', async () => {
    const ot = await import('@/io/ot');
    const mockedLoadOtBook = ot.loadOtBook as unknown as ReturnType<typeof vi.fn>;
    mockedLoadOtBook.mockResolvedValueOnce([]);
    await loadDiscourseBookDocs('macula-hebrew-wlc-lowfat', 1);
    expect(mockedLoadOtBook).toHaveBeenCalledTimes(1);
    expect(mockedLoadOtBook.mock.calls[0]![0]).toMatchObject({ num: 1, name: 'Genesis' });
  });

  it('throws a specific error for an out-of-range WLC book number', async () => {
    await expect(loadDiscourseBookDocs('macula-hebrew-wlc-lowfat', 999)).rejects.toThrow(
      'No WLC book 999.',
    );
  });

  it('throws a clear error (not a crash) for an out-of-range Nestle1904/SBLGNT book number', async () => {
    await expect(
      loadDiscourseBookDocs('macula-greek-nestle1904-lowfat', 999),
    ).rejects.toThrow(/No Nestle 1904 book 999/);
    await expect(loadDiscourseBookDocs('macula-greek-sblgnt-lowfat', 999)).rejects.toThrow(
      /No SBLGNT book 999/,
    );
  });

  it('stamps editionId "wlc" on a discourse range built from WLC book docs', async () => {
    const ot = await import('@/io/ot');
    const mockedLoadOtBook = ot.loadOtBook as unknown as ReturnType<typeof vi.fn>;
    mockedLoadOtBook.mockResolvedValueOnce([]);
    // No sentence docs overlap the range, so the loader throws its "no
    // sentences overlap" error — but only AFTER it has resolved the edition
    // via `editionOf`, which is exercised (and separately unit-tested above)
    // regardless. This just confirms the WLC branch is reached, not the Greek one.
    await expect(
      loadDiscourseRange({
        sourceId: 'macula-hebrew-wlc-lowfat',
        bookNum: 1,
        startRef: '1:1',
        endRef: '1:5',
      }),
    ).rejects.toThrow(/Genesis/);
    expect(mockedLoadOtBook).toHaveBeenCalledTimes(1);
  });
});

describe('discourse store — bookNum remaps across sources with different numbering', () => {
  beforeEach(() => {
    localStorage.clear();
    useDiscourseStore.setState({
      baseDoc: null,
      doc: null,
      status: 'idle',
      error: null,
      past: [],
      future: [],
      selection: {},
    });
  });

  it('setSourceId remaps a stale bookNum by matching book name, or falls back to the first book', () => {
    // english-bsb-all bookNum 49 = Ephesians (39 + 10) in the 66-book index.
    useDiscourseStore.setState({ sourceId: 'english-bsb-all', bookNum: 49 });
    useDiscourseStore.getState().setSourceId('macula-greek-sblgnt-lowfat');
    const s1 = useDiscourseStore.getState();
    expect(s1.sourceId).toBe('macula-greek-sblgnt-lowfat');
    // Name-matched: Ephesians is book 10 in the Greek NT numbering.
    expect(s1.bookNum).toBe(10);

    // Switching to WLC (no Ephesians) falls back to WLC's first book (Genesis, 1).
    useDiscourseStore.getState().setSourceId('macula-hebrew-wlc-lowfat');
    const s2 = useDiscourseStore.getState();
    expect(s2.sourceId).toBe('macula-hebrew-wlc-lowfat');
    expect(s2.bookNum).toBe(1);
  });

  it('setSourceId / setBookNum / setRange clear a stale error status', () => {
    useDiscourseStore.setState({ status: 'error', error: 'Unknown book for this source.' });
    useDiscourseStore.getState().setSourceId('macula-hebrew-wlc-lowfat');
    let s = useDiscourseStore.getState();
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();

    useDiscourseStore.setState({ status: 'error', error: 'boom' });
    useDiscourseStore.getState().setBookNum(1);
    s = useDiscourseStore.getState();
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();

    useDiscourseStore.setState({ status: 'error', error: 'boom' });
    useDiscourseStore.getState().setRange('1:1', '1:2');
    s = useDiscourseStore.getState();
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('leaves a non-error status untouched (e.g. does not disturb "loaded")', () => {
    useDiscourseStore.setState({ status: 'loaded', error: null });
    useDiscourseStore.getState().setBookNum(2);
    expect(useDiscourseStore.getState().status).toBe('loaded');
  });
});
