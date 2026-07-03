import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { leafUnits } from '@/domain/discourse';
import { DISCOURSE_SOURCES, discourseBooksFor, loadDiscourseRange } from '@/io';

/**
 * Part A1 — the combined `english-bsb-all` Discourse source spans all 66 books
 * with canonical numbering (OT 1-39 unchanged, NT 40-66 = gntNum + 39), while
 * `english-bsb` / `english-bsb-ot` stay valid loadable ids but are hidden from
 * the Discourse source SELECTOR in favor of the single combined entry.
 */

/** Serve bundled BSB parallel JSON (NT Ephesians, OT Genesis) through a mocked fetch. */
function stubFetch() {
  const ephesians = JSON.parse(readFileSync('public/parallel/bsb/10-ephesians.json', 'utf8'));
  const genesis = JSON.parse(readFileSync('public/parallel/bsb/ot/01-genesis.json', 'utf8'));
  const fn = vi.fn(async (url: string) => {
    if (url.includes('10-ephesians.json')) return { ok: true, status: 200, json: async () => ephesians } as Response;
    if (url.includes('01-genesis.json')) return { ok: true, status: 200, json: async () => genesis } as Response;
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('combined BSB Discourse source (english-bsb-all)', () => {
  it('lists all 66 books with canonical numbering (OT 1-39, NT 40-66)', () => {
    const books = discourseBooksFor('english-bsb-all');
    expect(books.length).toBe(66);
    const genesis = books.find((b) => b.num === 1)!;
    expect(genesis.name).toBe('Genesis');
    const matthew = books.find((b) => b.num === 40)!;
    expect(matthew.name).toBe('Matthew');
    const ephesians = books.find((b) => b.name === 'Ephesians')!;
    expect(ephesians.num).toBe(49); // 39 + 10
  });

  it('appears in DISCOURSE_SOURCES; the two split BSB ids do not', () => {
    const ids = DISCOURSE_SOURCES.map((s) => s.id);
    expect(ids).toContain('english-bsb-all');
    expect(ids).not.toContain('english-bsb');
    expect(ids).not.toContain('english-bsb-ot');
  });

  it('loading bookNum 49 through the combined source resolves to NT Ephesians', async () => {
    stubFetch();
    const doc = await loadDiscourseRange({
      sourceId: 'english-bsb-all',
      bookNum: 49,
      startRef: '2:12',
      endRef: '2:14',
      granularity: 'verse',
    });
    expect(doc.language).toBe('en');
    expect(leafUnits(doc).map((u) => u.refStart)).toEqual(['2:12', '2:13', '2:14']);
    expect(doc.title.toLowerCase()).toContain('ephesians');
  });

  it('loading bookNum 1 (Genesis) through the combined source resolves to OT data', async () => {
    stubFetch();
    const doc = await loadDiscourseRange({
      sourceId: 'english-bsb-all',
      bookNum: 1,
      startRef: '1:1',
      endRef: '1:2',
      granularity: 'verse',
    });
    expect(doc.language).toBe('en');
    expect(leafUnits(doc).map((u) => u.refStart)).toEqual(['1:1', '1:2']);
  });
});
