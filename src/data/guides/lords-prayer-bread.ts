import type { GrammarHighlightGuide } from '@/domain/schema';

/** STUB — pending authoring. Overwritten by the guide author. */
export const lordsPrayerBread: GrammarHighlightGuide = {
  id: 'guide-lords-prayer-bread',
  title: 'Matthew 6:11 & Luke 11:3 — (draft)',
  reference: 'Matthew 6:11 & Luke 11:3',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_matthew_143', 'sblgnt_luke_511'],
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
      passageId: 'sblgnt_matthew_143',
    },
  ],
  greekTerms: [],
};
