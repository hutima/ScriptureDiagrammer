import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * 1 Timothy 2:11–15 — one of the most-discussed passages in the New
 * Testament. The steps show what the Greek sentence says and how its pieces
 * connect — what is coordinated with what, and where each appeal attaches.
 * The guide is written from a confessional Reformed / PCA stance
 * (the `confessionalFrame` leads with the complementarian reading as this
 * tradition's teaching, per the app owner's direction), while the
 * `debateSummary` keeps a genuinely fair statement of both major readings.
 * Authored against the bundled SBLGNT passages `sblgnt_1-timothy_16` (2:11),
 * `sblgnt_1-timothy_17` (2:12), and `sblgnt_1-timothy_18` (2:13–14) — dump
 * with `npm run guided:dump`.
 */
export const firstTimothy2: GrammarHighlightGuide = {
  id: 'guide-1-timothy-2-11-15',
  title: '1 Timothy 2:11–15 — a woman, learning, and two appeals',
  reference: '1 Timothy 2:11–15',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_1-timothy_16', 'sblgnt_1-timothy_17', 'sblgnt_1-timothy_18'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'advanced',
  topics: ['women in ministry', 'contested passage'],
  summary:
    'Paul instructs Timothy on women, learning, and authority in the church.',
  devotionalFrame:
    'Few passages carry as much pastoral weight as this one, and it deserves care. The steps below show what the Greek sentence actually says and how its pieces connect. This guide is written from a confessional Reformed stance that receives Paul’s instruction here — along with most of the church across its history — as a standing pattern for the church’s teaching offices, grounded not merely in the Ephesian situation but in the created order Paul appeals to in verse 13 (see the confessional note beneath the steps). Because this passage is debated more actively among evangelicals than most, the strongest form of the alternative reading is also summarized fairly below, with honest cautions for both. Read slowly, keep your Bible open beside the diagram, and let the text carry its full weight.',
  steps: [
    {
      id: 'step-let-her-learn',
      title: 'Let her learn, in quietness',
      passageId: 'sblgnt_1-timothy_16',
      body:
        'Paul’s sentence opens positively: [[manthaneto]], “let her learn” — a command, not only a restriction. The diagram puts γυνή (gynē, “a woman”) on the left of the subject–predicate divider and the imperative [[manthaneto]] on the right, with two phrases hanging beneath the verb: “in [[hesychia]]” and “in all submissiveness.” The instruction to learn comes first; the manner named alongside it is quietness and submissiveness — words this same letter also uses for a peaceable, orderly life (1 Timothy 2:2).',
      focus: {
        nodeIds: [
          'w_n54002011001',
          'w_n54002011004',
          'w_n54002011002',
          'w_n54002011003',
          'w_n54002011005',
          'w_n54002011006',
          'w_n54002011007',
        ],
        relationIds: ['r_s16_1', 'r_s16_2', 'r_s16_3', 'r_s16_4', 'r_s16_5', 'r_s16_6', 'r_s16_7'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n54002011001', 'w_n54002011004', 'w_n54002011003'] },
      implication:
        'Before anything is restricted, something is commanded: a woman is told to be a learner. In a setting where the theological training needed to teach had rarely, if ever, been given to women, being told to learn was itself significant.',
      caution:
        '[[hesychia]] describes a settled demeanor, not literal silence; the diagram shows it modifying HOW she learns, not whether she may speak at all.',
      greekTermIds: ['manthaneto', 'hesychia'],
    },
    {
      id: 'step-i-do-not-permit',
      title: 'One verb governs the whole sentence',
      passageId: 'sblgnt_1-timothy_17',
      body:
        'Verse 12 turns from command to restriction, and the diagram shows exactly how much weight rests on a single verb: [[epitrepo]], “I do not permit,” spoken by Paul in his own voice and joined to what came before by δέ (de, “and/but”). Everything that follows — “to teach,” “to exercise authority,” “but to be in quietness” — is one large complement clause hanging beneath this one verb as its direct object. The next two steps open up what is inside that clause.',
      focus: {
        nodeIds: ['cl_s17_0', 'w_n54002012005', 'w_n54002012002', 'cl_s17_2'],
        relationIds: ['r_s17_1', 'r_s17_21', 'r_s17_20'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n54002012005'] },
      implication:
        'Whatever Paul is restricting, the diagram shows it is restricted by one deliberate verb of permission — the same verb used elsewhere in the New Testament for granting or withholding permission in ordinary situations (e.g. Matthew 8:21; Acts 21:39–40).',
      greekTermIds: ['epitrepo'],
    },
    {
      id: 'step-oude-pair',
      title: 'Two infinitives, joined as one pair',
      passageId: 'sblgnt_1-timothy_17',
      body:
        'Inside that clause, the diagram shows a small coordinate structure: “to teach” (διδάσκειν, didaskein, with the woman named as its understood subject) and “to [[authentein]] over a man” are joined by [[oude]] (“nor”) into a single pair. [[authentein]] itself takes ἀνδρός (andros, “a man,” genitive) as its own object — the diagram draws that connection directly, a solid line from the infinitive to its object. Whatever Paul is not permitting is this joined pair, taken together.',
      focus: {
        nodeIds: [
          'cl_s17_3',
          'cl_s17_4',
          'cl_s17_8',
          'w_n54002012001',
          'w_n54002012003',
          'w_n54002012006',
          'w_n54002012007',
          'w_n54002012008',
        ],
        relationIds: ['r_s17_5', 'r_s17_6', 'r_s17_7', 'r_s17_9', 'r_s17_10', 'r_s17_11'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n54002012006', 'w_n54002012007'] },
      caution:
        'Coordination with [[oude]] shows these two actions are treated as a matched pair grammatically; it does not, by itself, say whether Paul means two closely related expressions of one problem or two distinct activities.',
      greekTermIds: ['authentein', 'oude'],
    },
    {
      id: 'step-not-but',
      title: 'A negative half, and a positive alternative',
      passageId: 'sblgnt_1-timothy_17',
      body:
        'Zooming out one level, the diagram shows that paired clause (teach / [[authentein]]) negated as a whole by οὐκ (ouk, “not”), then joined by ἀλλά (alla, “but”) to a second clause: “but to be in [[hesychia]]” — the same word for quietness used already in verse 11. Negative half and positive half stand side by side as one coordinate unit, and that whole unit is what [[epitrepo]] governs.',
      focus: {
        nodeIds: [
          'cl_s17_2',
          'w_n54002012004',
          'w_n54002012009',
          'cl_s17_13',
          'w_n54002012010',
          'w_n54002012011',
          'w_n54002012012',
        ],
        relationIds: ['r_s17_18', 'r_s17_12', 'r_s17_19', 'r_s17_17', 'r_s17_14', 'r_s17_16', 'r_s17_15'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n54002012004', 'w_n54002012009'] },
      implication:
        'The diagram lets you see plainly that Paul frames the restriction and its positive alternative as one balanced statement — not permitting X, but Y — echoing the same “quietness” named as the manner of learning back in verse 11.',
      greekTermIds: ['hesychia'],
    },
    {
      id: 'step-gar-adam-eve',
      title: 'For: the appeal to Adam and Eve',
      passageId: 'sblgnt_1-timothy_18',
      body:
        'Verses 13–14 are formally attached to what precedes by [[gar]] (“for”) — the diagram draws this connective joining the two sentences at the top level, marking everything that follows as Paul’s stated reason. The first sentence sets Adam and Eve side by side: Adam was formed πρῶτος (prōtos, “first”), then Eve. The second contrasts them again: Adam “was not deceived,” but the woman, [[exapatetheisa]] (“having been deceived”), “has come into transgression.” The diagram shows this participle feeding directly into the main verb as the stated reason for what happened to her.',
      focus: {
        nodeIds: [
          'cl_s18_0',
          'w_n54002013002',
          'cl_s18_2',
          'w_n54002013001',
          'w_n54002013003',
          'w_n54002013004',
          'cl_s18_14',
          'w_n54002014002',
          'w_n54002014003',
          'w_n54002014004',
          'cl_s18_13',
          'cl_s18_19',
          'w_n54002014007',
          'w_n54002014011',
          'cl_s18_23',
          'w_n54002014008',
        ],
        relationIds: [
          'r_s18_30',
          'r_s18_3',
          'r_s18_4',
          'r_s18_5',
          'r_s18_15',
          'r_s18_16',
          'r_s18_17',
          'r_s18_20',
          'r_s18_22',
          'r_s18_24',
          'r_s18_25',
          'r_s18_28',
          'r_s18_29',
        ],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n54002013002', 'w_n54002013001', 'w_n54002014007', 'w_n54002014008'],
      },
      implication:
        'The grammar is clear that Paul offers this pair of statements as support for verse 12, clear about the sequence (Adam, then Eve), and clear about who was and was not described as deceived. Paul reaches back past the Ephesian situation to the created order itself — which is why the historic, majority reading of the church has taken this appeal as grounding a lasting pattern for the church rather than a merely local fix. That is not the only reading held by faithful evangelicals, though, and the strongest form of the alternative is taken up fairly below.',
      caution:
        'Notice the two different verbs: Adam “was not deceived” (ἀπατάω, apataō); Eve is described with the compound ἐξαπατάω (exapataō), which many read as intensified — “thoroughly deceived.” The grammar records that difference; it does not by itself explain why the text draws it.',
      greekTermIds: ['gar', 'exapatetheisa'],
    },
  ],
  debateSummary: {
    issue:
      'What do Paul’s instruction not to permit a woman to teach or to αὐθεντεῖν (authentein, “exercise authority”) over a man (2:11–12), and his appeal to Adam and Eve (2:13–14), establish for the church: a permanent pattern for how the gathered church orders teaching and governing authority between men and women, or a corrective addressed to a specific problem in the Ephesian church?',
    views: [
      {
        label: 'Complementarian: the historic, majority reading, grounded in creation order',
        summary:
          'This is the reading the church has held through most of its history, and the majority reading among evangelicals today: Paul states a durable instruction for the gathered church, not a passing fix for a local crisis — a woman is not to teach or exercise authority over a man in that setting. Paul grounds the instruction not in the Ephesian situation but in the created order itself — Adam was formed first, then Eve, and Eve, not Adam, was deceived — pointing past the immediate circumstances to how God ordered the man–woman relationship from the beginning. On this view the ordinary sense of αὐθεντεῖν (authentein, “to exercise authority”) stands, and the instruction coheres with Paul’s comparable teaching elsewhere about the ordering of teaching and governing roles in the gathered assembly (e.g. 1 Corinthians 14:34–35).',
        cautions: [
          'This view has to take care that a restriction on teaching/governing roles in the gathered assembly is not extended beyond what the text addresses into every sphere of life or every kind of speech.',
          'It must hold the creation appeal alongside Paul’s full teaching elsewhere honoring women’s giftedness, ministry, and authority in other spheres (Romans 16; Philippians 4:2–3; Titus 2:3–5; Acts 18:26).',
        ],
      },
      {
        label: 'Egalitarian: a situational correction for Ephesus',
        summary:
          'On this reading, Paul answers a specific, local problem: false teachers had already led some astray in Ephesus (1 Timothy 1:3–7, 19–20), and women there appear among those vulnerable to being deceived by such teaching (compare 1 Timothy 5:13; 2 Timothy 3:6–7), likely owing to a lack of the theological training given to men. On this view αὐθεντεῖν (authentein) — a word found nowhere else in the New Testament and only rarely in surviving Greek of the period — may denote not ordinary teaching authority but something more forceful: to “domineer,” or to seize or assume authority illegitimately. Paul’s concern, then, is a specific, disruptive exercise of self-appointed authority by untrained women, not women teaching or leading as such; the appeal to Adam and Eve illustrates being deceived (paralleling the false teachers’ effect on the untrained) rather than stating a timeless creation ordinance for church office.',
        cautions: [
          'This view rests significant weight on a disputed sense of a very rare word, drawn from a small body of comparative evidence — that lexical case has to be argued on its own terms, not assumed.',
          'It should not flatten the Adam-and-Eve appeal into “mere illustration” if the flow of Paul’s argument (marked by γάρ, gar, “for”) suggests he intends it to carry more argumentative weight than that.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The diagram settles some things plainly: οὐδέ (oude, “nor”) ties “to teach” and “to αὐθεντεῖν” (authentein, “exercise authority”) into one coordinate pair, not two independent rules; ἀλλά (alla, “but”) sets a real, positive alternative (“but to be in quietness”) alongside the negated pair; and γάρ (gar, “for”) formally attaches the Adam-and-Eve sentences to verse 12 as Paul’s stated reason, grounding it in the creation account rather than leaving it unsupported. What the grammar cannot settle by itself: whether the present tense of ἐπιτρέπω (epitrepō, “I am not permitting”) expresses a timeless rule or a decision for a live situation — Greek present-tense verbs carry both uses, and only context can choose between them; and precisely what the rare verb αὐθεντεῖν, found nowhere else in the New Testament and rendered “exercise authority” by some and “domineer” by others, meant in ordinary use. Those are lexical, historical, and whole-canon questions, not questions the syntax diagram can answer on its own — it clarifies exactly what is joined to what and where each appeal attaches, and leaves the weighing to the reader, alongside sound teaching and pastoral counsel.',
  },
  confessionalFrame:
    'Historic confessional Reformed teaching has generally read this passage (together with parallel texts) as establishing a settled pattern that reserves the teaching and governing offices of the visible church to men, while fully affirming women’s indispensable ministry in prayer, in teaching children and other women (Titus 2:3–5), in prophecy (1 Corinthians 11:5), and in every spiritual gift not tied to those offices. This is offered here as one confessional tradition’s reading, clearly labelled and distinct from the fair summary of both views above — not as a substitute for weighing them.',
  greekTerms: [
    {
      id: 'manthaneto',
      tokenId: 't_n54002011004',
      surface: 'μανθανέτω',
      transliteration: 'manthanetō',
      lemma: 'μανθάνω',
      gloss: 'let her learn',
      parsing: 'present active imperative, 3rd singular',
      explanation:
        'The verb is positive: an imperative command to learn, not merely a prohibition. Third-singular imperatives like this are a common Greek way of giving an instruction about someone not directly addressed (“let her…” / “she is to…”).',
      implication:
        'The sentence opens with something commanded FOR the woman, not only something withheld from her: she is told to learn.',
      caution:
        'The present tense presents the learning as an ongoing process; by itself it does not say how long or in what circumstances the instruction applies — the tense describes how the action is pictured, not a rule about duration.',
    },
    {
      id: 'hesychia',
      tokenId: 't_n54002011003',
      surface: 'ἡσυχίᾳ',
      transliteration: 'hēsychia',
      lemma: 'ἡσυχία',
      gloss: 'quietness, tranquility',
      parsing: 'noun, dative feminine singular',
      explanation:
        'This noun describes a settled, peaceable demeanor — the same word this letter uses elsewhere for a peaceful, orderly life (1 Timothy 2:2). It is not the ordinary Greek word for being mute; “quietness” or “peaceableness” captures it better than “silence.”',
      caution:
        'Word meaning is not the whole picture — how the term functions in this argument, and alongside the New Testament’s fuller teaching about women’s speech and ministry, belongs to the larger interpretive question above.',
    },
    {
      id: 'epitrepo',
      tokenId: 't_n54002012005',
      surface: 'ἐπιτρέπω',
      transliteration: 'epitrepō',
      lemma: 'ἐπιτρέπω',
      gloss: 'I do not permit / I am not permitting',
      parsing: 'present active indicative, 1st singular',
      explanation:
        'Paul speaks in his own first-person voice: “I am not permitting.” The diagram shows this single verb governing everything that follows as one large complement clause — “to teach… nor to exercise authority… but to be in quietness” is all one thing that is, or is not, permitted.',
      caution:
        'Greek present-tense verbs can describe either a general, standing policy or a decision in a live situation; the tense form alone does not decide which sense Paul intends here — see the discussion above.',
    },
    {
      id: 'authentein',
      tokenId: 't_n54002012007',
      surface: 'αὐθεντεῖν',
      transliteration: 'authentein',
      lemma: 'αὐθεντέω',
      gloss: 'to exercise authority over',
      parsing: 'present active infinitive',
      explanation:
        'This verb occurs nowhere else in the New Testament (a hapax legomenon), and only rarely in surviving Greek from this period. The diagram shows it taking ἀνδρός (andros, “a man”) as its object, joined to διδάσκειν (didaskein, “to teach”) by οὐδέ (oude, “nor”). What the verb itself denotes — ordinary authority, or something more forceful like “domineer” or “usurp authority” — is a genuine lexical question.',
      implication:
        'Because the diagram can show exactly what αὐθεντεῖν is coordinated with and what its object is, it clarifies the sentence’s shape; it cannot, by grammar alone, settle which shade of meaning the rare verb carries.',
      caution:
        'Rare words are decided from a small number of surviving examples; readers should hold conclusions about this word with real caution in either direction.',
    },
    {
      id: 'oude',
      tokenId: 't_n54002012006',
      surface: 'οὐδὲ',
      transliteration: 'oude',
      lemma: 'οὐδέ',
      gloss: 'nor',
      parsing: 'correlative negative conjunction',
      explanation:
        'οὐδέ links διδάσκειν (didaskein, “to teach”) and αὐθεντεῖν (authentein, “to exercise authority”) into a single joined pair beneath one negation — grammatically, whatever is restricted is this pair taken together, not two separate, independent rules.',
      implication:
        'The diagram shows one coordinate node holding both infinitives; how the two actions relate in meaning — a single combined idea, two closely related actions, or two of a kind — is part of the passage’s wider debate.',
    },
    {
      id: 'gar',
      tokenId: 't_n54002013002',
      surface: 'γὰρ',
      transliteration: 'gar',
      lemma: 'γάρ',
      gloss: 'for',
      parsing: 'postpositive conjunction',
      explanation:
        'γάρ formally attaches what follows — the whole Adam-and-Eve sentence — to verse 12 as its stated ground. The diagram shows this connective joining the two sentences at the top level, so whatever verses 13–14 says is offered by Paul as a reason for verse 12, not a separate, unrelated thought.',
      implication:
        'The grammar is plain that an appeal to Adam and Eve is offered as support for what precedes it; exactly how that support works (as illustration, as an argument from creation order, or both) is where the larger debate begins.',
    },
    {
      id: 'exapatetheisa',
      tokenId: 't_n54002014008',
      surface: 'ἐξαπατηθεῖσα',
      transliteration: 'exapatētheisa',
      lemma: 'ἐξαπατάω',
      gloss: 'having been deceived',
      parsing: 'aorist passive participle, nominative feminine singular',
      explanation:
        'Verse 14 uses two related verbs: Adam “was not deceived” (ἀπατάω, apataō, v.14a), while the woman is described with the intensified compound ἐξαπατάω (exapataō), “having been thoroughly deceived.” The participle attaches as the reason feeding the main verb γέγονεν (gegonen, “has come to be”): she has come into transgression by way of having been deceived.',
      caution:
        'The aorist participle views the deceiving as a completed event prior to the coming-into-transgression; it does not by itself explain WHY only Eve is described this way — that question belongs to the wider discussion, not the grammar alone.',
    },
  ],
};
