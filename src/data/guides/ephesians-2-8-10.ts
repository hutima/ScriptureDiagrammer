import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Ephesians 2:8–10 — a gospel presentation: saved by grace, through faith, not
 * from works, unto good works. Bundled as four sentences —
 * `sblgnt_ephesians_12` (2:8a), `sblgnt_ephesians_13` (2:8b),
 * `sblgnt_ephesians_14` (2:9), `sblgnt_ephesians_15` (2:10); dump with
 * `npm run guided:dump -- sblgnt_ephesians_12 …`. The diagram hook: Paul's
 * prepositions do the theology — grace beneath the verb as its ground, διά
 * (dia) + faith as the channel, two ἐκ (ek) phrases NEGATED (not from
 * yourselves, not from works), and then ἔργον (ergon, "work") returning in
 * verse 10 under a different verb: no longer the source of salvation but the
 * prepared path of the saved.
 *
 * This guide is deliberately confessional (confessional Reformed) and
 * evangelistic rather than a survey of readings: no debateSummary, no
 * contested links, no alternate readings. Guardrails still bind: English
 * translations are affirmed; the τοῦτο (touto) antecedent is NOT overclaimed
 * (the gift is the whole saving reality, not narrowly "faith" proved by
 * grammar); tense claims stay within "how the action is viewed."
 */
export const ephesians2Gospel: GrammarHighlightGuide = {
  id: 'guide-ephesians-2-8-10',
  title: 'Ephesians 2:8–10 — saved by grace through faith',
  reference: 'Ephesians 2:8–10',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: [
    'sblgnt_ephesians_12',
    'sblgnt_ephesians_13',
    'sblgnt_ephesians_14',
    'sblgnt_ephesians_15',
  ],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  topics: ['gospel', 'grace', 'faith', 'good works'],
  summary:
    'A gospel presentation from Paul: God saves by grace through faith, not from works, and creates his people for good works.',
  devotionalFrame:
    'These three verses may be the clearest short summary of the gospel Paul ever wrote. They assume the bad news of the verses before them — "you were dead in trespasses and sins" (2:1) — because only the dead need saving. Dead people do not improve; they are raised. So watch what Paul hangs on which words: grace beneath the verb as its ground, faith as the channel it comes through, two firm "not from" phrases closing every door to self-rescue, and then — surprise — good works returning at the end, not as the price of salvation but as the path God prepared for the saved. If you have ever wondered whether God could accept you, these verses were written for you: salvation is his gift, received with empty hands.',
  confessionalFrame:
    'A confessional note (confessional Reformed): this guide reads Ephesians 2:8–10 the way the Reformation confessions do — salvation is by grace alone, through faith alone, in Christ alone, not on account of works, so that no one may boast. Grace is not God\'s help for those who first help themselves; it is his mercy to the spiritually dead. Faith is not the one work God rewards; it is the empty hand that receives Christ and all his benefits. And the faith that receives Christ is never barren: those saved by grace are God\'s workmanship, created in Christ Jesus for the good works he prepared beforehand. We are saved by faith alone, but the faith that saves is never alone.',
  steps: [
    {
      id: 'step-you-have-been-saved',
      title: '"You have been saved" — salvation is something done to you',
      passageId: 'sblgnt_ephesians_12',
      body:
        'Start at the heart of the diagram: the verb. Paul writes ἐστε [[sesosmenoi]] (este sesōsmenoi) — "you ARE having-been-saved," a two-word verb phrase the diagram draws as one predicate on the baseline. Two things about its form carry the gospel. It is PASSIVE: the Ephesians did not save themselves; saving was done TO them, by God. And it is a perfect participle with a present "you are": a completed rescue whose result is their present, settled condition. English translations render this exactly right — "you have been saved." Notice also what the verb is not: it is not "you have been improved," "instructed," or "encouraged." σῴζω (sōzō) is rescue language — what is done for the drowning, the dying, the dead (2:1,5). The gospel does not begin with advice; it begins with what God has done.',
      focus: {
        nodeIds: ['w_s12_1'],
        relationIds: ['r_s12_2'],
      },
      panZoom: { fit: 'nodes', padding: 160 },
      highlights: { emphasizedNodeIds: ['w_s12_1'] },
      implication:
        'Salvation is God\'s finished act before it is the believer\'s ongoing response. A Christian\'s standing does not rest on today\'s performance but on a rescue already accomplished and still in force.',
      caution:
        'The perfect views a past act together with its standing result — it does not by itself promise "once saved, always saved" as a grammatical fact. Assurance in this passage comes from WHO saves (vv. 8–10 as a whole), not from a tense form alone.',
      greekTermIds: ['sesosmenoi'],
    },
    {
      id: 'step-by-grace',
      title: '"By grace" — God\'s initiative stands at the front',
      passageId: 'sblgnt_ephesians_12',
      body:
        'Now look at what hangs beneath the verb. Τῇ γὰρ [[chariti]] (tē gar chariti) — "for by grace" — is the sentence\'s very first phrase, and the diagram slants it under "you have been saved" as the ground on which the rescue rests. Grace, χάρις (charis), is undeserved favor: not a reward for the deserving, not assistance for those who first make themselves worthy, but God\'s free kindness to people who were "dead in trespasses" and "children of wrath" (2:1–3). The little word γάρ (gar, "for") tells you Paul is explaining verses 4–7 — the God who is "rich in mercy" and whose "great love" made us alive with Christ. Grace is where the explanation starts because God is where salvation starts.',
      focus: {
        nodeIds: ['w_n49002008003', 'w_n49002008001', 'w_n49002008002', 'w_s12_1'],
        relationIds: ['r_s12_4', 'r_s12_3', 'r_s12_7'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n49002008003'] },
      implication:
        'The gospel is good news, not good advice, because its first cause is God\'s generosity, not our effort. If salvation begins in grace, it cannot be forfeited by the weakness that grace stooped to save.',
      greekTermIds: ['chariti'],
    },
    {
      id: 'step-through-faith',
      title: '"Through faith" — the open hand that receives',
      passageId: 'sblgnt_ephesians_12',
      body:
        'A second phrase hangs beneath the same verb: διὰ [[pisteos]] (dia pisteōs), "through faith." The preposition matters. Paul does not say we are saved "because of" our faith or "on the basis of" faith, as though faith were the payment; διά (dia) with this case marks the channel something comes THROUGH. Grace is the ground; faith is the open hand that receives what grace gives. The diagram makes the pairing visible: two phrases, side by side under one verb — by grace, through faith — cause and channel, gift and reception. Faith does not purchase salvation any more than a beggar\'s outstretched hand purchases bread. It looks away from itself to Christ, and in receiving him receives everything.',
      focus: {
        nodeIds: ['w_n49002008006', 'w_n49002008007', 'w_s12_1'],
        relationIds: ['r_s12_6', 'r_s12_5'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n49002008006', 'w_n49002008007'] },
      implication:
        'Salvation is through faith ALONE, but faith is not the one work God accepts in place of the others — it is not a work at all in that sense. It is the instrument, never the merit; the receiving, never the earning.',
      caution:
        'Do not let "faith alone" shrink into "belief that costs nothing." Faith receives a PERSON — Christ — and entrusting yourself to him reorders everything (as verse 10 is about to show).',
      greekTermIds: ['pisteos'],
    },
    {
      id: 'step-gods-gift',
      title: '"Not from yourselves — it is God\'s gift"',
      passageId: 'sblgnt_ephesians_13',
      body:
        'Paul now stops, points back at everything he has just said, and closes a door: καὶ [[touto]] οὐκ ἐξ ὑμῶν (kai touto ouk ex hymōn) — "and this — not from yourselves." The diagram draws it as its own little clause: the subject [[touto]] ("this"), a negated "from" phrase where a source would stand, and no verb at all — Greek can leave "is" unwritten, and the bluntness is part of the force. Then comes the positive counterpart, another verbless clause: θεοῦ τὸ [[doron]] (theou to dōron) — "GOD\'S is the gift," with "God\'s" thrown forward for emphasis. The whole saving reality Paul has just described — being saved by grace through faith — is not from ourselves but is God\'s gift. Salvation does not start in us, is not achieved by us, and is not financed by us. From first to last it is given.',
      focus: {
        nodeIds: [
          'w_n49002008009',
          'w_n49002008010',
          'w_n49002008011',
          'w_n49002008012',
          'w_n49002008013',
          'w_n49002008015',
        ],
        relationIds: ['r_s13_3', 'r_s13_4', 'r_s13_6', 'r_s13_5', 'r_s13_12', 'r_s13_11'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n49002008009', 'w_n49002008015', 'w_n49002008013'] },
      implication:
        'A gift can only be received, never invoiced. If the whole of salvation — grace, rescue, and the very faith that receives it — comes wrapped as God\'s gift, then the believer\'s posture is forever gratitude, not negotiation.',
      caution:
        '[[touto]] is neuter, while both "grace" and "faith" are feminine nouns — so the grammar alone does not single out faith as the gift\'s narrow antecedent. The stronger and safer reading needs no such claim: Paul\'s "this" gathers up the WHOLE saving event just described, faith included within it, and calls it all God\'s gift.',
      greekTermIds: ['touto', 'doron'],
    },
    {
      id: 'step-not-from-works',
      title: '"Not from works, so that no one may boast"',
      passageId: 'sblgnt_ephesians_14',
      body:
        'Paul closes a second door, and this one has a stated reason. οὐκ ἐξ [[ergon]] (ouk ex ergōn) — "not from works" — repeats the same "from" preposition he has just denied: salvation\'s SOURCE is not our doing, our record, our religious or moral achievement. Then the diagram shows a purpose clause hanging beneath, introduced by ἵνα (hina, "so that"): μή τις [[kauchesetai]] (mē tis kauchēsētai) — "so that no one may boast." The logic is airtight. If salvation were from works, even in part, the saved could claim even that part of the credit; heaven would have a wing built on human bragging rights. God has arranged salvation precisely so that this can never happen. Where works are excluded from the ground of salvation, boasting is excluded from its result — "so that the one who boasts must boast in the Lord" (1 Corinthians 1:31).',
      focus: {
        nodeIds: [
          'w_n49002009001',
          'w_n49002009002',
          'w_n49002009003',
          'w_n49002009006',
          'w_n49002009007',
        ],
        relationIds: ['r_s14_2', 'r_s14_4', 'r_s14_3', 'r_s14_9', 'r_s14_6', 'r_s14_8'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n49002009003', 'w_n49002009007'] },
      implication:
        'The gospel humbles utterly and comforts utterly with the same stroke: nothing of yours contributed to your salvation, so nothing of yours can disqualify you from grace. All the glory goes to God — which is exactly where a saved sinner wants it.',
      greekTermIds: ['ergon', 'kauchesetai'],
    },
    {
      id: 'step-created-for-good-works',
      title: 'Created in Christ Jesus for good works — the gift bears fruit',
      passageId: 'sblgnt_ephesians_15',
      body:
        'Verse 10 is the surprise ending — and the diagram lets you watch Paul relocate a word. αὐτοῦ γάρ ἐσμεν [[poiema]] (autou gar esmen poiēma): "for we are HIS workmanship," with "his" thrown to the front of the sentence. Beneath it hangs [[ktisthentes]] (ktisthentes, "created") — creation language, the same passive pattern as verse 8: God acts, we are made. And where are we created? ἐν [[christo]] Ἰησοῦ (en Christō Iēsou), "in Christ Jesus" — union with Christ is where the new creation happens. Now watch the relocated word: [[ergois]] (ergois, "works") — the very noun verse 9 excluded — reappears, but hanging under a different verb. Works stood beneath "saved" as a denied SOURCE ("not from works"); now good works stand beneath "created" as the stated PURPOSE. And they come prepared: οἷς [[proetoimasen]] ὁ θεός (hois proētoimasen ho theos), "which God prepared beforehand, so that we might [[peripatesomen]] — walk — in them." Grace does not produce lawless people; it produces God\'s handiwork, walking a road God paved in advance.',
      focus: {
        nodeIds: [
          'w_n49002010004',
          'w_n49002010001',
          'w_n49002010005',
          'w_n49002010007',
          'w_n49002010010',
          'w_n49002010013',
          'w_n49002010019',
        ],
        relationIds: ['r_s15_3', 'r_s15_2', 'r_s15_23', 'r_s15_8', 'r_s15_22', 'r_s15_21', 'r_s15_18'],
      },
      panZoom: { fit: 'whole-diagram', padding: 60 },
      highlights: {
        emphasizedNodeIds: ['w_n49002010004', 'w_n49002010007', 'w_n49002010010'],
      },
      implication:
        'Paul teaches that salvation is God\'s gracious gift, received through faith and not earned by works. Because salvation is not from us, boasting is excluded. Yet grace does not leave the believer unchanged: those saved in Christ are God\'s workmanship, created for the good works God prepared beforehand. Works are not the root of salvation but its fruit — not the price of grace but the path of the graced.',
      caution:
        'Do not swing to the opposite error: verse 10 never makes good works optional. The same God who saves apart from works prepares works for the saved — a Christian without any fruit is a contradiction this passage does not allow. We are saved by faith alone, but the faith that saves is never alone.',
      greekTermIds: ['poiema', 'ktisthentes', 'christo', 'ergois', 'proetoimasen', 'peripatesomen'],
    },
  ],
  greekTerms: [
    {
      id: 'sesosmenoi',
      tokenId: 't_n49002008005',
      surface: 'σεσῳσμένοι',
      transliteration: 'sesōsmenoi',
      lemma: 'σῴζω',
      gloss: 'having been saved',
      parsing: 'perfect passive participle, nominative masculine plural (with ἐστε, este, "you are" — a periphrastic perfect)',
      explanation:
        '"Saved" — rescue language, paired with "you are" to say: a completed rescue whose result is your present condition. The passive voice puts the acting entirely on God\'s side: the saved did not save themselves.',
      implication:
        'The believer\'s standing rests on an accomplished act of God, not on today\'s spiritual performance.',
      caution:
        'The perfect presents a past act with a standing result; it is a portrait of the rescue\'s completeness, not a grammatical proof-text about perseverance on its own.',
    },
    {
      id: 'chariti',
      tokenId: 't_n49002008003',
      surface: 'χάριτί',
      transliteration: 'chariti',
      lemma: 'χάρις',
      gloss: 'by grace',
      parsing: 'noun, dative feminine singular (dative of cause/means: the ground of the saving)',
      explanation:
        '"Grace" — God\'s free, undeserved favor. The dative hangs it beneath the verb as the basis on which the rescue happened, and Paul fronts it to the head of the sentence: grace leads his whole explanation.',
      implication:
        'Grace is mercy to the undeserving — not assistance to those who first make themselves worthy. Salvation begins in God\'s generosity.',
    },
    {
      id: 'pisteos',
      tokenId: 't_n49002008007',
      surface: 'πίστεως',
      transliteration: 'pisteōs',
      lemma: 'πίστις',
      gloss: 'faith',
      parsing: 'noun, genitive feminine singular (object of διά, dia, "through")',
      explanation:
        '"Faith" — trust that receives. With διά (dia, "through") it names the channel salvation comes through, not the payment it costs: grace gives, faith receives.',
      implication:
        'Faith is the instrument of salvation, never its merit — an open hand, not a wage.',
      caution:
        'Faith\'s power lies entirely in the One it lays hold of. It saves because it receives Christ, not because believing is itself a meritorious act.',
    },
    {
      id: 'touto',
      tokenId: 't_n49002008009',
      surface: 'τοῦτο',
      transliteration: 'touto',
      lemma: 'οὗτος',
      gloss: 'this',
      parsing: 'demonstrative pronoun, nominative neuter singular',
      explanation:
        '"This" — Paul\'s backward point at what he has just said. Being neuter, it most naturally sweeps up the whole preceding statement — the entire being-saved-by-grace-through-faith — and declares all of it "not from yourselves."',
      caution:
        'Because "grace" and "faith" are both feminine, the neuter does not grammatically single out "faith" as the gift. No overclaim is needed: the gift is the whole saving reality, and faith is inside it.',
    },
    {
      id: 'doron',
      tokenId: 't_n49002008015',
      surface: 'δῶρον',
      transliteration: 'dōron',
      lemma: 'δῶρον',
      gloss: 'gift',
      parsing: 'noun, nominative neuter singular (predicate of a verbless clause; θεοῦ, theou, "God\'s" stands first for emphasis)',
      explanation:
        '"Gift" — a present, freely given. The clause has no verb, just the stark equation "God\'s — the gift," with "God\'s" thrown forward: whatever salvation is, its giver is God.',
      implication:
        'A gift is received, not earned, and it says at least as much about the giver\'s heart as the receiver\'s worth.',
    },
    {
      id: 'ergon',
      tokenId: 't_n49002009003',
      surface: 'ἔργων',
      transliteration: 'ergōn',
      lemma: 'ἔργον',
      gloss: 'works',
      parsing: 'noun, genitive neuter plural (object of ἐκ, ek, "from, out of")',
      explanation:
        '"Works" — deeds, achievements, one\'s moral and religious record. With the negated ἐκ (ek, "from"), Paul denies that works are salvation\'s SOURCE. Watch this same noun return in verse 10 under a different verb — as purpose, not source.',
      implication:
        'Nothing you have done qualified you for salvation, and nothing you have failed to do disqualifies you from grace.',
    },
    {
      id: 'kauchesetai',
      tokenId: 't_n49002009007',
      surface: 'καυχήσηται',
      transliteration: 'kauchēsētai',
      lemma: 'καυχάομαι',
      gloss: 'may boast',
      parsing: 'aorist middle subjunctive, 3rd person singular (in a ἵνα μή, hina mē, "so that not" purpose clause)',
      explanation:
        '"Boast" — to claim credit, to glory in oneself. The purpose clause states why God arranged salvation without works at its root: so that no person could ever stand in heaven pointing at themselves.',
      implication:
        'A works-based salvation would manufacture pride; a grace-based salvation manufactures praise. God gets all the glory — and the saved sinner is glad of it.',
    },
    {
      id: 'poiema',
      tokenId: 't_n49002010004',
      surface: 'ποίημα',
      transliteration: 'poiēma',
      lemma: 'ποίημα',
      gloss: 'workmanship, handiwork',
      parsing: 'noun, nominative neuter singular (predicate nominative; αὐτοῦ, autou, "his" fronted for emphasis)',
      explanation:
        '"Workmanship" — a thing made, a work of craftsmanship. Paul flips the vocabulary of "works" on its head: before we ever work for God, we ARE God\'s work. "His" stands first in the Greek sentence: HIS handiwork is what we are.',
      implication:
        'The Christian life is not self-construction. Whatever good is being built in a believer has a Maker, and the Maker signs his work.',
    },
    {
      id: 'ktisthentes',
      tokenId: 't_n49002010005',
      surface: 'κτισθέντες',
      transliteration: 'ktisthentes',
      lemma: 'κτίζω',
      gloss: 'having been created',
      parsing: 'aorist passive participle, nominative masculine plural',
      explanation:
        '"Created" — the Bible\'s word for what only God does. It is passive, like "having been saved" in verse 8: the same pattern of divine action and human receiving. Salvation is nothing less than new creation (2 Corinthians 5:17).',
      caution:
        'The aorist simply views the creating as a whole event; the emphasis is on WHO creates, not on a tense-derived timetable.',
    },
    {
      id: 'christo',
      tokenId: 't_n49002010007',
      surface: 'Χριστῷ',
      transliteration: 'Christō',
      lemma: 'Χριστός',
      gloss: 'Christ',
      parsing: 'proper noun, dative masculine singular (object of ἐν, en, "in"; with Ἰησοῦ, Iēsou, "Jesus" in apposition)',
      explanation:
        '"In Christ Jesus" — Paul\'s signature phrase for union with Christ, the place where the new creation happens. Grace, faith, gift, and new life are not abstractions; they are found in a person, or not at all.',
      implication:
        'Salvation is in Christ ALONE: to be saved is to be joined to him — created in him, alive in him, and carried by him.',
    },
    {
      id: 'ergois',
      tokenId: 't_n49002010010',
      surface: 'ἔργοις',
      transliteration: 'ergois',
      lemma: 'ἔργον',
      gloss: 'works',
      parsing: 'noun, dative neuter plural (object of ἐπί, epi, "for, unto"; with ἀγαθοῖς, agathois, "good")',
      explanation:
        'The same noun verse 9 excluded, now welcomed back in a new position: with ἐπί (epi, "for"), good works are the goal we were created FOR — not the source we were saved FROM. Same word, different preposition, opposite role.',
      implication:
        'Grace relocates works: out of salvation\'s foundation, into salvation\'s purpose. Works are the fruit of the rescue, never its root.',
    },
    {
      id: 'proetoimasen',
      tokenId: 't_n49002010013',
      surface: 'προητοίμασεν',
      transliteration: 'proētoimasen',
      lemma: 'προετοιμάζω',
      gloss: 'prepared beforehand',
      parsing: 'aorist active indicative, 3rd person singular (subject: ὁ θεός, ho theos, "God")',
      explanation:
        '"Prepared beforehand" — God readied the good works in advance, the way a host sets a table before the guests arrive. Even the believer\'s obedience travels a road God paved first.',
      implication:
        'Grace goes ahead of us at every step: God prepared the salvation, gives the faith-received gift, and has already prepared the path of the new life.',
    },
    {
      id: 'peripatesomen',
      tokenId: 't_n49002010019',
      surface: 'περιπατήσωμεν',
      transliteration: 'peripatēsōmen',
      lemma: 'περιπατέω',
      gloss: 'we might walk',
      parsing: 'aorist active subjunctive, 1st person plural (in a ἵνα, hina, "so that" purpose clause)',
      explanation:
        '"Walk" — the Bible\'s everyday picture for a way of life. The passage that began with us dead (2:1) ends with us walking; the purpose clause makes the new life the stated goal of the new creation.',
      implication:
        'The gospel\'s finish line is not a decision card but a transformed daily walk — ordinary steps, on a prepared road, in Christ.',
    },
  ],
};
