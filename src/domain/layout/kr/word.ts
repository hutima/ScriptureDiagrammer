import type { SyntacticRole, SyntaxNode } from '@/domain/schema';
import { childRelations, getNode, nodeText } from '@/domain/model';
import { LAYOUT } from '../constants';
import { measureText } from '../measure';
import type { DiagramElement } from '../types';
import {
  ELISION_MARK,
  isClauseChild,
  isDiagonalCoordination,
  isDiagonalModifier,
  isInfinitival,
  ppConjunctRels,
  prepObjectId,
  showLabel,
  wordPos,
  wordTone,
} from './classify';
import { blockAscent } from './geometry';
import { drawDiagonalCoordination, drawDiagonalModifier } from './diagonal';
import { drawInfinitive, infinitiveMark } from './infinitives';
import { drawPp, drawPpCoordination } from './prepositions';
import { eid, line, smallText, translate, wordText } from './primitives';
import type { Block, Ctx } from './types';

/**
 * WORD / HEAD layout — a head word\'s baseline with its modifier cascade
 * beneath it: diagonal leaves, PPs, infinitives, appositions (inline "=" or
 * pedestalled), and clause dependents stacked on a dotted stem (via the
 * ctx.stackClauses dispatcher — clause layout itself still lives in engine.ts).
 */

export function layoutHead(
  ctx: Ctx,
  node: SyntaxNode,
  seen: Set<string>,
  collapsed = false,
  excludeCoordination = false,
  excludeApposIds?: ReadonlySet<string>,
): Block {
  const text = nodeText(ctx.doc, node) || node.label || (node.implied ? ELISION_MARK : '∅');
  const wordW = measureText(text) + LAYOUT.wordPadX * 2;

  // Every dependent of a word hangs beneath it. Word/modifier dependents flow
  // horizontally in a row (adjectives, adverbs, prepositional phrases); clause
  // dependents (relative/complement clauses) are tall, so they stack vertically
  // on a shared stem instead — keeping the diagram narrow and untangled. When
  // this word heads a coordination, its conjunct/coordinator children are drawn
  // by the fork (layoutCoordination), so they are excluded here.
  const depRels = (collapsed ? [] : childRelations(ctx.doc.syntax, node.id)).filter(
    // A coordinator word is NEVER a modifier — it is drawn by the coordination
    // fork/spine (and a coordinator sitting on a CONJUNCT, e.g. the ἀλλά of an
    // "οὐ … ἀλλά" pair, is hoisted onto the fork bar by layoutCoordination). So it
    // is always excluded here; otherwise it would be drawn as a stray slant.
    // Conjuncts are excluded only when this node is itself drawn as a coordination.
    (r) => r.type !== 'coordinator' && (!excludeCoordination || r.type !== 'conjunct'),
  );
  // An infinitive phrase hangs as a modifier (empty diagonal + horizontal), not
  // as a stacked clause, so it is grouped with the word-level dependents.
  const allWordRels = depRels.filter(
    (r) => !isClauseChild(ctx, r.dependentId) || isInfinitival(ctx, r.dependentId),
  );
  // Appositives continue on the head's own baseline; everything else cascades
  // below as a modifier. (A coordination may instead hoist its SUMMARY
  // appositions onto a platform off the fork, so it passes those relation ids to
  // exclude here — a pre-member inline appositive still rides the head member.)
  const apposRels = allWordRels.filter(
    (r) => r.type === 'apposition' && !excludeApposIds?.has(r.id),
  );
  // Light closed-class leaves (article, adjective, possessive) tuck in CLOSEST to
  // the head; heavy sub-baseline modifiers (a genitive NP, a prepositional
  // phrase) cascade out to the right after them. Without this an article ends up
  // stranded far to the right of its noun, past a long genitive chain, looking
  // detached (e.g. βασιλείαν … τὴν). Stable sort preserves order within a class.
  const isLeaf = (r: { type: SyntacticRole; dependentId: string }) =>
    r.type !== 'conjunct' && !prepObjectId(ctx, r) && isDiagonalModifier(ctx, r.dependentId);
  const wordRels = allWordRels
    .filter((r) => r.type !== 'apposition')
    .sort((a, b) => Number(isLeaf(b)) - Number(isLeaf(a)));
  const clauseRels = depRels.filter(
    (r) => isClauseChild(ctx, r.dependentId) && !isInfinitival(ctx, r.dependentId),
  );

  const elements: DiagramElement[] = [];
  const depTop = LAYOUT.slantDrop * ctx.vScale;
  // The head word sits at the left of its baseline; modifiers cascade to the
  // right and hang below on diagonals, the way a Kellogg-Reed noun/verb carries
  // its modifiers. The baseline is extended rightward to reach them.
  const wordLeft = 0;
  const wordRight = wordW;
  elements.push(wordText(eid(), wordW / 2, -LAYOUT.textRise, text, 'middle', node, wordTone(ctx, node)));
  // Leedy identifies an infinitive with a double vertical crossing its baseline.
  if (wordPos(ctx, node.id) === 'infinitive') {
    elements.push(...infinitiveMark(wordW));
  }

  let cursor = wordW;
  let railRight = wordW;
  let belowBottom = 0; // absolute lowest y reached by any dependent

  // An appositive RENAMES the head, so it is joined by the Reed-Kellogg apposition
  // mark "=" (two short strokes across the baseline) — never run on as a second
  // object/complement. A bare-word appositive sits inline right of the head; a
  // PHRASAL / clausal appositive (one carrying its own modifiers, e.g. "τὸ ὄνομα
  // = τὸ ὑπὲρ πᾶν ὄνομα" in Php 2:9) is too big to read inline, so it rides a
  // PEDESTAL above the line — like a clausal complement — reached through the "=".
  const EQ_HALF = 6;
  const EQ_GAP = 4;
  const drawEquals = (atX: number, relId: string) => {
    elements.push(line(eid(), atX, -EQ_GAP, atX + EQ_HALF * 2, -EQ_GAP, 'solid', 'separator', undefined, relId));
    elements.push(line(eid(), atX, EQ_GAP, atX + EQ_HALF * 2, EQ_GAP, 'solid', 'separator', undefined, relId));
  };
  // Lay each appositive out NOW (before the modifiers, the same layout order as
  // always, so shared-`seen` semantics are unchanged) but decide where to DRAW it
  // after the modifier row below is measured. An appositive that DIPS BELOW the
  // baseline — a coordination fork straddling the line ("τὰ ὁρατὰ καὶ τὰ
  // ἀόρατα"), or a phrase too tall for a pedestal — must start PAST the head's
  // own below-hanging modifiers, or the fork's lower arm overprints the PPs
  // hanging under the word (the Col 1:16 "τὰ πάντα ἐν τοῖς οὐρανοῖς καὶ ἐπὶ τῆς
  // γῆς, τὰ ὁρατὰ καὶ τὰ ἀόρατα" clash). The modifiers stay directly under their
  // word — it is the appositive that shifts right along the shared baseline.
  const apposLaid = apposRels.map((rel) => {
    const block = ctx.layoutNode(ctx, rel.dependentId, seen);
    const phrasal =
      block.elements.length > 0 &&
      (isClauseChild(ctx, rel.dependentId) ||
        childRelations(ctx.doc.syntax, rel.dependentId).length > 0) &&
      block.height + blockAscent(block) <= LAYOUT.pedestalMaxHeight;
    return { rel, block, phrasal };
  });
  // A pedestalled appositive sits fully above the line; only an inline one with
  // real height reaches below the baseline where the modifier cascade lives.
  const apposDipsBelow = apposLaid.some(({ block, phrasal }) => !phrasal && block.height > 0);

  // A modifier hangs BELOW the head word, attaching from the middle of the word
  // — ALWAYS, even when the word also carries an appositive. The appositive sits
  // to the right (or on a pedestal); the word's own modifiers (its article,
  // adjectives) belong directly under it, not pushed out past the appositive.
  cursor = wordW / 2 - LAYOUT.dependentGap;

  wordRels.forEach((rel) => {
    cursor += LAYOUT.dependentGap;
    const objId = prepObjectId(ctx, rel);
    const ppConj = objId ? ppConjunctRels(ctx, rel.dependentId) : [];
    if (isInfinitival(ctx, rel.dependentId)) {
      // Infinitive phrase: empty diagonal to its own horizontal baseline.
      const ext = drawInfinitive(ctx, rel, cursor, depTop, seen, elements);
      railRight = Math.max(railRight, cursor);
      belowBottom = Math.max(belowBottom, ext.bottom);
      cursor = ext.right;
    } else if (objId && ppConj.length) {
      // Coordinated prepositional phrases ("ἐν τοῖς οὐρανοῖς καὶ ἐπὶ τῆς γῆς"):
      // every conjunct PP drawn side by side, joined by the coordinator.
      const ext = drawPpCoordination(ctx, rel, objId, ppConj, cursor, depTop, seen, elements);
      cursor = ext.right;
      railRight = Math.max(railRight, cursor);
      belowBottom = Math.max(belowBottom, ext.bottom);
    } else if (objId) {
      // Preposition written ALONG the diagonal; object on its baseline below. Drop
      // deeper by the object's ascent so a coordinated object clears the head line.
      // Extend the head's baseline over the PP's object (not merely to the
      // diagonal's attach point), so the object reads as hanging UNDER the head
      // instead of floating off the baseline's right end (e.g. ἀδελφοῖς … ἐν Χριστῷ).
      const ext = drawPp(ctx, rel.dependentId, objId, rel.id, cursor, depTop, seen, elements);
      cursor = ext.right;
      railRight = Math.max(railRight, cursor);
      belowBottom = Math.max(belowBottom, ext.bottom);
    } else if (rel.type !== 'conjunct' && isDiagonalCoordination(ctx, rel.dependentId)) {
      // Coordinated adjectives/adverbs ("tall and distinguished") as parallel slants.
      const ext = drawDiagonalCoordination(ctx, rel.dependentId, cursor, elements);
      railRight = Math.max(railRight, cursor);
      belowBottom = Math.max(belowBottom, ext.bottom);
      cursor = ext.right;
    } else if (rel.type !== 'conjunct' && isDiagonalModifier(ctx, rel.dependentId)) {
      // Closed-class modifier written ALONG its diagonal; no sub-baseline. It may
      // carry its own qualifier ("very friendly") as a further slant. The
      // run/drop scale to the word so a long possessive (ἡμῶν) hangs clear of
      // the head's baseline instead of clashing with it.
      const n2 = getNode(ctx.doc.syntax, rel.dependentId)!;
      const attachX = cursor;
      const ext = drawDiagonalModifier(ctx, n2, attachX, 0, rel.id, elements);
      railRight = Math.max(railRight, attachX);
      belowBottom = Math.max(belowBottom, ext.bottom);
      cursor = ext.right;
    } else {
      // A noun modifier / phrase keeps its own sub-baseline, hung on a stem.
      const block = ctx.layoutNode(ctx, rel.dependentId, seen);
      const oTop = depTop + blockAscent(block);
      const attachX = cursor;
      const objX = cursor + LAYOUT.diagRun;
      elements.push(...translate(block, objX, oTop));
      elements.push(line(eid(), attachX, 0, objX + block.wordLeft, oTop, 'solid', 'stem', undefined, rel.id));
      if (rel.label && showLabel(ctx, rel.dependentId)) {
        elements.push(smallText(eid(), attachX + 4, oTop - 6, rel.label, 'start', rel.id));
      }
      railRight = Math.max(railRight, attachX);
      belowBottom = Math.max(belowBottom, oTop + block.height);
      cursor = objX + block.width;
    }
  });

  // Right edge of the modifier cascade (`cursor` advances monotonically through
  // the loop above) — part of the block's width whether or not appositives follow.
  const modRight = cursor;

  // Appositives continue on the shared baseline right of the head — right after
  // the word as always, EXCEPT that one dipping below the line starts past the
  // modifier cascade, so the two never overprint (see the note above `apposLaid`).
  cursor = apposDipsBelow && wordRels.length ? Math.max(wordW, modRight) : wordW;
  apposLaid.forEach(({ rel, block, phrasal }) => {
    cursor += LAYOUT.wordPadX;
    drawEquals(cursor, rel.id);
    const afterEq = cursor + EQ_HALF * 2 + LAYOUT.wordPadX;
    if (phrasal) {
      // Pedestal: a forked foot on the baseline, a riser up to the appositive's
      // own baseline (the platform), reached from the "=" by a short stretch.
      const baseY = -(
        LAYOUT.pedestalFootRise +
        Math.max(block.height + LAYOUT.pedestalGap, LAYOUT.pedestalMinRiser)
      );
      const apexY = -LAYOUT.pedestalFootRise;
      elements.push(...translate(block, afterEq, baseY));
      // The riser must meet the appositive at its connection point: a block
      // exposing a fork junction (wordLeft === wordRight — a compact coordination
      // on the pedestal) is met AT the junction; a word-headed block at the
      // middle of its head word's baseline span.
      const connectX =
        afterEq +
        (block.wordLeft === block.wordRight
          ? block.wordLeft
          : (block.wordLeft + (block.wordRight || block.width)) / 2);
      elements.push(line(eid(), cursor + EQ_HALF * 2, 0, connectX, 0, 'solid', 'baseline', undefined, rel.id));
      elements.push(line(eid(), connectX - LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
      elements.push(line(eid(), connectX + LAYOUT.pedestalFootHalf, 0, connectX, apexY, 'solid', 'stem'));
      elements.push(line(eid(), connectX, apexY, connectX, baseY, 'solid', 'stem', undefined, rel.id));
      cursor = afterEq + block.width;
      // The shared head baseline reaches the pedestal's forked FOOT (both prongs) —
      // the platform's own baseline sits above the line, so extending to the block's
      // full width would trail an empty horizontal past the pedestal (Col 1:3
      // "…τοῦ Κυρίου ἡμῶν = Ἰησοῦ Χριστοῦ"). Cover the whole foot so its right prong
      // still stands on the line.
      railRight = Math.max(railRight, connectX + LAYOUT.pedestalFootHalf);
    } else {
      elements.push(...translate(block, afterEq, 0));
      belowBottom = Math.max(belowBottom, block.height);
      cursor = afterEq + block.width;
      // The shared head baseline reaches only the appositive's OWN baseline end (its
      // head word), NOT its full block width. An inline appositive whose modifiers
      // hang BELOW it — a genitive chain on "Πατρὶ" (Col 1:3) — would otherwise drag
      // the head baseline far out to the right, past everything, into empty space.
      // The block's `width` (via `cursor`) still reserves the full below-hanging extent.
      railRight = Math.max(railRight, afterEq + (block.wordRight || block.width));
    }
  });

  // The head's baseline, extended to carry appositives and modifier diagonals.
  elements.unshift(line(eid(), 0, 0, Math.max(wordW, railRight), 0, 'solid', 'baseline', node.id));

  const rowHeight = allWordRels.length ? belowBottom : 0;

  // Clause dependents stack vertically on a stem dropping from the head word.
  let bottom = rowHeight;
  // The true right edge is the widest of: the modifier cascade (`modRight`), the
  // appositive run (`cursor` after the appositive loop), and the attach-point
  // rail. Missing any one lets the block undersize and overlap what follows
  // (the predicate).
  let right = Math.max(cursor, modRight, railRight, wordW);
  if (clauseRels.length) {
    const spineX = wordW / 2;
    const topY = (rowHeight > 0 ? rowHeight : 0) + LAYOUT.adjunctDrop * ctx.vScale;
    const stack = ctx.stackClauses(ctx, clauseRels, seen, spineX, topY);
    elements.push(line(eid(), spineX, 0, spineX, topY, 'dashed', 'stem'));
    elements.push(...stack.elements);
    bottom = Math.max(bottom, stack.bottom);
    right = Math.max(right, stack.right);
  }

  return {
    width: right,
    height: allWordRels.length || clauseRels.length ? bottom : 0,
    elements,
    wordLeft,
    wordRight,
  };
}
