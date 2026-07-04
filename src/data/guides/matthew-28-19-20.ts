import type { GrammarHighlightGuide } from '@/domain/schema';

/**
 * Matthew 28:19–20 — the Great Commission, spanning two SBLGNT sentences:
 * `sblgnt_matthew_1132` (the command itself — μαθητεύσατε with its three
 * participles) and `sblgnt_matthew_1133` (the closing promise of presence,
 * "I am with you always"). Dump both with `npm run guided:dump`.
 *
 * Grammar hook: μαθητεύσατε ("make disciples") is the one main imperative;
 * πορευθέντες, βαπτίζοντες, and διδάσκοντες are participles that serve it —
 * "going" is not demoted to an afterthought just because it is grammatically
 * dependent; it shares the imperative's own weight.
 */
export const matthew28: GrammarHighlightGuide = {
  id: 'guide-matthew-28-19-20',
  title: 'Matthew 28:19–20 — the Great Commission',
  reference: 'Matthew 28:19–20',
  sourceId: 'macula-greek-sblgnt-lowfat',
  bundledPassageIds: ['sblgnt_matthew_1132', 'sblgnt_matthew_1133'],
  defaultDiagramMode: 'kellogg-reed',
  difficulty: 'beginner',
  summary:
    'One command holds this famous sending together — “make disciples” — carried out by going, baptizing, and teaching. The diagram shows how the command, its scope (“all nations”), and Jesus’ closing promise of presence all fit as one structure.',
  devotionalFrame:
    'These two verses are often quoted a phrase at a time — “go,” “baptize,” “teach,” “I am with you.” The Greek sentence shows how they actually fit together: one command, carried out three ways, sent to everyone, backed by a promise. Keep your own Bible open as you follow the diagram.',
  steps: [
    {
      id: 'step-main-command',
      title: 'Find the one command',
      passageId: 'sblgnt_matthew_1132',
      body:
        'Underneath all the familiar phrases, this sentence has exactly one main verb — an imperative: [[matheteusate]], “make disciples.” The diagram puts it on the main baseline as the whole clause’s predicate. Everything else you read in these two verses — the going, the baptizing, the teaching, even “all nations” — is grammatically built around this one command.',
      focus: {
        nodeIds: ['cl_s1132_0', 'w_n40028019003'],
        relationIds: ['r_s1132_1'],
      },
      panZoom: { fit: 'nodes', padding: 120 },
      highlights: { emphasizedNodeIds: ['w_n40028019003'] },
      implication:
        'Jesus’ parting instruction is not a list of four equal tasks. It is one command — disciple-making — with the rest of the sentence showing what that looks like in practice.',
      greekTermIds: ['matheteusate'],
    },
    {
      id: 'step-going-participle',
      title: '“Going” still carries real weight',
      passageId: 'sblgnt_matthew_1132',
      body:
        'The sentence opens with [[poreuthentes]], “going” — grammatically a participle attached to μαθητεύσατε rather than a command of its own. The diagram shows it hanging beneath the main verb, not standing beside it on the baseline. But do not read that as Jesus quietly demoting “go.” Participles of this kind regularly borrow the force of the command they serve — which is exactly why your English Bible renders it “Go therefore” rather than a weaker “While going.”',
      focus: {
        nodeIds: ['w_n40028019001', 'cl_s1132_2', 'w_n40028019003'],
        relationIds: ['r_s1132_3', 'r_s1132_4'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n40028019001'] },
      caution:
        'Do not turn “participle versus imperative” into a contrast that dismisses “go.” The participle is not optional or decorative — it shares the main verb’s own weight. Your translation is not softening the Greek by keeping “go” as a command.',
      greekTermIds: ['poreuthentes'],
    },
    {
      id: 'step-all-nations',
      title: 'All nations — no one left out',
      passageId: 'sblgnt_matthew_1132',
      body:
        'The object of “make disciples” is [[ethne]], “nations,” and it is not a narrow group — it is qualified by [[panta]], “all.” The diagram shows this direct object sitting right on the main baseline next to the verb: the plainest, most central position in the sentence. The scope of the command is as wide as the command itself.',
      focus: {
        nodeIds: ['w_n40028019003', 'w_n40028019006', 'w_n40028019005', 'w_n40028019004'],
        relationIds: ['r_s1132_7', 'r_s1132_6', 'r_s1132_5'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n40028019006', 'w_n40028019004'] },
      implication:
        'This is why the church has always read the Great Commission as universal in scope, not addressed to one people alone — the grammar puts “all” directly on the word “nations.”',
      greekTermIds: ['panta', 'ethne'],
    },
    {
      id: 'step-baptizing-teaching',
      title: 'Baptizing and teaching fill out the command',
      passageId: 'sblgnt_matthew_1132',
      body:
        'Two more participles describe how disciples are made: [[baptizontes]], “baptizing … in the name of the Father and of the Son and of the Holy Spirit,” and [[didaskontes]], “teaching them to observe all that I commanded you.” Like “going,” both hang beneath the main verb in the diagram — not because they are minor details, but because this is exactly how Greek attaches supporting actions to the command they carry out.',
      focus: {
        nodeIds: ['w_n40028019003', 'cl_s1132_8', 'w_n40028019007', 'w_n40028020001'],
        relationIds: ['r_s1132_38', 'r_s1132_24', 'r_s1132_37', 'r_s1132_10', 'r_s1132_26'],
      },
      panZoom: { fit: 'nodes', padding: 140 },
      highlights: { emphasizedNodeIds: ['w_n40028019007', 'w_n40028020001'] },
      implication:
        'Disciple-making, in this sentence, is not left vague. It has a shape: bring people in through baptism, and form them through ongoing teaching of everything Jesus commanded.',
      greekTermIds: ['baptizontes', 'didaskontes'],
    },
    {
      id: 'step-i-am-with-you',
      title: 'The command comes with a promise',
      passageId: 'sblgnt_matthew_1133',
      body:
        'The next sentence stands on its own: “And behold, [[eimi]] with you always, to the end of the age.” Grammatically it is separate from the command in verses 19–20a, but it is placed right where it is needed — immediately after a command this large. The diagram shows a short, simple clause: “I” as subject, “am” as the verb, “with you … always” filling it out.',
      focus: {
        nodeIds: ['w_n40028020013', 'w_n40028020010', 'w_n40028020011', 'w_n40028020012'],
        relationIds: ['r_s1133_1', 'r_s1133_3', 'r_s1133_5', 'r_s1133_4'],
      },
      panZoom: { fit: 'nodes', padding: 130 },
      highlights: { emphasizedNodeIds: ['w_n40028020013', 'w_n40028020010'] },
      implication:
        'The command to go, baptize, and teach “all nations” is enormous. Matthew ends the Gospel by pairing it with an equally large promise: Jesus himself will be present the whole time, to the very end.',
      greekTermIds: ['eimi'],
    },
  ],
  greekTerms: [
    {
      id: 'matheteusate',
      tokenId: 't_n40028019003',
      surface: 'μαθητεύσατε',
      transliteration: 'mathēteusate',
      lemma: 'μαθητεύω',
      gloss: 'make disciples (of)',
      parsing: 'aorist active imperative, 2nd plural',
      explanation:
        'The one finite main verb of the sentence — a command given to the disciples as a group. Everything else (going, baptizing, teaching, “all nations”) is grammatically built to support this single instruction.',
      implication:
        'This is the grammatical center of the Great Commission: not four separate tasks, but one command carried out in three ways.',
      caution:
        'The aorist simply presents the command as a whole action to be carried out; it does not by itself mean the task is quick or finished in a moment — Jesus immediately unpacks it as an ongoing work of baptizing and teaching.',
    },
    {
      id: 'poreuthentes',
      tokenId: 't_n40028019001',
      surface: 'πορευθέντες',
      transliteration: 'poreuthentes',
      lemma: 'πορεύομαι',
      gloss: 'going / having gone',
      parsing: 'aorist passive participle, nominative masculine plural',
      explanation:
        'A participle attached to the main verb “make disciples” rather than a separate command of its own — but this kind of participle regularly carries the same force as the verb it serves.',
      implication:
        'This is why English Bibles rightly translate it as an active command, “Go therefore,” rather than a weak “while going.”',
      caution:
        'Being grammatically dependent does not mean optional. “Go” is not demoted just because it is a participle — it shares the imperative’s own weight.',
    },
    {
      id: 'panta',
      tokenId: 't_n40028019004',
      surface: 'πάντα',
      transliteration: 'panta',
      lemma: 'πᾶς',
      gloss: 'all',
      parsing: 'adjective, accusative neuter plural',
      explanation:
        'Modifies “nations” directly, stressing that no nation is excluded from the scope of the command.',
    },
    {
      id: 'ethne',
      tokenId: 't_n40028019006',
      surface: 'ἔθνη',
      transliteration: 'ethnē',
      lemma: 'ἔθνος',
      gloss: 'nations, peoples',
      parsing: 'noun, accusative neuter plural',
      explanation:
        'The direct object of “make disciples.” Paired with πάντα (“all”), the full phrase πάντα τὰ ἔθνη marks the command’s scope as every people group, not one nation alone.',
    },
    {
      id: 'baptizontes',
      tokenId: 't_n40028019007',
      surface: 'βαπτίζοντες',
      transliteration: 'baptizontes',
      lemma: 'βαπτίζω',
      gloss: 'baptizing',
      parsing: 'present active participle, nominative masculine plural',
      explanation:
        'A participle attached to “make disciples,” naming baptism — into the name of the Father, Son, and Holy Spirit — as part of how disciples are made.',
      caution:
        'The present tense here describes the action in view without claiming that any one person is baptized repeatedly; context (a single rite, applied to each new believer) supplies that detail, not the tense by itself.',
    },
    {
      id: 'didaskontes',
      tokenId: 't_n40028020001',
      surface: 'διδάσκοντες',
      transliteration: 'didaskontes',
      lemma: 'διδάσκω',
      gloss: 'teaching',
      parsing: 'present active participle, nominative masculine plural',
      explanation:
        'A second participle attached to “make disciples,” alongside “baptizing” — teaching new disciples to keep everything Jesus commanded.',
    },
    {
      id: 'eimi',
      tokenId: 't_n40028020013',
      surface: 'εἰμι',
      transliteration: 'eimi',
      lemma: 'εἰμί',
      gloss: 'I am',
      parsing: 'present active indicative, 1st singular',
      explanation:
        'The verb of Jesus’ closing promise, in its own sentence: “I am with you always, to the end of the age.”',
      implication:
        'The command to reach “all nations” is matched by an equally unlimited promise of Jesus’ own presence with those who carry it out.',
    },
  ],
};
