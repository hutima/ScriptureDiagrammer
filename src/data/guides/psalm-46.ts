import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Psalm 46 — "God is our refuge and strength" — a DISCOURSE-backed guide
 * (`kind: 'discourse'`) presenting the psalm's PROPOSED literary chiasm.
 *
 * IMPORTANT — versification. The bundled BSB Old Testament (`english-bsb-ot`)
 * follows the HEBREW numbering, in which the SUPERSCRIPTION is verse 1. So the
 * verse refs in this guide are shifted one past the familiar English numbering:
 *
 *   BSB 46:1  = the superscription ("For the choirmaster… A song") — NOT chiasm
 *   BSB 46:2  = "God is our refuge and strength"        (English 46:1)   A
 *   BSB 46:3–6                                          (English 46:2–5) B
 *   BSB 46:7  = "Nations rage… the earth melts"         (English 46:6)   C
 *   BSB 46:8  = "The LORD of Hosts is with us…"         (English 46:7)   CENTER
 *   BSB 46:9–10                                         (English 46:8–9) C′
 *   BSB 46:11 = "Be still, and know that I am God"      (English 46:10)  B′
 *   BSB 46:12 = the closing refrain                     (English 46:11)  A′
 *
 * The superscription (46:1) is preserved and shown, but it is deliberately kept
 * OUT of the chiasm: no arc, no correspondence color, and a plain label marking
 * it as not part of the pattern. The chiasm proper runs 46:2–46:12.
 *
 * Proposed structure (English verse names in parentheses):
 *
 *   A  (46:1)  God as refuge and present help          → BSB 46:2
 *     B  (46:2–5) we will not fear; the city is not moved → BSB 46:3–46:6
 *       C  (46:6)  the nations rage; God speaks; earth melts → BSB 46:7
 *         ✱ (46:7) "The LORD of Hosts is with us"  (centre)  → BSB 46:8
 *       C′ (46:8–9) behold the LORD's works; wars cease      → BSB 46:9–46:10
 *     B′ (46:10) "Be still, and know that I am God"          → BSB 46:11
 *   A′ (46:11) the refuge refrain repeated                   → BSB 46:12
 *
 * Loaded from the bundled BSB English OT through the normal range pipeline.
 * Sample correspondence arcs are seeded for the outer pairs; the centre verse
 * (46:8) is marked with a highlight, not an arc, since it has no partner. A
 * guide-authored indent staircase makes the inward-then-outward movement easy to
 * see. The chiasm is offered as a PROPOSED reading, clearly labelled — not a
 * certain or inspired structure.
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
  summary:
    'Read Psalm 46 as a proposed chiasm — refuge and "be still" framing a still centre where God speaks and the earth melts.',
  devotionalFrame:
    'Psalm 46 is famously calm in the middle of catastrophe. Many readers have noticed it also seems SHAPED like a fortress: its opening and closing mirror each other, and the turmoil of the nations sits protected near the centre, where God simply speaks. This guide lays the psalm out in the Discourse view so you can test that mirror for yourself. The heading ("For the choirmaster…") is shown but kept out of the pattern — the chiasm is between the psalm\'s lines themselves. The structure is proposed, not certain — but reading for it rewards the eye.',
  discourse: {
    ranges: [
      {
        sourceId: 'english-bsb-ot',
        bookNum: 19, // Psalms (OT_BOOKS numbering)
        // The bundled BSB OT uses Hebrew versification (46:1 = superscription),
        // so the psalm proper runs 46:2–46:12 — 46:12 carries the CLOSING
        // refrain (English 46:11) that completes the A ↔ A′ frame, so it must
        // be inside the range. 46:1 (superscription) is included and shown, but
        // held out of the chiasm (no arc, no colour) below.
        startRef: '46:1',
        endRef: '46:12',
        granularity: 'verse',
        label: 'Psalm 46 (BSB)',
      },
    ],
    // The superscription is shown but plainly marked as outside the pattern.
    seededLabels: [{ ref: '46:1', label: 'Superscription — not part of the chiasm' }],
    // A staircase that steps INWARD toward the centre (46:8) and back OUT again,
    // so the mirror is visible at a glance. Absolute per-line indents (never a
    // syntactic claim); the superscription and the centre sit flush left.
    seededIndents: [
      { ref: '46:1', userIndent: 0 }, // superscription
      { ref: '46:2', userIndent: 0 }, // A
      { ref: '46:3', userIndent: 1 }, // B
      { ref: '46:4', userIndent: 2 },
      { ref: '46:5', userIndent: 3 },
      { ref: '46:6', userIndent: 2 },
      { ref: '46:7', userIndent: 1 }, // C
      { ref: '46:8', userIndent: 0 }, // centre
      { ref: '46:9', userIndent: 1 }, // C′
      { ref: '46:10', userIndent: 2 },
      { ref: '46:11', userIndent: 1 }, // B′
      { ref: '46:12', userIndent: 0 }, // A′
    ],
    // Proposed (sample) correspondence arcs for the outer pairs. Each side is a
    // representative verse; the FULL span each pair covers is carried by the
    // highlights below. The centre (46:8) has no arc — it pairs with nothing —
    // so it is marked only with its own highlight. Silently skipped if a ref
    // does not resolve.
    seededArcs: [
      { id: 'ga_ps46_a', sourceRef: '46:2', targetRef: '46:12', type: 'chiasm', label: 'A ↔ A′', notes: 'God our refuge and present help ↔ the refuge refrain repeated' },
      { id: 'ga_ps46_b', sourceRef: '46:3', targetRef: '46:11', type: 'chiasm', label: 'B ↔ B′', notes: 'we will not fear; the city is not moved ↔ "be still, and know that I am God"' },
      { id: 'ga_ps46_c', sourceRef: '46:7', targetRef: '46:9', type: 'chiasm', label: 'C ↔ C′', notes: 'the nations rage; God speaks, the earth melts ↔ behold the LORD\'s works; He makes wars cease' },
    ],
    // Same pairs, echoed as shared highlight colors — a highlight can cover the
    // FULL span the prose describes (B colours 46:3–46:6 and its answer 46:11;
    // C colours 46:7 and its answer 46:9–46:10). The centre 46:8 gets its own
    // colour, since it has no arc. The superscription (46:1) is intentionally
    // left uncoloured: it is not part of the chiasm.
    seededHighlights: [
      { refs: ['46:2', '46:12'], color: 'blue' },
      { refs: ['46:3', '46:4', '46:5', '46:6', '46:11'], color: 'green' },
      { refs: ['46:7', '46:9', '46:10'], color: 'orange' },
      { refs: ['46:8'], color: 'yellow' },
    ],
  },
  steps: [
    {
      id: 'step-overview',
      title: 'A fortress-shaped psalm',
      body:
        'Read the whole psalm once in the Discourse view. The first line — "For the choirmaster. Of the sons of Korah…" — is the superscription (the ancient heading), shown here but set apart: it is not part of the literary pattern we are tracing. Watch instead for repetition in the psalm proper: the refrain "The LORD of Hosts is with us; the God of Jacob is our fortress" appears twice (46:8 and 46:12), and the opening image of refuge (46:2) returns at the close (46:12). Those echoes are the outer walls of a proposed chiasm.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'Before analysing, simply notice the psalm circles back on itself. Hebrew poetry often makes its point by SHAPE, not just by sequence.',
    },
    {
      id: 'step-outer-frame',
      title: 'A ↔ A′ and B ↔ B′ — refuge, and "be still"',
      body:
        'The outermost pair frames everything: "God is our refuge and strength" (A, 46:2) answers the closing refrain, "The LORD of Hosts is with us… our fortress" (A′, 46:12). Just inside, the confidence of "we will not fear, though the earth gives way" (B, 46:3–46:6) answers the command "Be still, and know that I am God" (B′, 46:11). Fearless courage at the start becomes surrendered stillness at the end.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The psalm moves the reader from resolved courage ("we will not fear") to quiet trust ("be still") — two faces of the same confidence in God.',
    },
    {
      id: 'step-inner-pairs',
      title: 'C ↔ C′ — chaos answered, on two fronts',
      body:
        'Deeper in, the raging of the peoples — "Nations rage, kingdoms crumble; the earth melts when He lifts His voice" (C, 46:7) — is mirrored by the LORD\'s decisive acts in history: "Come, see the works of the LORD… He makes wars cease… He burns the shields in the fire" (C′, 46:9–46:10). The same God who silences creation\'s upheaval also ends the wars of the nations.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'God\'s presence, not the calm of circumstances, is the constant that answers every kind of chaos.',
    },
    {
      id: 'step-centre',
      title: 'The still centre — "The LORD of Hosts is with us"',
      body:
        'At the turning point stands the refrain in its first appearance: "The LORD of Hosts is with us; the God of Jacob is our fortress" (46:8). Around it the nations rage (46:7) and the LORD acts (46:9–46:10); at the centre is neither turmoil nor even a mighty act, but simply his PRESENCE — "with us." This verse has no partner arc; it is the still point the whole mirror turns on, marked here with its own highlight.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'A chiasm puts its weight at the centre. Here the centre is not a victory but a companionship: God himself, with his people — the heart of the whole psalm.',
      caution:
        'The A–✱–A′ structure shown here is a PROPOSED literary reading, not a certain one, and scholars divide the verses slightly differently (some place the centre at 46:7). Treat the arcs and the indentation as an invitation to read closely and test the pattern against the text — not as the psalm\'s settled outline.',
    },
  ],
  greekTerms: [],
};
