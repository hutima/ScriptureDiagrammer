import type { KrDocument, LayoutHints, Relation, SyntacticRole, SyntaxNode } from '@/domain/schema';
import { childRelations, docDirection, getNode, impliedSubjectPronoun, nodeText } from '@/domain/model';
import { LAYOUT } from './constants';
import { measureText, SMALL_FONT } from './measure';
import type { DiagramElement, DiagramLayout } from './types';
import type { TreeOrientation } from './modes/tree-layout';
import { drawDiagonalCoordination, drawDiagonalModifier } from './kr/diagonal';
import { drawInfinitive } from './kr/infinitives';
import { drawPp, drawPpCoordination } from './kr/prepositions';
import { layoutHead } from './kr/word';
import type { Block, Ctx } from './kr/types';
import {
  BASELINE_COMPLEMENTS,
  ELISION_MARK,
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
  wordTone,
} from './kr/classify';
import {
  blockAscent,
  pedestalRoom,
  rightWithinBand,
} from './kr/geometry';
import {
  coordinatorMarks,
  coordinatorTexts,
  reserveJoinSpans,
} from './kr/coordinators';
import {
  bounds,
  eid,
  emptyBlock,
  impliedBlock,
  line,
  mirrorX,
  resetEid,
  smallText,
  translate,
  wordText,
} from './kr/primitives';

/**
 * LAYOUT ENGINE — maps the syntax model to pure geometry.
 *
 * It walks the syntax graph top-down from the root clause and never consults
 * surface token order for structure (only for rendering a node's own text). The
 * output is a flat list of primitives the SVG renderer draws verbatim.
 *
 * The recursion is built from two block-producing functions:
 *   - layoutHead   a word + its modifier dependents stacked beneath it
 *   - layoutClause a baseline (subject | predicate + complements) + adjuncts
 * Either may contain the other, so relative clauses, participial clauses, and
 * nested coordination all compose naturally.
 */

export interface LayoutOptions {
  /** Row-spacing multiplier on vertical gaps (default 1). */
  verticalScale?: number;
  /**
   * Tint each word by its grammatical category (case / finite verb / participle),
   * using the SAME palette as the Morphology Clause mode. Off by default — the
   * classic diagram is plain ink; the user opts in with the colour toggle. Colour
   * only ever accompanies the word itself, so it is never the only cue.
   */
  colorMode?: boolean;
  /**
   * Mirror the finished diagram horizontally so it reads RIGHT-TO-LEFT (Hebrew):
   * subject on the right, the baseline running leftward, modifiers slanting the
   * mirrored way. Defaults to true for `language: 'hbo'` documents. The geometry
   * is computed left-to-right exactly as for Greek/English and only the final
   * placement is flipped, so all the layout logic stays direction-agnostic.
   */
  rtl?: boolean;
  /**
   * Growth direction of the TREE visualizations (Dependency Tree, Constituency
   * Tree): `'horizontal'` (default) reads left-to-right so loading several
   * passages stacks them down the page; `'vertical'` is the classic top-down
   * shape. Ignored by the non-tree modes.
   */
  treeOrientation?: TreeOrientation;
  /**
   * Which tree the CONSTITUENCY mode draws: `'auto'` (default — the preserved
   * source `<wg>` hierarchy when the document carries one, else the
   * reconstruction), `'source'`, or `'reconstructed'`. The mode captions the
   * diagram with whichever tree is actually shown. Ignored by other modes.
   */
  constituencyVariant?: 'auto' | 'source' | 'reconstructed';
}

export function layoutDocument(
  doc: KrDocument,
  hints: LayoutHints = {},
  options: LayoutOptions = {},
): DiagramLayout {
  resetEid();
  const ctx: Ctx = {
    doc,
    hints,
    layoutNode,
    stackClauses,
    vScale: Math.max(0.5, options.verticalScale ?? 1),
    color: options.colorMode ?? false,
  };
  const root = getNode(doc.syntax, doc.syntax.rootId);
  if (!root) return { width: 200, height: 80, elements: [] };

  const block = layoutNode(ctx, root.id, new Set());
  // Flag connectors for low-confidence (ambiguous) relations so both the canvas
  // and the export draw them in a distinct colour, inviting the user to relink.
  const tentative = new Set(
    doc.syntax.relations
      .filter((r) => r.provenance?.source === 'inferred' && r.provenance.confidence === 'low')
      .map((r) => r.id),
  );
  if (tentative.size) {
    for (const el of block.elements) {
      if (el.relationId && tentative.has(el.relationId)) el.tentative = true;
    }
  }
  const m = LAYOUT.margin;
  // Normalize by the true bounding box. Most content sits at/below the baseline,
  // but a coordination fork places its upper conjunct above it (negative y), so
  // a fixed offset is not enough — measure what was actually drawn and shift it
  // fully into view. `pad` leaves slack for text ascent/descent and for words
  // written along diagonals, which can overhang their line endpoints.
  const pad = LAYOUT.fontSize;
  const { minX, minY, maxX, maxY } = bounds(block.elements);
  const width = maxX - minX + (m + pad) * 2;
  const height = maxY - minY + (m + pad) * 2;
  const placed = translate(block, m + pad - minX, m + pad - minY);
  const rtl = options.rtl ?? docDirection(doc) === 'rtl';
  return { width, height, elements: rtl ? mirrorX(placed, width) : placed };
}

/**
 * Mirror a whole laid-out diagram horizontally (any mode) — used to flip a
 * non-Kellogg-Reed mode (e.g. the phrase/block diagram) for a right-to-left
 * sentence, or to flip a diagram to match English word order on request. The KR
 * engine already mirrors internally via its `rtl` option; this lets the other
 * modes get the same treatment without each re-implementing it.
 */
export function mirrorLayout(layout: DiagramLayout): DiagramLayout {
  return { ...layout, elements: mirrorX(layout.elements, layout.width) };
}

function layoutNode(ctx: Ctx, nodeId: string, seen: Set<string>): Block {
  if (seen.has(nodeId)) return emptyBlock();
  seen.add(nodeId);
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node) return emptyBlock();
  const hint = ctx.hints[nodeId];
  const block =
    node.kind === 'clause'
      ? layoutClause(ctx, node, seen)
      : isWordCoordination(ctx, node)
        ? layoutCoordination(ctx, node, seen, false)
        : layoutHead(ctx, node, seen, hint?.collapsed === true);
  // Apply a user nudge by translating the block's drawing without changing the
  // space its parent reserved (a deliberate, predictable override).
  if (hint && (hint.offsetX || hint.offsetY)) {
    return { ...block, elements: translate(block, hint.offsetX ?? 0, hint.offsetY ?? 0) };
  }
  return block;
}
/**
 * Stack clause-valued dependents vertically on a shared vertical stem rooted at
 * (`spineX`, `topY`). Each clause is laid out fully and hung off the stem by a
 * short horizontal connector, so coordinated and subordinate clauses read top
 * to bottom rather than sprawling across the page. Returns the placed elements
 * plus the extent reached (`right`, `bottom`) in the caller's coordinate space.
 */
function stackClauses(
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

  const laidRels = rels.map((r) => ({ r, block: layoutNode(ctx, r.dependentId, seen) }));
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
  const laid = memberRels.map((r) => ({ r, block: layoutNode(ctx, r.dependentId, seen) }));
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
        // Centre the connector in the GAP between the previous clause's lowest
        // point and this clause's highest — so with a tall upper member (a
        // compound-predicate fork) it sits halfway between the clauses rather than
        // riding the bottom arm of the fork above it.
        const prevBottom = verbYs[i - 1]! + (laid[i - 1]?.block.height ?? 0);
        const thisTop = y - blockAscent(block);
        const midY = (prevBottom + thisTop) / 2;
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
    const blocks = leadRels.map((r) => layoutNode(ctx, r.dependentId, seen));
    const totalW = blocks.reduce((s, b) => s + b.width, 0) + GAPW * Math.max(0, blocks.length - 1);
    // Sit ABOVE the first member's full height (a tall member — e.g. a compound
    // predicate whose upper verb rises well above its baseline — would otherwise
    // put the lead word in the MIDDLE of the fork) AND above the first member's
    // connector-label stub, which occupies that same band. The stem then drops
    // from the lead down to the top of the spine bar.
    const ascent0 = laid[0] ? blockAscent(laid[0].block) : 0;
    const leadY = Math.min(top - ascent0, firstStubTop) - LAYOUT.fontSize - 14;
    let x = Math.max(0, verbAlignX - GAPW - totalW);
    const leadStart = x;
    for (const b of blocks) {
      elements.push(...translate(b, x, leadY));
      right = Math.max(right, x + b.width);
      x += b.width + GAPW;
    }
    const lineY = leadY + 4;
    elements.push(line(eid(), leadStart, lineY, verbAlignX, lineY, 'solid', 'baseline'));
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

/**
 * A discourse container: several independent sentences shown one above another,
 * each its own full diagram with its verse reference floated above it. The
 * sentences are NOT connected — this is a reading aid, a passage on one canvas.
 */
function layoutDiscourse(
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
    const block = layoutNode(ctx, r.dependentId, seen);
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
function layoutCoordination(
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
    ...conjunctRels.map((r) => layoutNode(ctx, r.dependentId, seen)),
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
    const ab = layoutNode(ctx, ar.dependentId, seen);
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
function isPerVerbCompound(ctx: Ctx, verbNode: SyntaxNode): boolean {
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
function layoutPredicateArm(ctx: Ctx, verbNode: SyntaxNode, seen: Set<string>): Block {
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
      const block = layoutNode(ctx, rel.dependentId, seen);
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
    const block = layoutNode(ctx, rel.dependentId, seen);
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
function layoutOpenPredicateFork(
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

/**
 * A headless coordinate clause: a clause node with no subject/predicate of its
 * own that only ties conjunct members together (the wrapper the Lowfat converter
 * emits for "A καί B"). It routes to a spine — or, for infinitives, a fork.
 */
function isHeadlessCoordinateClause(ctx: Ctx, nodeId: string): boolean {
  const node = getNode(ctx.doc.syntax, nodeId);
  if (!node || node.kind !== 'clause') return false;
  const rels = childRelations(ctx.doc.syntax, nodeId);
  const hasSubject = rels.some(
    (r) => r.type === 'subject' && !getNode(ctx.doc.syntax, r.dependentId)?.implied,
  );
  const hasPredicate = rels.some((r) => r.type === 'predicate' || r.type === 'copula');
  return !hasSubject && !hasPredicate && rels.some((r) => r.type === 'conjunct');
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
function layoutInfinitiveFork(ctx: Ctx, clause: SyntaxNode, seen: Set<string>): Block | null {
  const collected = collectInfinitiveFork(ctx, clause.id);
  if (!collected) return null;
  const { members, coords, leadRels } = collected;
  const arms = members.map((id) => layoutNode(ctx, id, seen));
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
  // The conjunction rides just to the RIGHT of the bar, in the open wedge between
  // the two arm baselines — clear of the diagonal prongs converging on the
  // junction to its left, which would otherwise cross through it.
  elements.push(...coordinatorMarks(coords, baselines.map((b) => b - centerY), prong + 9));

  // Lead words (a negator like οὐκ, an introductory particle) sit above the top
  // arm on a short stub joined down to the top of the bar — the same home the
  // spine gives them.
  if (leadRels.length) {
    const GAPW = 10;
    const blocks = leadRels.map((r) => layoutNode(ctx, r.dependentId, seen));
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

function layoutCompoundPredicate(ctx: Ctx, verbNode: SyntaxNode, seen: Set<string>): Block {
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

function layoutClause(ctx: Ctx, clause: SyntaxNode, seen: Set<string>): Block {
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
  const verbBlock = verbNode
    ? layoutHead(ctx, verbNode, seen, true)
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
    const probe = layoutNode(ctx, subjectRel!.dependentId, new Set(seen));
    // A clausal subject rides a pedestal in the subject slot. Unlike a clause
    // COMPLEMENT (which can fall back to a dotted stem below when tall), a subject
    // has no such fallback — laid out inline, a compound subject clause leaves the
    // subject|predicate divider (and the predicate) stranded past the gap where its
    // baseline stops. So pedestal it regardless of height, keeping the main line
    // continuous through to the verb.
    pedestalSubject = probe.elements.length > 0;
  }
  const subjectBlock = !subjectRel
    ? impliedBlock(subjectFillerLabel(ctx, verbNode))
    : pedestalSubject
      ? emptyBlock() // drawn as a pedestal below, not inline
      : subjectNode && isWordCoordination(ctx, subjectNode)
        ? layoutCoordination(ctx, subjectNode, seen, true)
        : layoutNode(ctx, subjectRel.dependentId, seen);

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
    block: layoutNode(ctx, r.dependentId, seen),
  }));

  // Compact clause complements → pedestals; the rest defer to the stem below.
  // Probe each with a CLONED `seen` so measuring doesn't consume the node (it is
  // laid out for real at its draw site — the pedestal here, or stackClauses below).
  const pedestalRels: Relation[] = [];
  const pedestalled = new Set<string>();
  for (const r of verbRels) {
    if (!isCoreSlot(r) || !isClauseChild(ctx, r.dependentId)) continue;
    if (isInfinitival(ctx, r.dependentId)) continue; // infinitives hang on a diagonal
    const probe = layoutNode(ctx, r.dependentId, new Set(seen));
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
      const probe = layoutNode(ctx, r.dependentId, new Set(seen));
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
    const block = layoutNode(ctx, subjectRel!.dependentId, seen);
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
    // The little forked foot standing on the main line, and the riser up to the
    // substantive's own baseline.
    elements.push(line(eid(), connectX - LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    elements.push(line(eid(), connectX + LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    elements.push(line(eid(), connectX, apexY, connectX, baseY, 'solid', 'stem', undefined, subjectRel?.id));
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
    const block = layoutNode(ctx, r.dependentId, seen);
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
  const wordAdjuncts = clauseWordRels.filter(
    (r) =>
      (!isClauseChild(ctx, r.dependentId) || isInfinitival(ctx, r.dependentId)) &&
      r.type !== 'vocative' &&
      r.type !== 'interjection' &&
      r.type !== 'particle' &&
      r.type !== 'conjunction',
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
    const newX = hasBaselineSlot ? vModRight + LAYOUT.dependentGap : footEnd;
    elements.push(line(eid(), x, 0, newX, 0, 'solid', 'baseline'));
    if (hasBaselineSlot) x = newX;
  }

  // complements on the baseline, each with the appropriate separator
  complementBlocks.forEach(({ rel, block }) => {
    const sepX = x;
    if (rel.type === 'predicateNominative' || rel.type === 'predicateAdjective') {
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
    x += 6;
    // Keep the main line CONTINUOUS across the separator: bridge the verb's baseline
    // end to the complement's own baseline. Without it the predicate-nominative
    // back-slant — whose foot rests only on the complement side — leaves the verb
    // baseline ending in a bare gap right before the slant (Col 1:15 "ὅς ἐστιν \ εἰκὼν").
    elements.push(line(eid(), sepX, 0, x, 0, 'solid', 'baseline', undefined, rel.id));
    placeBlock(block);
  });

  // Noun-clause complements on pedestals, standing in their slot above the line.
  // (Their above-baseline extent is reserved by blockAscent wherever this clause
  // is later placed, since the pedestal elements live at negative y.)
  pedestalRels.forEach((rel) => {
    const block = layoutNode(ctx, rel.dependentId, seen);
    // If the clause was already laid out elsewhere (shared reference → `seen`
    // dedup returns an empty block), skip it: drawing a pedestal foot + riser for
    // empty content leaves an orphan "Y" with no baseline on top.
    if (!block.elements.length) return;
    // Object separator tick (the direct-object stem), then the pedestal foot a
    // little to its right.
    const sepX = x;
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
    // Connect at the centre of the embedded clause's own baseline span.
    const connectX = baseStart + (block.wordLeft + (block.wordRight || block.width)) / 2;
    const apexY = -LAYOUT.pedestalFootRise;
    // The horizontal stretch of main line from the object stem out to the foot,
    // so the pedestal reads as THIS verb's direct object rather than a detached
    // "Y" floating off to the side.
    elements.push(line(eid(), sepX, 0, connectX, 0, 'solid', 'baseline', undefined, rel.id));
    // The little forked foot standing on the main line.
    elements.push(line(eid(), connectX - LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    elements.push(line(eid(), connectX + LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
    // The riser up to the embedded clause's baseline.
    elements.push(line(eid(), connectX, apexY, connectX, baseY, 'solid', 'stem', undefined, rel.id));
    // The connecting word (that / ὅτι / ἵνα) rides the riser.
    if (rel.label && showLabel(ctx, rel.dependentId)) {
      elements.push(smallText(eid(), connectX + 5, (apexY + baseY) / 2, rel.label, 'start', rel.id, rel.labelNodeId));
    }
    x = baseStart + block.width;
  });

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
  railAdjuncts.forEach((r) => {
    railRight = Math.max(railRight, bx);
    const { right, next, footRight } = drawHanging(r, bx);
    // A coordinated adjunct spreads several feet rightward; carry the baseline out
    // to the rightmost so no slant hangs from empty space.
    railRight = Math.max(railRight, footRight);
    bx = next;
    maxRight = Math.max(maxRight, right);
  });
  // Extend the baseline to carry the right-hand adjunct attachment points.
  if (railAdjuncts.length) {
    elements.push(line(eid(), baselineWidth, 0, railRight, 0, 'solid', 'baseline'));
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
      const block = layoutNode(ctx, r.dependentId, seen);
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
    let fy = aboveY - LAYOUT.slantDrop;
    for (const r of floatingRels) {
      const block = layoutNode(ctx, r.dependentId, seen);
      elements.push(...translate(block, 0, fy));
      width = Math.max(width, block.width);
      fy -= block.height + LAYOUT.slantDrop;
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

