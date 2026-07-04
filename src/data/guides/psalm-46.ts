import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Psalm 46 — "God is our refuge and strength" — a DISCOURSE-backed guide
 * (`kind: 'discourse'`) presenting the psalm's PROPOSED literary chiasm:
 *
 *   A  (v.1)   God as refuge
 *     B  (v.2)   therefore we will not fear
 *       C  (v.3)   God's rule over NATURAL calamity (roaring seas, quaking hills)
 *         D  (vv.4–5) God present with his city
 *           E  (v.6a) the nations rage
 *           E′ (v.6b) God speaks — the earth melts
 *         D′ (v.7)   the LORD of Hosts is with us (refrain)
 *       C′ (vv.8–9) God's rule over POLITICAL calamity (desolations, wars cease)
 *     B′ (v.10)  "Be still, and know that I am God"
 *   A′ (v.11)  God as our exalted refuge (refrain)
 *
 * Loaded from the bundled BSB English OT (`english-bsb-ot`) through the normal
 * range pipeline. Sample correspondence arcs are seeded for the pairs that fall
 * on distinct verses (the E/E′ pivot sits inside a single verse, so it is shown
 * in the prose rather than as an arc). The chiasm is offered as a PROPOSED
 * reading, clearly labelled — not a certain structure.
 */
export const psalm46: GrammarHighlightGuide = {
  id: 'guide-psalm-46',
  kind: 'discourse',
  bundledPassageIds: [],
  title: 'Psalm 46 — a fortress, read as a chiasm',
  reference: 'Psalm 46',
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  topics: ['chiasm', 'Old Testament', 'Psalm', 'refuge'],
  summary: 'Read Psalm 46 as a proposed chiasm — refuge and "be still" framing a still centre where God speaks and the earth melts.',
  devotionalFrame:
    'Psalm 46 is famously calm in the middle of catastrophe. Many readers have noticed it also seems SHAPED like a fortress: its opening and closing mirror each other, and the turmoil of the nations sits protected at the centre, where God simply speaks. This guide lays the psalm out in the Discourse view so you can test that mirror for yourself. The structure is proposed, not certain — but reading for it rewards the eye.',
  discourse: {
    ranges: [
      {
        sourceId: 'english-bsb-ot',
        bookNum: 19, // Psalms (OT_BOOKS numbering)
        startRef: '46:1',
        endRef: '46:11',
        granularity: 'verse',
        label: 'Psalm 46 (BSB)',
      },
    ],
    // Proposed (sample) correspondence arcs for the pairs that fall on distinct
    // verses. The central E/E′ pivot lives inside v.6, so it is taught in the
    // prose, not drawn as an arc. Silently skipped if a ref does not resolve.
    seededArcs: [
      { id: 'ga_ps46_a', sourceRef: '46:1', targetRef: '46:11', type: 'chiasm', label: 'A ↔ A′', notes: 'God our refuge ↔ our exalted fortress (refrain)' },
      { id: 'ga_ps46_b', sourceRef: '46:2', targetRef: '46:10', type: 'chiasm', label: 'B ↔ B′', notes: 'we will not fear ↔ "be still, and know that I am God"' },
      { id: 'ga_ps46_c', sourceRef: '46:3', targetRef: '46:8', type: 'chiasm', label: 'C ↔ C′', notes: 'natural upheaval (seas, mountains) ↔ political upheaval (wars cease)' },
      { id: 'ga_ps46_d', sourceRef: '46:5', targetRef: '46:7', type: 'chiasm', label: 'D ↔ D′', notes: 'God is within her ↔ the LORD of Hosts is with us' },
    ],
  },
  steps: [
    {
      id: 'step-overview',
      title: 'A fortress-shaped psalm',
      body:
        'Read the whole psalm once in the Discourse view. Watch for repetition: the refrain "The LORD of Hosts is with us; the God of Jacob is our fortress" returns near the end (v.7 and v.11), and the opening image of refuge (v.1) reappears at the close. Those echoes are the outer walls of a proposed chiasm.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'Before analysing, simply notice the psalm circles back on itself. Hebrew poetry often makes its point by SHAPE, not just by sequence.',
    },
    {
      id: 'step-outer-frame',
      title: 'A ↔ A′ and B ↔ B′ — refuge, and "be still"',
      body:
        'The outermost pair frames everything: "God is our refuge and strength" (A, v.1) answers "The LORD of Hosts is with us… our fortress" (A′, v.11). Just inside, "we will not fear, though the earth give way" (B, v.2) answers the command "Be still, and know that I am God" (B′, v.10). Fearlessness at the start becomes stillness at the end.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The psalm moves the reader from resolved courage ("we will not fear") to surrendered quiet ("be still") — two faces of trust.',
    },
    {
      id: 'step-inner-pairs',
      title: 'C ↔ C′ and D ↔ D′ — chaos held, the city kept',
      body:
        'Deeper in, natural upheaval — "though its waters roar… the mountains quake" (C, v.3) — is mirrored by political upheaval God ends: "He makes wars cease… He burns the shields" (C′, vv.8–9). And at the next layer, "God is within her; she will not be moved" (D, v.5) is answered by the refrain "The LORD of Hosts is with us" (D′, v.7). Whether the sea rages or the nations do, God is present and unshaken.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The same steadiness answers two kinds of chaos — creation\'s and history\'s. God\'s presence, not the calm of circumstances, is the constant.',
    },
    {
      id: 'step-centre',
      title: 'E / E′ — the still centre where God speaks',
      body:
        'At the very middle (v.6) the psalm reaches its turning point: "Nations rage, kingdoms crumble" (E) — and then, "He lifts His voice, the earth melts" (E′). The loudest chaos in the psalm sits at its protected centre, and it is answered not by a battle but by a word. God speaks; the tumult dissolves.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'A chiasm puts its emphasis at the centre. Here the centre is God\'s bare voice overpowering the raging of the nations — the heart of the whole psalm.',
      caution:
        'The A–E/E′–A′ structure shown here is a PROPOSED literary reading, not a certain one, and different scholars divide the verses slightly differently. Treat the arcs as an invitation to read closely, not as the psalm\'s settled outline.',
    },
  ],
  greekTerms: [],
};
