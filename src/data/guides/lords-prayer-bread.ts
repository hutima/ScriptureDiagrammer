import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Matthew 6:11 & Luke 11:3 — the same petition of the Lord's Prayer ("give us
 * … our daily bread"), prayed with two different verb forms. Matthew's aorist
 * imperative δός presents the asking as one simple, whole act; Luke's present
 * imperative δίδου pictures it as ongoing, reinforced by his added phrase
 * καθ' ἡμέραν ("day by day"). Authored against the bundled SBLGNT passages
 * `sblgnt_matthew_143` and `sblgnt_luke_511` (dump with `npm run guided:dump`).
 */
export const lordsPrayerBread: GrammarHighlightGuide = {
  id: 'guide-lords-prayer-bread',
  title: 'Matthew 6:11 & Luke 11:3 — one petition, two pictures',
  reference: 'Matthew 6:11 & Luke 11:3',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_matthew_143', 'sblgnt_luke_511'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    'Matthew and Luke both hand down the same line of the Lord’s Prayer, "give us … our daily bread" — but Matthew’s verb is aorist and Luke’s is present, and Luke adds "day by day." The diagrams show two faithful ways of picturing one request, not a contradiction.',
  devotionalFrame:
    'Two Gospels remember this same short prayer, worded almost identically — but each writer’s Greek paints its own small picture of what it looks like to ask the Father for daily bread. As you compare the two diagrams, notice that neither picture cancels the other. Together they show how rich one simple request can be.',
  steps: [
    {
      id: 'step-matthew-request',
      title: 'Matthew: one plain request',
      body:
        'In Matthew, Jesus teaches: [[dos]] us [[sEmeron]] our daily bread. The diagram puts the command ["give"] on the main line, with "bread" standing as its direct object and "us" as the one receiving it. The verb’s form here — an aorist imperative — presents the whole act of asking as one simple request: give.',
      focus: {
        nodeIds: [
          'cl_s143_0',
          'w_n40006011006',
          'w_n40006011002',
          'w_n40006011008',
        ],
        relationIds: ['r_s143_1', 'r_s143_6', 'r_s143_8'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n40006011006', 'w_n40006011002'] },
      implication:
        'This is the shape behind "Give us this day our daily bread": a single, direct petition, asked plainly, for today.',
      greekTermIds: ['dos', 'sEmeron'],
    },
    {
      id: 'step-matthew-epiousios',
      title: 'A word no one is fully sure of',
      body:
        'The bread Jesus tells us to ask for is [[epiousios]] — usually translated "daily." The diagram shows it as a simple modifier hanging beneath "bread," alongside "our" (a genitive: bread that belongs to us). But the Greek word itself is a puzzle: it barely occurs anywhere else in surviving Greek writing, so nobody can be entirely certain what shade of meaning it carried.',
      focus: {
        nodeIds: [
          'w_n40006011002',
          'w_n40006011005',
          'w_n40006011004',
          'w_n40006011003',
        ],
        relationIds: ['r_s143_4', 'r_s143_3', 'r_s143_2'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n40006011005'] },
      caution:
        'This is a genuinely uncertain word, not a hidden key that overturns your translation. "Daily" is a reasonable, time-honored rendering — so are "for the coming day" and "the bread we need" — and careful scholars still weigh all three.',
      greekTermIds: ['epiousios'],
    },
    {
      id: 'step-luke-present',
      title: 'Luke: the same prayer, a different verb form',
      body:
        'Luke hands down the same line almost word for word — "our bread, the daily one" — but where Matthew has δός, Luke has [[didou]]. Same verb, same meaning "give," but a present-tense imperative instead of an aorist one. The aorist in Matthew viewed the asking as a whole, a single act; the present in Luke pictures the asking as ongoing, still in progress as it is spoken.',
      passageId: 'sblgnt_luke_511',
      focus: {
        nodeIds: ['cl_s511_0', 'w_n42011003006', 'w_n42011003002'],
        relationIds: ['r_s511_1', 'r_s511_6'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n42011003006'] },
      implication:
        'This is why some English Bibles render Luke’s line with more of a sense of continuation ("keep giving," "give … day by day") than Matthew’s. Both Gospels are translating the same underlying request faithfully — they simply preserve two verb pictures Jesus’ own words offered.',
      caution:
        'Do not read the present tense here as "always continuously giving" as a fixed rule — it pictures the asking as ongoing rather than as one completed act. How much weight that carries comes from the rest of the sentence, including the phrase Luke adds next.',
      greekTermIds: ['didou'],
    },
    {
      id: 'step-luke-each-day',
      title: '"Day by day" — spelled out, not just implied',
      body:
        'Luke does not leave the "ongoing" sense to the verb alone. He adds a whole phrase: [[kathHemeran]], "according to the day" — "each day" or "day by day." In the diagram it hangs beneath the verb as its own modifying phrase, governing "day" the way a preposition governs its object. Luke states outright what the present tense only suggests.',
      focus: {
        nodeIds: [
          'w_n42011003006',
          'w_n42011003009',
          'w_n42011003010',
          'w_n42011003008',
        ],
        relationIds: ['r_s511_10', 'r_s511_8', 'r_s511_9'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n42011003009', 'w_n42011003010'] },
      implication:
        'Luke’s sense of a daily, repeated request comes as much from these two added words as from his choice of tense. Tense and vocabulary are working together, not one doing all the work.',
      greekTermIds: ['kathHemeran'],
    },
    {
      id: 'step-two-pictures',
      title: 'One petition, two faithful pictures',
      body:
        'Set side by side, Matthew asks for [[dos]] — bread for today, one plain request. Luke asks for [[didou]] [[kathHemeran]] — bread, day by day, an asking pictured as ongoing. Neither Gospel is correcting the other, and neither reading contradicts your English Bible, whichever wording it uses. The grammar simply lets us see two true angles on what it means to depend on the Father for daily bread — right now, and every day after this one.',
      passageId: 'sblgnt_luke_511',
      focus: {
        nodeIds: ['cl_s511_0', 'w_n42011003006', 'w_n42011003009'],
        relationIds: ['r_s511_1', 'r_s511_10'],
      },
      panZoom: { fit: 'whole-diagram' },
      implication:
        'This is exactly why English translations of Matthew and Luke differ here — and why both are faithful. The difference is a difference in picture, not in truth.',
      greekTermIds: ['epiousios'],
    },
  ],
  greekTerms: [
    {
      id: 'dos',
      tokenId: 't_n40006011006',
      surface: 'δὸς',
      transliteration: 'dos',
      lemma: 'δίδωμι',
      gloss: 'give',
      parsing: 'aorist active imperative, 2nd singular',
      explanation:
        'Matthew’s command form of "give." The aorist imperative presents the whole act of asking as one simple, complete request — "give" — rather than drawing attention to repetition.',
      implication:
        'This is the grammar behind "Give us this day our daily bread": one direct petition, asked plainly.',
      caution:
        'The aorist here does not mean "give once and never again." It simply views the request as a single, whole act — Jesus assumes his disciples will pray this prayer daily.',
    },
    {
      id: 'sEmeron',
      tokenId: 't_n40006011008',
      surface: 'σήμερον',
      transliteration: 'sēmeron',
      lemma: 'σήμερον',
      gloss: 'today',
      parsing: 'adverb',
      explanation:
        'Matthew anchors the request to this one day: "give us today our daily bread." It modifies the verb "give," telling us when the asking happens rather than how often.',
      implication:
        'This matches "this day" or "today" in most English translations of Matthew’s version of the prayer.',
    },
    {
      id: 'epiousios',
      tokenId: 't_n40006011005',
      surface: 'ἐπιούσιον',
      transliteration: 'epiousion',
      lemma: 'ἐπιούσιος',
      gloss: 'daily / for the coming day / needful',
      parsing: 'adjective, accusative masculine singular',
      explanation:
        'The word translated "daily." It is a famously rare word — it appears almost nowhere else in surviving Greek literature outside the Lord’s Prayer — so its precise sense has been debated since the earliest centuries: bread "for today," bread "for the coming day," or simply the bread "we need."',
      implication:
        'Whichever choice a translation makes, it is reaching for the same idea: dependence on the Father for the bread that sustains us.',
      caution:
        'This is a genuinely uncertain word. No single English rendering can claim certainty here — "daily" is a reasonable, time-honored choice, not the only defensible one.',
    },
    {
      id: 'didou',
      tokenId: 't_n42011003006',
      surface: 'δίδου',
      transliteration: 'didou',
      lemma: 'δίδωμι',
      gloss: 'give / keep giving',
      parsing: 'present active imperative, 2nd singular',
      explanation:
        'Luke’s command form of the same verb "give." A present-tense imperative pictures the asking as ongoing, in progress, rather than presenting it as one simple completed act — a different camera angle on the same request Matthew records.',
      implication:
        'This is the grammar behind translations that render Luke’s line with a sense of continuation, such as "give us each day" or "keep giving us."',
      caution:
        'The present tense does not by itself mean "ask forever, non-stop, as a fixed rule." It pictures the request as ongoing; how much weight that carries depends on the rest of the sentence — including the phrase Luke adds right after it.',
    },
    {
      id: 'kathHemeran',
      tokenId: 't_n42011003009',
      surface: 'καθ',
      transliteration: 'kath',
      lemma: 'κατά',
      gloss: 'according to / each',
      parsing: 'preposition, governing ἡμέραν (accusative)',
      explanation:
        'This small preposition governs "day" (ἡμέραν) to form the phrase "day by day" or "each day," attached to Luke’s verb as its own modifying phrase. Luke states outright, in so many words, what the present tense on its own only hints at.',
      implication:
        'Luke’s sense of an ongoing, repeated request comes as much from this added phrase as from his choice of verb tense — the two work together, not the tense alone.',
    },
  ],
};
