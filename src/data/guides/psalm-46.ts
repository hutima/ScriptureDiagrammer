import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Psalm 46 — "God is our refuge and strength" — a DISCOURSE-backed guide
 * (`kind: 'discourse'`) presenting the psalm's THREE-STANZA structure, each
 * stanza marked off by a "Selah" and the outer two closing on the same refrain.
 *
 * STRUCTURE — following Rolf A. Jacobson, "Psalm 46: Translation, Structure,
 * and Theology," Word & World 40, no. 3 (Summer 2020) — in the issue "Sola
 * Structura: Essays Honoring Mark Throntveit," Word & World / Luther Seminary:
 * https://wordandworld.luthersem.edu/issues.aspx?article_id=4189
 *
 * Jacobson reads the psalm's three "Selah" markers as stanza dividers, each
 * stanza a coherent movement in its own right:
 *   Stanza 1 — refuge amid cosmic upheaval (earth gives way, waters roar) …Selah
 *   Stanza 2 — the river/city of God; the nations rage, God speaks …Selah, closing
 *              on the refrain "The LORD of Hosts is with us; the God of Jacob
 *              is our fortress"
 *   Stanza 3 — behold the LORD's historical acts; "be still, and know" …Selah,
 *              closing on the SAME refrain repeated verbatim
 * and characterizes the whole as a "psalm of trust." This guide follows that
 * three-stanza reading rather than treating the psalm as a full chiasm.
 *
 * IMPORTANT — versification. The bundled BSB Old Testament (`english-bsb-ot`)
 * follows the HEBREW numbering, in which the SUPERSCRIPTION is verse 1. So the
 * verse refs below are shifted one past the familiar English numbering, and
 * the three Selahs (independently confirmed in the bundled BSB text) fall at:
 *
 *   BSB 46:1       = the superscription ("For the choirmaster… A song") — NOT a stanza
 *   BSB 46:2–46:4  (English 46:1–3)  = Stanza 1, Selah at 46:4
 *   BSB 46:5–46:8  (English 46:4–7)  = Stanza 2, Selah at 46:8 — first refrain
 *   BSB 46:9–46:12 (English 46:8–11) = Stanza 3, Selah at 46:12 — refrain repeated
 *
 * The superscription (46:1) is preserved and shown, but kept OUT of the stanza
 * structure: no arc, no stanza colour, and a plain label marking it as not part
 * of the pattern. The one seeded arc connects the refrain's two occurrences
 * (46:8 ↔ 46:12) — a verbatim repetition, not an invented mirror-image chiasm.
 * A guide-authored indent keeps each stanza's opening line and its closing
 * refrain flush with the margin, with the stanza's interior lines indented, so
 * the three-part shape is visible at a glance. Offered as a PROPOSED reading
 * (Jacobson's own, cited above), not a certain or inspired structure.
 */
export const psalm46: GrammarHighlightGuide = {
  id: 'guide-psalm-46',
  kind: 'discourse',
  bundledPassageIds: [],
  title: 'Psalm 46 — three stanzas, marked by Selah',
  reference: 'Psalm 46',
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  topics: ['Old Testament', 'Psalm', 'refuge', 'trust', 'refrain'],
  summary:
    'Read Psalm 46 as three Selah-marked stanzas built around a repeated refrain — "The LORD of Hosts is with us" — following Rolf A. Jacobson\'s proposed structure.',
  devotionalFrame:
    'Psalm 46 is famously calm in the middle of catastrophe. Its own text marks out its shape: three times the word "Selah" interrupts the flow — after 46:4, 46:8, and 46:12 — dividing the psalm into three stanzas. This guide follows the three-stanza reading proposed by Rolf A. Jacobson, "Psalm 46: Translation, Structure, and Theology," Word & World 40, no. 3 (Summer 2020), https://wordandworld.luthersem.edu/issues.aspx?article_id=4189, who also names Psalm 46 a "psalm of trust." The heading ("For the choirmaster…") is shown but kept out of the pattern — the stanzas are between the psalm\'s own lines. The structure is proposed, not certain — but reading for it rewards the eye and the ear.',
  discourse: {
    ranges: [
      {
        sourceId: 'english-bsb-ot',
        bookNum: 19, // Psalms (OT_BOOKS numbering)
        // The bundled BSB OT uses Hebrew versification (46:1 = superscription),
        // so the psalm proper runs 46:2–46:12 — 46:12 carries the refrain's
        // SECOND, verbatim occurrence, so it must be inside the range. 46:1
        // (superscription) is included and shown, but held out of the stanza
        // structure (no arc, no colour) below.
        startRef: '46:1',
        endRef: '46:12',
        granularity: 'verse',
        label: 'Psalm 46 (BSB)',
      },
    ],
    // The superscription is shown but plainly marked as outside the pattern;
    // the three stanza openings and the two refrain occurrences are tagged so
    // the Selah-marked shape reads at a glance without hunting for the word.
    seededLabels: [
      { ref: '46:1', label: 'Superscription — not part of the stanza structure' },
      { ref: '46:2', label: 'Stanza 1' },
      { ref: '46:5', label: 'Stanza 2' },
      { ref: '46:8', label: 'Refrain' },
      { ref: '46:9', label: 'Stanza 3' },
      { ref: '46:12', label: 'Refrain (repeated)' },
    ],
    // Each stanza's OPENING line and its closing Selah/refrain sit flush with
    // the margin; the interior lines step in one level — so the three-part
    // shape (open — build — Selah) is visible without reading every word.
    // Absolute per-line indents (display scaffolding, never a syntactic claim).
    seededIndents: [
      { ref: '46:1', userIndent: 0 }, // superscription
      { ref: '46:2', userIndent: 0 }, // Stanza 1 opens
      { ref: '46:3', userIndent: 1 },
      { ref: '46:4', userIndent: 1 }, // Selah closes Stanza 1
      { ref: '46:5', userIndent: 0 }, // Stanza 2 opens
      { ref: '46:6', userIndent: 1 },
      { ref: '46:7', userIndent: 1 },
      { ref: '46:8', userIndent: 0 }, // Selah + refrain closes Stanza 2
      { ref: '46:9', userIndent: 0 }, // Stanza 3 opens
      { ref: '46:10', userIndent: 1 },
      { ref: '46:11', userIndent: 1 },
      { ref: '46:12', userIndent: 0 }, // Selah + refrain repeated closes Stanza 3
    ],
    // The ONE textually-verifiable correspondence: the refrain repeats
    // VERBATIM at the end of Stanza 2 and Stanza 3. A 'parallel' arc (not
    // 'chiasm' — this is a repeated line, not a mirror-image structure).
    seededArcs: [
      {
        id: 'ga_ps46_refrain',
        sourceRef: '46:8',
        targetRef: '46:12',
        type: 'parallel',
        label: 'Refrain repeated',
        notes:
          '"The LORD of Hosts is with us; the God of Jacob is our fortress" closes Stanza 2 (Selah, 46:8) and Stanza 3 (Selah, 46:12) verbatim.',
      },
    ],
    // Each stanza gets its own color as a block, so the three-part shape reads
    // at a glance; the superscription (46:1) is intentionally left uncoloured.
    seededHighlights: [
      { refs: ['46:2', '46:3', '46:4'], color: 'blue' }, // Stanza 1
      { refs: ['46:5', '46:6', '46:7', '46:8'], color: 'green' }, // Stanza 2
      { refs: ['46:9', '46:10', '46:11', '46:12'], color: 'orange' }, // Stanza 3
    ],
  },
  steps: [
    {
      id: 'step-overview',
      title: 'Three stanzas, marked by Selah',
      body:
        'Read the whole psalm once in the Discourse view. The first line — "For the choirmaster. Of the sons of Korah…" — is the superscription (the ancient heading), shown here but set apart: it is not one of the psalm\'s three stanzas. The word "Selah" then interrupts the text three times (46:4, 46:8, 46:12), dividing the psalm into three stanzas of roughly equal weight — a structure proposed by Rolf A. Jacobson (see this guide\'s citation below). Watch, too, for the refrain "The LORD of Hosts is with us; the God of Jacob is our fortress," which closes both Stanza 2 and Stanza 3 verbatim.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'Before analysing, simply notice the psalm\'s own text marks its divisions — Selah is not decoration; ancient Hebrew poetry often signals its shape this plainly.',
    },
    {
      id: 'step-stanza-1',
      title: 'Stanza 1 — refuge amid cosmic upheaval (46:2–46:4)',
      body:
        'The psalm opens with its ground note: "God is our refuge and strength, an ever-present help in times of trouble" (46:2). From there it names the worst the created order could do — the earth transformed, mountains toppled into the sea, waters roaring (46:3–46:4) — and answers it before it is even fully described: "Therefore we will not fear." Selah closes the stanza, inviting the reader to pause on that confidence.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The stanza states its thesis first — refuge — then tests it against the largest imaginable threat: the unmaking of creation itself.',
    },
    {
      id: 'step-stanza-2',
      title: 'Stanza 2 — the city of God; the nations rage (46:5–46:8)',
      body:
        'The second stanza turns to a gentler image — a river gladdening "the city of God, the holy place where the Most High dwells" (46:5) — before naming a second kind of upheaval, this time political: "Nations rage, kingdoms crumble; the earth melts when He lifts His voice" (46:7). Where the first stanza answered chaos with a claim ("we will not fear"), this one answers it with God\'s own bare speech. The stanza closes, Selah, on the refrain: "The LORD of Hosts is with us; the God of Jacob is our fortress" (46:8) — its first appearance.',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'Two kinds of chaos — nature\'s and history\'s — are each answered by the same thing: God\'s presence, not a change in circumstances.',
    },
    {
      id: 'step-stanza-3',
      title: 'Stanza 3 — "be still, and know" (46:9–46:12)',
      body:
        'The final stanza looks back at what the LORD has already done — "come, see the works of the LORD… He makes wars cease… He burns the shields in the fire" (46:9–46:10) — then turns that history into a command: "Be still, and know that I am God" (46:11). The stanza closes, Selah, on the SAME refrain repeated verbatim: "The LORD of Hosts is with us; the God of Jacob is our fortress" (46:12) — the line this guide\'s one seeded arc connects back to its first occurrence (46:8).',
      focus: {},
      panZoom: { fit: 'whole-diagram' },
      implication:
        'The refrain closing both outer stanzas is the psalm\'s real center of gravity — not a single verse, but a claim repeated until it settles.',
      caution:
        'This three-stanza reading follows Rolf A. Jacobson, "Psalm 46: Translation, Structure, and Theology," Word & World 40, no. 3 (Summer 2020) — https://wordandworld.luthersem.edu/issues.aspx?article_id=4189 — who reads the psalm\'s three Selahs as marking three stanzas and characterizes the whole as a "psalm of trust." It is a PROPOSED literary reading, offered here with its source named — not a certain or inspired structure. Treat the stanza colours, the one refrain arc, and the indentation as an invitation to read closely and test the pattern against the text.',
    },
  ],
  greekTerms: [],
};
