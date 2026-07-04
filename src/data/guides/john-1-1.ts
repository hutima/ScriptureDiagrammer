import type { GrammarHighlightGuide } from '@/domain/schema';

/** STUB — pending authoring. Overwritten by the guide author. */
export const john1: GrammarHighlightGuide = {
  id: 'guide-john-1-1',
  title: 'John 1:1 — (draft)',
  reference: 'John 1:1',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_john_0'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'beginner',
  summary: 'Guided walkthrough (draft — pending authoring).',
  steps: [
    {
      id: 'step-1',
      title: 'Overview',
      body: 'Draft.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      passageId: 'sblgnt_john_0',
    },
  ],
  greekTerms: [],
};
