import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Titus 2:13 — the classic Granville Sharp construction: one article (τοῦ —
 * tou, "the") governing two singular, personal, non-proper nouns joined by
 * καί (kai, "and") — θεοῦ (theou, "God") … καὶ σωτῆρος (kai sōtēros, "and
 * Savior") — the whole phrase standing in apposition to one name, Ἰησοῦ
 * Χριστοῦ (Iēsou Christou, "Jesus Christ"). A companion to the shorter
 * 2 Peter 1:1 guide, which uses the identical shape. Authored against the
 * bundled SBLGNT passage `sblgnt_titus_17` (dump with `npm run guided:dump`).
 */
export const titus2: GrammarHighlightGuide = {
  id: 'guide-titus-2-13',
  title: 'Titus 2:13 — our great God and Savior',
  reference: 'Titus 2:13',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_titus_17'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    'Titus calls Jesus Christ our great God and Savior in one breath.',
  devotionalFrame:
    'Paul is not writing a creed here — he is telling Titus how godly people wait. But the sentence he reaches for quietly does something enormous: in a single breath it calls Jesus Christ "our great God and Savior." Keep your own Bible open and follow the diagram to see exactly how the Greek holds that together.',
  steps: [
    {
      id: 'step-two-things-awaited',
      title: 'Waiting for one glorious appearing',
      body:
        'Paul describes believers as people "awaiting" one reality that has two faces: the [[elpida]] ("hope") we hold onto now, and its ἐπιφάνειαν (epiphaneian, "appearing") — the moment that hope becomes visible. The diagram joins "hope" and "appearing" as a matched pair under one article, connected by [[kai]]: not two separate hopes, but one future reality named first as a hope, then as its unveiling.',
      focus: {
        nodeIds: [
          'w_n56002013001',
          'w_n56002013002',
          'w_n56002013004',
          'w_n56002013005',
          'w_n56002013006',
        ],
        relationIds: ['r_s17_73', 'r_s17_72', 'r_s17_71', 'r_s17_70'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n56002013004', 'w_n56002013006'] },
      implication:
        'Everything Paul has just said about living "self-controlled, upright, and godly" (v. 12) leans forward on this one verse: Christian character is shaped by what we are waiting for.',
      greekTermIds: ['elpida'],
    },
    {
      id: 'step-one-article-two-nouns',
      title: 'One article holds two titles together',
      body:
        'Now look at whose glory is appearing: "the glory of [[tou]] great [[theou]] and ([[kai]]) [[soteros]] of us." In Greek there is only one definite article here — [[tou]] — and it stands in front of [[theou]] alone. [[soteros]] gets no article of its own; instead it is joined to [[theou]] by [[kai]] as a matched partner sharing that same "the." The diagram draws this exactly: one article branching to "great God," that noun linked by a coordinator to "Savior" standing right beside it.',
      focus: {
        nodeIds: [
          'w_n56002013009',
          'w_n56002013010',
          'w_n56002013011',
          'w_n56002013012',
          'w_n56002013013',
        ],
        relationIds: ['r_s17_63', 'r_s17_61', 'r_s17_59', 'r_s17_60'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n56002013009', 'w_n56002013011', 'w_n56002013013'],
      },
      caution:
        'This pattern (often named for the 18th-century grammarian Granville Sharp) is narrow and well-defined: it applies reliably to singular, personal, non-proper nouns joined by [[kai]] under one article — exactly what [[theou]] and [[soteros]] are here. It is not a claim that every Greek "the X and Y" phrase works this way; it is this specific shape doing specific work.',
      greekTermIds: ['tou', 'theou', 'kai', 'soteros'],
    },
    {
      id: 'step-one-person-jesus-christ',
      title: 'God and Savior — one name follows: Jesus Christ',
      body:
        'The diagram carries this one step further: the whole phrase "our great God and Savior" stands beside [[iesou]] [[christou]] — Jesus Christ — in apposition, meaning the second phrase renames the first. Grammatically, "our great God and Savior" and "Jesus Christ" are not two people introduced back to back; they are one person, named twice — first by title, then by name.',
      focus: {
        nodeIds: ['w_n56002013011', 'w_n56002013015', 'w_n56002013016'],
        relationIds: ['r_s17_65', 'r_s17_64'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: {
        emphasizedNodeIds: ['w_n56002013011', 'w_n56002013015', 'w_n56002013016'],
      },
      implication:
        'Read together, the sentence Paul has built says something remarkable in a single breath: Jesus Christ is "our great God and Savior." Few verses in the New Testament call Jesus God this directly.',
      caution:
        'A minority of readers take "the great God" and "our Savior Jesus Christ" as two separate figures loosely paired rather than one person identified by both titles — see the debate note below for how the grammar bears on that question.',
      greekTermIds: ['iesou', 'christou'],
    },
    {
      id: 'step-whose-glory',
      title: 'The glory that belongs to him',
      body:
        'Follow the genitive chain all the way back: the ἐπιφάνειαν (epiphaneian, "appearing") is the appearing of "the glory," and that glory belongs, grammatically, to "our great God and Savior Jesus Christ." What believers are waiting to see unveiled is not an abstract brightness — it is the very glory of this one person.',
      focus: {
        nodeIds: [
          'w_n56002013006',
          'w_n56002013008',
          'cl_s17_35',
          'w_n56002013011',
        ],
        relationIds: ['r_s17_69', 'r_s17_67', 'r_s17_66'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n56002013008', 'w_n56002013011'] },
      implication:
        'This is why Paul can call it a "blessed" hope: what appears is not judgment first of all, but the glory of the very one who — the sentence goes on to say — already gave himself for us (v. 14).',
      caution:
        'The diagram traces a grammatical relationship — glory belonging to this person — it does not by itself unpack every facet of what that glory will look like when it appears; Paul leaves that for the rest of the letter and the church\'s larger hope.',
    },
  ],
  debateSummary: {
    issue:
      'Does "our great God and Savior Jesus Christ" name one person — Jesus called both God and Savior — or two: God the Father, and separately the Savior Jesus Christ?',
    views: [
      {
        label: 'One person — the standard reading',
        summary:
          'One article (τοῦ — tou, "the") governs both "God" and "Savior," joined by καί (kai, "and") — the pattern Granville Sharp described for singular, personal, non-proper nouns. That shape points to a single referent: Jesus Christ is here called both "God" and "Savior." This is the reading followed above, and it is also the reading of most modern grammarians and English translations (ESV, NIV, NASB, NKJV, CSB, and others); the identical construction appears again in 2 Peter 1:1 ("our God and Savior Jesus Christ"), and arguably in Romans 9:5.',
      },
      {
        label: 'Two persons — an alternate reading',
        summary:
          'A minority reading takes "the great God" as the Father and "our Savior Jesus Christ" as a second, distinct figure introduced alongside him, treating the shared article more loosely than the construction generally requires.',
        cautions: [
          'This view has to explain why θεός (theos, "God") and σωτήρ (sōtēr, "Savior") — both singular, personal, non-proper nouns joined by one καί (kai, "and") under one article — would behave differently here than the same construction does elsewhere in the New Testament.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The single-article, one-καί (kai, "and") shape strongly favors one referent rather than two, since θεός (theos, "God") and σωτήρ (sōtēr, "Savior") meet exactly the conditions (singular, personal, non-proper) the construction requires. But grammar establishes a strong likelihood, not an airtight proof by itself — it opens and constrains the question rather than settling every theological implication on its own.',
  },
  confessionalFrame:
    'Read confessionally: this verse names one person, Jesus Christ, as "our great God and Savior," and stands with Romans 9:5 and 2 Peter 1:1 as another place Scripture calls him God outright, worshiping him as fully divine alongside the Father — consistent with the church\'s historic confession of Christ\'s full deity.',
  greekTerms: [
    {
      id: 'elpida',
      tokenId: 't_n56002013004',
      surface: 'ἐλπίδα',
      transliteration: 'elpida',
      lemma: 'ἐλπίς',
      gloss: 'hope',
      parsing: 'noun, accusative feminine singular',
      explanation:
        'The "hope" Paul says every believer is waiting for — paired in the same breath with its "appearing," as one future reality described from two angles rather than two separate hopes.',
    },
    {
      id: 'tou',
      tokenId: 't_n56002013009',
      surface: 'τοῦ',
      transliteration: 'tou',
      lemma: 'ὁ',
      gloss: 'the',
      parsing: 'definite article, genitive masculine singular',
      explanation:
        'The single article that opens "the great God" — in the diagram it attaches only to θεοῦ (theou, "God"); "Savior" (σωτῆρος, sōtēros) is joined to that same article by καί (kai, "and") rather than taking one of its own.',
      implication:
        'This is the hinge of the whole construction: one article covering two nouns joined by "and" is what ties "God" and "Savior" to a single person rather than two.',
    },
    {
      id: 'theou',
      tokenId: 't_n56002013011',
      surface: 'θεοῦ',
      transliteration: 'theou',
      lemma: 'θεός',
      gloss: 'God',
      parsing: 'noun, genitive masculine singular',
      explanation:
        'The first of the two matched titles under the one article — a singular, common noun (not a proper name), exactly the kind of word this construction is built to join to another title for one person.',
    },
    {
      id: 'kai',
      tokenId: 't_n56002013012',
      surface: 'καὶ',
      transliteration: 'kai',
      lemma: 'καί',
      gloss: 'and',
      parsing: 'conjunction',
      explanation:
        'The small word that joins "Savior" to "God" under the single article τοῦ (tou, "the") — ordinary in itself, but doing careful work here: joining two titles under one shared article rather than introducing a new person with a new one.',
      caution:
        'Not every Greek "X and Y" carries this force. The reading depends on the whole shape here — one article, two singular non-proper nouns, one καί — not on the conjunction by itself.',
    },
    {
      id: 'soteros',
      tokenId: 't_n56002013013',
      surface: 'σωτῆρος',
      transliteration: 'sōtēros',
      lemma: 'σωτήρ',
      gloss: 'Savior',
      parsing: 'noun, genitive masculine singular',
      explanation:
        'The second matched title, joined to "God" under the same article — like θεοῦ (theou, "God"), a singular common noun rather than a proper name, which is exactly the shape Granville Sharp\'s rule describes.',
      implication:
        'Sharing an article with "God" and standing right beside "Jesus Christ," this word identifies the Savior as the very person just called God.',
    },
    {
      id: 'iesou',
      tokenId: 't_n56002013015',
      surface: 'Ἰησοῦ',
      transliteration: 'Iēsou',
      lemma: 'Ἰησοῦς',
      gloss: 'Jesus',
      parsing: 'proper noun, genitive masculine singular',
      explanation:
        'The name that the whole "God and Savior" phrase leans on in apposition — grammatically restating who has just been described by those two titles.',
    },
    {
      id: 'christou',
      tokenId: 't_n56002013016',
      surface: 'Χριστοῦ',
      transliteration: 'Christou',
      lemma: 'Χριστός',
      gloss: 'Christ',
      parsing: 'proper noun, genitive masculine singular',
      explanation:
        '"Christ" — "Anointed One," the title marking Jesus as God\'s promised king — set directly beside his name, completing the identification: "our great God and Savior, Jesus Christ."',
    },
  ],
};
