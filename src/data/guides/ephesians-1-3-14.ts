import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Ephesians 1:3–14 — in Greek this is ONE sentence (the longest in the New
 * Testament), a cascade of participles and prepositional phrases hanging off
 * a single opening shout of praise: "Blessed [be] God … who has blessed us."
 * English Bibles break it into several sentences for readability; this guide
 * walks across four of the bundled SBLGNT sentence-units that correspond to
 * that one long period — `sblgnt_ephesians_2` (1:3–6), `sblgnt_ephesians_3`
 * (1:7–10), `sblgnt_ephesians_4` (1:11–12), and `sblgnt_ephesians_5` (1:13–14)
 * — dump all four with `npm run guided:dump` to see the real ids.
 */
export const ephesians1: GrammarHighlightGuide = {
  id: 'guide-ephesians-1-3-14',
  title: 'Ephesians 1:3–14 — one long, breathless blessing',
  reference: 'Ephesians 1:3–14',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: [
    'sblgnt_ephesians_2',
    'sblgnt_ephesians_3',
    'sblgnt_ephesians_4',
    'sblgnt_ephesians_5',
  ],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'advanced',
  summary:
    'In Greek, Ephesians 1:3–14 is one unbroken sentence — the longest in the New Testament. The diagram shows why: everything hangs from one opening shout of praise, keeps circling back to the phrase "in Christ," and keeps landing, three separate times, on the same refrain — "to the praise of his glory."',
  devotionalFrame:
    'Open your own Bible alongside this diagram. Your translation almost certainly breaks these twelve verses into several sentences — a kindness to the English reader, since Paul does not pause for one breath in the Greek. As you move through the steps, watch two things: how often the phrase "in Christ" (or "in him," "in whom") recurs, and how the sentence keeps resolving into the same note of praise. This passage is not a theological outline to be dissected; it is a single, overflowing blessing, and the grammar itself is part of the good news.',
  steps: [
    {
      id: 'step-blessed-be-god',
      title: "A shout of praise, before there's even a verb",
      passageId: 'sblgnt_ephesians_2',
      body:
        'Paul opens with a single word, [[eulogetos]] — "Blessed…" — followed immediately by "God," and nothing else. No verb yet. The oldest kind of Jewish praise simply cries an adjective over God before saying anything further about him. Almost at once, though, a participle steps in to do the sentence\'s real work: [[eulogesas]], "the one having blessed us." From here the participle reaches for its favorite phrase, repeated across this whole passage: [[enChristo]], "in Christ." Watch for that phrase — it will not let go for the rest of the sentence.',
      focus: {
        nodeIds: [
          'cl_s2_0',
          'impl_cl_s2_0',
          'w_n49001003001',
          'w_n49001003003',
          'cl_s2_11',
          'w_n49001003012',
          'w_n49001003021',
          'w_n49001003022',
        ],
        relationIds: ['r_s2_1', 'r_s2_2', 'r_s2_76', 'r_s2_12', 'r_s2_22', 'r_s2_21'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: {
        emphasizedNodeIds: ['w_n49001003001', 'w_n49001003012', 'w_n49001003022'],
      },
      implication:
        'The letter\'s very first move is worship, not argument. Everything the rest of this passage says — election, redemption, the Spirit — is unpacked as REASONS for this one opening shout of blessing, not the other way around.',
      caution:
        'A verbless opening like this is not a hidden signal or a puzzle to solve — it is the ordinary shape of a Jewish benediction (compare Psalm 41:13 LXX; 2 Corinthians 1:3; 1 Peter 1:3). English translations rightly supply "Blessed be God," because that is exactly what the Greek means.',
      greekTermIds: ['eulogetos', 'eulogesas', 'enChristo'],
    },
    {
      id: 'step-chosen-in-love',
      title: 'Chosen and predestined — inside the blessing, not instead of it',
      passageId: 'sblgnt_ephesians_2',
      body:
        'The two verbs most readers associate with "predestination" both appear here: [[exelexato]], "he chose us" (v. 4), and [[proorisas]], "having predestined us" (v. 5). Notice where the diagram puts them — not standing on their own as a separate topic, but nested two layers beneath the main participle "having blessed," introduced by "just as" (καθὼς). Follow the line further and both verbs lead, a few words later, into the sentence\'s first refrain: [[epainon]], "praise" — "to the praise of his glorious grace." Grammatically, the goal of God\'s choosing is stated outright: praise.',
      focus: {
        nodeIds: [
          'w_n49001004002',
          'cl_s2_23',
          'w_n49001005001',
          'cl_s2_42',
          'w_n49001006001',
          'w_n49001006002',
          'w_n49001006003',
        ],
        relationIds: [
          'r_s2_74',
          'r_s2_24',
          'r_s2_43',
          'r_s2_73',
          'r_s2_72',
          'r_s2_71',
          'r_s2_70',
        ],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n49001004002', 'w_n49001005001', 'w_n49001006002'],
      },
      implication:
        'The sentence never lets "chosen" and "predestined" stand alone as a cold decree. Both verbs are grammatically subordinate to the opening praise, and both are aimed — by the sentence\'s own structure — at more praise. Whatever else these words mean, their stated function here is doxology and assurance, not anxiety.',
      caution:
        'The aorist tense of both verbs simply views God\'s choosing and predestining as complete, whole acts — it does not by itself decide the timing, scope, or mechanism that later doctrinal debates raise (see this guide\'s debate summary). The grammar\'s clearest claim is about WHERE this happens ("in him," v. 4) and WHAT FOR ("to the praise of his glory") — not a full answer to how divine choice and human choice relate.',
      greekTermIds: ['exelexato', 'proorisas', 'epainon'],
    },
    {
      id: 'step-in-whom-redemption',
      title: 'In him we have redemption — and all things united in Christ',
      passageId: 'sblgnt_ephesians_3',
      body:
        'A new sentence begins in most English Bibles, but the Greek keeps circling back: [[enHo]], "in whom," picks up exactly where "in Christ" left off. "In him we have redemption through his blood" — the same anchor, a new gift. A few lines later the scope widens dramatically: God\'s plan, once hidden and now disclosed (a μυστήριον — a truth revealed, not a riddle left unsolved), is "to unite all things in Christ, things in heaven and things on earth." The personal blessing of verses 3–6 turns out to be one thread inside a plan for the whole creation — and the anchor point does not change.',
      focus: {
        nodeIds: [
          'cl_s3_0',
          'w_n49001007001',
          'w_n49001007002',
          'w_n49001007003',
          'w_n49001007005',
          'cl_s3_45',
          'w_n49001010007',
          'w_n49001010009',
          'w_n49001010012',
        ],
        relationIds: [
          'r_s3_1',
          'r_s3_2',
          'r_s3_3',
          'r_s3_13',
          'r_s3_46',
          'r_s3_48',
          'r_s3_50',
          'r_s3_51',
        ],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n49001007002', 'w_n49001010007', 'w_n49001010012'],
      },
      implication:
        'Redemption for "us" (vv. 3–6) and the summing-up of "all things" (vv. 9–10) are not two different topics — grammatically they are both located "in Christ" and "in him." The sentence keeps insisting that nothing it describes happens anywhere else.',
      caution:
        '"Mystery" (μυστήριον) in Paul does not mean an unsolved puzzle or a secret code — it names something God kept hidden and has now made known. The word points to disclosure, not to esoteric knowledge for a select few.',
      greekTermIds: ['enHo'],
    },
    {
      id: 'step-marked-as-his-own',
      title: "Marked as God's own — the second refrain",
      passageId: 'sblgnt_ephesians_4',
      body:
        'The sentence loops back to its anchor a third time: "in him" ([[enHo]]) "we too were made [God\'s] own" — the diagram shows this main verb, then a participle beneath it, προορισθέντες, "having been predestined." It is the same verb family as [[proorisas]] two steps ago, now describing what happened TO us rather than what God did. What follows is worth lingering over: "according to the purpose (πρόθεσιν) of the one who works all things according to the counsel (βουλὴν) of his will" — words of settled, personal intention, not blind fate. And the whole clause resolves, again, into [[epainon]] — the second time this sentence says "to the praise of his glory."',
      focus: {
        nodeIds: [
          'cl_s4_0',
          'w_n49001011001',
          'w_n49001011002',
          'w_n49001011004',
          'w_n49001011005',
          'w_n49001012003',
          'w_n49001012005',
          'w_n49001012006',
          'w_n49001012007',
          'w_n49001012008',
        ],
        relationIds: [
          'r_s4_1',
          'r_s4_2',
          'r_s4_3',
          'r_s4_6',
          'r_s4_20',
          'r_s4_22',
          'r_s4_25',
          'r_s4_26',
          'r_s4_23',
        ],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n49001011002', 'w_n49001011005', 'w_n49001012006'],
      },
      implication:
        'The refrain is not decoration — the sentence structures itself around it. Each time Paul names something God has done (choosing and predestining in vv. 4–6; making us his own in vv. 11–12), the grammar routes that action toward the same destination: praise for God\'s glory.',
      caution:
        'Words like "purpose," "counsel," and later "good pleasure" describe a Father\'s settled intention, not an impersonal mechanism. The passage\'s own vocabulary keeps this warm — resist letting the English word "predestined," heard on its own, flatten that.',
      greekTermIds: ['enHo', 'epainon'],
    },
    {
      id: 'step-sealed-with-the-spirit',
      title: 'Sealed with the Spirit — the third refrain, and the guarantee',
      passageId: 'sblgnt_ephesians_5',
      body:
        'The sentence turns, for the first time, from "we" to "you also" — the letter\'s Gentile readers are drawn into the same blessing. "In him" ([[enHo]]) "you also, having heard… having believed, were sealed with the promised Holy Spirit, who is the guarantee (ἀρραβὼν) of our inheritance." A down payment, a pledge of what is still to come. And then, a third and final time, the sentence lands on [[epainon]]: "to the praise of his glory." Twelve verses, one sentence, three refrains — the whole cascade of blessing, election, redemption, and sealing was always moving toward this one note.',
      focus: {
        nodeIds: [
          'cl_s5_0',
          'w_n49001013019',
          'w_n49001013001',
          'w_n49001013002',
          'w_n49001013004',
          'cl_s5_18',
          'w_n49001013018',
          'cl_s5_24',
          'w_n49001014002',
          'w_n49001014003',
          'w_n49001013021',
          'w_n49001014012',
          'w_n49001014014',
          'w_n49001014015',
        ],
        relationIds: [
          'r_s5_1',
          'r_s5_2',
          'r_s5_3',
          'r_s5_5',
          'r_s5_19',
          'r_s5_23',
          'r_s5_25',
          'r_s5_30',
          'r_s5_36',
          'r_s5_37',
          'r_s5_44',
          'r_s5_45',
          'r_s5_46',
          'r_s5_42',
        ],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: [
          'w_n49001013002',
          'w_n49001013021',
          'w_n49001014003',
          'w_n49001014012',
        ],
      },
      implication:
        'The sentence that opened with a wordless shout of blessing closes with a Spirit given as a guarantee. The grammar\'s whole arc — from "Blessed be God" to "sealed… to the praise of his glory" — is designed to leave the reader not with a settled argument but with settled confidence.',
      caution:
        '"Having heard… having believed" describes how these Gentile readers came to be included in the blessing already lavished on "us" — it is not a checklist that earns the sealing. The sentence keeps the initiative with God (he blessed, chose, predestined, and sealed) from its very first word to its last.',
      greekTermIds: ['enHo', 'epainon'],
    },
  ],
  debateSummary: {
    issue:
      'What do "he chose us" (ἐξελέξατο, v. 4) and "having predestined us" (προορίσας, v. 5; προορισθέντες, v. 11) mean for how God\'s choice relates to human faith?',
    views: [
      {
        label: 'Unconditional election (classical Reformed reading)',
        summary:
          'God\'s choice of particular people for salvation "before the foundation of the world" (v. 4) rests entirely in his own gracious will, not on anything foreseen in the people chosen — the passage\'s own phrase is "according to the good pleasure of his will" (v. 5), not "according to foreseen faith."',
        cautions: [
          'Read apart from this passage\'s own doxological setting, the doctrine can sound cold or fatalistic — which is exactly the tone this sentence never takes.',
        ],
      },
      {
        label: 'Corporate / Christ-centered election',
        summary:
          'The repeated anchor "in Christ" / "in him" (vv. 4, 11) is the key: God\'s primary choice is of Christ himself, and believers are "chosen" by being joined to him through faith — the emphasis falls on the church\'s identity in Christ more than on a pre-temporal list of individual names.',
        cautions: [
          'This reading has to give a full account of the very personal "us" and "we" language that runs through the whole passage, not only the corporate "in him."',
        ],
      },
      {
        label: 'Conditional election (foreknowledge-based reading)',
        summary:
          'God\'s choice, while real and gracious, is grounded in his foreknowledge of who would respond in faith — election described here as an outworking of God\'s foreknowledge rather than a choice made without reference to it.',
        cautions: [
          'Critics note the passage grounds the choice in God\'s own will and pleasure (v. 5, v. 11) rather than explicitly naming foreseen faith as its basis.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The grammar is unambiguous about two things: WHERE the choosing happens ("in him," vv. 4, 11 — never apart from Christ) and WHAT it is FOR (the three-fold refrain "to the praise of his glory," vv. 6, 12, 14). It is far less clear about HOW God\'s choice relates to human believing — that question is answered from the passage\'s theology and from the rest of Scripture, not from parsing this one long sentence. The diagram can show you the shape of Paul\'s confidence here; it cannot settle centuries of careful debate for you.',
  },
  confessionalFrame:
    'A confessional note (confessional Reformed reading): the Thirty-Nine Articles (Article XVII, "Of Predestination and Election") read passages like this as teaching a real, gracious, unconditional election "in Christ" — but insist, in the same breath, that the doctrine is properly received only as Paul presents it here: full of praise, addressed to believers for their comfort, never as a tool for speculating about anyone else\'s standing before God. Other faithful Christian traditions read the "chose / predestined" language differently, as the debate summary above shows fairly; this note simply names where this app\'s own confessional heritage sits, not the only faithful reading of the passage.',
  greekTerms: [
    {
      id: 'eulogetos',
      tokenId: 't_n49001003001',
      surface: 'Εὐλογητὸς',
      transliteration: 'eulogētos',
      lemma: 'εὐλογητός',
      gloss: 'blessed',
      parsing: 'adjective, nominative masculine singular',
      explanation:
        'The very first word of the whole twelve-verse sentence, with no verb yet supplied — the oldest kind of Jewish praise simply cries this adjective over God before saying anything further about him (compare Psalm 41:13 LXX; 2 Corinthians 1:3; 1 Peter 1:3).',
      implication:
        'The letter\'s first move is worship, not argument. Everything that follows is unpacked as reasons for this one opening shout of blessing.',
    },
    {
      id: 'eulogesas',
      tokenId: 't_n49001003012',
      surface: 'εὐλογήσας',
      transliteration: 'eulogēsas',
      lemma: 'εὐλογέω',
      gloss: 'having blessed',
      parsing: 'aorist active participle, nominative masculine singular',
      explanation:
        'A participle describing God: "the one having blessed us." Once "Blessed be God" is said, this word becomes the sentence\'s real working part, going on to carry three straight prepositional phrases and then the subordinate clauses about choosing and predestining.',
      implication:
        'Nearly the whole passage hangs from this one participle and the chain that follows it. Once you can spot this word, the sentence\'s engine becomes visible.',
    },
    {
      id: 'enChristo',
      tokenId: 't_n49001003022',
      surface: 'Χριστῷ',
      transliteration: 'Christō',
      lemma: 'Χριστός',
      gloss: 'Christ',
      parsing: 'proper noun, dative masculine singular',
      explanation:
        'The dative noun after ἐν ("in") forms the phrase "in Christ." This exact phrase — or its equivalent "in him" / "in whom" — recurs roughly a dozen times across these twelve verses, more densely than in any comparable stretch elsewhere in the New Testament.',
      implication:
        'Grammatically, every spiritual blessing this sentence names is located "in Christ." Nothing described here stands outside of him.',
    },
    {
      id: 'exelexato',
      tokenId: 't_n49001004002',
      surface: 'ἐξελέξατο',
      transliteration: 'exelexato',
      lemma: 'ἐκλέγομαι',
      gloss: 'he chose',
      parsing: 'aorist middle indicative, 3rd singular',
      explanation:
        'God is the understood subject (carried over from "having blessed"), and "us" is the object. The clause is introduced by καθὼς ("just as"), which grammatically subordinates the choosing to the blessing already announced in verse 3.',
      implication:
        'God\'s choosing us doesn\'t stand on its own as a separate topic — the syntax presents it as an INSTANCE of the blessing already being praised. Adoration comes first; explanation comes second.',
      caution:
        'The aorist here views the choosing as one completed whole; it says nothing by itself about timing, mechanism, or scope. See this guide\'s debate summary for how different traditions read this verb.',
    },
    {
      id: 'proorisas',
      tokenId: 't_n49001005001',
      surface: 'προορίσας',
      transliteration: 'proorisas',
      lemma: 'προορίζω',
      gloss: 'having predestined',
      parsing: 'aorist active participle, nominative masculine singular',
      explanation:
        'Another aorist participle describing God, nested a level further down than "he chose." Its object, again, is "us," and its stated goal a few words later is "adoption as sons."',
      implication:
        'The grammar nests this word two layers beneath the sentence\'s main verb, inside a chain about God\'s initiative. It is never presented as a stand-alone thesis — it is one more layer inside one long blessing.',
      caution:
        '"Predestined" can sound cold heard in isolation. In the Greek sentence its nearest neighbors are "in love" (v. 4) just before it and "to the praise of his glorious grace" (v. 6) just after — affection and worship, not a courtroom.',
    },
    {
      id: 'enHo',
      tokenId: 't_n49001007002',
      surface: 'ᾧ',
      transliteration: 'hō',
      lemma: 'ὅς',
      gloss: 'whom',
      parsing: 'relative pronoun, dative masculine singular',
      explanation:
        'A relative pronoun picking up the thread of "in Christ" at the start of each new sentence English translations carve out of this one long Greek period (vv. 7, 11, 13 twice). Every time the sentence seems to start over, it is in fact still circling back to the same anchor.',
      implication:
        'Redemption (v. 7), being made God\'s own (v. 11), and the sealing of the Spirit (v. 13) are all still "in him," still riding the same participle from verse 3 — the paragraph breaks are for readability, not new topics.',
    },
    {
      id: 'epainon',
      tokenId: 't_n49001006002',
      surface: 'ἔπαινον',
      transliteration: 'epainon',
      lemma: 'ἔπαινος',
      gloss: 'praise',
      parsing: 'noun, accusative masculine singular',
      explanation:
        'The noun that closes each of the sentence\'s three great movements: "to the praise of his glorious grace" (v. 6), "to the praise of his glory" (v. 12), and "to the praise of his glory" again (v. 14). The grammar attaches each refrain directly to the action it follows — choosing and predestining, being made God\'s own, sealing with the Spirit — as their stated goal.',
      implication:
        'Three times the sentence tells you why: not merely that God chose, predestined, redeemed, and sealed, but that he did it so his glory would be praised. This refrain is close to the sentence\'s real thesis statement, repeated like a chorus.',
    },
  ],
};
