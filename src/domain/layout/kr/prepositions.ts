import { childRelations, getNode, nodeText } from '@/domain/model';
import { LAYOUT } from '../constants';
import { measureText } from '../measure';
import type { DiagramElement } from '../types';
import {
  ppConjunctRels,
  prepObjectOf,
  subtreeMinIndex,
  wordConjunctRels,
} from './classify';
import { coordinatorMarks, coordinatorTexts, reserveJoinSpans } from './coordinators';
import { SLANT_ANGLE, blockAscent, diagonalDepth, diagonalText, pedestalRoom, slantRun } from './geometry';
import { eid, line, smallText, translate } from './primitives';
import type { Ctx } from './types';

/**
 * PREPOSITIONAL PHRASE drawing — the preposition written on the slant, its
 * object on a baseline below, coordinated objects sharing one preposition,
 * and side-by-side coordinated PPs bridged by the dashed coordinator bar.
 */
/**
 * Draw ONE prepositional phrase hanging from (`attachX`, 0): the preposition
 * written along a standard-angle slant down to its object's own horizontal
 * baseline. A BARE conjunct on the preposition node (one with no preposition of
 * its own — "in heaven and earth" as one shared preposition) is a coordinated
 * OBJECT: each further object forks off the slant's foot onto its own baseline
 * below, the coordinator riding the dashed bar between them. Returns the
 * rightmost x reached, the lowest y, and the slant's bottom (`oTop`, the head
 * object's baseline) so callers can align a coordinator bar.
 */
export function drawPp(
  ctx: Ctx,
  prepNodeId: string,
  objId: string,
  relId: string,
  attachX: number,
  topY: number,
  seen: Set<string>,
  out: DiagramElement[],
): { right: number; bottom: number; oTop: number } {
  const block = ctx.layoutNode(ctx, objId, seen);
  const prep = nodeText(ctx.doc, getNode(ctx.doc.syntax, prepNodeId)!) || '';
  // The preposition rides the slant, so the slant must be long enough to carry it
  // without the text overhanging the ends onto neighbouring rows — a real problem
  // for long English glosses ("according to", "the [One who]"). Lengthen the drop
  // to fit the text when needed; a short Greek preposition keeps the old geometry.
  // Also drop by the object's ascent so a COORDINATED object (whose upper conjunct
  // rises above its baseline) doesn't land back on the head line.
  const textDrop = (measureText(prep) + LAYOUT.fontSize) * Math.sin(SLANT_ANGLE);
  const oTop = Math.max(topY + blockAscent(block), textDrop);
  const endX = attachX + slantRun(oTop);
  const objX = endX - block.wordLeft;
  out.push(...translate(block, objX, oTop));
  out.push(line(eid(), attachX, 0, endX, oTop, 'solid', 'slant', undefined, relId));
  out.push(diagonalText(prep, attachX, 0, endX, oTop, relId, prepNodeId));
  let right = objX + block.width;
  let bottom = Math.max(oTop + block.height, diagonalDepth(attachX, 0, endX, oTop, prep));

  // Bare-noun conjuncts on the preposition node: coordinated objects sharing the
  // one preposition. (A conjunct carrying its OWN preposition is a coordinate PP
  // and is drawn by drawPpCoordination instead — see `ppConjunctRels`.)
  const bareConjRels = wordConjunctRels(ctx, prepNodeId)
    .filter((r) => !prepObjectOf(ctx, r.dependentId))
    .sort((a, b) => subtreeMinIndex(ctx, a.dependentId) - subtreeMinIndex(ctx, b.dependentId));
  if (bareConjRels.length) {
    // The prep node's own coordinators join this object fork — unless the node
    // is itself a member of a PP-level coordination, whose joins consume them.
    // A coordinator parsed onto a conjunct is hoisted, as everywhere else.
    const coords = [
      ...(ppConjunctRels(ctx, prepNodeId).length ? [] : coordinatorTexts(ctx, prepNodeId)),
      ...bareConjRels.flatMap((r) => coordinatorTexts(ctx, r.dependentId)),
    ];
    const others = bareConjRels.map((r) => ({ rel: r, block: ctx.layoutNode(ctx, r.dependentId, seen) }));
    // Stack the object baselines below the head object, reserving each member's
    // own depth plus the join's coordinator room — the same spacing rule the
    // word-coordination fork applies.
    const joinSpan = reserveJoinSpans(coords, others.length + 1, false);
    const baselines = [oTop];
    let y = oTop;
    let prev = block;
    others.forEach(({ block: mb }, i) => {
      const base =
        prev.height + LAYOUT.coordMemberGap * ctx.vScale + LAYOUT.dividerUp + pedestalRoom(mb);
      y += Math.max(base, joinSpan[i] ?? 0);
      baselines.push(y);
      prev = mb;
    });
    // Junction at the slant's foot: the head object's baseline runs on from it;
    // each further object hangs off a prong, all tied by the dashed bar at the
    // corner column (the shape the infinitive fork draws).
    const prong = LAYOUT.coordProngRun;
    others.forEach(({ rel, block: mb }, i) => {
      const by = baselines[i + 1]!;
      out.push(...translate(mb, endX + prong, by));
      out.push(line(eid(), endX, oTop, endX + prong + mb.wordLeft, by, 'solid', 'coordination', undefined, rel.id));
      right = Math.max(right, endX + prong + mb.width);
      bottom = Math.max(bottom, by + mb.height);
    });
    out.push(line(eid(), endX + prong, oTop, endX + prong, baselines[baselines.length - 1]!, 'dashed', 'coordination', prepNodeId));
    // A single conjunction rests its baseline ON the bar, glyphs extending into
    // the open side to the RIGHT (coordinatorMarks rotates it +90 to read
    // top-to-bottom); multiple marks keep the legacy offset just right of it.
    out.push(...coordinatorMarks(coords, baselines, coords.length === 1 ? endX + prong : endX + prong + 9, 'right'));
  }

  return { right, bottom, oTop };
}

/**
 * Draw a COORDINATION of prepositional phrases hanging from (`attachX`, 0) —
 * "ἐν τοῖς οὐρανοῖς καὶ ἐπὶ τῆς γῆς". Each conjunct PP is drawn like a lone PP
 * (preposition on its slant, object on a baseline below), set side by side, and
 * the first two slants are bridged by a dashed coordinator bar carrying the
 * conjunction (καί) — the Kellogg-Reed mark that the phrases are coordinate, not
 * nested. Without this the engine's PP fast-path would draw only the head PP's
 * object and silently drop the conjunct phrases.
 */
export function drawPpCoordination(
  ctx: Ctx,
  headRel: { id: string; dependentId: string },
  headObjId: string,
  conjRels: { id: string; dependentId: string }[],
  attachX: number,
  topY: number,
  seen: Set<string>,
  out: DiagramElement[],
): { right: number; bottom: number; footRight: number } {
  const headId = headRel.dependentId;
  // The preposition's OWN surface position, so members lay out left-to-right in
  // reading order (a coordinator child, e.g. a leading negator, must not drag the
  // head's ordering index below its own preposition).
  const prepIdx = (id: string): number => {
    const n = getNode(ctx.doc.syntax, id);
    const t = n?.tokenIds.length ? ctx.doc.tokens.find((x) => x.id === n.tokenIds[0]) : undefined;
    return t ? t.index : Infinity;
  };
  const members = [
    { prepNodeId: headId, objId: headObjId, relId: headRel.id },
    ...conjRels.map((r) => ({
      prepNodeId: r.dependentId,
      objId: prepObjectOf(ctx, r.dependentId)!,
      relId: r.id,
    })),
  ].sort((a, b) => prepIdx(a.prepNodeId) - prepIdx(b.prepNodeId));

  let cursor = attachX;
  let right = attachX;
  let bottom = topY;
  const slants: { x: number; oTop: number }[] = [];
  for (const m of members) {
    const ext = drawPp(ctx, m.prepNodeId, m.objId, m.relId, cursor, topY, seen, out);
    slants.push({ x: cursor, oTop: ext.oTop });
    right = Math.max(right, ext.right);
    bottom = Math.max(bottom, ext.bottom);
    cursor = ext.right + LAYOUT.dependentGap;
  }

  // Connectors (owned by the head): a conjunction BETWEEN two members rides the
  // dashed bar of that join; a connector BEFORE the first member — a negator like
  // οὐκ in "οὐκ ἀπ’ ἀνθρώπων … ἀλλὰ διὰ …" — leads the whole construction on the
  // first slant. Ordered by surface position so each maps to the right join.
  const firstIdx = prepIdx(members[0]!.prepNodeId);
  const coords = childRelations(ctx.doc.syntax, headId)
    .filter((r) => r.type === 'coordinator')
    .map((r) => ({
      id: r.id,
      idx: subtreeMinIndex(ctx, r.dependentId),
      text: nodeText(ctx.doc, getNode(ctx.doc.syntax, r.dependentId)!) || '',
    }))
    .filter((c) => c.text)
    .sort((a, b) => a.idx - b.idx);
  const between = coords.filter((c) => c.idx > firstIdx);
  const lead = coords.filter((c) => c.idx < firstIdx);

  // One dashed bar per join, partway down where both slants are still above
  // their object baselines; the join's conjunction rides it. Fewer conjunctions
  // than joins map to the LAST joins ("A, B and C" puts the lone conjunction in
  // the final gap) — the same convention `coordinatorMarks` uses.
  const joins = slants.length - 1;
  between.forEach((c, k) => {
    const i = Math.max(0, Math.min(joins - 1, joins - between.length + k));
    const d = Math.min(slants[i]!.oTop, slants[i + 1]!.oTop) * 0.55;
    const x0 = slants[i]!.x + slantRun(d);
    const x1 = slants[i + 1]!.x + slantRun(d);
    out.push(line(eid(), x0, d, x1, d, 'dashed', 'coordination', headId));
    out.push(smallText(eid(), (x0 + x1) / 2, d - 4, c.text, 'middle', c.id));
  });

  // A leading negator (οὐκ / μή) rides the top of the first member's slant.
  if (lead.length) {
    const d = Math.min(slants[0]!.oTop * 0.3, 22);
    const x = slants[0]!.x + slantRun(d);
    out.push(smallText(eid(), x - 3, d, lead.map((c) => c.text).join(' '), 'end', lead[0]!.id));
  }
  // The rightmost x where a member's slant actually meets the baseline (y = 0).
  // Each conjunct PP's slant hangs from its own foot, spread rightward along the
  // line, so a caller that only extended the baseline to the FIRST foot would
  // leave the later slants floating (Col 1:16 "δι' αὐτοῦ καὶ εἰς αὐτόν").
  const footRight = Math.max(attachX, ...slants.map((s) => s.x));
  return { right, bottom, footRight };
}
