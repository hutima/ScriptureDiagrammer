import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Acts 2:38 — Peter's Pentecost answer, authored against the bundled SBLGNT
 * passage `sblgnt_acts_46` (dump with `npm run guided:dump -- sblgnt_acts_46`).
 * The grammar hook is the shift in number between the two imperatives
 * (μετανοήσατε, 2nd plural, "repent, all of you" / βαπτισθήτω ἕκαστος, 3rd
 * singular, "let each one be baptized") and the debated attachment and force
 * of εἰς ἄφεσιν τῶν ἁμαρτιῶν.
 */
export const acts2: GrammarHighlightGuide = {
  id: 'guide-acts-2-38',
  title: 'Acts 2:38 — repent, all of you; be baptized, each one',
  reference: 'Acts 2:38',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_acts_46'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'advanced',
  summary:
    'Peter answers the Pentecost crowd with three linked actions — repent, be baptized, receive — and the diagram shows a small but striking shift in grammatical number between the first two. It also shows exactly where the debated phrase "for the forgiveness of sins" attaches, and why the grammar alone cannot settle everything it has been asked to answer.',
  devotionalFrame:
    'Peter\'s answer to a stunned crowd is short, but its grammar is doing careful work: one command in the plural, one in the singular, and a promise in the future tense — all held together by a tiny preposition Christians have debated for centuries. Read the diagram slowly. It will not settle every question, but it will show you precisely what is, and is not, being claimed.',
  confessionalFrame:
    'Reformed and Anglican teaching typically reads this verse alongside the rest of Acts (where forgiveness is repeatedly tied to believing — e.g. Acts 10:43; 16:31) and holds that baptism here functions as a sign and seal of the forgiveness received through repentance and faith, publicly marking what God has done, rather than a ritual that produces forgiveness apart from faith. Other traditions weigh the same grammar differently; this note names one confessional reading, not the only faithful one.',
  debateSummary: {
    issue:
      'What does the prepositional phrase εἰς ἄφεσιν τῶν ἁμαρτιῶν ("for/unto the forgiveness of sins") attach to, and what relationship does it describe — is baptism the means, the accompanying sign, or the occasion of forgiveness? The identical phrase εἰς ἄφεσιν ἁμαρτιῶν appears in Matthew 26:28, where Jesus says his blood is poured out "for the forgiveness of sins" — a use everyone agrees does not make the blood a mechanical ritual cause, which shapes how interpreters weigh the same preposition here.',
    views: [
      {
        label: 'Causal/telic, tied to the whole call',
        summary:
          'εἰς ἄφεσιν τῶν ἁμαρτιῶν describes the goal of the whole compound response Peter has just commanded — repenting AND being baptized together — not of baptism considered on its own. Forgiveness is the outcome toward which the entire turn to Christ, professed and enacted, is headed.',
        cautions: [
          'The diagram attaches this phrase directly to βαπτισθήτω, the nearer verb, so this reading has to argue past the immediate syntax — from the flow of the passage and Peter\'s other sermons — rather than from this clause alone.',
        ],
      },
      {
        label: '"With a view to" / "because of" forgiveness (the disputed causal εἰς)',
        summary:
          'εἰς + accusative can mark purpose or result ("so that you receive forgiveness") or, some argue, a backward-looking basis ("because forgiveness has already been granted") — the same debate surrounds εἰς in Matthew 26:28. Both uses are grammatically possible; which one is meant here cannot be read off the preposition by itself.',
        cautions: [
          'A purely retrospective/causal εἰς is contested by many grammarians as a rare use, hard to establish from other examples in Acts.',
        ],
      },
      {
        label: 'Baptism as the appointed sign accompanying the repentance that receives forgiveness',
        summary:
          'On this reading, repentance is where forgiveness is received by faith, and baptism is the God-appointed public sign and seal that goes with it — close enough together, in the sentence and in the event, that Peter can describe them with one shared purpose clause without making baptism itself the cause of forgiveness.',
        cautions: [
          'This view has to explain why βαπτισθήτω, not μετανοήσατε, is the verb nearest εἰς ἄφεσιν in the Greek word order — a fair question it answers from theology found elsewhere in Acts and the epistles, not from this verse\'s syntax alone.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'εἰς + accusative is genuinely flexible — purpose, result, reference, and (more rarely argued) cause are all attested uses of the construction. The lowfat parse attaches the phrase to βαπτισθήτω because it is the nearest verb, which narrows the search but does not by itself decide whether that attachment means forgiveness is baptism\'s goal, its accompanying sign, or something else baptism merely marks. That is a question the wider witness of the New Testament — not one prepositional phrase — has to help answer.',
  },
  steps: [
    {
      id: 'step-overview',
      title: "Peter's answer: three linked actions",
      body:
        'Peter turns to the crowd and answers with three actions held together by "and": [[metanoesate]] ("repent"), [[baptistheto]] ("be baptized"), and — at the end of the verse — "you will receive" the gift of the Spirit. The diagram lays out all three as coordinate clauses, joined at the same level. Before looking closely at any one word, notice the shape: this is one connected answer, not three separate demands.',
      focus: {
        nodeIds: ['w_n44002038005', 'w_n44002038007', 'w_n44002038021'],
        relationIds: ['r_s46_25', 'r_s46_33', 'r_s46_9', 'r_s46_24'],
      },
      panZoom: { fit: 'nodes', padding: 160 },
      highlights: {
        emphasizedNodeIds: ['w_n44002038005', 'w_n44002038007', 'w_n44002038021'],
      },
      implication:
        'Repentance, baptism, and the gift of the Spirit are not separate transactions to manage one at a time — Peter presents them as one connected answer to one question: "what shall we do?"',
      greekTermIds: ['metanoesate', 'baptistheto', 'lempsesthe'],
    },
    {
      id: 'step-number-shift',
      title: '"Repent" (all of you) ... "be baptized" (each one)',
      body:
        'Look closely at the two commands, and a small grammatical detail becomes striking: [[metanoesate]] is second-person PLURAL — "repent, all of you," spoken to the whole crowd together. But [[baptistheto]] shifts to third-person SINGULAR, with its own subject [[hekastos]] ("each one") — "let each one of you be baptized." The diagram draws this shift as two separate clauses, each with its own baseline: the plural command stands alone, and the singular command has ἕκαστος standing on the subject side of its own line.',
      focus: {
        nodeIds: ['w_n44002038005', 'w_n44002038007', 'w_n44002038008'],
        relationIds: ['r_s46_8', 'r_s46_11', 'r_s46_13'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: {
        emphasizedNodeIds: ['w_n44002038005', 'w_n44002038007', 'w_n44002038008'],
      },
      implication:
        'The call to repent lands on the crowd as a crowd; the call to be baptized lands on each person one at a time. The grammar itself carries a pastoral point: the whole company repents together, but each person meets the water individually — no one is baptized simply by being part of a crowd.',
      caution:
        'This is a shift in grammatical number, not a change in urgency or importance. Luke is not saying repentance matters less because its verb is plural — he is describing two moments of one response: together, then one by one.',
      greekTermIds: ['metanoesate', 'baptistheto', 'hekastos'],
    },
    {
      id: 'step-eis-aphesin',
      title: '"For the forgiveness of sins" — where does it attach?',
      body:
        'The phrase [[eis]] [[aphesin]] τῶν ἁμαρτιῶν ("for/unto the forgiveness of sins") comes right after the baptism command, and the diagram draws it as a prepositional phrase hanging beneath βαπτισθήτω itself — the nearest verb it can attach to. This is exactly the phrase Christians have long debated: does the grammar mean baptism causes forgiveness, describes its accompanying sign, or names the goal of the whole response Peter has just called for?',
      focus: {
        nodeIds: ['w_n44002038007', 'w_n44002038015', 'w_n44002038016', 'w_n44002038018'],
        relationIds: ['r_s46_23', 'r_s46_22', 'r_s46_21'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n44002038015', 'w_n44002038016'] },
      implication:
        'However you read the attachment, the sentence keeps forgiveness tied to a real, embodied response, not an abstract feeling. See the debate note attached to this guide for a fair summary of the major readings — the diagram shows you what the Greek actually connects, which is the necessary first step, not the last one.',
      caution:
        'The syntax narrows the question — it attaches this phrase to the nearby verb — but attachment is not the same as causation. Where a phrase is grammatically hooked and what relationship it describes are two different questions.',
      greekTermIds: ['eis', 'aphesin'],
    },
    {
      id: 'step-in-the-name',
      title: '"In the name of Jesus Christ" — the same construction, different work',
      body:
        'Just before εἰς ἄφεσιν, another prepositional phrase attaches to that very same verb βαπτισθήτω: ἐπὶ τῷ [[onomati]] Ἰησοῦ Χριστοῦ, "in the name of Jesus Christ." Seeing both phrases in the diagram, stemmed beneath the same verb, is a reminder that Peter names two things about this baptism in the same breath: whose name it invokes, and what it looks toward. Neither phrase competes with the other — the diagram simply shows both hanging from the one act.',
      focus: {
        nodeIds: ['w_n44002038007', 'w_n44002038010', 'w_n44002038012', 'w_n44002038013', 'w_n44002038014'],
        relationIds: ['r_s46_18', 'r_s46_17', 'r_s46_15', 'r_s46_14'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n44002038012', 'w_n44002038013', 'w_n44002038014'] },
      implication:
        'Baptism "in the name of Jesus Christ" ties this command to the whole Pentecost sermon\'s argument: it is Jesus, crucified and raised, whom the crowd is responding to — not baptism as a generic ritual.',
      greekTermIds: ['onomati'],
    },
    {
      id: 'step-promised-gift',
      title: 'And you will receive',
      body:
        'The verse does not end with a command — it ends with a promise: καὶ [[lempsesthe]] τὴν δωρεὰν τοῦ ἁγίου πνεύματος, "and you will receive the gift of the Holy Spirit." The diagram shows this as a third clause coordinated with the first two, but its verb is future indicative, not imperative — a statement of what God will do, not another thing the crowd must do. Repent, be baptized... and here is what follows.',
      focus: {
        nodeIds: ['w_n44002038021', 'w_n44002038023', 'w_n44002038026'],
        relationIds: ['r_s46_27', 'r_s46_32', 'r_s46_30', 'r_s46_33'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n44002038021'] },
      implication:
        'The sentence\'s own shape preaches: two calls to respond, then one promise of gift. Whatever place baptism has in this verse, it stands beside a promise that is God\'s to keep, not the hearers\' to earn.',
      greekTermIds: ['lempsesthe'],
    },
  ],
  greekTerms: [
    {
      id: 'metanoesate',
      tokenId: 't_n44002038005',
      surface: 'Μετανοήσατε',
      transliteration: 'metanoēsate',
      lemma: 'μετανοέω',
      gloss: 'Repent',
      parsing: 'aorist active imperative, 2nd person plural',
      explanation:
        'The first command, addressed to the whole crowd together — a 2nd-person plural aorist imperative. The aorist presents the turning as a whole, decisive act; it is not a claim about how long the turning takes or how many times it must happen.',
      implication: 'It is issued to the crowd as a crowd: "all of you, turn."',
    },
    {
      id: 'baptistheto',
      tokenId: 't_n44002038007',
      surface: 'βαπτισθήτω',
      transliteration: 'baptisthētō',
      lemma: 'βαπτίζω',
      gloss: 'let him be baptized / be baptized',
      parsing: 'aorist passive imperative, 3rd person singular',
      explanation:
        'A 3rd-person singular passive imperative — literally "let each one be baptized." The passive voice matters: the verb does not say "baptize yourselves," but pictures each person receiving baptism from someone else, as happened at Pentecost.',
      caution:
        'Passive voice tells you who acts (someone baptizes each person); it does not by itself answer every question about what baptism accomplishes — see the debate note attached to this guide.',
    },
    {
      id: 'hekastos',
      tokenId: 't_n44002038008',
      surface: 'ἕκαστος',
      transliteration: 'hekastos',
      lemma: 'ἕκαστος',
      gloss: 'each one / every one',
      parsing: 'adjective used substantivally, nominative masculine singular (subject of βαπτισθήτω)',
      explanation:
        '"Each one" stands as the singular subject of βαπτισθήτω, in deliberate contrast to the plural crowd addressed by μετανοήσατε. It personalizes a general command into an individual one.',
    },
    {
      id: 'eis',
      tokenId: 't_n44002038015',
      surface: 'εἰς',
      transliteration: 'eis',
      lemma: 'εἰς',
      gloss: 'into, unto, for',
      parsing: 'preposition governing the accusative',
      explanation:
        '"Into," "unto," or "for" — a preposition that can mark purpose or result, reference, or (more rarely and more controversially) a backward-looking cause, depending on context. Here it governs the accusative noun ἄφεσιν.',
    },
    {
      id: 'aphesin',
      tokenId: 't_n44002038016',
      surface: 'ἄφεσιν',
      transliteration: 'aphesin',
      lemma: 'ἄφεσις',
      gloss: 'forgiveness, release',
      parsing: 'noun, accusative feminine singular',
      explanation:
        '"Forgiveness" — literally a "release" or "letting go." The same phrase, εἰς ἄφεσιν ἁμαρτιῶν, describes what Christ\'s blood is poured out for in Matthew 26:28, a parallel worth holding alongside this verse.',
    },
    {
      id: 'onomati',
      tokenId: 't_n44002038012',
      surface: 'ὀνόματι',
      transliteration: 'onomati',
      lemma: 'ὄνομα',
      gloss: 'name',
      parsing: 'noun, dative neuter singular',
      explanation:
        '"Name" — the dative object of ἐπί, "in/on the name." Invoking Jesus\' name over the baptism ties the act to him specifically, distinguishing it from John\'s baptism mentioned earlier in Acts.',
    },
    {
      id: 'lempsesthe',
      tokenId: 't_n44002038021',
      surface: 'λήμψεσθε',
      transliteration: 'lēmpsesthe',
      lemma: 'λαμβάνω',
      gloss: 'you will receive',
      parsing: 'future middle indicative, 2nd person plural',
      explanation:
        'Future middle indicative — a promise, not a command. After two imperatives, the sentence turns to what God will do for those who respond.',
    },
  ],
};
