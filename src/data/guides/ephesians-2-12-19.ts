import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Ephesians 2:12–19 — "you who once were far off have been brought near" — a
 * DISCOURSE-backed guide (`kind: 'discourse'`). Rather than a syntax diagram it
 * hosts the Discourse view over the passage (loaded from the bundled BSB English
 * through the NORMAL range pipeline — the same eight verses as the Discourse
 * default demo, but as an ordinary guide load that never touches the demo /
 * hide-demo preferences).
 *
 * The passage moves from estrangement ("far off", "strangers", "without God")
 * to reconciliation ("brought near", "one new man", "fellow citizens"), and its
 * eight verses fold into a proposed chiasm around the peace Christ makes. Four
 * clearly-labelled SAMPLE arcs are seeded for the display; they are a teaching
 * scaffold, not an authoritative analysis.
 */
export const ephesians212: GrammarHighlightGuide = {
  id: 'guide-ephesians-2-12-19',
  kind: 'discourse',
  bundledPassageIds: [],
  title: 'Ephesians 2:12–19 — far off, brought near',
  reference: 'Ephesians 2:12–19',
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  topics: ['reconciliation', 'discourse'],
  summary: 'Trace the move from estrangement to reconciliation as a discourse — and a proposed chiasm around the peace Christ makes.',
  devotionalFrame:
    'Paul does not argue in single sentences here; he builds a movement. Read these eight verses as a whole — the way one clause answers another — and the shape of the gospel appears: those once "far off" are "brought near," strangers become "fellow citizens," because Christ "is our peace." The Discourse view lets you see that arc across the passage at once.',
  discourse: {
    ranges: [
      {
        sourceId: 'english-bsb',
        bookNum: 10, // Ephesians in the NT (GNT_BOOKS) index used by BSB-NT
        startRef: '2:12',
        endRef: '2:19',
        granularity: 'verse',
        label: 'Ephesians 2:12–19 (BSB)',
      },
    ],
    // A guide-authored indent staircase that steps inward to the peace-making
    // centre (2:15/2:16) and back out again, so the chiasm's shape is visible
    // at a glance. Absolute per-line indents — display scaffolding, never a
    // syntactic claim, and reset with the guided display.
    seededIndents: [
      { ref: '2:12', userIndent: 0 },
      { ref: '2:13', userIndent: 1 },
      { ref: '2:14', userIndent: 2 },
      { ref: '2:15', userIndent: 3 },
      { ref: '2:16', userIndent: 3 },
      { ref: '2:17', userIndent: 2 },
      { ref: '2:18', userIndent: 1 },
      { ref: '2:19', userIndent: 0 },
    ],
    // Sample correspondence arcs (proposed, not authoritative) — the same shape
    // the Discourse demo illustrates, offered here as a teaching scaffold.
    seededArcs: [
      { id: 'ga_eph_a', sourceRef: '2:12', targetRef: '2:19', type: 'chiasm', label: 'A ↔ A′', notes: 'alienated ↔ no longer strangers' },
      { id: 'ga_eph_b', sourceRef: '2:13', targetRef: '2:18', type: 'chiasm', label: 'B ↔ B′', notes: 'brought near ↔ access by one Spirit' },
      { id: 'ga_eph_c', sourceRef: '2:14', targetRef: '2:17', type: 'chiasm', label: 'C ↔ C′', notes: 'he is our peace ↔ he preached peace' },
      { id: 'ga_eph_d', sourceRef: '2:15', targetRef: '2:16', type: 'chiasm', label: 'D ↔ D′', notes: 'one new man ↔ reconciled in one body' },
    ],
    // Same four pairs, echoed as shared highlight colors alongside the arcs.
    seededHighlights: [
      { refs: ['2:12', '2:19'], color: 'blue' },
      { refs: ['2:13', '2:18'], color: 'green' },
      { refs: ['2:14', '2:17'], color: 'orange' },
      { refs: ['2:15', '2:16'], color: 'purple' },
    ],
  },
  steps: [
    {
      id: 'step-once-far-off',
      title: 'The starting point: far off',
      body:
        'Begin at verse 12. Paul piles up the marks of estrangement — "separate from Christ," "excluded from citizenship," "strangers to the covenants," "without hope and without God." Hold this whole verse in view as the passage\'s low point; everything after answers it.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The reconciliation Paul celebrates only lands if we feel the distance it closes. The discourse opens at the farthest point.',
    },
    {
      id: 'step-brought-near',
      title: 'The turn: brought near',
      body:
        '"But now" (v.13) turns the passage. Those who were far off "have been brought near by the blood of Christ." Notice how verse 13 answers verse 12 directly — the same people, the distance reversed. In the Discourse view this is the first correspondence: far off ↔ brought near.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The whole movement pivots on "but now": the gospel is a reversal God works, not a distance we cross ourselves.',
    },
    {
      id: 'step-he-is-our-peace',
      title: 'The center: he is our peace',
      body:
        'At the heart of the passage (vv.14–16) stands the reason for the reversal: "He himself is our peace." Christ makes the two into "one new man," reconciling both "in one body" through the cross. This is the hinge the arcs fold around — the peace that turns strangers into one people.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'Reconciliation is a person before it is a status: peace is not a treaty we sign but Christ himself, given.',
    },
    {
      id: 'step-fellow-citizens',
      title: 'The result: fellow citizens',
      body:
        'The passage closes (vv.17–19) where verse 12 began, but inverted: those who were "excluded from citizenship" and "strangers" are now "fellow citizens with the saints and members of God\'s household." Read the last verse against the first and the whole arc completes itself.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'What was lost in verse 12 is restored — and more: not merely admitted, but made family.',
      caution:
        'The chiasm shown here is a PROPOSED literary structure, offered as a way to read the movement — not a claim that Paul consciously composed to a template. Weigh it against the text itself.',
    },
  ],
  greekTerms: [],
};
