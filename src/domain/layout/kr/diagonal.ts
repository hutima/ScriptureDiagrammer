import { childRelations, getNode, nodeText } from '@/domain/model';
import { LAYOUT } from '../constants';
import type { DiagramElement } from '../types';
import type { SyntaxNode } from '@/domain/schema';
import { measureText } from '../measure';
import { wordConjunctRels, wordTone } from './classify';
import { DEG, DIAG_TEXT_FRAC, diagLeafGeom, diagonalDepth, diagonalText } from './geometry';
import { eid, line, smallText } from './primitives';
import type { Ctx } from './types';

/**
 * DIAGONAL MODIFIER drawing — the slanted line beneath a head carrying a
 * closed-class leaf (article, adverb, short adjective), its sub-modifier
 * chain, and the parallel-slant coordination of such modifiers.
 */
/**
 * Draw a diagonal modifier and, recursively, its own diagonal modifiers as
 * further slants hanging off its word. Returns the geometry's lowest/rightmost
 * extent so the caller can reserve room. Lines/text are pushed into `out`.
 */
export function drawDiagonalModifier(
  ctx: Ctx,
  node: SyntaxNode,
  attachX: number,
  attachY: number,
  relId: string | undefined,
  out: DiagramElement[],
): { bottom: number; right: number } {
  const t = nodeText(ctx.doc, node) || node.label || '';
  const { run, drop } = diagLeafGeom(t);
  const endX = attachX + run;
  const endY = attachY + drop;
  out.push(line(eid(), attachX, attachY, endX, endY, 'solid', 'slant', undefined, relId));
  out.push(diagonalText(t, attachX, attachY, endX, endY, relId, node.id, DIAG_TEXT_FRAC, wordTone(ctx, node)));
  let bottom = diagonalDepth(attachX, attachY, endX, endY, t, DIAG_TEXT_FRAC);
  let right = endX + measureText(t) * 0.6;
  // Sub-modifiers hang off the word: a short right-angle jog off the parent slant
  // and then a parallel slant of the same angle, so each qualifier reads as its
  // own line ("very" under "friendly") rather than one long collinear streak.
  let cx = endX;
  for (const r of childRelations(ctx.doc.syntax, node.id)) {
    // Conjunct/coordinator children belong to the coordination drawing, not to
    // this word's own sub-modifier stack.
    if (r.type === 'conjunct' || r.type === 'coordinator') continue;
    const child = getNode(ctx.doc.syntax, r.dependentId);
    if (!child) continue;
    const jog = LAYOUT.diagRun * 0.5;
    out.push(line(eid(), cx, endY, cx + jog, endY, 'solid', 'slant', undefined, r.id));
    const sub = drawDiagonalModifier(ctx, child, cx + jog, endY, r.id, out);
    bottom = Math.max(bottom, sub.bottom);
    right = Math.max(right, sub.right);
    cx = cx + jog + LAYOUT.dependentGap;
  }
  return { bottom, right };
}

/** Draw a coordination of adjective/adverb modifiers as parallel slants. */
export function drawDiagonalCoordination(
  ctx: Ctx,
  nodeId: string,
  attachX: number,
  out: DiagramElement[],
): { bottom: number; right: number; footRight: number } {
  const node = getNode(ctx.doc.syntax, nodeId)!;
  const conjunctRels = wordConjunctRels(ctx, nodeId);
  const coordRel = childRelations(ctx.doc.syntax, nodeId).find((r) => r.type === 'coordinator');
  const coordText = coordRel
    ? nodeText(ctx.doc, getNode(ctx.doc.syntax, coordRel.dependentId)!) || ''
    : '';
  const members = [node, ...conjunctRels.map((r) => getNode(ctx.doc.syntax, r.dependentId)!)];

  let bottom = 0;
  let right = attachX;
  const starts: number[] = [];
  let cx = attachX;
  for (const m of members) {
    starts.push(cx);
    const ext = drawDiagonalModifier(ctx, m, cx, 0, undefined, out);
    bottom = Math.max(bottom, ext.bottom);
    right = Math.max(right, ext.right);
    // Start the next parallel slant past THIS member's full extent (its slanted
    // word plus any sub-modifiers), not a fixed step — otherwise a longer member
    // (μᾶλλον καὶ μᾶλλον, ἔτι μᾶλλον) overlaps the next slant. Keep a small floor.
    cx = Math.max(ext.right + 6, cx + LAYOUT.dependentGap * 1.4);
  }
  // The dashed coordinator bar bridges the first two parallel slants midway down,
  // the conjunction (and / καί) riding it between them.
  if (coordText && starts.length >= 2) {
    const angle = 57 / DEG;
    const d = diagLeafGeom('x').drop * 0.5;
    const dx = d / Math.tan(angle);
    const x0 = starts[0]! + dx;
    const x1 = starts[1]! + dx;
    out.push(line(eid(), x0, d, x1, d, 'dashed', 'coordination', node.id));
    out.push(smallText(eid(), (x0 + x1) / 2, d - 4, coordText, 'middle', coordRel?.id));
  }
  // The rightmost x where a parallel slant meets the baseline (y = 0); the members
  // fan rightward from `attachX`, so a caller must extend its baseline this far or
  // the later slants hang from empty space.
  const footRight = Math.max(attachX, ...starts);
  return { bottom, right, footRight };
}
