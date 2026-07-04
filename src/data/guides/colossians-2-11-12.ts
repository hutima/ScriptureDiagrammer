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
    'Paul tells the Colossians they were "circumcised with a circumcision made without hands" — the circumcision Christ himself works in them — buried with him in baptism, and raised with him too. Walk the one Greek sentence and watch how the diagram links circumcision to burial to baptism, down to one small relative pronoun, ἐν ᾧ (en hō, "in which"), that this guide reads as pointing back to that same baptism — though some readers instead trace it to Christ himself.',
  devotionalFrame:
    'Colossians 2 is Paul\'s answer to teachers who would add rules, festivals, and (behind them) the old covenant\'s circumcision to the Colossians\' faith. His reply is that they already have everything in Christ: a circumcision not made with hands, a burial, and a resurrection — all received in union with him. The grammar of these two verses stacks those images into a single connected shape. Watch the diagram build the argument, and notice, at the end, one place — a single relative pronoun — where careful readers still trace the Greek two different ways.',
  confessionalFrame:
    'A confessional note (confessional Reformed): this tradition reads Colossians 2:11–12 as one of the clearest New-Testament links between circumcision and baptism — the base tree\'s own hinge (περιετμήθητε, perietmēthēte, "you were circumcised," governing the "buried with him … in baptism" clause) is taken to show that baptism is the new-covenant sign that answers to the old-covenant circumcision, which grounds the covenantal (including infant-baptism) reading of the sign. This is offered as a labelled conviction, not a claim that the grammar forces it: the passage joins the images without spelling out who receives the sign or when, and the fair summary below includes the credobaptist reading and the "circumcision of Christ = his death" reading that many careful interpreters hold.',
  debateSummary: {
    issue:
      'Colossians 2:11–12 stacks three images — a circumcision "made without hands," a burial "in baptism," and a raising "through faith." Two lexical questions sit underneath the grammar: what is "the circumcision of Christ," and — at ἐν ᾧ (en hō) in v.12b — what raised you: the baptism just named, or Christ? This guide takes a position on both, and gives the alternates a fair hearing below.',
    views: [
      {
        label: '"The circumcision of Christ" = the circumcision Christ performs in the believer — this guide\'s reading',
        summary:
          'A second question sits beneath the antecedent question: what is ἡ περιτομὴ τοῦ Χριστοῦ (hē peritomē tou Christou), "the circumcision of Christ"? This guide reads it as the spiritual circumcision Christ himself performs on the believer at conversion — the cutting away of the old self, worked by union with him, of which the outward, hand-made rite was always only a shadow. The genitive τοῦ Χριστοῦ (tou Christou, "of Christ") names Christ as the one who does the circumcising, and the surrounding "made without hands … putting off the body of the flesh" language fits a work Christ performs IN the believer better than a rite he alone underwent. Some careful readers take the same genitive the other way — as the "circumcision" Christ himself underwent, his death, the stripping off of the body of flesh on the cross. That reading is real and defensible; the genitive by itself does not adjudicate between the two.',
        cautions: [
          'The credobaptist reading belongs here too: even where baptism and circumcision are linked as covenant signs, this passage describes an already-believing, already-buried-and-raised people, so it does not by itself settle who should receive baptism or when. That question is argued from the whole of Scripture, not from these two verses alone.',
        ],
      },
      {
        label: 'ἐν ᾧ antecedent = baptism ("in baptism, in which you were also raised") — this guide\'s reading',
        summary:
          'This guide takes the relative ᾧ (hō) in v.12b to reach back to the nearest noun, βαπτισμῷ (baptismō, "baptism"): "buried with him in baptism, in which you were also raised through faith." Burial and resurrection are both pictured as happening in that one baptism — the reading the base tree draws, the reading many English versions render ("wherein / in which you were also raised"), and the reading this guide teaches as standard.',
        cautions: [
          'Reading the raising as "in baptism" does not by itself make baptism the instrument that raises apart from faith — the same clause immediately grounds the raising "through faith in the working of God." The antecedent question is about reference, not about mechanism.',
        ],
      },
      {
        label: 'ἐν ᾧ antecedent = Christ ("in whom you were also raised") — the leading alternate',
        summary:
          'The leading alternate takes ᾧ (hō) to reach back past baptism to the person of the whole context — the Christ you were buried WITH (συνταφέντες αὐτῷ, syntaphentes autō) and circumcised in (ἐν ᾧ, en hō, v.11a) — so "in whom you were also raised." Greek relative pronouns can reach to a governing person rather than the nearest noun, and v.11a\'s own ἐν ᾧ (en hō) already refers to Christ, which this reading takes as the pattern for v.12b — a real, defensible construal, argued from the wider context and the v.11a parallel rather than from proximity. The app carries it as the alternate reading; open it on the contested step to see the raised-clause re-attach to "buried with him" instead of to "baptism."',
        cautions: [
          'The nearest-noun pull toward βαπτισμῷ (baptismō, "baptism") is real — which is why this guide teaches that reading as standard — but the wider-context argument here is a genuine, defensible construal, not a correction of the base.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The syntax settles a great deal. It draws the hinge plainly — the "buried with him … in baptism" clause hangs off "you were circumcised," so circumcision, burial, and baptism are one connected movement — and this guide reads βαπτισμῷ (baptismō, "baptism") as both the location of the burial AND the antecedent of ἐν ᾧ (en hō): "in baptism, in which you were also raised." What the syntax does not settle by itself is the sense of two words: whether ᾧ (hō) could instead reach past baptism to Christ, and whether "the circumcision of Christ" names his own death or the circumcision he performs in the believer. This guide takes the nearest-noun, believer-centered reading on both counts as the natural sense of the words in context; the alternates above are real and defensible, which is why English translations occasionally render them differently at ἐν ᾧ (en hō).',
  },
  steps: [
    {
      id: 'step-circumcised-without-hands',
      title: 'Circumcised — but "made without hands"',
      body:
        'Paul tells the Colossians they were [[peritmethete]] — "you were circumcised" — with a circumcision [[acheiropoieto]], "made without hands." The diagram hangs περιτομῇ (peritomē, "with a circumcision") beneath the verb, and [[acheiropoieto]] slants beneath that noun, qualifying it. The whole phrase turns an outward, physical rite into something God does inwardly. Notice the verb is passive: they did not circumcise themselves — it was done TO them.',
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
      title: 'The circumcision of Christ — his own work in you',
      body:
        'The phrase resolves into "in the circumcision [[christou]] — of Christ." The diagram draws [[christou]] as a genitive beneath περιτομῇ (peritomē, "circumcision"), and the whole "in the circumcision of Christ" phrase hangs adverbially beneath "you were circumcised." This is the circumcision Christ himself performs on the believer — the inward cutting-away of the old self, worked by union with him, not a rite he alone underwent on the cross. (Some readers take the genitive the other way, as Christ\'s own "circumcision" — his death; see this guide\'s "Where readers differ" for that alternate reading, fairly presented.)',
      focus: {
        nodeIds: ['w_n51002011014', 'w_n51002011016', 'w_n51002011018'],
        relationIds: ['r_s13_63', 'r_s13_61', 'r_s13_59'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002011018'] },
      implication:
        'This circumcision belongs to Christ, not to the ritual knife — his work, done in the believer by union with him — and that union is where Paul turns next.',
      caution:
        'A genitive ("of Christ") only marks a relationship; it does not by itself label which kind. This guide reads the surrounding "made without hands" language as pointing to Christ\'s work IN the believer rather than to an event he alone underwent — but the genitive alone does not force that reading, which is why "Where readers differ" gives the alternate a fair hearing.',
      greekTermIds: ['christou'],
    },
    {
      id: 'step-syntaphentes-hinge',
      title: 'The hinge: buried with him',
      body:
        'Now watch the sentence turn. [[syntaphentes]] αὐτῷ (autō) — "having been buried with him" — opens a new clause, and the diagram draws it hanging OFF the verb "you were circumcised" (the highlighted link). That attachment is the whole argument in miniature: the circumcision "made without hands" IS a burial with Christ. The participle\'s σύν- (syn-, "with/together") prefix ("buried-together-WITH") ties them into one act, and αὐτῷ (autō, "with him") names the one you were buried with. This hinge — circumcision leading straight into burial — is what the base tree already draws, before any reading is chosen.',
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
        'The burial has a location: [[syntaphentes]] αὐτῷ (autō) ἐν τῷ [[baptismo]] — "buried with him in baptism." The diagram hangs the "in baptism" phrase beneath the participle.',
      focus: {
        nodeIds: ['w_n51002012001', 'w_n51002012003', 'w_n51002012005'],
        relationIds: ['r_s13_88', 'r_s13_85'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002012005'] },
      implication:
        'Baptism is where Paul locates the burial with Christ — the visible sign attached to an invisible circumcision "made without hands."',
      greekTermIds: ['syntaphentes', 'baptismo'],
    },
    {
      id: 'step-raised-in-whom',
      title: 'Raised — in that same baptism',
      body:
        'Then: ἐν ᾧ (en hō) καὶ [[synegerthete]] — "in which you were also raised." The relative pronoun ᾧ (hō) points back to the nearest noun in the sentence, βαπτισμῷ (baptismō, "baptism"), and that is how the diagram — and most English versions — read it: "in baptism, in which you were also raised." Burial and resurrection are both pictured as happening in that one baptism, with the raising immediately grounded in faith in God\'s working. (Some readers instead take ᾧ (hō) to reach past baptism to Christ himself — "in whom you were also raised," on the pattern of v.11a\'s own ἐν ᾧ (en hō) = Christ; open "Where readers differ" below to see that alternate reading drawn structurally.) Nothing about the Greek words changes between the two readings — only where the pronoun is understood to point.',
      focus: {
        nodeIds: ['w_n51002012005', 'w_n51002012007', 'w_n51002012009'],
        relationIds: ['r_s13_86', 'r_s13_87', 'r_s13_70'],
      },
      panZoom: { fit: 'nodes', padding: 150 },
      highlights: { emphasizedNodeIds: ['w_n51002012007', 'w_n51002012009'] },
      caution:
        'The nearest-noun pull toward "baptism" is the grammar\'s normal default, which is why this guide reads ᾧ (hō) that way; the Christ-antecedent reading is a real, defensible alternative some careful readers hold on the pattern of v.11a — see "Where readers differ" for a fair hearing of it.',
      contested: {
        issueId: 'iss_col_2_12_raised_antecedent_sblgnt',
        note:
          'This step follows the standard "in baptism" reading. The alternate "in whom" (Christ) construal is in the app\'s alternate-readings registry — open it to preview that reading drawn structurally, with the raised-clause hanging off "buried with him" instead of off "baptism."',
      },
      greekTermIds: ['synegerthete'],
    },
    {
      id: 'step-through-faith',
      title: 'Through faith in the working of God',
      body:
        'Whichever way you take that pronoun, the clause lands the same way: you were raised διὰ τῆς [[pisteos]] τῆς ἐνεργείας τοῦ [[theou]] (dia tēs pisteōs tēs energeias tou theou) — "through faith in the working of God." The diagram hangs "through faith" beneath the verb, then cascades genitives beneath it: faith — in the working — of God. The power that raises is God\'s, "who raised Christ from the dead" (the phrase the sentence closes on); the way it is received is faith. Baptism pictures it, but the working belongs to God.',
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
        'The genitive in "the circumcision of Christ." This guide reads it as the circumcision Christ himself performs in the believer at conversion — the spiritual "cutting away" worked by union with him (some readers instead take it as the circumcision Christ himself underwent, his death; see "Where readers differ").',
      implication:
        'This is Christ\'s own work of union — the believer receives it, rather than performing it, and it comes not through a ritual "made with hands."',
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
        'A σύν- (syn-, "with/together") compound — "buried-together-WITH." It opens the clause that the base tree hangs off "you were circumcised," welding circumcision and burial into one act. αὐτῷ (autō, "with him") names Christ as the one buried with.',
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
        'Where Paul locates the burial with Christ: "in baptism." In the SBLGNT base data this word ships with no gloss at all, so the diagram fills it from its dictionary form (βαπτισμός, baptismos → "baptism") in English-gloss mode. This guide also takes this same noun as the antecedent of ἐν ᾧ (en hō) in v.12b: "in baptism, in which you were also raised" (see "Raised — in that same baptism").',
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
        'Another σύν- (syn-, "with/together") compound and another passive: "you were raised together with [him]." It is the verb governed by ἐν ᾧ (en hō) — read on this guide\'s standard reading as "in baptism, in which you were also raised" (see "Where readers differ" for the alternate "in whom [Christ]").',
      caution:
        'The aorist views the raising as a whole; it is Paul\'s way of speaking of a settled reality, not a claim about "once-for-all" timing. The open question here is what ᾧ (hō) points to, not what the tense means.',
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
        '"Through faith" — the means by which the raising is received. Whichever way you take ᾧ (hō), the clause immediately names faith as the channel and God\'s working as the power.',
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
