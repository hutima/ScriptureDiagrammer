import type {
  KrDocument,
  Provenance,
  Relation,
  SyntacticRole,
  SyntaxModel,
  SyntaxNode,
  Token,
} from '@/domain/schema';
import { descendantIds } from './queries';
import { makeId } from './ids';

/**
 * Pure, immutable edits to the syntax model and document. Each returns a new
 * object; callers (the editor store, the inference engine) never mutate in
 * place. Keeping every structural edit here means there is exactly one place to
 * audit when the model grows.
 */

export function upsertNode(model: SyntaxModel, node: SyntaxNode): SyntaxModel {
  const exists = model.nodes.some((n) => n.id === node.id);
  return {
    ...model,
    nodes: exists
      ? model.nodes.map((n) => (n.id === node.id ? node : n))
      : [...model.nodes, node],
  };
}

export function updateNode(
  model: SyntaxModel,
  id: string,
  patch: Partial<SyntaxNode>,
): SyntaxModel {
  return {
    ...model,
    nodes: model.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
  };
}

export function upsertRelation(model: SyntaxModel, relation: Relation): SyntaxModel {
  const exists = model.relations.some((r) => r.id === relation.id);
  return {
    ...model,
    relations: exists
      ? model.relations.map((r) => (r.id === relation.id ? relation : r))
      : [...model.relations, relation],
  };
}

export function updateRelation(
  model: SyntaxModel,
  id: string,
  patch: Partial<Relation>,
): SyntaxModel {
  return {
    ...model,
    relations: model.relations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  };
}

export function removeRelation(model: SyntaxModel, id: string): SyntaxModel {
  return { ...model, relations: model.relations.filter((r) => r.id !== id) };
}

/**
 * Removes a node and its whole subtree, plus any relations touching the removed
 * nodes. The root node cannot be removed (returns the model unchanged).
 */
export function removeNodeSubtree(model: SyntaxModel, id: string): SyntaxModel {
  if (id === model.rootId) return model;
  const doomed = new Set<string>([id, ...descendantIds(model, id)]);
  return {
    ...model,
    nodes: model.nodes.filter((n) => !doomed.has(n.id)),
    relations: model.relations.filter(
      (r) => !doomed.has(r.headId) && !doomed.has(r.dependentId),
    ),
  };
}

/**
 * Detach a SINGLE node from the tree without destroying its subtree: the node is
 * removed and its incoming relation dropped, but its children are re-pointed onto
 * the node's former parent so they stay reachable. Tokens are NOT touched — the
 * node's words simply become UNASSIGNED (no node realizes them), so they reappear
 * in the editor's word bank. This is the first half of the two-step delete: a word
 * removed from the diagram goes back to "unassigned" rather than vanishing; a
 * second delete from the bank removes the token for good.
 *
 * The root cannot be detached (returns the model unchanged). A node with no parent
 * simply drops its children's incoming edges (they become detached too) — but in
 * practice every placed word hangs off the root, so a parent always exists.
 */
export function detachNode(model: SyntaxModel, id: string): SyntaxModel {
  if (id === model.rootId) return model;
  const parentHead = model.relations.find((r) => r.dependentId === id)?.headId;
  return {
    ...model,
    nodes: model.nodes.filter((n) => n.id !== id),
    relations: model.relations
      // Drop the node's own incoming relation(s).
      .filter((r) => r.dependentId !== id)
      // Re-home its children onto its former parent (keeping the subtree alive).
      .map((r) => (r.headId === id && parentHead ? { ...r, headId: parentHead } : r))
      // With no parent to re-home onto, drop the now-dangling child edges.
      .filter((r) => r.headId !== id)
      // Never leave a self-loop behind.
      .filter((r) => r.headId !== r.dependentId),
  };
}

// --- reparenting ----------------------------------------------------------------

const MANUAL: Provenance = { source: 'manual', confidence: 'high' };

/** Clause slots that hold exactly ONE filler — assigning a new one REPLACES it. */
const SINGLE_FILLER: Partial<Record<SyntacticRole, SyntacticRole[]>> = {
  subject: ['subject'],
  predicate: ['predicate', 'copula'],
  copula: ['predicate', 'copula'],
};

/**
 * When `nodeId` takes a single-occupancy clause slot (subject / predicate) on
 * `headId`, evict the current filler so the slot isn't doubled: the displaced
 * filler takes the incoming node's vacated role + head (a SWAP, when the incoming
 * node had a prior relation `incoming`), or — if it was only an implied
 * placeholder — is removed. This is what makes "replace the subject/verb in a
 * clause" and "swap words between clauses" one tap.
 */
export function replaceFiller(
  syntax: SyntaxModel,
  base: SyntaxModel,
  nodeId: string,
  role: SyntacticRole,
  headId: string,
  incoming: Relation | undefined,
): SyntaxModel {
  const slot = SINGLE_FILLER[role];
  if (!slot) return syntax;
  const existing = base.relations.find(
    (r) => r.headId === headId && slot.includes(r.type) && r.dependentId !== nodeId,
  );
  if (!existing) return syntax;
  const existingImplied = base.nodes.find((n) => n.id === existing.dependentId)?.implied;
  if (existingImplied) return removeRelation(syntax, existing.id);
  if (incoming && incoming.headId !== headId) {
    const swapped = updateRelation(syntax, existing.id, {
      type: incoming.type,
      headId: incoming.headId,
      provenance: MANUAL,
    });
    return updateNode(swapped, existing.dependentId, { role: incoming.type, provenance: MANUAL });
  }
  // Incoming had no prior slot (or came from the same head): the old filler can't
  // simply trade places, so demote it to a loose adjunct the user can re-place.
  return updateRelation(syntax, existing.id, { type: 'adjunct', provenance: MANUAL });
}

/**
 * Re-point `dependentId`'s incoming relation onto `headId` with `type` — the
 * PURE transformation behind the store's `attachNodeTo` (promote / demote /
 * move-under / drag-drop all resolve to it). Extracted here so the Phrase/Block
 * drag PREVIEW can apply the exact same move to a candidate document: what the
 * preview shows is by construction what the drop will commit. Any extra
 * incoming relations are collapsed to one; a node with no parent gains a new
 * relation; taking an occupied subject/predicate slot evicts/swaps the current
 * filler (see {@link replaceFiller}). Self-attachment returns the model
 * unchanged; callers guard against cycles (attaching under a descendant).
 */
export function reattachNode(
  model: SyntaxModel,
  dependentId: string,
  headId: string,
  type: SyntacticRole,
): SyntaxModel {
  if (dependentId === headId) return model;
  const parents = model.relations.filter((r) => r.dependentId === dependentId);
  const incoming = parents[0];
  let syntax = model;
  if (parents.length) {
    const [first, ...rest] = parents;
    syntax = updateRelation(syntax, first!.id, { headId, type, provenance: MANUAL });
    for (const r of rest) syntax = removeRelation(syntax, r.id);
  } else {
    syntax = upsertRelation(syntax, {
      id: makeId('rel'),
      type,
      headId,
      dependentId,
      provenance: MANUAL,
    });
  }
  // Attaching into an occupied subject/predicate slot (e.g. moving a word into
  // another clause as its subject) swaps out the current filler.
  return replaceFiller(syntax, model, dependentId, type, headId, incoming);
}

// --- token edits --------------------------------------------------------------

export function updateToken(
  doc: KrDocument,
  id: string,
  patch: Partial<Token>,
): KrDocument {
  return {
    ...doc,
    tokens: doc.tokens.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
}

/** Replaces the syntax model wholesale (e.g. after applying inferences). */
export function withSyntax(doc: KrDocument, syntax: SyntaxModel): KrDocument {
  return { ...doc, syntax };
}
