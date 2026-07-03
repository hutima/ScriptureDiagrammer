/**
 * GLOSSARY — plain-language definitions for the terse labels and morphology
 * codes the diagram modes paint (e.g. the Dependency arc tags `subj`/`obj` and
 * the Morphology agreement link `agr`).
 *
 * A layout element advertises a `glossKey`; tapping the label opens the shared
 * detail panel with the matching entry. Pure data + lookup, so it is testable in
 * Node and reused by every mode (and could feed a printed legend later).
 */

export interface GlossEntry {
  /** The full term, e.g. "Direct object". */
  term: string;
  /** The abbreviation as it appears on the diagram, e.g. "obj" (optional). */
  abbr?: string;
  /** One- or two-sentence explanation in plain language. */
  detail: string;
}

/**
 * Canonical entries keyed by a stable id. Relation labels use their
 * `SyntacticRole` as the key; morphology codes use their own short keys. Keys
 * are matched case-insensitively (see {@link lookupGloss}).
 */
const GLOSSARY: Record<string, GlossEntry> = {
  // ── Clause structure ────────────────────────────────────────────────────
  root: {
    term: 'Root',
    abbr: 'root',
    detail: 'The head of the whole sentence — usually the main (finite) verb. Every other word ultimately depends on it.',
  },
  subject: {
    term: 'Subject',
    abbr: 'subj',
    detail: 'The person or thing the clause is about — what the verb agrees with.',
  },
  predicate: {
    term: 'Predicate',
    abbr: 'pred',
    detail: 'The main verb of the clause and what it asserts about the subject.',
  },
  copula: {
    term: 'Linking verb',
    abbr: 'cop',
    detail: 'A “to be” verb that links the subject to a predicate noun or adjective rather than expressing an action.',
  },

  // ── Verbal arguments / complements ──────────────────────────────────────
  directObject: {
    term: 'Direct object',
    abbr: 'obj',
    detail: 'The person or thing directly acted on by the verb (answers “whom?” or “what?”).',
  },
  indirectObject: {
    term: 'Indirect object',
    abbr: 'iobj',
    detail: 'The recipient or beneficiary of the action (answers “to/for whom?”).',
  },
  predicateNominative: {
    term: 'Predicate nominative',
    abbr: 'pred-nom',
    detail: 'A noun in the predicate that renames the subject through a linking verb (e.g. “the Word was God”).',
  },
  predicateAdjective: {
    term: 'Predicate adjective',
    abbr: 'pred-adj',
    detail: 'An adjective in the predicate that describes the subject through a linking verb.',
  },
  objectComplement: {
    term: 'Object complement',
    abbr: 'o-comp',
    detail: 'A word that completes the meaning of the direct object (e.g. “they made him king”).',
  },
  dativeComplement: {
    term: 'Dative complement',
    abbr: 'dat',
    detail: 'A noun in the dative case required by the verb to complete its meaning.',
  },
  genitiveComplement: {
    term: 'Genitive complement',
    abbr: 'gen',
    detail: 'A noun in the genitive case required by the verb to complete its meaning.',
  },
  agent: {
    term: 'Agent',
    abbr: 'agent',
    detail: 'The doer of the action in a passive clause (e.g. “by God”).',
  },

  // ── Nuanced Greek accusative functions ──────────────────────────────────
  objectLikeComplement: {
    term: 'Object-like complement',
    abbr: 'obj-like',
    detail: 'Functions as the thing the verb acts on without being claimed as an ordinary direct object — used where Greek grammar allows more than one analysis.',
  },
  accusativeModifier: {
    term: 'Accusative modifier',
    abbr: 'acc-mod',
    detail: 'An accusative attached to the verb whose exact function (extent, respect, retained object…) the analysis deliberately leaves open.',
  },
  accusativeExtent: {
    term: 'Accusative of extent',
    abbr: 'acc-ext',
    detail: 'An adverbial accusative telling to what degree or how far — e.g. “not benefited at all”.',
  },
  accusativeRespect: {
    term: 'Accusative of respect',
    abbr: 'acc-resp',
    detail: 'An accusative telling in what respect the statement holds — “with respect to…”.',
  },
  retainedAccusative: {
    term: 'Retained accusative',
    abbr: 'ret-acc',
    detail: 'An accusative object kept even though the verb is passive (the subject corresponds to the other object of the active construction).',
  },
  substantivalPrepositionalPhrase: {
    term: 'Substantival prepositional phrase',
    abbr: 'subst-pp',
    detail: 'An article turning a prepositional phrase into a noun phrase — e.g. τὰ παρ᾽ αὐτῆς, “the things belonging to her”.',
  },

  // ── Modification ────────────────────────────────────────────────────────
  adjectival: {
    term: 'Adjectival modifier',
    abbr: 'adj',
    detail: 'A word or phrase that describes a noun (which one, what kind, how many).',
  },
  adverbial: {
    term: 'Adverbial modifier',
    abbr: 'adv',
    detail: 'A word or phrase that modifies a verb, adjective, or other adverb (how, when, where, why).',
  },
  determiner: {
    term: 'Article / determiner',
    abbr: 'det',
    detail: 'A word such as “the”, “a”, “this” (or the Greek article) that specifies a noun. In Greek it agrees with its noun in case, gender, and number.',
  },
  genitive: {
    term: 'Genitive modifier',
    abbr: 'gen',
    detail: 'A noun in the genitive case modifying another noun — possession, source, description, and more (often “of …”).',
  },
  apposition: {
    term: 'Apposition',
    abbr: 'appos',
    detail: 'A noun placed beside another that renames or identifies it (e.g. “Paul, an apostle”).',
  },
  prepositionalPhrase: {
    term: 'Prepositional phrase',
    abbr: 'pp',
    detail: 'A preposition together with its object, modifying a verb or noun (e.g. “in the beginning”).',
  },
  prepositionObject: {
    term: 'Object of a preposition',
    abbr: 'p-obj',
    detail: 'The noun governed by a preposition; the preposition assigns it its case.',
  },

  // ── Discourse / connectives ─────────────────────────────────────────────
  conjunction: {
    term: 'Conjunction',
    abbr: 'conj',
    detail: 'A word that joins words, phrases, or clauses (and, but, for, because).',
  },
  coordinator: {
    term: 'Coordinator',
    abbr: 'coord',
    detail: 'The conjunction (e.g. καί “and”) that joins two equal, coordinated elements.',
  },
  conjunct: {
    term: 'Coordinated element',
    abbr: 'conj',
    detail: 'One of two or more elements of equal rank joined by a coordinator.',
  },
  particle: {
    term: 'Particle',
    abbr: 'ptcl',
    detail: 'A small uninflected word that shapes the flow of discourse (δέ, γάρ, μέν, οὖν …) rather than naming a thing or action.',
  },
  vocative: {
    term: 'Vocative',
    abbr: 'voc',
    detail: 'A noun of direct address — the person or thing being spoken to.',
  },
  interjection: {
    term: 'Interjection',
    abbr: 'intj',
    detail: 'An exclamatory word standing apart from the grammar of the sentence.',
  },
  adjunct: {
    term: 'Adjunct',
    abbr: 'adjunct',
    detail: 'An optional modifier attached to its head whose precise role is left unspecified.',
  },
  clause: {
    term: 'Clause',
    abbr: 'cl',
    detail: 'A group of words with its own subject and predicate; here represented by its main verb.',
  },
  unknown: {
    term: 'Unanalysed',
    abbr: '',
    detail: 'The relationship has not yet been classified.',
  },

  // ── Constituency tree: phrase categories ────────────────────────────────
  // Keyed `phrase:*` / `pos:*` so the single-letter tags can't collide with the
  // morphology codes below (e.g. "N" the noun tag vs. "n" the neuter code).
  'phrase:S': {
    term: 'Sentence / Clause (S)',
    abbr: 'S',
    detail: 'A complete clause — a subject together with its predicate. It is the top of the phrase-structure tree.',
  },
  'phrase:NP': {
    term: 'Noun phrase (NP)',
    abbr: 'NP',
    detail: 'A noun and the words clustered with it (article, adjectives, genitives) acting as a single unit — e.g. a subject or an object.',
  },
  'phrase:VP': {
    term: 'Verb phrase (VP)',
    abbr: 'VP',
    detail: 'The verb together with its objects and modifiers — everything the clause asserts about the subject.',
  },
  'phrase:PP': {
    term: 'Prepositional phrase (PP)',
    abbr: 'PP',
    detail: 'A preposition plus the noun phrase it governs (e.g. “in the beginning”), modifying a verb or noun.',
  },
  'phrase:AdjP': {
    term: 'Adjective phrase (AdjP)',
    abbr: 'AdjP',
    detail: 'An adjective with any words modifying it, describing a noun.',
  },
  'phrase:AdvP': {
    term: 'Adverb phrase (AdvP)',
    abbr: 'AdvP',
    detail: 'An adverb with any words modifying it, qualifying a verb, adjective, or other adverb.',
  },
  'phrase:DP': {
    term: 'Determiner phrase (DP)',
    abbr: 'DP',
    detail: 'A phrase headed by an article or determiner (“the …”).',
  },
  'phrase:ConjP': {
    term: 'Coordinate phrase (ConjP)',
    abbr: 'ConjP',
    detail: 'Two or more equal elements joined by a conjunction (“and”, “but”, “or”).',
  },
  'phrase:PrtP': {
    term: 'Particle phrase (PrtP)',
    abbr: 'PrtP',
    detail: 'A phrase organised around a discourse particle (δέ, γάρ, οὖν …).',
  },
  'phrase:XP': {
    term: 'Phrase',
    abbr: 'XP',
    detail: 'A group of words functioning as a unit whose exact category is unclassified.',
  },
  // ── Constituency tree: part-of-speech leaf tags ─────────────────────────
  'pos:N': { term: 'Noun (N)', abbr: 'N', detail: 'Names a person, place, thing, or idea.' },
  'pos:V': { term: 'Verb (V)', abbr: 'V', detail: 'Expresses an action or state of being.' },
  'pos:Det': { term: 'Determiner / article (Det)', abbr: 'Det', detail: 'A word like “the” or the Greek article that specifies a noun.' },
  'pos:P': { term: 'Preposition (P)', abbr: 'P', detail: 'A word that relates its object to the rest of the clause (in, with, from, to …).' },
  'pos:Adj': { term: 'Adjective (Adj)', abbr: 'Adj', detail: 'Describes a noun (which one, what kind, how many).' },
  'pos:Adv': { term: 'Adverb (Adv)', abbr: 'Adv', detail: 'Modifies a verb, adjective, or other adverb (how, when, where, why).' },
  'pos:Conj': { term: 'Conjunction (Conj)', abbr: 'Conj', detail: 'Joins words, phrases, or clauses.' },
  'pos:Pron': { term: 'Pronoun (Pron)', abbr: 'Pron', detail: 'Stands in for a noun (he, she, it, who …).' },
  'pos:Prt': { term: 'Particle (Prt)', abbr: 'Prt', detail: 'A small uninflected word shaping discourse (δέ, γάρ, μέν, οὖν …).' },
  'pos:Intj': { term: 'Interjection (Intj)', abbr: 'Intj', detail: 'An exclamation standing apart from the sentence grammar.' },
  'pos:Num': { term: 'Numeral (Num)', abbr: 'Num', detail: 'A counting word (one, two, three …).' },
  'pos:∅': { term: 'Implied / elided', abbr: '∅', detail: 'A word the grammar implies but the text leaves unstated (e.g. a dropped subject or the verb “to be”).' },

  // ── Morphology agreement / government links ─────────────────────────────
  agreement: {
    term: 'Agreement',
    abbr: 'agr',
    detail: 'These words agree in their grammatical form — case, gender, and number — which is how Greek signals that they belong together regardless of word order (e.g. an article or adjective matching its noun).',
  },

  // ── Constituency tree: source `<wg rule>` metadata ──────────────────────
  // Keyed `rule:*` (never bare) so these can't collide with morphology codes.
  // A combined label like "Np-Appos · art." is glossed by splitting it into
  // components (see `lookupCompositeGloss` below) — each component's `term`
  // here is written as a short, lower-case phrase so it reads naturally when
  // stitched together ("Np-Appos — noun phrase in apposition"). Only rules
  // whose meaning is confidently attested (by the Lowfat importer's own
  // comments, `src/io/lowfat.ts`, or unambiguous naming) are included; the
  // long tail of rare/uncertain rule strings is deliberately left ungrossed.
  art: {
    term: 'articular (has the article)',
    abbr: 'art.',
    detail: 'The phrase or word carries the Greek article (ὁ, ἡ, τό …), marking it as definite.',
  },
  // Clause word-order position codes — these appear as the individual
  // hyphen-separated parts of a clause's word-order rule (e.g. "S-V-O",
  // "ADV-V", "S-VC-P"); composite lookup decomposes the rule into these when
  // there is no single entry for the whole combination.
  'rule:S': { term: 'subject', abbr: 'S', detail: 'In a clause word-order rule (e.g. "S-V-O"), S marks where the subject falls.' },
  'rule:V': { term: 'verb / predicate', abbr: 'V', detail: 'In a clause word-order rule, V marks where the finite verb (predicate) falls.' },
  'rule:O': { term: 'direct object', abbr: 'O', detail: 'In a clause word-order rule, O marks where the direct object falls.' },
  'rule:P': { term: 'predicate complement', abbr: 'P', detail: 'In a clause word-order rule, P marks where a predicate nominative or adjective falls.' },
  'rule:VC': { term: 'copula ("to be")', abbr: 'VC', detail: 'In a clause word-order rule, VC marks where a linking (copula) verb falls.' },
  'rule:ADV': { term: 'adverbial', abbr: 'ADV', detail: 'In a clause word-order rule, ADV marks where an adverbial modifier falls.' },
  'rule:IO': { term: 'indirect object', abbr: 'IO', detail: 'In a clause word-order rule, IO marks where the indirect object falls.' },
  // Phrase-modification structures.
  'rule:DetNP': { term: 'article + noun phrase', abbr: 'DetNP', detail: 'An article (or determiner) heading a noun phrase — "the …".' },
  'rule:DetAdj': { term: 'article + adjective', abbr: 'DetAdj', detail: 'An article combined with an adjective, substantizing it — e.g. "the good [one]".' },
  'rule:DetCL': { term: 'article + clause', abbr: 'DetCL', detail: 'An article combined with a clause (often a participial clause), forming a substantival ("the one who …") construction.' },
  'rule:PrepNp': { term: 'preposition + noun phrase', abbr: 'PrepNp', detail: 'A preposition together with the noun phrase it governs, forming a prepositional phrase.' },
  'rule:Np-Appos': { term: 'noun phrase in apposition', abbr: 'Np-Appos', detail: 'A noun phrase placed beside another that renames or identifies it — e.g. "Paul, an apostle".' },
  'rule:NPofNP': { term: 'genitive "of" noun phrase', abbr: 'NPofNP', detail: 'A genitive noun phrase modifying another noun phrase — "the word of God".' },
  'rule:ofNPNP': { term: 'genitive "of" noun phrase', abbr: 'ofNPNP', detail: 'A genitive noun phrase modifying another noun phrase — "the word of God".' },
  'rule:NpPp': { term: 'noun phrase + prepositional phrase', abbr: 'NpPp', detail: 'A noun phrase modified by a following prepositional phrase.' },
  'rule:AdjpNp': { term: 'adjective phrase + noun phrase', abbr: 'AdjpNp', detail: 'An adjective phrase modifying a following noun phrase.' },
  'rule:NpAdjp': { term: 'noun phrase + adjective phrase', abbr: 'NpAdjp', detail: 'A noun phrase modified by a following adjective phrase.' },
  'rule:AdvpNp': { term: 'adverb phrase + noun phrase', abbr: 'AdvpNp', detail: 'An adverb phrase (e.g. καί "also") modifying a noun phrase.' },
  'rule:NpAdvp': { term: 'noun phrase + adverb phrase', abbr: 'NpAdvp', detail: 'A noun phrase modified by a following adverb phrase.' },
  'rule:AdvPp': { term: 'adverb + prepositional phrase', abbr: 'AdvPp', detail: 'An adverb modifying a prepositional phrase.' },
  'rule:PronNP': { term: 'pronoun + noun phrase', abbr: 'PronNP', detail: 'A pronoun (e.g. a demonstrative) heading or modifying a noun phrase.' },
  'rule:QuanPp': { term: 'quantifier + prepositional phrase', abbr: 'QuanPp', detail: 'A quantifier (e.g. πάντα "all") modified by a following prepositional phrase.' },
  'rule:BeVerb': { term: 'periphrastic "to be" verb', abbr: 'BeVerb', detail: 'A periphrastic verb form: a "to be" verb plus a participle functioning together as one verb.' },
  // Coordination.
  'rule:NpaNp': { term: 'noun phrases joined by "and"', abbr: 'NpaNp', detail: 'Two noun phrases coordinated with καί "and".' },
  'rule:aNpaNp': { term: 'noun phrases joined by "and"', abbr: 'aNpaNp', detail: 'A run of noun phrases coordinated with καί "and".' },
  'rule:AdjpaAdjp': { term: 'adjective phrases joined by "and"', abbr: 'AdjpaAdjp', detail: 'Two adjective phrases coordinated with καί "and".' },
  'rule:Conj-CL': { term: 'clauses joined by a conjunction', abbr: 'Conj-CL', detail: 'A conjunction (καί, δέ …) coordinating full clauses.' },
  'rule:ClCl': { term: 'clauses placed side by side', abbr: 'ClCl', detail: 'Clauses coordinated or listed in sequence.' },
  'rule:ClCl2': { term: 'clauses placed side by side', abbr: 'ClCl2', detail: 'Clauses coordinated or listed in sequence.' },
  'rule:CLaCL': { term: 'clauses joined by "and"', abbr: 'CLaCL', detail: 'Clauses coordinated with καί "and".' },
  'rule:aCLaCL': { term: 'clauses joined by "and"', abbr: 'aCLaCL', detail: 'A run of clauses coordinated with καί "and".' },
  'rule:Conj2VP': { term: 'verb phrases joined by a conjunction', abbr: 'Conj2VP', detail: 'A conjunction coordinating verb phrases.' },
  'rule:Conj2Pp': { term: 'prepositional phrases joined by a conjunction', abbr: 'Conj2Pp', detail: 'A conjunction coordinating prepositional phrases.' },
  'rule:Conj3Np': { term: 'noun phrases joined by a conjunction', abbr: 'Conj3Np', detail: 'A conjunction coordinating noun phrases.' },
  'rule:Conj3CL': { term: 'clauses joined by a conjunction', abbr: 'Conj3CL', detail: 'A conjunction coordinating clauses.' },
  // Contrastive "not X but Y" coordination.
  'rule:notNPbutNP': { term: '"not … but …" noun phrases', abbr: 'notNPbutNP', detail: 'A contrastive coordination of two noun phrases — "not X but Y".' },
  'rule:notVPbutVP': { term: '"not … but …" verb phrases', abbr: 'notVPbutVP', detail: 'A contrastive coordination of two verb phrases — "not X but Y".' },
  'rule:notPPbutPP': { term: '"not … but …" prepositional phrases', abbr: 'notPPbutPP', detail: 'A contrastive coordination of two prepositional phrases — "not X but Y".' },
  'rule:notCLbutCL2CL': { term: '"not … but …" clauses', abbr: 'notCLbutCL2CL', detail: 'A contrastive coordination of two clauses — "not X but Y".' },
  'rule:CjpCjp': { term: 'compound "but rather"', abbr: 'CjpCjp', detail: 'A Hebrew compound conjunction כִּי אִם, "but rather".' },
  // Clause attachment / embedding.
  'rule:sub-CL': { term: 'subordinate clause', abbr: 'sub-CL', detail: 'A subordinate clause attached to its governing element.' },
  'rule:PtclCL': { term: 'particle + clause', abbr: 'PtclCL', detail: 'A discourse particle attached to a clause.' },
  'rule:Intj2CL': { term: 'interjection + clause', abbr: 'Intj2CL', detail: 'An interjection attached to a clause.' },
  'rule:that-VP': { term: '"that/which" clause + verb phrase', abbr: 'that-VP', detail: 'A "that/which" clause forming part of a verb phrase.' },
  'rule:V2CL': { term: 'verb + embedded clause', abbr: 'V2CL', detail: 'A verb governing an embedded clause (e.g. an infinitive or complement clause completing it).' },
  'rule:Np2CL': { term: 'noun phrase + embedded clause', abbr: 'Np2CL', detail: 'A noun phrase governing an embedded clause (e.g. a relative clause modifying the noun).' },
  'rule:S2CL': { term: 'subject filled by a clause', abbr: 'S2CL', detail: 'A subject position filled by an embedded clause.' },
  'rule:P2CL': { term: 'predicate complement filled by a clause', abbr: 'P2CL', detail: 'A predicate-complement position filled by an embedded clause.' },
  'rule:ADV2CL': { term: 'adverbial filled by a clause', abbr: 'ADV2CL', detail: 'An adverbial position filled by an embedded (subordinate) clause.' },
  'rule:CL2NP': { term: 'clause functioning as a noun phrase', abbr: 'CL2NP', detail: 'A clause embedded within, or functioning as, a noun phrase (e.g. a relative or nominalized clause).' },
  'rule:NP-CL': { term: 'noun phrase / clause construction', abbr: 'NP-CL', detail: 'A clause functioning as, or attached to, a noun phrase.' },

  // ── Greek/Hebrew morphology codes ───────────────────────────────────────
  // Case
  nom: { term: 'Nominative', detail: 'The case of the subject (and predicate nominative).' },
  gen: { term: 'Genitive', detail: 'The case of source, possession, and description — often “of …”.' },
  dat: { term: 'Dative', detail: 'The case of the indirect object and of means, location, or reference — often “to/for/with/in …”.' },
  acc: { term: 'Accusative', detail: 'The case of the direct object and the goal of motion.' },
  voc: { term: 'Vocative', detail: 'The case of direct address.' },
  // Number
  sg: { term: 'Singular', detail: 'One.' },
  du: { term: 'Dual', detail: 'Exactly two (a number Greek retains only in traces).' },
  pl: { term: 'Plural', detail: 'More than one.' },
  // Gender
  m: { term: 'Masculine', detail: 'Masculine grammatical gender.' },
  f: { term: 'Feminine', detail: 'Feminine grammatical gender.' },
  n: { term: 'Neuter', detail: 'Neuter grammatical gender.' },
  c: { term: 'Common', detail: 'Common gender (masculine or feminine).' },
  // Tense
  pres: { term: 'Present', detail: 'Present tense — typically ongoing or general action.' },
  impf: { term: 'Imperfect', detail: 'Imperfect tense — past action viewed as ongoing or repeated.' },
  fut: { term: 'Future', detail: 'Future tense.' },
  aor: { term: 'Aorist', detail: 'Aorist tense — action viewed as a whole, often simple past.' },
  pf: { term: 'Perfect', detail: 'Perfect tense — a past action with a continuing result.' },
  plpf: { term: 'Pluperfect', detail: 'Pluperfect tense — a result that already existed in the past.' },
  // Voice
  act: { term: 'Active voice', detail: 'The subject performs the action.' },
  mid: { term: 'Middle voice', detail: 'The subject acts on or for itself.' },
  pass: { term: 'Passive voice', detail: 'The subject receives the action.' },
  'm/p': { term: 'Middle/Passive', detail: 'A form that is middle or passive (the two are identical here).' },
  // Mood
  ind: { term: 'Indicative', detail: 'States a fact or asks a question.' },
  subj: { term: 'Subjunctive', detail: 'Expresses possibility, purpose, or exhortation.' },
  opt: { term: 'Optative', detail: 'Expresses a wish or remote possibility.' },
  impv: { term: 'Imperative', detail: 'Gives a command.' },
  inf: { term: 'Infinitive', detail: 'A verbal noun (“to …”); no subject agreement.' },
  ptcp: { term: 'Participle', detail: 'A verbal adjective — it shares verb features (tense, voice) and adjective features (case, gender, number).' },
  // Person
  '1': { term: 'First person', detail: 'The speaker (I / we).' },
  '2': { term: 'Second person', detail: 'The one addressed (you).' },
  '3': { term: 'Third person', detail: 'The one spoken about (he / she / it / they).' },
};

// A lower-cased index of GLOSSARY, built once, so composite/prefixed keys
// (e.g. `rule:Np-Appos`) can still be matched case-insensitively even though
// their stored key isn't already all-lowercase (unlike the plain morphology
// codes, which are).
const GLOSSARY_LC: Record<string, GlossEntry> = Object.fromEntries(
  Object.entries(GLOSSARY).map(([k, v]) => [k.toLowerCase(), v]),
);

/** Exact (case-insensitive) lookup against GLOSSARY — no composite splitting. */
function lookupExact(key: string): GlossEntry | undefined {
  return GLOSSARY[key] ?? GLOSSARY_LC[key.toLowerCase()];
}

// Composite-label splitting: a constituency-tree source-metadata label like
// "Np-Appos · art." combines several components into one string. TOP_SPLIT
// separates on the "joiner" punctuation (middle dot / bullet variants) and
// surrounding whitespace — the separator between otherwise-whole component
// names. SUB_SPLIT (hyphen / slash) is tried only WITHIN a component that
// didn't resolve whole, so a hyphenated rule name like "Np-Appos" (which may
// have its own `rule:Np-Appos` entry) is always tried intact first.
const TOP_SPLIT = /[·•‣⁃∙◦]|\s+/;
const SUB_SPLIT = /[-/]/;
/** Prefixes tried, in order, for a single normalized component. */
const COMPONENT_PREFIXES = ['rule:', 'phrase:', 'pos:'];

/** Trim a component and strip one trailing period ("art." → "art"). */
function normalizeComponent(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.length > 1 && trimmed.endsWith('.') ? trimmed.slice(0, -1).trim() : trimmed;
}

/** Resolve one label component against `rule:`/`phrase:`/`pos:`, then bare. */
function resolveComponent(raw: string): GlossEntry | undefined {
  const c = normalizeComponent(raw);
  if (!c) return undefined;
  for (const prefix of COMPONENT_PREFIXES) {
    const hit = lookupExact(prefix + c);
    if (hit) return hit;
  }
  return lookupExact(c);
}

/**
 * Gloss a combined label (e.g. "Np-Appos · art.") by splitting it into
 * components and composing the glosses of the ones that resolve. Unknown
 * components are silently skipped; if nothing resolves, returns undefined so
 * no gloss popover appears at all (rather than an empty/noisy one).
 */
function lookupCompositeGloss(key: string): GlossEntry | undefined {
  const parts = key.split(TOP_SPLIT).map((p) => p.trim()).filter(Boolean);
  const found: { label: string; entry: GlossEntry }[] = [];
  for (const part of parts) {
    const whole = resolveComponent(part);
    if (whole) {
      found.push({ label: part, entry: whole });
      continue;
    }
    const subParts = part.split(SUB_SPLIT).map((p) => p.trim()).filter(Boolean);
    if (subParts.length < 2) continue;
    for (const sub of subParts) {
      const hit = resolveComponent(sub);
      if (hit) found.push({ label: sub, entry: hit });
    }
  }
  if (!found.length) return undefined;
  const seen = new Set<string>();
  const unique = found.filter(({ label }) => {
    const k = label.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return {
    term: key,
    detail: unique.map(({ label, entry }) => `${label} — ${entry.term}`).join('; '),
  };
}

/**
 * Look up a glossary entry by key (case-insensitive). Falls back to
 * {@link lookupCompositeGloss} for combined labels (e.g. constituency-tree
 * source metadata like "Np-Appos · art.") that don't match a single entry.
 */
export function lookupGloss(key: string | undefined): GlossEntry | undefined {
  if (!key) return undefined;
  return lookupExact(key) ?? lookupCompositeGloss(key);
}

/** Whether a key resolves to a glossary entry (for guarding interactivity). */
export function hasGloss(key: string | undefined): boolean {
  return lookupGloss(key) !== undefined;
}
