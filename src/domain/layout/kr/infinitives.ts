import type { Relation, SyntaxNode } from '@/domain/schema';
import { childRelations, getNode, nodeText } from '@/domain/model';
import { LAYOUT } from '../constants';
import type { DiagramElement, LineElement } from '../types';
import { isHeadlessCoordinateClause, isInfinitival, subtreeMinIndex } from './classify';
import { coordinatorMarks, reserveJoinSpans } from './coordinators';
import { blockAscent } from './geometry';
import { eid, line, translate } from './primitives';
import type { Block, Ctx } from './types';

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

/**
 * Flatten a coordinate clause whose members are all INFINITIVES into a single
 * fork: gather every leaf infinitival member (descending through nested
 * coordinate wrappers — "(A οὐδέ B) ἀλλά C" becomes one three-arm fork), every
 * coordinator, and any lead words (a negator/particle), in surface order.
 * Returns null the moment a member is NOT an infinitive — a coordination of
 * finite clauses stays a compound-sentence spine.
 */
function collectInfinitiveFork(
  ctx: Ctx,
  clauseId: string,
): { members: string[]; coords: { text: string; nodeId: string }[]; leadRels: Relation[] } | null {
  const members: { id: string; idx: number }[] = [];
  const coords: { text: string; nodeId: string; idx: number }[] = [];
  const leadRels: Relation[] = [];
  let ok = true;
  const visit = (nodeId: string) => {
    for (const r of childRelations(ctx.doc.syntax, nodeId)) {
      if (!ok) return;
      if (r.type === 'coordinator') {
        const text = nodeText(ctx.doc, getNode(ctx.doc.syntax, r.dependentId)!) || '';
        if (text) coords.push({ text, nodeId: r.dependentId, idx: subtreeMinIndex(ctx, r.dependentId) });
      } else if (r.type === 'conjunct') {
        if (isHeadlessCoordinateClause(ctx, r.dependentId)) visit(r.dependentId);
        else if (isInfinitival(ctx, r.dependentId))
          members.push({ id: r.dependentId, idx: subtreeMinIndex(ctx, r.dependentId) });
        else ok = false; // a non-infinitive member → not a fork
      } else {
        leadRels.push(r);
      }
    }
  };
  visit(clauseId);
  if (!ok || members.length < 2) return null;
  members.sort((a, b) => a.idx - b.idx);
  coords.sort((a, b) => a.idx - b.idx);
  // Lead words read left-to-right as written, like the spine's lead stub.
  leadRels.sort((a, b) => subtreeMinIndex(ctx, a.dependentId) - subtreeMinIndex(ctx, b.dependentId));
  return {
    members: members.map((m) => m.id),
    coords: coords.map((c) => ({ text: c.text, nodeId: c.nodeId })),
    leadRels,
  };
}

/** A member tall/heavy enough that a fork would be cramped — fall back to the spine. */
const FORK_MEMBER_MAX = 190;

/**
 * Draw a coordination of INFINITIVES as a Reed-Kellogg fork: each infinitive on
 * its own baseline arm fanning right from a single junction, the coordinators
 * riding the dashed bar in the gaps between arms ("διδάσκειν οὐδὲ αὐθεντεῖν ἀλλ'
 * εἶναι"). This is the standard shape for a compound infinitive object; a
 * word-coordination of infinitives already renders this way, and this brings the
 * Lowfat converter's nested coordinate-clause encoding to the same picture.
 * Returns null when a member is too heavy to fork cleanly, so the caller falls
 * back to the vertical spine.
 */
export function layoutInfinitiveFork(ctx: Ctx, clause: SyntaxNode, seen: Set<string>): Block | null {
  const collected = collectInfinitiveFork(ctx, clause.id);
  if (!collected) return null;
  const { members, coords, leadRels } = collected;
  const arms = members.map((id) => ctx.layoutNode(ctx, id, seen));
  if (arms.some((m) => m.height + blockAscent(m) > FORK_MEMBER_MAX)) return null;

  const gap = LAYOUT.coordMemberGap * ctx.vScale + LAYOUT.dividerUp;
  const correlative = coords.length >= 2 && coords.length === arms.length;
  const joinSpan = reserveJoinSpans(coords, arms.length, correlative);
  const baselines: number[] = [];
  let cursorTop = 0;
  arms.forEach((m, i) => {
    const by = cursorTop + blockAscent(m);
    baselines.push(by);
    cursorTop = by + m.height + Math.max(gap, (joinSpan[i] ?? 0) - m.height);
  });
  const centerY = (baselines[0]! + baselines[baselines.length - 1]!) / 2;
  const prong = LAYOUT.coordProngRun;
  const elements: DiagramElement[] = [];
  let width: number = prong;
  arms.forEach((m, i) => {
    const by = baselines[i]! - centerY;
    elements.push(...translate(m, prong, by));
    elements.push(line(eid(), 0, 0, prong + m.wordLeft, by, 'solid', 'coordination')); // junction → arm
    width = Math.max(width, prong + m.width);
  });
  const topY = baselines[0]! - centerY;
  const botY = baselines[baselines.length - 1]! - centerY;
  elements.push(line(eid(), prong, topY, prong, botY, 'dashed', 'coordination', clause.id));
  // A single conjunction rests its baseline ON the bar, glyphs extending into the
  // open wedge to the RIGHT (coordinatorMarks rotates it +90 to read
  // top-to-bottom) — clear of the diagonal prongs converging on the junction to
  // its left; multiple marks keep the legacy offset just right of the bar.
  elements.push(
    ...coordinatorMarks(
      coords,
      baselines.map((b) => b - centerY),
      coords.length === 1 ? prong : prong + 9,
      'right',
    ),
  );

  // Lead words (a negator like οὐκ, an introductory particle) sit above the top
  // arm on a short stub joined down to the top of the bar — the same home the
  // spine gives them.
  if (leadRels.length) {
    const GAPW = 10;
    const blocks = leadRels.map((r) => ctx.layoutNode(ctx, r.dependentId, seen));
    const totalW = blocks.reduce((s, b) => s + b.width, 0) + GAPW * Math.max(0, blocks.length - 1);
    const leadY = topY - LAYOUT.fontSize - 14;
    let x = Math.max(0, prong - GAPW - totalW);
    const leadStart = x;
    for (const b of blocks) {
      elements.push(...translate(b, x, leadY));
      width = Math.max(width, x + b.width);
      x += b.width + GAPW;
    }
    const lineY = leadY + 4;
    elements.push(line(eid(), leadStart, lineY, prong, lineY, 'solid', 'baseline'));
    elements.push(line(eid(), prong, lineY, prong, topY, 'dashed', 'stem'));
  }

  return {
    width,
    height: botY + arms[arms.length - 1]!.height,
    elements,
    // The parent stem connects to the junction (apex) at x = 0; the bar (where an
    // outer coordination would attach) is exposed as verbX.
    wordLeft: 0,
    wordRight: 0,
    verbX: prong,
  };
}
