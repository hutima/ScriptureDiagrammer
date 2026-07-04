import type { KrDocument, GuidedStep } from '@/domain/schema';
import type { DiagramLayout } from '@/domain/layout';
import { measureText } from '@/domain/layout';

/**
 * Guided-mode focus & highlight helpers — PURE functions over the syntax
 * document and the laid-out diagram, shared by the canvas (pan/zoom + swashes)
 * and tests. Guides address STABLE ids (token/node/relation); these helpers
 * translate them into layout-space geometry via the `nodeId`/`relationId`
 * stamps the layout engine puts on its primitives. Missing ids are simply
 * skipped (a user patch may have removed a node), never an error.
 */

/** The step's focus, resolved to node + relation id sets (tokens → nodes). */
export function resolveFocusIds(
  doc: KrDocument,
  step: GuidedStep,
): { nodeIds: Set<string>; relationIds: Set<string> } {
  const nodeIds = new Set(step.focus.nodeIds ?? []);
  const relationIds = new Set(step.focus.relationIds ?? []);
  const tokenIds = new Set(step.focus.tokenIds ?? []);
  if (tokenIds.size) {
    for (const n of doc.syntax.nodes) {
      if (n.tokenIds.some((t) => tokenIds.has(t))) nodeIds.add(n.id);
    }
  }
  return { nodeIds, relationIds };
}

export interface FocusBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Layout-space bounding box of every primitive stamped with one of the given
 * ids. Text extents are approximated from `measureText` around the anchor —
 * the same measurement the layout used, so the box is never wildly off.
 * Returns null when nothing matches (the canvas then leaves the view alone).
 */
export function focusBounds(
  layout: DiagramLayout,
  nodeIds: ReadonlySet<string>,
  relationIds: ReadonlySet<string>,
): FocusBounds | null {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  const grow = (ax: number, ay: number, bx: number, by: number) => {
    x1 = Math.min(x1, ax, bx);
    y1 = Math.min(y1, ay, by);
    x2 = Math.max(x2, ax, bx);
    y2 = Math.max(y2, ay, by);
  };
  for (const el of layout.elements) {
    const hit =
      (el.nodeId != null && nodeIds.has(el.nodeId)) ||
      (el.relationId != null && relationIds.has(el.relationId));
    if (!hit) continue;
    if (el.kind === 'line') {
      grow(el.x1, el.y1, el.x2, el.y2);
    } else if (el.kind === 'text') {
      const w = measureText(el.text);
      const left = el.anchor === 'middle' ? el.x - w / 2 : el.anchor === 'end' ? el.x - w : el.x;
      grow(left, el.y - 16, left + w, el.y + 5);
    }
  }
  return Number.isFinite(x1) ? { x1, y1, x2, y2 } : null;
}

/**
 * Guided highlight colors. The task's diff convention for guided steps:
 * added = blue, changed = yellow, removed = red, plus a neutral emphasis.
 * Pastels sit behind the glyphs as swashes (like sermon highlights), and the
 * step card shows a text legend so color is never the only signal.
 */
export const GUIDED_HIGHLIGHT_COLORS = {
  emphasized: '#c4b5fd', // violet — "look here"
  added: '#93c5fd', // blue
  changed: '#fde047', // yellow
  removed: '#fca5a5', // red
} as const;
export type GuidedHighlightKind = keyof typeof GUIDED_HIGHLIGHT_COLORS;

/**
 * Node/relation → color maps for the current step, merged from the step's
 * explicit highlights plus its focus targets (focused elements read as
 * emphasized unless the step gives them a diff color).
 */
export function guidedHighlightMaps(
  doc: KrDocument,
  step: GuidedStep,
): { nodeFills: Map<string, string>; relationFills: Map<string, string> } {
  const nodeFills = new Map<string, string>();
  const relationFills = new Map<string, string>();
  const { nodeIds, relationIds } = resolveFocusIds(doc, step);
  for (const id of nodeIds) nodeFills.set(id, GUIDED_HIGHLIGHT_COLORS.emphasized);
  for (const id of relationIds) relationFills.set(id, GUIDED_HIGHLIGHT_COLORS.emphasized);
  const h = step.highlights;
  if (h) {
    for (const id of h.emphasizedNodeIds ?? []) nodeFills.set(id, GUIDED_HIGHLIGHT_COLORS.emphasized);
    for (const id of h.addedNodeIds ?? []) nodeFills.set(id, GUIDED_HIGHLIGHT_COLORS.added);
    for (const id of h.changedNodeIds ?? []) nodeFills.set(id, GUIDED_HIGHLIGHT_COLORS.changed);
    for (const id of h.removedNodeIds ?? []) nodeFills.set(id, GUIDED_HIGHLIGHT_COLORS.removed);
    for (const id of h.relationIds ?? []) relationFills.set(id, GUIDED_HIGHLIGHT_COLORS.emphasized);
  }
  return { nodeFills, relationFills };
}

/** Which highlight kinds a step actually uses (drives the legend). */
export function usedHighlightKinds(step: GuidedStep): GuidedHighlightKind[] {
  const kinds: GuidedHighlightKind[] = [];
  const h = step.highlights;
  const hasFocus =
    (step.focus.nodeIds?.length ?? 0) +
      (step.focus.tokenIds?.length ?? 0) +
      (step.focus.relationIds?.length ?? 0) >
    0;
  if (hasFocus || h?.emphasizedNodeIds?.length || h?.relationIds?.length) kinds.push('emphasized');
  if (h?.addedNodeIds?.length) kinds.push('added');
  if (h?.changedNodeIds?.length) kinds.push('changed');
  if (h?.removedNodeIds?.length) kinds.push('removed');
  return kinds;
}
