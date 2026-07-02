import type { SyntacticRole, SyntaxNode } from '@/domain/schema';
import { childRelations, getNode, nodeText } from '@/domain/model';
import { nodeTone } from '../tone';
import type { GrammarTone } from '../types';
import type { Ctx } from './types';

/**
 * SYNTAX CLASSIFICATION for the Kellogg-Reed engine — pure predicates that
 * decide WHICH convention a node gets (baseline complement, diagonal leaf,
 * word coordination, infinitive, …). No geometry lives here.
 */
// Complements that sit ON the main line with a separator. The INDIRECT object is
// deliberately NOT here: in Reed-Kellogg it hangs BELOW the verb on a slanted
// line (a stem to its own short baseline), distinct from the direct object's
// upright tick on the baseline.
export const BASELINE_COMPLEMENTS: SyntacticRole[] = [
  'directObject',
  'predicateNominative',
  'predicateAdjective',
  'objectComplement',
  'dativeComplement',
  'genitiveComplement',
  // Object-LIKE accusatives sit on the baseline in the object slot too — the
  // honest label (detail card / connector), not the geometry, carries the
  // nuance. The adverbial accusatives (extent / respect / neutral modifier)
  // are NOT here: they hang beneath the verb like other adverbials.
  'objectLikeComplement',
  'retainedAccusative',
];

/**
 * Leedy's ellipsis marker, written where an element is elided and its exact
 * wording is uncertain (a gapped subject, a suppressed antecedent, an elided
 * copula). The auto-generated structural placeholders "(subject)"/"(verb)" stay
 * descriptive; this stands in for an EXPLICIT empty node the author left blank.
 */
export const ELISION_MARK = '(X)';

/**
 * If `rel` introduces a prepositional phrase, return the object node id so the
 * preposition can be written ON the diagonal (traditional Kellogg-Reed) and the
 * object laid out on its own horizontal baseline beneath it. Returns null for
 * anything that is not a `preposition + prepositionObject` shape.
 */
export function prepObjectId(ctx: Ctx, rel: { type: SyntacticRole; dependentId: string }): string | null {
  const objRel = childRelations(ctx.doc.syntax, rel.dependentId).find(
    (r) => r.type === 'prepositionObject',
  );
  if (!objRel) return null;
  // A preposition governing an object always rides the diagonal — whether it is
  // tagged `prepositionalPhrase` (a PP modifying a noun) or attached to the verb
  // as an `adverbial` (an adverbial PP, e.g. ἐν ἀγάπῃ → ἐν on the slant, ἀγάπῃ on
  // the horizontal below).
  const node = getNode(ctx.doc.syntax, rel.dependentId);
  const tok = node?.tokenIds.length ? ctx.doc.tokens.find((t) => t.id === node.tokenIds[0]) : undefined;
  if (rel.type === 'prepositionalPhrase' || tok?.pos === 'preposition') return objRel.dependentId;
  return null;
}

/** The object node a preposition node governs (its `prepositionObject`), if any. */
export function prepObjectOf(ctx: Ctx, prepNodeId: string): string | null {
  return (
    childRelations(ctx.doc.syntax, prepNodeId).find((r) => r.type === 'prepositionObject')
      ?.dependentId ?? null
  );
}

/**
 * The conjunct PP members of a coordinated preposition node — e.g. ἐπὶ τῆς γῆς,
 * a conjunct of ἐν τοῖς οὐρανοῖς in "ἐν τοῖς οὐρανοῖς καὶ ἐπὶ τῆς γῆς". Only
 * conjuncts that are themselves prepositions (carry their own object) qualify;
 * an empty list means this is a plain (uncoordinated) PP.
 */
export function ppConjunctRels(ctx: Ctx, prepNodeId: string) {
  return wordConjunctRels(ctx, prepNodeId).filter((r) => !!prepObjectOf(ctx, r.dependentId));
}

/**
 * Closed-class / function words that are written ALONG a diagonal in the
 * traditional Kellogg-Reed style (articles, adjectives, adverbs, possessive
 * pronouns, particles, conjunctions, numerals). A NOUN used as a modifier
 * (e.g. an adnominal genitive, an appositive) instead gets its own horizontal
 * baseline, because it routinely carries further structure of its own.
 */
const DIAGONAL_POS = new Set([
  'adjective',
  'adverb',
  'article',
  'determiner',
  'particle',
  'conjunction',
  'numeral',
  'pronoun',
]);

export function isDiagonalLeaf(ctx: Ctx, nodeId: string): boolean {
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node || node.kind !== 'word') return false;
  if (childRelations(ctx.doc.syntax, nodeId).length > 0) return false;
  const tok = node.tokenIds.length
    ? ctx.doc.tokens.find((t) => t.id === node.tokenIds[0])
    : undefined;
  return tok?.pos ? DIAGONAL_POS.has(tok.pos) : false;
}

/** POS of a word node, if it carries one token. */
export function wordPos(ctx: Ctx, nodeId: string): string | undefined {
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node || node.kind !== 'word' || !node.tokenIds.length) return undefined;
  return ctx.doc.tokens.find((t) => t.id === node.tokenIds[0])?.pos;
}

/**
 * A coordination whose head and conjuncts are all diagonal modifiers
 * (adjectives / adverbs): "tall and distinguished", "little and old". Drawn as
 * parallel slants joined by a dashed coordinator bar, rather than the horizontal
 * two-prong fork used for coordinated nouns.
 *
 * Every member must be a LIGHT diagonal modifier — i.e. carry only further
 * diagonal leaves of its own, never a sub-baseline dependent (a prepositional
 * phrase, an appositive clause, a genitive NP). `drawDiagonalModifier` can only
 * fold further slants off a member's word, so a member with heavy structure
 * would have its whole subtree crushed onto tiny diagonal jogs (the Eph 1:1
 * "τοῖς ἁγίοις … καὶ πιστοῖς ἐν Χριστῷ" clash). Such a coordination falls back to
 * the two-prong fork, which lays each member out as a full block instead.
 */
export function isDiagonalCoordination(ctx: Ctx, nodeId: string): boolean {
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node || node.kind !== 'word') return false;
  const conj = wordConjunctRels(ctx, nodeId);
  if (!conj.length) return false;
  const pos = wordPos(ctx, nodeId);
  if (!pos || !DIAGONAL_POS.has(pos)) return false;
  // The head's OWN modifiers (its conjunct/coordinator children belong to the
  // coordination, not to the slant) must all be light diagonal leaves.
  const headLight = childRelations(ctx.doc.syntax, nodeId).every(
    (r) => r.type === 'conjunct' || r.type === 'coordinator' || isDiagonalModifier(ctx, r.dependentId),
  );
  if (!headLight) return false;
  // Each conjunct must likewise be a pure diagonal modifier (no heavy children).
  return conj.every((r) => isDiagonalModifier(ctx, r.dependentId));
}

/**
 * An infinitive (a bare infinitive word, or a clause whose predicate is one).
 * Diagrammed like a prepositional phrase: an (empty, in Greek) diagonal leading
 * down to a horizontal baseline that carries the infinitive and its complements —
 * the marker "to" rides the diagonal in English; a Greek infinitive is one word
 * sitting on the horizontal.
 */
export function isInfinitival(ctx: Ctx, nodeId: string): boolean {
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node) return false;
  if (node.kind === 'word') return wordPos(ctx, nodeId) === 'infinitive';
  if (node.kind !== 'clause') return false;
  const pred = childRelations(ctx.doc.syntax, nodeId).find(
    (r) => r.type === 'predicate' || r.type === 'copula',
  );
  return pred ? wordPos(ctx, pred.dependentId) === 'infinitive' : false;
}

/**
 * A closed-class modifier (article, adjective, adverb…) that is drawn ALONG a
 * diagonal — extended from `isDiagonalLeaf` to allow it to carry its OWN diagonal
 * modifiers (an adverb modifying an adjective: "very friendly"; an adverb
 * modifying an adverb: "quite often"). Those sub-modifiers hang as further
 * diagonals off the word, so a stack of qualifiers reads down a zig-zag of
 * slants rather than dropping onto a horizontal sub-baseline.
 */
export function isDiagonalModifier(ctx: Ctx, nodeId: string): boolean {
  const pos = wordPos(ctx, nodeId);
  if (!pos || !DIAGONAL_POS.has(pos)) return false;
  return childRelations(ctx.doc.syntax, nodeId).every(
    (r) => r.type !== 'conjunct' && r.type !== 'coordinator' && isDiagonalModifier(ctx, r.dependentId),
  );
}

/** The word-level `conjunct` members of a coordinated node (clauses excluded). */
export function wordConjunctRels(ctx: Ctx, nodeId: string) {
  return childRelations(ctx.doc.syntax, nodeId).filter(
    (r) => r.type === 'conjunct' && !isClauseChild(ctx, r.dependentId),
  );
}

/** A word that heads a coordination of further words ("Paul and Timothy"). */
export function isWordCoordination(ctx: Ctx, node: SyntaxNode): boolean {
  return node.kind === 'word' && wordConjunctRels(ctx, node.id).length > 0;
}

/**
 * The smallest surface token index anywhere in a node's subtree — where the
 * construction it heads first appears in the sentence. Used to tell a
 * sentence-INITIAL connective (διό, οὖν …) from one that joins two members.
 */
export function subtreeMinIndex(ctx: Ctx, nodeId: string, seen = new Set<string>()): number {
  if (seen.has(nodeId)) return Infinity;
  seen.add(nodeId);
  let min = Infinity;
  const node = getNode(ctx.doc.syntax, nodeId);
  if (node) {
    for (const tid of node.tokenIds) {
      const tok = ctx.doc.tokens.find((t) => t.id === tid);
      if (tok) min = Math.min(min, tok.index);
    }
  }
  for (const r of childRelations(ctx.doc.syntax, nodeId)) {
    min = Math.min(min, subtreeMinIndex(ctx, r.dependentId, seen));
  }
  return min;
}

export function isClauseChild(ctx: Ctx, nodeId: string): boolean {
  return getNode(ctx.doc.syntax, nodeId)?.kind === 'clause';
}

/** Part of speech of a node's first token, if any (verb / participle / …). */
export function firstTokenPos(ctx: Ctx, node: SyntaxNode): string | undefined {
  const tid = node.tokenIds[0];
  return tid ? ctx.doc.tokens.find((t) => t.id === tid)?.pos : undefined;
}

/**
 * Show a connector label only when it adds information — i.e. the dependent is
 * a clause or an implied/empty element. For a normal word the label would just
 * duplicate the word already drawn (e.g. a preposition), so it is suppressed.
 */
export function showLabel(ctx: Ctx, nodeId: string): boolean {
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node) return true;
  return node.kind === 'clause' || Boolean(node.implied) || nodeText(ctx.doc, node) === '';
}

/** A node's grammar tone when the colour overlay is on (else none — plain ink). */
export function wordTone(ctx: Ctx, node: SyntaxNode): GrammarTone | undefined {
  return ctx.color ? nodeTone(ctx.doc, node) : undefined;
}

/**
 * A headless coordinate clause: a clause node with no subject/predicate of its
 * own that only ties conjunct members together (the wrapper the Lowfat converter
 * emits for "A καί B"). It routes to a spine — or, for infinitives, a fork.
 */
export function isHeadlessCoordinateClause(ctx: Ctx, nodeId: string): boolean {
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node || node.kind !== 'clause') return false;
  const rels = childRelations(ctx.doc.syntax, nodeId);
  const hasSubject = rels.some(
    (r) => r.type === 'subject' && !getNode(ctx.doc.syntax, r.dependentId)?.implied,
  );
  const hasPredicate = rels.some((r) => r.type === 'predicate' || r.type === 'copula');
  return !hasSubject && !hasPredicate && rels.some((r) => r.type === 'conjunct');
}
