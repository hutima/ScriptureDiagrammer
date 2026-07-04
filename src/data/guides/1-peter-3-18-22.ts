import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * 1 Peter 3:18–22 — three linked SBLGNT sentences (3:17–18, 3:19–20, 3:21–22).
 * One of the most contested corners of the New Testament: what Christ did
 * "in which" (ἐν ᾧ) between his death and resurrection, who the "spirits in
 * prison" are, and what it means that baptism "now saves you." Authored
 * against the bundled passages `sblgnt_1-peter_44` / `_45` / `_46` (dump with
 * `npm run guided:dump`). The guide's whole point: the grammar frames these
 * questions precisely — it does not settle them.
 */
export const firstPeter3: GrammarHighlightGuide = {
  id: 'guide-1-peter-3-18-22',
  title: "1 Peter 3:18–22 — Christ's proclamation, and baptism's pledge",
  reference: '1 Peter 3:18–22',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_1-peter_44', 'sblgnt_1-peter_45', 'sblgnt_1-peter_46'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'advanced',
  topics: ['baptism', 'christology', 'contested passage'],
  summary:
    "Peter connects Christ's proclamation to imprisoned spirits with baptism's saving pledge.",
  devotionalFrame:
    "This short passage has comforted suffering Christians for two thousand years — and puzzled careful readers for just as long. Peter packs an enormous claim into a few tightly built Greek clauses: Christ's suffering, a mysterious proclamation, Noah's flood, and baptism, all in one breath. This guide will not settle every question the church has argued about here. What it can do is show you exactly where the sentence itself leaves room for more than one faithful reading, and where Peter supplies his own qualifiers. Keep your own Bible open alongside it — translation cannot decide this for you, and neither can a diagram; both can only show you clearly what the words actually say.",
  confessionalFrame:
    'A confessional note (confessional Reformed): many in this tradition read "baptism now saves you" sacramentally but not mechanically — baptism is an effectual sign, given by Christ to his church, that saves precisely as, and only as, it is joined by the Spirit to a believer\'s faith in the risen Christ. That qualification is not read into the text: Peter states his own qualifier in the very same sentence (an appeal, or pledge, of a good conscience, grounded in the resurrection). This is one responsible reading among those summarized below, offered here as a labelled confessional note, not the one settled answer.',
  debateSummary: {
    issue:
      "Who are the \"spirits in prison\" Christ proclaimed to (3:19), and how does baptism \"now save\" (3:21)?",
    views: [
      {
        label: 'Christ, through the Spirit, preached through Noah to that generation',
        summary:
          "On this reading, \"in which\" (ἐν ᾧ, en hō) reaches back to the Spirit of v.18: the pre-incarnate Christ was himself preaching righteousness through Noah to Noah's disobedient contemporaries, who are now, at the time Peter writes, spirits held in the prison of judgment. This view keeps the proclamation tied to real people who heard a gospel-shaped call to repent while they were still alive to answer it.",
        cautions: [
          'This reading has to supply "through Noah" and "at that time" — the sentence itself names no preacher besides Christ and no vehicle besides "having gone."',
        ],
      },
      {
        label: 'Christ proclaimed victory or judgment to imprisoned spirit-powers',
        summary:
          'On this reading the "spirits" are not human at all, but the rebellious powers often linked to Genesis 6 and to the fallen "sons of God" behind Noah\'s generation. Between his death and resurrection (or at his resurrection), Christ proclaimed his triumph or pronounced judgment over them. Supporters point out that a bare plural "spirits" almost always names spirit-beings elsewhere in the New Testament, and that 3:22\'s picture of "angels, authorities, and powers" made subject to Christ reads as the resolution of exactly this scene.',
        cautions: [
          'This view places the event in a window of time — between death and resurrection — that the sentence itself does not date precisely.',
        ],
      },
      {
        label: 'A proclamation to the human dead',
        summary:
          'A further reading takes "spirits" as departed human souls in general, and the proclamation as some announcement made to the dead — sometimes linked to 1 Peter 4:6, "the gospel was preached even to the dead." This view takes the plain sense of "spirits" as people who have died, and reads the passage as answering a real pastoral question the early church asked: what about those who died before Christ came?',
        cautions: [
          'This is the hardest reading to square with the pattern (elsewhere in this era\'s Greek) of a bare plural "spirits" naming spirit-beings, and it opens further questions this verse alone does not answer.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      "The grammar gives real, load-bearing clues: the dative relative pronoun ἐν ᾧ (en hō, \"in which\") almost certainly reaches back into the previous sentence rather than starting a thought from nothing; a bare plural \"spirits\" usually names spirit-beings elsewhere in this era's Greek; and one continuous participle chain links the proclamation, the imprisonment, Noah's generation, and Christ's final exaltation over \"angels, authorities, and powers\" into a single scene. But the grammar does not name who \"in which\" refers to, does not date the proclamation, and does not spell out its content — those calls are made from wider theology and the rest of Scripture, not from this sentence's syntax alone. The same is true in v.21: the apposition \"not the removal of dirt from the body but an appeal of a good conscience\" is Peter's own grammar-level qualifier, and it genuinely narrows the question — but it does not by itself settle exactly how baptism relates to regeneration, faith, or the moment of salvation. Careful readers hold several of these views in good conscience; the diagram's job is to show you precisely where those forks sit in the sentence, not to close them for you.",
  },
  steps: [
    {
      id: 'step-put-to-death',
      title: 'Put to death, made alive — a matched pair',
      passageId: 'sblgnt_1-peter_44',
      body:
        "Just before the hardest verses in this section, Peter anchors everything in Christ himself: he was put to death in the flesh, but made alive in [[pneumati]] — \"the spirit,\" or perhaps \"the Spirit.\" The diagram draws these two ideas as a matched pair of participles, joined by μὲν … δὲ (men … de), Greek's own way of saying \"on the one hand … on the other.\" Keep an eye on that dative word [[pneumati]] — the very next sentence opens with \"in which,\" and matching case and number is one real clue, among several, to what \"which\" is reaching back to.",
      focus: {
        nodeIds: ['w_n60003018016', 'w_n60003018018', 'w_n60003018019', 'w_n60003018021'],
        relationIds: ['r_s44_44', 'r_s44_48', 'r_s44_45', 'r_s44_49'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n60003018019', 'w_n60003018021'] },
      implication:
        'Peter builds the very next, more difficult sentence on top of this one. Reading carefully here pays off in a moment.',
      caution:
        "This pairing describes a real turning point in Christ's own story — it is a genuine clue for what follows, not a formula that solves the next verse by itself.",
      greekTermIds: ['pneumati'],
    },
    {
      id: 'step-in-which',
      title: '"In which" — a pointer the sentence itself must supply',
      passageId: 'sblgnt_1-peter_45',
      body:
        "Verse 19 opens with two small words, ἐν ᾧ (en hō) — \"in which\" or \"in whom.\" [[ho]] is a relative pronoun in the dative case, and Greek does not spell out its antecedent inside this clause; you have to reason it out from what comes before and after, the same work every translator already does before choosing English words. Whatever \"which\" points to, the sentence continues: Christ \"went\" and [[ekeryxen]] — a verb that simply means to announce or proclaim, without telling us, on its own, the content of what was proclaimed.",
      focus: {
        nodeIds: ['w_n60003019001', 'w_n60003019002', 'w_n60003019008', 'w_n60003019009'],
        relationIds: ['r_s45_1', 'r_s45_2', 'r_s45_3', 'r_s45_5', 'r_s45_6'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n60003019002', 'w_n60003019009'] },
      implication:
        'Two open questions sit right here in the grammar: what does "which" refer to, and what did this proclamation actually announce? The rest of the sentence — and the rest of Scripture — is where readers go looking for the answer.',
      greekTermIds: ['ho', 'ekeryxen'],
    },
    {
      id: 'step-spirits-in-prison',
      title: 'The spirits in prison',
      passageId: 'sblgnt_1-peter_45',
      body:
        "The ones proclaimed to are called [[pneumasin]] — \"spirits\" — \"in prison,\" described as having been disobedient long ago, \"when God's patience kept waiting in the days of Noah.\" In the diagram, \"spirits\" sits right where the proclamation lands, with \"disobedient\" and \"in prison\" hanging off it as descriptions. Elsewhere in the New Testament, a bare plural \"spirits\" like this usually names spirit-beings rather than deceased people — but the mention of Noah's generation right alongside it is exactly why careful readers land in more than one place. This is one of the most argued-over corners of the New Testament; see the debate summary below for a fair account of the main readings.",
      focus: {
        nodeIds: [
          'w_n60003019007',
          'w_n60003019004',
          'w_n60003019005',
          'w_n60003019006',
          'cl_s45_7',
          'w_n60003020001',
          'w_n60003020002',
        ],
        relationIds: ['r_s45_44', 'r_s45_45', 'r_s45_40', 'r_s45_41', 'r_s45_42', 'r_s45_8', 'r_s45_9'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n60003019007'] },
      caution:
        'Fair, careful readers disagree here. The grammar narrows the options — it does not, by itself, hand you a name for who these "spirits" are.',
      greekTermIds: ['pneumasin'],
    },
    {
      id: 'step-baptism-now-saves',
      title: 'Baptism now saves you — with Peter\'s own qualifier',
      passageId: 'sblgnt_1-peter_46',
      body:
        "Verse 21 makes its own turn: \"which\" now reaches back further, to the flood water that carried Noah's family to safety, and Peter says [[baptisma]] \"now saves you.\" But he immediately qualifies his own sentence with a Greek \"not … but\" (οὐ … ἀλλά, ou … alla): not a washing that removes dirt from the body, but [[eperotema]] — an appeal, or pledge, of a good conscience toward God, grounded in the resurrection of Jesus Christ. The diagram draws that qualifier as an apposition riding right alongside \"baptism\" — Peter is telling you, in his own grammar, what he does and does not mean.",
      focus: {
        nodeIds: [
          'w_n60003021001',
          'w_n60003021003',
          'w_n60003021004',
          'w_n60003021006',
          'w_n60003021007',
          'w_n60003021008',
          'w_n60003021009',
          'w_n60003021010',
          'w_n60003021011',
          'w_n60003021012',
          'w_n60003021013',
          'w_n60003021014',
          'w_n60003021015',
          'cl_s46_0',
        ],
        relationIds: [
          'r_s46_1',
          'r_s46_2',
          'r_s46_4',
          'r_s46_17',
          'r_s46_16',
          'r_s46_15',
          'r_s46_6',
          'r_s46_7',
          'r_s46_8',
          'r_s46_9',
          'r_s46_10',
          'r_s46_11',
          'r_s46_14',
        ],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n60003021007', 'w_n60003021015'] },
      implication:
        "The apposition sits in the sentence itself, not added by a later commentator: Peter narrows what he means by \"baptism now saves you\" in the very clause where he says it.",
      caution:
        'The present-tense "saves" describes an ongoing reality Peter affirms — it is not, by itself, a claim about exactly how, or apart from what, baptism saves. His own next words are the explanation.',
      greekTermIds: ['baptisma', 'eperotema'],
    },
    {
      id: 'step-gone-into-heaven',
      title: 'Every power made subject to him',
      passageId: 'sblgnt_1-peter_46',
      body:
        'The passage closes on ascension: Christ "is at the right hand of God," having gone into heaven, with angels and authorities and powers [[hypotagenton]] — "having been subjected" — to him. However you read "the spirits in prison," the sentence\'s last word is Christ\'s supremacy over every spiritual power. The diagram lets you see that this triumphant close is its own clause, connected to the proclamation of verse 19 by the letter\'s argument, but grammatically standing on its own.',
      focus: {
        nodeIds: [
          'w_n60003022001',
          'w_n60003022002',
          'w_n60003022004',
          'w_n60003022006',
          'w_n60003022008',
          'w_n60003022009',
          'w_n60003022010',
          'w_n60003022011',
          'w_n60003022013',
          'w_n60003022015',
          'cl_s46_18',
          'cl_s46_20',
          'cl_s46_26',
        ],
        relationIds: [
          'r_s46_21',
          'r_s46_22',
          'r_s46_23',
          'r_s46_24',
          'r_s46_25',
          'r_s46_27',
          'r_s46_28',
          'r_s46_29',
          'r_s46_30',
          'r_s46_31',
          'r_s46_32',
          'r_s46_37',
          'r_s46_19',
          'r_s46_33',
          'r_s46_34',
          'r_s46_35',
          'r_s46_36',
        ],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n60003022009', 'w_n60003022011'] },
      implication:
        "Whatever position you take on verse 19, the letter's argument arrives at the same place: Christ reigns over every power, visible or invisible. That is the pastoral comfort Peter is building toward for a suffering church.",
      greekTermIds: ['hypotagenton'],
    },
  ],
  greekTerms: [
    {
      id: 'pneumati',
      tokenId: 't_n60003018021',
      surface: 'πνεύματι',
      transliteration: 'pneumati',
      lemma: 'πνεῦμα',
      gloss: 'in [the] spirit',
      parsing: 'noun, dative neuter singular',
      explanation:
        'Paired with "in the flesh" (σαρκί, sarki) by μὲν … δὲ (men … de, "on the one hand … on the other"): Christ was put to death in one sphere and made alive in this one. Dative case here marks the sphere or respect in which each verb happens.',
      implication:
        'This word\'s case and number (dative, neuter, singular) match the relative pronoun that opens the very next sentence — one real clue, among several, that readers use when deciding what "in which" refers to.',
      caution:
        'A grammatical match is a genuine clue, not a proof. Good readers weigh it alongside the passage\'s wider argument.',
    },
    {
      id: 'ho',
      tokenId: 't_n60003019002',
      surface: 'ᾧ',
      transliteration: 'hō',
      lemma: 'ὅς',
      gloss: 'which / whom',
      parsing: 'relative pronoun, dative neuter singular',
      explanation:
        'A relative pronoun with no antecedent stated inside its own clause — Greek regularly lets a relative pronoun reach back across a sentence boundary, which is exactly what makes "in which" (or "in whom") such a discussed phrase here.',
      implication:
        'This is where the whole debate over verse 19 begins grammatically: the pronoun itself is plain; what it points back to is the interpretive fork.',
      caution:
        'The pronoun\'s form does not, by itself, name its antecedent. That is decided by context and theology, not by this word alone.',
    },
    {
      id: 'ekeryxen',
      tokenId: 't_n60003019009',
      surface: 'ἐκήρυξεν',
      transliteration: 'ekēryxen',
      lemma: 'κηρύσσω',
      gloss: 'he proclaimed / preached',
      parsing: 'aorist active indicative, 3rd singular',
      explanation:
        'The main verb of the sentence: Christ "went" and proclaimed. This verb means to herald or announce; unlike some other New Testament preaching verbs, it does not by itself specify the content of the announcement.',
      implication:
        'Because this verb alone does not say what was proclaimed, readers reasonably differ over whether it was good news, judgment, or victory being announced.',
    },
    {
      id: 'pneumasin',
      tokenId: 't_n60003019007',
      surface: 'πνεύμασιν',
      transliteration: 'pneumasin',
      lemma: 'πνεῦμα',
      gloss: 'spirits',
      parsing: 'noun, dative neuter plural',
      explanation:
        'The recipients of the proclamation, described as "in prison" and "having disobeyed" long ago, in Noah\'s day. Elsewhere in the New Testament, a bare plural like this usually names spirit-beings rather than deceased people.',
      implication:
        'This word is the heart of the debate over who Christ proclaimed to — see the debate summary for a fair account of the main readings.',
      caution:
        'The plural noun by itself does not name who these "spirits" are; that call is made from the wider context, not from the word\'s grammar.',
    },
    {
      id: 'baptisma',
      tokenId: 't_n60003021007',
      surface: 'βάπτισμα',
      transliteration: 'baptisma',
      lemma: 'βάπτισμα',
      gloss: 'baptism',
      parsing: 'noun, nominative neuter singular',
      explanation:
        'The grammatical subject of "now saves you." The diagram shows an adjective ("corresponding," ἀντίτυπον, antitypon, echoing the flood water of the previous sentence) and a qualifying phrase both attached directly to this word.',
      implication:
        'Because Peter attaches his own qualifier to this very word in this very sentence, the diagram lets you see exactly how far his claim reaches, and where he limits it himself.',
    },
    {
      id: 'eperotema',
      tokenId: 't_n60003021015',
      surface: 'ἐπερώτημα',
      transliteration: 'eperōtēma',
      lemma: 'ἐπερώτημα',
      gloss: 'a pledge, an appeal',
      parsing: 'noun, nominative neuter singular',
      explanation:
        'Peter\'s own definition of what baptism is, set in apposition to "baptism" itself: not a bodily washing, but an appeal (or pledge) of a good conscience toward God, resting on Christ\'s resurrection.',
      implication:
        'This is Peter\'s own guardrail against reading "baptism now saves you" as a claim about water or ritual acting on its own.',
      caution:
        'Interpreters still debate the exact nuance of this rare word (an appeal made to God, or a pledge made toward him) — both readings keep Peter\'s point that it is a matter of the conscience and of faith, not of the body.',
    },
    {
      id: 'hypotagenton',
      tokenId: 't_n60003022009',
      surface: 'ὑποταγέντων',
      transliteration: 'hypotagentōn',
      lemma: 'ὑποτάσσω',
      gloss: 'having been subjected',
      parsing: 'aorist passive participle, genitive masculine plural',
      explanation:
        'Describes "angels, authorities, and powers" as now subject to the ascended Christ. The construction stands apart from its clause, describing a circumstance surrounding Christ\'s exaltation.',
      implication:
        'Whichever reading of "spirits in prison" you hold, this closing image is where the passage lands: every spiritual power, however you have identified it, is subject to Christ.',
    },
  ],
};
