import { z } from 'zod';
import { DiscourseGranularitySchema, DiscourseRelationTypeSchema, DiscourseUnitColorSchema } from './discourse';

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
 * An external scholarly citation used in guide prose. Rendered as a real
 * hyperlink wherever the step body/devotionalFrame/implication/caution
 * references it (by the SAME `[[id]]` marker syntax as a Greek term —
 * `renderBody` checks `greekTerms` first, then `citations`), so a long
 * bibliographic citation can be shortened in the flowing prose to just its
 * `label` (e.g. "[1]"), with the full citation kept as the link's accessible
 * `title` (shown as a native tooltip) and `url` as the href. Additive; a guide
 * with no citations is unaffected.
 */
export const GuidedCitationSchema = z.object({
  id: z.string(),
  /** Short visible marker text rendered as the link itself, e.g. "[1]". */
  label: z.string(),
  /** Full bibliographic citation — the link's accessible name/tooltip. */
  title: z.string(),
  /** External URL the citation links to. */
  url: z.string().url(),
});
export type GuidedCitation = z.infer<typeof GuidedCitationSchema>;

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
  /**
   * Optional SECONDARY passage stacked beneath the primary diagram for this
   * step — a read-only comparison frame (e.g. an Old-Testament parallel laid
   * out beside the New-Testament sentence the guide is walking). It is drawn by
   * `GuidedStackedDiagram` and NEVER loaded into the editor store: the primary
   * passage (`passageId`, else the guide's first) stays the one loaded document,
   * so the reader keeps editing/inspecting the primary while seeing the parallel.
   *
   * MUST be one of the guide's `bundledPassageIds`. The secondary focus /
   * highlights address the SECONDARY passage's own ids (validated by
   * `guided:check` against that passage's id pool, not the primary's). When
   * absent the step is an ordinary single-diagram step (zero change).
   */
  secondaryPassageId: z.string().optional(),
  /** Optional heading for the stacked frame (e.g. "Genesis 17:12 — …"). */
  secondaryTitle: z.string().optional(),
  /** Focus/emphasis targets in the SECONDARY passage (its own real ids). */
  secondaryFocus: GuidedFocusSchema.optional(),
  /** Diff-style highlights in the SECONDARY passage (its own real ids). */
  secondaryHighlights: GuidedHighlightsSchema.optional(),
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
  /**
   * Usually two or more readings; a single view is allowed for the case where
   * the app deliberately presents ONE standard reading and folds a fringe
   * alternative into that view's cautions (e.g. John 1:1's "a god").
   */
  views: z.array(GuidedDebateViewSchema).min(1),
  /** How the grammar OPENS the question (it does not close it). */
  grammarOpensQuestionHow: z.string(),
});
export type GuidedDebateSummary = z.infer<typeof GuidedDebateSummarySchema>;

export const GuidedDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type GuidedDifficulty = z.infer<typeof GuidedDifficultySchema>;

/**
 * DISCOURSE-BACKED guides (`kind: 'discourse'`) do not walk a syntax diagram —
 * they host the Discourse view over one or more verse RANGES (each from any
 * discourse source: a Greek/Hebrew syntax source, or an English Bible). This is
 * for showing multi-verse / cross-passage discourse structure a Kellogg-Reed
 * diagram cannot (covenant echoes, literary chiasms). The guide's steps stay
 * prose-only (title/body/implication/caution) and drive the reader alongside the
 * shared Discourse canvas; they carry no syntax focus ids.
 */
export const GuidedDiscourseRangeSchema = z.object({
  /**
   * A `DiscourseSourceId` (kept as a plain string here so the schema never
   * depends on the io layer). Validated at load time by `loadDiscourseRange`.
   */
  sourceId: z.string(),
  /** Book number in THAT source's own numbering (Greek NT 1–27, WLC/BSB-OT 1–39…). */
  bookNum: z.number().int().positive(),
  startRef: z.string(),
  endRef: z.string(),
  granularity: DiscourseGranularitySchema.default('verse'),
  /** Optional short section heading for this range in the combined outline. */
  label: z.string().optional(),
  /**
   * Optional fallback source for this SAME range, tried when the primary
   * `sourceId` fails to load (e.g. a remote English source like `english-asv`
   * that could not be fetched). The fallback is loaded with the SAME
   * `startRef`/`endRef`/`granularity` as the primary range, only its
   * `sourceId`/`bookNum` differ — normally a bundled, always-available source
   * (e.g. `english-bsb-all`). `notice` is an honest, reader-facing note
   * surfaced in the guided step card whenever the fallback had to be used, so
   * a silent substitution never happens — the reader always sees a working
   * canvas AND knows which text produced it.
   */
  fallback: z
    .object({
      sourceId: z.string(),
      bookNum: z.number().int().positive(),
      /** Honest, reader-facing note shown in the step card when the fallback was used. */
      notice: z.string(),
    })
    .optional(),
});
export type GuidedDiscourseRange = z.infer<typeof GuidedDiscourseRangeSchema>;

/**
 * A SAMPLE, clearly-labelled correspondence arc seeded for a discourse guide's
 * display only (mirrors the Ephesians demo's sample chiasm). Endpoints address
 * units by their `refStart` (e.g. "2:12"); an arc whose refs cannot be resolved
 * in the combined document is silently skipped. Never persisted, never
 * authoritative — it is teaching scaffolding for the proposed structure.
 *
 * `sourceRef`/`targetRef` may carry an ordinal suffix — `'2:39/2'` means the
 * 2nd leaf unit (1-based, outline order) whose `refStart` is `'2:39'` — needed
 * once `seededSplits` produce several units from one verse. A plain ref (no
 * suffix) keeps meaning the first such unit.
 */
export const GuidedDiscourseArcSchema = z.object({
  id: z.string(),
  sourceRef: z.string(),
  targetRef: z.string(),
  type: DiscourseRelationTypeSchema.default('parallel'),
  label: z.string(),
  notes: z.string().optional(),
});
export type GuidedDiscourseArc = z.infer<typeof GuidedDiscourseArcSchema>;

/**
 * A SAMPLE unit coloring seeded for a discourse guide's display only, mirroring
 * `GuidedDiscourseArcSchema`: connected verses (named by their unit `refStart`s,
 * e.g. "2:12") share a `color` so the correspondence the guide is teaching is
 * visible as a highlight in addition to (or instead of) an arc. A ref that
 * cannot be resolved in the combined document is silently skipped. Never
 * persisted, never authoritative — it is teaching scaffolding for the proposed
 * structure, exactly like `seededArcs`.
 *
 * Each entry in `refs` may carry an ordinal suffix — `'2:39/2'` means the 2nd
 * leaf unit (1-based, outline order) whose `refStart` is `'2:39'` — needed once
 * `seededSplits` produce several units from one verse. A plain ref (no suffix)
 * keeps meaning the first such unit.
 */
export const GuidedDiscourseHighlightSchema = z.object({
  /** Verse refs (unit `refStart`s, e.g. "2:39") that share this color. */
  refs: z.array(z.string()).min(1),
  color: DiscourseUnitColorSchema,
});
export type GuidedDiscourseHighlight = z.infer<typeof GuidedDiscourseHighlightSchema>;

/**
 * A guide-authored request to split one loaded verse unit into several
 * PHRASE units, so a seeded arc/highlight can point at a phrase rather than a
 * whole verse (see `GuidedDiscourseArcSchema`'s `/N` sub-ref addressing).
 * Display-only teaching scaffolding, applied in-memory when the guide opens —
 * never persisted, never touches the syntax pipeline.
 */
export const GuidedDiscourseSplitSchema = z.object({
  /** The unit (by refStart) to split, e.g. '2:39'. */
  ref: z.string(),
  /**
   * One entry per split point: candidate phrases (matched case-insensitively,
   * punctuation-insensitively, against consecutive token surfaces); the FIRST
   * candidate that matches wins, and the unit is split so the matched phrase
   * STARTS the new unit. A split point with no matching candidate is skipped
   * silently (e.g. under a fallback translation with different wording).
   */
  before: z.array(z.array(z.string()).min(1)).min(1),
});
export type GuidedDiscourseSplit = z.infer<typeof GuidedDiscourseSplitSchema>;

/**
 * A guide-authored per-line indent seeded for a discourse guide's display only,
 * mirroring `GuidedDiscourseHighlightSchema`/`GuidedDiscourseArcSchema`: the unit
 * named by `ref` (its `refStart`, optionally with a `/N` ordinal — see
 * `GuidedDiscourseArcSchema`) gets an ABSOLUTE explicit `userIndent`, applied via
 * the same pure `setDiscourseUnitIndent` mutation a manual drag uses (clamped to
 * the discourse indent limits). Seeded into BOTH the base and the live doc, so it
 * is stable teaching scaffolding, resets with the guided display, and never
 * produces a user patch. A ref that cannot be resolved is silently skipped —
 * exactly like `seededArcs`/`seededHighlights`. Never touches the structural
 * `parentId`/`depth`; never mutates any syntax document.
 */
export const GuidedDiscourseIndentSchema = z.object({
  /** Verse ref (unit `refStart`, e.g. "2:13", or "2:39/2"). */
  ref: z.string(),
  /** Absolute explicit indent level (clamped to the discourse indent limits). */
  userIndent: z.number().int().nonnegative(),
});
export type GuidedDiscourseIndent = z.infer<typeof GuidedDiscourseIndentSchema>;

/**
 * A guide-authored unit label seeded for a discourse guide's display only,
 * mirroring the other seeded-* specs: the unit named by `ref` gets a plain-text
 * `label` (e.g. "Superscription — not part of the chiasm"), applied via the same
 * pure `labelDiscourseUnit` mutation. Seeded into BOTH base and live doc so it is
 * stable, resets with the display, and never produces a user patch. An
 * unresolved ref is silently skipped. Never mutates any syntax document.
 */
export const GuidedDiscourseLabelSchema = z.object({
  /** Verse ref (unit `refStart`, e.g. "46:1", or "2:39/2"). */
  ref: z.string(),
  /** The label to show on that unit's row. */
  label: z.string(),
});
export type GuidedDiscourseLabel = z.infer<typeof GuidedDiscourseLabelSchema>;

export const GuidedDiscourseSpecSchema = z.object({
  /** One or more verse ranges loaded and CONCATENATED into one discourse doc. */
  ranges: z.array(GuidedDiscourseRangeSchema).min(1),
  /**
   * Optional sample phrase-level splits applied (in order, before arcs/
   * highlights are seeded) to the combined doc for the guide's display.
   */
  seededSplits: z.array(GuidedDiscourseSplitSchema).optional(),
  /**
   * Optional guide-authored per-line indents, applied AFTER `seededSplits` and
   * BEFORE arcs/highlights so a split's phrase units can be addressed too.
   */
  seededIndents: z.array(GuidedDiscourseIndentSchema).optional(),
  /** Optional guide-authored unit labels (display scaffolding). */
  seededLabels: z.array(GuidedDiscourseLabelSchema).optional(),
  /** Optional sample arcs seeded into the combined doc for the guide's display. */
  seededArcs: z.array(GuidedDiscourseArcSchema).optional(),
  /** Optional sample unit coloring seeded into the combined doc for the guide's display. */
  seededHighlights: z.array(GuidedDiscourseHighlightSchema).optional(),
});
export type GuidedDiscourseSpec = z.infer<typeof GuidedDiscourseSpecSchema>;

export const GrammarHighlightGuideSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Human reference, e.g. "Hebrews 1:1–4". */
  reference: z.string(),
  /**
   * What the guide displays:
   *  - `'syntax'` (default) — the classic Grammar-Highlights walkthrough of a
   *    bundled passage's syntax diagram (needs `sourceId` + `bundledPassageIds`);
   *  - `'discourse'` — hosts the Discourse view over the `discourse` range spec
   *    (no syntax diagram, no bundled passages, prose-only steps).
   * Additive: absent = `'syntax'`, so every existing guide is unchanged (read
   * sites treat `undefined` as `'syntax'`). Left optional — rather than
   * `.default('syntax')` — so existing guide OBJECT LITERALS need not add it.
   */
  kind: z.enum(['syntax', 'discourse']).optional(),
  /**
   * Syntax guides are authored against the SBLGNT Lowfat base only (for now).
   * Optional because a discourse guide has no single syntax source.
   */
  sourceId: z.literal('macula-greek-sblgnt-lowfat').optional(),
  /**
   * The bundled passage documents a SYNTAX guide walks through (ids of documents
   * in the guided fixture, e.g. "sblgnt_hebrews_0"). The first is opened when
   * the guide starts. Empty for a discourse guide (which loads ranges instead).
   */
  bundledPassageIds: z.array(z.string()).default([]),
  /** Range spec for a `kind: 'discourse'` guide (required for those, else absent). */
  discourse: GuidedDiscourseSpecSchema.optional(),
  defaultDiagramMode: z
    .enum(['kellogg-reed', 'phrase-block', 'dependency', 'dependency-tree', 'constituency', 'morphology'])
    .default('kellogg-reed'),
  difficulty: GuidedDifficultySchema,
  /**
   * Optional short topic/tag labels (lowercase-style, e.g. "christology",
   * "baptism", "union with Christ"), for future browsing use. Additive: no
   * current UI filters by it, so it is safe to leave empty/absent.
   */
  topics: z.array(z.string()).optional(),
  /** One-or-two-sentence picker blurb. */
  summary: z.string(),
  /** Optional devotional frame shown before step 1. */
  devotionalFrame: z.string().optional(),
  /** Optional confessional note (kept distinct from the fair debate summary). */
  confessionalFrame: z.string().optional(),
  debateSummary: GuidedDebateSummarySchema.optional(),
  steps: z.array(GuidedStepSchema).min(1),
  greekTerms: z.array(GuidedGreekTermSchema).default([]),
  /**
   * External scholarly citations referenced from prose via `[[id]]` markers.
   * Optional (unlike `greekTerms`, which every guide literal already sets) so
   * existing guides need no change — absent means the guide cites nothing.
   */
  citations: z.array(GuidedCitationSchema).optional(),
  /**
   * Hidden guides stay registered (openGuide by id still works, and internal
   * references stay valid) but never appear in the guided library picker.
   */
  hidden: z.boolean().optional(),
  /**
   * Optional id of a contested-syntax ALTERNATE READING to apply (non-destructively,
   * via the normal `applyAlternateReadingPreview` helper) to the bundled base when
   * this guide loads its passage — so the guide can TEACH a specific construal by
   * DISPLAYING it, rather than only describing it. Additive: absent = the pristine
   * base is shown. The reading must belong to a real issue on the guide's passage;
   * the bundled base is never mutated (the alternate is applied to a fresh clone),
   * and step focus/highlight ids are validated against the RESULTING displayed doc.
   * Used for Colossians 2:11–12, whose SBLGNT base encodes the ἐν ᾧ clause as an
   * apposition to the whole raised clause; the guide displays it re-drawn as the
   * noun-headed relative clause modifying βαπτισμῷ (the shape the Nestle1904 base
   * already draws), so the walkthrough teaches that reading.
   */
  displayAlternateReadingId: z.string().optional(),
}).superRefine((guide, ctx) => {
  if (guide.kind === 'discourse') {
    if (!guide.discourse) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `discourse guide "${guide.id}" must provide a "discourse" range spec`,
        path: ['discourse'],
      });
    }
  } else {
    if (guide.bundledPassageIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `syntax guide "${guide.id}" must provide at least one bundledPassageIds entry`,
        path: ['bundledPassageIds'],
      });
    }
    if (!guide.sourceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `syntax guide "${guide.id}" must provide a sourceId`,
        path: ['sourceId'],
      });
    }
  }
});
export type GrammarHighlightGuide = z.infer<typeof GrammarHighlightGuideSchema>;

export const GrammarHighlightsRegistrySchema = z.object({
  version: z.literal(1),
  guides: z.array(GrammarHighlightGuideSchema),
});
export type GrammarHighlightsRegistry = z.infer<typeof GrammarHighlightsRegistrySchema>;
