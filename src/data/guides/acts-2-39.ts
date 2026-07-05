import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Acts 2:38–39 — "be baptized… For to you is the promise, and to your
 * children" — a DISCOURSE-backed guide (`kind: 'discourse'`) that loads TWO
 * passages, both in the ASV English translation, side by side:
 *
 *   - Acts 2:38–39 (ASV), and
 *   - Genesis 17:12 (ASV),
 *
 * concatenated into one Discourse document. Both ranges load from the remote,
 * public-domain `english-asv` source; if that fetch fails, each range falls
 * back to the bundled BSB translation for the same verses (see each range's
 * `fallback`), and the substitution is surfaced honestly in the step card via
 * the store's `guidedNotice` — never a silent swap or a broken canvas.
 *
 * Whole verses are too coarse to show the four separate correspondences this
 * guide teaches, so `seededSplits` breaks each verse into phrase units (by
 * matching candidate wording against the loaded text — the FIRST candidate
 * that matches wins, and a split point with no match is silently skipped,
 * which is exactly how the guide degrades gracefully under the BSB fallback's
 * different wording). Four seeded 'parallel' arcs, each paired with a
 * matching seeded highlight color, then link the four phrase-level
 * correspondences:
 *
 *   1. "you" ↔ "you"                                          (blue)
 *   2. "your children" ↔ "your generations"                    (green)
 *   3. "all that are afar off" ↔ "the stranger… not of thy seed" (orange)
 *   4. "be baptized" ↔ "be circumcised"                         (purple)
 *
 * The last pair is the most freighted: it displays the PROPOSED covenantal
 * correspondence between the two signs, which is exactly the contested
 * question between the two baptism readings below — the guide's framing
 * stays modest, and "Where readers differ" keeps both readings in view.
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
  reference: 'Acts 2:38–39 · Genesis 17:12',
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  topics: ['covenant', 'promise', 'discourse', 'baptism'],
  summary:
    'See Peter\'s "repent and be baptized… to you and your children" beside the Abrahamic covenant formula it echoes — four color-coded correspondences, read side by side.',
  devotionalFrame:
    'Peter calls the crowd to repent and be baptized, then tells them WHY: "to you is the promise, and to your children, and to all that are afar off." Those words are not new. Laid beside Genesis 17, they echo the covenant God made with Abraham — sign given, "to you and to your offspring… even the foreigner in your household." This guide loads both passages together, in the ASV English translation, and highlights four matching phrases in turn so you can watch the promise — and its sign — carried forward and thrown open wider.',
  discourse: {
    ranges: [
      {
        sourceId: 'english-asv',
        bookNum: 44, // Acts (66-book canonical numbering)
        startRef: '2:38',
        endRef: '2:39',
        granularity: 'verse',
        label: 'Acts 2:38–39 (ASV)',
        fallback: {
          sourceId: 'english-bsb-all',
          bookNum: 44,
          notice:
            'The ASV text for Acts 2:38–39 could not be fetched, so the bundled BSB translation is shown instead.',
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
    // Break each verse into phrase-level units so the four correspondences
    // below can each point at a phrase rather than a whole verse. Candidates
    // cover the ASV wording first, then the BSB fallback's wording where a
    // sensible equivalent exists; a split point that matches neither is
    // silently skipped (Genesis 17:12's BSB clause order in particular
    // matches none of these candidates, so that verse degrades to one
    // whole-verse unit under the fallback — acceptable, not an error).
    seededSplits: [
      {
        ref: '2:38',
        before: [['and be baptized'], ['unto the remission', 'for the forgiveness']],
      },
      {
        ref: '2:39',
        before: [
          ['and to your children', 'and your children'],
          ['and to all that are afar off', 'and to all who are far off'],
          ['even as many as'],
        ],
      },
      {
        ref: '17:12',
        before: [['among you'], ['every male throughout your generations'], ['he that is born in the house']],
      },
    ],
    // Four sample arcs, one per phrase-level correspondence.
    seededArcs: [
      {
        id: 'ga_acts239_you',
        sourceRef: '2:39/1',
        targetRef: '17:12/2',
        type: 'parallel',
        label: 'you ↔ you',
        notes: '"to you is the promise" addresses the very hearers, echoing "among you" in the Genesis sign.',
      },
      {
        id: 'ga_acts239_children',
        sourceRef: '2:39/2',
        targetRef: '17:12/3',
        type: 'parallel',
        label: 'children ↔ generations',
        notes: '"to your children" carries the promise forward exactly as "throughout your generations" carries the sign.',
      },
      {
        id: 'ga_acts239_far_off',
        sourceRef: '2:39/3',
        targetRef: '17:12/4',
        type: 'parallel',
        label: 'afar off ↔ the stranger',
        notes: '"all that are afar off" widens the promise the same way the sign already reached "any stranger… not of thy seed."',
      },
      {
        id: 'ga_acts239_sign',
        sourceRef: '2:38/2',
        targetRef: '17:12/1',
        type: 'parallel',
        label: 'baptized ↔ circumcised',
        notes: 'A PROPOSED correspondence between the two signs — exactly the question the two readings below answer differently.',
      },
    ],
    // Same four pairs, echoed as shared highlight colors alongside the arcs.
    seededHighlights: [
      { refs: ['2:39/1', '17:12/2'], color: 'blue' },
      { refs: ['2:39/2', '17:12/3'], color: 'green' },
      { refs: ['2:39/3', '17:12/4'], color: 'orange' },
      { refs: ['2:38/2', '17:12/1'], color: 'purple' },
    ],
  },
  steps: [
    {
      id: 'step-the-promise',
      title: 'A promise, addressed to a household',
      body:
        'Read Acts 2:38–39 first. Peter calls the crowd to "repent, and be baptized… unto the remission of your sins," then names the promise\'s recipients as a series — "to you is the promise, and to your children, and to all that are afar off" — not isolated individuals who decide, but a household and, beyond it, the nations. The very word "promise" is covenant language: something God has pledged and will keep.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The gospel here is first a promise, attached to a sign (baptism), and a promise is directed — it is FOR someone. The four highlighted pairs below trace who.',
    },
    {
      id: 'step-pair-you',
      title: '"You" ↔ "you" (blue)',
      body:
        'The blue highlight links "to you is the promise" (Acts 2:39) with "among you" in the covenant sign given to Abraham\'s household (Genesis 17:12). Both address the hearer directly, first of all: the promise — like the sign before it — starts with the people standing right there.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication: 'The promise is not addressed to strangers in the abstract; it opens by naming the very people listening.',
    },
    {
      id: 'step-pair-children',
      title: '"Your children" ↔ "your generations" (green)',
      body:
        'The green highlight links "and to your children" (Acts 2:39) with "throughout your generations" (Genesis 17:12). Both carry the promise forward in time, past the first hearers, to the households that come after them.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication: 'The promise is not a one-generation event; both texts build in continuity across time.',
    },
    {
      id: 'step-pair-afar-off',
      title: '"All that are afar off" ↔ "the stranger… not of thy seed" (orange)',
      body:
        'The orange highlight links "and to all that are afar off" (Acts 2:39) with "any stranger, that is not of thy seed" (Genesis 17:12). Both texts widen the promise\'s reach beyond the immediate family — to the Gentile nations in Acts, to the household-adopted foreigner in Genesis.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication: 'Even in Genesis 17, the covenant sign was never ONLY for physical descendants; Acts 2 widens the same reach further still.',
    },
    {
      id: 'step-pair-sign',
      title: '"Be baptized" ↔ "be circumcised" (purple) — where readers differ',
      body:
        'The purple highlight links "be baptized" (Acts 2:38) with "shall be circumcised" (Genesis 17:12) — the two SIGNS themselves, not just the promise surrounding them. This is a PROPOSED correspondence, drawn here for you to weigh, not a settled equation: it is exactly the question the paedobaptist and credobaptist readings below answer differently.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'If baptism functions as the new-covenant counterpart to circumcision, that shapes who should receive it and when — which is precisely where "Where readers differ" applies.',
      caution:
        'A shared color here shows a PROPOSED parallel between two signs in two different covenants, in English translation — it is not a claim about the underlying Greek and Hebrew syntax, and it does not by itself settle the baptism debate.',
    },
    {
      id: 'step-what-a-diagram-shows',
      title: 'What the display shows — and what it does not',
      body:
        'The Discourse view shows four ADDRESS-and-sign correspondences matching across the two passages — the covenant\'s reach, from household to foreigner to "all that are afar off," and the proposed link between the two signs. What it cannot do is settle, on its own, who should be baptized or when. That question turns on how one reads the newness of the new covenant across the whole of Scripture, and faithful readers weigh it differently.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'Four parallels are real evidence and worth seeing plainly. But a diagram opens a question; it rarely closes a doctrine by itself.',
      caution:
        'The links drawn here are covenant ECHOES in wording, shown as proposed parallels in English translation — not a claim about the underlying Greek and Hebrew syntax, and not a proof-text for either side of the baptism debate.',
    },
  ],
  greekTerms: [],
  debateSummary: {
    issue:
      'Who are the "you and your children" of the promise, and does the parallel with circumcision settle who should be baptized? The verse fixes the recipients — the hearers, their children, and all who are far off — and bounds them with "as many as the Lord our God calls." It does not, in its own words, state who should be baptized; that step draws on how one reads the covenant sign across both Testaments.',
    views: [
      {
        label: 'A covenantal (paedobaptist) reading',
        summary:
          'Peter\'s "to you and to your children" repeats the covenant formula spoken to Abraham, where the sign fell on households, children included. On this reading baptism is the new-covenant counterpart to circumcision, and the promise still runs to believers together with their children — so baptism is rightly given to them, as circumcision was.',
      },
      {
        label: 'A credobaptist reading',
        summary:
          '"Your children" and "all that are afar off" describe the promise\'s wide REACH across generations and nations, while the closing clause — "as many as the Lord our God calls" — marks its actual recipients as those who are called and, answering, repent and believe. Baptism, on this reading, is not simply circumcision\'s replacement but the sign given to those who make that response.',
      },
    ],
    grammarOpensQuestionHow:
      'The text settles this much outright: the promise is addressed to households and nations together, its reach defined by God\'s calling, and its call to repent-and-be-baptized stands right beside it. What it does not settle by wording alone is whether baptism functions as circumcision\'s exact new-covenant counterpart, or the subjects and mode of baptism more broadly. The covenant echo with Genesis 17 — sign and promise both — is genuine and worth weighing; how much it decides depends on how one reads the continuity and newness of the covenant, which is exactly where faithful readers still differ.',
  },
};
