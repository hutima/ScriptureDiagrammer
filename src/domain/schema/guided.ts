import { z } from 'zod';

/**
 * GRAMMAR HIGHLIGHTS — the guided syntax-reading mode.
 *
 * A guide is a curated, DATA-DRIVEN walkthrough of one passage's syntax
 * diagram, written for lay Bible-study readers: each step focuses (pans/zooms
 * to and highlights) part of the diagram and explains, in devotional-register
 * prose, why that piece of Greek grammar matters for reading the verse. Guides
 * are authored against the REAL, stable ids of a bundled passage document
 * (token/node/relation ids from the SBLGNT Lowfat base — dump them with
 * `npm run dump-syntax -- 'sblgnt:<ref>'`), never against generated element
 * ids, so they survive layout changes.
 *
 * Content guardrails (enforced editorially, recorded here for authors):
 * - Tone: Bible-study/devotional, not academic; English translations are
 *   affirmed, never undermined.
 * - Aspect caution: never "aorist = once-for-all" or "present = always
 *   continuous"; say how the action is VIEWED and let context set the weight.
 * - Contested passages: fair summaries of the major readings; grammar opens
 *   and constrains the question, it rarely settles whole doctrines.
 *
 * Guided mode is a LENS over the normal syntax pipeline: it loads a bundled
 * KrDocument as the current passage and drives Explore-mode focus/highlights.
 * It never mutates documents and it is unrelated to Discourse mode.
 */

export const GuidedDisplayModeSchema = z.enum(['greek', 'english']);
export type GuidedDisplayMode = z.infer<typeof GuidedDisplayModeSchema>;

/** Stable focus targets — always real ids from the bundled passage. */
export const GuidedFocusSchema = z.object({
  tokenIds: z.array(z.string()).optional(),
  nodeIds: z.array(z.string()).optional(),
  relationIds: z.array(z.string()).optional(),
});
export type GuidedFocus = z.infer<typeof GuidedFocusSchema>;

export const GuidedPanZoomSchema = z.object({
  /** What the camera should fit; defaults to the step's focus targets. */
  fit: z.enum(['tokens', 'nodes', 'relations', 'whole-diagram']).default('nodes'),
  padding: z.number().optional(),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
});
export type GuidedPanZoom = z.infer<typeof GuidedPanZoomSchema>;

/**
 * Optional per-step diff-style emphases, using the app-wide diff colors
 * (added = blue, changed = yellow, removed = red) plus a neutral emphasis.
 * Never color-only in the UI: the renderer pairs these with outline/opacity.
 */
export const GuidedHighlightsSchema = z.object({
  addedNodeIds: z.array(z.string()).optional(),
  changedNodeIds: z.array(z.string()).optional(),
  removedNodeIds: z.array(z.string()).optional(),
  emphasizedNodeIds: z.array(z.string()).optional(),
  relationIds: z.array(z.string()).optional(),
});
export type GuidedHighlights = z.infer<typeof GuidedHighlightsSchema>;

/**
 * A Greek term used in guide prose. Rendered as a tappable link wherever the
 * step body references it (by `[[termId]]` markers, see `renderGuidedBody`);
 * the detail panel shows the full parsing so the step card can stay readable.
 */
export const GuidedGreekTermSchema = z.object({
  id: z.string(),
  /** The token this term anchors to in the bundled passage. */
  tokenId: z.string(),
  surface: z.string(),
  transliteration: z.string(),
  lemma: z.string(),
  gloss: z.string(),
  /** Human-readable parsing, e.g. "aorist active imperative, 2nd plural". */
  parsing: z.string(),
  explanation: z.string(),
  implication: z.string().optional(),
  caution: z.string().optional(),
});
export type GuidedGreekTerm = z.infer<typeof GuidedGreekTermSchema>;

/**
 * Optional, ADDITIVE link from a step to a contested-syntax issue (§14 of
 * CLAUDE.md): the step card offers "See the alternate reading", which opens the
 * normal alternate-readings panel for that issue. Always a REAL issue id from
 * the curated registry (validated by `guided:check`), and the issue must apply
 * to the step's own passage (by `passageId` or `mergePassageIds`); the card
 * renders nothing when the issue cannot be resolved.
 */
export const GuidedStepContestedSchema = z.object({
  /** Id of a `ContestedSyntaxIssue` in the curated registry. */
  issueId: z.string(),
  /** Optional short lead-in shown beside the affordance. */
  note: z.string().optional(),
});
export type GuidedStepContested = z.infer<typeof GuidedStepContestedSchema>;

export const GuidedStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  /**
   * Devotional-register body. May reference Greek terms as `[[termId]]`
   * (rendered as a tappable term link showing the term's surface form).
   */
  body: z.string(),
  /**
   * The bundled passage this step is about, for guides that walk more than one
   * sentence (e.g. a multi-verse narrative, or a two-gospel comparison). MUST
   * be one of the guide's `bundledPassageIds`. Omit for a single-passage guide
   * (the step stays on the guide's first passage). When a step names a
   * different passage than the one currently loaded, guided mode loads it
   * before focusing — so a guide can move the reader across sentences.
   */
  passageId: z.string().optional(),
  focus: GuidedFocusSchema.default({}),
  panZoom: GuidedPanZoomSchema.optional(),
  highlights: GuidedHighlightsSchema.optional(),
  /** "Why it matters" — kept apart from the body so the card can style it. */
  implication: z.string().optional(),
  /** A guard against over-reading the grammar. */
  caution: z.string().optional(),
  /** Terms surfaced as chips under this step (besides inline links). */
  greekTermIds: z.array(z.string()).optional(),
  /** Optional pointer to a contested-syntax issue this step teaches from. */
  contested: GuidedStepContestedSchema.optional(),
});
export type GuidedStep = z.infer<typeof GuidedStepSchema>;

/** A fair summary of a debated reading, for contested passages. */
export const GuidedDebateViewSchema = z.object({
  label: z.string(),
  summary: z.string(),
  cautions: z.array(z.string()).optional(),
});
export const GuidedDebateSummarySchema = z.object({
  issue: z.string(),
  views: z.array(GuidedDebateViewSchema).min(2),
  /** How the grammar OPENS the question (it does not close it). */
  grammarOpensQuestionHow: z.string(),
});
export type GuidedDebateSummary = z.infer<typeof GuidedDebateSummarySchema>;

export const GuidedDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type GuidedDifficulty = z.infer<typeof GuidedDifficultySchema>;

export const GrammarHighlightGuideSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Human reference, e.g. "Hebrews 1:1–4". */
  reference: z.string(),
  /** Guides are authored against the SBLGNT Lowfat base only (for now). */
  sourceId: z.literal('macula-greek-sblgnt-lowfat'),
  /**
   * The bundled passage documents this guide walks through (ids of documents
   * in the guided fixture, e.g. "sblgnt_hebrews_0"). The first is opened when
   * the guide starts.
   */
  bundledPassageIds: z.array(z.string()).min(1),
  defaultDiagramMode: z
    .enum(['kellogg-reed', 'phrase-block', 'dependency', 'dependency-tree', 'constituency', 'morphology'])
    .default('kellogg-reed'),
  difficulty: GuidedDifficultySchema,
  /** One-or-two-sentence picker blurb. */
  summary: z.string(),
  /** Optional devotional frame shown before step 1. */
  devotionalFrame: z.string().optional(),
  /** Optional confessional note (kept distinct from the fair debate summary). */
  confessionalFrame: z.string().optional(),
  debateSummary: GuidedDebateSummarySchema.optional(),
  steps: z.array(GuidedStepSchema).min(1),
  greekTerms: z.array(GuidedGreekTermSchema).default([]),
});
export type GrammarHighlightGuide = z.infer<typeof GrammarHighlightGuideSchema>;

export const GrammarHighlightsRegistrySchema = z.object({
  version: z.literal(1),
  guides: z.array(GrammarHighlightGuideSchema),
});
export type GrammarHighlightsRegistry = z.infer<typeof GrammarHighlightsRegistrySchema>;
