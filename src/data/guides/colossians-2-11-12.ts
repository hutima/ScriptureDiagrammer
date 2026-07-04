import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Colossians 2:11–12 — circumcision "without hands," buried and raised with
 * Christ. Authored against the bundled SBLGNT sentence `sblgnt_colossians_13`
 * (Col 2:8–12 is ONE Greek sentence; dump with
 * `npm run dump-syntax -- 'sblgnt:Colossians 2:11'`).
 *
 * Diagram hooks: (1) the base tree ALREADY draws the circumcision→burial hinge
 * — περιετμήθητε governs the συνταφέντες ("buried with him") clause adverbially
 * (relation r_s13_89), the very attachment the covenantal reading leans on;
 * (2) βαπτισμῷ ships UNGLOSSED in the SBLGNT base, so English-gloss mode shows
 * the new content-gloss fallback (βαπτισμός → "baptism") in action; (3) the ἐν
 * ᾧ of v.12b is a real contested attachment — its antecedent is baptism (base)
 * or Christ (alternate), carried in the app's alternate-readings registry as
 * `iss_col_2_12_raised_antecedent_sblgnt`.
 *
 * Guardrails (binding): the aorists περιετμήθητε / συνηγέρθητε are viewed as
 * whole acts — NEVER "aorist = once-for-all". The confessional note is labelled
 * "confessional Reformed" and stays a clearly-separate conviction; the debate
 * summary is fair to the "in Christ" antecedent, to reading "the circumcision
 * of Christ" as his death rather than the believer's conversion, and to the
 * credobaptist reading of the baptism language.
 */
export const colossians2: GrammarHighlightGuide = {
  id: 'guide-colossians-2-11-12',
  title: 'Colossians 2:11–12 — circumcision, burial, and baptism',
  reference: 'Colossians 2:11–12',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_colossians_13'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'advanced',
  summary:
    'Paul tells the Colossians they were "circumcised with a circumcision made without hands," buried with Christ, and raised with him. Walk the one Greek sentence and watch how the diagram links circumcision to burial to baptism — and where one small relative pronoun (ἐν ᾧ) leaves a real, debated choice about what raised them: the baptism just named, or Christ himself.',
  devotionalFrame:
    'Colossians 2 is Paul\'s answer to teachers who would add rules, festivals, and (behind them) the old covenant\'s circumcision to the Colossians\' faith. His reply is that they already have everything in Christ: a circumcision not made with hands, a burial, and a resurrection — all received in union with him. The grammar of these two verses stacks those images into a single connected shape. Watch the diagram build the argument, and notice, at the end, one place where the Greek itself keeps a door open.',
  confessionalFrame:
    'A confessional note (confessional Reformed): this tradition reads Colossians 2:11–12 as one of the clearest New-Testament links between circumcision and baptism — the base tree\'s own hinge (περιετμήθητε governing the "buried with him … in baptism" clause) is taken to show that baptism is the new-covenant sign that answers to the old-covenant circumcision, which grounds the covenantal (including infant-baptism) reading of the sign. This is offered as a labelled conviction, not a claim that the grammar forces it: the passage joins the images without spelling out who receives the sign or when, and the fair summary below includes the credobaptist reading and the "circumcision of Christ = his death" reading that many careful interpreters hold.',
  debateSummary: {
    issue:
      'Colossians 2:11–12 stacks three images — a circumcision "made without hands," a burial "in baptism," and a raising "through faith." Two questions are genuinely open in the grammar: what is "the circumcision of Christ," and — at ἐν ᾧ in v.12b — what raised you: the baptism just named, or Christ?',
    views: [
      {
        label: 'ἐν ᾧ antecedent = baptism ("in which you were also raised")',
        summary:
          'Takes the relative ᾧ in v.12b to reach back to the nearest noun, βαπτισμῷ: "buried with him in baptism, in which you were also raised through faith." On this reading burial and resurrection are both described as happening in the one baptism — the reading the base tree draws, and the one many English versions render ("wherein / in which you were also raised").',
        cautions: [
          'Reading the raising as "in baptism" does not by itself make baptism the instrument that raises apart from faith — the same clause immediately grounds the raising "through faith in the working of God." The antecedent question is about reference, not about mechanism.',
        ],
      },
      {
        label: 'ἐν ᾧ antecedent = Christ ("in whom you were also raised")',
        summary:
          'Takes ᾧ to reach back past baptism to the person of the whole context — the Christ you were buried WITH (συνταφέντες αὐτῷ) and circumcised in (ἐν ᾧ, v.11a) — so "in whom you were also raised." Greek relative pronouns often reach to a governing person rather than the nearest noun, and v.11a\'s ἐν ᾧ already refers to Christ, which this reading takes as the pattern for v.12b. The app carries this as the alternate reading; open it on the contested step to see the raised-clause re-attach to "buried with him."',
        cautions: [
          'The nearest-noun pull toward βαπτισμῷ is real, so this reading argues from the wider context and the v.11a parallel rather than from proximity — a genuine, defensible construal, not a correction of the base.',
        ],
      },
      {
        label: '"The circumcision of Christ" — his death, or the believer\'s conversion?',
        summary:
          'Beneath the antecedent question sits a second one: does ἡ περιτομὴ τοῦ Χριστοῦ mean the "circumcision" Christ underwent — his death, the stripping off of the body of flesh on the cross — or the spiritual circumcision Christ performs on the believer at conversion? Both are held by careful readers; the phrase\'s genitive (τοῦ Χριστοῦ) can be read either way, and the surrounding "made without hands … putting off the body of the flesh" language is cited on both sides.',
        cautions: [
          'The credobaptist reading belongs here too: even where baptism and circumcision are linked as covenant signs, this passage describes an already-believing, already-buried-and-raised people, so it does not by itself settle who should receive baptism or when. That question is argued from the whole of Scripture, not from these two verses alone.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The syntax settles a great deal and refuses to settle the rest. It draws the hinge plainly — the "buried with him … in baptism" clause hangs off "you were circumcised," so circumcision, burial, and baptism are one connected movement — and it leaves βαπτισμῷ genuinely unglossed and ᾧ genuinely ambiguous. Whether ᾧ points to baptism or to Christ, and whether "the circumcision of Christ" is his death or the believer\'s conversion, are questions of reference and lexical sense that the tree frames but cannot decide. English translations rightly render the words and, at ἐν ᾧ, quietly choose one antecedent while others footnote the alternative.',
  },
  steps: [
    {
      id: 'step-circumcised-without-hands',
      title: 'Circumcised — but "made without hands"',
      body:
        'Paul tells the Colossians they were [[peritmethete]] — "you were circumcised" — with a circumcision [[acheiropoieto]], "made without hands." The diagram hangs περιτομῇ ("with a circumcision") beneath the verb, and ἀχειροποιήτῳ ("not hand-made") slants beneath that noun, qualifying it. The whole phrase turns an outward, physical rite into something God does inwardly. Notice the verb is passive: they did not circumcise themselves — it was done TO them.',
      focus: {
        nodeIds: ['w_n51002011004', 'w_n51002011005', 'w_n51002011006'],
        relationIds: ['r_s13_46', 'r_s13_51', 'r_s13_50'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002011004', 'w_n51002011006'] },
      implication:
        'The very first move sets Paul\'s theme: whatever the false teachers offer through a rite "made with hands," the Colossians already have from God through a circumcision "made without hands."',
      caution:
        'The aorist "you were circumcised" views the act as a whole; it does not by itself say "once-for-all" or pin the moment — the force comes from what Paul pairs it with, not from the tense.',
      greekTermIds: ['peritmethete', 'acheiropoieto'],
    },
    {
      id: 'step-circumcision-of-christ',
      title: 'The circumcision of Christ',
      body:
        'The phrase resolves into "in the circumcision [[christou]] — of Christ." The diagram draws Χριστοῦ as a genitive beneath περιτομῇ, and the whole "in the circumcision of Christ" phrase hangs adverbially beneath "you were circumcised." Whose circumcision is this? Careful readers differ: it may be the "circumcision" Christ himself underwent — his death, the stripping away of the flesh on the cross — or the spiritual circumcision Christ works in the believer. The genitive leaves the door open; see this guide\'s debate summary.',
      focus: {
        nodeIds: ['w_n51002011014', 'w_n51002011016', 'w_n51002011018'],
        relationIds: ['r_s13_63', 'r_s13_61', 'r_s13_59'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002011018'] },
      implication:
        'Either way, this circumcision belongs to Christ, not to the ritual knife — it is his work, received by union with him, and that is where Paul turns next.',
      caution:
        'A genitive ("of Christ") only marks a relationship; it does not label its own kind. Whether it means the circumcision Christ underwent or the one he performs is a question of sense the diagram frames but cannot settle.',
      greekTermIds: ['christou'],
    },
    {
      id: 'step-syntaphentes-hinge',
      title: 'The hinge: buried with him',
      body:
        'Now watch the sentence turn. [[syntaphentes]] αὐτῷ — "having been buried with him" — opens a new clause, and the diagram draws it hanging OFF the verb "you were circumcised" (the highlighted link). That attachment is the whole argument in miniature: the circumcision "made without hands" IS a burial with Christ. The participle σύν-compound ("buried-together-WITH") ties them into one act, and αὐτῷ ("with him") names the one you were buried with. This hinge — circumcision leading straight into burial — is what the base tree already draws, before any reading is chosen.',
      focus: {
        nodeIds: ['w_n51002011004', 'w_n51002012001', 'w_n51002012002'],
        relationIds: ['r_s13_89', 'r_s13_65', 'r_s13_66'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002012001'] },
      implication:
        'The grammar itself joins circumcision and burial: to be "circumcised without hands" is, in the same breath, to be "buried with Christ." One connected shape carries the whole thought.',
      greekTermIds: ['syntaphentes'],
    },
    {
      id: 'step-in-baptism',
      title: 'In baptism',
      body:
        'The burial has a location: συνταφέντες αὐτῷ ἐν τῷ [[baptismo]] — "buried with him in baptism." The diagram hangs the "in baptism" phrase beneath the participle. Here is a small window into the data: the SBLGNT base ships βαπτισμῷ with NO English gloss at all. In English-gloss mode the app now fills it from the word\'s dictionary form (βαπτισμός → "baptism"), so the diagram reads fully in English instead of leaving one stray Greek word — a real data gloss always wins where one exists, and this fallback only steps in where the base left a blank.',
      focus: {
        nodeIds: ['w_n51002012001', 'w_n51002012003', 'w_n51002012005'],
        relationIds: ['r_s13_88', 'r_s13_85'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002012005'] },
      implication:
        'Baptism is where Paul locates the burial with Christ — the visible sign attached to an invisible circumcision "made without hands."',
      greekTermIds: ['baptismo'],
    },
    {
      id: 'step-raised-in-whom',
      title: 'Raised — in baptism, or in Christ?',
      body:
        'Then: ἐν ᾧ καὶ [[synegerthete]] — "in whom/which you were also raised." The little relative pronoun ᾧ has to point somewhere, and the diagram draws it reaching back to βαπτισμῷ: "in which [baptism] you were also raised." But the antecedent is genuinely debated. It may instead reach past baptism to the person of the whole passage — the Christ you were buried WITH — so "in whom [Christ] you were also raised," exactly as v.11\'s earlier ἐν ᾧ already refers to Christ. Open the alternate reading below to see the raised-clause re-attach to "buried with him." Nothing about the words changes; only where one relative pronoun points.',
      focus: {
        nodeIds: ['w_n51002012005', 'w_n51002012007', 'w_n51002012009'],
        relationIds: ['r_s13_86', 'r_s13_87', 'r_s13_70'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002012007', 'w_n51002012009'] },
      caution:
        'Both antecedents are held by serious readers of Greek: the nearest-noun pull toward "baptism" is real, and so is the pattern set by v.11a\'s ἐν ᾧ = Christ. The grammar frames the choice; it does not make it for you.',
      contested: {
        issueId: 'iss_col_2_12_raised_antecedent_sblgnt',
        note:
          'This debated attachment is in the app\'s alternate-readings registry. Open it to preview the "in whom (Christ)" reading drawn structurally — the raised-clause hangs off "buried with him" instead of off "baptism."',
      },
      greekTermIds: ['synegerthete'],
    },
    {
      id: 'step-through-faith',
      title: 'Through faith in the working of God',
      body:
        'However you resolve that pronoun, the clause lands the same way: you were raised διὰ τῆς [[pisteos]] τῆς ἐνεργείας τοῦ [[theou]] — "through faith in the working of God." The diagram hangs "through faith" beneath the verb, then cascades genitives beneath it: faith — in the working — of God. The power that raises is God\'s, "who raised Christ from the dead" (the phrase the sentence closes on); the way it is received is faith. Baptism pictures it, but the working belongs to God.',
      focus: {
        nodeIds: ['w_n51002012012', 'w_n51002012014', 'w_n51002012016'],
        relationIds: ['r_s13_84', 'r_s13_83', 'r_s13_81', 'r_s13_79'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002012016'] },
      implication:
        'The sentence that began with a circumcision "made without hands" ends where it was always heading: the working of God, received through faith. Every image — circumcision, burial, baptism, resurrection — hangs on that.',
      greekTermIds: ['pisteos', 'theou'],
    },
  ],
  greekTerms: [
    {
      id: 'peritmethete',
      tokenId: 't_n51002011004',
      surface: 'περιετμήθητε',
      transliteration: 'perietmēthēte',
      lemma: 'περιτέμνω',
      gloss: 'you were circumcised',
      parsing: 'aorist passive indicative, 2nd person plural',
      explanation:
        'The chain\'s opening verb, and it is PASSIVE: the circumcision was done to the Colossians, not by them. Paul immediately calls it "made without hands," moving it from an outward rite to God\'s inward work.',
      caution:
        'The aorist views the act as a whole; it does not mean "once-for-all" or fix the moment. What the circumcision IS comes from "made without hands" and "of Christ," not from the tense.',
    },
    {
      id: 'acheiropoieto',
      tokenId: 't_n51002011006',
      surface: 'ἀχειροποιήτῳ',
      transliteration: 'acheiropoiētō',
      lemma: 'ἀχειροποίητος',
      gloss: 'made without hands',
      parsing: 'adjective, dative feminine singular (agreeing with περιτομῇ)',
      explanation:
        '"Not hand-made" — the same word John\'s Gospel uses of a temple "not made with hands." It marks this circumcision as God\'s doing, over against the physical rite the false teachers pressed.',
    },
    {
      id: 'christou',
      tokenId: 't_n51002011018',
      surface: 'Χριστοῦ',
      transliteration: 'Christou',
      lemma: 'Χριστός',
      gloss: 'of Christ',
      parsing: 'proper noun, genitive masculine singular',
      explanation:
        'The genitive in "the circumcision of Christ." It may name the circumcision Christ underwent (his death) or the one he performs in the believer — a genuine ambiguity the genitive leaves open.',
      implication:
        'Whichever sense you take, the circumcision belongs to Christ and is received in union with him, not through a ritual "made with hands."',
    },
    {
      id: 'syntaphentes',
      tokenId: 't_n51002012001',
      surface: 'συνταφέντες',
      transliteration: 'syntaphentes',
      lemma: 'συνθάπτομαι',
      gloss: 'having been buried with',
      parsing: 'aorist passive participle, nominative masculine plural',
      explanation:
        'A σύν-compound — "buried-together-WITH." It opens the clause that the base tree hangs off "you were circumcised," welding circumcision and burial into one act. αὐτῷ ("with him") names Christ as the one buried with.',
    },
    {
      id: 'baptismo',
      tokenId: 't_n51002012005',
      surface: 'βαπτισμῷ',
      transliteration: 'baptismō',
      lemma: 'βαπτισμός',
      gloss: 'baptism',
      parsing: 'noun, dative masculine singular (object of ἐν)',
      explanation:
        'Where Paul locates the burial with Christ: "in baptism." In the SBLGNT base data this word ships with no gloss at all, so the diagram fills it from its dictionary form (βαπτισμός → "baptism") in English-gloss mode.',
      caution:
        'Locating the burial "in baptism" describes where the union is pictured; the same sentence grounds the raising "through faith in the working of God," so the sign and the faith are not played off against each other.',
    },
    {
      id: 'synegerthete',
      tokenId: 't_n51002012009',
      surface: 'συνηγέρθητε',
      transliteration: 'synēgerthēte',
      lemma: 'συνεγείρω',
      gloss: 'you were raised with',
      parsing: 'aorist passive indicative, 2nd person plural',
      explanation:
        'Another σύν-compound and another passive: "you were raised together with [him]." It is the verb governed by the debated ἐν ᾧ — "in whom/which you were also raised."',
      caution:
        'The aorist views the raising as a whole; it is Paul\'s way of speaking of a settled reality, not a claim about "once-for-all" timing. The open question here is what ᾧ points to, not what the tense means.',
    },
    {
      id: 'pisteos',
      tokenId: 't_n51002012012',
      surface: 'πίστεως',
      transliteration: 'pisteōs',
      lemma: 'πίστις',
      gloss: 'faith',
      parsing: 'noun, genitive feminine singular (object of διά)',
      explanation:
        '"Through faith" — the means by which the raising is received. Whatever ᾧ points to, the clause immediately names faith as the channel and God\'s working as the power.',
    },
    {
      id: 'theou',
      tokenId: 't_n51002012016',
      surface: 'θεοῦ',
      transliteration: 'theou',
      lemma: 'θεός',
      gloss: 'of God',
      parsing: 'noun, genitive masculine singular',
      explanation:
        'The genitive that anchors "the working of God" — the power that raised the Colossians is the same that "raised Christ from the dead," the phrase the whole sentence closes on.',
    },
  ],
};
