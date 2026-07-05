import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { useEditorStore, useGuidedStore, useDiscourseStore } from '@/state';
import { GrammarHighlightGuideSchema } from '@/domain/schema';
import {
  buildDiscourseDocumentFromPlainText,
  mergeDiscourseDocuments,
  leafUnits,
  discourseOutlineHtml,
  discourseOutlineSvg,
} from '@/domain/discourse';
import {
  isDiscourseFirstLoadModalDismissed,
  isDefaultDemoHidden,
} from '@/persistence';
import { getGuide, visibleGrammarHighlightGuides } from '@/data/grammarHighlights';
import { ASV_URL, clearRemoteEnglishCache } from '@/io';
import { UNIT_COLOR_HEX } from '@/domain/discourse/export';

/**
 * Section E — discourse-backed guided examples: the schema extension, the
 * two-source merge, the guided-context modal suppression, and the end-to-end
 * guided open of the Ephesians BSB discourse guide (fetch mocked from bundled
 * BSB JSON, exactly like the default-demo test).
 */

describe('guided schema — kind: discourse', () => {
  it('accepts a discourse-backed guide with a range spec and no bundled passages', () => {
    const parsed = GrammarHighlightGuideSchema.safeParse({
      id: 'g',
      kind: 'discourse',
      title: 't',
      reference: 'r',
      difficulty: 'intermediate',
      summary: 's',
      discourse: {
        ranges: [{ sourceId: 'english-bsb', bookNum: 10, startRef: '2:12', endRef: '2:19' }],
      },
      steps: [{ id: 's1', title: 'a', body: 'b' }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // granularity defaults to 'verse' inside the range.
      expect(parsed.data.discourse!.ranges[0]!.granularity).toBe('verse');
      expect(parsed.data.bundledPassageIds).toEqual([]);
    }
  });

  it('accepts seededHighlights and rejects an unknown color', () => {
    const base = {
      id: 'g',
      kind: 'discourse' as const,
      title: 't',
      reference: 'r',
      difficulty: 'intermediate' as const,
      summary: 's',
      discourse: {
        ranges: [{ sourceId: 'english-bsb', bookNum: 10, startRef: '2:12', endRef: '2:19' }],
      },
      steps: [{ id: 's1', title: 'a', body: 'b' }],
    };
    const ok = GrammarHighlightGuideSchema.safeParse({
      ...base,
      discourse: {
        ...base.discourse,
        seededHighlights: [{ refs: ['2:12', '2:19'], color: 'blue' }],
      },
    });
    expect(ok.success).toBe(true);

    const bad = GrammarHighlightGuideSchema.safeParse({
      ...base,
      discourse: {
        ...base.discourse,
        seededHighlights: [{ refs: ['2:12'], color: 'chartreuse' }],
      },
    });
    expect(bad.success).toBe(false);
  });

  it('rejects a discourse guide with no discourse spec', () => {
    const parsed = GrammarHighlightGuideSchema.safeParse({
      id: 'g',
      kind: 'discourse',
      title: 't',
      reference: 'r',
      difficulty: 'intermediate',
      summary: 's',
      steps: [{ id: 's1', title: 'a', body: 'b' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('still requires sourceId + bundled passages for a syntax guide', () => {
    const parsed = GrammarHighlightGuideSchema.safeParse({
      id: 'g',
      title: 't',
      reference: 'r',
      difficulty: 'intermediate',
      summary: 's',
      steps: [{ id: 's1', title: 'a', body: 'b', panZoom: { fit: 'whole-diagram' } }],
    });
    expect(parsed.success).toBe(false); // no sourceId / bundledPassageIds
  });
});

describe('mergeDiscourseDocuments — two independent passages, no alignment', () => {
  it('concatenates units, tokens, and markers of both parts', () => {
    const a = buildDiscourseDocumentFromPlainText('Alpha beta gamma.', { title: 'A' })!;
    const b = buildDiscourseDocumentFromPlainText('Delta epsilon zeta.', { title: 'B' })!;
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    const merged = mergeDiscourseDocuments([a, b], { id: 'combined', title: 'A + B' });
    expect(merged.id).toBe('combined');
    expect(merged.tokens.length).toBe(a.tokens.length + b.tokens.length);
    // Every source unit survives (ids are unique across the two parts).
    for (const u of [...a.units, ...b.units]) {
      expect(merged.units.some((m) => m.id === u.id), u.id).toBe(true);
    }
    // Root-level order is re-sequenced without collisions.
    const rootOrders = merged.units.filter((u) => !u.parentId).map((u) => u.order);
    expect(new Set(rootOrders).size).toBe(rootOrders.length);
  });
});

describe('discourse store — guided context suppresses the first-load modal', () => {
  beforeEach(() => {
    useDiscourseStore.setState({
      baseDoc: null,
      doc: null,
      status: 'idle',
      error: null,
      guidedContext: false,
      firstLoadModalOpen: false,
    });
  });

  it('enterDiscourseMode is a no-op while guidedContext is set (no modal, no demo)', async () => {
    useDiscourseStore.setState({ guidedContext: true });
    await useDiscourseStore.getState().enterDiscourseMode();
    expect(useDiscourseStore.getState().firstLoadModalOpen).toBe(false);
    expect(useDiscourseStore.getState().doc).toBeNull();
    // A guided visit must never mark the modal seen / hide the demo.
    expect(isDiscourseFirstLoadModalDismissed()).toBe(false);
    expect(isDefaultDemoHidden()).toBe(false);
  });

  it('exitGuidedDiscourse clears the hosted doc and the flag', () => {
    useDiscourseStore.setState({
      guidedContext: true,
      doc: { id: 'x' } as never,
      baseDoc: { id: 'x' } as never,
      status: 'loaded',
    });
    useDiscourseStore.getState().exitGuidedDiscourse();
    const s = useDiscourseStore.getState();
    expect(s.guidedContext).toBe(false);
    expect(s.doc).toBeNull();
    expect(s.status).toBe('idle');
  });
});

describe('guided store — opening a discourse guide hosts the Discourse view', () => {
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

  beforeEach(() => {
    useGuidedStore.getState().leave();
    useDiscourseStore.getState().exitGuidedDiscourse();
    useEditorStore.getState().newDocument('en', 'Test');
    useEditorStore.getState().setDiagramMode('kellogg-reed');
  });
  afterEach(() => {
    useGuidedStore.getState().leave();
    vi.unstubAllGlobals();
  });

  it('registers Ephesians 2:12–19 as a visible discourse guide', () => {
    const guide = getGuide('guide-ephesians-2-12-19')!;
    expect(guide.kind).toBe('discourse');
    expect(guide.topics).toEqual(['reconciliation', 'discourse']);
    expect(visibleGrammarHighlightGuides.some((g) => g.id === guide.id)).toBe(true);
  });

  it('openGuide loads the BSB range, mounts the Discourse view, and seeds sample arcs', async () => {
    stubFetch();
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-ephesians-2-12-19');
    // The editor's diagram mode switches to Discourse so DiscourseCanvas mounts.
    expect(useEditorStore.getState().diagramMode).toBe('discourse');
    // Wait for the async guided-discourse load to publish.
    await vi.waitFor(() => {
      expect(useDiscourseStore.getState().status).toBe('loaded');
    });
    const s = useDiscourseStore.getState();
    expect(s.guidedContext).toBe(true);
    expect(s.doc).toBeTruthy();
    expect(s.doc!.language).toBe('en');
    // Eight verses 2:12–2:19 became leaf units.
    const refs = new Set(leafUnits(s.doc!).map((u) => u.refStart));
    expect(refs.has('2:12')).toBe(true);
    expect(refs.has('2:19')).toBe(true);
    // The four sample chiasm arcs were seeded.
    expect(s.doc!.relations.filter((r) => r.type === 'chiasm').length).toBe(4);
    // The four sample highlights were seeded alongside the arcs, coordinated
    // with them (same pairs, distinct colors).
    const unitByRef = new Map(leafUnits(s.doc!).map((u) => [u.refStart, u]));
    expect(unitByRef.get('2:12')!.color).toBe('blue');
    expect(unitByRef.get('2:19')!.color).toBe('blue');
    expect(unitByRef.get('2:15')!.color).toBe('purple');
    expect(unitByRef.get('2:16')!.color).toBe('purple');
    // Canvas + exports share the ONE rendering authority (`unit.color` +
    // `UNIT_COLOR_HEX`): both the printable HTML outline and the SVG outline
    // (which also backs the print/PDF surface) reflect the same seeded colors.
    const html = discourseOutlineHtml(s.doc!);
    expect(html).toContain(UNIT_COLOR_HEX.blue);
    const svg = discourseOutlineSvg(s.doc!);
    expect(svg).toContain(UNIT_COLOR_HEX.blue);
    expect(svg).toContain(UNIT_COLOR_HEX.purple);
    // A guided visit never opens the first-load modal.
    expect(s.firstLoadModalOpen).toBe(false);
    // Leaving guided mode tears the hosted discourse doc down again.
    useGuidedStore.getState().leave();
    expect(useDiscourseStore.getState().guidedContext).toBe(false);
    expect(useDiscourseStore.getState().doc).toBeNull();
  });
});

/**
 * Section F — the Acts 2:39 discourse guide: ASV (remote) primary sources with
 * a bundled-BSB fallback per range (`GuidedDiscourseRange.fallback`), and the
 * `guidedNotice` surfaced when a fallback had to be used. All fetches are
 * mocked; no live network.
 */
describe('guided store — Acts 2:39 guide loads ASV with a bundled-BSB fallback', () => {
  function asvBible() {
    const books = Array.from({ length: 66 }, (_, i) => ({
      name: `B${i + 1}`,
      chapters: [] as { chapter: number; verses: { verse: number; text: string }[] }[],
    }));
    // Acts = book 44 (66-book canonical numbering).
    books[43] = {
      name: 'Acts',
      chapters: [
        {
          chapter: 2,
          verses: [
            {
              verse: 38,
              text:
                'And Peter said unto them, Repent ye, and be baptized every one of you in the name of Jesus Christ unto the remission of your sins; and ye shall receive the gift of the Holy Spirit.',
            },
            {
              verse: 39,
              text:
                'For to you is the promise, and to your children, and to all that are afar off, even as many as the Lord our God shall call unto him.',
            },
          ],
        },
      ],
    };
    // Genesis = book 1.
    books[0] = {
      name: 'Genesis',
      chapters: [
        {
          chapter: 17,
          verses: [
            {
              verse: 12,
              text:
                'And he that is eight days old shall be circumcised among you, every male throughout your generations, he that is born in the house, or bought with money of any stranger, that is not of thy seed.',
            },
          ],
        },
      ],
    };
    return { translation: 'ASV', books };
  }

  function stubAsvSuccess() {
    const acts = JSON.parse(readFileSync('public/parallel/bsb/05-acts.json', 'utf8'));
    const genesis = JSON.parse(readFileSync('public/parallel/bsb/ot/01-genesis.json', 'utf8'));
    const fn = vi.fn(async (url: string) => {
      if (url === ASV_URL) return { ok: true, status: 200, json: async () => asvBible() } as Response;
      if (url.includes('05-acts.json')) return { ok: true, status: 200, json: async () => acts } as Response;
      if (url.includes('01-genesis.json')) return { ok: true, status: 200, json: async () => genesis } as Response;
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  function stubAsvFailureBsbFallback() {
    const acts = JSON.parse(readFileSync('public/parallel/bsb/05-acts.json', 'utf8'));
    const genesis = JSON.parse(readFileSync('public/parallel/bsb/ot/01-genesis.json', 'utf8'));
    const fn = vi.fn(async (url: string) => {
      if (url === ASV_URL) return { ok: false, status: 503, json: async () => ({}) } as Response;
      if (url.includes('05-acts.json')) return { ok: true, status: 200, json: async () => acts } as Response;
      if (url.includes('01-genesis.json')) return { ok: true, status: 200, json: async () => genesis } as Response;
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  beforeEach(() => {
    clearRemoteEnglishCache();
    useGuidedStore.getState().leave();
    useDiscourseStore.getState().exitGuidedDiscourse();
    useEditorStore.getState().newDocument('en', 'Test');
    useEditorStore.getState().setDiagramMode('kellogg-reed');
  });
  afterEach(() => {
    useGuidedStore.getState().leave();
    vi.unstubAllGlobals();
  });

  it('registers guide-acts-2-39 as a visible (non-hidden) discourse guide', () => {
    const guide = getGuide('guide-acts-2-39')!;
    expect(guide.kind).toBe('discourse');
    expect(visibleGrammarHighlightGuides.some((g) => g.id === guide.id)).toBe(true);
  });

  it('loads the ASV range for both verses, splits them into phrase units, and seeds four parallel arcs', async () => {
    stubAsvSuccess();
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-acts-2-39');
    await vi.waitFor(() => {
      expect(useDiscourseStore.getState().status).toBe('loaded');
    });
    const s = useDiscourseStore.getState();
    expect(s.doc!.language).toBe('en');
    const leaves = leafUnits(s.doc!);
    const refs = new Set(leaves.map((u) => u.refStart));
    expect(refs.has('2:38')).toBe(true);
    expect(refs.has('2:39')).toBe(true);
    expect(refs.has('17:12')).toBe(true);
    // seededSplits broke each verse into its expected number of phrase units.
    const countOf = (ref: string) => leaves.filter((u) => u.refStart === ref).length;
    expect(countOf('2:38')).toBe(3);
    expect(countOf('2:39')).toBe(4);
    expect(countOf('17:12')).toBe(4);
    // The four seeded arcs are all 'parallel'.
    expect(s.doc!.relations.filter((r) => r.type === 'parallel').length).toBe(4);
    expect(s.guidedNotice).toBeNull();
    // The second '2:39' unit's tokens start with "and to your children".
    const unitsByRef = new Map<string, typeof leaves>();
    for (const u of leaves) unitsByRef.set(u.refStart, [...(unitsByRef.get(u.refStart) ?? []), u]);
    const tokenSurface = new Map(s.doc!.tokens.map((t) => [t.id, t.surface] as const));
    const surfacesOf = (u: (typeof leaves)[number]) => u.tokenIds.map((id) => tokenSurface.get(id));
    const acts239Units = unitsByRef.get('2:39')!;
    expect(surfacesOf(acts239Units[1]!).slice(0, 3).join(' ').toLowerCase()).toBe('and to your');
    // The four color-coded pairs: 2:38/2 ↔ 17:12/1 (purple, the sign), and
    // within 17:12, unit order is: /1 purple, /2 blue, /3 green, /4 orange.
    const acts238Units = unitsByRef.get('2:38')!;
    const gen1712Units = unitsByRef.get('17:12')!;
    expect(acts238Units[1]!.color).toBe('purple');
    expect(gen1712Units[0]!.color).toBe('purple');
    expect(gen1712Units[1]!.color).toBe('blue');
    expect(gen1712Units[2]!.color).toBe('green');
    expect(gen1712Units[3]!.color).toBe('orange');
    expect(acts239Units[0]!.color).toBe('blue');
    expect(acts239Units[1]!.color).toBe('green');
    expect(acts239Units[2]!.color).toBe('orange');
  });

  it('falls back to bundled BSB when the ASV fetch fails, and surfaces a notice', async () => {
    stubAsvFailureBsbFallback();
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-acts-2-39');
    await vi.waitFor(() => {
      expect(useDiscourseStore.getState().status).toBe('loaded');
    });
    const s = useDiscourseStore.getState();
    expect(s.doc!.language).toBe('en');
    const leaves = leafUnits(s.doc!);
    const refs = new Set(leaves.map((u) => u.refStart));
    expect(refs.has('2:38')).toBe(true);
    expect(refs.has('2:39')).toBe(true);
    expect(refs.has('17:12')).toBe(true);
    expect(s.guidedNotice).toBeTruthy();
    expect(s.guidedNotice).toMatch(/ASV/);
    expect(s.guidedNotice).toMatch(/BSB/);
    // It never throws even though Genesis 17:12's BSB clause order matches
    // none of the seeded split candidates — that verse just degrades to one
    // whole-verse unit. At least the 2:38 "and be baptized" split matched the
    // BSB wording too, so it produced ≥2 units.
    expect(leaves.filter((u) => u.refStart === '2:38').length).toBeGreaterThanOrEqual(2);
  });

  it('surfaces a readable error when both the ASV and bundled BSB fetches fail', async () => {
    // Runs against a FRESH module registry (its own empty in-memory caches, in
    // both parallel.ts and english-bible-remote.ts) so it is independent of
    // whatever the two tests above already cached for the same books.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }) as Response),
    );
    vi.resetModules();
    const fresh = await import('@/state');
    fresh.useGuidedStore.getState().enter('greek');
    fresh.useGuidedStore.getState().openGuide('guide-acts-2-39');
    await vi.waitFor(() => {
      expect(fresh.useDiscourseStore.getState().status).toBe('error');
    });
    const s = fresh.useDiscourseStore.getState();
    expect(s.error).toBeTruthy();
    expect(s.error!.length).toBeGreaterThan(0);
    expect(s.guidedNotice).toBeNull();
  });
});
