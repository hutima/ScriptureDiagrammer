import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import { useEditorStore, useGuidedStore, useDiscourseStore } from '@/state';
import { leafUnits } from '@/domain/discourse';
import { getGuide } from '@/data/grammarHighlights';
import { GuidedStepCard } from '@/ui/guided/GuidedStepCard';

/**
 * Psalm 46 guided discourse — the bundled BSB OT uses HEBREW versification
 * (46:1 = superscription), so the stanza refs are shifted +1 and the second
 * refrain occurrence lives at 46:12. The guide follows Rolf A. Jacobson's
 * three-stanza (Selah-marked) reading — this test loads it through the real
 * pipeline (BSB OT fetch mocked from the bundled JSON) and pins both the
 * versification mapping and the Selah placement so a future data change can't
 * silently mis-align the psalm again.
 */
describe('guided store — Psalm 46 discourse guide (BSB Hebrew versification, three-stanza reading)', () => {
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
    cleanup();
    useGuidedStore.getState().leave();
    vi.unstubAllGlobals();
  });

  it('registers guide-psalm-46 as a discourse guide, citing the source article as a short hyperlink', () => {
    const guide = getGuide('guide-psalm-46')!;
    expect(guide.kind).toBe('discourse');
    expect(guide.discourse!.ranges[0]!.endRef).toBe('46:12');
    // The full citation lives in ONE `citations` entry (rendered as a real
    // hyperlink via its `[[id]]` marker) — the flowing prose only carries the
    // short marker, not the long bibliographic text.
    expect(guide.citations).toHaveLength(1);
    const cite = guide.citations![0]!;
    expect(cite.label).toBe('[1]');
    expect(cite.title).toContain('Jacobson');
    expect(cite.title).toContain('Word & World');
    // The direct PDF link, not the journal's issues.aspx page (which 404s
    // since Word & World's Nov-2023 site relaunch).
    expect(cite.url).toMatch(/^https:\/\/wordandworld\.luthersem\.edu\/wp-content\/uploads\/pdfs\/.*\.pdf$/);
    expect(cite.url).not.toContain('issues.aspx');
    // The devotional frame and the final step's caution both reference the
    // citation by marker (not by repeating the full text inline).
    expect(guide.devotionalFrame).toContain(`[[${cite.id}]]`);
    expect(guide.devotionalFrame).not.toContain('wordandworld.luthersem.edu');
    const lastStep = guide.steps[guide.steps.length - 1]!;
    expect(lastStep.caution).toContain(`[[${cite.id}]]`);
    expect(lastStep.caution).not.toContain('Word & World');
  });

  it('renders the citation marker as a real external hyperlink, not the in-app term-link button', () => {
    // Stubbed even though this test doesn't await the discourse load — opening
    // the guide fires it in the background, and an unstubbed fetch would leak
    // a real network call into whichever test runs next.
    stubFetch();
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-psalm-46');
    const guide = getGuide('guide-psalm-46')!;
    const cite = guide.citations![0]!;
    // Step 0 shows the devotional frame, which carries the marker.
    const { container } = render(createElement(GuidedStepCard));
    expect(container.textContent).not.toContain('[[');
    const link = container.querySelector<HTMLAnchorElement>('a.guided-citation-link');
    expect(link).toBeTruthy();
    expect(link!.textContent).toBe(cite.label);
    expect(link!.getAttribute('href')).toBe(cite.url);
    expect(link!.getAttribute('title')).toBe(cite.title);
    expect(link!.getAttribute('target')).toBe('_blank');
    expect(link!.getAttribute('rel')).toBe('noopener noreferrer');
    // It is a real link, not the tappable in-app term-link button.
    expect(container.querySelector('.guided-term-link')).toBeNull();
  });

  it('loads 46:1–46:12 as three Selah-marked stanzas, keeps the superscription out, and seeds the refrain arc', async () => {
    stubFetch();
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-psalm-46');
    await vi.waitFor(() => {
      expect(useDiscourseStore.getState().status).toBe('loaded');
    });
    const s = useDiscourseStore.getState();
    const leaves = leafUnits(s.doc!);
    const byRef = new Map(leaves.map((u) => [u.refStart, u]));

    // The refrain's SECOND occurrence at 46:12 is present — the pre-Jacobson
    // guide's endRef 46:11 used to cut it off.
    expect(byRef.has('46:12')).toBe(true);
    // Both refrain lines carry the actual bundled text, confirming the Selah
    // placement this guide's structure depends on.
    const tokenSurface = new Map(s.doc!.tokens.map((t) => [t.id, t.surface] as const));
    const textOf = (ref: string) =>
      byRef.get(ref)!.tokenIds.map((id) => tokenSurface.get(id)).join(' ');
    expect(textOf('46:4')).toMatch(/Selah/);
    expect(textOf('46:8')).toMatch(/Selah/);
    expect(textOf('46:12')).toMatch(/Selah/);

    // Superscription (46:1): shown, labelled, and NOT part of the stanza structure.
    const sup = byRef.get('46:1')!;
    expect(sup.label).toBe('Superscription — not part of the stanza structure');
    expect(sup.color).toBeUndefined();
    expect(
      s.doc!.relations.some((r) => r.sourceUnitId === sup.id || r.targetUnitId === sup.id),
    ).toBe(false);

    // Stanza labels land on each stanza's opening line.
    expect(byRef.get('46:2')!.label).toBe('Stanza 1');
    expect(byRef.get('46:5')!.label).toBe('Stanza 2');
    expect(byRef.get('46:9')!.label).toBe('Stanza 3');
    expect(byRef.get('46:8')!.label).toBe('Refrain');
    expect(byRef.get('46:12')!.label).toBe('Refrain (repeated)');

    // Each stanza is coloured as one block.
    expect(byRef.get('46:2')!.color).toBe('blue');
    expect(byRef.get('46:4')!.color).toBe('blue');
    expect(byRef.get('46:5')!.color).toBe('green');
    expect(byRef.get('46:8')!.color).toBe('green');
    expect(byRef.get('46:9')!.color).toBe('orange');
    expect(byRef.get('46:12')!.color).toBe('orange');

    // Exactly ONE arc — the verbatim refrain repetition, not an invented mirror.
    expect(s.doc!.relations.length).toBe(1);
    const arc = s.doc!.relations[0]!;
    expect(arc.type).toBe('parallel');
    expect(arc.sourceUnitId).toBe(byRef.get('46:8')!.id);
    expect(arc.targetUnitId).toBe(byRef.get('46:12')!.id);

    // Each stanza's opening line and closing Selah/refrain sit flush (0); the
    // interior lines step in one level.
    expect(byRef.get('46:1')!.userIndent ?? 0).toBe(0);
    expect(byRef.get('46:2')!.userIndent ?? 0).toBe(0);
    expect(byRef.get('46:3')!.userIndent).toBe(1);
    expect(byRef.get('46:5')!.userIndent ?? 0).toBe(0);
    expect(byRef.get('46:8')!.userIndent ?? 0).toBe(0);
    expect(byRef.get('46:9')!.userIndent ?? 0).toBe(0);
    expect(byRef.get('46:12')!.userIndent ?? 0).toBe(0);
  });
});
