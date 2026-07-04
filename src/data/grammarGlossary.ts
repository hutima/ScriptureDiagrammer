/**
 * GRAMMAR TERM GLOSSARY — short, beginner-friendly definitions for the
 * Greek-grammar vocabulary that guided-mode TEACHING PROSE uses (a step's
 * `body` / `implication` / `caution`, and a guide's `devotionalFrame`).
 *
 * This is deliberately separate from `domain/model/glossary.ts`, which glosses
 * the diagram's own terse relation/POS *codes* (e.g. "gen", "acc-ext") for a
 * tap-a-label popover on the canvas. This glossary instead matches the plain
 * English WORDS a reader encounters while reading a guide's prose — it is
 * rendered by `ui/guided/GrammarTermHelp.tsx`, which highlights the first
 * occurrence of each entry found in a block of prose.
 *
 * Matching is longest-phrase-first (see `buildGrammarGlossaryPattern` in
 * `GrammarTermHelp.tsx`), so a multi-word entry like "predicate nominative" is
 * matched whole rather than being shadowed by (or shadowing) a shorter entry.
 *
 * "present" (bare) is deliberately NOT an entry: on its own it is an extremely
 * common ordinary English word ("at present", "presents itself", "the present
 * moment") and would produce constant false-positive highlights in ordinary
 * prose. Only the unambiguous grammatical collocations "present tense" and
 * "present participle" are matched, per CLAUDE.md's own aspect caution (never
 * flatten "present" into "always continuous").
 */

export interface GrammarGlossaryEntry {
  /** Matched case-insensitively as a whole word/phrase. Canonical lower-case form. */
  term: string;
  /** One or two sentences, beginner-friendly, Greek-aware where relevant. */
  definition: string;
}

export const GRAMMAR_GLOSSARY: GrammarGlossaryEntry[] = [
  {
    term: 'predicate nominative',
    definition:
      'A noun in the nominative case linked to the subject by a "to be" verb (stated or implied) that renames or describes it — e.g. "the Word was God," where "God" describes the subject rather than being acted upon.',
  },
  {
    term: 'relative pronoun',
    definition:
      'A word such as "who," "which," or "that" (Greek ὅς/ἥ/ὅ) that introduces a clause describing an earlier noun — its antecedent. In Greek it agrees with that noun in gender and number, but takes its own case from its job inside its own clause.',
  },
  {
    term: 'present participle',
    definition:
      'A participle built on the present-tense stem, picturing its action as ongoing or in progress alongside the main verb — e.g. "the one who is calling," "while believing."',
  },
  {
    term: 'present tense',
    definition:
      'The present tense in Greek typically pictures an action as ongoing or in progress — a "video" rather than a "snapshot." It does not by itself mean the action happens constantly or forever; how much weight that carries depends on context.',
  },
  {
    term: 'genitive',
    definition:
      'The genitive case marks a noun that describes, limits, or belongs to another noun — often translated with "of" (e.g. "the word of God"). A Greek genitive can show possession, source, description, and more; the exact relationship depends on context.',
  },
  {
    term: 'dative',
    definition:
      'The dative case typically marks the person or thing indirectly affected by a verb — often translated "to" or "for" (e.g. "he gave to them"). Greek also uses the dative for means/instrument ("by/with") and location ("in/among").',
  },
  {
    term: 'nominative',
    definition:
      'The nominative case marks the subject of a clause — the one doing or being described by the verb. A predicate noun or adjective linked to the subject by a "to be" verb is usually nominative too.',
  },
  {
    term: 'accusative',
    definition:
      'The accusative case typically marks the direct object — the person or thing directly acted on by a verb (answers "whom?" or "what?"). Greek also uses it for extent, respect, and after some prepositions.',
  },
  {
    term: 'apposition',
    definition:
      'Apposition places a noun (or noun phrase) beside another to rename or further identify it — e.g. "Paul, an apostle of Christ," where "an apostle of Christ" restates who "Paul" is.',
  },
  {
    term: 'participle',
    definition:
      'A verb form that acts like an adjective, adverb, or noun — e.g. "the believing one," "having said this." Greek participles carry tense and voice as well as case, gender, and number, and can function very flexibly in a sentence.',
  },
  {
    term: 'aorist',
    definition:
      'The aorist tense in Greek views an action as a simple, whole event, without commenting on how long it took or whether it was repeated — a "snapshot" rather than a "video." It does not by itself mean "once for all" or even necessarily past time.',
  },
  {
    term: 'infinitive',
    definition:
      'The "to ___" form of a verb (e.g. "to go," Greek λέγειν "to say"). It can act like a noun naming the action itself, or complete another verb\'s meaning, and in Greek can carry its own subject and object.',
  },
  {
    term: 'antecedent',
    definition:
      'The earlier noun (or noun phrase) that a pronoun — especially a relative pronoun — points back to and stands in for.',
  },
  {
    term: 'modifier',
    definition:
      'A word or phrase that describes, limits, or adds detail to another word (its "head") — an adjective describing a noun, an adverb describing a verb, a genitive describing a noun, and so on.',
  },
  {
    term: 'conjunction',
    definition: 'A word that joins words, phrases, or clauses — e.g. "and," "but," "because" (Greek καί, δέ, γάρ, ὅτι…).',
  },
  {
    term: 'subordinator',
    definition:
      'A subordinating conjunction that introduces a clause depending on another clause rather than standing on its own — e.g. "because," "although," "that" (Greek ὅτι, ἵνα, εἰ…).',
  },
];

/** Case-insensitive, whole-term lookup by the entry's canonical form. */
export function findGrammarGlossaryEntry(term: string): GrammarGlossaryEntry | undefined {
  const lower = term.toLowerCase();
  return GRAMMAR_GLOSSARY.find((e) => e.term === lower);
}
