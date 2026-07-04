import type { GrammarHighlightGuide } from '@/domain/schema';

/** STUB — pending authoring. Overwritten by the guide author. */
export const johnSin: GrammarHighlightGuide = {
  id: 'guide-1-john-sin',
  title: '1 John 2:1 & 3:6–9 — (draft)',
  reference: '1 John 2:1 & 3:6–9',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_1-john_11', 'sblgnt_1-john_60'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary: 'Guided walkthrough (draft — pending authoring).',
  steps: [
    {
      id: 'step-1',
      title: 'Overview',
      body: 'Draft.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      passageId: 'sblgnt_1-john_11',
    },
  ],
  greekTerms: [],
};
