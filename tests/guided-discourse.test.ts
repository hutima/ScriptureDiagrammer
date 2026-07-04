import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { useEditorStore, useGuidedStore, useDiscourseStore } from '@/state';
import { GrammarHighlightGuideSchema } from '@/domain/schema';
import {
  buildDiscourseDocumentFromPlainText,
  mergeDiscourseDocuments,
  leafUnits,
} from '@/domain/discourse';
import {
  isDiscourseFirstLoadModalDismissed,
  isDefaultDemoHidden,
} from '@/persistence';
import { getGuide, visibleGrammarHighlightGuides } from '@/data/grammarHighlights';

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
    // A guided visit never opens the first-load modal.
    expect(s.firstLoadModalOpen).toBe(false);
    // Leaving guided mode tears the hosted discourse doc down again.
    useGuidedStore.getState().leave();
    expect(useDiscourseStore.getState().guidedContext).toBe(false);
    expect(useDiscourseStore.getState().doc).toBeNull();
  });
});
