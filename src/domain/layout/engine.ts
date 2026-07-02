import type { KrDocument, LayoutHints } from '@/domain/schema';
import { docDirection, getNode } from '@/domain/model';
import { LAYOUT } from './constants';
import type { DiagramLayout } from './types';
import type { TreeOrientation } from './modes/tree-layout';
import { layoutClause, stackClauses } from './kr/clause';
import { layoutCoordination } from './kr/coordination';
import { layoutHead } from './kr/word';
import type { Block, Ctx } from './kr/types';
import { isWordCoordination } from './kr/classify';
import { bounds, emptyBlock, mirrorX, resetEid, translate } from './kr/primitives';

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