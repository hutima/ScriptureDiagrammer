import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Romans 6:3–4 — two sentences (SBLGNT `sblgnt_romans_126` = v.3,
 * `sblgnt_romans_127` = v.4) built around a repeated εἰς + accusative
 * ("into Christ" / "into his death") and a σύν-compound verb
 * (συνετάφημεν, "buried together with"), landing on a ἵνα purpose clause
 * ("so that we might walk in newness of life"). Dumped with
 * `npm run guided:dump -- sblgnt_romans_126 sblgnt_romans_127`.
 */
export const romans6: GrammarHighlightGuide = {
  id: 'guide-romans-6-3-4',
  title: 'Romans 6:3–4 — baptized into his death',
  reference: 'Romans 6:3–4',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_romans_126', 'sblgnt_romans_127'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    "Paul pictures baptism as union with Christ's death and new life.",
  devotionalFrame:
    'These two verses are one connected argument, and the Greek grammar carries it plainly: the same “into” shows up twice, and the next verse opens with a single word built from “with” + “bury.” Follow the diagram and watch how the sentence itself insists that what happened to Christ has happened, grammatically and really, to us.',
  steps: [
    {
      id: 'step-do-you-not-know',
      title: 'A question everyone should already know the answer to',
      passageId: 'sblgnt_romans_126',
      body:
        'Paul begins with a rhetorical question: “ἢ ἀγνοεῖτε ὅτι…” (ē agnoeite hoti…) — “Or do you not know that…?” The diagram puts [[agnoeite]] on the main baseline, with the whole ὅτι-clause (hoti, “that”) hanging beneath it as its direct object. Paul is not introducing new teaching here; he is reminding the Romans of something baptism itself already pictures, if they think through what it means.',
      focus: {
        nodeIds: ['w_n45006003001', 'w_n45006003002', 'w_n45006003003', 'cl_s126_0', 'cl_s126_2'],
        relationIds: ['r_s126_1', 'r_s126_16', 'r_s126_15'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n45006003002'] },
      implication:
        'Before we look at any individual word, the shape of the sentence tells us something: what follows is common ground, not a new argument. Paul is drawing out a meaning already built into the practice of baptism.',
      greekTermIds: ['agnoeite'],
    },
    {
      id: 'step-into-christ',
      title: 'Baptized into Christ Jesus',
      passageId: 'sblgnt_romans_126',
      body:
        'Look at the first clause inside the ὅτι (hoti, “that”): “ὅσοι ἐβαπτίσθημεν εἰς Χριστὸν Ἰησοῦν” (hosoi ebaptisthēmen eis Christon Iēsoun) — “as many of us as were baptized into Christ Jesus.” The verb [[ebaptisthemen]] is passive: something was done TO us. And the preposition [[eis]] with the accusative does not just mean “in connection with” Christ — it pictures baptism as a movement INTO him, into union with his person.',
      focus: {
        nodeIds: [
          'w_n45006003004',
          'w_n45006003005',
          'w_n45006003006',
          'w_n45006003007',
          'w_n45006003008',
        ],
        relationIds: ['r_s126_6', 'r_s126_5', 'r_s126_9', 'r_s126_8', 'r_s126_7'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: {
        emphasizedNodeIds: ['w_n45006003005', 'w_n45006003006', 'w_n45006003007'],
      },
      implication:
        '“Baptized into Christ” uses the same grammar you would use for water poured into a jar, or a river running into the sea. Paul reaches for that picture because union — not merely imitation or agreement — is exactly his point: to be baptized is to be joined to Christ himself.',
      caution:
        'The passive and the aorist together simply say something was done to us, viewed as a whole event; they do not, by themselves, spell out every detail of how or when that union takes hold in a believer\'s life.',
      greekTermIds: ['ebaptisthemen', 'eis'],
    },
    {
      id: 'step-into-his-death',
      title: 'Baptized into his death',
      passageId: 'sblgnt_romans_126',
      body:
        'The sentence is not finished. The whole clause you just traced — “we who were baptized into Christ Jesus” — turns out to be the grammatical SUBJECT of a second baptism: “…were baptized into his death.” The diagram shows this plainly: the subject beneath the second baptismal clause is not a single word but that entire earlier clause. And the preposition repeats — the same [[eis]] + accusative pattern that carried us into Christ now carries us into his death, made personal by the pronoun αὐτοῦ (autou), “his.”',
      focus: {
        nodeIds: [
          'cl_s126_4',
          'w_n45006003013',
          'w_n45006003009',
          'w_n45006003010',
          'w_n45006003011',
          'w_n45006003012',
        ],
        relationIds: ['r_s126_10', 'r_s126_3', 'r_s126_14', 'r_s126_13', 'r_s126_12', 'r_s126_11'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['cl_s126_4', 'w_n45006003013', 'w_n45006003009'] },
      implication:
        'Union with Christ is not vague in this sentence. The grammar insists that being joined to Christ MEANS being joined to what happened to him — his death included. You cannot have the one without the other.',
      caution:
        'This is grammar picturing union, not a manual explaining exactly how or when that union takes effect in a person\'s experience. Paul builds the theology elsewhere; here the sentence simply insists the two baptisms — into Christ, into his death — are one and the same act.',
      greekTermIds: ['eis'],
    },
    {
      id: 'step-buried-with',
      title: 'Buried with him',
      passageId: 'sblgnt_romans_127',
      body:
        'Verse 4 opens with a single Greek word built from a preposition and a verb: [[synetaphemen]], “we were buried together with.” The σύν- (syn-, “with”) prefix is doing real grammatical work — it is why the next word, [[auto]] (“him”), stands in the dative case, the case Greek uses for accompaniment. The diagram hangs both “with him” and the phrase “through baptism into death” beneath this one verb, all describing a single, shared burial.',
      focus: {
        nodeIds: [
          'w_n45006004001',
          'w_n45006004002',
          'w_n45006004003',
          'w_n45006004004',
          'w_n45006004005',
          'w_n45006004006',
          'w_n45006004007',
          'w_n45006004008',
          'w_n45006004009',
        ],
        relationIds: [
          'r_s127_1',
          'r_s127_29',
          'r_s127_2',
          'r_s127_5',
          'r_s127_4',
          'r_s127_3',
          'r_s127_8',
          'r_s127_7',
          'r_s127_6',
        ],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n45006004001', 'w_n45006004003'] },
      implication:
        'The prefix alone preaches: our burial was never a solo experience. Whatever happened to Christ in his burial, the grammar says, happened to us together WITH him.',
      caution:
        'The aorist passive here presents "we were buried" as one simple, whole event — much as English often does too. It does not, by itself, specify a moment or a mechanism; Paul\'s point is union with Christ, not a step-by-step account of how baptism accomplishes it.',
      greekTermIds: ['synetaphemen', 'auto'],
    },
    {
      id: 'step-newness-of-life',
      title: 'So that we might walk in newness of life',
      passageId: 'sblgnt_romans_127',
      body:
        'The verse now leans toward a goal: [[hina]] (“so that”) introduces the purpose of being buried with Christ. Inside that purpose clause Paul builds a comparison with ὥσπερ … οὕτως καί (hōsper … houtōs kai, “just as … so also”): just as Christ was raised from the dead by the Father\'s glory, so also we might [[peripatesomen]] — “walk” — in newness of life. The diagram lays the comparison out visibly: the resurrection clause supports the “just as,” and “we … might walk” carries the “so also,” both hanging beneath the same purpose clause.',
      focus: {
        nodeIds: [
          'w_n45006004010',
          'cl_s127_9',
          'w_n45006004027',
          'w_n45006004023',
          'w_n45006004011',
          'cl_s127_11',
          'w_n45006004012',
          'w_n45006004013',
          'w_n45006004021',
          'w_n45006004022',
          'w_n45006004024',
          'w_n45006004025',
          'w_n45006004026',
        ],
        relationIds: [
          'r_s127_28',
          'r_s127_10',
          'r_s127_24',
          'r_s127_23',
          'r_s127_21',
          'r_s127_12',
          'r_s127_13',
          'r_s127_22',
          'r_s127_27',
          'r_s127_26',
          'r_s127_25',
        ],
      },
      panZoom: { fit: 'nodes', padding: 160 },
      highlights: { emphasizedNodeIds: ['w_n45006004010', 'w_n45006004027', 'w_n45006004012'] },
      implication:
        'This is the destination of the whole grammar hook: union with Christ in his death and burial is never presented as an end in itself. It aims at a new way of living — walking, day by day, in a genuinely new kind of life, patterned after resurrection rather than death.',
      caution:
        '[[peripatesomen]] is subjunctive, not indicative — the mood itself marks this as a goal to pursue, not a report that it happens automatically. And as with the earlier aorists in these verses, resist turning "were baptized," "were buried," or "was raised" into a precise timeline: Paul\'s point in this passage is union with Christ and its moral consequence — a new manner of life — not a mechanical theory of exactly how or when baptism accomplishes that union.',
      greekTermIds: ['hina', 'peripatesomen'],
    },
  ],
  greekTerms: [
    {
      id: 'agnoeite',
      tokenId: 't_n45006003002',
      surface: 'ἀγνοεῖτε',
      transliteration: 'agnoeite',
      lemma: 'ἀγνοέω',
      gloss: 'are you unaware / do you not know',
      parsing: 'present active indicative, 2nd plural (in a negated rhetorical question)',
      explanation:
        'From ἀ- (a-, "not") + a root meaning "to know" — literally "to not know, to be ignorant of." Paired with the rhetorical ἢ (ē, "or"), it expects the answer "of course we know."',
      implication:
        'Paul treats what follows as common Christian knowledge, not new teaching — something the meaning of baptism already tells us once we think it through.',
    },
    {
      id: 'eis',
      tokenId: 't_n45006003006',
      surface: 'εἰς',
      transliteration: 'eis',
      lemma: 'εἰς',
      gloss: 'into',
      parsing: 'preposition governing the accusative case',
      explanation:
        'εἰς + accusative pictures motion INTO something, not merely being near or associated with it. Paul uses this exact construction twice in one verse — baptized "into Christ Jesus," baptized "into his death" — the same grammar of entry both times.',
      implication:
        'Translations render this "into" because that is what the case and preposition together actually say: baptism unites believers with Christ, not merely alongside him.',
    },
    {
      id: 'ebaptisthemen',
      tokenId: 't_n45006003005',
      surface: 'ἐβαπτίσθημεν',
      transliteration: 'ebaptisthēmen',
      lemma: 'βαπτίζω',
      gloss: 'we were baptized',
      parsing: 'aorist passive indicative, 1st plural',
      explanation:
        'Passive voice: this is something done TO believers, not something they perform themselves. The aorist views the baptizing as a simple, whole event rather than describing its inner stages.',
      caution:
        'The aorist does not mean "once for all" by itself — it simply views the action as a complete whole. Its theological weight here comes from Paul\'s argument, not from the tense form alone.',
    },
    {
      id: 'synetaphemen',
      tokenId: 't_n45006004001',
      surface: 'συνετάφημεν',
      transliteration: 'synetaphēmen',
      lemma: 'συνθάπτομαι',
      gloss: 'we were buried together with',
      parsing: 'aorist passive indicative, 1st plural',
      explanation:
        'Built from σύν (syn, "with, together") + a root meaning "to bury." The σύν- prefix is not decorative — compounds like this are one of Paul\'s regular ways of naming believers\' shared experience with Christ.',
      implication: 'One word does double duty: it names an action (burial) and a companion (Christ) at the same time.',
    },
    {
      id: 'auto',
      tokenId: 't_n45006004003',
      surface: 'αὐτῷ',
      transliteration: 'autō',
      lemma: 'αὐτός',
      gloss: 'with him',
      parsing: 'dative masculine singular pronoun',
      explanation:
        'A dative of association ("with him"), called for by the σύν- (syn-, "with") built into συνετάφημεν (synetaphēmen, "we were buried together with"). The case quietly confirms what the compound verb already says: this burial has a companion.',
    },
    {
      id: 'hina',
      tokenId: 't_n45006004010',
      surface: 'ἵνα',
      transliteration: 'hina',
      lemma: 'ἵνα',
      gloss: 'so that',
      parsing: 'subordinating conjunction introducing a purpose clause',
      explanation:
        'ἵνα regularly introduces a clause of purpose or result — the goal something aims at. Here it opens the reason burial-with-Christ matters: not burial for its own sake, but a new way of life on the other side of it.',
    },
    {
      id: 'peripatesomen',
      tokenId: 't_n45006004027',
      surface: 'περιπατήσωμεν',
      transliteration: 'peripatēsōmen',
      lemma: 'περιπατέω',
      gloss: 'we might walk / should walk',
      parsing: 'aorist active subjunctive, 1st plural',
      explanation:
        '"Walk" is a common biblical image for the pattern of a person\'s daily conduct. The subjunctive mood marks this as the goal set before believers, matched to Christ\'s resurrection by the ὥσπερ … οὕτως καί (hōsper … houtōs kai, "just as … so also") comparison earlier in the sentence.',
      caution:
        'Do not read the aorist subjunctive here as one isolated act of walking; the subjunctive mood already signals a purposed goal, and "walking" itself pictures an ongoing pattern of life, not a single event.',
    },
  ],
};
