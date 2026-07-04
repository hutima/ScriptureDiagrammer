import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Romans 9:3–5 — Paul's anguished list of Israel's privileges climaxes in
 * the Messiah "according to the flesh," and then one unpunctuated Greek
 * clause — ὁ ὢν ἐπὶ πάντων θεὸς εὐλογητὸς εἰς τοὺς αἰῶνας (ho ōn epi pantōn
 * theos eulogētos eis tous aiōnas, "who is over all, God blessed forever") —
 * is read here, as the standard/main reading, as calling Christ himself
 * "God over all, blessed forever," one of the New Testament's plainest
 * ascriptions of deity to Christ.
 *
 * The guided base document is a SINGLE merged sentence `sblgnt_romans_228`
 * (Rom 9:3–5 combined with 9:5b), with the doxology clause structurally
 * attached in apposition to ὁ Χριστός — so all four diagram lenses show the
 * christological reading by default. `scripts/build-guided-highlights.mts`
 * bakes it (combinePassage + the apposition-to-Christ overlay); see
 * `iss_rom_9_5_doxology_sblgnt` in contestedSyntaxSblgnt.ts. Because the two
 * source sentences are merged and prefixed, the 9:3–5 words carry the `s0_`
 * prefix and the 9:5b doxology words the `s1_` prefix. The demoted
 * independent-doxology reading is offered as the alternate in "Where readers
 * differ." Dump the merged base with `npm run guided:dump -- sblgnt_romans_228`.
 */
export const romans9doxology: GrammarHighlightGuide = {
  id: 'guide-romans-9-5',
  title: 'Romans 9:5 — Christ, or a blessing to God?',
  reference: 'Romans 9:3–5',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_romans_228'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    "Paul's list of Israel's privileges climaxes in the Messiah — and then in one of the New Testament's plainest declarations of his deity: Christ is 'God over all, blessed forever.' The earliest manuscripts carry no punctuation, so a minority reading instead breaks away into a separate blessing of the Father. The diagram walks through the standard reading and the grammar that shapes the choice, alternate view included.",
  devotionalFrame:
    "Paul has just poured out anguish over Israel (9:1–3) and then listed, with visible pride, everything God gave his people — culminating in the Messiah himself. Before he turns to the hard argument of the rest of chapter 9, he cannot help but break into praise. Watch how one small grammatical choice — where a sentence ends — carries real theological weight, and how, whichever way you read it, Paul ends up worshiping.",
  steps: [
    {
      id: 'step-messiah-according-to-flesh',
      title: 'Every privilege — and then, the Messiah',
      passageId: 'sblgnt_romans_228',
      body:
        "Paul has just listed everything God gave Israel: the adoption, the glory, the covenants, the law, the temple worship, the promises, the patriarchs. Then comes the greatest gift of all: 'and from them, according to the flesh, is the [[christos]].' The diagram shows [[sarka]] — 'according to the flesh' — hanging as its own qualifying phrase beneath 'Christ.' It is a small, careful phrase. Paul is not finished describing who Christ is.",
      focus: {
        nodeIds: ['s0_w_n45009005008', 's0_w_n45009005010', 's0_w_n45009005011'],
        relationIds: ['s0_r_s228_50', 's0_r_s228_49', 's0_r_s228_47'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['s0_w_n45009005008'] },
      implication:
        "'According to the flesh' marks a boundary — Paul says Christ's human descent from Israel is real, but he is about to reach for language that goes beyond it.",
      greekTermIds: ['christos', 'sarka'],
    },
    {
      id: 'step-crux-ho-on',
      title: 'One phrase, no punctuation — and a reading that points to Christ',
      passageId: 'sblgnt_romans_228',
      body:
        "The next words are [[ho_on]] ἐπὶ πάντων (epi pantōn, \"over all\") [[theos]] — 'the one who is over all, God.' The earliest Greek manuscripts run these words together with no comma and no period, so later editors have to decide where the sentence breaks. Read straight through with no full stop, this phrase naturally continues to describe the Messiah just named: 'the Messiah, who is God over all, blessed forever' — one of the plainest declarations of Christ's deity in the New Testament, and the reading this guide treats as standard. The diagram on this screen draws it that way: the whole clause hangs in apposition to [[christos]], still describing him. A minority reading instead places a full stop right before this phrase, launching a fresh, independent blessing of God the Father: 'God who is over all be blessed forever.' The next step lets you preview that alternate and compare the two side by side.",
      focus: {
        nodeIds: ['s1_w_n45009005012', 's1_w_n45009005013', 's1_w_n45009005016'],
        relationIds: ['s1_r_s229_7', 's1_r_s229_3', 's1_r_s229_6', 's1_r_s229_8'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['s1_w_n45009005013', 's1_w_n45009005016'] },
      caution:
        "Careful, serious readers of Greek hold the independent-blessing reading too — the earliest manuscripts supply no punctuation to settle it outright. This guide treats the reading drawn here (Christ as 'God over all, blessed forever') as standard; see the debate summary for the full case on each side.",
      greekTermIds: ['ho_on', 'theos'],
    },
    {
      id: 'step-see-both-readings',
      title: 'See both readings drawn — the standard one, and the alternate',
      passageId: 'sblgnt_romans_228',
      body:
        "This is a rare place where you can watch a punctuation decision change a diagram. The base tree on this screen already draws the reading this guide teaches as standard: [[ho_on]] ἐπὶ πάντων (epi pantōn, \"over all\") [[theos]] [[eulogetos]] attaches in apposition to [[christos]] at the end of the previous clause — '…the Christ according to the flesh, who is God over all, blessed forever' — one of the New Testament's plainest ascriptions of deity to Christ. Open the alternate reading below to see the other option: the same Greek words break away into their own independent sentence, blessing God the Father — '…the Christ according to the flesh. God who is over all be blessed forever!' Nothing about the words changes; only where the sentence ends — and whom the praise is addressed to.",
      focus: {
        nodeIds: ['s1_w_n45009005013', 's1_w_n45009005016'],
        relationIds: ['s1_r_s229_3', 's1_r_s229_7'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['s1_w_n45009005013', 's1_w_n45009005016'] },
      implication:
        'Every printed Greek text and every translation has already made this decision for you. Most modern English translations print the christological reading in their main text — calling Christ "God over all, blessed forever" — for the grammatical reasons this guide follows, while honestly footnoting the alternate. Punctuation is itself an act of interpretation, and seeing both structures drawn is the clearest way to feel what is actually at stake.',
      caution:
        "Previewing the alternate reading never changes anything in your document — it is a lens, not an edit. This guide teaches the christological reading as standard (and draws it that way), but the independent-blessing reading remains a serious, defensible reading of the same unpunctuated Greek, held by careful scholars too.",
      greekTermIds: ['christos', 'ho_on', 'theos'],
      contested: {
        issueId: 'iss_rom_9_5_doxology_sblgnt',
        note:
          'This debated clause is in the app\'s alternate-readings registry. The base diagram already draws the standard reading — "refers to Christ." Open the registry to preview the demoted independent-doxology reading (a separate blessing of the Father) and compare the two structures side by side.',
      },
    },
    {
      id: 'step-word-order',
      title: 'Why word order matters here',
      passageId: 'sblgnt_romans_228',
      body:
        "Notice where [[eulogetos]] ('blessed') falls: after 'God,' not before it. When Paul — and the Old Testament, and Jewish prayer generally — opens a fresh blessing of God out of nowhere, the word 'blessed' almost always comes first: 'Blessed be the Lord…' Here it comes second, exactly what you would expect if the whole clause is still describing Christ rather than launching a new blessing of the Father. This is one of the main grammatical reasons this guide reads the verse as calling Christ 'God over all, blessed forever.'",
      focus: {
        nodeIds: ['s1_w_n45009005017', 's1_w_n45009005016'],
        relationIds: ['s1_r_s229_9'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['s1_w_n45009005017'] },
      implication:
        "Word order is a real clue, not an absolute proof — but combined with the natural flow of the participle ὁ ὢν (ho ōn, \"who is\") continuing to describe Christ, it is one of the main reasons this guide treats 'Christ … God over all, blessed forever' as the standard reading of the verse. Many translations print it in the main text; others keep the alternative in a footnote.",
      greekTermIds: ['eulogetos'],
    },
    {
      id: 'step-blessed-forever',
      title: 'Blessed forever — the sentence lands in worship',
      passageId: 'sblgnt_romans_228',
      body:
        "However the syntax resolves, the sentence ends the same way: 'blessed forever,' sealed with [[amen]]. This guide reads that praise as directed at Christ himself — 'who is God over all, blessed forever' — but even readers who take the alternate view end up in the same place: Paul cannot finish reflecting on Israel's history, or on the Messiah who came from her, without turning it into praise. The grammar hands off to worship either way.",
      focus: {
        nodeIds: [
          's1_w_n45009005017',
          's1_w_n45009005018',
          's1_w_n45009005020',
          's1_w_n45009005021',
        ],
        relationIds: ['s1_r_s229_9', 's1_r_s229_12', 's1_r_s229_11', 's1_r_s229_13'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['s1_w_n45009005021'] },
      implication:
        'This guide hears the verse praising Christ directly — "who is God over all, blessed forever" — but even on the alternate reading, Paul\'s instinct is the same: theology becomes doxology.',
      greekTermIds: ['amen'],
    },
  ],
  debateSummary: {
    issue:
      'Does Romans 9:5\'s closing clause ("who is over all, God blessed forever") call Jesus Christ "God," or does it break away from Christ to begin a separate blessing of God the Father?',
    views: [
      {
        label:
          'Christological reading (the standard reading in this guide) — Christ is called "God over all"',
        summary:
          'Reads straight through with no full stop after "Christ": "…from whom is the Messiah according to the flesh, who is God over all, blessed forever. Amen." The participle ὁ ὢν (ho ōn, "who is") naturally continues to describe the noun just named, Χριστός (Christos, "Christ"). On this reading Paul explicitly calls Jesus "God" (θεός, theos) here, alongside John 1:1, Titus 2:13, and 2 Peter 1:1. Most modern grammarians favor this reading, partly on word-order grounds: a freestanding blessing of God in Greek (as in the Old Testament and Jewish prayer) normally opens with "blessed" (εὐλογητός, eulogētos) rather than placing it after the noun it blesses, as happens here.',
        cautions: [
          'This still depends on how you punctuate an unpunctuated text — a real, well-supported editorial decision, but a decision nonetheless.',
        ],
      },
      {
        label:
          'Independent-doxology reading (the alternate reading) — a separate blessing of the Father',
        summary:
          'Reads a full stop after "Christ": "…from whom is the Messiah according to the flesh. God who is over all be blessed forever! Amen." On this reading, Paul pauses his hard reflection on Israel\'s rejection of the Messiah to break into an ordinary Jewish blessing of God the Father — the kind of doxology that appears elsewhere in his letters (e.g. 2 Corinthians 11:31).',
        cautions: [
          'This reading has to explain why the doxology\'s word order is unusual for this kind of formula (εὐλογητός, eulogētos, "blessed," is not first), which is the main grammatical objection raised against it.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The Greek has no punctuation at all, so the sentence break is an editorial decision every translator and reader must make. Word order (where εὐλογητός, eulogētos, "blessed," falls) and the natural pull of the participle ὁ ὢν (ho ōn, "who is") toward the nearest noun both lean toward the Christological reading, which this guide follows as standard, but grammar alone cannot supply a period Paul never wrote — the decision also draws on Paul\'s wider theology and how doxologies work elsewhere in his letters.',
  },
  confessionalFrame:
    'Reformed and Anglican tradition reads Romans 9:5 as a clear, direct affirmation of Christ\'s full deity — "Christ, who is God over all, blessed forever" — standing alongside John 1:1, Titus 2:13, and 2 Peter 1:1 as places where the New Testament calls Jesus "God" outright. The grammar itself favors this reading: the participle ὁ ὢν (ho ōn, "who is") naturally continues to describe Christ, and the word order tells against reading a fresh doxology here — even though the reading still rests on how later editors punctuated an originally unpunctuated text. Readers who take the alternate, doxology reading are not thereby denying Christ\'s deity, which the New Testament teaches many other ways — but this guide, with the confessional tradition, takes Romans 9:5 as calling Jesus "God" directly.',
  greekTerms: [
    {
      id: 'christos',
      tokenId: 's0_t_n45009005008',
      surface: 'χριστὸς',
      transliteration: 'christos',
      lemma: 'Χριστός',
      gloss: 'Christ',
      parsing: 'proper noun, nominative masculine singular',
      explanation:
        "Paul's word for Israel's Messiah, the last and greatest in his list of Israel's privileges (9:4–5).",
      implication:
        "The very next words in the Greek describe him further — that is where this whole guide's question comes from.",
    },
    {
      id: 'sarka',
      tokenId: 's0_t_n45009005011',
      surface: 'σάρκα',
      transliteration: 'sarka',
      lemma: 'σάρξ',
      gloss: '[the] flesh',
      parsing: 'noun, accusative feminine singular',
      explanation:
        'Paired with κατά (kata, "according to"), this everyday word for "flesh" marks a real but limited claim: Christ\'s human descent from Israel. Paul often uses phrases like this to leave room to say more.',
      caution:
        '"According to the flesh" is not a put-down — it simply names one true thing about Christ (his human ancestry) while leaving space to say something more.',
    },
    {
      id: 'ho_on',
      tokenId: 's1_t_n45009005013',
      surface: 'ὢν',
      transliteration: 'ōn',
      lemma: 'εἰμί',
      gloss: 'being',
      parsing: 'present active participle, nominative masculine singular',
      explanation:
        'A participle of "to be," paired with the article ὁ (ho, "the") to work almost like a title: "the one who is …". It opens the debated clause naming someone "over all".',
      caution:
        'The participle\'s present tense simply presents this as a straightforward description; it does not by itself carry extra theological weight — that comes from what it is paired with, not from its tense.',
    },
    {
      id: 'theos',
      tokenId: 's1_t_n45009005016',
      surface: 'θεὸς',
      transliteration: 'theos',
      lemma: 'θεός',
      gloss: 'God',
      parsing: 'noun, nominative masculine singular',
      explanation:
        'Nobody disputes that this word means "God." The debate is whom it describes here — the Messiah just named, or the Father, in a fresh sentence of blessing.',
      implication:
        "See this guide's debate summary: both readings keep the same Greek words and differ only in where the sentence break falls.",
    },
    {
      id: 'eulogetos',
      tokenId: 's1_t_n45009005017',
      surface: 'εὐλογητὸς',
      transliteration: 'eulogētos',
      lemma: 'εὐλογητός',
      gloss: 'blessed',
      parsing: 'adjective, nominative masculine singular',
      explanation:
        'Spontaneous Jewish blessings of God typically put this word first ("Blessed be the Lord…"); here it comes after the noun it praises.',
      implication:
        'That word-order detail is one of the main grammatical reasons most modern grammarians favor reading the whole clause as describing Christ rather than opening an independent doxology to the Father.',
      caution:
        'Word order is a genuine clue, not an ironclad rule — Paul\'s Greek has its own style, and the argument from word order supports but does not by itself prove either reading.',
    },
    {
      id: 'amen',
      tokenId: 's1_t_n45009005021',
      surface: 'ἀμήν',
      transliteration: 'amēn',
      lemma: 'ἀμήν',
      gloss: 'Amen',
      parsing: 'particle (indeclinable)',
      explanation:
        'A Hebrew-rooted word of confirmation that seals a blessing. Whichever reading you take of the verse, it closes the same way — with praise resting on this one word.',
    },
  ],
};
