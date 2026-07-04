import type { KrDocument, SyntacticRole } from '@/domain/schema';
import {
  getNode,
  childRelations,
  parentRelations,
  descendantIds,
  reattachNode,
  buildOutline,
} from '@/domain/model';
import { layoutForMode } from '@/domain/layout';
import { selectableNodes, type SelectableNode } from './common';

/**
 * Pure hierarchy maths for Phrase/Block reparenting (promote / demote / move
 * under). All three are expressed with the existing `attachNodeTo` graph
 * mutation; these helpers compute the target head, so the controller, the
 * adapters, the workbench, and the advanced BlockEditor all agree on what
 * "promote" and "demote" mean.
 *
 *   Promote  = attach to the GRANDPARENT (one outline level shallower).
 *   Demote   = attach under the PREVIOUS SIBLING (one level deeper).
 *   Move under = attach under any chosen node that isn't a descendant.
 */

/** The relationship type to keep when only the parent changes. */
export function keepType(doc: KrDocument, nodeId: string): SyntacticRole {
  return parentRelations(doc.syntax, nodeId)[0]?.type ?? 'adjunct';
}

/** Lowest surface index anywhere in a node's subtree (Greek/free word order). */
export function subtreeOrder(doc: KrDocument, nodeId: string): number {
  const idx = new Map(doc.tokens.map((t) => [t.id, t.index]));
  const seen = new Set<string>();
  const visit = (id: string): number => {
    if (seen.has(id)) return Infinity;
    seen.add(id);
    const n = getNode(doc.syntax, id);
    if (!n) return Infinity;
    const own = n.tokenIds.length ? Math.min(...n.tokenIds.map((t) => idx.get(t) ?? Infinity)) : Infinity;
    const kids = childRelations(doc.syntax, id).map((r) => visit(r.dependentId));
    return Math.min(own, ...kids);
  };
  return visit(nodeId);
}

/** The grandparent head id (one level up), if any. */
export function grandparentId(doc: KrDocument, nodeId: string): string | undefined {
  const parent = parentRelations(doc.syntax, nodeId)[0];
  if (!parent) return undefined;
  return parentRelations(doc.syntax, parent.headId)[0]?.headId;
}

/** The previous sibling (under the same parent, earlier in surface order). */
export function previousSiblingId(doc: KrDocument, nodeId: string): string | undefined {
  const parent = parentRelations(doc.syntax, nodeId)[0];
  if (!parent) return undefined;
  const mine = subtreeOrder(doc, nodeId);
  return childRelations(doc.syntax, parent.headId)
    .map((r) => r.dependentId)
    .filter((id) => id !== nodeId)
    .map((id) => ({ id, o: subtreeOrder(doc, id) }))
    .filter((s) => s.o < mine)
    .sort((a, b) => b.o - a.o)[0]?.id;
}

/** Nodes a block may be moved under (excludes itself, its descendants, parent). */
export function moveTargets(doc: KrDocument, nodeId: string): SelectableNode[] {
  const parent = parentRelations(doc.syntax, nodeId)[0];
  const banned = new Set([nodeId, ...descendantIds(doc.syntax, nodeId)]);
  return selectableNodes(doc).filter((n) => !banned.has(n.id) && n.id !== parent?.headId);
}

export function canPromote(doc: KrDocument, nodeId: string): boolean {
  return nodeId !== doc.syntax.rootId && Boolean(grandparentId(doc, nodeId));
}

export function canDemote(doc: KrDocument, nodeId: string): boolean {
  return nodeId !== doc.syntax.rootId && Boolean(previousSiblingId(doc, nodeId));
}

export interface MovePreview {
  /** Whether the drop may commit. */
  ok: boolean;
  /** The candidate document with the move applied (when structurally legal). */
  doc?: KrDocument;
  /** Human-readable refusal ("can't nest a block inside itself", …). */
  reason?: string;
  /** A legal drop that would change nothing (already under this head). */
  noop?: boolean;
  changedNodeIds: string[];
  changedRelationIds: string[];
  oldHeadId?: string;
  newHeadId?: string;
}

/**
 * PREVIEW the effect of `moveNodeUnder(nodeId → headId)` WITHOUT touching the
 * store or the document: applies the exact same pure transformation the drop
 * would commit (`reattachNode`, shared with the store's `attachNodeTo`) to a
 * candidate document and sanity-checks it, so the drag UI can show a live
 * reparent preview and flag conflicts in red BEFORE anything is committed.
 *
 * Conflicts detected: self-drop, descendant drop (a cycle), missing nodes, and
 * a candidate whose outline or Kellogg-Reed layout THROWS (an unrenderable
 * graph must never be committed from a drag). This is lightweight UI
 * validation, not a theorem prover — exotic-but-renderable reparentings are
 * deliberately allowed.
 */
export function previewMoveNodeUnder(
  doc: KrDocument,
  nodeId: string,
  headId: string,
): MovePreview {
  const none: Omit<MovePreview, 'ok'> = { changedNodeIds: [], changedRelationIds: [] };
  if (!getNode(doc.syntax, nodeId) || !getNode(doc.syntax, headId)) {
    return { ok: false, reason: 'That block no longer exists.', ...none };
  }
  if (nodeId === doc.syntax.rootId) {
    return { ok: false, reason: 'The whole passage can’t be moved.', ...none };
  }
  if (nodeId === headId) {
    return { ok: false, reason: 'A block can’t be nested inside itself.', ...none };
  }
  if (descendantIds(doc.syntax, nodeId).includes(headId)) {
    return {
      ok: false,
      reason: 'A block can’t be nested inside one of its own parts.',
      ...none,
    };
  }
  const oldHeadId = parentRelations(doc.syntax, nodeId)[0]?.headId;
  if (oldHeadId === headId) {
    return { ok: true, noop: true, doc, oldHeadId, newHeadId: headId, ...none };
  }

  const syntax = reattachNode(doc.syntax, nodeId, headId, keepType(doc, nodeId));
  const candidate: KrDocument = { ...doc, syntax };

  // The candidate must still OUTLINE (the workbench view) and LAY OUT (the KR
  // engine walks the whole graph) without throwing — a cheap end-to-end "will
  // this render" probe. Failures show as a red conflict, never a crash.
  try {
    buildOutline(candidate);
    layoutForMode('kellogg-reed', candidate, candidate.layoutHints);
  } catch {
    return {
      ok: false,
      reason: 'That arrangement can’t be drawn — try a different block.',
      ...none,
      oldHeadId,
      newHeadId: headId,
    };
  }

  // What changed, for highlight styling: diff the relation lists by value.
  const before = new Map(doc.syntax.relations.map((r) => [r.id, r]));
  const changedRelationIds = candidate.syntax.relations
    .filter((r) => before.get(r.id) !== r)
    .map((r) => r.id);
  const changedNodeIds = [
    nodeId,
    ...(oldHeadId ? [oldHeadId] : []),
    headId,
    // Any node whose incoming relation moved (e.g. a swapped-out subject).
    ...candidate.syntax.relations
      .filter((r) => before.get(r.id) !== r)
      .map((r) => r.dependentId),
  ];
  return {
    ok: true,
    doc: candidate,
    changedNodeIds: [...new Set(changedNodeIds)],
    changedRelationIds,
    oldHeadId,
    newHeadId: headId,
  };
}
