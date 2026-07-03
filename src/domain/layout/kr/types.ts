import type { KrDocument, LayoutHints } from '@/domain/schema';
import type { DiagramElement } from '../types';

/**
 * Internal shapes of the Kellogg-Reed layout engine (see ../engine.ts).
 */
/** A laid-out subtree, baseline at local y = 0, occupying x ∈ [0, width]. */
export interface Block {
  width: number;
  height: number; // extent below the baseline (y grows downward)
  elements: DiagramElement[];
  /** The head word's baseline span, used to attach the parent connector. */
  wordLeft: number;
  wordRight: number;
  /** For a clause block: the x of its predicate verb, so coordinated clauses can
   *  be joined verb-to-verb (the compound-sentence convention). */
  verbX?: number;
}

export interface Ctx {
  doc: KrDocument;
  hints: LayoutHints;
  /** Multiplier on vertical gaps (user-tunable row spacing). 1 = default. */
  vScale: number;
  /** Tint words by grammatical category (Morphology palette). Off by default. */
  color: boolean;
  /**
   * Band packing on/off (see kr/packing.ts). layoutDocument lays out packed
   * first; if anything shifted it lays out AGAIN with packing off and keeps
   * the packed result only when it is strictly smaller — a width saved inside
   * one block can flip a downstream width-sensitive policy (e.g. the clause
   * spine's verb-alignment outlier rule) and enlarge the whole picture, so
   * packing must PAY FOR ITSELF at the document level or be dropped wholesale.
   */
  pack: boolean;
  /** Count of blocks the packer actually moved this pass (0 ⇒ output is
   *  byte-identical to classic and no comparison pass is needed). */
  packStats: { shifted: number };
  /**
   * Recursion dispatchers — the graph entrypoints (node dispatch, clause
   * stacking) still live in ../engine.ts until their own extraction stage.
   * Extracted kr/ modules recurse back THROUGH the context instead of
   * importing the engine, so there are no module cycles.
   */
  layoutNode: (ctx: Ctx, nodeId: string, seen: Set<string>) => Block;
  stackClauses: (
    ctx: Ctx,
    rels: { id: string; dependentId: string; label?: string; labelNodeId?: string }[],
    seen: Set<string>,
    spineX: number,
    topY: number,
  ) => { elements: DiagramElement[]; right: number; bottom: number };
}
