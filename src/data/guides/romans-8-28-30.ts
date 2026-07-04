import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Romans 8:28–30 — the ordo salutis "golden chain": προέγνω → προώρισεν →
 * ἐκάλεσεν → ἐδικαίωσεν → ἐδόξασεν. The whole range is ONE Greek sentence,
 * bundled as `sblgnt_romans_216` (dump with `npm run guided:dump --
 * sblgnt_romans_216`). The diagram hook: FIVE aorist verbs share one implied
 * subject (God — Greek drops the pronoun) and one relayed thread of objects
 * ("those whom… these also…"), and the coordination + relative-clause
 * structure makes the chain visible as a single connected shape.
 *
 * Aspect guardrail (binding): the aorists are viewed as a chain seen whole —
 * NEVER "aorist = once-for-all". ἐδόξασεν is presented as the striking
 * past-viewed certainty of a future reality (confident anticipation), stated
 * carefully. The confessional note is labelled "confessional Reformed"; the
 * debate summary is fair to Arminian and corporate construals of προέγνω.
 */
export const romans8chain: GrammarHighlightGuide = {
  id: 'guide-romans-8-28-30',
  title: 'Romans 8:28–30 — the golden chain',
  reference: 'Romans 8:28–30',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_romans_216'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    'Five verbs, one sentence: foreknew, predestined, called, justified, glorified. Paul writes the famous "golden chain" as a single Greek sentence whose diagram shows five verbs sharing one subject — God — and handing one group of people from link to link. "Foreknew" here is God\'s setting his covenant love on these people beforehand (the same sense as "you only have I known," Amos 3:2), not merely his foresight of their future choices. Walk the chain and see why even "glorified" is written as if already done.',
  devotionalFrame:
    'Romans 8:28 is one of the most-quoted promises in the Bible — and verses 29–30 are the reason Paul dares to make it. "All things work together for good" is not optimism; it rests on a chain of divine acts that runs from before creation to beyond the end. Watch the diagram: one subject does every verb, and the same people are carried through every link. The promise is as strong as the hands that hold the chain.',
  confessionalFrame:
    'A confessional note (confessional Reformed): this tradition reads Romans 8:29–30 as the unbreakable chain of salvation — one purpose of God running from foreknowledge to glory, in which everyone he fore-loved is finally glorified, none lost along the way. Here "foreknew" is read relationally, in the Hebrew sense of "know" as covenant commitment (Amos 3:2; Genesis 18:19): God set his love on these particular persons before the chain\'s first link, rather than foreseeing a choice of theirs. That is why these verses anchor the doctrines of election and the perseverance of the saints: the chain\'s links are all God\'s acts, and the same "whom… these also" thread runs through every one. This is offered as a labelled confessional conviction; the fair summary of other readings of προέγνω (proegnō, "foreknew") is below, and readers who construe that word differently still stand under the same promise of verse 28.',
  debateSummary: {
    issue:
      'What does προέγνω (proegnō, "he foreknew") mean, and whom does the chain carry? The grammar fixes a great deal: the same relative-pronoun thread ("those whom… these also") runs through all five verbs, and God is the subject of every one. What the syntax does not settle is what "foreknew" is — fore-love of persons, foresight of faith, or the choice of a people in the Messiah. Careful readers take each view.',
    views: [
      {
        label: 'Relational fore-love — the standard reading in this guide',
        summary:
          'In Scripture "to know" often means to love and commit to someone, not merely to have information about them ("you only have I known," Amos 3:2). On this reading προέγνω (proegnō) means God fore-loved particular persons — set his covenant affection on them beforehand — and the chain then carries those same persons all the way to glory. The verb\'s object is people ("those whom"), not facts about people, which this view takes as decisive.',
        cautions: [
          'That "know" can mean "love" does not prove it must here; the claim rests on the Hebrew idiom and the shape of the chain, and it should be argued from those, not asserted from the lexicon alone.',
        ],
      },
      {
        label: 'Foresight of faith — an alternate reading (classic Arminian)',
        summary:
          'On this reading God foreknew who would believe — his eternal knowledge of each person\'s free response — and predestined those believers to be conformed to his Son. This keeps a real human response inside the chain\'s first link and is how many careful interpreters, ancient and modern, have read the verb. It takes προγινώσκω (proginōskō) in its ordinary Greek sense of knowing in advance.',
        cautions: [
          'The text says God foreknew persons ("those whom"), not that he foreknew their faith — the object "their faith" has to be supplied. Advocates answer that knowing persons includes knowing their response; the syntax itself does not adjudicate.',
        ],
      },
      {
        label: 'Corporate election (a people in the Messiah)',
        summary:
          'On this reading the chain describes God\'s purpose for a people as a people: the group God fore-loved in Christ is destined, called, justified, and glorified, and individuals share the chain\'s destiny by belonging to that body. The plural pronouns and the goal — a Son with "many brothers and sisters" — fit a corporate horizon well.',
        cautions: [
          'The chain\'s hand-off grammar ("whom he called, these he also justified") still speaks of the same ones at every link, so a corporate reading must explain how the group\'s destiny relates to the persons in it — a question the diagram raises but cannot answer.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The syntax settles the chain\'s shape and refuses to settle its first word. It makes God the one subject of all five verbs, and the relative-pronoun relay (οὓς… τούτους καί — hous… toutous kai, "those whom… these also") explicitly carries the same object group from link to link — that much is drawn in the diagram, not inferred. But the meaning of προέγνω (proegnō, "he foreknew") is a question of lexical sense and biblical idiom, which no diagram can decide. English translations rightly render it "foreknew" and leave the theological question open — exactly what the Greek does.',
  },
  steps: [
    {
      id: 'step-all-things-for-good',
      title: 'All things work together for good — for whom?',
      body:
        'Paul opens with what "we know": πάντα (panta) [[sunergei]] εἰς ἀγαθόν (eis agathon) — "all things work together for good." The diagram draws πάντα (panta, "all things") as the subject of the verb [[sunergei]], with εἰς ἀγαθόν (eis agathon, "for good") hanging beneath it, and the whole clause standing as the object of "we know." Notice the promise is not addressed to everyone: the dative phrase "to those who love God" hangs from the verb, marking whose good all things serve. (A famous textual variant adds ὁ θεός (ho theos) as an explicit subject — "God works all things together for good"; see the alternate reading below. Either way, the next two verses name God as the one at work.)',
      focus: {
        nodeIds: ['w_n45008028001', 'w_n45008028009', 'w_n45008028008', 'w_n45008028011'],
        relationIds: ['r_s216_21', 'r_s216_3', 'r_s216_9', 'r_s216_11', 'r_s216_10', 'r_s216_8'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n45008028009', 'w_n45008028008'] },
      implication:
        'The verse is a promise with an address on it: all things serve the good of those who love God. Verses 29–30 will explain why Paul can say something so sweeping — and who is really doing the working.',
      caution:
        'Whether the subject is "all things" or (with some early manuscripts) "God," no reading of this verse leaves events working for good on their own — the chain that follows puts God\'s purpose behind every link.',
      greekTermIds: ['sunergei'],
      contested: {
        issueId: 'iss_rom_8_28_variant_sblgnt',
        note:
          'Some weighty early manuscripts (𝔓46 A B) read "God works all things together for good," adding ὁ θεός (ho theos) as the explicit subject. Open the alternate reading to see the variant fairly presented — the base text and the variant both end in the same promise.',
      },
    },
    {
      id: 'step-called-according-to-purpose',
      title: 'Called according to his purpose',
      body:
        'Paul immediately re-describes the same people: "those who are [[kletois]] — called — according to his [[prothesin]], his purpose." The diagram hangs κατὰ πρόθεσιν (kata prothesin, "according to purpose") beneath the participle, qualifying the calling: it did not begin with them. This one small phrase is the doorway into verses 29–30. Paul now explains what that purpose is — and he does it with a chain of five verbs.',
      focus: {
        nodeIds: ['w_n45008028015', 'w_n45008028014', 'w_n45008028013', 'w_n45008028016'],
        relationIds: ['r_s216_18', 'r_s216_17', 'r_s216_16', 'r_s216_19'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n45008028015', 'w_n45008028014'] },
      implication:
        '"Those who love God" and "those called according to his purpose" are the same people described from two directions — their love for God, and God\'s prior purpose for them. The chain will keep both truths in view.',
      greekTermIds: ['kletois', 'prothesin'],
    },
    {
      id: 'step-foreknew-predestined',
      title: 'Whom he foreknew, he also predestined',
      body:
        'The chain begins: οὓς (hous, "whom") [[proegno]] καὶ (kai, "also") [[proorisen]] — "those whom he foreknew, he also predestined." Look at the diagram\'s structure: the relative clause "whom he foreknew" is itself the OBJECT of "he predestined." The people known are handed, as a whole clause, into the next verb. And notice what is missing: neither verb has a written subject. Greek can drop the pronoun, and Paul does — the diagram shows two verbs standing with no subject word, because the subject is carried silently from verse 28: God. Here "foreknew" carries the relational, covenantal sense of biblical "know" (as in "you only have I known," Amos 3:2): God set his love on these particular persons before the chain\'s first link, not merely foresaw their future faith — see the debate summary for the readings some interpreters take instead.',
      focus: {
        nodeIds: ['w_n45008029002', 'w_n45008029003', 'w_n45008029005'],
        relationIds: ['r_s216_26', 'r_s216_27', 'r_s216_28', 'r_s216_29'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n45008029003', 'w_n45008029005'] },
      implication:
        'The first link sets the pattern for every link after it: a group of people ("whom"), a divine verb, and a hand-off to the next verb. The chain is built out of relative clauses — that is what makes it a chain.',
      caution:
        '[[proegno]]\'s object is people, not facts — "those whom he foreknew." The syntax alone does not settle what kind of knowing that is; this guide reads it relationally (see the debate note for the alternate readings some interpreters prefer).',
      greekTermIds: ['proegno', 'proorisen'],
    },
    {
      id: 'step-conformed-to-image',
      title: 'Predestined — to what? Conformed to the image of his Son',
      body:
        'Predestination in this sentence has a stated destination: [[summorphous]] τῆς εἰκόνος τοῦ υἱοῦ αὐτοῦ (tēs eikonos tou huiou autou, "of the image of his Son") — "conformed to the image of his Son." The diagram draws [[summorphous]] as a complement of "predestined," with a cascade of genitives beneath it: conformed — to the image — of the Son — of him. And the purpose clause beneath that gives the goal behind the goal: "that he might be the [[prototokon]] — firstborn — among many brothers and sisters." God\'s eternal purpose is not an abstraction; it is a family portrait, with the Son at its head.',
      focus: {
        nodeIds: [
          'w_n45008029006',
          'w_n45008029008',
          'w_n45008029010',
          'w_n45008029011',
          'w_n45008029016',
        ],
        relationIds: ['r_s216_35', 'r_s216_34', 'r_s216_32', 'r_s216_30', 'r_s216_44'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n45008029006', 'w_n45008029016'] },
      implication:
        'Whatever else predestination means, its stated goal here is Christlikeness — a destiny of family resemblance to the Son. The chain exists so that Christ will have many brothers and sisters who look like him.',
      greekTermIds: ['summorphous', 'prototokon'],
    },
    {
      id: 'step-called-justified',
      title: 'The relay: predestined → called → justified',
      body:
        'Now watch the sentence run. "Those whom he predestined, these he also [[ekalesen]] — called; and whom he called, these he also [[edikaiosen]] — justified." The diagram shows the relay mechanism plainly: each new clause opens with a relative clause that REPEATS the previous link\'s verb ("whom he predestined…", "whom he called…"), hands its people to the pronoun τούτους (toutous, "these"), and passes them to the next verb with καί (kai, "also"). No one is added between links, and no one is dropped: the ones predestined are the ones called, and the ones called are the ones justified. The grammar itself is the argument.',
      focus: {
        nodeIds: [
          'w_n45008030003',
          'w_n45008030001',
          'w_n45008030004',
          'w_n45008030006',
          'w_n45008030008',
          'w_n45008030009',
          'w_n45008030010',
          'w_n45008030012',
        ],
        relationIds: [
          'r_s216_51',
          'r_s216_50',
          'r_s216_52',
          'r_s216_53',
          'r_s216_60',
          'r_s216_59',
          'r_s216_61',
        ],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n45008030006', 'w_n45008030012'] },
      implication:
        'The "whom… these also" relay is Paul\'s way of welding the links shut: each verb\'s finished group is exactly the next verb\'s starting group. That is why this passage reads like a chain and diagrams like one.',
      greekTermIds: ['ekalesen', 'edikaiosen'],
    },
    {
      id: 'step-glorified',
      title: 'And glorified — a future written as finished',
      body:
        'The last link is the astonishing one: "whom he justified, these he also [[edoxasen]] — GLORIFIED." Glorification is future — Paul has just spent this chapter groaning for it (8:18–25) — yet he writes it with the same past-viewed verb form as "called" and "justified," as one more completed link in the chain. This is not a slip. Paul presents a future reality with the settled confidence of an accomplished fact: seen from inside God\'s purpose, the glorification of these people is as certain as their calling. Translators rightly render it "glorified," letting English readers feel the same startling finality.',
      focus: {
        nodeIds: ['w_n45008030013', 'w_n45008030015', 'w_n45008030016', 'w_n45008030018'],
        relationIds: ['r_s216_69', 'r_s216_68', 'r_s216_70', 'r_s216_71'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n45008030018'] },
      implication:
        'The chain\'s last link is written in the grammar of certainty: what God has purposed for these people is so sure that Paul can speak of glory — still ahead of them — as already theirs.',
      caution:
        'The aorist does NOT mean "once-for-all" or "already happened in time" — it simply views an action as a whole. The force here comes from Paul\'s CHOICE to view a future event that way, alongside four past ones: a deliberate expression of confident anticipation, not a property of the tense itself.',
      greekTermIds: ['edoxasen'],
    },
    {
      id: 'step-one-chain',
      title: 'Step back: one subject, one thread, one chain',
      body:
        'Now see the whole sentence at once. Five verbs — [[proegno]], [[proorisen]], [[ekalesen]], [[edikaiosen]], [[edoxasen]] — stand on parallel baselines, joined as coordinated clauses. Not one of them has a written subject: the same unnamed "he" — God — does every verb. And one thread of people runs through every clause: "those whom… these also… whom… these also…" The coordination and the relative clauses are what make the chain VISIBLE — the diagram shows a single connected structure from foreknowledge to glory, which is exactly Paul\'s point. This is why verse 28 can promise what it promises: all things work for good because one purpose, in one pair of hands, carries one people the whole way.',
      focus: {
        nodeIds: [
          'w_n45008029003',
          'w_n45008029005',
          'w_n45008030006',
          'w_n45008030012',
          'w_n45008030018',
        ],
        relationIds: ['r_s216_45', 'r_s216_54', 'r_s216_63', 'r_s216_72'],
      },
      panZoom: { fit: 'whole-diagram', padding: 60 },
      highlights: {
        emphasizedNodeIds: [
          'w_n45008029003',
          'w_n45008029005',
          'w_n45008030006',
          'w_n45008030012',
          'w_n45008030018',
        ],
      },
      implication:
        'Read as a chain seen whole — which is how the string of aorists presents it — the sentence grounds assurance not in the strength of our grip but in the continuity of God\'s acts: the same "he" and the same "these" from the first link to the last.',
      caution:
        'The five aorists view the chain as a whole; they do not each mean "a single once-for-all event." Calling, justifying, and glorifying have their own timing in a believer\'s life — the tense choice presents the sequence as one finished panorama, and that presentation is the point.',
      greekTermIds: ['proegno', 'proorisen', 'ekalesen', 'edikaiosen', 'edoxasen'],
    },
  ],
  greekTerms: [
    {
      id: 'sunergei',
      tokenId: 't_n45008028009',
      surface: 'συνεργεῖ',
      transliteration: 'synergei',
      lemma: 'συνεργέω',
      gloss: 'works together',
      parsing: 'present active indicative, 3rd person singular',
      explanation:
        '"Works together" — the source of the English word "synergy." In the base text its subject is πάντα (panta), "all things"; some early manuscripts add ὁ θεός (ho theos), making God the explicit subject ("God works all things together").',
      caution:
        'Either text yields the same theology once verses 29–30 are read: the working is not luck. The variant makes explicit the subject the chain implies.',
    },
    {
      id: 'prothesin',
      tokenId: 't_n45008028014',
      surface: 'πρόθεσιν',
      transliteration: 'prothesin',
      lemma: 'πρόθεσις',
      gloss: 'purpose, plan',
      parsing: 'noun, accusative feminine singular (object of κατά, kata, "according to")',
      explanation:
        '"Purpose" — literally a "setting forth" of intention. With κατά (kata, "according to"), forming "according to purpose": the calling of verse 28 happens on a plan, and verses 29–30 spell that plan out link by link.',
    },
    {
      id: 'kletois',
      tokenId: 't_n45008028015',
      surface: 'κλητοῖς',
      transliteration: 'klētois',
      lemma: 'κλητός',
      gloss: 'called',
      parsing: 'verbal adjective, dative masculine plural',
      explanation:
        '"Called ones" — a verbal adjective marking the people as summoned by God. In Paul, "called" is effective language: the same word family reappears as a verb — ἐκάλεσεν (ekalesen, "he called") — inside the chain at verse 30.',
    },
    {
      id: 'proegno',
      tokenId: 't_n45008029003',
      surface: 'προέγνω',
      transliteration: 'proegnō',
      lemma: 'προγινώσκω',
      gloss: 'he foreknew',
      parsing: 'aorist active indicative, 3rd person singular',
      explanation:
        'The chain\'s first link: "he knew beforehand." Its object is people ("those whom"), not information. Whether that knowing is relational fore-love, foresight of faith, or the choice of a people in Christ is the passage\'s great debated question — see the debate summary.',
      caution:
        'The aorist views the act as a whole; it says nothing about "once-for-all-ness." And the verb\'s meaning is a lexical question the diagram cannot settle — hold your reading with charity toward the others.',
    },
    {
      id: 'proorisen',
      tokenId: 't_n45008029005',
      surface: 'προώρισεν',
      transliteration: 'proōrisen',
      lemma: 'προορίζω',
      gloss: 'he predestined',
      parsing: 'aorist active indicative, 3rd person singular',
      explanation:
        '"He marked out beforehand" — from ὁρίζω (horizō), to set a boundary (the root of "horizon"). In this sentence its destination is stated: conformity to the image of the Son. It appears twice, closing verse 29 and opening verse 30\'s relay.',
    },
    {
      id: 'summorphous',
      tokenId: 't_n45008029006',
      surface: 'συμμόρφους',
      transliteration: 'symmorphous',
      lemma: 'σύμμορφος',
      gloss: 'conformed to, sharing the form of',
      parsing: 'adjective, accusative masculine plural (complement of προώρισεν, proōrisen, "he predestined")',
      explanation:
        '"Sharing the form of" — the stated goal of predestination: people shaped to the image of the Son. Paul uses the same word family for the resurrection body (Philippians 3:21); the destiny is full family likeness.',
    },
    {
      id: 'prototokon',
      tokenId: 't_n45008029016',
      surface: 'πρωτότοκον',
      transliteration: 'prōtotokon',
      lemma: 'πρωτότοκος',
      gloss: 'firstborn',
      parsing: 'adjective used substantivally, accusative masculine singular',
      explanation:
        '"Firstborn" — the Son\'s rank among the "many brothers and sisters" the chain produces. The purpose clause makes the chain\'s final cause the honor of Christ as head of a large family.',
    },
    {
      id: 'ekalesen',
      tokenId: 't_n45008030006',
      surface: 'ἐκάλεσεν',
      transliteration: 'ekalesen',
      lemma: 'καλέω',
      gloss: 'he called',
      parsing: 'aorist active indicative, 3rd person singular',
      explanation:
        '"He called" — the link where God\'s eternal purpose reaches into a person\'s history, through the gospel (2 Thessalonians 2:14). It picks up κλητοῖς (klētois, "called ones") from verse 28: the "called ones" are called by this verb.',
    },
    {
      id: 'edikaiosen',
      tokenId: 't_n45008030012',
      surface: 'ἐδικαίωσεν',
      transliteration: 'edikaiōsen',
      lemma: 'δικαιόω',
      gloss: 'he justified',
      parsing: 'aorist active indicative, 3rd person singular',
      explanation:
        '"He justified" — declared righteous, the great courtroom verb of Romans (3:24–26; 5:1). In the chain it stands between calling and glory: the verdict of the last day, rendered in the middle of history.',
    },
    {
      id: 'edoxasen',
      tokenId: 't_n45008030018',
      surface: 'ἐδόξασεν',
      transliteration: 'edoxasen',
      lemma: 'δοξάζω',
      gloss: 'he glorified',
      parsing: 'aorist active indicative, 3rd person singular',
      explanation:
        '"He glorified" — the chain\'s last link, and the only one still future for Paul\'s readers, yet written with the same past-viewed verb form as the rest. Paul presents what God will certainly do with the settled voice of what God has done.',
      caution:
        'Do not read the aorist as "already happened" or "once-for-all": the tense views the act as a whole, and Paul\'s striking CHOICE to so view a future act is a deliberate expression of certainty — confident anticipation, not completed chronology.',
    },
  ],
};
