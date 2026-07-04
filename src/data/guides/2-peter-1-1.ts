import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * 2 Peter 1:1 — a shorter companion to the Titus 2:13 guide: the same
 * Granville Sharp shape (one article, two singular common nouns joined by
 * καί, both naming one person) appears again in Peter's own opening
 * greeting. Authored against the bundled SBLGNT passage `sblgnt_2-peter_0`
 * (dump with `npm run guided:dump`).
 */
export const secondPeter1: GrammarHighlightGuide = {
  id: 'guide-2-peter-1-1',
  title: '2 Peter 1:1 — our God and Savior',
  reference: '2 Peter 1:1',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_2-peter_0'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    'Peter opens his second letter the way any ancient letter opens — writer, readers, greeting. But tucked inside that greeting is the same grammatical shape as Titus 2:13: one article holding "God" and "Savior" together over one name, Jesus Christ.',
  devotionalFrame:
    'Peter is not writing a doctrinal essay here — just a letter opening. But before he has finished his very first sentence, the grammar he reaches for quietly calls Jesus Christ "our God and Savior." Follow the diagram to see exactly how the Greek holds that title together.',
  steps: [
    {
      id: 'step-overview',
      title: 'A letter opens: writer, then readers',
      body:
        'Like most ancient letters, this sentence has no main verb — it simply names the writer, [[symeon]] Peter, and then turns "to those" who share his faith. The diagram shows this shape: [[symeon]] as subject over a supplied predicate, with everything else in the verse hanging underneath as description.',
      focus: {
        nodeIds: ['cl_s0_0', 'w_n61001001001', 'w_n61001001002', 'impl_cl_s0_0', 'cl_s0_9'],
        relationIds: ['r_s0_8', 'r_s0_2', 'r_s0_1', 'r_s0_23'],
      },
      panZoom: { fit: 'whole-diagram', padding: 100 },
      implication:
        'Even a greeting has structure worth noticing: Peter names himself, then turns immediately to the people he is writing to. Everything that follows — his role, their faith, its ground — is packed into modifying phrases around that simple frame.',
      greekTermIds: ['symeon'],
    },
    {
      id: 'step-servant-apostle',
      title: 'A servant and apostle — of one Lord',
      body:
        'Peter describes himself with two roles, "servant and apostle," joined by [[kai_1]] — but both roles point to a single genitive, "of Jesus Christ." One person governs two titles. Watch for this shape again at the end of the verse, where it does even more work.',
      focus: {
        nodeIds: [
          'w_n61001001003',
          'w_n61001001004',
          'w_n61001001005',
          'w_n61001001006',
          'w_n61001001007',
        ],
        relationIds: ['r_s0_4', 'r_s0_3', 'r_s0_6', 'r_s0_5'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n61001001006', 'w_n61001001007'] },
      implication:
        'Peter is content to be both a slave and a messenger — as long as both titles belong to Jesus Christ. It is a small foretaste of the pattern the diagram will show again in a moment, this time naming Jesus himself.',
      greekTermIds: ['kai_1'],
    },
    {
      id: 'step-faith-equal',
      title: 'A faith equal to ours',
      body:
        'Peter, an apostle who walked with Jesus, writes to readers who never did — yet he calls their faith "equally precious" ([[isotimon]]) to his own, a faith they have "obtained" through something outside themselves. The diagram carries that faith on the main line, with its source named just below.',
      focus: {
        nodeIds: [
          'w_n61001001008',
          'w_n61001001009',
          'w_n61001001010',
          'w_n61001001011',
          'w_n61001001012',
        ],
        relationIds: ['r_s0_12', 'r_s0_13', 'r_s0_11', 'r_s0_10'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      caution:
        'The grammar simply names the faith as "equal in standing"; Peter does not spell out here every way apostle and reader compare. The weight of the claim comes from the sentence he is about to finish.',
      greekTermIds: ['isotimon'],
    },
    {
      id: 'step-granville-sharp',
      title: 'One article, two titles, one name',
      body:
        'Here is the ground of that faith: "through the [[dikaiosyne]] of [[tou]] [[theou]] ἡμῶν [[kai_2]] [[soteros]] Ἰησοῦ Χριστοῦ" — "the righteousness of our God and Savior Jesus Christ." Notice what the diagram shows: the article [[tou]] attaches only once, to [[theou]] ("God"); [[soteros]] ("Savior") is joined to it by [[kai_2]] as a matched partner under that same article, and the whole phrase leans on the one name Jesus Christ. One article, two titles, one person.',
      focus: {
        nodeIds: [
          'w_n61001001014',
          'w_n61001001015',
          'w_n61001001016',
          'w_n61001001017',
          'w_n61001001018',
          'w_n61001001019',
          'w_n61001001020',
          'w_n61001001021',
        ],
        relationIds: [
          'r_s0_17',
          'r_s0_16',
          'r_s0_15',
          'r_s0_14',
          'r_s0_19',
          'r_s0_18',
          'r_s0_20',
        ],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n61001001015', 'w_n61001001016', 'w_n61001001019'],
      },
      implication:
        'This is the identical construction behind Titus 2:13 ("our great God and Savior Jesus Christ") and it stands alongside Romans 9:5 as another place the New Testament calls Jesus Christ God outright. Peter grounds his readers\' faith in the righteousness of the very person he is writing to them about.',
      caution:
        'The rule this depends on (often named for the grammarian Granville Sharp) is narrow and well-defined: it applies to singular, personal, non-proper nouns joined by καί under one article — exactly what θεοῦ ("God") and σωτῆρος ("Savior") are here. It is not a general rule that any "X and Y" phrase means one thing; it is this specific shape. A few readers still take "God" and "Savior Jesus Christ" as two separate figures loosely joined — the grammar does not make that reading impossible, but it does make the one-person reading the natural one.',
      greekTermIds: ['dikaiosyne', 'tou', 'theou', 'kai_2', 'soteros'],
    },
  ],
  debateSummary: {
    issue:
      'Does "our God and Savior Jesus Christ" name one person — Jesus called both God and Savior — or two: God the Father, and separately the Savior Jesus Christ?',
    views: [
      {
        label: 'One person (the majority reading)',
        summary:
          'One article (τοῦ) governs both "God" and "Savior," joined by καί — the pattern Granville Sharp described for singular, personal, non-proper nouns. That shape points to a single referent: Jesus Christ is here called both "God" and "Savior." Most modern grammarians and translations (ESV, NIV, NASB, NKJV, and others) read it this way, and Peter uses the identical construction elsewhere in this letter (2 Peter 1:11; 2:20; 3:2, 18, "our Lord and Savior Jesus Christ") where all sides agree only one person is meant.',
      },
      {
        label: 'Two persons (a minority reading)',
        summary:
          'A minority reading takes "God" as the Father and "Savior Jesus Christ" as a separate figure added alongside, treating the shared article more loosely. This reading has to explain why the same repeated construction in Peter\'s later chapters is not read the same way, and it runs against how this grammatical pattern normally behaves.',
        cautions: [
          'This view is held more often for prior theological reasons than because the Greek naturally reads that way.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The single-article, one-καί pattern strongly favors one referent, and Peter\'s own repeated use of the same shape later in this letter makes a different meaning here unlikely. But grammar establishes a strong probability, not an ironclad proof by itself — it opens and constrains the question rather than settling every theological implication on its own.',
  },
  confessionalFrame:
    'Read confessionally: this verse stands with Titus 2:13, John 1:1, and Romans 9:5 as another place Scripture calls Jesus Christ God outright, worshiping him as fully divine alongside the Father — consistent with the church\'s historic confession of Christ\'s full deity.',
  greekTerms: [
    {
      id: 'symeon',
      tokenId: 't_n61001001001',
      surface: 'Συμεὼν',
      transliteration: 'Symeōn',
      lemma: 'Συμεών',
      gloss: 'Simon',
      parsing: 'proper noun, nominative masculine singular',
      explanation:
        'The Hebrew/Aramaic form of Peter\'s first name (as in Acts 15:14), used alongside his more familiar Greek name Πέτρος ("Peter") — the writer identifying himself at the very start of the letter.',
    },
    {
      id: 'kai_1',
      tokenId: 't_n61001001004',
      surface: 'καὶ',
      transliteration: 'kai',
      lemma: 'καί',
      gloss: 'and',
      parsing: 'conjunction',
      explanation:
        'The simple coordinating "and" joining "servant" and "apostle" — two titles Peter claims for himself, both governed by the one name that follows, "of Jesus Christ."',
    },
    {
      id: 'isotimon',
      tokenId: 't_n61001001009',
      surface: 'ἰσότιμον',
      transliteration: 'isotimon',
      lemma: 'ἰσότιμος',
      gloss: 'equally precious, of equal standing',
      parsing: 'adjective, accusative feminine singular',
      explanation:
        'A rare compound word (equal + honor/value) describing the faith of Peter\'s readers as of the same worth as an apostle\'s own faith — a faith Peter says they "obtained," not earned.',
    },
    {
      id: 'dikaiosyne',
      tokenId: 't_n61001001014',
      surface: 'δικαιοσύνῃ',
      transliteration: 'dikaiosynē',
      lemma: 'δικαιοσύνη',
      gloss: 'righteousness',
      parsing: 'noun, dative feminine singular',
      explanation:
        'The ground Peter names for his readers\' faith: "through the righteousness of our God and Savior Jesus Christ" — righteousness belonging to, and provided by, the very person the rest of the verse describes.',
    },
    {
      id: 'tou',
      tokenId: 't_n61001001015',
      surface: 'τοῦ',
      transliteration: 'tou',
      lemma: 'ὁ',
      gloss: 'the',
      parsing: 'definite article, genitive masculine singular',
      explanation:
        'The single article that opens the phrase "the God and Savior" — in the diagram it attaches only to "God" (θεοῦ), and "Savior" (σωτῆρος) is joined to that same article by καί rather than getting an article of its own.',
      implication:
        'This is the hinge of the whole construction: one article covering two nouns joined by "and" is what ties "God" and "Savior" to a single person rather than two.',
    },
    {
      id: 'theou',
      tokenId: 't_n61001001016',
      surface: 'θεοῦ',
      transliteration: 'theou',
      lemma: 'θεός',
      gloss: 'God',
      parsing: 'noun, genitive masculine singular',
      explanation:
        'The first of the two matched titles under the one article — a singular, common (not a proper name) noun, exactly the kind of word this construction is built to join to another title for one person.',
    },
    {
      id: 'kai_2',
      tokenId: 't_n61001001018',
      surface: 'καὶ',
      transliteration: 'kai',
      lemma: 'καί',
      gloss: 'and',
      parsing: 'conjunction',
      explanation:
        'The καί that joins "Savior" to "God" under the single article τοῦ — the same small word, doing the same joining work, that appears in Titus 2:13\'s "our great God and Savior."',
      caution:
        'Not every "X and Y" in Greek carries this force — the reading depends on the specific shape here (one article, two singular non-proper nouns, one καί), not on the conjunction alone.',
    },
    {
      id: 'soteros',
      tokenId: 't_n61001001019',
      surface: 'σωτῆρος',
      transliteration: 'sōtēros',
      lemma: 'σωτήρ',
      gloss: 'Savior',
      parsing: 'noun, genitive masculine singular',
      explanation:
        'The second matched title, joined to "God" under the same article — and, like θεοῦ, a singular common noun rather than a proper name, which is exactly the shape Granville Sharp\'s rule describes.',
      implication:
        'Sharing an article with "God" and standing right beside "Jesus Christ," this word identifies the Savior as the very person just called God — the same pairing Peter uses repeatedly later in this letter (1:11; 2:20; 3:2, 18).',
    },
  ],
};
