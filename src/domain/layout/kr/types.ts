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
}
