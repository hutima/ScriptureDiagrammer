import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore, useGuidedStore } from '@/state';
import { grammarHighlightGuides, getGuide } from '@/data/grammarHighlights';
import { guidedDocuments, getGuidedDocument } from '@/fixtures/guided';
import { layoutDocument } from '@/domain/layout';
import {
  resolveFocusIds,
  focusBounds,
  guidedHighlightMaps,
  usedHighlightKinds,
  GUIDED_HIGHLIGHT_COLORS,
} from '@/ui/guided/focus';

/**
 * Grammar Highlights (guided mode) — registry/bundle integrity, the pure
 * focus/highlight helpers over a REAL laid-out passage, and the guided store's
 * enter / navigate / leave state machine (including prior-view restore).
 */

describe('guided registry and bundle', () => {
  it('bundles every passage each guide references', () => {
    expect(grammarHighlightGuides.length).toBeGreaterThanOrEqual(1);
    for (const g of grammarHighlightGuides) {
      for (const pid of g.bundledPassageIds) {
        expect(guidedDocuments.some((d) => d.id === pid), `${g.id} → ${pid}`).toBe(true);
      }
      expect(g.sourceId).toBe('macula-greek-sblgnt-lowfat');
      expect(g.steps.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('references only real ids (focus, highlights, terms) — mirror of guided:check', () => {
    for (const g of grammarHighlightGuides) {
      const docs = g.bundledPassageIds
        .map((id) => guidedDocuments.find((d) => d.id === id))
        .filter((d): d is NonNullable<typeof d> => !!d);
      const tokenIds = new Set(docs.flatMap((d) => d.tokens.map((t) => t.id)));
      const nodeIds = new Set(docs.flatMap((d) => d.syntax.nodes.map((n) => n.id)));
      const relationIds = new Set(docs.flatMap((d) => d.syntax.relations.map((r) => r.id)));
      const termIds = new Set(g.greekTerms.map((t) => t.id));
      for (const t of g.greekTerms) expect(tokenIds.has(t.tokenId), `${g.id} term ${t.id}`).toBe(true);
      for (const s of g.steps) {
        for (const id of s.focus.tokenIds ?? []) expect(tokenIds.has(id), id).toBe(true);
        for (const id of s.focus.nodeIds ?? []) expect(nodeIds.has(id), id).toBe(true);
        for (const id of s.focus.relationIds ?? []) expect(relationIds.has(id), id).toBe(true);
        for (const m of s.body.matchAll(/\[\[([a-zA-Z0-9_-]+)\]\]/g)) {
          expect(termIds.has(m[1]!), `[[${m[1]}]]`).toBe(true);
        }
      }
    }
  });

  it('clones bundled documents on load (never hands out the bundle itself)', () => {
    const id = grammarHighlightGuides[0]!.bundledPassageIds[0]!;
    const a = getGuidedDocument(id)!;
    const b = getGuidedDocument(id)!;
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('guided focus helpers', () => {
  const guide = grammarHighlightGuides[0]!;
  const doc = getGuidedDocument(guide.bundledPassageIds[0]!)!;

  it('resolves token focus targets to the nodes carrying them', () => {
    const term = guide.greekTerms[0]!;
    const ids = resolveFocusIds(doc, {
      id: 's',
      title: 't',
      body: '',
      focus: { tokenIds: [term.tokenId] },
    });
    expect(ids.nodeIds.size).toBeGreaterThanOrEqual(1);
    for (const nid of ids.nodeIds) {
      const node = doc.syntax.nodes.find((n) => n.id === nid)!;
      expect(node.tokenIds).toContain(term.tokenId);
    }
  });

  it('computes a finite bounding box for a real step focus in the KR layout', () => {
    const layout = layoutDocument(doc, { mode: 'kellogg-reed' });
    for (const step of guide.steps) {
      const { nodeIds, relationIds } = resolveFocusIds(doc, step);
      const b = focusBounds(layout, nodeIds, relationIds);
      expect(b, step.id).not.toBeNull();
      expect(b!.x2).toBeGreaterThan(b!.x1);
      // The box must sit inside the diagram, not in outer space.
      expect(b!.x1).toBeGreaterThanOrEqual(-50);
      expect(b!.x2).toBeLessThanOrEqual(layout.width + 50);
    }
  });

  it('returns null bounds for unknown ids (a patched-away node degrades safely)', () => {
    const layout = layoutDocument(doc, { mode: 'kellogg-reed' });
    expect(focusBounds(layout, new Set(['nope']), new Set(['also-nope']))).toBeNull();
  });

  it('builds highlight maps with the guided diff colors', () => {
    const step = guide.steps[0]!;
    const { nodeFills } = guidedHighlightMaps(doc, step);
    expect(nodeFills.size).toBeGreaterThan(0);
    for (const c of nodeFills.values()) {
      expect(Object.values(GUIDED_HIGHLIGHT_COLORS)).toContain(c);
    }
    expect(usedHighlightKinds(step)).toContain('emphasized');
  });
});

describe('guided store', () => {
  beforeEach(() => {
    // Reset both stores to a known state.
    useGuidedStore.getState().leave();
    useEditorStore.getState().newDocument('en', 'Test');
    useEditorStore.getState().setAppMode('explore');
    useEditorStore.getState().setDiagramMode('phrase-block');
    useEditorStore.getState().setGlossMode(false);
    useEditorStore.getState().setSourceTextVersion('grc');
  });

  it('enter(greek) locks Explore + KR, loads the first guide, keeps Greek text', () => {
    useGuidedStore.getState().enter('greek');
    const g = useGuidedStore.getState();
    const e = useEditorStore.getState();
    expect(g.active).toBe(true);
    expect(g.selectedGuideId).toBe(grammarHighlightGuides[0]!.id);
    expect(e.appMode).toBe('explore');
    expect(e.diagramMode).toBe('kellogg-reed');
    expect(e.glossMode).toBe(false);
    expect(e.sourceTextVersion).toBe('grc');
    expect(e.doc.id).toBe(grammarHighlightGuides[0]!.bundledPassageIds[0]);
  });

  it('multi-passage guide steps load the passage the step names', () => {
    // The Lord's-Prayer comparison walks Matthew 6:11 then Luke 11:3: stepping
    // onto a Luke step must load the Luke sentence through the normal path,
    // and stepping back must return to Matthew.
    const guide = getGuide('guide-lords-prayer-bread')!;
    expect(guide.bundledPassageIds.length).toBeGreaterThanOrEqual(2);
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide(guide.id);
    expect(useEditorStore.getState().doc.id).toBe(guide.steps[0]!.passageId);
    const lukeIndex = guide.steps.findIndex((s) => s.passageId === 'sblgnt_luke_511');
    expect(lukeIndex).toBeGreaterThan(0);
    useGuidedStore.getState().setStep(lukeIndex);
    expect(useEditorStore.getState().doc.id).toBe('sblgnt_luke_511');
    useGuidedStore.getState().setStep(0);
    expect(useEditorStore.getState().doc.id).toBe('sblgnt_matthew_143');
  });

  it('every guide in the library opens and lays out in its default mode', () => {
    for (const g of grammarHighlightGuides) {
      useGuidedStore.getState().openGuide(g.id);
      const doc = useEditorStore.getState().doc;
      expect(
        g.steps[0]?.passageId ?? g.bundledPassageIds[0],
        g.id,
      ).toBe(doc.id);
      // The default lens lays the loaded passage out without throwing.
      expect(() => layoutDocument(doc, { mode: 'kellogg-reed' })).not.toThrow();
    }
  });

  it('enter(english) shows English aids but the parse stays the Greek syntax', () => {
    useGuidedStore.getState().enter('english');
    const e = useEditorStore.getState();
    expect(e.glossMode).toBe(true);
    expect(e.sourceTextVersion).toBe('en');
    // The loaded document is still the Greek parse — glossing is display-only.
    expect(e.doc.language).toBe('grc');
  });

  it('step navigation clamps and bumps the focus nonce once per change', () => {
    useGuidedStore.getState().enter('greek');
    const guide = getGuide(useGuidedStore.getState().selectedGuideId!)!;
    const n0 = useGuidedStore.getState().focusNonce;
    useGuidedStore.getState().nextStep();
    expect(useGuidedStore.getState().stepIndex).toBe(1);
    expect(useGuidedStore.getState().focusNonce).toBe(n0 + 1);
    useGuidedStore.getState().setStep(999);
    expect(useGuidedStore.getState().stepIndex).toBe(guide.steps.length - 1);
    useGuidedStore.getState().setStep(-5);
    expect(useGuidedStore.getState().stepIndex).toBe(0);
  });

  it('leave() restores the prior app/diagram/gloss/source-text state', () => {
    useEditorStore.getState().setDiagramMode('dependency-tree');
    useEditorStore.getState().setGlossMode(true);
    useEditorStore.getState().setSourceTextVersion('en');
    useGuidedStore.getState().enter('greek');
    expect(useEditorStore.getState().diagramMode).toBe('kellogg-reed');
    expect(useEditorStore.getState().glossMode).toBe(false);
    useGuidedStore.getState().leave();
    const e = useEditorStore.getState();
    expect(useGuidedStore.getState().active).toBe(false);
    expect(e.diagramMode).toBe('dependency-tree');
    expect(e.glossMode).toBe(true);
    expect(e.sourceTextVersion).toBe('en');
    expect(e.appMode).toBe('explore');
  });

  it('selecting a Greek term opens/clears the term panel state', () => {
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().selectGreekTerm('elalesen');
    expect(useGuidedStore.getState().selectedGreekTermId).toBe('elalesen');
    useGuidedStore.getState().nextStep();
    // A step change closes the term panel (fresh context).
    expect(useGuidedStore.getState().selectedGreekTermId).toBeNull();
  });
});
