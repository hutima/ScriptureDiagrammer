import type { SyntacticRole, SyntaxNode } from '@/domain/schema';
import { getNode } from '@/domain/model';
import { LAYOUT } from '../constants';
import type { DiagramElement } from '../types';
import { isClauseChild } from './classify';
import { blockAscent } from './geometry';
import { eid, smallText, translate } from './primitives';
import type { Block, Ctx } from './types';

/**
 * DISCOURSE STACKING — several loaded passages drawn as one canvas: each
 * sentence diagram laid out independently and stacked down the page.
 */
/**
 * A discourse container: several independent sentences shown one above another,
 * each its own full diagram with its verse reference floated above it. The
 * sentences are NOT connected — this is a reading aid, a passage on one canvas.
 */
export function layoutDiscourse(
  ctx: Ctx,
  _clause: SyntaxNode,
  seen: Set<string>,
  rels: { id: string; type: SyntacticRole; dependentId: string }[],
): Block {
  const memberRels = rels.filter((r) => isClauseChild(ctx, r.dependentId));
  const elements: DiagramElement[] = [];
  let cursorTop = 0;
  let right = 0;
  let bottom = 0;

  for (const r of memberRels) {
    const node = getNode(ctx.doc.syntax, r.dependentId);
    const block = ctx.layoutNode(ctx, r.dependentId, seen);
    const ascent = blockAscent(block);
    const labelGap = LAYOUT.fontSize + 6;
    const y = cursorTop + ascent + labelGap;
    if (node?.label) {
      elements.push(smallText(eid(), 0, y - ascent - 8, node.label, 'start', undefined));
    }
    elements.push(...translate(block, 0, y));
    right = Math.max(right, block.width);
    bottom = Math.max(bottom, y + block.height);
    cursorTop = y + block.height + LAYOUT.clauseStackGap * 2.4 * ctx.vScale;
  }

  return { width: right, height: bottom, elements, wordLeft: 0, wordRight: right };
}

// --- a coordinated set of words (the two-prong fork) --------------------------
