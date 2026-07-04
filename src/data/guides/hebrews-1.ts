import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Hebrews 1:1–4 — the v1 SAMPLE guide, and the template for the others:
 * one main verb (God has spoken) with the Son's glory carried by
 * participles and a coordinated predicate. Authored against the bundled
 * SBLGNT passage `sblgnt_hebrews_0` (dump with `npm run guided:dump`).
 */
export const hebrews1: GrammarHighlightGuide = {
  id: 'guide-hebrews-1-1-4',
  title: 'Hebrews 1:1–4 — one sentence about the Son',
  reference: 'Hebrews 1:1–4',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_hebrews_0'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'intermediate',
  summary:
    'Hebrews shows that God has spoken finally and fully through his Son.',
  devotionalFrame:
    'Before anything else, Hebrews wants you to know that God speaks. Everything this letter says about the Son is anchored to that one claim. As you follow the diagram, keep your own Bible open — the structure you are about to see is the structure your translation is faithfully carrying into English.',
  steps: [
    {
      id: 'step-main-verb',
      title: 'Find the main verb first',
      body:
        'This whole passage — four verses in your Bible — is one Greek sentence, and it has one main statement: God [[elalesen]] to us in his Son. Everything else in verses 1–4 hangs off this clause. The diagram puts that main clause on the top baseline: subject ὁ θεός (ho theos, “God”) on the left of the divider, the verb on the right.',
      focus: {
        nodeIds: ['w_n58001002006', 'w_n58001001006'],
        relationIds: ['r_s0_2', 'r_s0_16'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n58001002006', 'w_n58001001006'] },
      implication:
        'When a sentence is this rich, it helps to find its backbone before admiring its branches. The author’s central claim is simple: God has spoken — finally and personally — in the Son.',
      greekTermIds: ['elalesen'],
    },
    {
      id: 'step-then-and-now',
      title: 'Long ago … and in these last days',
      body:
        'Before the main verb arrives, the sentence looks back: God spoke “long ago, to the fathers, by the prophets” — all carried by the participle [[lalesas]], “having spoken.” In the diagram this whole memory of the old revelation hangs beneath the main clause as a supporting phrase. The grammar itself makes the sermon’s point: the prophets are real revelation, and they are subordinate to what God says in the Son.',
      focus: { nodeIds: ['w_n58001001007'], relationIds: ['r_s0_14'] },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n58001001007'] },
      caution:
        'Subordinate grammar does not mean the prophets are unreliable — Hebrews will quote them constantly. The contrast is between stages of one God speaking, not between false and true.',
      greekTermIds: ['lalesas'],
    },
    {
      id: 'step-radiance-fork',
      title: 'Radiance and exact imprint — a matched pair',
      body:
        'Verse 3 describes the Son with two nouns joined by καί (kai, “and”): [[apaugasma]] (“radiance”) and [[charakter]] (“exact imprint”). The diagram draws them as a fork: two parallel lines joined at one point, both leaning back toward the little verb [[on]] (“being”). One person, two pictures — what streams out from God’s glory, and what is stamped with God’s very nature.',
      focus: {
        nodeIds: ['w_n58001003003', 'w_n58001003007', 'w_n58001003002'],
        relationIds: ['r_s0_48', 'r_s0_47'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: {
        emphasizedNodeIds: ['w_n58001003003', 'w_n58001003007'],
      },
      implication:
        'The two images balance each other: “radiance” alone might sound like the Son is only an effect of God; “exact imprint” alone might sound static. Together they say the Son truly shows us God — which is why the author can call what God says in him God’s final word.',
      caution:
        'These are metaphors reaching for something beyond language. The grammar tells you they are parallel and predicated of the same person; it does not by itself settle every question the church later answered at Nicaea.',
      greekTermIds: ['apaugasma', 'charakter', 'on'],
    },
    {
      id: 'step-sat-down',
      title: 'The sentence lands: he sat down',
      body:
        'After the descriptions comes an action that completes the thought: “having made purification for sins, he [[ekathisen]] at the right hand of the Majesty on high.” Notice the order the grammar preserves: the participle [[poiesamenos]] (“having made purification”) comes first, then the sitting. The seated posture is the point — the priestly work is finished.',
      focus: {
        nodeIds: ['w_n58001003025', 'w_n58001003024'],
        relationIds: ['r_s0_72', 'r_s0_64'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n58001003025'] },
      implication:
        'Hebrews will spend chapters on this: priests stand because their work is never done; this priest sat down. The whole letter’s comfort is compressed into one verb at the end of one long sentence.',
      caution:
        'The aorist participle “having made purification” views the purification as a whole, prior to the sitting. That is what the grammar says — it does not add “once for all” by itself; Hebrews argues that point explicitly later (7:27; 9:26; 10:12).',
      greekTermIds: ['ekathisen', 'poiesamenos'],
    },
  ],
  greekTerms: [
    {
      id: 'elalesen',
      tokenId: 't_n58001002006',
      surface: 'ἐλάλησεν',
      transliteration: 'elalēsen',
      lemma: 'λαλέω',
      gloss: 'he spoke / has spoken',
      parsing: 'aorist active indicative, 3rd singular',
      explanation:
        'The one finite main verb of the whole sentence. The aorist presents God’s speaking in the Son as a complete fact.',
      implication:
        'Everything in vv. 1–4 is grammatically in service of this verb: God has spoken in a Son.',
      caution:
        'The aorist views the action as a whole; it does not by itself mean “once and never again.”',
    },
    {
      id: 'lalesas',
      tokenId: 't_n58001001007',
      surface: 'λαλήσας',
      transliteration: 'lalēsas',
      lemma: 'λαλέω',
      gloss: 'having spoken',
      parsing: 'aorist active participle, nominative masculine singular',
      explanation:
        'A participle of the same verb “to speak,” describing God. It gathers all of the old-covenant revelation (“long ago, to the fathers, by the prophets”) into a background clause for the main statement.',
      implication:
        'Same God, same speaking — first through prophets, now in a Son. The participle makes the continuity and the contrast at the same time.',
    },
    {
      id: 'on',
      tokenId: 't_n58001003002',
      surface: 'ὢν',
      transliteration: 'ōn',
      lemma: 'εἰμί',
      gloss: 'being',
      parsing: 'present active participle, nominative masculine singular',
      explanation:
        'The little participle of “to be” that carries the two great predicates “radiance” and “exact imprint.” A present participle here describes what the Son simply, continuously is.',
      caution:
        'Do not over-build on one participle’s tense; the surrounding argument, not the participle alone, carries the theology.',
    },
    {
      id: 'apaugasma',
      tokenId: 't_n58001003003',
      surface: 'ἀπαύγασμα',
      transliteration: 'apaugasma',
      lemma: 'ἀπαύγασμα',
      gloss: 'radiance, effulgence',
      parsing: 'noun, nominative neuter singular',
      explanation:
        'Light streaming out from a source — the Son as the outshining of the Father’s glory. Used only here in the New Testament.',
    },
    {
      id: 'charakter',
      tokenId: 't_n58001003007',
      surface: 'χαρακτὴρ',
      transliteration: 'charaktēr',
      lemma: 'χαρακτήρ',
      gloss: 'exact imprint, stamp',
      parsing: 'noun, nominative masculine singular',
      explanation:
        'The impress a die stamps into metal — an exact correspondence. The Son bears the very stamp of God’s nature (ὑπόστασις, hypostasis, “essential nature”).',
    },
    {
      id: 'ekathisen',
      tokenId: 't_n58001003025',
      surface: 'ἐκάθισεν',
      transliteration: 'ekathisen',
      lemma: 'καθίζω',
      gloss: 'he sat down',
      parsing: 'aorist active indicative, 3rd singular',
      explanation:
        'The climactic action: the Son took his seat at the right hand — the posture of a king whose work is accomplished (echoing Psalm 110:1).',
    },
    {
      id: 'poiesamenos',
      tokenId: 't_n58001003024',
      surface: 'ποιησάμενος',
      transliteration: 'poiēsamenos',
      lemma: 'ποιέω',
      gloss: 'having made',
      parsing: 'aorist middle participle, nominative masculine singular',
      explanation:
        '“Having made purification for sins” — an aorist participle presenting the purification as complete and prior to the sitting.',
      caution:
        'The “finished-ness” of Christ’s work is Hebrews’ explicit argument later in the letter; the participle is consistent with it but does not prove it alone.',
    },
  ],
};
