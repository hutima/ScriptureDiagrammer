import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * John 1:1 — a beginner guide to the Gospel's opening verse: one Greek
 * sentence built from three short clauses joined by καί. Authored against
 * the bundled SBLGNT passage `sblgnt_john_0` (dump with `npm run guided:dump`).
 * The grammar hook is the third clause, θεὸς ἦν ὁ λόγος: an anarthrous
 * predicate nominative fronted before the verb, and an articular subject
 * that follows it — showing how Greek marks grammatical roles by form and
 * agreement, not by word order.
 */
export const john1: GrammarHighlightGuide = {
  id: 'guide-john-1-1',
  title: 'John 1:1 — “In the beginning was the Word”',
  reference: 'John 1:1',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_john_0'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'beginner',
  summary:
    'John opens his Gospel with one carefully balanced verse: the Word already existed “in the beginning,” was in fellowship “with God,” and — in a Greek word order that surprises English readers — “was God.” The diagram shows how Greek grammar, not word order, tells you who the subject is and what is said about him.',
  devotionalFrame:
    'John begins his Gospel by taking you back before the beginning — and before you ever meet Jesus by name, you meet him as “the Word.” This first verse is short, but every word in it is doing real work. Take it slowly: the Greek grammar itself is quietly making one of the boldest claims in Scripture.',
  confessionalFrame:
    'The historic Christian confession — reflected, for instance, in the Nicene Creed’s “God of God … begotten, not made, being of one substance with the Father” — reads this verse as teaching that the Word is fully and truly God while remaining a distinct person from the Father he was “with.” This guide treats that as the settled reading of the wider Christian tradition; the fair summary below explains why a minority reads the last clause differently, and why the majority reading has endured.',
  debateSummary: {
    issue:
      'θεός (theos) in “θεὸς ἦν ὁ λόγος” (theos ēn ho logos, “God was the Word,” word for word) has no article in front of it — a grammatical fact the diagram makes visible in the predicate-nominative line. Essentially every English Bible renders this “the Word was God.” A minority reading, “the Word was a god,” is non-standard: it is associated almost exclusively with the Jehovah’s Witnesses’ New World Translation, and is accepted by no major Christian denomination and by virtually no mainstream Greek scholarship.',
    views: [
      {
        label:
          '“The Word was God” — the reading of essentially every English Bible and the whole Christian tradition',
        summary:
          'An anarthrous (article-less) predicate nominative placed before its verb, as θεός (theos) is here, regularly describes the QUALITY or NATURE of the subject rather than counting it as one item in a class. On this reading the Word fully possesses the nature of God, while remaining distinct in person from “God” (ho theos) named just before — which is why “God,” not “a god,” has been the standard translation across denominations and centuries.',
        cautions: [
          'This pattern is sometimes called “Colwell’s rule,” but that “rule” names a tendency, not an ironclad law — it is one supporting observation, not the whole argument.',
          'A minority reading — “the Word was a god,” tied almost exclusively to the New World Translation — argues the missing article makes θεός (theos) indefinite. It is a non-standard reading: it does not explain why the New Testament elsewhere uses anarthrous θεός in clearly non-indefinite ways (e.g. John 1:18; Romans 9:5), where “a god” makes no sense, and no major Christian denomination or mainstream Greek scholarship accepts it.',
        ],
      },
    ],
    grammarOpensQuestionHow:
      'The word order and the missing article are real, checkable facts, and they do point toward a qualitative reading — the Word sharing fully in God’s nature. Grammar frames the question more than it settles the church’s whole doctrine of Christ’s deity, which draws on all of John’s Gospel — but on this narrower translation choice, the grammar itself is not genuinely contested among serious scholars.',
  },
  steps: [
    {
      id: 'step-one-verse-three-clauses',
      title: 'One verse, three connected thoughts',
      body:
        'Before you read a single word of Greek, notice the shape of the verse: John links three short, complete statements with καί (kai, “and”), like three matched beats. The diagram lays each clause on its own baseline, joined by the coordinator. Greek word order is far freer than English — so as we go, follow the diagram’s lines and dividers, not just the order words appear on the page, to see who is doing what.',
      focus: {
        nodeIds: ['cl_s0_0', 'cl_s0_1', 'cl_s0_8', 'cl_s0_16'],
        relationIds: ['r_s0_7', 'r_s0_15', 'r_s0_21'],
      },
      panZoom: { fit: 'whole-diagram', padding: 100 },
      highlights: { emphasizedNodeIds: ['cl_s0_0'] },
      implication:
        'Once you can see the three clauses separately, you can follow each on its own — and by the third, you will be ready for the most important sentence in the whole verse.',
    },
    {
      id: 'step-in-the-beginning',
      title: '“In the beginning was the Word”',
      body:
        'John opens by echoing the very first words of the Greek Old Testament: “In the beginning God made …” (Genesis 1:1). Here it is [[arche]] again, now paired with [[logos]], “the Word.” Even before we are told who the Word is up close, this opening line already places him before creation itself. The diagram hangs the fronted phrase “in the [[arche]]” beneath the verb [[en]] (“was”), with ὁ λόγος (ho logos, “the Word”) standing as the subject.',
      focus: {
        nodeIds: [
          'w_n43001001001',
          'w_n43001001002',
          'w_n43001001004',
          'w_n43001001005',
          'w_n43001001003',
        ],
        relationIds: ['r_s0_4', 'r_s0_3', 'r_s0_5', 'r_s0_6', 'r_s0_2'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n43001001005', 'w_n43001001003'] },
      implication:
        'Whatever “the Word” turns out to mean, John wants you to know this first: he was already there before anything was made. Your English Bible’s “In the beginning was the Word” carries this straight across.',
      greekTermIds: ['arche', 'logos', 'en'],
    },
    {
      id: 'step-with-god',
      title: '“The Word was with God”',
      body:
        'The second clause keeps the same subject — ὁ λόγος (ho logos), the Word — and adds a relationship: he was [[pros]] τὸν θεόν (ton theon), “with God.” [[pros]] pictures more than nearby location; it is the preposition of face-to-face fellowship, one person turned toward another. Already the sentence is holding two things together: the Word is distinct enough from God to be “with” him, yet — as the next clause will show — intimately identified with him.',
      focus: {
        nodeIds: [
          'w_n43001001007',
          'w_n43001001008',
          'w_n43001001009',
          'w_n43001001010',
          'w_n43001001011',
          'w_n43001001012',
        ],
        relationIds: ['r_s0_11', 'r_s0_10', 'r_s0_9', 'r_s0_14', 'r_s0_13', 'r_s0_12'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n43001001010', 'w_n43001001012'] },
      implication:
        'Relationship, not just proximity. From the very first verse the Word is shown in personal fellowship with God.',
      caution:
        'One preposition cannot carry a whole doctrine of the Trinity by itself — it simply opens a picture the rest of John’s Gospel will fill in.',
      greekTermIds: ['pros'],
    },
    {
      id: 'step-word-was-god',
      title: '“And the Word was God”',
      body:
        'Now the boldest line: θεὸς ἦν ὁ λόγος (theos ēn ho logos, “God was the Word,” word for word). Read in that order it looks almost backwards — [[theos]] comes first! But Greek marks its subject by grammar, not by position: [[ho]], the little article, stands in front of [[logos]], marking ὁ λόγος (ho logos, “the Word”) as the subject — the very same subject carried through the whole verse. [[theos]] has no article at all; it is the predicate, describing what the subject is. That is why every reliable English Bible reads it the other way around, “the Word was God,” and not “God was the Word.” The diagram shows this plainly: the divider still separates subject from predicate, and the back-slanted line still points to the predicate nominative, no matter which word came first on the page.',
      focus: {
        nodeIds: ['w_n43001001014', 'w_n43001001015', 'w_n43001001016', 'w_n43001001017'],
        relationIds: ['r_s0_18', 'r_s0_20', 'r_s0_19', 'r_s0_17'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: {
        emphasizedNodeIds: ['w_n43001001014', 'w_n43001001017'],
        relationIds: ['r_s0_18', 'r_s0_20'],
      },
      implication:
        'Because [[theos]] has no article and stands right before the verb, Greek readers naturally hear it describing WHAT the Word is — fully possessing the nature of God — rather than counting him as one more “a god” among others. That is the sense your English Bible reaches for with the plain word “God.”',
      caution:
        'This pattern (sometimes called Colwell’s rule) is a real and useful clue, but it is a clue, not proof by itself — Greek grammar alone cannot settle every question a doctrine like the Trinity raises. Confidence that “the Word was God” belongs to John’s whole Gospel — its full prologue, and verses like John 1:18 and 20:28 — not to one word-order fact taken in isolation.',
      greekTermIds: ['theos', 'ho'],
    },
  ],
  greekTerms: [
    {
      id: 'arche',
      tokenId: 't_n43001001002',
      surface: 'ἀρχῇ',
      transliteration: 'archē',
      lemma: 'ἀρχή',
      gloss: 'beginning',
      parsing: 'noun, dative feminine singular',
      explanation:
        'The head noun of the fronted phrase “in [the] beginning.” John echoes the opening word of the Greek Old Testament (Genesis 1:1, LXX: Ἐν ἀρχῇ ἐποίησεν ὁ θεός — En archē epoiēsen ho theos, “In the beginning God made …”), placing his whole Gospel deliberately alongside the creation story.',
      implication:
        'John wants his very first phrase to remind you of Genesis 1. Whatever comes next is meant to be heard as a deeper telling of “the beginning.”',
    },
    {
      id: 'logos',
      tokenId: 't_n43001001005',
      surface: 'λόγος',
      transliteration: 'logos',
      lemma: 'λόγος',
      gloss: 'word, message, reason',
      parsing: 'noun, nominative masculine singular',
      explanation:
        'The subject of all three clauses in this verse. John does not yet say “Jesus” — he chooses a rich word Greek thought used for the rational principle behind the universe, and the Old Testament used for God’s powerful, creative speech (e.g. Psalm 33:6, “By the word of the LORD the heavens were made”).',
      implication:
        'By verse 14 you will learn this Word “became flesh” — for now, John lets the word’s rich meaning build anticipation before naming him.',
    },
    {
      id: 'en',
      tokenId: 't_n43001001003',
      surface: 'ἦν',
      transliteration: 'ēn',
      lemma: 'εἰμί',
      gloss: 'was',
      parsing: 'imperfect active indicative, 3rd singular',
      explanation:
        'The imperfect tense of εἰμί (eimi, “to be”), used all three times in this verse. It describes a past state — here, simply, being — rather than narrating a one-time event.',
      caution:
        'Do not over-read the imperfect by itself as “eternally continuous.” Here it narrates a past state of being; the sense of the Word’s eternity comes from the whole clause (paired with “in the beginning”), not from the tense alone.',
    },
    {
      id: 'pros',
      tokenId: 't_n43001001010',
      surface: 'πρὸς',
      transliteration: 'pros',
      lemma: 'πρός',
      gloss: 'toward, with',
      parsing: 'preposition (governing the accusative τὸν θεόν — ton theon, “God” — here)',
      explanation:
        'More vivid than a plain “near” or “beside,” πρός pictures one person facing, turned toward, another — the language of relationship, not just location.',
      implication:
        'Even in one small preposition, John is already describing a personal relationship between the Word and God.',
    },
    {
      id: 'theos',
      tokenId: 't_n43001001014',
      surface: 'θεὸς',
      transliteration: 'theos',
      lemma: 'θεός',
      gloss: 'God',
      parsing:
        'noun, nominative masculine singular — no article, standing before the verb as predicate nominative',
      explanation:
        'The predicate of the third clause: it tells you what the subject (the Word) is. Because it has no article and comes first, Greek naturally reads it here as describing the Word’s NATURE — fully God — rather than counting him as one member of a class (“a god”).',
      implication:
        'This is the single grammatical detail behind one of the most debated translation choices in the New Testament — see the note on this passage above for why the historic Christian reading has endured, and why a minority reading has not.',
      caution:
        'The missing article does not make θεός mean something less than “God.” Anarthrous nouns are common throughout Greek and often simply describe. Do not let the absence of “the” suggest the Word was merely “a god” among many.',
    },
    {
      id: 'ho',
      tokenId: 't_n43001001016',
      surface: 'ὁ',
      transliteration: 'ho',
      lemma: 'ὁ',
      gloss: 'the',
      parsing: 'article, nominative masculine singular, agreeing with λόγος (logos, “word”)',
      explanation:
        'A small word doing a big job: because ὁ marks λόγος (logos, “word”) as definite and matches its case, careful readers (and the diagram) can identify ὁ λόγος (ho logos, “the Word”) as the subject of this clause — even though θεός (theos, “God”) was written first. Word order in Greek does not decide grammatical roles; agreement and the article do.',
      implication:
        'This is why the diagram can lay out “the Word” as the subject on one side of the divider and “God” as the predicate on the other, regardless of which word appears first in the Greek sentence.',
    },
  ],
};
