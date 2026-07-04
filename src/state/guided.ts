import { create } from 'zustand';
import type { GrammarHighlightGuide, GuidedDisplayMode, KrDocument } from '@/domain/schema';
import type { DiagramMode } from '@/domain/layout';
import { grammarHighlightGuides, getGuide } from '@/data/grammarHighlights';
import { getGuidedDocument } from '@/fixtures/guided';
import { useTutorialStore } from '@/ui/tutorial/tutorialState';
import { useEditorStore } from './store';
import type { AppMode } from './types';

/**
 * GRAMMAR HIGHLIGHTS (guided mode) store — a SECOND zustand store beside the
 * editor store, following the discourse-store pattern: guided mode is an
 * orthogonal overlay over the normal syntax pipeline, never a new DiagramMode.
 *
 * Entering guided mode SNAPSHOTS the user's prior view state (app mode,
 * visualization, gloss toggle, source-text version), steers the editor store
 * into Explore + the guide's default visualization (KR), and loads the guide's
 * bundled passage through the NORMAL `loadDocument` path — so every
 * visualization, the inspector, sermon notes, and stored user patches keep
 * working exactly as for any other passage. Leaving restores the snapshot.
 *
 * While active:
 *  - the top bar shows "Leave guided mode" and locks the app-mode switcher to
 *    Explore;
 *  - the left panel swaps the source pickers for the curated guided library;
 *  - Discourse is removed from the visualization switcher (it is a separate
 *    analysis layer, not a syntax lens);
 *  - each step change bumps `focusNonce`, which the diagram canvas observes to
 *    pan/zoom onto the step's focus targets ONCE (the user pans freely after).
 *
 * Guided mode never mutates any document and persists nothing except its
 * "intro seen" preference.
 */

const GUIDED_SEEN_KEY = 'kr:guided:v1';

function markIntroSeen(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(GUIDED_SEEN_KEY, 'seen');
  } catch {
    /* best-effort */
  }
}

/**
 * After a guided passage loads (which clears the book reading context), set
 * the context to the guide's OWN bundled passages. This mirrors what the
 * pickers do after `loadDocument`, and it is what lets a cross-sentence
 * contested issue (e.g. Romans 9:5, whose alternate reading is authored
 * against the MERGED 9:3–5a + 9:5b document) build its combined base while
 * guided mode is active — `mergedContestedBase` looks the spanned sentences
 * up in `gntPassages`.
 */
function setGuideReadingContext(guide: GrammarHighlightGuide, loadedId: string): void {
  const docs = guide.bundledPassageIds
    .map((id) => getGuidedDocument(id))
    .filter((d): d is KrDocument => !!d);
  const index = docs.findIndex((d) => d.id === loadedId);
  useEditorStore.getState().setGntContext(docs, Math.max(0, index));
}

interface PriorViewState {
  appMode: AppMode;
  diagramMode: DiagramMode;
  glossMode: boolean;
  sourceTextVersion: 'grc' | 'en';
}

export interface GuidedState {
  /** Whether guided mode is active (the overlay owns the shell chrome). */
  active: boolean;
  displayMode: GuidedDisplayMode;
  /** The entry/intro modal (Greek vs English choice). */
  introOpen: boolean;
  selectedGuideId: string | null;
  stepIndex: number;
  /** The Greek term whose detail panel is open (id into the guide's terms). */
  selectedGreekTermId: string | null;
  /**
   * Rising nonce, bumped on every guide/step change: the canvas pans/zooms to
   * the step's focus exactly once per bump, never fighting manual pan/zoom.
   */
  focusNonce: number;
  /** View state saved on entry, restored on leave. */
  prior: PriorViewState | null;
}

export interface GuidedActions {
  openIntro: () => void;
  closeIntro: () => void;
  /** Enter guided mode with the chosen display mode; opens the first guide. */
  enter: (displayMode: GuidedDisplayMode) => void;
  /** Leave guided mode and restore the prior view state where safe. */
  leave: () => void;
  /** Open a guide from the curated library (loads its bundled passage). */
  openGuide: (guideId: string) => void;
  setStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectGreekTerm: (termId: string | null) => void;
}

export type GuidedStore = GuidedState & GuidedActions;

export const useGuidedStore = create<GuidedStore>((set, get) => ({
  active: false,
  displayMode: 'greek',
  introOpen: false,
  selectedGuideId: null,
  stepIndex: 0,
  selectedGreekTermId: null,
  focusNonce: 0,
  prior: null,

  openIntro: () => set({ introOpen: true }),
  closeIntro: () => {
    markIntroSeen();
    set({ introOpen: false });
  },

  enter: (displayMode) => {
    const editor = useEditorStore.getState();
    const prior: PriorViewState = {
      appMode: editor.appMode,
      diagramMode: editor.diagramMode,
      glossMode: editor.glossMode,
      sourceTextVersion: editor.sourceTextVersion,
    };
    markIntroSeen();
    // The first-run tour and a guided walkthrough would talk over each other —
    // leave the tour (it is dismissable-by-design) when guided mode begins.
    if (useTutorialStore.getState().active) useTutorialStore.getState().exit();
    // Guided mode reads, never edits: Explore is the only app mode inside it.
    editor.setAppMode('explore');
    // English mode shows glosses / the English strip, but the PARSE — and so
    // the diagram structure — remains the Greek syntax underneath.
    editor.setGlossMode(displayMode === 'english');
    editor.setSourceTextVersion(displayMode === 'english' ? 'en' : 'grc');
    set({ active: true, displayMode, introOpen: false, prior });
    const first = grammarHighlightGuides[0];
    if (first) get().openGuide(first.id);
  },

  leave: () => {
    const { prior } = get();
    set({
      active: false,
      selectedGuideId: null,
      stepIndex: 0,
      selectedGreekTermId: null,
      prior: null,
    });
    if (!prior) return;
    const editor = useEditorStore.getState();
    // Restore where safe. The guided passage stays loaded (it is a normal
    // passage); the pickers return, so the user can move on from there.
    editor.setDiagramMode(prior.diagramMode);
    editor.setGlossMode(prior.glossMode);
    editor.setSourceTextVersion(prior.sourceTextVersion);
    editor.setAppMode(prior.appMode);
  },

  openGuide: (guideId) => {
    const guide = getGuide(guideId);
    if (!guide) return;
    // Open on the first step's passage if it names one, else the guide's first.
    const firstPassage = guide.steps[0]?.passageId ?? guide.bundledPassageIds[0]!;
    const doc = getGuidedDocument(firstPassage);
    if (!doc) return;
    const editor = useEditorStore.getState();
    editor.loadDocument(doc, { corpus: 'gnt' });
    editor.setDiagramMode(guide.defaultDiagramMode);
    setGuideReadingContext(guide, doc.id);
    set((s) => ({
      selectedGuideId: guideId,
      stepIndex: 0,
      selectedGreekTermId: null,
      focusNonce: s.focusNonce + 1,
    }));
  },

  setStep: (index) => {
    const { selectedGuideId } = get();
    const guide = selectedGuideId ? getGuide(selectedGuideId) : undefined;
    if (!guide) return;
    const clamped = Math.max(0, Math.min(guide.steps.length - 1, index));
    const step = guide.steps[clamped]!;
    // A multi-sentence guide names the passage each step is about; load it
    // (through the normal path) when the step moves to a different sentence
    // than the one currently shown. The focus effect then fits the step's
    // targets in the freshly-loaded document.
    if (step.passageId) {
      const editor = useEditorStore.getState();
      if (editor.doc.id !== step.passageId) {
        const doc = getGuidedDocument(step.passageId);
        if (doc) {
          editor.loadDocument(doc, { corpus: 'gnt' });
          editor.setDiagramMode(guide.defaultDiagramMode);
          setGuideReadingContext(guide, doc.id);
        }
      }
    }
    set((s) => ({
      stepIndex: clamped,
      selectedGreekTermId: null,
      focusNonce: s.focusNonce + 1,
    }));
  },
  nextStep: () => get().setStep(get().stepIndex + 1),
  prevStep: () => get().setStep(get().stepIndex - 1),

  selectGreekTerm: (termId) => set({ selectedGreekTermId: termId }),
}));

/** Whether the guided intro has ever been dismissed/entered (fail-open). */
export function isGuidedIntroSeen(): boolean {
  try {
    return typeof localStorage === 'undefined' || localStorage.getItem(GUIDED_SEEN_KEY) != null;
  } catch {
    return true;
  }
}
