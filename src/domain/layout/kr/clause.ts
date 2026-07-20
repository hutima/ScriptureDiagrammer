import type { Relation, SyntacticRole, SyntaxNode } from '@/domain/schema';
import { childRelations, getNode, impliedSubjectPronoun, nodeText } from '@/domain/model';
import { LAYOUT } from '../constants';
import { measureText, SMALL_FONT } from '../measure';
import type { DiagramElement } from '../types';
import {
  BASELINE_COMPLEMENTS,
  firstTokenPos,
  isClauseChild,
  isDiagonalCoordination,
  isDiagonalLeaf,
  isDiagonalModifier,
  isInfinitival,
  isWordCoordination,
  ppConjunctRels,
  prepObjectId,
  showLabel,
  subtreeMinIndex,
  wordConjunctRels,
} from './classify';
import { coordinatorMarks, reserveJoinSpans } from './coordinators';
import {
  isPerVerbCompound,
  layoutCompoundPredicate,
  layoutCoordination,
} from './coordination';
import { drawDiagonalCoordination, drawDiagonalModifier } from './diagonal';
import {
  blockAscent,
  clearStemX,
  pedestalRoom,
  rightWithinBand,
  spineBarBottom,
  leadStemClearShift,
} from './geometry';
import { drawInfinitive, layoutInfinitiveFork } from './infinitives';
import { BandPacker } from './packing';
import { layoutDiscourse } from './discourse';
import { drawPp, drawPpCoordination } from './prepositions';
import { eid, emptyBlock, impliedBlock, line, smallText, translate } from './primitives';
import { layoutHead } from './word';
import type { Block, Ctx } from './types';

/**
 * CLAUSE layout — the subject | predicate baseline with its complements
 * (inline and pedestalled), verb modifiers, clause-level adjuncts,
 * introductory/floating words, and the vertical clause stack + spine used
 * for subordinate and coordinate clauses.
 */
/**
 * Stack clause-valued dependents vertically on a shared vertical stem rooted at
 * (`spineX`, `topY`). Each clause is laid out fully and hung off the stem by a
 * short horizontal connector, so coordinated and subordinate clauses read top
 * to bottom rather than sprawling across the page. Returns the placed elements
 * plus the extent reached (`right`, `bottom`) in the caller's coordinate space.
 */
export function stackClauses(
  ctx: Ctx,
  rels: { id: string; dependentId: string; label?: string; labelNodeId?: string }[],
  seen: Set<string>,
  spineX: number,
  topY: number,
): { elements: DiagramElement[]; right: number; bottom: number } {
  const elements: DiagramElement[] = [];
  // `cursorTop` is the highest y the next block may occupy; each block reserves
  // its own ASCENT above its baseline (a coordination fork raises its upper
  // conjunct above the baseline) so a tall member can't poke up into the row
  // above it.
  let cursorTop = topY + LAYOUT.clauseFirstDrop * ctx.vScale;
  let right = spineX;
  let bottom = topY;
  let lastBaselineY = topY;

  const laidRels = rels.map((r) => ({ r, block: ctx.layoutNode(ctx, r.dependentId, seen) }));
  laidRels.forEach(({ r, block }, i) => {
    // A subordinator label (ὅτι, ἵνα, καθὼς…) rides the connector; lengthen it so
    // the label fits between the stem and the clause word instead of colliding.
    const labelled = r.label && showLabel(ctx, r.dependentId);
    const indent = labelled
      ? Math.max(LAYOUT.spineIndent, measureText(r.label!, SMALL_FONT) + 14)
      : LAYOUT.spineIndent;
    const blockX = spineX + indent;
    const y = cursorTop + blockAscent(block);
    elements.push(...translate(block, blockX, y));
    // Short connector from the stem to this clause's baseline.
    elements.push(
      line(eid(), spineX, y, blockX + block.wordLeft, y, 'dashed', 'stem', undefined, r.id),
    );
    if (labelled) {
      elements.push(smallText(eid(), (spineX + blockX) / 2, y - 6, r.label!, 'middle', r.id, r.labelNodeId));
    }
    lastBaselineY = y;
    right = Math.max(right, blockX + block.width);
    bottom = Math.max(bottom, y + block.height);
    // Grow the gap to clear a following clause's pedestal/platform (see the
    // matching note in layoutClauseSpine) instead of letting it crowd upward.
    const next = laidRels[i + 1]?.block;
    const extra = next ? pedestalRoom(next) : 0;
    cursorTop = y + block.height + (LAYOUT.clauseStackGap * ctx.vScale + extra);
  });

  // The vertical stem itself, spanning from its top to the last clause.
  elements.unshift(line(eid(), spineX, topY, spineX, lastBaselineY, 'dashed', 'stem'));
  return { elements, right, bottom };
}

/**
 * Render a HEADLESS clause — one with no subject/predicate of its own, only
 * clause-valued members — as a Kellogg-Reed coordination spine: the member
 * clauses stack vertically, each joined to a shared vertical bar, with the
 * coordinator (καί / εἴτε / and …) written on the bar between them. This is how a
 * compound sentence ("ὃς ἐρύσατο … καὶ μετέστησεν") is drawn, and it avoids the
 * spurious empty "(subject)|(verb)" baseline a normal clause layout would print.
 *
 * The block's `wordLeft`/`wordRight` are the spine itself, so a parent connector
 * lands cleanly on the bar that ties the whole coordination together.
 */
function layoutClauseSpine(
  ctx: Ctx,
  clause: SyntaxNode,
  seen: Set<string>,
  rels: { id: string; type: SyntacticRole; dependentId: string; label?: string; labelNodeId?: string }[],
): Block {
  // A conjunct is a coordinate MEMBER even when it is a bare word/phrase rather
  // than a full clause — e.g. "Οὐκ … ζήσεται [clause] ἀλλ' ἐπὶ παντὶ ῥήματι …"
  // (Matthew 4:4), where a clause is coordinated with a prepositional phrase. Such
  // a word conjunct stacks on the spine like a clause member; without this it was
  // swept into the lead stub and drawn on top of the first clause.
  const memberRels = rels.filter((r) => isClauseChild(ctx, r.dependentId) || r.type === 'conjunct');
  const nonClause = rels.filter((r) => !isClauseChild(ctx, r.dependentId) && r.type !== 'conjunct');
  // Only a genuine coordinator (καί / δέ / τε…) rides the dashed bar between the
  // conjuncts. A word that is NOT a conjunct and NOT the coordinator — a
  // sentence-initial particle such as γε, or a stray introductory word — would
  // otherwise be swept onto the bar and written sideways, far from where it
  // stands (this was the missing initial γε in Phil 3:8). Those lead the spine on
  // their own stub instead (below), staying visible and selectable.
  // Where the first coordinate member begins in the sentence. A coordinator that
  // stands BEFORE it is an introductory connective for the WHOLE construction
  // (διὸ "therefore", οὖν, ἄρα …) — a "conjunction introducing", in the source's
  // own words — not a conjunction joining two members. It leads on a stub at the
  // top-left like an introductory particle, and stays a real, selectable word;
  // only a coordinator sitting BETWEEN members rides the spine bar.
  const firstMemberIndex = Math.min(
    Infinity,
    ...memberRels.map((r) => subtreeMinIndex(ctx, r.dependentId)),
  );
  const allCoordRels = nonClause.filter((r) => r.type === 'coordinator');
  // A correlative set (εἴτε…εἴτε, μέν…δέ) has one coordinator PER member and its
  // first member is also sentence-initial — those must stay on the spine, paired
  // with their members, so never pull them out as introductory.
  const isCorrelative = allCoordRels.length === memberRels.length && memberRels.length >= 2;
  const introCoordRels = isCorrelative
    ? []
    : allCoordRels.filter((r) => subtreeMinIndex(ctx, r.dependentId) < firstMemberIndex);
  const spineCoordRels = allCoordRels.filter((r) => !introCoordRels.includes(r));
  const coordTexts = spineCoordRels
    .map((r) => ({
      text: nodeText(ctx.doc, getNode(ctx.doc.syntax, r.dependentId)!) || '',
      nodeId: r.dependentId,
    }))
    .filter((c) => c.text);
  // Lead words (introductory particles + introductory coordinators), in surface
  // order so they read left-to-right as written.
  const leadRels = [...nonClause.filter((r) => r.type !== 'coordinator'), ...introCoordRels].sort(
    (a, b) => subtreeMinIndex(ctx, a.dependentId) - subtreeMinIndex(ctx, b.dependentId),
  );

  // Lay every member out, then align their VERBS in one column so the dashed
  // connector runs verb-to-verb (the compound-sentence convention) rather than
  // joining the clauses at their left edge.
  const laid = memberRels.map((r) => ({ r, block: ctx.layoutNode(ctx, r.dependentId, seen) }));
  const vxOf = (b: Block) => b.verbX ?? b.wordLeft;
  // The verb-alignment column: normally the widest member's verb, so the dashed
  // bar runs verb-to-verb. But a member whose SUBJECT carries a big below-hanging
  // clause (a relative clause) has its verb dragged far to the right — its whole
  // baseline runs out over that clause before the verb. Aligning every other
  // member to that lone outlier strands them across a wide empty gap and forces an
  // absurdly long parent connector (Col 1:16–18: "…ὅς ἐστιν εἰκὼν … ὅτι ἐν αὐτῷ
  // ἐκτίσθη τὰ πάντα …"). When the widest verb sits more than double — and well
  // beyond — the next-widest, drop it from the column: align the pack to the
  // next-widest, and let the outlier keep its natural left position. Its verb is
  // reached by the coordinate bar simply meeting its own baseline (see below).
  const vxsDesc = [...laid.map(({ block }) => vxOf(block))].sort((a, b) => b - a);
  let verbAlignX = vxsDesc[0] ?? 0;
  for (let i = 0; i + 1 < vxsDesc.length; i++) {
    if (vxsDesc[i]! > 2 * vxsDesc[i + 1]! && vxsDesc[i]! - vxsDesc[i + 1]! > LAYOUT.spineOutlierGap) {
      verbAlignX = vxsDesc[i + 1]!;
    } else break;
  }
  // A correlative set (μέν … δέ …) rides the clause baselines; otherwise each
  // conjunction marks a JOIN and needs clear room in that gap so it never crowds
  // the verb below it.
  const spineCorrelative = coordTexts.length === laid.length && laid.length >= 2;
  const spineJoinSpan = reserveJoinSpans(coordTexts, laid.length, spineCorrelative);
  // The spine coordinator marks (drawn AFTER the member loop, by coordinatorMarks)
  // ride this same bar column in the gaps. Precompute, per JOIN, the coordinator
  // text that will land in that gap — mirroring coordinatorMarks' per-join
  // mapping — so a member's connector label can treat it as an occupier and not be
  // centred on top of it. A correlative set rides member baselines, not gaps.
  const coordAtJoin: (string | undefined)[] = new Array(Math.max(0, laid.length - 1)).fill(undefined);
  if (!spineCorrelative) {
    const joins = Math.max(1, laid.length - 1);
    coordTexts.forEach((c, k) => {
      const j = Math.max(0, Math.min(joins - 1, joins - coordTexts.length + k));
      coordAtJoin[j] = c.text;
    });
  }

  const elements: DiagramElement[] = [];
  const verbYs: number[] = [];
  let cursorTop = 0;
  let right = 0;
  let bottom = 0;
  // Top of the first member's connector-label stub (if one is drawn), so the
  // lead-word row placed later can clear it instead of landing in the same band.
  let firstStubTop = Infinity;

  laid.forEach(({ r, block }, i) => {
    // Verbs line up at verbAlignX. A dropped outlier (its verb past the column,
    // see above) would give a NEGATIVE shift; clamp to 0 so it anchors at the
    // spine's left instead of dragging every other member back to the right (the
    // whole picture is normalized afterwards, so a negative shift would just
    // reintroduce the very gap we are removing). The bar then meets the outlier's
    // own baseline where it crosses the column.
    const blockX = Math.max(0, verbAlignX - vxOf(block));
    const y = cursorTop + blockAscent(block);
    elements.push(...translate(block, blockX, y));
    // A connector that introduces a member (ἵνα …, Οὐχ ὅτι …) rides the dashed
    // coordination bar in the JOIN above this clause — the line that ties the
    // members together — so it reads as the link between them. (The first member
    // has nothing above it to join, so its connector keeps a short left stub.)
    if (r.label && showLabel(ctx, r.dependentId)) {
      if (i > 0) {
        const thisTop = y - blockAscent(block);
        // Centre the connector on the VISUALLY CLEAR segment of the dashed bar —
        // between "the line above" (the previous member's baseline) and the top
        // of this member's word. The previous member's FULL depth (its modifier
        // cascade) hangs to the RIGHT of the bar column, not on it, so counting
        // that depth (the old `prevBottom`) biased the label down onto the lower
        // word. Instead start at the previous baseline and push down only past
        // elements that actually occupy the bar column in the gap.
        const gapTop = verbYs[i - 1]!;
        const COL = 12; // "on the bar column" horizontal tolerance
        let clearTop = gapTop;
        for (const el of elements) {
          let elLeft: number, elRight: number, elTop: number, elBottom: number;
          if (el.kind === 'line') {
            // The vertical dashed bar/stem running down the column itself is the
            // line the label legitimately rides — never let it close the band.
            if (Math.abs(el.x1 - verbAlignX) < 1 && Math.abs(el.x2 - verbAlignX) < 1) continue;
            elLeft = Math.min(el.x1, el.x2);
            elRight = Math.max(el.x1, el.x2);
            elTop = Math.min(el.y1, el.y2);
            elBottom = Math.max(el.y1, el.y2);
          } else if (el.kind === 'text') {
            // Anchor-adjusted glyph box, same metrics the guards use: ascent ≈ 14
            // above the anchor, a small descent below.
            const w = measureText(el.text, el.small ? SMALL_FONT : undefined);
            elLeft = el.anchor === 'middle' ? el.x - w / 2 : el.anchor === 'end' ? el.x - w : el.x;
            elRight = elLeft + w;
            elTop = el.y - 14;
            elBottom = el.y + 3;
          } else {
            continue;
          }
          const nearColumn = elRight >= verbAlignX - COL && elLeft <= verbAlignX + COL;
          const inGap = elBottom > gapTop && elTop < thisTop;
          if (nearColumn && inGap) clearTop = Math.max(clearTop, Math.min(elBottom, thisTop));
        }
        // The spine coordinator riding this same gap (drawn later, so not yet in
        // `elements`) also occupies the bar column — treat it as an occupier so the
        // label clears it rather than landing on top of it.
        const gapCoord = coordAtJoin[i - 1];
        if (gapCoord) {
          const coordY = (gapTop + y - LAYOUT.fontSize) / 2;
          const cw = measureText(gapCoord, SMALL_FONT);
          if (coordY + cw / 2 > gapTop && coordY - cw / 2 < thisTop) {
            clearTop = Math.max(clearTop, Math.min(coordY + cw / 2, thisTop));
          }
        }
        // Place on the clear band when the label fits it; otherwise keep the old
        // gap-midpoint exactly, so cramped spines stay byte-identical.
        const prevBottom = verbYs[i - 1]! + (laid[i - 1]?.block.height ?? 0);
        const fallbackMidY = (prevBottom + thisTop) / 2;
        const fits = thisTop - clearTop >= measureText(r.label!, SMALL_FONT) + 10;
        const midY = fits ? (clearTop + thisTop) / 2 : fallbackMidY;
        elements.push({
          kind: 'text', id: eid(), x: verbAlignX, y: midY, text: r.label!,
          anchor: 'middle', small: true, italic: true, rotate: -90,
          relationId: r.id, nodeId: r.labelNodeId,
        });
      } else {
        const stubW = measureText(r.label!, SMALL_FONT) + 12;
        // Sit above the member's TOP — a tall member (a compound-predicate fork)
        // raises content above its baseline, so the stub must clear the ascent,
        // the same clearance the lead-word block below takes.
        const stubY = y - blockAscent(block) - LAYOUT.fontSize - 14;
        elements.push(smallText(eid(), blockX + stubW / 2, stubY - 4, r.label!, 'middle', r.id, r.labelNodeId));
        elements.push(line(eid(), blockX, stubY, blockX + stubW, stubY, 'solid', 'baseline'));
        firstStubTop = stubY - LAYOUT.smallFontSize - 8;
      }
    }
    verbYs.push(y);
    right = Math.max(right, blockX + block.width);
    bottom = Math.max(bottom, y + block.height);
    // Inter-clause spacing is decided HERE, from the laid-out blocks — so the
    // dashed coordinate bar grows to fit the content rather than a fixed gap.
    // A following clause that raises a pedestal/platform (a substantival subject
    // or predicate-nominative platform) gets that extra height cleared below this
    // clause, so the platform never crowds into the clause above it.
    const next = laid[i + 1]?.block;
    const extra = next ? pedestalRoom(next) : 0;
    cursorTop = y + block.height + (LAYOUT.clauseStackGap * ctx.vScale + extra);
    // Guarantee the next clause's baseline sits far enough below that the join's
    // coordinator clears both verbs (its rotated text needs room in the gap).
    if (next && spineJoinSpan[i]) {
      cursorTop = Math.max(cursorTop, y + spineJoinSpan[i]! - blockAscent(next));
    }
  });

  const top = verbYs[0] ?? 0;
  const last = verbYs[verbYs.length - 1] ?? 0;
  // The dashed bar runs verb-to-verb, tying the clauses together. It may pass
  // behind the verb-aligned words, but the paper-coloured halo under each word
  // (see the renderer) keeps them legible, so the bar stays a single clean line.
  elements.unshift(line(eid(), verbAlignX, top, verbAlignX, last, 'dashed', 'coordination', clause.id));
  // One coordinator per JOIN: the conjunction between clauses k and k+1 rides the
  // dashed bar in the gap between them (so three clauses joined by "καὶ … καὶ" get
  // a καὶ in each gap, not "καὶ καὶ" stacked in the first), at the visual middle of
  // that gap — the bar runs down the clear verb column (modifiers hang off to the
  // right), so the join reads centred in the clear band between the two main lines.
  elements.push(...coordinatorMarks(coordTexts, verbYs, verbAlignX));

  // Introductory words (a sentence-initial particle, a stray conjunction) lead
  // the construction on a short horizontal stub above the top of the spine,
  // joined to the bar — visible and selectable, the Kellogg-Reed home for a word
  // that introduces the whole compound rather than joining two of its members.
  if (leadRels.length) {
    const GAPW = 10;
    const blocks = leadRels.map((r) => ctx.layoutNode(ctx, r.dependentId, seen));
    const totalW = blocks.reduce((s, b) => s + b.width, 0) + GAPW * Math.max(0, blocks.length - 1);
    // Sit ABOVE the first member's full height (a tall member — e.g. a compound
    // predicate whose upper verb rises well above its baseline — would otherwise
    // put the lead word in the MIDDLE of the fork) AND above the first member's
    // connector-label stub, which occupies that same band. The stem then drops
    // from the lead down to the top of the spine bar.
    // A lead word can carry its own modifier cascade descending `height` below
    // its baseline — the vocative Πάτερ ἡμῶν ὁ ἐν τοῖς οὐρανοῖς leading the
    // Lord's-Prayer petitions (Matt 6:9) hangs a PP two rows deep. Anchoring
    // the BASELINE at the clear level dropped that cascade into the first
    // member (οὐρανοῖς / "heavens" printed over ἁγιασθήτω / "hallowed be"),
    // so raise the row by the deepest cascade and it bottoms out clear.
    const ascent0 = laid[0] ? blockAscent(laid[0].block) : 0;
    const leadDrop = Math.max(0, ...blocks.map((b) => b.height));
    const leadY = Math.min(top - ascent0, firstStubTop) - LAYOUT.fontSize - 14 - leadDrop;
    // Lay the lead row into its own buffer first, so it can be nudged clear of
    // the dashed stem before being committed.
    const leadEls: DiagramElement[] = [];
    const rowX = Math.max(0, verbAlignX - GAPW - totalW);
    let x = rowX;
    for (const b of blocks) {
      leadEls.push(...translate(b, x, leadY));
      x += b.width + GAPW;
    }
    // The dashed stem (below) drops at verbAlignX from the lead baseline down
    // to the spine. A lead block carrying a modifier cascade hangs real content
    // into that band — the Matt 6:9 vocative Πάτερ … ὁ ἐν τοῖς οὐρανοῖς hangs
    // an articular PP two rows deep — and a row wider than the verb column is
    // clamped at x = 0, which slides that cascade right under the stem column:
    // the stem drew straight down through οὐρανοῖς and past the very edge of
    // "heavens" (pass-behind gapping cannot make a line through the middle of
    // a word read cleanly). Slide the whole lead row the minimal amount that
    // keeps the stem clear of every line and every upright word it would
    // otherwise touch; 0 when the band under the stub is clear (byte-identical
    // for ordinary lead words and cascades that never reach the column).
    let clearShift = leadStemClearShift(leadEls, verbAlignX, leadY, top);
    // A LEFTWARD shift can exceed the room the row has — a clamped row is
    // already at x = 0 and cannot move further left. RESERVE the space
    // instead: shift the whole spine built so far to the right by the
    // shortfall. The relative geometry is identical, so the stem column still
    // clears the row's hanging content; the diagram simply widens by exactly
    // what the row needs.
    if (rowX + clearShift < 0) {
      const spineShift = -(rowX + clearShift);
      const moved = translate(
        { width: 0, height: 0, elements: [...elements], wordLeft: 0, wordRight: 0 },
        spineShift,
        0,
      );
      elements.length = 0;
      elements.push(...moved);
      verbAlignX += spineShift;
      right += spineShift;
      clearShift = -rowX; // the row itself only moves back to x = 0
    }
    const leadStart = rowX + clearShift;
    x += clearShift;
    elements.push(
      ...(clearShift !== 0
        ? translate({ width: 0, height: 0, elements: leadEls, wordLeft: 0, wordRight: 0 }, clearShift, 0)
        : leadEls),
    );
    right = Math.max(right, x - GAPW);
    // A lead block that carries a cascade draws its OWN baseline at leadY; the
    // stub must ride AT that level to join it (4px below, it reads as a double
    // line and leaves the lead geometrically detached from the stem), and it
    // must run under the WHOLE row — a wide row overflows past verbAlignX, and
    // a stub stopping there would strand the overflowing block (ἐξ ἔργων in
    // Rom 11:6). A bare-word row keeps the classic 4px drop and stem-width
    // stub, the text sitting just above it.
    const lineY = leadDrop > 0 ? leadY : leadY + 4;
    const lineRight = leadDrop > 0 ? Math.max(verbAlignX, x - GAPW) : verbAlignX;
    // The stub's left end also caps at verbAlignX: a rightward clear-shift may
    // start the row past the column, and the stub must still reach the stem.
    elements.push(
      line(eid(), Math.min(leadStart, verbAlignX), lineY, lineRight, lineY, 'solid', 'baseline'),
    );
    elements.push(line(eid(), verbAlignX, lineY, verbAlignX, top, 'dashed', 'stem'));
  }

  // Expose the TOP of the spine bar as the block's connection point, at
  // (verbAlignX, 0): a spine hung off a parent stem (e.g. παυόμεθα's participial
  // object in Col 1:9) must reach the bar, not the empty top-left corner. Shift
  // the whole spine up so the first verb baseline sits at y = 0; the content
  // above it is then reserved by blockAscent like any other block.
  const shifted = translate({ width: right, height: bottom, elements, wordLeft: 0, wordRight: 0 }, 0, -top);
  return {
    width: right,
    height: bottom - top,
    elements: shifted,
    wordLeft: verbAlignX,
    wordRight: verbAlignX,
    verbX: verbAlignX,
  };
}


export function layoutClause(ctx: Ctx, clause: SyntaxNode, seen: Set<string>): Block {
  const model = ctx.doc.syntax;
  let rels = childRelations(model, clause.id);

  // A passage: independent sentences stacked, each labelled with its verse, not
  // tied together as a coordination.
  if (clause.clauseType === 'discourse') return layoutDiscourse(ctx, clause, seen, rels);

  // Prefer a REAL filler over an implied placeholder for the subject / predicate:
  // once the actual word is defined, the implied "(subject)"/"(verb)" should stop
  // being drawn (the model normalizer removes it for typed/imported docs; this
  // keeps a live hand-edit clean too). The superseded implied relations are then
  // dropped from the clause's drawn relations entirely.
  const isImpliedDep = (r: Relation) => !!getNode(model, r.dependentId)?.implied;
  const subjectRels = rels.filter((r) => r.type === 'subject');
  const predicateRels = rels.filter((r) => r.type === 'predicate' || r.type === 'copula');
  const subjectRel = subjectRels.find((r) => !isImpliedDep(r)) ?? subjectRels[0];
  const predicateRel = predicateRels.find((r) => !isImpliedDep(r)) ?? predicateRels[0];
  // Implied subject/predicate relations that lost to a real sibling — not drawn.
  const superseded = new Set<Relation>([
    ...subjectRels.filter((r) => r !== subjectRel && isImpliedDep(r)),
    ...predicateRels.filter((r) => r !== predicateRel && isImpliedDep(r)),
  ]);
  if (superseded.size) rels = rels.filter((r) => !superseded.has(r));

  // A HEADLESS clause — no subject and no predicate of its own — is a pure
  // coordination/container of (clause) children: the compound-sentence wrapper
  // the Lowfat converter produces for "ἐρύσατο … καὶ μετέστησεν". Rendering it as
  // a baseline would print an empty "(subject)|(verb)" line; instead draw the
  // members stacked on a shared spine with the coordinator on it. Only do this
  // when there ARE clause members (else fall through to the implied baseline,
  // which legitimately shows pro-drop / an elided copula).
  if (!subjectRel && !predicateRel && rels.some((r) => isClauseChild(ctx, r.dependentId))) {
    // A coordination whose members are all INFINITIVES is a compound infinitive
    // object/complement — draw it as the classic Reed-Kellogg fork (arms fanning
    // right, conjunctions in the gaps). Only a genuinely heavy/finite coordination
    // falls back to the verb-to-verb spine.
    return layoutInfinitiveFork(ctx, clause, seen) ?? layoutClauseSpine(ctx, clause, seen, rels);
  }

  // The verb is rendered as a bare word; the CLAUSE owns the verb's complements
  // (baseline) and adjuncts (below), so they are not drawn twice.
  const verbNode = predicateRel ? getNode(model, predicateRel.dependentId) : undefined;
  // A pro-drop clause imputes its subject pronoun from the verb (subjectFillerLabel
  // below). In English-gloss mode a Greek finite verb's gloss ALSO carries that
  // pronoun ("ἐνετειλάμην" → "I commanded"), so drawing the imputed "(I)" beside
  // "I commanded" prints the subject twice. When that happens, keep the pronoun in
  // the subject slot only and strip its redundant copy from the verb's displayed
  // text, so the diagram reads "(I) | commanded" — exactly as the Greek reads
  // "(ἐγώ) | ἐνετειλάμην". Display-only: the token gloss is never mutated.
  const impliedSubjectLabel = !subjectRel ? subjectFillerLabel(ctx, verbNode) : undefined;
  const strippedVerbText =
    verbNode && impliedSubjectLabel
      ? stripLeadingImputedPronoun(nodeText(ctx.doc, verbNode), impliedSubjectLabel)
      : undefined;
  const verbBlock = verbNode
    ? layoutHead(ctx, verbNode, seen, true, false, undefined, strippedVerbText)
    : impliedBlock('(verb)');

  // A subjectless NONFINITE clause — a bare participle/infinitive (an adverbial
  // participle like καρποφοροῦντες, an articular participle, an infinitive) — has
  // no real or pro-drop subject; printing "(subject)" + a divider just clutters
  // it. Render the predicate as the head of its own little baseline instead. A
  // subjectless FINITE clause keeps "(subject)" — that genuinely shows pro-drop.
  const verbPos = verbNode ? firstTokenPos(ctx, verbNode) : undefined;
  const omitSubject = !subjectRel && (verbPos === 'participle' || verbPos === 'infinitive');

  // A compound subject forks open to the right, so its junction meets the
  // subject|predicate divider; everywhere else a coordination forks to the left.
  const subjectNode = subjectRel ? getNode(model, subjectRel.dependentId) : undefined;
  // A substantival / clausal subject (a participle phrase like οἱ ὄντες ἐν τῷ
  // σκήνει, or a noun clause filling the subject slot) stands on a PEDESTAL in that
  // slot — the Kellogg-Reed treatment for a substantive occupying a noun slot,
  // mirroring how clause complements are pedestalled. Only when it is compact
  // enough not to tower over the line; a tall one falls back to an inline baseline.
  const subjectIsClause =
    !!subjectRel &&
    isClauseChild(ctx, subjectRel.dependentId) &&
    !isInfinitival(ctx, subjectRel.dependentId);
  let pedestalSubject = false;
  if (subjectIsClause) {
    const probe = ctx.layoutNode(ctx, subjectRel!.dependentId, new Set(seen));
    // A clausal subject rides a pedestal in the subject slot. Unlike a clause
    // COMPLEMENT (which can fall back to a dotted stem below when tall), a subject
    // has no such fallback — laid out inline, a compound subject clause leaves the
    // subject|predicate divider (and the predicate) stranded past the gap where its
    // baseline stops. So pedestal it regardless of height, keeping the main line
    // continuous through to the verb.
    pedestalSubject = probe.elements.length > 0;
  }
  const subjectBlock = !subjectRel
    ? impliedBlock(impliedSubjectLabel ?? subjectFillerLabel(ctx, verbNode))
    : pedestalSubject
      ? emptyBlock() // drawn as a pedestal below, not inline
      : subjectNode && isWordCoordination(ctx, subjectNode)
        ? layoutCoordination(ctx, subjectNode, seen, true)
        : ctx.layoutNode(ctx, subjectRel.dependentId, seen);

  // Complements live under the verb node but render on the baseline. A WORD
  // complement sits directly on the line; a CLAUSE complement (a noun clause as
  // direct object / subject / predicate nominative) is written on a PEDESTAL
  // standing in that slot above the line — the traditional Kellogg-Reed
  // treatment. A very tall embedded clause would tower over everything, so it
  // falls back to hanging below on a dotted stem instead.
  // A per-verb compound predicate draws every complement INSIDE its fork arms, so
  // the clause must not also draw the head verb's complements after the fork
  // (that would duplicate them and lose the conjunct verbs' objects).
  const verbSelfContained = !!verbNode && isWordCoordination(ctx, verbNode) && isPerVerbCompound(ctx, verbNode);
  const verbRels = predicateRel && !verbSelfContained ? childRelations(model, predicateRel.dependentId) : [];
  const isCoreSlot = (r: { type: SyntacticRole }) => BASELINE_COMPLEMENTS.includes(r.type);
  const isBaselineComplement = (r: { type: SyntacticRole; dependentId: string }) =>
    isCoreSlot(r) && !isClauseChild(ctx, r.dependentId);
  const complementRels = verbRels.filter(isBaselineComplement);
  const complementBlocks = complementRels.map((r) => ({
    rel: r,
    block: ctx.layoutNode(ctx, r.dependentId, seen),
  }));

  // Compact clause complements → pedestals; the rest defer to the stem below.
  // Probe each with a CLONED `seen` so measuring doesn't consume the node (it is
  // laid out for real at its draw site — the pedestal here, or stackClauses below).
  const pedestalRels: Relation[] = [];
  const pedestalled = new Set<string>();
  for (const r of verbRels) {
    if (!isCoreSlot(r) || !isClauseChild(ctx, r.dependentId)) continue;
    if (isInfinitival(ctx, r.dependentId)) continue; // infinitives hang on a diagonal
    const probe = ctx.layoutNode(ctx, r.dependentId, new Set(seen));
    if (probe.height + blockAscent(probe) <= LAYOUT.pedestalMaxHeight) {
      pedestalRels.push(r);
      pedestalled.add(r.id);
    }
  }

  const elements: DiagramElement[] = [];
  let x = 0;
  let baselineHeight = 0;

  const placeBlock = (b: Block) => {
    elements.push(...translate(b, x, 0));
    baselineHeight = Math.max(baselineHeight, b.height);
    x += b.width;
  };

  // A subject whose width is dominated by a DEEP below-hanging clause (a relative
  // clause on the subject, e.g. αὐτός + "ὅς ἐστιν εἰκὼν … ") pushes the divider —
  // and the whole predicate — past that clause's full width, even though its wide
  // rows sit well below the baseline and leave the band beside the predicate empty.
  // Tuck the divider left, clear of only the subject content within the predicate's
  // own MEASURED shallow depth band, so the predicate slides into that empty space.
  // Applied ONLY when it is provably clash-free: an inline (non-pedestal) subject, a
  // simple (non-compound) predicate with no deep clause adjunct on its side, and
  // only when it actually reclaims space — so every ordinary clause stays
  // byte-identical.
  const tuckDivX: number | null = (() => {
    if (omitSubject || pedestalSubject) return null;
    if (verbNode && isWordCoordination(ctx, verbNode)) return null;
    const clauseWordRels = rels.filter((r) => r !== subjectRel && r !== predicateRel);
    // Everything on the PREDICATE side that hangs below the line: the verb's own
    // dependents (complements, adverbial modifiers) and the clause-level word
    // dependents (an object/predicate-nominative the source attached to the clause
    // rather than the verb — as in this LLM parse — draws as a right-hand phrase).
    const predSideRels = [
      ...verbRels.filter((r) => r.type !== 'conjunct' && r.type !== 'coordinator'),
      ...clauseWordRels.filter(
        (r) =>
          r.type !== 'vocative' &&
          r.type !== 'interjection' &&
          r.type !== 'particle' &&
          r.type !== 'conjunction',
      ),
    ];
    // A predicate-side CLAUSE adjunct (a subordinate/relative clause) stacks far
    // below the whole clause on a stem — there is no shallow band to tuck into, so
    // bail. (A pedestalled clause complement rides ABOVE the line; a clause-valued
    // infinitive hangs on a diagonal — both are fine and measured below.)
    for (const r of predSideRels) {
      if (isClauseChild(ctx, r.dependentId) && !isInfinitival(ctx, r.dependentId) && !pedestalled.has(r.id)) {
        return null;
      }
    }
    // The predicate's true below-baseline reach: probe every below-hanging
    // predicate-side dependent with a CLONED `seen` (so nothing is consumed before
    // its real layout), then add a clearance margin. Over-measuring only makes the
    // tuck more conservative, never unsafe.
    let predDepth = verbBlock.height;
    for (const r of predSideRels) {
      if (pedestalled.has(r.id)) continue; // rides a pedestal above the line
      const probe = ctx.layoutNode(ctx, r.dependentId, new Set(seen));
      predDepth = Math.max(predDepth, LAYOUT.slantDrop * ctx.vScale + blockAscent(probe) + probe.height);
    }
    predDepth += LAYOUT.slantDrop * ctx.vScale;
    // Clear only the subject content within that band; a deep, narrow-topped subject
    // dependent (a relative clause) reaches further right only BELOW it, where the
    // predicate never goes — so the predicate tucks into the empty band above it.
    const shallowRight = rightWithinBand(subjectBlock, predDepth);
    const candidate = Math.max(subjectBlock.wordRight, shallowRight + LAYOUT.dependentGap);
    // Only tuck when it reclaims real horizontal space; else keep classic placement
    // so every ordinary clause stays byte-identical.
    return subjectBlock.width - candidate > LAYOUT.diagRun ? candidate : null;
  })();

  // subject + subject|predicate divider (crosses the baseline) — unless this is a
  // bare nonfinite predicate, which stands alone with no subject side.
  let divX = 0;
  // When the divider is tucked left of the subject's full extent, the subject's
  // deep dependent still reaches subjectBlock.width to the right (below the line),
  // so the clause's overall width must still count it even though `x` no longer does.
  let subjectFullRight = 0;
  if (!omitSubject && pedestalSubject) {
    // The substantive rides a pedestal standing in the subject slot, the divider
    // following it. Its body sits ABOVE the baseline, so it adds no below-line
    // height (its extent is reserved as ascent wherever this clause is placed).
    const block = ctx.layoutNode(ctx, subjectRel!.dependentId, seen);
    const baseY = -(
      LAYOUT.pedestalFootRise +
      Math.max(block.height + LAYOUT.pedestalGap, LAYOUT.pedestalMinRiser)
    );
    elements.push(...translate(block, 0, baseY));
    // Stand the foot under the substantive's HEAD (its participle/verb, exposed as
    // verbX), not the midpoint of its whole span — so the riser rises at the left
    // and the head's own modifiers (οἱ, ἐν τῷ σκήνει) cascade to the right of it
    // rather than across it.
    const center = (block.wordLeft + (block.wordRight || block.width)) / 2;
    const connectX = Math.max(LAYOUT.pedestalFootHalf, block.verbX ?? center);
    const apexY = -LAYOUT.pedestalFootRise;
    // A compound (spine) subject is met at its bar's BOTTOM end — a full-height
    // riser would run a second vertical alongside the bar, through the lower
    // members' verbs (same treatment as the pedestalled clause complement).
    const riserTop = baseY + (spineBarBottom(block) ?? 0);
    // The little forked foot standing on the main line, and the riser up to the
    // substantive's own baseline.
    elements.push(line(eid(), connectX - LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    elements.push(line(eid(), connectX + LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    elements.push(line(eid(), connectX, apexY, connectX, riserTop, 'solid', 'stem', undefined, subjectRel?.id));
    x = Math.max(block.width, connectX + LAYOUT.pedestalFootHalf);
    divX = x;
    // Main line under the pedestal, out to the subject|predicate cross.
    elements.push(line(eid(), 0, 0, divX, 0, 'solid', 'baseline'));
    elements.push(
      line(eid(), divX, -LAYOUT.dividerUp, divX, LAYOUT.dividerDown, 'solid', 'divider', undefined, subjectRel?.id),
    );
    x += 2;
  } else if (!omitSubject) {
    // Draw the subject at the left; advance the baseline to the divider — the FULL
    // width normally, or the tucked position when a deep subject dependent lets the
    // predicate slide left (see `tuckDivX`). Either way the subject's full extent is
    // remembered in `subjectFullRight` for the clause's width.
    elements.push(...translate(subjectBlock, 0, 0));
    baselineHeight = Math.max(baselineHeight, subjectBlock.height);
    subjectFullRight = subjectBlock.width;
    divX = tuckDivX ?? subjectBlock.width;
    x = divX;
    // The subject's baseline must run all the way to the subject|predicate cross.
    // A subject with diagonal modifiers whose word overhangs its slant (e.g. "οἱ
    // λίθοι οὗτοι") makes the block wider than its baseline reaches, leaving the
    // subject floating short of the divider — bridge the gap so the line connects.
    if (subjectBlock.wordRight < divX - 0.5) {
      elements.push(line(eid(), subjectBlock.wordRight, 0, divX, 0, 'solid', 'baseline'));
    }
    elements.push(
      line(eid(), divX, -LAYOUT.dividerUp, divX, LAYOUT.dividerDown, 'solid', 'divider',
        undefined, subjectRel?.id),
    );
    x += 2;
  }
  // predicate — a compound predicate (proofreads AND edits) forks and rejoins so
  // the shared object continues from a single point past the fork.
  const verbIsCoord = !!verbNode && isWordCoordination(ctx, verbNode);
  const predBlock = verbIsCoord ? layoutCompoundPredicate(ctx, verbNode!, seen) : verbBlock;
  const verbX0 = x;
  placeBlock(predBlock);
  // Where the complements would begin with NO verb-modifier cascade — the
  // minimum legal start for a PACKED complement (see the packing note below).
  const xAfterVerb = x;
  // A self-contained open fork exposes its coordinate BAR as verbX; aim the
  // clause's verb point there so an OUTER coordination line meets this clause
  // through the predicate fork rather than at the (left-edge) divider.
  const verbMidX =
    verbSelfContained && predBlock.verbX != null
      ? verbX0 + predBlock.verbX
      : verbX0 + (predBlock.wordRight || predBlock.width) / 2;

  // Adjuncts hang below the baseline on diagonals/stems. The verb's OWN
  // modifiers — an article substantivizing a participle (τοῖς οὖσιν…), an
  // adverb, an adverbial PP (σὺν ἐπισκόποις…) — belong directly beneath the
  // VERB, their KR home, rather than out in a right-hand row past the
  // complements where they would float free of their head. Clause-level word
  // adjuncts still cascade to the right of the baseline; clause-valued adjuncts
  // (subordinate/relative clauses) stack vertically on a dotted stem below.
  // The shared modifiers of a COMPOUND predicate hang below the whole fork: its
  // lower conjunct dips below the baseline, so a slant starting at the usual drop
  // would land its object right on top of that conjunct. Clear the fork's depth.
  const belowTop =
    (verbIsCoord ? predBlock.height + LAYOUT.slantDrop : LAYOUT.slantDrop) * ctx.vScale;
  let belowMaxBottom = belowTop;

  // Draw one hanging modifier whose diagonal/stem meets the baseline at
  // `attachX`; returns the rightmost x it reached and where the next sibling
  // should attach. Three shapes: a prepositional phrase (prep on the slant,
  // object on a baseline below), a closed-class leaf written along its slant,
  // or a noun phrase on its own stem-hung baseline.
  const drawHanging = (
    r: { id: string; type: SyntacticRole; dependentId: string; label?: string },
    attachX: number,
  ): { right: number; next: number; footRight: number } => {
    if (isInfinitival(ctx, r.dependentId)) {
      // Infinitive phrase: empty diagonal down to its own horizontal baseline.
      const ext = drawInfinitive(ctx, r, attachX, belowTop, seen, elements);
      belowMaxBottom = Math.max(belowMaxBottom, ext.bottom);
      return { right: ext.right, next: ext.right + LAYOUT.dependentGap, footRight: attachX };
    }
    const objId = prepObjectId(ctx, r);
    const ppConj = objId ? ppConjunctRels(ctx, r.dependentId) : [];
    if (objId && ppConj.length) {
      // Coordinated adverbial PPs hanging from the verb ("ἐν … καὶ ἐπὶ …"): draw
      // every conjunct PP, joined by the coordinator, not just the first. Each
      // conjunct's slant hangs from its own foot spread rightward, so report the
      // rightmost foot — the baseline must reach it or the later slants float.
      const ext = drawPpCoordination(ctx, r, objId, ppConj, attachX, belowTop, seen, elements);
      belowMaxBottom = Math.max(belowMaxBottom, ext.bottom);
      return { right: ext.right, next: ext.right + LAYOUT.dependentGap, footRight: ext.footRight };
    }
    if (objId) {
      // Preposition on the slant, object on a baseline below. The slant drops
      // deeper by the object's ascent so a COORDINATED object (ἀπὸ Θεοῦ … καὶ
      // Κυρίου …) whose upper conjunct rises above its baseline doesn't land back
      // on the main line.
      const ext = drawPp(ctx, r.dependentId, objId, r.id, attachX, belowTop, seen, elements);
      belowMaxBottom = Math.max(belowMaxBottom, ext.bottom);
      return { right: ext.right, next: ext.right + LAYOUT.dependentGap, footRight: attachX };
    }
    if (r.type !== 'conjunct' && isDiagonalCoordination(ctx, r.dependentId)) {
      const ext = drawDiagonalCoordination(ctx, r.dependentId, attachX, elements);
      belowMaxBottom = Math.max(belowMaxBottom, ext.bottom);
      return { right: ext.right, next: ext.right + LAYOUT.dependentGap, footRight: ext.footRight };
    }
    if (r.type !== 'conjunct' && isDiagonalModifier(ctx, r.dependentId)) {
      const node2 = getNode(ctx.doc.syntax, r.dependentId)!;
      const ext = drawDiagonalModifier(ctx, node2, attachX, 0, r.id, elements);
      belowMaxBottom = Math.max(belowMaxBottom, ext.bottom);
      return { right: ext.right, next: ext.right + LAYOUT.dependentGap, footRight: attachX };
    }
    const block = ctx.layoutNode(ctx, r.dependentId, seen);
    const oTop = belowTop + blockAscent(block);
    const objX = attachX + LAYOUT.diagRun;
    elements.push(...translate(block, objX, oTop));
    elements.push(
      line(eid(), attachX, 0, objX + block.wordLeft, oTop, 'solid', 'stem', undefined, r.id),
    );
    if (r.label && showLabel(ctx, r.dependentId)) {
      elements.push(smallText(eid(), attachX + 4, oTop - 6, r.label, 'start', r.id));
    }
    belowMaxBottom = Math.max(belowMaxBottom, oTop + block.height);
    const right = objX + block.width;
    return { right, next: right + LAYOUT.dependentGap, footRight: attachX };
  };

  // Verb modifiers, beneath the verb. Narrow leaves (the article) first so they
  // sit closest under the verb word; wider phrases (the σὺν PP) follow.
  const verbMods = verbRels
    .filter(
      (r) =>
        !isBaselineComplement(r) &&
        r.type !== 'conjunct' &&
        r.type !== 'coordinator' &&
        (!isClauseChild(ctx, r.dependentId) || isInfinitival(ctx, r.dependentId)),
    )
    .sort((a, b) => Number(!isDiagonalLeaf(ctx, a.dependentId)) - Number(!isDiagonalLeaf(ctx, b.dependentId)));

  // Clause-level adjuncts (not owned by the verb). A vocative (direct address)
  // and an interjection are NOT part of the clause's grammar — they float on
  // their own line above the diagram, unconnected — so they are handled apart.
  const clauseWordRels = rels.filter((r) => r !== subjectRel && r !== predicateRel);
  const floatingRels = clauseWordRels.filter(
    (r) => (r.type === 'vocative' || r.type === 'interjection') && !isClauseChild(ctx, r.dependentId),
  );
  // Introductory words — a sentence-initial discourse particle (γάρ, οὖν, δέ,
  // μέν) connecting the clause to its context. Leedy floats these above the LEFT
  // end of the baseline on a dotted stem rather than slanting them off the verb.
  // A clause-level `conjunction` (OpenText's pl.conj — "conjunction introducing
  // this clause") is a connective, not a modifier: it joins the clause to its
  // context exactly as a discourse particle does, so it floats on the dotted stem
  // too rather than slanting off the verb like an adverb.
  const introductoryRels = clauseWordRels.filter(
    (r) => (r.type === 'particle' || r.type === 'conjunction') && !isClauseChild(ctx, r.dependentId),
  );
  // A word/noun in APPOSITION to the WHOLE clause renames it — the base tree's
  // "ἐν τῷ βαπτισμῷ ἐν ᾧ …" shape (Col 2:12), where the first ἐν governs the whole
  // "ἐν ᾧ … συνηγέρθητε" clause and τῷ βαπτισμῷ apposes THAT clause. It continues
  // on the clause's own main line, joined by the Reed-Kellogg apposition "="
  // (drawn below), NOT trailed off as a stray right-hand modifier the way a
  // generic word adjunct would be. Only a BARE-WORD / phrasal (non-clause)
  // appositive is taken here; a clause-valued appositive — including an
  // INFINITIVAL result clause ("ὥστε … ἔχειν", 1 Cor 5:1) — still flows through
  // the ordinary adjunct paths (clause stem / infinitive diagonal) below.
  const isClauseAppos = (r: Relation) =>
    r.type === 'apposition' && !isClauseChild(ctx, r.dependentId);
  const clauseApposRels = clauseWordRels.filter(isClauseAppos);
  const wordAdjuncts = clauseWordRels.filter(
    (r) =>
      (!isClauseChild(ctx, r.dependentId) || isInfinitival(ctx, r.dependentId)) &&
      r.type !== 'vocative' &&
      r.type !== 'interjection' &&
      r.type !== 'particle' &&
      r.type !== 'conjunction' &&
      // Only the bare-word appositions handled above are pulled out; a clausal /
      // infinitival appositive stays here so it draws as before.
      !isClauseAppos(r),
  );
  // A word-coordination complement at the END of the baseline is an OPEN fork:
  // its members fan out above and below the line, so the drawn baseline STOPS
  // at the fork junction and the strip the right-hand adjunct rail attaches to
  // never exists — the rail (and every slant hanging from it) floated free of
  // the clause (Gen 1:11 "תַּדְשֵׁא הָאָרֶץ דֶּשֶׁא עֵשֶׂב… עַל־הָאָרֶץ" left the
  // עַל־PP disconnected). Hang those adjuncts beneath the VERB instead — their
  // other KR home — where the cascade draws BEFORE the complements, which then
  // start past its band, so nothing clashes. Clauses without an open-fork tail
  // keep the rail (and their exact geometry) unchanged.
  const lastComplement = complementBlocks[complementBlocks.length - 1];
  const hollowBaselineTail =
    !!lastComplement && isWordCoordination(ctx, getNode(model, lastComplement.rel.dependentId)!);
  const verbHungAdjuncts = hollowBaselineTail && verbNode ? wordAdjuncts : [];
  const railAdjuncts = verbHungAdjuncts.length ? [] : wordAdjuncts;
  const clauseAdjuncts = [
    ...clauseWordRels.filter((r) => isClauseChild(ctx, r.dependentId) && !isInfinitival(ctx, r.dependentId)),
    // Clause complements that were pedestalled are drawn above the line, not here;
    // infinitives hang on their own diagonal among the verb modifiers.
    ...verbRels.filter(
      (r) =>
        !isBaselineComplement(r) &&
        isClauseChild(ctx, r.dependentId) &&
        !pedestalled.has(r.id) &&
        !isInfinitival(ctx, r.dependentId),
    ),
  ];

  // `subjectFullRight` counts a tucked subject's deep dependent, which reaches past
  // the divider below the line (0 unless the divider was tucked).
  let maxRight = Math.max(x, subjectFullRight);
  // Draw the verb's modifiers FIRST, beneath the verb, and record how far right
  // their cascade reaches. The complements then start past that band: otherwise a
  // long adverbial PP hanging under the verb (ὑπὲρ τοῦ σώματος…) overlaps the
  // direct object's own genitive chain hanging below it on the baseline.
  let vModRight = x;
  // The rightmost point where a DIRECT verb modifier actually MEETS the line (its
  // diagonal/stem foot) — distinct from vModRight, which also counts the full
  // recursive width of that modifier's own sub-cascade hanging below.
  let vModFootRight = x;
  // Hang the first modifier just inside the verb word's right edge — unlike
  // layoutHead/layoutPredicateArm, which attach from the word's middle. Attaching
  // past the word keeps a modifier's diagonal text from running back over a
  // SHORT verb (a one-word implied copula like "(ἐστίν)").
  //
  // A COMPOUND predicate is a fork, not a word: `predBlock.wordRight` is the fork's
  // right JUNCTION (where the arms rejoin), and the post-fork baseline begins there.
  // Insetting by wordPadX would land the shared modifier's foot on the diagonal
  // right-prong, LEFT of the baseline, leaving it unattached (Col 1:9 "…προσευχόμενοι
  // καὶ αἰτούμενοι ὑπὲρ ὑμῶν"). Attach a fork's shared modifier at the junction itself.
  let vCursor = verbX0 + (predBlock.wordRight || predBlock.width) - (verbIsCoord ? 0 : LAYOUT.wordPadX);
  [...verbMods, ...verbHungAdjuncts].forEach((r) => {
    vModFootRight = Math.max(vModFootRight, vCursor);
    const { right, next, footRight } = drawHanging(r, vCursor);
    // A coordinated modifier (PP or diagonal) spreads several slant feet rightward;
    // count the rightmost so the baseline extension below reaches every foot.
    vModFootRight = Math.max(vModFootRight, footRight);
    vCursor = next;
    vModRight = Math.max(vModRight, right);
  });

  // Extend the baseline so the verb's modifiers visibly hang FROM the main line
  // rather than from empty space — but only far enough to reach their FEET (one row
  // down), not across the full recursive width of a deep modifier's own sub-cascade.
  // An adverbial-participle chain that carries most of the sentence (Col 1:9-20:
  // παυόμεθα → προσευχόμενοι → …) would otherwise stretch a near-empty main line
  // clear across the diagram. When a complement follows, the line must still run out
  // PAST the whole band to reach it (else the object would collide with the
  // modifiers' own descenders), so keep the full reach there.
  const hasBaselineSlot = complementBlocks.length > 0 || pedestalRels.length > 0;
  if (vModRight > x) {
    const footEnd = Math.min(vModRight, vModFootRight + LAYOUT.diagRun);
    if (hasBaselineSlot) {
      // The classic cursor still starts complements past the cascade's FULL
      // width, but the line out to the first complement is drawn by that
      // complement's own bridge (below) so it can stop at the complement's
      // PACKED separator instead of the classic one. Identical segment when
      // nothing moves.
      x = vModRight + LAYOUT.dependentGap;
    } else {
      elements.push(line(eid(), x, 0, footEnd, 0, 'solid', 'baseline'));
    }
  }

  // The rightmost x the main line is ACTUALLY drawn to at y = 0 so far. The
  // cursor `x` advances by each complement's full block WIDTH, which includes
  // content hanging BELOW the baseline (a deep genitive cascade, a pedestal's
  // platform) — the y = 0 strip over that extra width is empty space. Anything
  // attached past it (the next separator, the adjunct rail, an apposition
  // stem) floated free of the line (the Col 1:13 "τοῦ υἱοῦ = …" disconnect).
  const drawnZeroEnd = (): number => drawnZeroEndBefore(elements.length);
  /** Same, but only over `elements[0..end)` — the state before a slice was drawn. */
  const drawnZeroEndBefore = (endIndex: number): number => {
    let end = 0;
    for (let i = 0; i < endIndex; i++) {
      const el = elements[i]!;
      if (el.kind === 'line' && Math.abs(el.y1) <= 0.01 && Math.abs(el.y2) <= 0.01) {
        end = Math.max(end, el.x1, el.x2);
      }
    }
    return end;
  };
  // Each complement bridges the hollow strip behind it so the main line stays
  // continuous up to its (packed) separator — EXCEPT across an open
  // coordination fork, whose members replace the line (the Gen 1:11 case: its
  // adjuncts hang beneath the verb instead). `lastPlacedWasFork` carries that
  // gate from one complement to the next.
  let lastPlacedWasFork = false;

  // BAND PACKING for the baseline slot (see kr/packing.ts): each complement /
  // pedestal is drawn at its CLASSIC position — past the verb cascade's (and
  // previous complements') FULL recursive width — then slid left into any
  // pocket provably clear of everything already drawn. The occupied set
  // excludes the horizontal y = 0 main-line segments (the shared line a
  // complement legitimately rides); cascade feet, separator ticks, word texts
  // and deep hanging content all participate, so a packed complement stops
  // PACK_PAD clear of every foot and never reorders. The slide is bounded so
  // a complement never starts before `xAfterVerb`, its no-cascade home.
  const isMainLine = (el: DiagramElement): boolean =>
    el.kind === 'line' && Math.abs(el.y1) <= 0.01 && Math.abs(el.y2) <= 0.01;
  // Accumulated deficit of the baseline cursor vs its never-packed (classic)
  // position. Each packed slice pulls the cursor left (`x -= shift`), so the
  // NEXT slice is DRAWN already slid by that amount — a position proven safe
  // only for the previous slice's footprint, not this one's. A follower whose
  // own hanging content reaches deeper (Heb 2:8 "οὐδὲν ἀφῆκεν αὐτῷ
  // ἀνυπότακτον": αὐτῷ's rotated ἀνυπότακτον diagonal over the ἐν τῷ ὑποτάξαι
  // sub-baseline) starts out already colliding, and `reclaim` treats a clash
  // that exists at the start position as grandfathered adjacency — it can only
  // tighten, never repair. So each slice's slide is computed from its TRUE
  // classic position instead: healthy slices land exactly where they always
  // did (reclaim is translation-covariant), while an over-inherited slide is
  // pushed back right just far enough to clear — never past classic.
  let packedDrift = 0;
  const packSlice = (lenBefore: number, classicSepX: number): number => {
    if (!ctx.pack) return 0;
    const slice = elements.slice(lenBefore);
    const packer = new BandPacker();
    packer.occupy(elements.slice(0, lenBefore).filter((el) => !isMainLine(el)));
    const asBlock = { width: 0, height: 0, elements: slice, wordLeft: 0, wordRight: 0 };
    const classicSlice = packedDrift > 0 ? translate(asBlock, packedDrift, 0) : slice;
    const classicShift = packer.reclaim(classicSlice, classicSepX + packedDrift - xAfterVerb);
    const shift = classicShift - packedDrift;
    packedDrift = classicShift;
    if (Math.abs(shift) < 0.01) return 0;
    ctx.packStats.shifted++;
    elements.splice(
      lenBefore,
      slice.length,
      ...translate({ width: 0, height: 0, elements: slice, wordLeft: 0, wordRight: 0 }, -shift, 0),
    );
    return shift;
  };

  // complements on the baseline, each with the appropriate separator
  complementBlocks.forEach(({ rel, block }) => {
    const sepX = x;
    const wasFork = lastPlacedWasFork;
    lastPlacedWasFork = isWordCoordination(ctx, getNode(model, rel.dependentId)!);
    const lenBefore = elements.length;
    const backSlant = rel.type === 'predicateNominative' || rel.type === 'predicateAdjective';
    if (backSlant) {
      // line leaning back toward the verb
      elements.push(
        line(eid(), sepX + 10, 0, sepX, -LAYOUT.separatorUp, 'solid', 'separator', undefined, rel.id),
      );
    } else {
      // vertical tick standing on the baseline (object)
      elements.push(
        line(eid(), sepX, 0, sepX, -LAYOUT.separatorUp, 'solid', 'separator', undefined, rel.id),
      );
    }
    // The back-slant's FOOT rests at sepX + 10 on the baseline. A word complement
    // carries its own baseline under that foot, but an open coordination fork has
    // NO line at y = 0 beyond its junction — placed at the classic sepX + 6 its
    // vertex stops short and the slash foot hangs in empty space (Heb 1:3 "ὢν \
    // ἀπαύγασμα … καὶ χαρακτὴρ …"). Advance the fork so its vertex lands exactly
    // on the slash foot; the bridge below runs the baseline out under the slash.
    x += backSlant && lastPlacedWasFork ? 10 : 6;
    // Keep the main line CONTINUOUS across the separator: bridge the verb's baseline
    // end to the complement's own baseline. Without it the predicate-nominative
    // back-slant — whose foot rests only on the complement side — leaves the verb
    // baseline ending in a bare gap right before the slant (Col 1:15 "ὅς ἐστιν \ εἰκὼν").
    elements.push(line(eid(), sepX, 0, x, 0, 'solid', 'baseline', undefined, rel.id));
    placeBlock(block);
    const shift = packSlice(lenBefore, sepX);
    x -= shift;
    // The bridge from the drawn main line to this complement's PACKED
    // separator — gated on the PREVIOUS complement not being an open fork,
    // exactly as bridgeBaselineTo did when it ran before the separator.
    if (!wasFork) {
      const from = drawnZeroEndBefore(lenBefore);
      if (from < sepX - shift - 0.5) {
        elements.push(line(eid(), from, 0, sepX - shift, 0, 'solid', 'baseline'));
      }
    }
  });

  // Noun-clause complements on pedestals, standing in their slot above the line.
  // (Their above-baseline extent is reserved by blockAscent wherever this clause
  // is later placed, since the pedestal elements live at negative y.)
  pedestalRels.forEach((rel) => {
    const block = ctx.layoutNode(ctx, rel.dependentId, seen);
    // If the clause was already laid out elsewhere (shared reference → `seen`
    // dedup returns an empty block), skip it: drawing a pedestal foot + riser for
    // empty content leaves an orphan "Y" with no baseline on top.
    if (!block.elements.length) return;
    // Object separator tick (the direct-object stem), then the pedestal foot a
    // little to its right.
    const sepX = x;
    const wasFork = lastPlacedWasFork;
    // A pedestal's platform lives ABOVE the line; the y = 0 strip across its
    // width past the foot is hollow, so a follower must bridge from the foot.
    lastPlacedWasFork = false;
    const lenBefore = elements.length;
    elements.push(line(eid(), sepX, 0, sepX, -LAYOUT.separatorUp, 'solid', 'separator', undefined, rel.id));
    x += 6;
    const baseStart = x;
    // Embedded clause sits fully above the line; its baseline is high enough that
    // its own below-baseline modifiers clear the foot.
    const baseY = -(
      LAYOUT.pedestalFootRise +
      Math.max(block.height + LAYOUT.pedestalGap, LAYOUT.pedestalMinRiser)
    );
    elements.push(...translate(block, baseStart, baseY));
    const apexY = -LAYOUT.pedestalFootRise;
    // A compound clause on the pedestal (a coordination SPINE — "Jacob I loved,
    // but Esau I hated" as the object of "it is written", Rom 9:13) is met AT
    // its bar column, and from BELOW: the riser rises only to the bar's bottom
    // end. A full-height riser would duplicate the bar's column alongside it and
    // cut straight through the lower members' verbs.
    const barBottom = spineBarBottom(block);
    // Otherwise connect at the centre of the embedded clause's own baseline span
    // — but slide off-centre if a below-baseline modifier of the clause hangs in
    // the riser's band, so the riser (and the connector label riding it) doesn't
    // run straight through that text (Rom 9:6 "τοῦ θεοῦ / of God" under the
    // pedestal).
    const centreX = baseStart + (block.wordLeft + (block.wordRight || block.width)) / 2;
    const connectX =
      barBottom != null
        ? baseStart + block.wordLeft
        : clearStemX(
            elements.slice(elements.length - block.elements.length),
            { yTop: baseY, yBottom: apexY },
            centreX,
            baseStart + LAYOUT.pedestalFootHalf,
            baseStart + (block.wordRight || block.width) - LAYOUT.pedestalFootHalf,
          );
    // Where the riser stops: the spine bar's bottom, or a plain clause's baseline.
    const riserTop = baseY + (barBottom ?? 0);
    // The horizontal stretch of main line from the object stem out to the foot,
    // so the pedestal reads as THIS verb's direct object rather than a detached
    // "Y" floating off to the side.
    elements.push(line(eid(), sepX, 0, connectX, 0, 'solid', 'baseline', undefined, rel.id));
    // The little forked foot standing on the main line.
    elements.push(line(eid(), connectX - LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    elements.push(line(eid(), connectX + LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    // The riser up to the embedded clause.
    elements.push(line(eid(), connectX, apexY, connectX, riserTop, 'solid', 'stem', undefined, rel.id));
    // The connecting word (that / ὅτι / ἵνα) rides the riser.
    if (rel.label && showLabel(ctx, rel.dependentId)) {
      elements.push(smallText(eid(), connectX + 5, (apexY + riserTop) / 2, rel.label, 'start', rel.id, rel.labelNodeId));
    }
    x = baseStart + block.width;
    const shift = packSlice(lenBefore, sepX);
    x -= shift;
    if (!wasFork) {
      const from = drawnZeroEndBefore(lenBefore);
      if (from < sepX - shift - 0.5) {
        elements.push(line(eid(), from, 0, sepX - shift, 0, 'solid', 'baseline'));
      }
    }
  });

  // Appositives renaming the whole clause continue on the main line, past the
  // verb's own modifier cascade, each joined by the Reed-Kellogg apposition "="
  // (two short strokes across the line). A bare-word appositive sits inline; a
  // phrasal one (carrying its own modifiers, e.g. an article — τῷ βαπτισμῷ)
  // rides a PEDESTAL above the line, reached through the "=", exactly as a WORD
  // head's appositive does (see word.ts). Starting past the verb cascade keeps
  // the "=" and the appositive clear of any modifier hanging below the verb.
  if (clauseApposRels.length) {
    const APPOS_EQ_HALF = 6;
    const APPOS_EQ_GAP = 4;
    let ax = Math.max(x, vModRight) + LAYOUT.dependentGap;
    // `lineCursor` is where the CONTINUOUS main line has been drawn to so far —
    // the appositive's own baseline segment runs from here THROUGH the "=" to its
    // connection point, so the "=" straddles an unbroken line (as a WORD head's
    // appositive does) and the appositive never detaches from the clause.
    let lineCursor = drawnZeroEnd();
    for (const rel of clauseApposRels) {
      const block = ctx.layoutNode(ctx, rel.dependentId, seen);
      if (!block.elements.length) continue;
      const phrasal =
        childRelations(model, rel.dependentId).length > 0 &&
        block.height + blockAscent(block) <= LAYOUT.pedestalMaxHeight;
      const eqX = ax;
      // The "=" mark, two short strokes straddling the baseline.
      elements.push(line(eid(), eqX, -APPOS_EQ_GAP, eqX + APPOS_EQ_HALF * 2, -APPOS_EQ_GAP, 'solid', 'separator', undefined, rel.id));
      elements.push(line(eid(), eqX, APPOS_EQ_GAP, eqX + APPOS_EQ_HALF * 2, APPOS_EQ_GAP, 'solid', 'separator', undefined, rel.id));
      const afterEq = eqX + APPOS_EQ_HALF * 2 + LAYOUT.wordPadX;
      if (phrasal) {
        const baseY = -(
          LAYOUT.pedestalFootRise +
          Math.max(block.height + LAYOUT.pedestalGap, LAYOUT.pedestalMinRiser)
        );
        const apexY = -LAYOUT.pedestalFootRise;
        elements.push(...translate(block, afterEq, baseY));
        const connectX =
          afterEq +
          (block.wordLeft === block.wordRight
            ? block.wordLeft
            : (block.wordLeft + (block.wordRight || block.width)) / 2);
        // Continuous main line from where it last reached, through the "=", to
        // the pedestal's forked foot; then the little foot and the riser.
        elements.push(line(eid(), lineCursor, 0, connectX, 0, 'solid', 'baseline', undefined, rel.id));
        elements.push(line(eid(), connectX - LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
        elements.push(line(eid(), connectX + LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
        elements.push(line(eid(), connectX, apexY, connectX, baseY, 'solid', 'stem', undefined, rel.id));
        lineCursor = connectX + LAYOUT.pedestalFootHalf;
        ax = afterEq + block.width;
      } else {
        // Inline: the appositive rides the shared main line right of the "=".
        elements.push(line(eid(), lineCursor, 0, afterEq + block.wordLeft, 0, 'solid', 'baseline', undefined, rel.id));
        elements.push(...translate(block, afterEq, 0));
        baselineHeight = Math.max(baselineHeight, block.height);
        lineCursor = afterEq + (block.wordRight || block.width);
        ax = afterEq + block.width;
      }
    }
    x = Math.max(x, ax);
  }

  const baselineWidth = x;
  maxRight = Math.max(maxRight, baselineWidth, vModRight);

  // Clause-level word adjuncts cascade to the right of the whole baseline AND
  // clear of the verb's own modifier cascade (which hangs below the verb and can
  // extend past the short baseline of a verbless/implied-copula clause) — else a
  // clause-level particle/conjunction slant (μέν, δέ) lands on top of an adverbial
  // hanging under the verb.
  const railStart = Math.max(baselineWidth, vModRight);
  let bx = railStart + LAYOUT.dependentGap;
  let railRight = railStart;
  // BAND PACKING for the rail (same pattern as the complement slot): each
  // entry is drawn at its classic position — past everything's FULL width —
  // then slid left over the pocket a deep-but-narrow verb cascade or a
  // complement's hollow tail leaves free. An entry never attaches before the
  // end of the drawn complement row (`baselineWidth` + the classic gap), and
  // successive feet keep the classic dependentGap rhythm.
  let prevRailFoot = railStart - LAYOUT.dependentGap;
  railAdjuncts.forEach((r) => {
    const attachX0 = bx;
    const lenBefore = elements.length;
    const railBefore = railRight;
    const maxRightBefore = maxRight;
    railRight = Math.max(railRight, bx);
    const { right, next, footRight } = drawHanging(r, bx);
    // A coordinated adjunct spreads several feet rightward; carry the baseline out
    // to the rightmost so no slant hangs from empty space.
    railRight = Math.max(railRight, footRight);
    bx = next;
    maxRight = Math.max(maxRight, right);
    let shift = 0;
    if (ctx.pack) {
      const slice = elements.slice(lenBefore);
      const packer = new BandPacker();
      packer.occupy(elements.slice(0, lenBefore).filter((el) => !isMainLine(el)));
      const minAttach = Math.max(baselineWidth, prevRailFoot) + LAYOUT.dependentGap;
      shift = packer.reclaim(slice, attachX0 - minAttach);
      if (shift > 0) {
        ctx.packStats.shifted++;
        elements.splice(
          lenBefore,
          slice.length,
          ...translate({ width: 0, height: 0, elements: slice, wordLeft: 0, wordRight: 0 }, -shift, 0),
        );
        bx -= shift;
        if (railRight > railBefore) railRight = Math.max(railBefore, railRight - shift);
        if (maxRight > maxRightBefore) maxRight = Math.max(maxRightBefore, maxRight - shift);
      }
    }
    prevRailFoot = footRight - shift;
  });
  // Extend the baseline to carry the right-hand adjunct attachment points —
  // starting back at the DRAWN end of the line when the last complement left a
  // hollow strip (its hanging content widened the cursor past its baseline),
  // so the rail is attached rather than a floating stub.
  if (railAdjuncts.length) {
    elements.push(
      line(eid(), Math.min(baselineWidth, drawnZeroEnd()), 0, railRight, 0, 'solid', 'baseline'),
    );
  }

  let width = Math.max(baselineWidth, maxRight);
  let height = Math.max(
    baselineHeight,
    wordAdjuncts.length || verbMods.length ? belowMaxBottom : 0,
  );

  if (clauseAdjuncts.length) {
    // A subordinate / adverbial clause modifies the VERB, so its dashed connector
    // drops from the verb (the subordinator rides it), not from the subject |
    // predicate divider — the Kellogg-Reed convention and what makes an adverbial
    // participle clause in Greek read as hanging off its governing verb.
    const originX = Math.max(0, verbMidX);
    const stackTop = Math.max(baselineHeight, belowMaxBottom) + LAYOUT.adjunctDrop * ctx.vScale;
    elements.push(line(eid(), originX, 0, originX, stackTop, 'dashed', 'stem'));
    const stack = stackClauses(ctx, clauseAdjuncts, seen, originX, stackTop);
    elements.push(...stack.elements);
    width = Math.max(width, stack.right);
    height = Math.max(height, stack.bottom);
  }

  // Introductory words (γάρ, οὖν, δέ …): float above the baseline's LEFT end on a
  // short stub, joined to that end by a DOTTED vertical — Leedy's home for a word
  // that introduces the whole clause rather than modifying any one element. Two
  // or more stack one above another on the shared stem.
  //
  // Start above EVERYTHING already drawn above the line (a pedestalled subject /
  // complement raises content high into negative y), so an introductory word — or
  // a floating vocative above it — never lands on top of a pedestal.
  let topUsed = 0;
  for (const el of elements) {
    if (el.kind === 'line') topUsed = Math.min(topUsed, el.y1, el.y2);
    else if (el.kind === 'curve') topUsed = Math.min(topUsed, el.y1, el.cy, el.y2);
    else topUsed = Math.min(topUsed, el.y - (el.small ? LAYOUT.smallFontSize : LAYOUT.fontSize));
  }
  let aboveY = Math.min(
    -(LAYOUT.dividerUp + LAYOUT.slantDrop) * ctx.vScale,
    topUsed - LAYOUT.slantDrop * ctx.vScale,
  );
  if (introductoryRels.length) {
    let stubY = aboveY;
    let highest = aboveY;
    for (const r of introductoryRels) {
      const block = ctx.layoutNode(ctx, r.dependentId, seen);
      elements.push(...translate(block, 0, stubY));
      width = Math.max(width, block.width);
      highest = stubY; // the loop climbs upward, so the last stub is the topmost
      stubY -= block.height + LAYOUT.fontSize + 8;
    }
    // One dotted stem from the baseline's left end up through every stub.
    elements.push(line(eid(), 0, 0, 0, highest, 'dotted', 'stem'));
    aboveY = stubY;
  }

  // Direct address / interjection: each rides its own short line floating ABOVE
  // the clause, unconnected — it is outside the sentence's grammar.
  if (floatingRels.length) {
    // `fy` is the lowest y the next floating block may reach. A vocative can
    // carry its own modifier cascade descending `block.height` BELOW its
    // baseline (Πάτερ ἡμῶν ὁ ἐν τοῖς οὐρανοῖς, Matt 6:9) — anchoring the
    // BASELINE at the clear level dropped that cascade straight into the
    // clause (οὐρανοῖς / "heavens" printed over ἁγιασθήτω / "hallowed be"),
    // so lift each block by its own height and the cascade bottoms out at fy.
    let fy = aboveY - LAYOUT.slantDrop;
    for (const r of floatingRels) {
      const block = ctx.layoutNode(ctx, r.dependentId, seen);
      const by = fy - block.height;
      elements.push(...translate(block, 0, by));
      width = Math.max(width, block.width);
      fy = by - blockAscent(block) - LAYOUT.slantDrop;
    }
  }

  return { width, height, elements, wordLeft: 0, wordRight: baselineWidth, verbX: verbMidX };
}

// --- helpers ------------------------------------------------------------------


/**
 * The filler drawn in a pro-drop clause's empty subject slot. A finite verb names
 * its own subject by person+number, so a first/second-person verb lets us impute a
 * pronoun ("(ἐγώ)", "(you)") in place of the bald "(subject)" — read off the verb
 * node's token, or, for a compound predicate, its first conjunct verb (the fork's
 * arms agree in person with the one shared subject). Third person stays "(subject)".
 */
/**
 * When a pro-drop clause imputes its subject pronoun (`subjectFillerLabel`) AND
 * the verb's DISPLAYED text already begins with that same pronoun — which happens
 * in English-gloss mode, where a Greek finite verb's gloss fuses in its subject
 * ("ἐνετειλάμην" → "I commanded") — return the verb text with that leading pronoun
 * removed, so the diagram shows the subject once ("(I) | commanded") rather than
 * twice. Returns undefined (no change) when nothing duplicates: the Greek surface
 * ("ἐνετειλάμην" vs the pronoun "ἐγώ") never matches, so source mode is untouched,
 * and a gloss that doesn't lead with the pronoun ("disciple" under "(you)") is
 * left alone. Matching is case-insensitive on the first whitespace-delimited word;
 * a strip that would empty the verb is refused.
 */
function stripLeadingImputedPronoun(
  verbText: string,
  impliedLabel: string,
): string | undefined {
  const pronoun = impliedLabel.replace(/^\(/, '').replace(/\)$/, '').trim();
  if (!pronoun) return undefined;
  const m = verbText.match(/^(\S+)(\s+)(.+)$/);
  if (!m || m[1]!.toLowerCase() !== pronoun.toLowerCase()) return undefined;
  return m[3];
}

function subjectFillerLabel(ctx: Ctx, verbNode: SyntaxNode | undefined): string {
  const verbTokenIds = verbNode
    ? [
        ...verbNode.tokenIds,
        ...wordConjunctRels(ctx, verbNode.id).flatMap(
          (r) => getNode(ctx.doc.syntax, r.dependentId)?.tokenIds ?? [],
        ),
      ]
    : [];
  for (const id of verbTokenIds) {
    const tok = ctx.doc.tokens.find((t) => t.id === id);
    const pronoun = impliedSubjectPronoun(tok?.morphology, ctx.doc.language);
    if (pronoun) return `(${pronoun})`;
  }
  return '(subject)';
}
