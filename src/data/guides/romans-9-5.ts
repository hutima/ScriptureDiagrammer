import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Romans 9:3–5 — Paul's anguished list of Israel's privileges climaxes in
 * the Messiah "according to the flesh," and then one unpunctuated Greek
 * clause (ὁ ὢν ἐπὶ πάντων θεὸς εὐλογητὸς εἰς τοὺς αἰῶνας) can be read either
 * as calling Christ himself "God over all, blessed forever" or as breaking
 * away into a separate blessing of God the Father. Authored against the
 * bundled SBLGNT passages `sblgnt_romans_228` (Rom 9:3–5a, up through "the
 * Christ according to the flesh") and `sblgnt_romans_229` (Rom 9:5b, the
 * debated clause itself) — dump both with `npm run guided:dump`.
 */
export const romans9doxology: GrammarHighlightGuide = {
  id: 'guide-romans-9-5',
  title: 'Romans 9:5 — Christ, or a blessing to God?',
  reference: 'Romans 9:3–5',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_romans_228', 'sblgnt_romans_229'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    "Paul's list of Israel's privileges climaxes in the Messiah — then one unpunctuated Greek clause can be read as calling Christ 'God over all' or as launching a separate blessing of the Father. The diagram walks through both possibilities and the grammar that shapes the choice.",
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
        nodeIds: ['w_n45009005008', 'w_n45009005010', 'w_n45009005011'],
        relationIds: ['r_s228_50', 'r_s228_49', 'r_s228_47'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n45009005008'] },
      implication:
        "'According to the flesh' marks a boundary — Paul says Christ's human descent from Israel is real, but he is about to reach for language that goes beyond it.",
      greekTermIds: ['christos', 'sarka'],
    },
    {
      id: 'step-crux-ho-on',
      title: 'One phrase, no punctuation, two possible sentences',
      passageId: 'sblgnt_romans_229',
      body:
        "The next words are [[ho_on]] ἐπὶ πάντων [[theos]] — 'the one who is over all, God.' The earliest Greek manuscripts run these words together with no comma and no period, so a reader has to decide: does this whole phrase reach back and describe the Messiah just named ('the Messiah, who is God over all')? Or does it start a brand-new sentence, turning to bless God the Father directly ('God who is over all be blessed forever')? This diagram shows one way of drawing that line — but the Greek itself does not draw it for you.",
      focus: {
        nodeIds: ['w_n45009005012', 'w_n45009005013', 'w_n45009005016'],
        relationIds: ['r_s229_7', 'r_s229_3', 'r_s229_6', 'r_s229_8'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n45009005013', 'w_n45009005016'] },
      caution:
        "Both readings are held by serious, careful readers of Greek. The grammar frames the choice; it does not make it for you — see this guide's debate summary.",
      greekTermIds: ['ho_on', 'theos'],
    },
    {
      id: 'step-see-both-readings',
      title: 'See both readings drawn — the app can show you each',
      passageId: 'sblgnt_romans_229',
      body:
        "This is a rare place where you can watch a punctuation decision change a diagram. The base tree here draws [[ho_on]] ἐπὶ πάντων [[theos]] [[eulogetos]] as its own sentence — an independent blessing of God: '…the Christ according to the flesh. God who is over all be blessed forever!' The app also carries the other reading: open the alternate reading below and the same Greek words re-attach to [[christos]] at the end of the previous clause — '…the Christ according to the flesh, who is God over all, blessed forever.' Nothing about the words changes; only where the sentence ends. Because the boundary sits between two sentences, the app shows them merged so you can see the clause move from one home to the other.",
      focus: {
        nodeIds: ['w_n45009005013', 'w_n45009005016'],
        relationIds: ['r_s229_3', 'r_s229_7'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n45009005013', 'w_n45009005016'] },
      implication:
        'Every printed Greek text and every translation has already made this decision for you — most modern editions print one choice and honestly footnote the other. Punctuation is itself an act of interpretation, and seeing both structures drawn is the clearest way to feel what is actually at stake.',
      caution:
        'Previewing the alternate never changes anything — it is a lens, not an edit. Both structures are defensible readings of the same unpunctuated Greek; neither diagram is "the correction" of the other.',
      greekTermIds: ['christos', 'ho_on', 'theos'],
      contested: {
        issueId: 'iss_rom_9_5_doxology_sblgnt',
        note:
          'This debated clause is in the app\'s alternate-readings registry. Open it to preview the "refers to Christ" reading drawn structurally — and to compare it with the base doxology reading side by side.',
      },
    },
    {
      id: 'step-word-order',
      title: 'Why word order matters here',
      passageId: 'sblgnt_romans_229',
      body:
        "Notice where [[eulogetos]] ('blessed') falls: after 'God,' not before it. When Paul — and the Old Testament, and Jewish prayer generally — opens a fresh blessing of God out of nowhere, the word 'blessed' almost always comes first: 'Blessed be the Lord…' Here it comes second. That small detail is one of the main reasons most modern grammarians lean toward reading this whole verse as describing Christ, rather than launching an independent blessing of the Father.",
      focus: {
        nodeIds: ['w_n45009005017', 'w_n45009005016'],
        relationIds: ['r_s229_9'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n45009005017'] },
      implication:
        "Word order is a real clue, not a proof. It is one honest reason many English translations render this verse as calling Christ 'God over all, blessed forever' — while other careful translations keep the alternative reading in a footnote.",
      greekTermIds: ['eulogetos'],
    },
    {
      id: 'step-blessed-forever',
      title: 'Blessed forever — the sentence lands in worship',
      passageId: 'sblgnt_romans_229',
      body:
        "However you resolve the syntax, the sentence ends the same way: 'blessed forever,' sealed with [[amen]]. Paul cannot finish reflecting on Israel's history, or on the Messiah who came from her, without turning it into praise. This is where the grammar hands off to worship — a debated syntax question resolving, either way, in adoration.",
      focus: {
        nodeIds: [
          'w_n45009005017',
          'w_n45009005018',
          'w_n45009005020',
          'w_n45009005021',
        ],
        relationIds: ['r_s229_9', 'r_s229_12', 'r_s229_11', 'r_s229_13'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n45009005021'] },
      implication:
        'Whether you hear this verse praising Christ directly or turning to praise the Father, Paul\'s instinct is the same: theology becomes doxology.',
      greekTermIds: ['amen'],
    },
  ],
  debateSummary: {
    issue:
      'Does Romans 9:5\'s closing clause ("who is over all, God blessed forever") call Jesus Christ "God," or does it break away from Christ to begin a separate blessing of God the Father?',
    views: [
      {
        label: 'Christological reading — Christ is called "God over all"',
        summary:
          'Reads straight through with no full stop after "Christ": "…from whom is the Messiah according to the flesh, who is God over all, blessed forever. Amen." The participle ὁ ὢν ("who is") naturally continues to describe the noun just named, Χριστός. On this reading Paul explicitly calls Jesus "God" (θεός) here, alongside John 1:1, Titus 2:13, and 2 Peter 1:1. Most modern grammarians favor this reading, partly on word-order grounds: a freestanding blessing of God in Greek (as in the Old Testament and Jewish prayer) normally opens with "blessed" (εὐλογητός) rather than placing it after the noun it blesses, as happens here.',
        cautions: [
          'This still depends on how you punctuate an unpunctuated text — a real, well-supported editorial decision, but a decision nonetheless.',
        ],
      },
      {
        label: 'Independent-doxology reading — a separate blessing of the Father',
        summary:
          'Reads a full stop after "Christ": "…from whom is the Messiah according to the flesh. God who is over all be blessed forever! Amen." On this reading, Paul pauses his hard reflection on Israel\'s rejection of the Messiah to break into an ordinary Jewish blessing of God the Father — the kind of doxology that appears elsewhere in his letters (e.g. 2 Corinthians 11:31).',
        cautions: [
          'This reading has to explain why the doxology\'s word order is unusual for this kind of formula (εὐλογητός is not first), which is the main grammatical objection raised against it.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The Greek has no punctuation at all, so the sentence break is an editorial decision every translator and reader must make. Word order (where εὐλογητός falls) and the natural pull of the participle ὁ ὢν toward the nearest noun both lean toward the Christological reading, but grammar alone cannot supply a period Paul never wrote — the decision also draws on Paul\'s wider theology and how doxologies work elsewhere in his letters.',
  },
  confessionalFrame:
    'Reformed and Anglican tradition has long read Romans 9:5 as a clear affirmation of Christ\'s full deity, standing alongside John 1:1, Titus 2:13, and 2 Peter 1:1 as places where the New Testament calls Jesus "God" outright. This is a confessional conviction, not a claim that grammar alone forces the point — readers who take the other view are not thereby denying Christ\'s deity, which the New Testament teaches many other ways.',
  greekTerms: [
    {
      id: 'christos',
      tokenId: 't_n45009005008',
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
      tokenId: 't_n45009005011',
      surface: 'σάρκα',
      transliteration: 'sarka',
      lemma: 'σάρξ',
      gloss: '[the] flesh',
      parsing: 'noun, accusative feminine singular',
      explanation:
        'Paired with κατά ("according to"), this everyday word for "flesh" marks a real but limited claim: Christ\'s human descent from Israel. Paul often uses phrases like this to leave room to say more.',
      caution:
        '"According to the flesh" is not a put-down — it simply names one true thing about Christ (his human ancestry) while leaving space to say something more.',
    },
    {
      id: 'ho_on',
      tokenId: 't_n45009005013',
      surface: 'ὢν',
      transliteration: 'ōn',
      lemma: 'εἰμί',
      gloss: 'being',
      parsing: 'present active participle, nominative masculine singular',
      explanation:
        'A participle of "to be," paired with the article ὁ to work almost like a title: "the one who is …". It opens the debated clause naming someone "over all."',
      caution:
        'The participle\'s present tense simply presents this as a straightforward description; it does not by itself carry extra theological weight — that comes from what it is paired with, not from its tense.',
    },
    {
      id: 'theos',
      tokenId: 't_n45009005016',
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
      tokenId: 't_n45009005017',
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
      tokenId: 't_n45009005021',
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
