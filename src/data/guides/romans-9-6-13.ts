import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Romans 9:6–13 — Paul defends God's faithfulness ("the word of God has
 * not failed") by reasoning from Scripture itself: the flesh/promise
 * distinction, the purpose "according to election," and the Jacob/Esau
 * oracle. Walks four bundled SBLGNT sentences (dump with `npm run
 * guided:dump -- sblgnt_romans_230 sblgnt_romans_232 sblgnt_romans_235
 * sblgnt_romans_236`).
 */
export const romans9election: GrammarHighlightGuide = {
  id: 'guide-romans-9-6-13',
  title: 'Romans 9:6–13 — the word of God has not failed',
  reference: 'Romans 9:6–13',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: [
    'sblgnt_romans_230',
    'sblgnt_romans_232',
    'sblgnt_romans_235',
    'sblgnt_romans_236',
  ],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'advanced',
  summary:
    'Paul defends God’s faithfulness by tracing his argument straight through Scripture — from "children of the flesh" versus "children of the promise" to God’s purpose "according to election," and finally to Jacob and Esau, chosen before either was born or had done anything good or bad. The diagram follows the logic clause by clause, tracing God’s choice of these two individuals to its stated ground: not works, but him who calls.',
  devotionalFrame:
    'Romans 9 opens with Paul’s grief over Israel (vv. 1–5) and then faces a hard question head-on: if so much of Israel has not believed, has God’s own word failed? Verses 6–13 are Paul’s answer, and he builds it entirely out of Scripture. He first denies the failure outright (v. 6a). Then he explains why there is no failure: physical descent from Israel was never the same thing as belonging to true Israel (v. 6b–7) — not even being Abraham’s own son guaranteed inclusion, since God himself said the offspring would be reckoned "through Isaac." Verse 8 states the principle plainly: it is not the children of the flesh but the children of the promise who are counted as God’s offspring. Verses 9–10 press the point further — the promise was a spoken word, and Rebekah conceived twins by one and the same father, Isaac, removing any explanation by lineage. Then comes the sharpest case of all (vv. 11–13): before Jacob or Esau were born, or had done anything good or bad, in order that God’s purpose "according to election" might stand — not from works but from him who calls — it was said, "the elder will serve the younger," and Scripture adds, "Jacob I loved, but Esau I hated." Keep your own Bible open as you go. The diagram adds nothing to what your translation already says; it simply shows you the joints of Paul’s argument, so you can see him reasoning from Scripture toward God’s freedom in election — in defense of God’s own faithfulness, not against it.',
  debateSummary: {
    issue:
      'Paul’s language here — God’s purpose "according to election," a choice made before either brother had done anything, and "Jacob I loved, Esau I hated" — is one of Scripture’s clearest statements about election. But election of WHOM, to WHAT? Readers have long disagreed about whether Paul is describing God’s sovereign choice of individual persons unto salvation, or God’s choice of a covenant line/nation for a role in redemptive history. This guide teaches the first reading — individual, unconditional election — as its standard position in the main text above, and represents the second fairly below.',
    views: [
      {
        label: 'Individual, unconditional election (this guide’s standard reading)',
        summary:
          'On this reading, Paul’s point is that God freely and graciously chooses specific persons for salvation, apart from anything they do. The removal of birth order and behavior ("not yet born... not having done anything good or bad") is read as removing every possible human ground for God’s choice, and Jacob and Esau become a clear test case for that principle: God’s choice preceded any distinguishing act at all.',
        cautions: [
          'Paul’s own vocabulary in this stretch is corporate ("Israel," "seed," "children"), so this reading has to argue that the corporate language carries an individual, soteriological point rather than assume it.',
        ],
      },
      {
        label: 'Corporate / vocational election (alternate reading)',
        summary:
          'On this reading, Paul is describing which LINE would carry God’s promise and which ROLE nations (Israel through Jacob, Edom through Esau) would play in redemptive history — not a decree about Jacob’s and Esau’s personal eternal destinies. "Jacob I loved, Esau I hated" quotes Malachi 1:2–3, addressed centuries later to the nations descended from the brothers; "hated" is read as covenantal preference or relative "loved less" — an idiom attested elsewhere (Genesis 29:31; Luke 14:26) — rather than personal animus toward Esau the man.',
        cautions: [
          'This reading can understate how far Paul pushes the principle in the rest of the chapter (compare 9:16, 9:18, which speak in terms of mercy and hardening, not only history or vocation); it should not be used to strip the passage of any bearing on grace.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The syntax does real work here: it isolates God’s "purpose according to election" from birth order, ancestry, and prior conduct, and it sets "not from works" against "from him who calls" as the two candidate grounds for that purpose — ruling the first one out. What the grammar cannot decide on its own is the SCOPE of the election in view — individual, corporate, or (as many hold) both together in different senses. That question is worked out through how Paul continues the argument across Romans 9–11 and through the reader’s wider theology, not by this passage’s parsing alone.',
  },
  confessionalFrame:
    'This guide teaches this passage as one of Scripture’s clearest statements of God’s sovereign, gracious election of individual persons to salvation — a choice grounded in God’s own calling, not in birth order, ancestry, or foreseen merit. That is exactly why Paul, having just said this, anticipates an objection in the very next verse — "Is there injustice with God?" (9:14) — a question that only makes sense if the choice he has described discriminates between particular people, not merely assigns nations a role in history. Many in the Reformed tradition have read the passage this way for precisely this reason, and this guide states that reading plainly in its main text. The corporate/vocational alternative is represented fairly in the debate note above; Christians who hold it are reading the same grammar in good faith, but settling the fuller doctrinal question is ultimately a matter for the whole counsel of Scripture, not for a syntax diagram alone.',
  steps: [
    {
      id: 'step-word-not-failed',
      title: 'It is not as though God’s word has failed',
      body:
        'Paul states his conclusion before he argues for it. The Greek denies an entire claim at once: "it is not such, that the word of God [[ekpeptoken]]." Look at what the diagram does with that denial — it treats the whole statement "the word of God has failed" as the OBJECT of an implied verb "is," so the denial falls on the claim itself, not on one word inside it. Whatever hard question Israel’s unbelief raises for the rest of the chapter, Paul rules out one answer immediately: God’s own word is not the problem.',
      passageId: 'sblgnt_romans_230',
      focus: {
        nodeIds: ['cl_s230_0', 'impl_cl_s230_0', 'cl_s230_4', 'w_n45009006005', 'w_n45009006007'],
        relationIds: ['r_s230_1', 'r_s230_10', 'r_s230_5', 'r_s230_9'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n45009006005', 'w_n45009006007'] },
      implication:
        'This is Paul’s anchor for the whole passage. Everything in verses 6–13 — the distinctions, the Scripture quotations, the hard case of Jacob and Esau — exists to show HOW God’s word has not failed, not whether it has.',
      caution:
        'The verb [[ekpeptoken]] is perfect tense — it presents "failing" as a settled, complete state, the very state of affairs Paul is denying ever came about. That is what the tense contributes to the picture; it does not by itself prove the theological point. Paul spends the next three chapters making the actual case.',
      greekTermIds: ['ekpeptoken'],
    },
    {
      id: 'step-flesh-and-promise',
      title: 'Children of the flesh, children of the promise',
      body:
        'Paul has just said not all who descend from Israel belong to Israel (v. 6b), and not all of Abraham’s physical offspring are children of promise (v. 7) — only the line through Isaac. Verse 8 states the principle behind both examples, and the diagram shows it as two matched clauses joined by "but": "these" — the children of the [[sarkos]] — are not thereby the children of God; rather, the children of the [[epangelias]] are counted as offspring. Physical descent (σάρξ, sarx, flesh) and God’s spoken word (ἐπαγγελία, epangelia, promise) sit on opposite sides of the same picture.',
      passageId: 'sblgnt_romans_232',
      focus: {
        nodeIds: [
          'cl_s232_6',
          'w_n45009008005',
          'w_n45009008007',
          'w_n45009008009',
          'cl_s232_17',
          'w_n45009008014',
          'w_n45009008016',
        ],
        relationIds: ['r_s232_9', 'r_s232_15', 'r_s232_20', 'r_s232_25'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n45009008007', 'w_n45009008016'] },
      implication:
        'Paul is not questioning God’s word about Israel — he is showing that it was never anchored in bloodline to begin with. That was already true in Abraham’s own family, so this is not a new exception invented to explain Israel’s unbelief; it is how the promise always worked.',
      caution:
        '"Flesh" here means ordinary physical descent, not something sinful in itself — Ishmael was every bit Abraham’s son by nature. The contrast is about what CARRIES the promise (God’s spoken word) versus what does not (ancestry alone), not about the flesh being evil.',
      greekTermIds: ['sarkos', 'epangelias'],
    },
    {
      id: 'step-purpose-according-to-election',
      title: 'God’s purpose according to election',
      body:
        'The hardest case comes next: Rebekah’s twins, conceived by the same father at the same time (v. 10). Paul says God spoke about them before either was born or had done anything good or bad — "in order that God’s purpose [[ekloge]] might stand, not from works but from [[kalountos]]." The diagram sets "πρόθεσις" (prothesis, purpose) as the subject of that clause, "according to election" as the phrase describing it, and "not from works" against "from the one who calls" as the two candidate grounds for it. Grammar cannot remove birth order or behavior more thoroughly than this: neither son had even been born, let alone acted.',
      passageId: 'sblgnt_romans_235',
      focus: {
        nodeIds: ['cl_s235_13', 'w_n45009011014', 'w_n45009011013', 'w_n45009012003', 'w_n45009012007'],
        relationIds: ['r_s235_20', 'r_s235_17', 'r_s235_28', 'r_s235_21', 'r_s235_25'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n45009011013', 'w_n45009012007'] },
      implication:
        'Removing birth order and behavior from the picture makes God’s calling, not human achievement, the stated ground of his purpose here. Paul is describing God’s choice between Jacob and Esau as individuals — made before either had done anything, for better or worse — and grounded in nothing but the God who calls. That is exactly why Paul goes on to anticipate an objection in the very next verse, "Is there injustice with God?" (9:14): a question that only makes sense if God’s choice discriminates between particular people, not merely between nations after the fact.',
      caution:
        '[[ekloge]] is Paul’s own word here. Grammar can rule out one thing with precision — that God chose based on foreseen works — without independently proving every further point a reader might draw from it; this guide reads the WHO of that choice as individual persons (see above), while the corporate/vocational alternative is presented fairly in the debate note below.',
      greekTermIds: ['ekloge', 'kalountos'],
    },
    {
      id: 'step-elder-serve-younger',
      title: 'The elder shall serve the younger',
      body:
        'Before Rebekah’s sons were even born, she was given a word about them: "the elder will serve the younger." The diagram shows this as a quotation embedded inside the sentence — grammatically the object of "it was said to her" — so you can see it functioning exactly as Scripture: not Paul’s own commentary, but a quoted oracle he is building his argument on.',
      passageId: 'sblgnt_romans_235',
      focus: {
        nodeIds: [
          'cl_s235_31',
          'w_n45009012008',
          'w_n45009012009',
          'cl_s235_34',
          'w_n45009012012',
          'w_n45009012013',
          'w_n45009012015',
        ],
        relationIds: ['r_s235_32', 'r_s235_33', 'r_s235_40', 'r_s235_37', 'r_s235_35', 'r_s235_39'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n45009012012', 'w_n45009012013', 'w_n45009012015'] },
      implication:
        'This first oracle (echoing Genesis 25:23) names the relationship between the brothers themselves before Paul intensifies it. He is building toward the sharper, unmistakably personal pair of verbs in the very next line — "Jacob I loved, Esau I hated" — where the same choice is stated of each brother by name, not merely of the nations that would one day descend from them.',
    },
    {
      id: 'step-jacob-loved-esau-hated',
      title: 'Jacob I loved, Esau I hated',
      body:
        'Paul caps the argument with Malachi’s own words, and the diagram shows just how tightly parallel they are: two short clauses, the same shape, the same tense, one verb apiece — "Jacob I [[egapesa]]... Esau I [[emisesa]]." The symmetry is the point: God is described as acting, deliberately and personally, toward each brother, without waiting for either to earn it.',
      passageId: 'sblgnt_romans_236',
      focus: {
        nodeIds: [
          'cl_s236_0',
          'w_n45009013002',
          'cl_s236_3',
          'w_n45009013004',
          'w_n45009013005',
          'cl_s236_8',
          'w_n45009013008',
          'w_n45009013009',
        ],
        relationIds: ['r_s236_1', 'r_s236_13', 'r_s236_6', 'r_s236_4', 'r_s236_11', 'r_s236_9', 'r_s236_12'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n45009013004', 'w_n45009013005', 'w_n45009013008', 'w_n45009013009'],
      },
      implication:
        'This is the line every reader has to reckon with honestly: before Jacob or Esau had done anything, good or bad, Paul says God loved one and hated the other — a choice between two individual persons, not a verdict on nations pronounced after the fact. Paul is not softening it; he is quoting it as Scripture’s own description of God’s freedom to choose apart from anything either brother had done. (Readers differ on how the corporate dimension of Malachi’s original setting bears on Paul’s point here — see the debate note below — but Paul’s own argument turns on birth order and personal conduct, not national history.)',
      caution:
        '"Hated" translates a real word, and readers should not soften it into nothing. But Hebrew and Greek both use love/hate language for relative preference as well as emotion (compare Genesis 29:31; Luke 14:26, where "hating" one’s family means loving them less by comparison). Which sense is at work here — and what it implies about Esau himself — is exactly the question the debate note below addresses; the parallel grammar shows only that both verbs are asserted of God with equal directness.',
      greekTermIds: ['egapesa', 'emisesa'],
    },
  ],
  greekTerms: [
    {
      id: 'ekpeptoken',
      tokenId: 't_n45009006005',
      surface: 'ἐκπέπτωκεν',
      transliteration: 'ekpeptōken',
      lemma: 'ἐκπίπτω',
      gloss: 'has failed',
      parsing: 'perfect active indicative, 3rd singular',
      explanation:
        'Literally "has fallen out/off" — the verb behind "failed." Paul denies this is the state of affairs, and the whole clause "that the word of God has failed" is grammatically the thing being denied, not merely described.',
      implication:
        'Everything Paul argues in verses 6–13 exists to show HOW this denial holds up — that God’s word was never a promise about bloodline, so Israel’s unbelief does not break it.',
      caution:
        'The perfect tense presents the failing as a completed, standing state — exactly the state Paul says never came about. That is what the tense contributes; it does not by itself carry the argument.',
    },
    {
      id: 'sarkos',
      tokenId: 't_n45009008007',
      surface: 'σαρκὸς',
      transliteration: 'sarkos',
      lemma: 'σάρξ',
      gloss: 'flesh',
      parsing: 'noun, genitive feminine singular',
      explanation:
        'Ordinary physical descent — "the children of the flesh" are those who are simply, biologically, someone’s offspring. Paul sets this against "the children of the promise" as two different grounds for who counts as God’s people.',
      caution:
        'Not a moral judgment on the body or on physical descent itself — Ishmael was Abraham’s son "according to the flesh" without that being sinful. The contrast is about what carries God’s promise, not about flesh being bad.',
    },
    {
      id: 'epangelias',
      tokenId: 't_n45009008016',
      surface: 'ἐπαγγελίας',
      transliteration: 'epangelias',
      lemma: 'ἐπαγγελία',
      gloss: 'promise',
      parsing: 'noun, genitive feminine singular',
      explanation:
        'God’s own spoken word (as in the promise to Abraham and Sarah, quoted in v. 9). Being a "child of the promise" means being included by what God said and did, not by ordinary birth.',
      implication:
        'This is why the diagram’s contrast matters pastorally: belonging to God’s people was always a matter of his word taking hold, not of pedigree — which is good news for every reader, not only for physical descendants of Abraham.',
    },
    {
      id: 'ekloge',
      tokenId: 't_n45009011013',
      surface: 'ἐκλογὴν',
      transliteration: 'eklogēn',
      lemma: 'ἐκλογή',
      gloss: 'election',
      parsing: 'noun, accusative feminine singular',
      explanation:
        '"Choosing" or "selection" — the object of the preposition "according to" in "God’s purpose according to election." This is Paul’s own technical word for what he is describing; the diagram shows it modifying "purpose," the thing that "might stand."',
      implication:
        'Paul anchors "purpose" to "election" and then to "him who calls," not to "works" — the sequence of the sentence itself puts God’s initiative first.',
      caution:
        'The word tells you THAT Paul is talking about God choosing; it does not by itself tell you the SCOPE of that choice (individual salvation, a covenant line, or both). See the guide’s debate note.',
    },
    {
      id: 'kalountos',
      tokenId: 't_n45009012007',
      surface: 'καλοῦντος',
      transliteration: 'kalountos',
      lemma: 'καλέω',
      gloss: 'calling',
      parsing: 'present active participle, genitive masculine singular',
      explanation:
        'A participle used as a noun: "the one who calls." Paul names God this way — by his present, ongoing action — as the alternative ground to "works" for his purpose "according to election."',
      implication:
        'God is described here by what he DOES (calling), not by a static title. The contrast "not from works but from him who calls" makes God’s own initiative, not human performance, the stated basis for what follows.',
      caution:
        'A present-tense participle here describes God as one who calls; it is not making a separate claim about how long or how often — read it as "the calling one," not as a claim about frequency.',
    },
    {
      id: 'egapesa',
      tokenId: 't_n45009013005',
      surface: 'ἠγάπησα',
      transliteration: 'ēgapēsa',
      lemma: 'ἀγαπάω',
      gloss: 'I loved',
      parsing: 'aorist active indicative, 1st singular',
      explanation:
        'God speaking in the first person, quoting Malachi 1:2: "Jacob I loved." The diagram places it in a clause perfectly parallel to the next one, with Jacob as its direct object.',
      caution:
        'The aorist views the loving as a simple whole, not as a comment on how long it lasted or how it felt moment to moment. Do not read "instant, one-time love" into the tense itself — the point is the parallel with the next verb, not the tense’s length.',
    },
    {
      id: 'emisesa',
      tokenId: 't_n45009013009',
      surface: 'ἐμίσησα',
      transliteration: 'emisēsa',
      lemma: 'μισέω',
      gloss: 'I hated',
      parsing: 'aorist active indicative, 1st singular',
      explanation:
        'The matching verb for Esau, quoting Malachi 1:3. Grammatically it is built exactly like "I loved" in the clause before it — same person, same tense, same voice, a matching direct object — which is what makes the pair so striking.',
      implication:
        'The grammar’s symmetry is deliberate: God is described acting toward each brother with equal directness, before either had done anything to earn either response.',
      caution:
        'Hebrew and Greek both use love/hate language for relative preference as well as raw emotion (compare Genesis 29:31; Luke 14:26). Whether "hated" here means comparative covenantal preference or something stronger is a real interpretive question — the parsing alone (aorist, active, matching "loved") does not settle it. See the guide’s debate note.',
    },
  ],
};
