import { LAYOUT } from '../constants';
import type { DiagramElement, LineElement } from '../types';
import { blockAscent } from './geometry';
import { eid, line, translate } from './primitives';
import type { Ctx } from './types';

/**
 * INFINITIVE drawing — the empty diagonal down to the infinitive\'s own
 * baseline, and Leedy\'s double-stroke infinitive mark. (The coordinated
 * infinitive FORK moves here in a later stage — see docs/kr-refactor-status.md.)
 */
/**
 * Draw a dependent INFINITIVE phrase hanging from `attachX`: an empty diagonal
 * down to the infinitive's own horizontal baseline (the prepositional-phrase
 * shape, minus the preposition). Returns the rightmost x reached and the bottom.
 */
export function drawInfinitive(
  ctx: Ctx,
  rel: { id: string; dependentId: string },
  attachX: number,
  topY: number,
  seen: Set<string>,
  out: DiagramElement[],
): { right: number; bottom: number } {
  const block = ctx.layoutNode(ctx, rel.dependentId, seen);
  const oTop = topY + blockAscent(block);
  const objX = attachX + LAYOUT.diagRun;
  const endX = objX + block.wordLeft;
  out.push(...translate(block, objX, oTop));
  out.push(line(eid(), attachX, 0, endX, oTop, 'solid', 'slant', undefined, rel.id));
  return { right: objX + block.width, bottom: oTop + block.height };
}

/**
 * Leedy's double-vertical mark identifying an infinitive: two short strokes
 * crossing the infinitive's own baseline near its left end and reaching a little
 * below it. `wordW` is the infinitive word's baseline width.
 */
export function infinitiveMark(wordW: number): LineElement[] {
  const x = Math.min(8, wordW / 4);
  const up = -8;
  const down = 12;
  return [
    line(eid(), x, up, x, down, 'solid', 'separator'),
    line(eid(), x + 4, up, x + 4, down, 'solid', 'separator'),
  ];
}
