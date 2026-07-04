import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Mark 5:25–34 — the woman with the flow of blood. A narrative built on a
 * long chain of Greek participles (describing her twelve years of suffering,
 * then her fear after the healing) hanging before short, decisive main verbs
 * (she touched him; she came, fell down, and told him). Authored against the
 * bundled SBLGNT passages sblgnt_mark_172 (Mark 5:25–27), sblgnt_mark_173
 * (Mark 5:28), and sblgnt_mark_178 (Mark 5:33) — dump with `npm run
 * guided:dump`.
 */
export const mark5: GrammarHighlightGuide = {
  id: 'guide-mark-5-25-34',
  title: 'Mark 5:25–34 — the woman who touched him',
  reference: 'Mark 5:25–34',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_mark_172', 'sblgnt_mark_173', 'sblgnt_mark_178'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'beginner',
  topics: ['participles', 'faith', 'healing'],
  summary:
    "Mark traces a suffering woman's long journey to one healing touch.",
  devotionalFrame:
    'Mark tells this story almost breathlessly. In Greek it is one long sentence that keeps adding description after description — a woman who was this, who had suffered that, who had spent everything — before it ever gets to what she does. Watching that grammar unfold is watching Mark slow down time so you feel exactly how much stood behind one quiet, desperate reach.',
  steps: [
    {
      id: 'step-participle-pile',
      title: 'A sentence that makes you wait',
      passageId: 'sblgnt_mark_172',
      body:
        'Before the sentence ever reaches its main verb, it introduces “a woman” and then piles up description after description: she was ([[ousa]]) suffering a flow of blood for twelve years; she had suffered ([[pathousa]]) much at the hands of many doctors; she had spent ([[dapanesasa]]) everything she had, with no improvement. In Greek, each of these hangs off “woman” as one long, coordinated chain — grammar that makes you wait exactly as long as the sentence needs you to, so you feel the weight of those twelve years before you ever learn what she does about it.',
      focus: {
        nodeIds: ['w_n41005025002', 'w_n41005025003', 'w_n41005026003', 'w_n41005026008'],
        relationIds: ['r_s172_38', 'r_s172_10', 'r_s172_17', 'r_s172_24'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: {
        emphasizedNodeIds: ['w_n41005025002', 'w_n41005025003', 'w_n41005026003', 'w_n41005026008'],
      },
      implication:
        'The grammar itself slows the reading down. That is not decoration — it is Mark teaching you, through sentence structure, how heavy this woman’s history was before she ever moved toward Jesus.',
      caution:
        'These participles describe one continuous situation, not seven separate lessons to preach on. Read them together as the circumstances leading up to the main action, not as isolated doctrinal points.',
      greekTermIds: ['ousa', 'pathousa', 'dapanesasa'],
    },
    {
      id: 'step-single-touch',
      title: 'One small action, at last',
      passageId: 'sblgnt_mark_172',
      body:
        'Only after all of that does the sentence add two more participles — having heard ([[akousasa]]) about Jesus, having come into the crowd behind him — and finally arrive at the one finite verb the whole sentence has been building toward: she touched ([[hepsato]]) his cloak. Every participle we followed describes what she is or has done; this single aorist verb is what she finally does. The diagram shows it plainly: one small action on the main line, with an entire paragraph of participial clauses hanging beneath it.',
      focus: {
        nodeIds: ['w_n41005027001', 'w_n41005027005', 'w_n41005027010'],
        relationIds: ['r_s172_1', 'r_s172_45', 'r_s172_52', 'r_s172_55'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n41005027010'] },
      implication:
        'Twelve years, many doctors, all her money, no improvement — and it comes down to one quiet, decisive reach. Your English Bible already carries this shape for you; the Greek just shows you why the sentence lands the way it does.',
      greekTermIds: ['akousasa', 'hepsato'],
    },
    {
      id: 'step-if-only',
      title: 'Her own words: “if only”',
      passageId: 'sblgnt_mark_173',
      body:
        'Mark lets us hear what she had been telling herself: she kept saying, “If I touch ([[hapsomai]]) even his garments, I will be healed.” The verb “touch” here is the same one she is about to act on — but this time it is a subjunctive tucked inside an “if” clause. Grammatically that marks her plan as hoped-for, not a guarantee she is claiming for herself.',
      focus: {
        nodeIds: ['w_n41005028001', 'w_n41005028005', 'w_n41005028010'],
        relationIds: ['r_s173_1', 'r_s173_11', 'r_s173_5', 'r_s173_10', 'r_s173_3'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n41005028005'] },
      implication:
        'Her faith, in her own words, is tentative and conditional — “if I only touch…” — and Jesus still meets it. The passage does not ask us to admire the size of her faith, only to notice that even a small, hesitant reach toward him was enough.',
      caution:
        'A subjunctive after “if” signals possibility, not the strength or weakness of someone’s faith. The story, not the mood alone, tells us how Jesus receives her.',
      greekTermIds: ['hapsomai'],
    },
    {
      id: 'step-trembling-confession',
      title: 'Fear finds its voice',
      passageId: 'sblgnt_mark_178',
      body:
        'After the healing, the grammar does the same thing again, this time with fear instead of suffering: “the woman, having been frightened ([[phobetheisa]]) and trembling, knowing what had happened to her, came and fell down before him and told him the whole truth.” Once more a run of participles delays the main verbs — she came, she fell down, she told — so we feel her fear before we hear her confession.',
      focus: {
        nodeIds: [
          'w_n41005033004',
          'w_n41005033006',
          'w_n41005033007',
          'w_n41005033011',
          'w_n41005033013',
        ],
        relationIds: ['r_s178_7', 'r_s178_9', 'r_s178_17', 'r_s178_18', 'r_s178_22'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n41005033004', 'w_n41005033011', 'w_n41005033013'] },
      implication:
        'The same grammatical pattern that painted twelve years of desperation now paints one moment of trembling honesty. Mark’s sentence shape is doing quiet work: it will not let you skip past what this cost her, coming or going.',
      caution:
        'Her trembling is not shown here as a lack of faith to be corrected — Jesus’s very next words call her “daughter” and commend exactly this faith. Don’t read fear and faith as opposites in this story.',
      greekTermIds: ['phobetheisa'],
    },
  ],
  greekTerms: [
    {
      id: 'ousa',
      tokenId: 't_n41005025003',
      surface: 'οὖσα',
      transliteration: 'ousa',
      lemma: 'εἰμί',
      gloss: 'being',
      parsing: 'present active participle, nominative feminine singular',
      explanation:
        'The first link in the chain describing the woman: she “was” in a flow of blood for twelve years. A present participle here simply describes her ongoing condition — the whole scene is set before any main verb arrives.',
    },
    {
      id: 'pathousa',
      tokenId: 't_n41005026003',
      surface: 'παθοῦσα',
      transliteration: 'pathousa',
      lemma: 'πάσχω',
      gloss: 'having suffered',
      parsing: 'aorist active participle, nominative feminine singular',
      explanation:
        'She had suffered much under many physicians. The aorist here views that long ordeal as a whole, summarized in one word, and adds it to the growing description of who she is as the sentence reaches for its main verb.',
    },
    {
      id: 'dapanesasa',
      tokenId: 't_n41005026008',
      surface: 'δαπανήσασα',
      transliteration: 'dapanēsasa',
      lemma: 'δαπανάω',
      gloss: 'having spent',
      parsing: 'aorist active participle, nominative feminine singular',
      explanation:
        'She had spent everything she had, with no benefit — a third participle stacked onto the first two. Mark is not simply informing us of her medical history; the grammar is making us wait through it with her.',
    },
    {
      id: 'akousasa',
      tokenId: 't_n41005027001',
      surface: 'ἀκούσασα',
      transliteration: 'akousasa',
      lemma: 'ἀκούω',
      gloss: 'having heard',
      parsing: 'aorist active participle, nominative feminine singular',
      explanation:
        'Having heard about Jesus — the participle that finally turns her long suffering toward hope, and the last link before the sentence’s one main verb.',
    },
    {
      id: 'hepsato',
      tokenId: 't_n41005027010',
      surface: 'ἥψατο',
      transliteration: 'hēpsato',
      lemma: 'ἅπτω',
      gloss: 'she touched',
      parsing: 'aorist middle indicative, 3rd singular',
      explanation:
        'The one finite main verb the whole long sentence has been building toward. Everything since “a woman” has been circumstance; this is what she does — she touches his cloak.',
      implication:
        'A sentence this loaded with description resolves in a single, small, decisive action. That contrast is the sentence’s whole point.',
    },
    {
      id: 'hapsomai',
      tokenId: 't_n41005028005',
      surface: 'ἅψωμαι',
      transliteration: 'hapsōmai',
      lemma: 'ἅπτω',
      gloss: 'I shall touch / if I touch',
      parsing: 'aorist middle subjunctive, 1st singular',
      explanation:
        'The same verb “to touch,” but here subjunctive after “if” (ἐὰν, ean) — her own hoped-for plan, quoted directly, rather than a report of what already happened.',
      caution:
        'The subjunctive mood marks this as contingent and hoped-for; it does not by itself measure how strong or weak her faith was.',
    },
    {
      id: 'phobetheisa',
      tokenId: 't_n41005033004',
      surface: 'φοβηθεῖσα',
      transliteration: 'phobētheisa',
      lemma: 'φοβέομαι',
      gloss: 'having been frightened',
      parsing: 'aorist passive participle, nominative feminine singular',
      explanation:
        'Opens a second short chain of participles (frightened, trembling, knowing) that once again delay the main verbs — she came, fell down, and told him everything — so the reader feels her fear before her confession.',
    },
  ],
};
