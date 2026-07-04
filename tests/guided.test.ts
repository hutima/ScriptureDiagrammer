import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore, useGuidedStore } from '@/state';
import {
  grammarHighlightGuides,
  visibleGrammarHighlightGuides,
  getGuide,
  guideDisplayDoc,
} from '@/data/grammarHighlights';
import { guidedDocuments, getGuidedDocument } from '@/fixtures/guided';
import { getIssueById, getAlternateReadings } from '@/domain/contested';
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
      expect(g.steps.length).toBeGreaterThanOrEqual(1);
      // Discourse-backed guides host verse ranges (no bundled syntax passage).
      if (g.kind === 'discourse') {
        expect((g.discourse?.ranges.length ?? 0), g.id).toBeGreaterThanOrEqual(1);
        continue;
      }
      for (const pid of g.bundledPassageIds) {
        expect(guidedDocuments.some((d) => d.id === pid), `${g.id} → ${pid}`).toBe(true);
      }
      expect(g.sourceId).toBe('macula-greek-sblgnt-lowfat');
    }
  });

  it('references only real ids (focus, highlights, terms) — mirror of guided:check', () => {
    for (const g of grammarHighlightGuides) {
      if (g.kind === 'discourse') continue; // no syntax ids to validate
      const docs = g.bundledPassageIds
        .map((id) => guidedDocuments.find((d) => d.id === id))
        .filter((d): d is NonNullable<typeof d> => !!d)
        // A guide teaching a construal re-draws its base through an alternate
        // reading; validate step ids against what it DISPLAYS (mirror guided:check).
        .map((d) => guideDisplayDoc(g, d));
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

  it('every step contested reference resolves to a real issue that applies to its passage', () => {
    for (const g of grammarHighlightGuides) {
      for (const s of g.steps) {
        if (!s.contested) continue;
        const issue = getIssueById(s.contested.issueId);
        expect(issue, `${g.id}/${s.id} → ${s.contested.issueId}`).toBeTruthy();
        const pid = s.passageId ?? g.bundledPassageIds[0]!;
        expect(
          issue!.passageId === pid || (issue!.mergePassageIds?.includes(pid) ?? false),
          `${g.id}/${s.id}: issue ${issue!.id} does not apply to ${pid}`,
        ).toBe(true);
      }
    }
  });

  it('the Romans 9:5 guide teaches from the REAL registry issue and reading', () => {
    const guide = getGuide('guide-romans-9-5')!;
    const step = guide.steps.find((s) => s.contested);
    expect(step?.contested?.issueId).toBe('iss_rom_9_5_doxology_sblgnt');
    const issue = getIssueById('iss_rom_9_5_doxology_sblgnt')!;
    // The christological reading is now BAKED into the single merged base
    // document, so this is an ordinary single-passage issue (no cross-boundary
    // merge) authored against the one bundled sentence id.
    expect(issue.mergePassageIds).toBeUndefined();
    expect(issue.passageId).toBe('sblgnt_romans_228');
    // The demoted alternate is the independent-doxology reading.
    expect(getAlternateReadings(issue.id).map((r) => r.id)).toContain(
      'alt_rom_9_5_independent_doxology_sblgnt',
    );
  });

  it('registers the Acts 2:39 guide as a two-source discourse example (Greek + Hebrew)', () => {
    const guide = getGuide('guide-acts-2-39');
    expect(guide).toBeTruthy();
    // Reworked from a stacked syntax guide into a discourse-backed one; it is
    // un-hidden and appears in the visible library again.
    expect(guide!.kind).toBe('discourse');
    expect(guide!.hidden).toBeFalsy();
    expect(visibleGrammarHighlightGuides.some((g) => g.id === 'guide-acts-2-39')).toBe(true);
    // Two ranges, two DIFFERENT sources (Greek Acts + Hebrew Genesis).
    const ranges = guide!.discourse!.ranges;
    expect(ranges.map((r) => r.sourceId)).toEqual([
      'macula-greek-sblgnt-lowfat',
      'macula-hebrew-wlc-lowfat',
    ]);
    expect(ranges.map((r) => r.startRef)).toEqual(['2:39', '17:12']);
    expect(guide!.topics).toEqual(['covenant', 'promise', 'discourse']);
  });

  it('registers the Lord\'s-Prayer guide with Matthew/Luke stacked on the comparison steps', () => {
    const guide = getGuide('guide-lords-prayer-bread');
    expect(guide).toBeTruthy();
    expect(guide!.bundledPassageIds).toEqual(['sblgnt_matthew_143', 'sblgnt_luke_511']);
    // The comparison steps name a secondary passage that is one of the bundled ids.
    const stacked = guide!.steps.filter((s) => s.secondaryPassageId);
    expect(stacked.length).toBeGreaterThan(0);
    for (const s of stacked) {
      expect(guide!.bundledPassageIds).toContain(s.secondaryPassageId);
      // The stacked frame is always the OTHER gospel from the step's own primary.
      expect(s.secondaryPassageId).not.toBe(s.passageId ?? guide!.bundledPassageIds[0]);
    }
    // At least one step stacks Matthew's aorist δός beneath Luke's present δίδου
    // so both imperatives are visible at once, not only by paging between steps.
    const verbStep = guide!.steps.find((s) => s.id === 'step-luke-present')!;
    expect(verbStep.secondaryPassageId).toBe('sblgnt_matthew_143');
    expect(verbStep.focus.nodeIds).toContain('w_n42011003006'); // δίδου, primary
    expect(verbStep.secondaryFocus?.nodeIds).toContain('w_n40006011006'); // δός, secondary
  });

  it('registers the Romans 8:28–30 golden-chain guide against the one bundled sentence', () => {
    const guide = getGuide('guide-romans-8-28-30');
    expect(guide).toBeTruthy();
    // The whole 8:28–30 range is ONE Greek sentence in the SBLGNT Lowfat base.
    expect(guide!.bundledPassageIds).toEqual(['sblgnt_romans_216']);
    for (const s of guide!.steps) {
      expect(s.passageId ?? guide!.bundledPassageIds[0]).toBe('sblgnt_romans_216');
    }
    // The five chain-verb term chips all resolve to real tokens in the bundle.
    const doc = guidedDocuments.find((d) => d.id === 'sblgnt_romans_216')!;
    const chain = ['proegno', 'proorisen', 'ekalesen', 'edikaiosen', 'edoxasen'];
    for (const id of chain) {
      const term = guide!.greekTerms.find((t) => t.id === id);
      expect(term, id).toBeTruthy();
      const token = doc.tokens.find((t) => t.id === term!.tokenId);
      expect(token?.surface, id).toBe(term!.surface);
    }
  });

  it('the Romans 8:28 step teaches from the REAL textual-variant issue on its own passage', () => {
    const guide = getGuide('guide-romans-8-28-30')!;
    const step = guide.steps.find((s) => s.contested);
    expect(step?.contested?.issueId).toBe('iss_rom_8_28_variant_sblgnt');
    const issue = getIssueById('iss_rom_8_28_variant_sblgnt')!;
    // The issue is authored against the very sentence the guide loads.
    expect(issue.passageId).toBe('sblgnt_romans_216');
    expect(getAlternateReadings(issue.id).map((r) => r.id)).toContain(
      'alt_rom_8_28_god_subject_sblgnt',
    );
  });

  it('registers the Colossians 2:11–12 guide against the one bundled sentence', () => {
    const guide = getGuide('guide-colossians-2-11-12');
    expect(guide).toBeTruthy();
    expect(guide!.difficulty).toBe('advanced');
    // Col 2:8–12 is ONE Greek sentence in the SBLGNT Lowfat base.
    expect(guide!.bundledPassageIds).toEqual(['sblgnt_colossians_13']);
    expect(guide!.steps.length).toBe(6);
    for (const s of guide!.steps) {
      expect(s.passageId ?? guide!.bundledPassageIds[0]).toBe('sblgnt_colossians_13');
    }
    // The confessional note is the labelled "confessional Reformed" conviction.
    expect(guide!.confessionalFrame).toContain('confessional Reformed');
    // The βαπτισμῷ chip is authored with surface + gloss (the base gloss is empty).
    const doc = guidedDocuments.find((d) => d.id === 'sblgnt_colossians_13')!;
    const chip = guide!.greekTerms.find((t) => t.id === 'baptismo')!;
    expect(chip.surface).toBe('βαπτισμῷ');
    expect(chip.gloss).toBe('baptism');
    const token = doc.tokens.find((t) => t.id === chip.tokenId)!;
    expect(token.surface).toBe('βαπτισμῷ');
  });

  it('the Colossians 2:12 step teaches from the REAL SBLGNT contested issue', () => {
    const guide = getGuide('guide-colossians-2-11-12')!;
    const step = guide.steps.find((s) => s.contested);
    expect(step?.contested?.issueId).toBe('iss_col_2_12_raised_antecedent_sblgnt');
    const issue = getIssueById('iss_col_2_12_raised_antecedent_sblgnt')!;
    // The issue is authored against the very sentence the guide loads.
    expect(issue.passageId).toBe('sblgnt_colossians_13');
    expect(getAlternateReadings(issue.id).map((r) => r.id)).toContain(
      'alt_col_2_12_raised_in_christ_sblgnt',
    );
  });

  it('bundles the WLC Hebrew parallel document (language hbo)', () => {
    const heb = guidedDocuments.find((d) => d.id === 'wlc_genesis_1_11');
    expect(heb, 'wlc_genesis_1_11 must be in the guided bundle').toBeTruthy();
    expect(heb!.language).toBe('hbo');
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

  it('builds highlight maps over a stacked Hebrew SECONDARY passage (its own ids)', () => {
    // A synthetic stacked step over the bundled WLC Hebrew doc — the stacked
    // feature is still used by the Lord's-Prayer guide; this keeps Hebrew (hbo)
    // secondary coverage now that Acts 2:39 has become a discourse guide.
    const secDoc = getGuidedDocument('wlc_genesis_1_11')!;
    expect(secDoc.language).toBe('hbo');
    const secondaryFocus = {
      nodeIds: ['w_o010170120052', 'w_o010170120082', 'w_o010170120083', 'w_o010170120182'],
    };
    const { nodeFills } = guidedHighlightMaps(secDoc, {
      id: 's',
      title: 't',
      body: '',
      focus: secondaryFocus,
    });
    expect(nodeFills.size).toBeGreaterThan(0);
    // Every highlighted node resolves in the SECONDARY passage, not the primary.
    for (const id of nodeFills.keys()) {
      expect(secDoc.syntax.nodes.some((n) => n.id === id), id).toBe(true);
    }
    for (const c of nodeFills.values()) {
      expect(Object.values(GUIDED_HIGHLIGHT_COLORS)).toContain(c);
    }
  });

  it('builds highlight maps over the stacked Matthew SECONDARY passage in the Lord\'s-Prayer guide', () => {
    const stackedGuide = getGuide('guide-lords-prayer-bread')!;
    const stacked = stackedGuide.steps.find((s) => s.secondaryPassageId)!;
    const secDoc = getGuidedDocument(stacked.secondaryPassageId!)!;
    expect(secDoc.language).toBe('grc');
    const { nodeFills } = guidedHighlightMaps(secDoc, {
      ...stacked,
      focus: stacked.secondaryFocus ?? {},
      highlights: stacked.secondaryHighlights,
    });
    expect(nodeFills.size).toBeGreaterThan(0);
    // Every highlighted node resolves in the SECONDARY (Matthew) passage, not
    // the primary (Luke) one this step's own passageId names.
    for (const id of nodeFills.keys()) {
      expect(secDoc.syntax.nodes.some((n) => n.id === id), id).toBe(true);
    }
    for (const c of nodeFills.values()) {
      expect(Object.values(GUIDED_HIGHLIGHT_COLORS)).toContain(c);
    }
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

  it('stepping onto a Lord\'s-Prayer stacked step keeps the primary (Luke) document loaded', () => {
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-lords-prayer-bread');
    const guide = getGuide('guide-lords-prayer-bread')!;
    const stackedIndex = guide.steps.findIndex((s) => s.secondaryPassageId);
    expect(stackedIndex).toBeGreaterThan(0);
    useGuidedStore.getState().setStep(stackedIndex);
    // The stacked step's own passageId is Luke — the secondary (Matthew) frame
    // is drawn read-only and never loaded into the editor store.
    expect(useEditorStore.getState().doc.id).toBe(guide.steps[stackedIndex]!.passageId);
    expect(useEditorStore.getState().doc.id).toBe('sblgnt_luke_511');
  });

  it('Colossians 2:11–12 guide loads the DISPLAYED variant (ἐν ᾧ as a relative clause on βαπτισμῷ)', () => {
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-colossians-2-11-12');
    const doc = useEditorStore.getState().doc;
    expect(doc.id).toBe('sblgnt_colossians_13');
    // The base apposition (raised-clause → βαπτισμῷ) is gone…
    expect(doc.syntax.relations.some((r) => r.id === 'r_s13_86')).toBe(false);
    // …re-drawn as an adjectival relative clause hanging on βαπτισμῷ.
    const adj = doc.syntax.relations.filter(
      (r) => r.headId === 'w_n51002012005' && r.type === 'adjectival' && r.dependentId === 'cl_s13_67',
    );
    expect(adj).toHaveLength(1);
    // The first ἐν now governs βαπτισμῷ as its plain object.
    expect(doc.syntax.relations.find((r) => r.id === 'r_s13_87')?.dependentId).toBe('w_n51002012005');
    useGuidedStore.getState().leave();
  });

  it('every guide in the library opens and lays out in its default mode', () => {
    for (const g of grammarHighlightGuides) {
      // Discourse-backed guides host the Discourse view (a separate store); they
      // do not load a syntax passage into the editor store, so skip them here.
      if (g.kind === 'discourse') continue;
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

  it('opening a guide sets the reading context to its one merged bundled passage', () => {
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-romans-9-5');
    const e = useEditorStore.getState();
    // The two source sentences are baked into ONE merged christological base doc.
    expect(e.gntPassages.map((d) => d.id)).toEqual(['sblgnt_romans_228']);
    expect(e.gntIndex).toBe(0);
  });

  it('the Romans 9:5 base is christological and the demoted alternate previews structurally', () => {
    useGuidedStore.getState().enter('greek');
    useGuidedStore.getState().openGuide('guide-romans-9-5');
    // The guided base IS the merged christological document: the doxology clause
    // hangs off Χριστός (s0_w_n45009005008) in apposition by default.
    const baseRel = useEditorStore
      .getState()
      .doc.syntax.relations.find((r) => r.id === 'disc_r1');
    expect(baseRel?.headId).toBe('s0_w_n45009005008');
    expect(baseRel?.type).toBe('apposition');

    useEditorStore.getState().openContestedPanel('iss_rom_9_5_doxology_sblgnt');
    expect(useEditorStore.getState().contested.showAlternateParsePanel).toBe(true);
    useEditorStore
      .getState()
      .previewAlternateReading('alt_rom_9_5_independent_doxology_sblgnt');
    const preview = useEditorStore.getState().previewDoc;
    expect(preview).not.toBeNull();
    // The demoted alternate detaches the doxology back into its own independent
    // sentence beneath the discourse root.
    const rel = preview!.syntax.relations.find((r) => r.id === 'disc_r1');
    expect(rel?.headId).toBe('disc_root');
    expect(rel?.type).toBe('adjunct');
    // Previewing never touches the loaded document.
    expect(useEditorStore.getState().doc.id).toBe('sblgnt_romans_228');
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
