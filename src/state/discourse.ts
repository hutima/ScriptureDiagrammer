import { create } from 'zustand';
import type {
  DiscourseDocument,
  DiscourseGranularity,
  DiscourseRelation,
  DiscourseRelationType,
  DiscourseUnitColor,
  DiscourseUnitKind,
  HighlightCategory,
  KrDocument,
  SermonAnchor,
  SermonNoteCategory,
  SermonPrepData,
} from '@/domain/schema';
import {
  acceptDiscourseSuggestion,
  addDiscourseRelation,
  addDiscourseRelationHighlight,
  addDiscourseStudyHighlight,
  addDiscourseTextHighlight,
  assignMarkerScope,
  buildDiscourseDocumentFromPlainText,
  collapseDiscourseUnit,
  deleteDiscourseRelation,
  deleteDiscourseUnit,
  diffDiscourseDocuments,
  expandDiscourseUnit,
  indentDiscourseUnit,
  labelDiscourseUnit,
  leafUnits,
  mergeAdjacentDiscourseUnits,
  moveDiscourseUnit,
  nestDiscourseUnits,
  nudgeDiscourseUnitIndent,
  outdentDiscourseUnit,
  removeDiscourseTextHighlight,
  setDiscourseTextHighlightNote,
  setDiscourseUnitColor,
  setDiscourseUnitIndent,
  rejectDiscourseSuggestion,
  removeDiscourseBreak,
  setDiscourseUnitNotes,
  splitDiscourseUnit,
  toggleDiscourseRelationHighlightToken,
  unwrapDiscourseUnit,
  updateDiscourseRelation,
} from '@/domain/discourse';
import { emptySermonPrep, isEmptyDiscoursePatch } from '@/domain/schema';
import * as sermonOps from '@/domain/sermon';
import { loadSermonPrep, saveSermonPrep } from '@/persistence/userData';
import { makeId } from '@/domain/model';
import {
  applyStoredDiscoursePatch,
  clearLastDiscourseRange,
  deleteDiscoursePatch,
  dismissDiscourseFirstLoadModal,
  hideDefaultDemo,
  isDefaultDemoHidden,
  isDiscourseFirstLoadModalDismissed,
  loadLastDiscourseRange,
  saveDiscoursePatch,
  saveLastDiscourseRange,
} from '@/persistence/discourse';
import { loadDiscourseRange, DEFAULT_GNT_SOURCE } from '@/io';
import type { DiscourseSourceId, LoadedDiscourseBook } from '@/io';

/**
 * DISCOURSE STORE — a zustand store fully SEPARATE from the syntax editor
 * store (`useEditorStore`). Discourse mode has its own loader state, document
 * state, edit state, selection, undo/redo, and persistence:
 *
 *   - loading a discourse range never touches the syntax passage;
 *   - loading a syntax passage never touches the discourse range;
 *   - switching diagram modes only changes which canvas is MOUNTED — neither
 *     store is reloaded or reset by a mode switch.
 *
 * User edits are persisted as compact `DiscoursePatch` diffs against the
 * regenerated base (`kr:discourse:*`), never as duplicated documents, and
 * never mixed with syntax patches / sermon prep / notes.
 */

export type DiscourseLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface DiscourseSelection {
  unitId?: string;
  relationId?: string;
  markerId?: string;
}

/** Display toggles for the discourse view (view-only; not analysis). */
export interface DiscourseViewToggles {
  showMarkers: boolean;
  showRelations: boolean;
  showLabels: boolean;
  showSourceText: boolean;
  showEnglish: boolean;
  compact: boolean;
}

export interface DiscourseState {
  // --- range selection (the loader's own state, independent of syntax) ---
  sourceId: DiscourseSourceId;
  bookNum: number;
  startRef: string;
  endRef: string;
  granularity: DiscourseGranularity;
  // --- documents ---
  /** The pristine generated base for the loaded range (never edited). */
  baseDoc: DiscourseDocument | null;
  /** The live (edited) document rendered by the discourse view. */
  doc: DiscourseDocument | null;
  status: DiscourseLoadStatus;
  error: string | null;
  // --- view / interaction ---
  selection: DiscourseSelection;
  view: DiscourseViewToggles;
  suggestionsOpen: boolean;
  /** An in-progress "pick the target unit" relation interaction, if any. */
  pendingRelationSource: string | null;
  /**
   * The id of a relation whose (optional) TYPE is being chosen in the modal.
   * The link is ALREADY created (untyped) by the time this is set — dismissing
   * the modal simply leaves it untyped; it never deletes the link.
   */
  typeEditRelationId: string | null;
  /**
   * The unit currently in "pick a split point" mode: its tokens render as
   * clickable words and the next token tapped becomes the start of a new unit.
   */
  splitPickUnitId: string | null;
  /**
   * The unit currently in "drag to highlight" mode: its tokens render as
   * draggable words and a click-drag (or single click) commits a text
   * highlight over the selected span. Mutually exclusive with the split/relate
   * interactions.
   */
  highlightPickUnitId: string | null;
  /**
   * The relation currently in "highlight its words in the passage" pick mode.
   * When set, every leaf unit renders its tokens as drag/tap-selectable spans
   * and a drag/tap commits a `scope:'relation'` highlight tied to this relation.
   * Transient (never persisted, never in undo history). Mutually exclusive with
   * the split / relate / unit-highlight pick modes and the Study token selection.
   */
  relationHighlightPickRelationId: string | null;
  /** The color new highlights are created with (also drives the swatch UI). */
  highlightColor: DiscourseUnitColor;
  /**
   * Contiguous multi-selection of sibling units (shift-click), for wrapping
   * several units in a new parent group.
   */
  multiSelectedUnitIds: string[];
  /**
   * STUDY MODE token selection (transient — never persisted, never in undo
   * history). A drag/tap across a unit's words in Study mode fills this; the
   * Study panel's category chips then turn it into a `scope:'study'` highlight.
   * Always scoped to ONE unit — starting a selection in another unit replaces it.
   */
  studySelection: { unitId: string; tokenIds: string[] } | null;
  /**
   * The Study (sermon-prep) record for the LOADED discourse document — notes,
   * observations, big idea + outline. Highlights live in the discourse doc
   * itself (as `scope:'study'` text highlights), so they are NOT duplicated
   * here. Kept OUT of the discourse undo stacks (sermon data is not document
   * history), persisted separately under `kr:sermon:<discourseDocId>`.
   */
  sermon: SermonPrepData | null;
  // --- default demo + first-load guidance ---
  /**
   * Is the currently loaded document the built-in Ephesians 2:12–19 demo? Drives
   * the "Remove demo" affordance. Stamped only when the demo is loaded (or a
   * restored range matches the demo signature); user ranges never set it.
   */
  isDefaultDemo: boolean;
  /** Is the one-time first-load Discourse guidance modal currently open? */
  firstLoadModalOpen: boolean;
  /**
   * A one-shot request (a rising nonce) for the left panel to open its "New
   * text" tab — used by the modal's "Start with my own passage" action.
   */
  newTextRequest: number;
  // --- history ---
  past: DiscourseDocument[];
  future: DiscourseDocument[];
}

export interface DiscourseActions {
  setSourceId: (id: DiscourseSourceId) => void;
  setBookNum: (num: number) => void;
  setRange: (startRef: string, endRef: string) => void;
  setGranularity: (g: DiscourseGranularity) => void;
  /** Load the selected range from the selected source (async). */
  loadRange: (opts?: { bookDocs?: KrDocument[]; loaded?: LoadedDiscourseBook }) => Promise<void>;
  /**
   * Load a pasted plaintext directly as a discourse document (sentence units;
   * no LLM, no syntax parse). Returns false when the text has no words.
   */
  loadPlainText: (text: string, title?: string) => boolean;
  /** Restore the last loaded range once (called when Discourse mode opens). */
  restoreLastRange: () => Promise<void>;
  /**
   * Orchestrate first entry to Discourse mode (called once when the canvas
   * mounts): restore any prior range, then either open the one-time guidance
   * modal (first visit) or auto-load the default demo (later visits, only when
   * nothing is loaded and the demo has not been hidden). Deterministic and safe
   * to call more than once — a loaded document short-circuits it.
   */
  enterDiscourseMode: () => Promise<void>;
  /**
   * Load the built-in Ephesians 2:12–19 demo through the normal range pipeline
   * and stamp it as the default demo. Idempotent: if the demo is already the
   * loaded range it just re-stamps without reloading. Works even if the demo was
   * previously hidden (a manual load does NOT clear the hide flag).
   */
  loadDefaultDemo: () => Promise<void>;
  /**
   * Remove the default demo: clear the visible document and persist a hide flag
   * so it is never auto-restored again (survives reloads + PWA updates). Distinct
   * from `resetEdits` (which only discards edits) — this sets the hide flag and
   * forgets the range pointer. Leaves syntax state, sermon notes, and unrelated
   * discourse patches untouched.
   */
  removeDefaultDemo: () => void;
  /** Open the first-load guidance modal manually (e.g. an "About Discourse" button). */
  openFirstLoadModal: () => void;
  /** Dismiss the guidance modal and persist the dismissal (does NOT hide the demo). */
  dismissFirstLoadModal: () => void;
  /** Signal the left panel to open its "New text" tab (modal "Start with my own"). */
  requestNewText: () => void;
  select: (selection: DiscourseSelection) => void;
  setView: (patch: Partial<DiscourseViewToggles>) => void;
  setSuggestionsOpen: (open: boolean) => void;
  // --- edits (all pure-mutation wrappers; undoable; persisted as a patch) ---
  splitUnit: (unitId: string, atTokenId: string) => void;
  mergeUnits: (aId: string, bId: string) => void;
  mergeWithPrevious: (unitId: string) => void;
  indentUnit: (unitId: string) => void;
  outdentUnit: (unitId: string) => void;
  /** Set a unit's EXPLICIT per-line indent to an absolute level (drag handle). */
  setUnitIndent: (unitId: string, userIndent: number) => void;
  /** Nudge one or more units' explicit indent by a delta (buttons / +/- keys). */
  nudgeUnitIndent: (unitIds: string | string[], delta: number) => void;
  moveUnit: (unitId: string, delta: number) => void;
  wrapUnits: (unitIds: string[], opts?: { label?: string; kind?: DiscourseUnitKind }) => void;
  unwrapUnit: (unitId: string) => void;
  /** Delete a unit (and its subtree) from the analysis — Discourse-layer only. */
  deleteUnit: (unitId: string) => void;
  labelUnit: (unitId: string, label: string) => void;
  setUnitNotes: (unitId: string, notes: string) => void;
  /** Set (or clear, with `undefined`) a unit's color tag. */
  setUnitColor: (unitId: string, color: DiscourseUnitColor | undefined) => void;
  /** Enter/leave "drag to highlight" mode for a unit. */
  beginHighlight: (unitId: string | null) => void;
  /** Set the color new highlights are created with. */
  setHighlightColor: (color: DiscourseUnitColor) => void;
  /** Commit a text highlight over `tokenIds` (in the current `highlightColor`). */
  addTextHighlight: (unitId: string, tokenIds: string[]) => void;
  /** Remove one of a unit's text highlights by id. */
  removeTextHighlight: (unitId: string, highlightId: string) => void;
  // --- relation highlights (drag/tap words onto the selected relation) ---
  /** Enter "highlight this relation's words" pick mode (clears other pick modes). */
  beginRelationHighlight: (relationId: string) => void;
  /** Leave relation-highlight pick mode. */
  endRelationHighlight: () => void;
  /** Commit a relation highlight over `tokenIds` on a unit (drag range). No-op
   *  unless a relation is in pick mode. */
  addRelationHighlight: (unitId: string, tokenIds: string[]) => void;
  /** Toggle a single token in/out of the picked relation's highlights (tap). */
  toggleRelationHighlightToken: (unitId: string, tokenId: string) => void;
  // --- study mode (token selection → category highlights + sermon record) ---
  /** Set the transient Study token selection (one unit's words). */
  setStudySelection: (selection: { unitId: string; tokenIds: string[] } | null) => void;
  /** Clear the transient Study token selection. */
  clearStudySelection: () => void;
  /**
   * Turn the current `studySelection` into a `scope:'study'` category highlight
   * on its unit (undoable, patch-persisted), then clear the selection. No-op
   * with no selection.
   */
  addStudyHighlight: (category: HighlightCategory) => void;
  /** Remove any text highlight by id (study or manual). */
  removeHighlightById: (unitId: string, highlightId: string) => void;
  /** Set (or clear) a text highlight's short note. */
  setHighlightNote: (unitId: string, highlightId: string, note: string) => void;
  // --- study sermon record (notes / observations / outline; NOT undoable) ---
  addStudyNote: (input: { anchor: SermonAnchor; category: SermonNoteCategory; body?: string }) => void;
  removeStudyNote: (id: string) => void;
  addStudyObservation: (body: string, anchor?: SermonAnchor) => void;
  removeStudyObservation: (id: string) => void;
  setStudyBigIdea: (text: string) => void;
  addStudyOutlineSection: () => void;
  updateStudyOutlineSection: (id: string, patch: { title?: string; body?: string }) => void;
  removeStudyOutlineSection: (id: string) => void;
  setUnitCollapsed: (unitId: string, collapsed: boolean) => void;
  collapseAll: (collapsed: boolean) => void;
  addRelation: (input: {
    sourceUnitId: string;
    targetUnitId: string;
    type: DiscourseRelationType;
    label?: string;
  }) => void;
  updateRelation: (relationId: string, patch: Partial<Omit<DiscourseRelation, 'id'>>) => void;
  deleteRelation: (relationId: string) => void;
  setMarkerScope: (markerId: string, unitId: string | undefined) => void;
  acceptSuggestion: (suggestionId: string) => void;
  rejectSuggestion: (suggestionId: string) => void;
  startRelation: (sourceUnitId: string) => void;
  cancelRelation: () => void;
  /**
   * Both ends picked: IMMEDIATELY create an untyped connector from the pending
   * source to `targetUnitId`, then open the optional type modal for it. Relation
   * type is optional metadata, never required to create the link.
   */
  pickRelationTarget: (targetUnitId: string) => void;
  /** Set (or clear, with `undefined`) an existing relation's type + label. */
  setRelationType: (
    relationId: string,
    type: DiscourseRelationType | undefined,
    label?: string,
  ) => void;
  /** Close the optional type modal, leaving the link as-is (never deletes it). */
  closeRelationTypeEditor: () => void;
  /** Enter/leave "pick a split point" mode for a unit. */
  beginSplit: (unitId: string | null) => void;
  /** Shift-click: extend a contiguous sibling multi-selection to `unitId`. */
  extendMultiSelect: (unitId: string) => void;
  clearMultiSelect: () => void;
  undo: () => void;
  redo: () => void;
  /** Discard all discourse edits for the loaded range (syntax edits untouched). */
  resetEdits: () => void;
}

export type DiscourseStore = DiscourseState & DiscourseActions;

const HISTORY_LIMIT = 100;

/**
 * The built-in default demo passage: Ephesians 2:12–19, loaded from the KJV —
 * a public-domain, English-only source that needs no original-language linking,
 * so it is the lowest-friction default. It is loaded through the NORMAL range
 * pipeline (not a static fixture), so it is fully editable and its edits persist
 * exactly like any other Discourse document.
 */
const DEMO_RANGE = {
  // The demo uses the bundled BSB (the app's modern English display source) so
  // it loads offline and reliably. `english-bsb` is the NT corpus, indexed by
  // NT book number (GNT_BOOKS), where Ephesians is book 10 — this is a DIFFERENT
  // index from KJV/ASV's 66-book canon (where 10 is 2 Samuel), which is exactly
  // the book-index confusion that made the demo previously load 2 Samuel.
  sourceId: 'english-bsb' as DiscourseSourceId,
  bookNum: 10, // Ephesians (NT / GNT_BOOKS index)
  startRef: '2:12',
  endRef: '2:19',
  granularity: 'verse' as DiscourseGranularity,
};

/**
 * The sample chiasm seeded onto a fresh demo — four correspondence arcs
 * (A↔A′ … D↔D′) over Ephesians 2:12–19. It is DEMONSTRATION material
 * (provenance `manual`, low confidence), never authoritative: it lives in the
 * demo's patch (not the base), so it is fully editable, is removed by Reset,
 * and disappears with the demo.
 */
// Short pair labels only ("A ↔ A′") so the arc caption never runs off the
// gutter. The fuller gloss lives in each arc's `notes` (shown in the relation
// detail panel), not on the arc itself.
const DEMO_CHIASM_ARCS: { id: string; a: string; b: string; label: string; notes: string }[] = [
  { id: 'dr_demo_chiasm_a', a: '2:12', b: '2:19', label: 'A ↔ A′', notes: 'alienated ↔ no longer strangers' },
  { id: 'dr_demo_chiasm_b', a: '2:13', b: '2:18', label: 'B ↔ B′', notes: 'brought near ↔ access by one Spirit' },
  { id: 'dr_demo_chiasm_c', a: '2:14', b: '2:17', label: 'C ↔ C′', notes: 'he is our peace ↔ he preached peace' },
  { id: 'dr_demo_chiasm_d', a: '2:15', b: '2:16', label: 'D ↔ D′', notes: 'one new humanity ↔ reconciled in one body' },
];

/**
 * Sample per-line indent staircase mirroring the chiasm (independent, absolute
 * `userIndent` per verse — 0→3 then back to 0 around the 2:15/2:16 pivot). Like
 * the arcs, it is demo/sample state seeded into the base (Reset restores it; a
 * normal load has none) and every line is freely re-draggable afterwards.
 */
const DEMO_INDENTS: Record<string, number> = {
  '2:12': 0,
  '2:13': 1,
  '2:14': 2,
  '2:15': 3,
  '2:16': 3,
  '2:17': 2,
  '2:18': 1,
  '2:19': 0,
};

/** Seed the demo base with the sample chiasm arcs + indent staircase (pure). */
function seedDemoChiasm(base: DiscourseDocument): DiscourseDocument {
  const byRef = new Map<string, string>();
  for (const u of leafUnits(base)) {
    if (u.refStart && !byRef.has(u.refStart)) byRef.set(u.refStart, u.id);
  }
  const provenance = {
    source: 'manual' as const,
    confidence: 'low' as const,
    reason: 'Sample chiasm — a demonstration structure, not an authoritative analysis.',
  };
  let doc = base;
  // Explicit sample indentation, per verse (absolute; never inferred).
  doc = {
    ...doc,
    units: doc.units.map((u) =>
      u.refStart in DEMO_INDENTS ? { ...u, userIndent: DEMO_INDENTS[u.refStart] } : u,
    ),
  };
  for (const arc of DEMO_CHIASM_ARCS) {
    const sourceUnitId = byRef.get(arc.a);
    const targetUnitId = byRef.get(arc.b);
    if (!sourceUnitId || !targetUnitId) continue;
    doc = addDiscourseRelation(
      doc,
      { id: arc.id, sourceUnitId, targetUnitId, type: 'chiasm', label: arc.label, notes: arc.notes, confidence: 'low', provenance },
      base.updatedAt, // deterministic timestamp (no Date.now in the seed)
    );
  }
  return doc;
}

/** Does the current loader range match the canonical demo signature? */
function isDemoRange(s: {
  sourceId: DiscourseSourceId;
  bookNum: number;
  startRef: string;
  endRef: string;
}): boolean {
  return (
    s.sourceId === DEMO_RANGE.sourceId &&
    s.bookNum === DEMO_RANGE.bookNum &&
    s.startRef === DEMO_RANGE.startRef &&
    s.endRef === DEMO_RANGE.endRef
  );
}

const DEFAULT_VIEW: DiscourseViewToggles = {
  // Marker hint chips are OFF by default and only toggleable in Edit mode; a
  // fresh read (Explore) stays uncluttered.
  showMarkers: false,
  showRelations: true,
  showLabels: true,
  showSourceText: true,
  showEnglish: false,
  compact: false,
};

export const useDiscourseStore = create<DiscourseStore>((set, get) => {
  /** Persist the live doc's diff against the base (or clear an empty diff). */
  const persistEdits = (live: DiscourseDocument) => {
    const { baseDoc } = get();
    if (!baseDoc || baseDoc.id !== live.id) return;
    const patch = diffDiscourseDocuments(baseDoc, live, new Date().toISOString());
    if (isEmptyDiscoursePatch(patch)) deleteDiscoursePatch(baseDoc.id);
    else saveDiscoursePatch(baseDoc.id, patch);
  };

  /** Apply a pure sermon-prep transform to the loaded doc's study record and
   *  persist it. Sermon data is NOT part of the discourse undo stacks. */
  const commitSermon = (producer: (s: SermonPrepData) => SermonPrepData) => {
    const { doc, sermon } = get();
    if (!doc) return;
    const current = sermon ?? emptySermonPrep(doc.id, new Date().toISOString());
    const next = producer(current);
    set({ sermon: next });
    saveSermonPrep(next.passageId, next);
  };

  /** Load (or create) the study record for a freshly loaded discourse doc. */
  const loadSermonFor = (docId: string): SermonPrepData =>
    loadSermonPrep(docId) ?? emptySermonPrep(docId, new Date().toISOString());

  /** Apply a pure transform to the live doc, recording history + persisting. */
  const commit = (producer: (doc: DiscourseDocument) => DiscourseDocument) => {
    const { doc, past } = get();
    if (!doc) return;
    const next = producer(doc);
    if (next === doc) return; // pure mutations no-op on invalid input
    set({ doc: next, past: [...past, doc].slice(-HISTORY_LIMIT), future: [] });
    persistEdits(next);
  };

  // Requests can finish out of order (switching source/book mid-load); only
  // the latest may publish.
  let loadSeq = 0;

  return {
    sourceId: DEFAULT_GNT_SOURCE,
    bookNum: 10, // Ephesians — the canonical discourse-analysis playground
    startRef: '5:3',
    endRef: '5:33',
    granularity: 'sentence',
    baseDoc: null,
    doc: null,
    status: 'idle',
    error: null,
    selection: {},
    view: { ...DEFAULT_VIEW },
    suggestionsOpen: false,
    pendingRelationSource: null,
    typeEditRelationId: null,
    splitPickUnitId: null,
    highlightPickUnitId: null,
    relationHighlightPickRelationId: null,
    highlightColor: 'yellow',
    multiSelectedUnitIds: [],
    studySelection: null,
    sermon: null,
    isDefaultDemo: false,
    firstLoadModalOpen: false,
    newTextRequest: 0,
    past: [],
    future: [],

    setSourceId: (sourceId) => set({ sourceId }),
    setBookNum: (bookNum) => set({ bookNum }),
    setRange: (startRef, endRef) => set({ startRef, endRef }),
    setGranularity: (granularity) => set({ granularity }),

    loadRange: async (opts) => {
      const { sourceId, bookNum, startRef, endRef, granularity } = get();
      const seq = ++loadSeq;
      set({ status: 'loading', error: null });
      try {
        const base = await loadDiscourseRange({
          sourceId,
          bookNum,
          startRef,
          endRef,
          granularity,
          bookDocs: opts?.bookDocs,
          loaded: opts?.loaded,
        });
        if (seq !== loadSeq) return;
        const live = applyStoredDiscoursePatch(base);
        set({
          baseDoc: base,
          doc: live,
          status: 'loaded',
          error: null,
          selection: {},
          pendingRelationSource: null,
          typeEditRelationId: null,
          splitPickUnitId: null,
          highlightPickUnitId: null,
          relationHighlightPickRelationId: null,
          multiSelectedUnitIds: [],
          studySelection: null,
          sermon: loadSermonFor(base.id),
          // A range load clears the demo stamp; `loadDefaultDemo` re-sets it after.
          isDefaultDemo: false,
          past: [],
          future: [],
        });
        saveLastDiscourseRange({ sourceId, bookNum, startRef, endRef, granularity });
      } catch (e) {
        if (seq !== loadSeq) return;
        set({ status: 'error', error: (e as Error).message });
      }
    },

    loadPlainText: (text, title) => {
      const built = buildDiscourseDocumentFromPlainText(text, title ? { title } : {});
      if (!built) {
        set({ status: 'error', error: 'Paste some text to load — no sentences were found.' });
        return false;
      }
      // Supersede any in-flight async range load so it can't clobber this doc.
      ++loadSeq;
      const live = applyStoredDiscoursePatch(built);
      set({
        baseDoc: built,
        doc: live,
        status: 'loaded',
        error: null,
        selection: {},
        pendingRelationSource: null,
        typeEditRelationId: null,
        splitPickUnitId: null,
        highlightPickUnitId: null,
        relationHighlightPickRelationId: null,
        multiSelectedUnitIds: [],
        studySelection: null,
        sermon: loadSermonFor(built.id),
        isDefaultDemo: false,
        past: [],
        future: [],
      });
      return true;
    },

    restoreLastRange: async () => {
      const s = get();
      if (s.doc || s.status === 'loading') return; // already restored / in flight
      const last = loadLastDiscourseRange();
      if (!last) return;
      const range = {
        sourceId: last.sourceId as DiscourseSourceId,
        bookNum: last.bookNum,
        startRef: last.startRef,
        endRef: last.endRef,
      };
      // A restored range that matches the demo signature IS the demo: reload it
      // through `loadDefaultDemo` so the sample chiasm is seeded and the demo
      // stamp is set exactly as on first load (not a bare passage).
      if (isDemoRange(range)) {
        await get().loadDefaultDemo();
        return;
      }
      set({ ...range, granularity: (last.granularity as DiscourseGranularity) ?? 'sentence' });
      await get().loadRange();
    },

    enterDiscourseMode: async () => {
      const s = get();
      // Already showing something (returning to the mode, or a load in flight):
      // never re-trigger the modal or clobber the document.
      if (s.doc || s.status === 'loading') return;
      await get().restoreLastRange();
      if (get().doc) return; // a prior range was restored — leave it be
      if (!isDiscourseFirstLoadModalDismissed()) {
        // FIRST visit: show the guidance modal and WAIT for the user's choice;
        // the demo is not auto-loaded behind it (avoids the "offer to load what's
        // already loaded" race).
        set({ firstLoadModalOpen: true });
        return;
      }
      // Later visits: auto-load the demo only when nothing is loaded and the user
      // has not hidden it.
      if (!isDefaultDemoHidden()) await get().loadDefaultDemo();
    },

    loadDefaultDemo: async () => {
      // Idempotent: if the demo range is already loaded, just (re-)stamp it.
      if (get().doc && isDemoRange(get())) {
        set({ isDefaultDemo: true });
        return;
      }
      set({ ...DEMO_RANGE });
      await get().loadRange();
      const st = get();
      if (st.status !== 'loaded' || !isDemoRange(st) || !st.baseDoc) return;
      // The sample chiasm is part of the DEMO BASE — "removable demo/sample
      // state", the one sanctioned exception to bases carrying no user-facing
      // relations. Seeding the base (deterministically) means Reset restores the
      // arcs, a NORMAL (non-demo) load of the same range never gets them, and
      // stored user patches still apply (the base hash is stable). `loadRange`
      // built + applied the patch against the bare base, so re-derive the live
      // doc from the seeded base here.
      const seededBase = seedDemoChiasm(st.baseDoc);
      const live = applyStoredDiscoursePatch(seededBase);
      set({ baseDoc: seededBase, doc: live, isDefaultDemo: true });
    },

    removeDefaultDemo: () => {
      const { baseDoc } = get();
      // Drop this demo's own edit patch (its edits go with it) — but nothing else.
      if (baseDoc) deleteDiscoursePatch(baseDoc.id);
      // Forget the range pointer so a reload can't restore the demo.
      clearLastDiscourseRange();
      // Persist the hide flag so it never auto-restores again.
      hideDefaultDemo();
      // Supersede any in-flight load and clear the visible document.
      ++loadSeq;
      set({
        baseDoc: null,
        doc: null,
        status: 'idle',
        error: null,
        isDefaultDemo: false,
        selection: {},
        pendingRelationSource: null,
        typeEditRelationId: null,
        splitPickUnitId: null,
        highlightPickUnitId: null,
        relationHighlightPickRelationId: null,
        multiSelectedUnitIds: [],
        studySelection: null,
        sermon: null,
        past: [],
        future: [],
      });
    },

    openFirstLoadModal: () => set({ firstLoadModalOpen: true }),
    dismissFirstLoadModal: () => {
      dismissDiscourseFirstLoadModal();
      set({ firstLoadModalOpen: false });
    },
    requestNewText: () => set((s) => ({ newTextRequest: s.newTextRequest + 1 })),

    select: (selection) =>
      set((s) => ({
        selection,
        // A plain selection restarts the wrap multi-selection at the new unit.
        multiSelectedUnitIds: selection.unitId ? [selection.unitId] : [],
        // Selecting a DIFFERENT relation (or none) leaves relation-highlight pick
        // mode — the tools belong to the relation currently being edited.
        relationHighlightPickRelationId:
          s.relationHighlightPickRelationId &&
          s.relationHighlightPickRelationId !== selection.relationId
            ? null
            : s.relationHighlightPickRelationId,
      })),
    setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),
    setSuggestionsOpen: (suggestionsOpen) => set({ suggestionsOpen }),

    splitUnit: (unitId, atTokenId) => commit((d) => splitDiscourseUnit(d, unitId, atTokenId)),
    mergeUnits: (aId, bId) => commit((d) => mergeAdjacentDiscourseUnits(d, aId, bId)),
    mergeWithPrevious: (unitId) => commit((d) => removeDiscourseBreak(d, unitId)),
    indentUnit: (unitId) => commit((d) => indentDiscourseUnit(d, unitId)),
    outdentUnit: (unitId) => commit((d) => outdentDiscourseUnit(d, unitId)),
    setUnitIndent: (unitId, userIndent) =>
      commit((d) => setDiscourseUnitIndent(d, unitId, userIndent)),
    nudgeUnitIndent: (unitIds, delta) => {
      const ids = Array.isArray(unitIds) ? unitIds : [unitIds];
      // Each selected line moves by the same delta, independently (no cascade).
      commit((d) => ids.reduce((acc, id) => nudgeDiscourseUnitIndent(acc, id, delta), d));
    },
    moveUnit: (unitId, delta) => commit((d) => moveDiscourseUnit(d, unitId, delta)),
    wrapUnits: (unitIds, opts) => commit((d) => nestDiscourseUnits(d, unitIds, opts ?? {})),
    unwrapUnit: (unitId) => commit((d) => unwrapDiscourseUnit(d, unitId)),
    deleteUnit: (unitId) => {
      commit((d) => deleteDiscourseUnit(d, unitId));
      // Prune any selection / interaction state that now points at a gone unit.
      const after = get().doc;
      if (!after) return;
      const has = (id?: string | null): id is string =>
        !!id && after.units.some((u) => u.id === id);
      set((s) => ({
        selection: {
          unitId: has(s.selection.unitId) ? s.selection.unitId : undefined,
          relationId: after.relations.some((r) => r.id === s.selection.relationId)
            ? s.selection.relationId
            : undefined,
          markerId: after.markers.some((m) => m.id === s.selection.markerId)
            ? s.selection.markerId
            : undefined,
        },
        multiSelectedUnitIds: s.multiSelectedUnitIds.filter((id) => has(id)),
        studySelection: has(s.studySelection?.unitId) ? s.studySelection : null,
        pendingRelationSource: has(s.pendingRelationSource) ? s.pendingRelationSource : null,
        splitPickUnitId: has(s.splitPickUnitId) ? s.splitPickUnitId : null,
        highlightPickUnitId: has(s.highlightPickUnitId) ? s.highlightPickUnitId : null,
        relationHighlightPickRelationId: after.relations.some(
          (r) => r.id === s.relationHighlightPickRelationId,
        )
          ? s.relationHighlightPickRelationId
          : null,
        typeEditRelationId: after.relations.some((r) => r.id === s.typeEditRelationId)
          ? s.typeEditRelationId
          : null,
      }));
    },
    labelUnit: (unitId, label) => commit((d) => labelDiscourseUnit(d, unitId, label)),
    setUnitNotes: (unitId, notes) => commit((d) => setDiscourseUnitNotes(d, unitId, notes)),
    setUnitColor: (unitId, color) => commit((d) => setDiscourseUnitColor(d, unitId, color)),
    beginHighlight: (highlightPickUnitId) =>
      set({
        highlightPickUnitId,
        splitPickUnitId: null,
        pendingRelationSource: null,
        typeEditRelationId: null,
        relationHighlightPickRelationId: null,
      }),
    setHighlightColor: (highlightColor) => set({ highlightColor }),
    addTextHighlight: (unitId, tokenIds) => {
      commit((d) => addDiscourseTextHighlight(d, unitId, tokenIds, get().highlightColor));
      set({ highlightPickUnitId: null });
    },
    removeTextHighlight: (unitId, highlightId) =>
      commit((d) => removeDiscourseTextHighlight(d, unitId, highlightId)),

    // --- relation highlights ----------------------------------------------------
    beginRelationHighlight: (relationId) =>
      set({
        relationHighlightPickRelationId: relationId,
        splitPickUnitId: null,
        highlightPickUnitId: null,
        pendingRelationSource: null,
        typeEditRelationId: null,
        studySelection: null,
      }),
    endRelationHighlight: () => set({ relationHighlightPickRelationId: null }),
    addRelationHighlight: (unitId, tokenIds) => {
      const relationId = get().relationHighlightPickRelationId;
      if (!relationId) return;
      commit((d) => addDiscourseRelationHighlight(d, unitId, tokenIds, relationId));
    },
    toggleRelationHighlightToken: (unitId, tokenId) => {
      const relationId = get().relationHighlightPickRelationId;
      if (!relationId) return;
      commit((d) => toggleDiscourseRelationHighlightToken(d, unitId, tokenId, relationId));
    },

    // --- study mode -------------------------------------------------------------
    setStudySelection: (studySelection) => set({ studySelection }),
    clearStudySelection: () => set({ studySelection: null }),
    addStudyHighlight: (category) => {
      const sel = get().studySelection;
      if (!sel || !sel.tokenIds.length) return;
      commit((d) => addDiscourseStudyHighlight(d, sel.unitId, sel.tokenIds, category));
      set({ studySelection: null });
    },
    removeHighlightById: (unitId, highlightId) =>
      commit((d) => removeDiscourseTextHighlight(d, unitId, highlightId)),
    setHighlightNote: (unitId, highlightId, note) =>
      commit((d) => setDiscourseTextHighlightNote(d, unitId, highlightId, note)),

    // --- study sermon record (separate from doc history) ------------------------
    addStudyNote: (input) =>
      commitSermon((s) => sermonOps.addNote(s, { ...input, body: input.body ?? '' }, new Date().toISOString()).data),
    removeStudyNote: (id) => commitSermon((s) => sermonOps.removeNote(s, id, new Date().toISOString())),
    addStudyObservation: (body, anchor) =>
      commitSermon((s) => sermonOps.addObservation(s, { body, anchor }, new Date().toISOString()).data),
    removeStudyObservation: (id) =>
      commitSermon((s) => sermonOps.removeObservation(s, id, new Date().toISOString())),
    setStudyBigIdea: (text) => commitSermon((s) => sermonOps.setBigIdea(s, text, new Date().toISOString())),
    addStudyOutlineSection: () =>
      commitSermon((s) => sermonOps.addOutlineSection(s, new Date().toISOString())),
    updateStudyOutlineSection: (id, patch) =>
      commitSermon((s) => sermonOps.updateOutlineSection(s, id, patch, new Date().toISOString())),
    removeStudyOutlineSection: (id) =>
      commitSermon((s) => sermonOps.removeOutlineSection(s, id, new Date().toISOString())),

    setUnitCollapsed: (unitId, collapsed) =>
      commit((d) => (collapsed ? collapseDiscourseUnit(d, unitId) : expandDiscourseUnit(d, unitId))),
    collapseAll: (collapsed) =>
      commit((d) => ({
        ...d,
        units: d.units.map((u) =>
          // Only containers (units with children) are collapsible.
          d.units.some((c) => c.parentId === u.id) ? { ...u, collapsed } : u,
        ),
        updatedAt: new Date().toISOString(),
      })),
    addRelation: (input) => {
      commit((d) => addDiscourseRelation(d, input));
      set({ pendingRelationSource: null });
    },
    updateRelation: (relationId, patch) =>
      commit((d) => updateDiscourseRelation(d, relationId, patch)),
    deleteRelation: (relationId) => {
      commit((d) => deleteDiscourseRelation(d, relationId));
      // Leaving a deleted relation's pick mode / selection behind would strand
      // the highlight tools on a relation that no longer exists.
      set((s) => ({
        relationHighlightPickRelationId:
          s.relationHighlightPickRelationId === relationId
            ? null
            : s.relationHighlightPickRelationId,
        selection:
          s.selection.relationId === relationId
            ? { unitId: s.selection.unitId }
            : s.selection,
      }));
    },
    setMarkerScope: (markerId, unitId) => commit((d) => assignMarkerScope(d, markerId, unitId)),
    acceptSuggestion: (suggestionId) => commit((d) => acceptDiscourseSuggestion(d, suggestionId)),
    rejectSuggestion: (suggestionId) => commit((d) => rejectDiscourseSuggestion(d, suggestionId)),
    startRelation: (sourceUnitId) =>
      set({
        pendingRelationSource: sourceUnitId,
        typeEditRelationId: null,
        splitPickUnitId: null,
        highlightPickUnitId: null,
        relationHighlightPickRelationId: null,
      }),
    cancelRelation: () => set({ pendingRelationSource: null }),
    pickRelationTarget: (targetUnitId) => {
      const source = get().pendingRelationSource;
      if (!source || source === targetUnitId) {
        set({ pendingRelationSource: null });
        return;
      }
      // Create the connector NOW (untyped); the type is optional metadata added
      // afterwards. A fixed id lets the modal target this exact relation.
      const id = makeId('dr');
      commit((d) => addDiscourseRelation(d, { id, sourceUnitId: source, targetUnitId }));
      set({ pendingRelationSource: null, typeEditRelationId: id });
    },
    setRelationType: (relationId, type, label) =>
      commit((d) => updateDiscourseRelation(d, relationId, { type, label })),
    closeRelationTypeEditor: () => set({ typeEditRelationId: null }),
    beginSplit: (splitPickUnitId) =>
      set({
        splitPickUnitId,
        pendingRelationSource: null,
        typeEditRelationId: null,
        highlightPickUnitId: null,
        relationHighlightPickRelationId: null,
      }),

    extendMultiSelect: (unitId) => {
      const { doc, selection, multiSelectedUnitIds } = get();
      if (!doc) return;
      const anchorId = multiSelectedUnitIds[0] ?? selection.unitId;
      if (!anchorId || anchorId === unitId) {
        set({ multiSelectedUnitIds: [unitId], selection: { unitId } });
        return;
      }
      const anchor = doc.units.find((u) => u.id === anchorId);
      const target = doc.units.find((u) => u.id === unitId);
      // A wrap group must be contiguous siblings: extend only within one parent.
      if (!anchor || !target || anchor.parentId !== target.parentId) return;
      const siblings = doc.units
        .filter((u) => u.parentId === anchor.parentId)
        .sort((a, b) => a.order - b.order);
      const ai = siblings.findIndex((u) => u.id === anchorId);
      const ti = siblings.findIndex((u) => u.id === unitId);
      if (ai < 0 || ti < 0) return;
      const [lo, hi] = ai <= ti ? [ai, ti] : [ti, ai];
      set({ multiSelectedUnitIds: siblings.slice(lo, hi + 1).map((u) => u.id) });
    },
    clearMultiSelect: () => set({ multiSelectedUnitIds: [] }),

    undo: () => {
      const { doc, past, future } = get();
      if (!doc || !past.length) return;
      const prev = past[past.length - 1]!;
      set({ doc: prev, past: past.slice(0, -1), future: [doc, ...future] });
      persistEdits(prev);
    },
    redo: () => {
      const { doc, future, past } = get();
      if (!doc || !future.length) return;
      const next = future[0]!;
      set({ doc: next, future: future.slice(1), past: [...past, doc] });
      persistEdits(next);
    },

    resetEdits: () => {
      const { baseDoc } = get();
      if (!baseDoc) return;
      deleteDiscoursePatch(baseDoc.id);
      set({
        doc: baseDoc,
        past: [],
        future: [],
        selection: {},
        pendingRelationSource: null,
        typeEditRelationId: null,
        splitPickUnitId: null,
        highlightPickUnitId: null,
        relationHighlightPickRelationId: null,
        multiSelectedUnitIds: [],
        studySelection: null,
      });
    },
  };
});
