import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Acts 2:39 — "the promise is for you and for your children" — authored against
 * the bundled SBLGNT passage `sblgnt_acts_47` (dump with
 * `npm run guided:dump -- sblgnt_acts_47`), with a STACKED Hebrew parallel to
 * Genesis 17:12 (`wlc_genesis_1_11`, from the WLC Lowfat bundle).
 *
 * The grammar hook is covenant parallelism: Peter's recipients — "to you and to
 * your children, and to all who are far off" — echo the shape of the covenant
 * sign given to Abraham ("to you and to your offspring throughout your
 * generations"). Three steps lay the Genesis sentence beneath the Acts sentence
 * (`secondaryPassageId`) so the reader can see the same addressees — you, your
 * offspring, and even the foreigner in the household — carried forward.
 *
 * The guide is written from a confessional Reformed stance (the covenant sign of
 * inclusion passing from circumcision to baptism), stated as a clearly-labelled
 * confessional note, with a fair credobaptist reading in the debate summary.
 */
export const acts239: GrammarHighlightGuide = {
  id: 'guide-acts-2-39',
  title: 'Acts 2:39 — the promise is for you and for your children',
  reference: 'Acts 2:39',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_acts_47', 'wlc_genesis_1_11'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    'Peter grounds his Pentecost call in a promise, and the way he names its recipients — "to you and to your children, and to all who are far off" — deliberately echoes the covenant God made with Abraham. Three steps stack the Greek of Acts 2:39 over the Hebrew of Genesis 17:12 so you can see the same covenant shape in both, and a closing clause that bounds the wide offer by God\'s own call.',
  devotionalFrame:
    'A promise, not just a command: after telling the crowd to repent and be baptized, Peter tells them why — "the promise is for you." Watch how he addresses it. The words he chooses for its recipients are the words of the old covenant made with Abraham, now opened wider than ever. Read the two diagrams together and you will see one story of grace, kept and enlarged.',
  confessionalFrame:
    'A confessional note (confessional Reformed): this tradition reads Acts 2:39 within one unfolding covenant of grace — the promise sworn to Abraham ("to you and to your offspring") carried forward to Peter\'s hearers and their children, with baptism now answering to circumcision as the sign that marks covenant inclusion, and the promise widened to "all who are far off." That is why many in this stream baptize believers\' children: not because Acts 2:39 by itself proves it, but because they read it as one moment in a single covenant story. It is offered here as a labelled confessional conviction, distinct from the fair summary of both readings below — not as a conclusion the grammar of this one verse forces.',
  debateSummary: {
    issue:
      'Who are the "you and your children" of the promise, and what does naming them settle about baptism? The clause fixes the recipients precisely — the hearers, their descendants, and all who are far off — and then bounds them all with a relative clause: "as many as the Lord our God calls." What it does NOT do is state, in so many words, who should be baptized or when. That is the question two faithful readings answer differently.',
    views: [
      {
        label: 'Covenantal / paedobaptist reading',
        summary:
          'Peter\'s "to you and to your children" repeats the covenant formula spoken to Abraham (Genesis 17:7, 17:12), where the sign of the covenant was placed on households, children included. On this reading the promise still runs to believers together with their children, and baptism — the new-covenant sign of inclusion — is rightly given to them, just as circumcision was, while awaiting the faith to which the promise calls them.',
        cautions: [
          'The verse names the children as recipients of the promise; it does not, in its own syntax, command that they be baptized as infants. That step is drawn from the covenant\'s continuity across both Testaments, not from this clause alone.',
        ],
      },
      {
        label: 'Credobaptist reading',
        summary:
          'On this reading "your children" and "all who are far off" describe the promise\'s wide reach across generations and nations — it is offered to hearers and descendants alike — but the closing clause, "as many as the Lord our God calls," identifies the actual recipients as those who themselves are called and, answering that call, repent and believe (2:38). Baptism then follows profession of faith, so the promise being FOR one\'s children means it is genuinely held out to them, to be received as they too are called.',
        cautions: [
          'This reading has to account for the deliberate echo of the Abrahamic covenant formula, where the sign did fall on children — a fair weight it answers from the newness of the new covenant and the calling clause, not by denying the parallel.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The syntax does real work and then stops short. It fixes the recipients of the promise — "to you," "to your children," "to all who are far off" — as a coordinated series, and it bounds every one of them with the relative clause "as many as the Lord our God calls," whose verb is an aorist subjunctive of contingency (whomever he may call). So the grammar settles that the promise is addressed to households and nations, and that its reach is defined by God\'s calling. It does not settle, by itself, the subjects or mode of baptism — that is a question the whole covenant witness of Scripture, not one verse\'s diagram, is asked to answer.',
  },
  steps: [
    {
      id: 'step-promise-for-you',
      title: 'The promise is for you',
      body:
        'Peter\'s sentence has a quiet centre: "the promise" — [[epaggelia]] — is its subject, and the very first word of the verse is its recipient, [[hymin]], "to you." The diagram draws ἡ ἐπαγγελία as the subject standing on the baseline, and ὑμῖν slanting back from the verb ἐστίν as a predicate dative — "the promise is TO YOU." Before any argument about children or baptism, notice what kind of word this is: covenant language, addressed to persons. A promise is made to someone.',
      focus: {
        nodeIds: ['w_n44002039005', 'w_n44002039004', 'w_n44002039001'],
        relationIds: ['r_s47_5', 'r_s47_4', 'r_s47_3'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: {
        emphasizedNodeIds: ['w_n44002039005', 'w_n44002039004', 'w_n44002039001'],
      },
      implication:
        'The gospel Peter preaches is not first a demand but a promise — and a promise, by its grammar, is directed: it is FOR someone. The whole verse now unfolds the "someone."',
      greekTermIds: ['epaggelia', 'hymin'],
    },
    {
      id: 'step-and-to-children',
      title: '…and to your children',
      body:
        'The recipients widen at once: καὶ [[teknois]] ὑμῶν — "and to your children." The diagram draws τοῖς τέκνοις ὑμῶν as a second dative joined by καί to the first (ὑμῖν), with ὑμῶν ("of you") hanging beneath τέκνοις as a possessive genitive. Peter does not say the promise is for adults who decide; he names a household — you, and the children who are yours. This is the covenant-household pattern, and it is deliberate. The next step shows where he learned to speak this way.',
      focus: {
        nodeIds: ['w_n44002039008', 'w_n44002039009', 'w_n44002039007', 'w_n44002039006'],
        relationIds: ['r_s47_9', 'r_s47_10', 'r_s47_23'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: {
        emphasizedNodeIds: ['w_n44002039008', 'w_n44002039009', 'w_n44002039007', 'w_n44002039006'],
      },
      implication:
        'The promise is addressed to a family line, not only to the individuals in the crowd — "you and your children" is a single covenant address.',
      greekTermIds: ['teknois'],
    },
    {
      id: 'step-abraham-parallel',
      title: 'The same shape as the sign given to Abraham',
      body:
        'Lay Peter\'s words over the covenant God made with Abraham and the shape matches. In Genesis 17 the sign of the covenant is given "to you and to your offspring throughout your generations." The stacked Hebrew diagram below highlights exactly those words: לָכֶם, "to you"; לְדֹרֹתֵיכֶם, "throughout your generations"; and מִזַּרְעֲךָ, "your offspring." Peter\'s "to you and to your children" (highlighted above) is not a new formula — it is the old covenant language of Genesis 17:7, the promise "to you and to your offspring," now spoken to a Pentecost crowd. He is telling them the ancient promise still runs to them and to theirs.',
      focus: {
        nodeIds: ['w_n44002039001', 'w_n44002039008'],
      },
      panZoom: { fit: 'nodes', padding: 200 },
      highlights: {
        emphasizedNodeIds: ['w_n44002039001', 'w_n44002039008'],
      },
      secondaryPassageId: 'wlc_genesis_1_11',
      secondaryTitle: 'Genesis 17:12 — the covenant sign given to Abraham',
      secondaryFocus: {
        nodeIds: ['w_o010170120052', 'w_o010170120082', 'w_o010170120083', 'w_o010170120182'],
      },
      implication:
        'Peter is quoting the covenant\'s own grammar. The promise "to you and to your children" carries the Abrahamic "to you and to your offspring" forward — covenant continuity, heard in the very wording.',
      caution:
        'The verbal echo is real, but it establishes continuity of the PROMISE, not automatically the mode or subjects of the sign. Read the debate note for how faithful readers weigh that continuity differently.',
      greekTermIds: ['teknois'],
    },
    {
      id: 'step-sign-changes',
      title: 'The sign changes, the covenant stands',
      body:
        'What did the Abrahamic covenant place on "you and your offspring"? The stacked Genesis diagram highlights its verb: יִמּוֹל — "he shall be circumcised." Circumcision was the sign of covenant inclusion given to the household. When Peter answers the crowd, the command that stands in that place is baptism (2:38, the verse just before), now named as the sign for those who receive the promise. The covenant of grace runs unbroken from Abraham to Pentecost; the sign at its threshold moves from circumcision to baptism.',
      focus: {
        nodeIds: ['w_n44002039005', 'w_n44002039001', 'w_n44002039008'],
        relationIds: ['r_s47_5', 'r_s47_3'],
      },
      panZoom: { fit: 'nodes', padding: 170 },
      highlights: {
        emphasizedNodeIds: ['w_n44002039005', 'w_n44002039001', 'w_n44002039008'],
      },
      secondaryPassageId: 'wlc_genesis_1_11',
      secondaryTitle: 'Genesis 17:12 — "he shall be circumcised"',
      secondaryFocus: {
        nodeIds: ['w_o010170120041'],
      },
      implication:
        'One covenant, one people, a changed sign: circumcision gave way to baptism as the appointed mark of inclusion, while the promise it seals stays the same.',
      caution:
        'That circumcision "answers to" baptism is a canonical and theological connection (compare Colossians 2:11–12), not something the syntax of Acts 2:39 by itself proves. The diagram shows the parallel address; the sacramental link is drawn from the wider Scriptures.',
      greekTermIds: ['epaggelia'],
    },
    {
      id: 'step-far-off',
      title: 'All who are far off — the promise widens',
      body:
        'The recipients widen a third time, and further than any Israelite hearer expected: καὶ [[makran]] — "and to all who are far off." The diagram draws πᾶσι τοῖς εἰς μακρὰν as a third member of the series, joined by καί, with the prepositional phrase εἰς μακρὰν ("at a distance") hanging beneath it. Even Genesis\' covenant sign reached beyond the natural family — the Genesis diagram below highlights בֶּן־נֵכָר, "the son of a foreigner," the outsider brought into Abraham\'s household. Peter takes that widening to its horizon: the promise now reaches everyone far off, an echo of Isaiah 57:19, "peace to the far and the near."',
      focus: {
        nodeIds: [
          'w_n44002039011',
          'w_n44002039012',
          'w_n44002039013',
          'w_n44002039014',
          'w_n44002039010',
        ],
        relationIds: ['r_s47_12', 'r_s47_11', 'r_s47_21', 'r_s47_22'],
      },
      panZoom: { fit: 'nodes', padding: 170 },
      highlights: {
        emphasizedNodeIds: [
          'w_n44002039011',
          'w_n44002039012',
          'w_n44002039013',
          'w_n44002039014',
        ],
      },
      secondaryPassageId: 'wlc_genesis_1_11',
      secondaryTitle: 'Genesis 17:12 — even the foreigner in the household',
      secondaryFocus: {
        nodeIds: ['w_o010170120141', 'w_o010170120151'],
      },
      implication:
        'The covenant was never merely ethnic even in Genesis — the foreigner in the household bore its sign — and here it opens to all who are far off. The promise\'s reach is as wide as the calling that defines it.',
      greekTermIds: ['makran'],
    },
    {
      id: 'step-whom-the-lord-calls',
      title: '…everyone whom the Lord our God calls',
      body:
        'The wide offer ends inside a boundary. Peter closes with a relative clause — ὅσους ἂν [[proskalesetai]] κύριος ὁ θεὸς ἡμῶν, "as many as the Lord our God calls to himself." The diagram draws this as a clause hanging beneath "all who are far off," with κύριος ὁ θεὸς ἡμῶν as its subject and ὅσους as the ones called. The verb προσκαλέσηται is aorist SUBJUNCTIVE with ἄν — a verb of contingency: "whomever he may call." So the promise is held out to you, to your children, and to all far off — and its recipients are, finally, as many as the Lord calls.',
      focus: {
        nodeIds: [
          'w_n44002039017',
          'w_n44002039015',
          'w_n44002039018',
          'w_n44002039020',
          'w_n44002039021',
        ],
        relationIds: ['r_s47_14', 'r_s47_15', 'r_s47_19', 'r_s47_16', 'r_s47_18', 'r_s47_20'],
      },
      panZoom: { fit: 'nodes', padding: 160 },
      highlights: {
        emphasizedNodeIds: ['w_n44002039017', 'w_n44002039018', 'w_n44002039020'],
      },
      implication:
        'The generous width of the promise and the sovereignty of the call are held in one sentence: offered to households and nations, its recipients defined by whom the Lord calls to himself.',
      caution:
        'προσκαλέσηται is an aorist subjunctive of contingency — read it as "as many as the Lord calls," a genuine and ongoing calling, not "once-for-all." The aorist views the calling as a whole act; it does not measure how often or how long God calls.',
      greekTermIds: ['proskalesetai'],
    },
  ],
  greekTerms: [
    {
      id: 'epaggelia',
      tokenId: 't_n44002039005',
      surface: 'ἐπαγγελία',
      transliteration: 'epangelia',
      lemma: 'ἐπαγγελία',
      gloss: 'promise',
      parsing: 'noun, nominative feminine singular (subject of ἐστίν)',
      explanation:
        '"Promise" — the subject of the verse. A word of covenant: something God has pledged and will keep. It carries the whole verse, which then names to whom the promise runs.',
      implication: 'The gospel is announced first as a promise God makes, not merely a duty we perform.',
    },
    {
      id: 'hymin',
      tokenId: 't_n44002039001',
      surface: 'ὑμῖν',
      transliteration: 'hymin',
      lemma: 'σύ',
      gloss: 'to you',
      parsing: 'pronoun, dative plural (2nd person)',
      explanation:
        '"To you" — a dative of the persons the promise is for, fronted to the very first word of the verse for emphasis. The promise is addressed, and it is addressed to the hearers first.',
    },
    {
      id: 'teknois',
      tokenId: 't_n44002039008',
      surface: 'τέκνοις',
      transliteration: 'teknois',
      lemma: 'τέκνον',
      gloss: 'children',
      parsing: 'noun, dative neuter plural',
      explanation:
        '"Children" — a second dative joined by καί, with ὑμῶν ("of you") beneath it: "to your children." The wording deliberately echoes the covenant formula spoken to Abraham, "to you and to your offspring" (Genesis 17:7).',
    },
    {
      id: 'makran',
      tokenId: 't_n44002039014',
      surface: 'μακρὰν',
      transliteration: 'makran',
      lemma: 'μακρός',
      gloss: 'far off, at a distance',
      parsing: 'adjective used adverbially, accusative feminine singular (object of εἰς)',
      explanation:
        '"Far off" — governed by εἰς, "at a distance." "All who are far off" widens the promise past the immediate household to the nations, echoing Isaiah 57:19; in Acts the far-off will prove to include the Gentiles.',
    },
    {
      id: 'proskalesetai',
      tokenId: 't_n44002039017',
      surface: 'προσκαλέσηται',
      transliteration: 'proskalesētai',
      lemma: 'προσκαλέομαι',
      gloss: 'shall call to himself',
      parsing: 'aorist middle subjunctive, 3rd person singular',
      explanation:
        'An aorist subjunctive with ἄν — a verb of contingency, "whomever he may call to himself." The middle voice keeps the calling God\'s own act. It bounds the wide promise: its recipients are as many as the Lord calls.',
      caution:
        'The aorist views the calling as a single whole; it does not mean "once-for-all." Read the clause as "as many as the Lord calls," an ongoing, effectual calling.',
    },
  ],
};
