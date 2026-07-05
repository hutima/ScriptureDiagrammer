import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Acts 2:39 — "to you is the promise, and to your children" — reworked as a
 * DISCOURSE-backed guide (`kind: 'discourse'`) that loads TWO passages, both in
 * the ASV English translation, side by side:
 *
 *   - Acts 2:39 (ASV), and
 *   - Genesis 17:12 (ASV),
 *
 * concatenated into one Discourse document. Both ranges load from the remote,
 * public-domain `english-asv` source; if that fetch fails, each range falls
 * back to the bundled BSB translation for the same verse (see each range's
 * `fallback`), and the substitution is surfaced honestly in the step card via
 * the store's `guidedNotice` — never a silent swap or a broken canvas.
 *
 * The point is to SEE the covenant echo: Peter's "to you and to your
 * children… and to all who are afar off" sounds the old formula spoken to
 * Abraham, "to you and to your offspring… even the foreigner." A single seeded
 * "parallel" arc links the two verses.
 *
 * This is deliberately MODEST: the two texts are shown together, in English
 * translation, so a reader can observe the promise/covenant logic for
 * themselves. No claim is made about the underlying Greek and Hebrew syntax,
 * and a diagram does not settle the baptism question — faithful readers weigh
 * it differently, as the "Where readers differ" note keeps fairly in view.
 */
export const acts239: GrammarHighlightGuide = {
  id: 'guide-acts-2-39',
  kind: 'discourse',
  bundledPassageIds: [],
  title: 'Acts 2:39 — the promise, and its covenant echo',
  reference: 'Acts 2:39 · Genesis 17:12',
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  topics: ['covenant', 'promise', 'discourse'],
  summary: 'See Peter\'s "to you and your children" beside the Abrahamic covenant formula it echoes — two passages read together.',
  devotionalFrame:
    'After calling the crowd to repent and be baptized, Peter tells them WHY: "to you is the promise, and to your children, and to all that are afar off." Those words are not new. Laid beside Genesis 17, they echo the covenant God made with Abraham — "to you and to your offspring… even the foreigner in your household." This guide loads both verses together, in the ASV English translation, so you can watch the promise carried forward and thrown open wider.',
  discourse: {
    ranges: [
      {
        sourceId: 'english-asv',
        bookNum: 44, // Acts (66-book canonical numbering)
        startRef: '2:39',
        endRef: '2:39',
        granularity: 'verse',
        label: 'Acts 2:39 (ASV)',
        fallback: {
          sourceId: 'english-bsb-all',
          bookNum: 44,
          notice:
            'The ASV text for Acts 2:39 could not be fetched, so the bundled BSB translation is shown instead.',
        },
      },
      {
        sourceId: 'english-asv',
        bookNum: 1, // Genesis (66-book canonical numbering)
        startRef: '17:12',
        endRef: '17:12',
        granularity: 'verse',
        label: 'Genesis 17:12 (ASV)',
        fallback: {
          sourceId: 'english-bsb-all',
          bookNum: 1,
          notice:
            'The ASV text for Genesis 17:12 could not be fetched, so the bundled BSB translation is shown instead.',
        },
      },
    ],
    // One sample arc linking the two verses — a proposed covenant echo, not a
    // claim of grammatical identity between the languages.
    seededArcs: [
      {
        id: 'ga_acts239_echo',
        sourceRef: '2:39',
        targetRef: '17:12',
        type: 'parallel',
        label: 'covenant echo',
        notes: '"to you… and to your children… and to all that are afar off" echoes "to you and your offspring… even the foreigner"',
      },
    ],
    // Same pair, echoed as a shared highlight color alongside the arc.
    seededHighlights: [{ refs: ['2:39', '17:12'], color: 'green' }],
  },
  steps: [
    {
      id: 'step-the-promise',
      title: 'A promise, addressed to a household',
      body:
        'Read Acts 2:39 first. "To you is the promise, and to your children, and to all that are afar off." Peter names its recipients as a series — you, your children, the far-off — not as isolated individuals who decide, but as a household and, beyond it, the nations. The very word "promise" is covenant language: something God has pledged and will keep.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The gospel here is first a promise, and a promise is directed — it is FOR someone. The rest of the verse names the "someone."',
    },
    {
      id: 'step-the-echo',
      title: 'The same shape as the sign given to Abraham',
      body:
        'Now read Genesis 17:12 beneath it. The covenant sign is given "to you and to your offspring throughout your generations," reaching even "the foreigner… who is not your offspring." The seeded arc links the two verses: Peter\'s "to you… and to your children… and to all that are afar off" sounds the same three-fold address — you, your line, the outsider brought near.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The wording is not new. Peter is carrying the old covenant promise forward — and opening it wider than any hearer expected.',
    },
    {
      id: 'step-what-a-diagram-shows',
      title: 'What the display shows — and what it does not',
      body:
        'The Discourse view shows the ADDRESS matching across the two verses — the covenant\'s reach, from household to foreigner to "all that are afar off." What it cannot do is settle, on its own, who should be baptized or when. That question turns on how one reads the newness of the new covenant across the whole of Scripture, and faithful readers weigh it differently.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'A parallel is real evidence and worth seeing plainly. But a diagram opens a question; it rarely closes a doctrine by itself.',
      caution:
        'The link drawn here is a covenant ECHO in wording, shown as a proposed parallel in English translation — not a claim about the underlying Greek and Hebrew syntax, and not a proof-text for either side of the baptism debate.',
    },
  ],
  greekTerms: [],
  debateSummary: {
    issue:
      'Who are the "you and your children" of the promise, and what does the covenant echo settle about baptism? The verse fixes the recipients — the hearers, their children, and all who are far off — and bounds them with "as many as the Lord our God calls." It does not, in its own words, state who should be baptized; that step draws on how one reads the covenant across both Testaments.',
    views: [
      {
        label: 'A covenantal (paedobaptist) reading',
        summary:
          'Peter\'s "to you and to your children" repeats the covenant formula spoken to Abraham, where the sign fell on households, children included. On this reading the promise still runs to believers together with their children, and baptism — the new-covenant sign of inclusion — is rightly given to them, as circumcision was.',
      },
      {
        label: 'A credobaptist reading',
        summary:
          '"Your children" and "all that are afar off" describe the promise\'s wide REACH across generations and nations, while the closing clause — "as many as the Lord our God calls" — marks its actual recipients as those who are called and, answering, repent and believe. Baptism then follows profession of faith.',
      },
    ],
    grammarOpensQuestionHow:
      'The text settles this much outright: the promise is addressed to households and nations together, its reach defined by God\'s calling. What it does not settle by wording alone is the subjects or mode of baptism. The covenant echo with Genesis 17 is genuine and worth weighing; how much it decides depends on how one reads the continuity and newness of the covenant — which is exactly where faithful readers still differ.',
  },
};
