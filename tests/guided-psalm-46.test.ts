import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { useEditorStore, useGuidedStore, useDiscourseStore } from '@/state';
import { leafUnits } from '@/domain/discourse';
import { getGuide } from '@/data/grammarHighlights';

/**
 * Psalm 46 guided discourse — the bundled BSB OT uses HEBREW versification
 * (46:1 = superscription), so the chiasm refs are shifted +1 and the closing
 * refrain lives at 46:12. This test loads the guide through the real pipeline
 * (BSB OT fetch mocked from the bundled JSON) and pins the mapping so a future
 * data/versification change can't silently mis-align the psalm again.
 */
describe('guided store — Psalm 46 discourse guide (BSB Hebrew versification)', () => {
  function stubFetch() {
    const psalms = JSON.parse(readFileSync('public/parallel/bsb/ot/19-psalms.json', 'utf8'));
    const fn = vi.fn(async (url: string) => {
      if (url.includes('19-psalms.json'))
        return { ok: true, status: 200, json: async () => psalms } as Response;
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

  it('registers guide-psalm-46 as a discourse guide', () => {
    const guide = getGuide('guide-psalm-46')!;
    expect(guide.kind).toBe('discourse');
    expect(guide.discourse!.ranges[0]!.endRef).toBe('46:12');
  });

  it('loads 46:1–46:12, keeps the superscription out of the chiasm, and seeds arcs/indents', async () => {
    stubFetch();
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-psalm-46');
    await vi.waitFor(() => {
      expect(useDiscourseStore.getState().status).toBe('loaded');
    });
    const s = useDiscourseStore.getState();
    const leaves = leafUnits(s.doc!);
    const byRef = new Map(leaves.map((u) => [u.refStart, u]));

    // The closing refrain (A′) at 46:12 is present — the old endRef 46:11 cut it.
    expect(byRef.has('46:12')).toBe(true);

    // Superscription (46:1): shown, labelled, and NOT part of the chiasm.
    const sup = byRef.get('46:1')!;
    expect(sup.label).toBe('Superscription — not part of the chiasm');
    expect(sup.color).toBeUndefined();
    // No arc touches the superscription unit.
    expect(
      s.doc!.relations.some((r) => r.sourceUnitId === sup.id || r.targetUnitId === sup.id),
    ).toBe(false);

    // Chiasm colours land on the shifted refs.
    expect(byRef.get('46:2')!.color).toBe('blue'); // A
    expect(byRef.get('46:12')!.color).toBe('blue'); // A′
    expect(byRef.get('46:11')!.color).toBe('green'); // B′
    expect(byRef.get('46:8')!.color).toBe('yellow'); // centre

    // Three chiasm arcs; the centre (46:8) has none.
    expect(s.doc!.relations.filter((r) => r.type === 'chiasm').length).toBe(3);

    // The seeded indent staircase applied (centre flush, deepest at 46:5).
    expect(byRef.get('46:1')!.userIndent ?? 0).toBe(0);
    expect(byRef.get('46:5')!.userIndent).toBe(3);
    expect(byRef.get('46:8')!.userIndent ?? 0).toBe(0);
  });
});
