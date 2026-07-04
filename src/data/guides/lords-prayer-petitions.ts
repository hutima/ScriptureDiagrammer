import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Matthew 6:9–13 — the Lord's Prayer. The grammar hook: every petition is a
 * true IMPERATIVE (or, for the one prohibition, the negative-command
 * subjunctive Greek uses instead) — never the soft "wish" English hears in
 * "hallowed be thy name," "thy kingdom come," "thy will be done." English has
 * no third-person imperative, so translators reach for an archaic
 * subjunctive-sounding "be it…" construction to carry a grammatical mood
 * Greek marks plainly on the verb. Authored against the bundled SBLGNT
 * passages `sblgnt_matthew_142` (the three "thy" petitions), `sblgnt_matthew_143`
 * (δός, "give"), `sblgnt_matthew_144` (ἄφες, "forgive"), and
 * `sblgnt_matthew_145` (μὴ εἰσενέγκῃς, the prohibition, alongside ῥῦσαι,
 * "deliver") — dump with `npm run guided:dump`.
 */
export const lordsPrayerPetitions: GrammarHighlightGuide = {
  id: 'guide-lords-prayer-petitions',
  title: 'Matthew 6:9–13 — praying the Lord’s Prayer in commands',
  reference: 'Matthew 6:9–13',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: [
    'sblgnt_matthew_142',
    'sblgnt_matthew_143',
    'sblgnt_matthew_144',
    'sblgnt_matthew_145',
  ],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'beginner',
  summary:
    'English hears “hallowed be thy name,” “thy kingdom come,” “thy will be done” as gentle wishes. In the Greek, every petition of the Lord’s Prayer is a command form — a true imperative mood, or (for one line) the grammar Greek uses instead to phrase a negative command. This guide walks all six petitions of Matthew 6:9–13 to see Jesus teaching his disciples to ask boldly.',
  devotionalFrame:
    'Before you meet a single Greek word, notice this: Jesus does not teach his disciples to pray with timid maybes. Six times in a row, in the short space of five verses, he puts a command on their lips. Follow the diagram through Matthew 6:9–13 and watch the same shape surface again and again — not because we get to command God from above, but because he invites us to ask him this boldly, this plainly, like children who trust they will be heard.',
  steps: [
    {
      id: 'step-shape-of-prayer',
      title: 'Six petitions, every one a command',
      body:
        'Read in English, the Lord’s Prayer’s six requests sound like gentle wishes: “hallowed be thy name,” “thy kingdom come,” “thy will be done,” “give us … forgive us … deliver us.” Not one of the underlying Greek verbs is a wish. Every single petition is a command form — a true imperative mood (with one exception you will meet at the end, which Greek phrases a different way but which still functions as a command). Look at the diagram below: three short clauses, coordinated by “and,” each built the very same way — a bare command verb standing as the whole clause’s predicate, nothing softening it grammatically.',
      passageId: 'sblgnt_matthew_142',
      focus: {
        nodeIds: [
          'cl_s142_0',
          'cl_s142_1',
          'cl_s142_7',
          'cl_s142_13',
          'w_n40006009011',
          'w_n40006010001',
          'w_n40006010005',
        ],
        relationIds: ['r_s142_6', 'r_s142_12', 'r_s142_24', 'r_s142_2', 'r_s142_8', 'r_s142_14'],
      },
      panZoom: { fit: 'whole-diagram' },
      highlights: {
        emphasizedNodeIds: ['w_n40006009011', 'w_n40006010001', 'w_n40006010005'],
      },
      implication:
        'Once you can see that shape — command verb, nothing hedging it — you are ready to look closely at what kind of command each one is, and why English translates some of them so differently from others.',
    },
    {
      id: 'step-thy-petitions',
      title: 'The three “thy” petitions — commands English cannot say in third person',
      body:
        'The first three petitions are all spoken ABOUT God, in the third person: [[hagiasthaeto]] — literally “let it be hallowed” — asks that God’s name be treated as holy. [[eltheto]] — “let it come” — asks that his kingdom arrive. [[genaetheto]] — “let it be done” — asks that his will happen. English simply has no ordinary third-person command form (you cannot say “name hallow!” the way you can say “you, give!”), so English Bibles reach for an old, subjunctive-sounding construction instead: “hallowed BE,” “kingdom COME” (not “comes”), “will BE done.” That is not English going soft on the grammar — it is the best available English shape for a mood Greek marks plainly on the verb itself.',
      passageId: 'sblgnt_matthew_142',
      focus: {
        nodeIds: [
          'w_n40006009011',
          'w_n40006009013',
          'w_n40006010001',
          'w_n40006010003',
          'w_n40006010005',
          'w_n40006010007',
        ],
        relationIds: ['r_s142_2', 'r_s142_5', 'r_s142_8', 'r_s142_11', 'r_s142_14', 'r_s142_17'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n40006009011', 'w_n40006010001', 'w_n40006010005'],
      },
      implication:
        'This is why so many English Bibles keep the same archaic-sounding wording across centuries of revision: “hallowed be,” “thy kingdom come,” “thy will be done” is not old-fashioned piety for its own sake — it is English straining to hold onto a real command that its grammar cannot phrase any more directly.',
      caution:
        'All three verbs here are AORIST. Do not read that as “once, and never needing to happen again” — it simply presents each request as one whole, complete act being asked for, not as a claim about how often it happens. Jesus assumes his disciples will pray this prayer again and again.',
      greekTermIds: ['hagiasthaeto', 'eltheto', 'genaetheto'],
    },
    {
      id: 'step-us-petitions',
      title: 'The “us” petitions — second-person imperatives, bold asking',
      body:
        'The next two petitions turn from speaking ABOUT God to speaking straight TO him: “Give us … our daily bread” uses [[dos]], and “forgive us our debts” uses [[aphes]] — both plain second-person commands, the same imperative mood English can say directly: “You — give,” “You — forgive.” Nothing here is hedged or softened either; these are just as much true commands as the three petitions before them, only now addressed face to face.',
      passageId: 'sblgnt_matthew_143',
      focus: {
        nodeIds: ['cl_s143_0', 'w_n40006011006', 'w_n40006011002', 'w_n40006011007'],
        relationIds: ['r_s143_1', 'r_s143_6', 'r_s143_7'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n40006011006'] },
      secondaryPassageId: 'sblgnt_matthew_144',
      secondaryTitle: 'Matthew 6:12 — ἄφες (aphes), "forgive"',
      secondaryFocus: {
        nodeIds: ['cl_s144_0', 'w_n40006012002', 'w_n40006012005', 'w_n40006012003'],
        relationIds: ['r_s144_1', 'r_s144_5', 'r_s144_2'],
      },
      secondaryHighlights: { emphasizedNodeIds: ['w_n40006012002'] },
      implication:
        'Notice that Jesus does not teach his disciples to hint or apologize their way toward God. Both halves of the prayer — the “thy” petitions and the “us” petitions — are built from the same bold grammar: commands, not requests dressed up as questions.',
      caution:
        'Both verbs here are also aorist. As before, that does not mean “ask once and be done” — it simply views each asking as one complete, whole request, said plainly, this time.',
      greekTermIds: ['dos', 'aphes'],
    },
    {
      id: 'step-not-imperative',
      title: 'The one petition that is NOT an imperative',
      body:
        'The last line has two halves, and they are built differently. “But deliver us from the evil one” uses [[rhysai]] — a normal second-person imperative, exactly like [[dos]] and [[aphes]] before it. But “lead us not into temptation” is NOT phrased with an imperative at all: it pairs the negating word [[mE]] with [[eisenenkes]], a verb in the SUBJUNCTIVE mood. Greek generally avoids negating an aorist imperative directly; its everyday way to phrase "do not do this" is [[mE]] plus an aorist subjunctive, exactly as here. Grammatically that is a different mood than the other five petitions — but functionally, paired with [[mE]], it carries every bit as much force as a command. That is why every English Bible still translates it "lead us not," a plain command, matching the other five in force even though its Greek engine runs on different grammar.',
      passageId: 'sblgnt_matthew_145',
      focus: {
        nodeIds: [
          'cl_s145_0',
          'cl_s145_1',
          'w_n40006013002',
          'w_n40006013003',
          'w_n40006013004',
          'cl_s145_7',
          'w_n40006013008',
          'w_n40006013009',
        ],
        relationIds: [
          'r_s145_6',
          'r_s145_13',
          'r_s145_2',
          'r_s145_3',
          'r_s145_14',
          'r_s145_8',
          'r_s145_9',
        ],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n40006013002', 'w_n40006013003', 'w_n40006013008'],
      },
      implication:
        'So of the prayer’s six petitions, five are imperatives — three spoken about God in the third person, two spoken straight to him in the second — and one is a subjunctive doing an imperative’s job because that is how Greek negates a command. Every single line, without exception, asks boldly.',
      caution:
        'The subjunctive [[eisenenkes]] is also aorist in form. As with every verb in this prayer, that pictures the asking as one whole, complete request — not a claim that it happens only once, and not a claim about how often temptation itself might come.',
      greekTermIds: ['mE', 'eisenenkes', 'rhysai'],
    },
    {
      id: 'step-praying-in-imperatives',
      title: 'What it means to pray in commands',
      body:
        'Step back and look at the whole prayer again: [[hagiasthaeto]] … [[eltheto]] … [[genaetheto]] … [[dos]] … [[aphes]] … [[rhysai]] — six petitions, five imperatives and one prohibition doing an imperative’s work, and not one polite hedge among them. Jesus is not teaching his disciples a technique for getting God’s attention through hesitant, deferential language. He is teaching them to come to their Father the way a child comes to a parent they trust completely: directly, specifically, without first talking themselves into believing they are allowed to ask.',
      passageId: 'sblgnt_matthew_142',
      focus: {
        nodeIds: [
          'cl_s142_0',
          'w_n40006009011',
          'w_n40006010001',
          'w_n40006010005',
        ],
        relationIds: ['r_s142_6', 'r_s142_12', 'r_s142_24'],
      },
      panZoom: { fit: 'whole-diagram' },
      highlights: {
        emphasizedNodeIds: ['w_n40006009011', 'w_n40006010001', 'w_n40006010005'],
      },
      implication:
        'This is not a loophole for commanding God as though we stood over him. It is the opposite: Jesus hands his disciples bold, direct words BECAUSE the Father he is teaching them to address delights in being asked plainly. The grammar itself is an invitation to confident, urgent prayer.',
    },
  ],
  greekTerms: [
    {
      id: 'hagiasthaeto',
      tokenId: 't_n40006009011',
      surface: 'ἁγιασθήτω',
      transliteration: 'hagiasthētō',
      lemma: 'ἁγιάζω',
      gloss: 'let it be hallowed / treated as holy',
      parsing: 'aorist passive imperative, 3rd singular',
      explanation:
        'A third-person command form: it tells "your name" (the subject of this clause) what to have done to it — be hallowed, be treated as holy — rather than describing a wish about it. English has no ordinary way to give a third-person command, so translators supply the old-sounding "be" construction ("hallowed BE thy name") to carry across a mood Greek marks directly on the verb.',
      implication:
        'This is the grammar behind "hallowed be thy name": not a soft hope, but the church’s oldest prayer asking, in a true command form, that God’s name be honored as holy.',
      caution:
        'The aorist here does not mean "let this happen once and be finished." It simply presents the request as one whole, complete act being asked for — Jesus assumes his disciples will keep praying this same request.',
    },
    {
      id: 'eltheto',
      tokenId: 't_n40006010001',
      surface: 'ἐλθέτω',
      transliteration: 'elthetō',
      lemma: 'ἔρχομαι',
      gloss: 'let it come',
      parsing: 'aorist active imperative, 3rd singular',
      explanation:
        'Another third-person command, this time telling "your kingdom" (the subject) to come. English again has no direct third-person imperative, so translations use the subjunctive-sounding "kingdom COME" (not "comes") to carry the same command force.',
      implication:
        'This is why "thy kingdom come" reads a little archaic to modern ears: it is not timid, poetic language — it is English’s best available shape for a genuine command aimed at God’s kingdom’s arrival.',
      caution:
        'Do not read this aorist as "let the kingdom arrive in one single moment, never gradually." It views the coming of the kingdom as one whole reality being asked for — it is not making a claim about the timeline.',
    },
    {
      id: 'genaetheto',
      tokenId: 't_n40006010005',
      surface: 'γενηθήτω',
      transliteration: 'genēthētō',
      lemma: 'γίνομαι',
      gloss: 'let it be done / let it happen',
      parsing: 'aorist passive imperative, 3rd singular',
      explanation:
        'The third of the "thy" petitions, built exactly like ἁγιασθήτω (hagiasthētō, "let it be hallowed"): a third-person command telling "your will" (the subject) to be done. It is also the verb that carries the added phrase "as in heaven, so also on earth" — the one place among the three where the request is explicitly extended to cover the whole creation.',
      implication:
        'This is the grammar behind "thy will be done, on earth as it is in heaven": a command, not a resigned wish, asking that heaven’s pattern become earth’s pattern too.',
      caution:
        'As with the other two "thy" petitions, the aorist here pictures the request as one complete act, not a claim that God’s will need only be accomplished a single time.',
    },
    {
      id: 'dos',
      tokenId: 't_n40006011006',
      surface: 'δὸς',
      transliteration: 'dos',
      lemma: 'δίδωμι',
      gloss: 'give',
      parsing: 'aorist active imperative, 2nd singular',
      explanation:
        'A plain, direct second-person command — "You, give" — spoken straight to the Father rather than about him in the third person. English can say this kind of command exactly as Greek does, which is why "give us this day our daily bread" needs no special grammatical workaround.',
      implication:
        'The prayer turns here from speaking ABOUT God (the first three petitions) to speaking straight TO him — but the boldness of the command does not change at all.',
      caution:
        'The aorist here, as throughout this prayer, does not mean "give once and never again" — it simply presents the asking as one whole, complete request for today’s bread.',
    },
    {
      id: 'aphes',
      tokenId: 't_n40006012002',
      surface: 'ἄφες',
      transliteration: 'aphes',
      lemma: 'ἀφίημι',
      gloss: 'forgive / let go, release',
      parsing: 'aorist active imperative, 2nd singular',
      explanation:
        'The second direct, second-person command in the prayer — "You, forgive" — built the same way as δὸς (dos, "give"). The verb’s ordinary sense is "release" or "let go," so "forgive us our debts" pictures sins as debts being released rather than merely overlooked.',
      implication:
        'This command comes with a built-in measuring line right in the same verse — "as we forgive our debtors" — so the boldness of asking is paired immediately with a call to extend the same forgiveness outward.',
      caution:
        'Again, the aorist views this as one whole act of forgiving being requested, not a claim that forgiveness, once given, will never need to be asked for again.',
    },
    {
      id: 'rhysai',
      tokenId: 't_n40006013008',
      surface: 'ῥῦσαι',
      transliteration: 'rhysai',
      lemma: 'ῥύομαι',
      gloss: 'deliver / rescue',
      parsing: 'aorist middle imperative, 2nd singular',
      explanation:
        'The third and final direct, second-person command — "You, deliver" — a plain imperative just like δὸς (dos, "give") and ἄφες (aphes, "forgive"), though this particular verb happens to form its imperative in the middle voice rather than the active. That voice difference is simply how this verb behaves in Greek; it does not soften the command in any way.',
      implication:
        'Placed right beside the one petition that is NOT an imperative (see the next term), this verb shows the contrast plainly: this half of the sentence is a true command, spoken with exactly the same directness as "give" and "forgive."',
      caution:
        'The aorist here pictures deliverance as one whole act being requested — it does not by itself specify how long that deliverance lasts or whether the danger could return.',
    },
    {
      id: 'mE',
      tokenId: 't_n40006013002',
      surface: 'μὴ',
      transliteration: 'mē',
      lemma: 'μή',
      gloss: 'not',
      parsing: 'negative particle, negating a verb in the subjunctive mood',
      explanation:
        'The small word that turns "lead us … into temptation" into "lead us NOT into temptation." Paired with an aorist verb, Greek almost never negates with a plain imperative; instead it reaches for μή (mē, "not") plus the aorist SUBJUNCTIVE — exactly the pattern here with εἰσενέγκῃς (eisenenkēs, "bring in") — as its everyday way to phrase a negative command.',
      implication:
        'This is why the sixth petition looks grammatically different from the other five even though every English Bible still renders it as a command, "lead us not": Greek is not softening the request, it is simply using its normal machinery for negating one.',
    },
    {
      id: 'eisenenkes',
      tokenId: 't_n40006013003',
      surface: 'εἰσενέγκῃς',
      transliteration: 'eisenenkēs',
      lemma: 'εἰσφέρω',
      gloss: 'bring in / lead',
      parsing: 'aorist active subjunctive, 2nd singular',
      explanation:
        'Grammatically a SUBJUNCTIVE, not an imperative — the one verb in the whole prayer that is not. Paired with μή (mē, "not"), it does an imperative’s job: Greek’s standard way to phrase a negative command pairs μή with an aorist subjunctive (rather than an aorist imperative), so functionally this line carries exactly the same command force as the other five petitions.',
      implication:
        'This is the single grammatical exception in an otherwise unbroken chain of commands — and it turns out not to be an exception to the PRAYER’s boldness at all, only to its verb FORM. Jesus still teaches his disciples to ask this plainly.',
      caution:
        'Do not over-read the aorist aspect here either: it presents "being led into trial" as one whole event being prayed against, not a claim about how many times temptation itself might come.',
    },
  ],
};
