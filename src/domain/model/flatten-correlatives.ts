import type { KrDocument, Relation } from '@/domain/schema';

/**
 * Flatten a chain of CORRELATIVE coordinations into one flat coordination.
 *
 * Greek lists like Col 1:16 "εἴτε θρόνοι εἴτε κυριότητες εἴτε ἀρχαὶ εἴτε
 * ἐξουσίαι" are one continuing alternation — "whether A or B or C or D". The
 * Lowfat treebanks bracket such a list into juxtaposed PAIRS
 * ([εἴτε θρόνοι εἴτε κυριότητες] [εἴτε ἀρχαὶ εἴτε ἐξουσίαι]) with no
 * conjunction between them, which the converter's juxtaposed-sibling default
 * then labels APPOSITION — drawing "ἀρχαί/ἐξουσίαι" as if they RENAMED
 * "θρόνοι/κυριότητες" rather than continuing the same list.
 *
 * This pure pass rewrites two encodings of that artifact (conservatively):
 *
 * 1. PAIR CHAINS (Col 1:16) — an apposition whose head and dependent are BOTH
 *    coordinations held together by the SAME correlative conjunction (εἴτε,
 *    οὔτε, μήτε) is re-read as one flat coordination: the dependent pair's
 *    members and coordinators are hoisted onto the head, and the apposition
 *    link itself becomes an ordinary conjunct.
 * 2. UNCLAIMED MARKS (1 Cor 3:22 "εἴτε Παῦλος εἴτε Ἀπολλῶς εἴτε Κηφᾶς …") —
 *    the source hangs ALL the correlative marks on the head word and leaves
 *    the other members to the apposition default. Each correlative mark
 *    introduces one member, so while a head carries MORE same-lemma marks
 *    than members, its appositions (in surface order) are the missing
 *    members, not renamings.
 *
 * Members and their marks are re-ordered by surface position so the fork
 * lists them in reading order. Anything not matching (a genuine apposition ON
 * a list member, a plain καί coordination, a mark-and-member-balanced list
 * with a true apposition) is left untouched.
 */

/** Correlative conjunctions that mark a continuing alternation, by lemma. */
const CORRELATIVE_LEMMAS = new Set(['εἴτε', 'οὔτε', 'μήτε']);

export function flattenCorrelativeCoordinations(doc: KrDocument): KrDocument {
  let relations: Relation[] = doc.syntax.relations;
  const nodeById = new Map(doc.syntax.nodes.map((n) => [n.id, n]));
  const tokenById = new Map(doc.tokens.map((t) => [t.id, t]));

  const minIndex = (nodeId: string): number => {
    const idxs = (nodeById.get(nodeId)?.tokenIds ?? []).map(
      (t) => tokenById.get(t)?.index ?? Infinity,
    );
    return idxs.length ? Math.min(...idxs) : Infinity;
  };

  // The one correlative lemma coordinating a node's members, or null when the
  // node is no correlative coordination (no coordinators, mixed lemmas, or a
  // plain conjunction such as καί). Clauses are excluded — clause coordination
  // draws through its own compound-predicate paths.
  const correlativeLemma = (nodeId: string): string | null => {
    if (nodeById.get(nodeId)?.kind === 'clause') return null;
    const coords = relations.filter((r) => r.headId === nodeId && r.type === 'coordinator');
    if (!coords.length) return null;
    const lemmas = coords.map((r) => {
      const tid = nodeById.get(r.dependentId)?.tokenIds[0];
      const tok = tid ? tokenById.get(tid) : undefined;
      return (tok?.lemma ?? tok?.surface ?? '').normalize('NFC');
    });
    const lemma = lemmas[0]!;
    return CORRELATIVE_LEMMAS.has(lemma) && lemmas.every((l) => l === lemma) ? lemma : null;
  };

  // Re-order a merged list's coordinator/conjunct relations by surface
  // position, so members read in order and each correlative mark rides
  // beside its own member.
  const reorderMembers = (headId: string): void => {
    const mine = new Set(
      relations.filter(
        (r) => r.headId === headId && (r.type === 'coordinator' || r.type === 'conjunct'),
      ),
    );
    const sorted = [...mine].sort((a, b) => minIndex(a.dependentId) - minIndex(b.dependentId));
    let k = 0;
    relations = relations.map((r) => (mine.has(r) ? sorted[k++]! : r));
  };

  const asConjunct = (r: Relation, lemma: string): Relation => ({
    ...r,
    type: 'conjunct' as const,
    provenance: {
      source: 'converted' as const,
      confidence: 'medium' as const,
      ...r.provenance,
      reason: `A juxtaposed ${lemma}… member continues one correlative list, not an apposition.`,
    },
  });

  let changed = false;
  // Fixpoint: rewrite one apposition per pass, then re-scan (a longer list
  // arrives as a CHAIN of pair-appositions, each dissolving into the head).
  for (let guard = 0; guard < 200; guard++) {
    // (1) PAIR CHAIN — head and dependent are same-lemma correlative pairs.
    const pair = relations.find(
      (r) =>
        r.type === 'apposition' &&
        correlativeLemma(r.headId) !== null &&
        correlativeLemma(r.headId) === correlativeLemma(r.dependentId),
    );
    if (pair) {
      const { headId, dependentId } = pair;
      const lemma = correlativeLemma(dependentId)!;
      relations = relations.map((r) => {
        // The pair link itself: the dependent pair's head joins the list.
        if (r.id === pair.id) return asConjunct(r, lemma);
        // Hoist the dissolving pair's members and marks onto the list head. A
        // further chained pair-apposition hoists too (and merges next pass); a
        // genuine apposition of some OTHER word onto this member stays put.
        if (
          r.headId === dependentId &&
          (r.type === 'coordinator' ||
            r.type === 'conjunct' ||
            (r.type === 'apposition' && correlativeLemma(r.dependentId) === lemma))
        ) {
          return { ...r, headId };
        }
        return r;
      });
      reorderMembers(headId);
      changed = true;
      continue;
    }

    // (2) UNCLAIMED MARKS — a head carrying more same-lemma correlative marks
    // than members claims its appositions (surface order) as the missing
    // members. A genuine apposition on a balanced list stays an apposition.
    const unclaimed = relations
      .filter((r) => {
        if (r.type !== 'apposition') return false;
        if (nodeById.get(r.dependentId)?.kind === 'clause') return false;
        if (correlativeLemma(r.headId) === null) return false;
        const marks = relations.filter(
          (x) => x.headId === r.headId && x.type === 'coordinator',
        ).length;
        const members =
          1 + relations.filter((x) => x.headId === r.headId && x.type === 'conjunct').length;
        return members < marks;
      })
      .sort((a, b) => minIndex(a.dependentId) - minIndex(b.dependentId))[0];
    if (!unclaimed) break;
    const lemma = correlativeLemma(unclaimed.headId)!;
    relations = relations.map((r) => (r.id === unclaimed.id ? asConjunct(r, lemma) : r));
    reorderMembers(unclaimed.headId);
    changed = true;
  }

  if (!changed) return doc;
  return { ...doc, syntax: { ...doc.syntax, relations } };
}
