import type { useEditorStore } from '@/state';
import type { GntTutorialBridge, TutorialStepId } from './tutorialState';

/**
 * The first-launch walkthrough steps: load John 1:1 from the bundled SBLGNT
 * and read it as an English-friendly diagram. Every step is a TOLERANT state
 * machine node, not a recording: each declares how to tell the user already
 * did it (`isDone`, so doing things out of order or ahead of time just
 * advances), what "Skip step" should do so later steps still work
 * (`applyOnSkip`), and what to show when its target control isn't on screen.
 *
 * The copy is deliberate about one thing: English words (glosses / the BSB
 * text) are READING AIDS — the diagram's structure always follows the Greek
 * grammar and syntax.
 */

/** Snapshot of everything a step may inspect or act on. */
export interface TutorialCtx {
  editor: ReturnType<typeof useEditorStore.getState>;
  bridge: GntTutorialBridge | null;
  /** The open document's id when the step became current (for change detection). */
  entryDocId: string | null;
}

export interface TutorialStepDef {
  id: TutorialStepId;
  title: string;
  body: string;
  /** Fine-print clarification shown under the body. */
  note?: string;
  /** CSS selector of the control to highlight (first match). */
  targetSelector?: string;
  /** True once the user has performed (or already had) the step's action. */
  isDone?: (ctx: TutorialCtx) => boolean;
  /** Best-effort "do it for me" used by Skip step, keeping later steps intact. */
  applyOnSkip?: (ctx: TutorialCtx) => void;
  /** Shown instead of the body when the target control isn't on screen. */
  missingText?: string;
  /** Optional recovery action offered when the target is missing. */
  recover?: { label: string; run: (ctx: TutorialCtx) => void };
}

/** Tooltip for the diagram's Greek↔English gloss toggle (also asserted in tests). */
export const GLOSS_TOGGLE_TIP =
  'Show English glosses — only the displayed words change; the structure and layout still follow the Greek/Hebrew syntax.';

/** Tooltip for the source strip's English (BSB) toggle (also asserted in tests). */
export const BSB_TOGGLE_TIP =
  'Berean Standard Bible — a parallel English translation for reading; the diagram still follows the Greek syntax.';

const showSources = {
  label: 'Show the passage list',
  run: (ctx: TutorialCtx) => {
    ctx.editor.setLeftCollapsed(false);
    ctx.bridge?.ensureJohn();
  },
};

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: 'pick',
    title: 'Pick John 1:1',
    body: 'Tick the checkbox next to 1:1 — “Ἐν ἀρχῇ ἦν ὁ λόγος…” (“In the beginning was the Word…”).',
    note: 'John ships with the app, so this works even offline.',
    targetSelector: '[data-tour="gnt-john-1-1"]',
    isDone: (ctx) => !!ctx.bridge?.anyChecked(),
    applyOnSkip: (ctx) => void ctx.bridge?.checkJohn11(),
    missingText: 'Loading the John sentence list…',
    recover: showSources,
  },
  {
    id: 'open',
    title: 'Open the passage',
    body: 'Press Open to diagram the ticked sentence. (Any passage you pick works the same way.)',
    targetSelector: '[data-tour="gnt-open"]',
    isDone: (ctx) => ctx.entryDocId != null && ctx.editor.doc.id !== ctx.entryDocId,
    applyOnSkip: (ctx) => void ctx.bridge?.openCheckedOrJohn11(),
    missingText: 'The Open button sits above the sentence list once it has loaded.',
    recover: showSources,
  },
  {
    id: 'gloss',
    title: 'Read the diagram in English',
    body: 'Tap Eng above the diagram to show English glosses on each word.',
    note: 'Only the displayed words change — the structure still follows the Greek grammar.',
    targetSelector: '[data-tour="diagram-gloss-eng"]',
    isDone: (ctx) => ctx.editor.glossMode,
    applyOnSkip: (ctx) => ctx.editor.setGlossMode(true),
    missingText: 'The Greek/Eng toggle appears above the diagram for Greek and Hebrew passages.',
  },
  {
    id: 'bsb',
    title: 'Show the English text',
    body: 'In the text strip, switch to English (BSB) to read the verse in the Berean Standard Bible.',
    note: 'The BSB is a parallel translation to help you read — the diagram still follows the Greek parse.',
    targetSelector: '[data-tour="source-english"]',
    isDone: (ctx) => ctx.editor.sourceTextVersion === 'en',
    applyOnSkip: (ctx) => ctx.editor.setSourceTextVersion('en'),
    missingText: 'The English text is still loading — if it doesn’t appear, skip this step and keep going.',
  },
  {
    id: 'kellogg',
    title: 'Try the Kellogg-Reed view',
    body: 'Use the view menu above the diagram to switch to Kellogg-Reed — the classic line diagram.',
    note: 'Every view is a different lens over the same Greek syntax.',
    targetSelector: '[data-tour="diagram-mode-select"]',
    isDone: (ctx) => ctx.editor.diagramMode === 'kellogg-reed',
    applyOnSkip: (ctx) => ctx.editor.setDiagramMode('kellogg-reed'),
    missingText: 'The view menu appears in the bar above the diagram.',
  },
  {
    id: 'done',
    title: 'That’s the tour!',
    body: 'You’re reading John 1:1 in English over the Greek structure. Replay this walkthrough any time from the ⋯ menu → Guide.',
  },
];

export function stepById(id: TutorialStepId): TutorialStepDef {
  return TUTORIAL_STEPS.find((s) => s.id === id) ?? TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1]!;
}

/** 1-based position of a guided step, e.g. "Step 2 of 5" (done card excluded). */
export function stepProgress(id: TutorialStepId): { n: number; of: number } | null {
  const guided = TUTORIAL_STEPS.filter((s) => s.id !== 'done');
  const i = guided.findIndex((s) => s.id === id);
  return i === -1 ? null : { n: i + 1, of: guided.length };
}
