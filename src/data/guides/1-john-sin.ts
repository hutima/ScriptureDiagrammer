import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * 1 John 2:1 & 3:6–9 — a two-passage comparison authored against the bundled
 * SBLGNT Lowfat sentences `sblgnt_1-john_12` (2:1b, the aorist ἁμάρτῃ),
 * `sblgnt_1-john_60` (3:6, the present ἁμαρτάνει) and `sblgnt_1-john_66`
 * (3:9, the present ποιεῖ). Dump with `npm run guided:dump`.
 */
export const johnSin: GrammarHighlightGuide = {
  id: 'guide-1-john-sin',
  title: '1 John 2:1 & 3:6–9 — one act of sin, or a life of it?',
  reference: '1 John 2:1; 3:6–9',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_1-john_12', 'sblgnt_1-john_60', 'sblgnt_1-john_66'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    'A two-passage comparison: 1 John 2:1’s aorist ἁμάρτῃ pictures one specific act of sin met by an Advocate, while 3:6–9’s present-tense verbs picture sin as a settled, defining pattern that no longer characterizes someone born of God and abiding in Christ.',
  devotionalFrame:
    'These two passages sit only a chapter apart, and read alone they can sound like they pull in opposite directions: “if anyone sins, we have an advocate” — and then, “no one who is born of God practices sin.” Follow the diagrams closely and you will see John reaching for two different pictures of sin: one a single occurrence, the other a settled direction of life. Both are true, and both are for you.',
  steps: [
    {
      id: 'step-if-anyone-sins',
      title: '“If anyone should sin” — a real, specific case',
      passageId: 'sblgnt_1-john_12',
      body:
        'John has just said, “If we say we have no sin, we deceive ourselves” (1:8) — he is not naive about failure. Here [[hamarte]] pictures one concrete case: “if anyone should sin.” The aorist views the sinning as a single, whole event in mind — a specific lapse, not a description of someone’s whole way of life. John writes this to ordinary believers, expecting that sin will sometimes happen.',
      focus: {
        nodeIds: ['w_n62002001011', 'w_n62002001012'],
        relationIds: ['r_s12_4', 'r_s12_3', 'r_s12_5'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n62002001012'] },
      implication:
        'Notice what John does not say: he is not describing the kind of person someone is. He is naming the honest moment after a specific failure — which is exactly why the next clause matters so much.',
      caution:
        'The aorist here is not a special tense that means “just this once, and never again.” It simply views this instance of sinning as a complete whole, the way you would refer to any single event. What John does with that instance — pointing to an advocate — comes from the sentence he builds around it, not from the tense by itself.',
      greekTermIds: ['hamarte'],
    },
    {
      id: 'step-we-have-an-advocate',
      title: 'We have an advocate — Jesus Christ the righteous',
      passageId: 'sblgnt_1-john_12',
      body:
        'The verb answering that scenario is [[echomen]], “we have” — a standing possession, not a one-time provision. Whom do we have? [[parakleton]], “an advocate,” and John names him at once: Jesus Christ, the Righteous. The diagram lays the whole title — advocate, Jesus, Christ, righteous — as one chain resting on that single verb.',
      focus: {
        nodeIds: [
          'w_n62002001014',
          'w_n62002001013',
          'w_n62002001018',
          'w_n62002001019',
          'w_n62002001020',
        ],
        relationIds: ['r_s12_12', 'r_s12_11', 'r_s12_9', 'r_s12_10'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n62002001013', 'w_n62002001018'] },
      implication:
        'This is the answer to every specific failure that ἁμάρτῃ pictures: not excuse, not despair, but an Advocate — himself righteous — pleading our case with the Father.',
      greekTermIds: ['echomen', 'parakleton'],
    },
    {
      id: 'step-abiding-does-not-sin',
      title: '“Does not sin” — a settled, present-tense pattern',
      passageId: 'sblgnt_1-john_60',
      body:
        'A chapter later, John describes something different. [[menon]] (“abiding”) and [[hamartanei]] (“sins”) are both present tense: “Everyone who abides in him does not sin.” The present tense views the action as ongoing, in progress — not a single case like ἁμάρτῃ, but a continuing condition. John has moved from an isolated lapse to the settled direction of a life.',
      focus: {
        nodeIds: ['w_n62003006001', 'w_n62003006005', 'w_n62003006007'],
        relationIds: ['r_s60_7', 'r_s60_6', 'r_s60_3', 'r_s60_1'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n62003006005', 'w_n62003006007'] },
      implication:
        'Set beside 2:1, the contrast is not that John forgot what he wrote three chapters earlier. He is describing two different things: a specific act (aorist) and a persisting pattern (present). The grammar leaves room for both statements to stand.',
      caution:
        'Present tense does not by itself mean “always, without exception, habitually.” It means the action is pictured as ongoing. How much weight to put on that here — a settled direction of life, not sinless perfection — depends on reading this in context, not on the tense alone.',
      greekTermIds: ['menon', 'hamartanei'],
    },
    {
      id: 'step-born-of-god',
      title: 'Born of God: sin is not the practice of the new life',
      passageId: 'sblgnt_1-john_66',
      body:
        'The pattern repeats in 3:9: “everyone [[gegennemenos]] of God does not [[poiei]] sin” — literally, does not “practice” or “keep doing” sin. [[poiei]] is present tense again, the same ongoing picture as ἁμαρτάνει in verse 6. But now John gives the reason: God’s seed abides in him. The new birth, not willpower, is why sin is no longer the shape of this life.',
      focus: {
        nodeIds: ['w_n62003009001', 'w_n62003009003', 'w_n62003009009'],
        relationIds: ['r_s66_8', 'r_s66_7', 'r_s66_3', 'r_s66_1', 'r_s66_9'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n62003009003', 'w_n62003009009'] },
      implication:
        'This is why the whole letter, not one tense, is the real answer to the apparent tension: 2:1 assures the failing believer of an Advocate; 3:6–9 calls that same believer to a life no longer defined by sin, because of a new birth and an abiding relationship with Christ. Aspect helps frame the contrast; the letter’s larger argument — the advocate, abiding in Christ, the new birth — is what actually carries it.',
      caution:
        'Do not flatten this to a rule — “aorist always means one time, present always means habitual.” Some interpreters resolve the tension mainly through the letter’s argument and rhetorical purpose rather than through the verb tenses themselves; see the debate note below.',
      greekTermIds: ['gegennemenos', 'poiei'],
    },
  ],
  debateSummary: {
    issue:
      'How do we hold “if anyone sins, we have an advocate” (2:1) together with “no one who abides in him sins … whoever is born of God cannot sin” (3:6, 9) without making John contradict himself?',
    views: [
      {
        label: 'Aspectual / habitual-pattern reading',
        summary:
          'The aorist ἁμάρτῃ in 2:1 pictures a specific, occasional act of sin, while the present-tense ἁμαρτάνει and ποιεῖ in 3:6, 9 describe a continuing, characteristic practice or direction of life. On this reading John is not claiming Christians never sin — he has already denied that possibility in 1:8–10 — but that a person born of God and abiding in Christ is not defined or ruled by sin as a settled pattern.',
        cautions: [
          'Verb aspect is a real signal, but it does not by itself prove “habitual” — some present-tense verbs are simply general statements, not necessarily iterative ones. This reading still needs the rest of chapter 3 (the new birth, the devil’s pattern, love versus hate) to carry most of the weight, not the tense alone.',
        ],
      },
      {
        label: 'Rhetorical / polemical reading',
        summary:
          'Some scholars set the aspectual contrast aside as the main key and instead read 3:6–9 as strong, black-and-white language aimed at a specific target — teachers in John’s community who denied the seriousness of sin (echoed in 1:8, 10) or who claimed a sinlessness of their own. On this view John’s absolute-sounding statements are an ideal contrast between “children of God” and “children of the devil,” typical of his stark either/or style, and the tension is resolved more by the letter’s argument and historical situation than by grammar.',
        cautions: [
          'This reading can undersell how deliberately John repeats present-tense verbs across several verses in a row; it should not be used to explain away the real moral seriousness of 3:6–9.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The aorist/present contrast is a genuine feature of the Greek and a fair place to start — it shows John using two different verbal pictures, not the same one repeated. But the tenses alone cannot tell us how absolute to take “cannot sin,” nor settle whether John means “does not live characterized by sin” or something more categorical. That depends on reading 3:6–9 inside the letter’s full argument: the advocate of 2:1–2, abiding in Christ, and the new birth — none of which a single verb’s tense can carry by itself.',
  },
  greekTerms: [
    {
      id: 'hamarte',
      tokenId: 't_n62002001012',
      surface: 'ἁμάρτῃ',
      transliteration: 'hamartē',
      lemma: 'ἁμαρτάνω',
      gloss: 'should sin',
      parsing: 'aorist active subjunctive, 3rd singular',
      explanation:
        'Governed by ἐάν (“if”), this pictures one potential act of sin as a single whole — a specific case in view, not a description of a lifestyle.',
      implication: 'This is the scenario 2:1 is built to answer: a real believer, after a real failure.',
      caution:
        'The aorist does not mean “just once, and it can never happen again” — it simply views this one occurrence as a complete whole.',
    },
    {
      id: 'echomen',
      tokenId: 't_n62002001014',
      surface: 'ἔχομεν',
      transliteration: 'echomen',
      lemma: 'ἔχω',
      gloss: 'we have',
      parsing: 'present active indicative, 1st plural',
      explanation:
        'The main verb of the sentence’s second half: a standing possession believers have, not a one-time grant.',
    },
    {
      id: 'parakleton',
      tokenId: 't_n62002001013',
      surface: 'παράκλητον',
      transliteration: 'paraklēton',
      lemma: 'παράκλητος',
      gloss: 'an advocate',
      parsing: 'noun, accusative masculine singular',
      explanation:
        'A legal-flavored term for one who speaks on another’s behalf. Here it stands in one chain of apposition with “Jesus Christ, the Righteous.”',
    },
    {
      id: 'menon',
      tokenId: 't_n62003006005',
      surface: 'μένων',
      transliteration: 'menōn',
      lemma: 'μένω',
      gloss: 'abiding',
      parsing: 'present active participle, nominative masculine singular',
      explanation:
        'Describes an ongoing relationship of remaining “in him” (Christ) — the ground for the claim that follows.',
    },
    {
      id: 'hamartanei',
      tokenId: 't_n62003006007',
      surface: 'ἁμαρτάνει',
      transliteration: 'hamartanei',
      lemma: 'ἁμαρτάνω',
      gloss: 'sins',
      parsing: 'present active indicative, 3rd singular',
      explanation:
        'The same verb as ἁμάρτῃ in 2:1, now present tense: sin viewed as ongoing rather than as one instance.',
      caution:
        'Present tense pictures the action as in progress; it does not automatically mean “without exception, forever.” Context — the letter’s argument about the new birth and abiding in Christ — carries most of that weight.',
    },
    {
      id: 'poiei',
      tokenId: 't_n62003009009',
      surface: 'ποιεῖ',
      transliteration: 'poiei',
      lemma: 'ποιέω',
      gloss: 'practices',
      parsing: 'present active indicative, 3rd singular',
      explanation:
        '“Does not practice sin” — present tense again, picturing sin as an ongoing activity rather than a single lapse.',
    },
    {
      id: 'gegennemenos',
      tokenId: 't_n62003009003',
      surface: 'γεγεννημένος',
      transliteration: 'gegennēmenos',
      lemma: 'γεννάω',
      gloss: 'having been born',
      parsing: 'perfect passive participle, nominative masculine singular',
      explanation:
        'The perfect tense views the new birth as a past event with a continuing effect: someone who has been born of God and remains so.',
      implication:
        'This is the reason 3:9 gives for the claim beside it: not self-effort, but a completed new birth whose effect abides.',
    },
  ],
};
