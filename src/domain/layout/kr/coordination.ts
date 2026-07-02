import type { Relation, SyntaxNode } from '@/domain/schema';
import { childRelations, getNode, nodeText } from '@/domain/model';
import { LAYOUT } from '../constants';
import { measureText } from '../measure';
import type { DiagramElement } from '../types';
import {
  BASELINE_COMPLEMENTS,
  ELISION_MARK,
  isClauseChild,
  isDiagonalCoordination,
  isDiagonalModifier,
  isInfinitival,
  ppConjunctRels,
  prepObjectId,
  subtreeMinIndex,
  wordConjunctRels,
  wordTone,
} from './classify';
import { coordinatorMarks, coordinatorTexts, reserveJoinSpans } from './coordinators';
import { drawDiagonalCoordination, drawDiagonalModifier } from './diagonal';
import { drawInfinitive } from './infinitives';
import { drawPp, drawPpCoordination } from './prepositions';
import { blockAscent, pedestalRoom } from './geometry';
import { eid, line, translate, wordText } from './primitives';
import type { Block, Ctx } from './types';
import { layoutHead } from './word';

/**
 * COORDINATION layout — the word-coordination fork, the compound-predicate
 * fork (shared object vs per-verb arms), and the open predicate fork.
 */
/**
 * Render a word-level coordination ("Paul and Timothy", "overseers and
 * deacons") as the classic Kellogg-Reed fork: the conjuncts sit on parallel
 * horizontal baselines, joined at a single junction by prongs, with the
 * coordinator on a dashed bridge between them.
 *
 * `openLeft` controls which way the fork opens. A compound *subject* attaches
 * to the divider on its right, so its junction is on the right (openLeft);
 * a coordinated object / modifier attaches on its left, so the junction is on
 * the left and the conjuncts fan out to the right.
 */
export function layoutCoordination(
  ctx: Ctx,
  node: SyntaxNode,
  seen: Set<string>,
  openLeft: boolean,
): Block {
  // A coordinated member is USUALLY another word (Paul and Timothy), but a
  // direct object can equally coordinate with a whole CLAUSE — Mark 1:19-20
  // "εἶδεν Ἰάκωβον καὶ Ἰωάνην καὶ αὐτοὺς … καταρτίζοντας" ("he saw James, and
  // John, and them mending the nets"): the third conjunct is the participial
  // clause, not a word. `wordConjunctRels` (used elsewhere to detect/measure
  // WORD coordination specifically) excludes clause dependents, so a bare
  // conjunctRels = wordConjunctRels(...) here would silently DROP that member
  // from the fork instead of drawing it — the member never reaches `layoutNode`
  // at all. Gather clause conjuncts too and merge them in by surface order, so
  // every coordinate member is drawn (`layoutNode` already dispatches a clause
  // dependent to `layoutClause`, returning an ordinary `Block` this fork's
  // generic member-stacking loop handles the same as any word member).
  const wordConjuncts = wordConjunctRels(ctx, node.id);
  const clauseConjuncts = childRelations(ctx.doc.syntax, node.id).filter(
    (r) => r.type === 'conjunct' && isClauseChild(ctx, r.dependentId),
  );
  const conjunctRels = [...wordConjuncts, ...clauseConjuncts].sort(
    (a, b) => subtreeMinIndex(ctx, a.dependentId) - subtreeMinIndex(ctx, b.dependentId),
  );
  // Coordinators of the HEAD, plus any sitting on a CONJUNCT (a parse may attach
  // the ἀλλά of an "οὐ … ἀλλά" pair to the second member rather than the head);
  // gathering both keeps every conjunction on the fork bar instead of leaking one
  // out as a stray modifier slant. Order: head first, then per conjunct — so a
  // correlative pair lines up top-with-top with the members.
  const coords = [
    ...coordinatorTexts(ctx, node.id),
    ...conjunctRels.flatMap((r) => coordinatorTexts(ctx, r.dependentId)),
  ];

  // An apposition on the head node splits two ways by surface order. A SUMMARY
  // apposition of the WHOLE group ("τὰ τρία ταῦτα" summarising πίστις, ἐλπίς,
  // ἀγάπη) FOLLOWS every conjunct, and is hoisted onto a platform off the fork's
  // bar. A HEAD-CONJUNCT apposition ("Ἰησοῦ = Χριστοῦ", i.e. "Jesus Christ")
  // PRECEDES the other members and renames only the first arm, so it must ride
  // INLINE with the head member — not be dropped below the whole fork (which split
  // Ἰησοῦ from Χριστοῦ in Gal 1:1). The boundary is where the other members begin.
  const apposRels = childRelations(ctx.doc.syntax, node.id).filter((r) => r.type === 'apposition');
  const memberStart = Math.min(
    Infinity,
    ...conjunctRels.map((r) => subtreeMinIndex(ctx, r.dependentId)),
    ...coords.map((c) => subtreeMinIndex(ctx, c.nodeId)),
  );
  const summaryApposRels = apposRels.filter((r) => subtreeMinIndex(ctx, r.dependentId) >= memberStart);

  // Member 0 is the head word with its own (non-coordination) modifiers — keeping
  // its inline head-conjunct appositive; the rest are the conjunct subtrees.
  // Only the SUMMARY appositions are excluded (they are drawn on the platform
  // below), so an inline appositive on the head still lays out with its member.
  const members: Block[] = [
    layoutHead(ctx, node, seen, false, true, new Set(summaryApposRels.map((r) => r.id))),
    ...conjunctRels.map((r) => ctx.layoutNode(ctx, r.dependentId, seen)),
  ];

  // Stack the members top-to-bottom, leaving room for each one's own depth AND
  // for the NEXT member's pedestal: a member that raises a tall platform above its
  // baseline (an appositive on a pedestal — e.g. "δοῦλος Χριστοῦ Ἰησοῦ" on
  // Τιμόθεος in Phil 1:1) must drop far enough that its platform/genitives clear
  // the member stacked above it, instead of riding up into it. (Same clearance the
  // stacked-clause spine already applies via `pedestalRoom`.)
  // A CORRELATIVE set (one coordinator per member — μέν…δέ, οὐ…ἀλλά) rides the
  // members' own baselines; otherwise each coordinator marks a JOIN between two
  // members and needs clear vertical room in that gap so a long conjunction (οὐδέ,
  // ἀλλά) never crowds the words above or below it.
  const correlative = coords.length >= 2 && coords.length === members.length;
  const joinSpan = reserveJoinSpans(coords, members.length, correlative);
  const baselines: number[] = [];
  let y = 0;
  members.forEach((m, i) => {
    baselines.push(y);
    if (i < members.length - 1) {
      const base =
        m.height +
        LAYOUT.coordMemberGap * ctx.vScale +
        LAYOUT.dividerUp +
        pedestalRoom(members[i + 1]!);
      y += Math.max(base, joinSpan[i] ?? 0);
    }
  });
  const lastBaseline = baselines[baselines.length - 1]!;
  const centerY = lastBaseline / 2; // junction sits at the vertical middle
  const prong = LAYOUT.coordProngRun;
  const elements: DiagramElement[] = [];

  const lastMember = members[members.length - 1]!;
  const topY = baselines[0]! - centerY;
  const botY = lastBaseline - centerY;

  let width: number;
  let junctionX: number;
  if (openLeft) {
    // Junction on the right; conjuncts extend left. Align by full block width so
    // a member that carries right-cascading modifiers (e.g. an appositive with a
    // genitive) stays inside the fork instead of overflowing past the junction.
    const maxWidth = Math.max(...members.map((m) => m.width));
    const CLEAR = LAYOUT.wordPadX;
    // Members right-align to `maxWidth` (their content edge). The fork ARMS and the
    // dashed coordinator bar both meet at `attachX`, CLEAR px further right, so the
    // bar never lands flush on a member's content (e.g. the genitive baseline of
    // "δοῦλος Χριστοῦ Ἰησοῦ" on Τιμόθεος in Phil 1:1) AND the bar exactly spans the
    // arm ends instead of overshooting them.
    const attachX = maxWidth + CLEAR;
    junctionX = attachX + prong;
    width = junctionX;
    members.forEach((m, i) => {
      const mx = maxWidth - m.width;
      const by = baselines[i]! - centerY;
      elements.push(...translate(m, mx, by));
      // Arm from the apex down to the bar at attachX (not the content edge).
      elements.push(line(eid(), junctionX, 0, attachX, by, 'solid', 'coordination'));
      // Run the member's baseline across to the bar so the conjunct — even a narrow
      // one right-aligned past its word — connects to its arm.
      elements.push(line(eid(), mx + m.wordRight, by, attachX, by, 'solid', 'baseline'));
    });
  } else {
    // Junction on the left; conjuncts extend right.
    junctionX = 0;
    width = prong + Math.max(...members.map((m) => m.width));
    members.forEach((m, i) => {
      const by = baselines[i]! - centerY;
      elements.push(...translate(m, prong, by));
      elements.push(line(eid(), 0, 0, prong + m.wordLeft, by, 'solid', 'coordination'));
    });
  }

  // The coordinator's dashed line is the full-height bar at the WIDE end of the
  // fork, joining the two prongs exactly where they meet the conjunct baselines
  // (the way a hand-drawn Kellogg-Reed fork bridges the branches). The
  // coordinator rides CENTRED on that bar, rotated upright and set into the open
  // throat of the fork — away from the conjunct words — so it never overlaps them.
  const dashX = openLeft ? junctionX - prong : prong;
  elements.push(line(eid(), dashX, topY, dashX, botY, 'dashed', 'coordination', node.id));
  const coordTx = dashX + (openLeft ? 8 : -8);
  // Correlative pairs ride the members' baselines; every other conjunction rides
  // the visual middle of the gap between the two members it joins.
  elements.push(...coordinatorMarks(coords, baselines.map((b) => b - centerY), coordTx));

  // A summary apposition hangs on its own platform off the bar that joins the
  // conjuncts, centred below the fork ("τὰ τρία ταῦτα" under faith/hope/love).
  // It stays WITHIN the fork's width so the block's connection point (the
  // junction) is unchanged — the parent's subject|predicate divider still
  // attaches at the junction, keeping the fork tied to its verb.
  let bottom = botY + lastMember.height;
  for (const ar of summaryApposRels) {
    const ab = ctx.layoutNode(ctx, ar.dependentId, seen);
    if (!ab.elements.length) continue;
    const platTop = bottom + LAYOUT.adjunctDrop * ctx.vScale;
    const platY = platTop + blockAscent(ab);
    // Where the stem lands depends on the appositive block's OWN connection
    // point. A block that exposes a fork junction / spine bar (wordLeft ===
    // wordRight — e.g. "εἴτε θρόνοι εἴτε κυριότητες" summarising ὁρατά/ἀόρατα in
    // Col 1:16) must be met AT that junction: the word-edge rule below read its
    // 0-valued wordRight as "unset", fell back to the block's full width, and
    // sent the stem past the whole fork into empty space, leaving the sub-fork
    // hanging unattached. A WORD-headed block instead connects on the word's
    // RIGHT EDGE, not its centre: a stem to the centre slants straight THROUGH
    // the word (δοῦλοι Χριστοῦ Ἰησοῦ in Phil 1:1), which the centre rule did
    // both when clamped (a diagonal across the word) and unclamped (a vertical
    // drop down its middle). The baseline already runs on rightward to carry the
    // genitive, so meeting it just past the last glyph reads as a clean pedestal
    // connection and leaves the word fully legible.
    const isJunctionBlock = ab.wordLeft === ab.wordRight;
    const wordEnd = isJunctionBlock ? ab.wordRight : ab.wordRight || ab.width;
    // Centre the CONNECTION POINT under the bar (a junction sits right below it;
    // a word straddles it), clamped to the fork's own width.
    const span = isJunctionBlock ? ab.wordLeft * 2 : ab.wordLeft + wordEnd;
    const baseStart = Math.max(0, Math.min(dashX - span / 2, width - ab.width));
    elements.push(...translate(ab, baseStart, platY));
    const connectX = baseStart + wordEnd;
    elements.push(line(eid(), dashX, botY, connectX, platY, 'solid', 'stem', undefined, ar.id));
    // Mark the connector with the Reed-Kellogg apposition "=" (two short strokes
    // ACROSS the stem) so the renaming reads as APPOSITION, not a generic modifier
    // — the same "=" the inline path draws on the baseline (see `drawEquals`).
    const sdx = connectX - dashX;
    const sdy = platY - botY;
    const slen = Math.hypot(sdx, sdy) || 1;
    const perpX = -sdy / slen; // unit normal to the stem
    const perpY = sdx / slen;
    const alongX = sdx / slen; // unit along the stem
    const alongY = sdy / slen;
    const midX = (dashX + connectX) / 2;
    const midY = (botY + platY) / 2;
    const EQ_HALF = 6; // stroke half-length (matches the inline "=" width)
    const EQ_GAP = 4; // spacing between the two strokes, along the stem
    for (const off of [-EQ_GAP, EQ_GAP]) {
      const cx = midX + alongX * off;
      const cy = midY + alongY * off;
      elements.push(
        line(eid(), cx - perpX * EQ_HALF, cy - perpY * EQ_HALF, cx + perpX * EQ_HALF, cy + perpY * EQ_HALF, 'solid', 'separator', undefined, ar.id),
      );
    }
    bottom = platY + ab.height;
  }

  return {
    width,
    height: bottom,
    elements,
    wordLeft: junctionX,
    wordRight: junctionX,
  };
}

/**
 * A COMPOUND PREDICATE sharing one object ("proofreads and edits her essays"):
 * the baseline forks into the coordinated verbs and rejoins to a single point,
 * after which the shared complement continues on the line. Drawn as a fork with
 * a junction at BOTH ends (unlike layoutCoordination's single junction), so it
 * sits inline on the main baseline between the divider and the object.
 *
 * Returned block: baseline at y = 0 entering at the left junction and leaving at
 * the right junction (wordLeft = 0, wordRight = width); members straddle the line.
 */
/**
 * Whether a compound predicate's CONJUNCT verbs carry their OWN complements. If
 * so each arm must be drawn with its own objects (an open fork — "God exalted
 * HIM and gave HIM the name"), rather than collapsed around one shared object
 * ("proofreads and edits her essays"). The clause must then NOT also draw the
 * head verb's complements (they live in the arms) — see `verbSelfContained`.
 */
export function isPerVerbCompound(ctx: Ctx, verbNode: SyntaxNode): boolean {
  return wordConjunctRels(ctx, verbNode.id).some((r) =>
    childRelations(ctx.doc.syntax, r.dependentId).some(
      (c) => c.type !== 'conjunct' && c.type !== 'coordinator',
    ),
  );
}

/**
 * One arm of a compound predicate: a verb with its OWN baseline complements
 * (direct-object tick / predicate-nominative back-slant) and below-hanging
 * modifiers (indirect object, adverbial, prepositional phrase…), as a block whose
 * baseline sits at y = 0 — no subject, no divider. Lets each forked verb keep its
 * own objects. Mirrors the clause's predicate-side drawing for a single verb.
 */
export function layoutPredicateArm(ctx: Ctx, verbNode: SyntaxNode, seen: Set<string>): Block {
  const elements: DiagramElement[] = [];
  const text = nodeText(ctx.doc, verbNode) || verbNode.label || (verbNode.implied ? ELISION_MARK : '∅');
  const wordW = measureText(text) + LAYOUT.wordPadX * 2;
  elements.push(wordText(eid(), wordW / 2, -LAYOUT.textRise, text, 'middle', verbNode, wordTone(ctx, verbNode)));

  const rels = childRelations(ctx.doc.syntax, verbNode.id).filter(
    (r) => r.type !== 'conjunct' && r.type !== 'coordinator',
  );
  const onBaseline = (r: Relation) => BASELINE_COMPLEMENTS.includes(r.type) && !isClauseChild(ctx, r.dependentId);
  const baselineRels = rels.filter(onBaseline);
  const belowRels = rels.filter((r) => !onBaseline(r));

  // Draw the verb's OWN below-hanging modifiers (adverbs, particles, adverbial
  // PPs) FIRST and record how far right their cascade reaches. The baseline
  // complements then start PAST that band, so a wide adverbial PP hanging under
  // the verb ("assume AMONG THE POWERS OF THE EARTH") can't collide with the
  // direct object and its own modifiers sitting on the baseline to the right
  // ("the SEPARATE AND EQUAL station …"). This mirrors the vModRight handling a
  // full clause already applies; without it a forked infinitive/verb arm laid
  // out here overlaps its object with its adverbial.
  const belowTop = LAYOUT.slantDrop * ctx.vScale;
  let belowMaxBottom = 0;
  let belowRight = wordW;
  // Where the below-modifiers actually MEET the line (their feet), distinct from
  // belowRight, which also counts the full recursive width of their sub-cascades.
  let footRight = wordW;
  let cursor = wordW / 2;
  belowRels.forEach((rel) => {
    cursor += LAYOUT.dependentGap;
    footRight = Math.max(footRight, cursor);
    const objId = prepObjectId(ctx, rel);
    const ppConj = objId ? ppConjunctRels(ctx, rel.dependentId) : [];
    let ext: { right: number; bottom: number };
    if (isInfinitival(ctx, rel.dependentId)) {
      ext = drawInfinitive(ctx, rel, cursor, belowTop, seen, elements);
    } else if (objId && ppConj.length) {
      ext = drawPpCoordination(ctx, rel, objId, ppConj, cursor, belowTop, seen, elements);
    } else if (objId) {
      ext = drawPp(ctx, rel.dependentId, objId, rel.id, cursor, belowTop, seen, elements);
    } else if (rel.type !== 'conjunct' && isDiagonalCoordination(ctx, rel.dependentId)) {
      ext = drawDiagonalCoordination(ctx, rel.dependentId, cursor, elements);
    } else if (isDiagonalModifier(ctx, rel.dependentId)) {
      const node2 = getNode(ctx.doc.syntax, rel.dependentId)!;
      ext = drawDiagonalModifier(ctx, node2, cursor, 0, rel.id, elements);
    } else {
      const block = ctx.layoutNode(ctx, rel.dependentId, seen);
      const oTop = belowTop + blockAscent(block);
      const objX = cursor + LAYOUT.diagRun;
      elements.push(...translate(block, objX, oTop));
      elements.push(line(eid(), cursor, 0, objX + block.wordLeft, oTop, 'solid', 'stem', undefined, rel.id));
      ext = { right: objX + block.width, bottom: oTop + block.height };
    }
    belowMaxBottom = Math.max(belowMaxBottom, ext.bottom);
    cursor = ext.right + LAYOUT.dependentGap;
    belowRight = Math.max(belowRight, ext.right);
  });

  // Baseline complements start past the below-modifier cascade (else they land on
  // top of it); with no such cascade they sit right after the verb word as before.
  let x = baselineRels.length && belowRight > wordW ? belowRight + LAYOUT.dependentGap : wordW;
  let right = Math.max(wordW, belowRight);
  let baseHeight = 0;
  baselineRels.forEach((rel) => {
    const sepX = x;
    if (rel.type === 'predicateNominative' || rel.type === 'predicateAdjective') {
      elements.push(line(eid(), sepX + 10, 0, sepX, -LAYOUT.separatorUp, 'solid', 'separator', undefined, rel.id));
    } else {
      elements.push(line(eid(), sepX, 0, sepX, -LAYOUT.separatorUp, 'solid', 'separator', undefined, rel.id));
    }
    x += 6;
    const block = ctx.layoutNode(ctx, rel.dependentId, seen);
    elements.push(...translate(block, x, 0));
    baseHeight = Math.max(baseHeight, block.height);
    x += block.width;
    right = Math.max(right, x);
  });

  // Draw the baseline out to the complements when there are any (they sit at the
  // right end); otherwise only to the below-modifiers' feet (one row down), so a
  // deep adverbial cascade — a PP that nests the rest of the sentence — does not
  // stretch a near-empty arm baseline across the diagram. `width` still reports the
  // full extent, so the arm reserves its true space.
  const lineRight = baselineRels.length
    ? right
    : Math.min(right, Math.max(wordW, footRight + LAYOUT.diagRun));
  elements.unshift(line(eid(), 0, 0, lineRight, 0, 'solid', 'baseline'));
  return {
    width: right,
    height: Math.max(baseHeight, belowMaxBottom),
    elements,
    wordLeft: 0,
    wordRight: wordW,
    verbX: wordW / 2,
  };
}

/**
 * An OPEN compound-predicate fork: each member verb is a full arm (verb + its own
 * complements), the arms fan out to the right from a single left junction where
 * the subject|predicate divider meets, joined by the dashed coordinator bar. No
 * right rejoin — the arms carry their own objects independently.
 */
export function layoutOpenPredicateFork(
  ctx: Ctx,
  verbNode: SyntaxNode,
  conjunctRels: { dependentId: string }[],
  coords: { text: string; nodeId: string }[],
  seen: Set<string>,
): Block {
  const memberNodes = [verbNode, ...conjunctRels.map((r) => getNode(ctx.doc.syntax, r.dependentId)!)];
  const arms = memberNodes.map((n) => layoutPredicateArm(ctx, n, seen));
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
    elements.push(line(eid(), 0, 0, prong, by, 'solid', 'coordination')); // left prong: junction → arm
    width = Math.max(width, prong + m.width);
  });
  const topY = baselines[0]! - centerY;
  const botY = baselines[baselines.length - 1]! - centerY;
  elements.push(line(eid(), prong, topY, prong, botY, 'dashed', 'coordination', verbNode.id));
  elements.push(...coordinatorMarks(coords, baselines.map((b) => b - centerY), prong - 7));
  return {
    width,
    height: botY + arms[arms.length - 1]!.height,
    elements,
    wordLeft: 0,
    wordRight: 0,
    // The fork's dashed coordinate bar (where the καί rides). When this predicate
    // is a member of an outer coordination, the outer spine attaches HERE — so the
    // outer coordination line runs through the predicate fork's own bar rather
    // than stopping at the divider.
    verbX: prong,
  };
}


export function layoutCompoundPredicate(ctx: Ctx, verbNode: SyntaxNode, seen: Set<string>): Block {
  const conjunctRels = wordConjunctRels(ctx, verbNode.id);
  // Coordinators of the HEAD verb plus any parsed onto a CONJUNCT verb ("ran but
  // walked" often carries the conjunction on the second verb) — hoisted onto the
  // fork bar exactly as layoutCoordination does, since the fork members never
  // draw their own coordinator children (layoutPredicateArm filters them out and
  // a collapsed member drops all children).
  const coords = [
    ...coordinatorTexts(ctx, verbNode.id),
    ...conjunctRels.flatMap((r) => coordinatorTexts(ctx, r.dependentId)),
  ];

  // When the conjunct verbs carry their own objects, draw an open fork of full
  // predicate arms instead of the collapsed shared-object fork below.
  if (isPerVerbCompound(ctx, verbNode)) {
    return layoutOpenPredicateFork(ctx, verbNode, conjunctRels, coords, seen);
  }

  // Bare verb words (their shared complements are drawn by the clause after the
  // fork; per-verb adverbials are uncommon and omitted from the fork members).
  const memberNodes = [verbNode, ...conjunctRels.map((r) => getNode(ctx.doc.syntax, r.dependentId)!)];
  const members = memberNodes.map((n) => layoutHead(ctx, n, seen, true));

  const gap = LAYOUT.coordMemberGap * ctx.vScale + LAYOUT.dividerUp;
  const correlative = coords.length >= 2 && coords.length === members.length;
  const joinSpan = reserveJoinSpans(coords, members.length, correlative);
  const ys: number[] = [];
  let yy = 0;
  members.forEach((m, i) => {
    ys.push(yy);
    if (i < members.length - 1) yy += m.height + Math.max(gap, (joinSpan[i] ?? 0) - m.height);
  });
  const centerY = yy / 2;
  const prong = LAYOUT.coordProngRun;
  const maxW = Math.max(...members.map((m) => m.width));
  const leftX = 0;
  const rightX = prong + maxW + prong;
  const elements: DiagramElement[] = [];

  // Left-align every member and run each baseline to the SAME length (maxW), so
  // the left corners (where each diagonal prong meets its horizontal) line up in
  // one column — the coordinator's dashed bar drops cleanly through them.
  members.forEach((m, i) => {
    const by = ys[i]! - centerY;
    elements.push(...translate(m, prong, by));
    if (m.width < maxW) {
      elements.push(line(eid(), prong + m.width, by, prong + maxW, by, 'solid', 'baseline'));
    }
    elements.push(line(eid(), leftX, 0, prong, by, 'solid', 'coordination')); // left prong
    elements.push(line(eid(), prong + maxW, by, rightX, 0, 'solid', 'coordination')); // right prong
  });

  // Coordinator on the dashed bar joining the left corners, the conjunction
  // riding it in the throat of the fork (just left of the corner column).
  const topY = ys[0]! - centerY;
  const botY = ys[ys.length - 1]! - centerY;
  elements.push(line(eid(), prong, topY, prong, botY, 'dashed', 'coordination', verbNode.id));
  // Correlative pairs sit at their members' corners; every other conjunction rides
  // the visual middle of the gap between the two members it joins.
  elements.push(...coordinatorMarks(coords, ys.map((yv) => yv - centerY), prong - 7));

  const lastBottom = botY + members[members.length - 1]!.height;
  return { width: rightX, height: lastBottom, elements, wordLeft: 0, wordRight: rightX };
}

// --- a clause baseline --------------------------------------------------------
