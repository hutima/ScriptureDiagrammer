import { create } from 'zustand';
import type {
  DiscourseDocument,
  DiscourseGranularity,
  DiscourseRelation,
  DiscourseRelationType,
  DiscourseUnitKind,
  KrDocument,
} from '@/domain/schema';
import {
  acceptDiscourseSuggestion,
  addDiscourseRelation,
  assignMarkerScope,
  buildDiscourseDocumentFromPlainText,
  collapseDiscourseUnit,
  deleteDiscourseRelation,
  deleteDiscourseUnit,
  diffDiscourseDocuments,
  expandDiscourseUnit,
  indentDiscourseUnit,
  labelDiscourseUnit,
  mergeAdjacentDiscourseUnits,
  moveDiscourseUnit,
  nestDiscourseUnits,
  outdentDiscourseUnit,
  rejectDiscourseSuggestion,
  removeDiscourseBreak,
  setDiscourseUnitNotes,
  splitDiscourseUnit,
  unwrapDiscourseUnit,
  updateDiscourseRelation,
} from '@/domain/discourse';
import { isEmptyDiscoursePatch } from '@/domain/schema';
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
   * A relation whose source AND target are chosen, awaiting its TYPE in the
   * picker. Confirming flows to `addRelation`; anything else cancels.
   */
  relationDraft: { sourceUnitId: string; targetUnitId: string } | null;
  /**
   * The unit currently in "pick a split point" mode: its tokens render as
   * clickable words and the next token tapped becomes the start of a new unit.
   */
  splitPickUnitId: string | null;
  /**
   * Contiguous multi-selection of sibling units (shift-click), for wrapping
   * several units in a new parent group.
   */
  multiSelectedUnitIds: string[];
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
  moveUnit: (unitId: string, delta: number) => void;
  wrapUnits: (unitIds: string[], opts?: { label?: string; kind?: DiscourseUnitKind }) => void;
  unwrapUnit: (unitId: string) => void;
  /** Delete a unit (and its subtree) from the analysis — Discourse-layer only. */
  deleteUnit: (unitId: string) => void;
  labelUnit: (unitId: string, label: string) => void;
  setUnitNotes: (unitId: string, notes: string) => void;
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
  /** Both ends picked: stage the draft for the type picker. */
  setRelationDraft: (draft: { sourceUnitId: string; targetUnitId: string } | null) => void;
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
  sourceId: 'english-kjv' as DiscourseSourceId,
  bookNum: 10, // Ephesians
  startRef: '2:12',
  endRef: '2:19',
  granularity: 'verse' as DiscourseGranularity,
};

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
  showMarkers: true,
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
    relationDraft: null,
    splitPickUnitId: null,
    multiSelectedUnitIds: [],
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
          relationDraft: null,
          splitPickUnitId: null,
          multiSelectedUnitIds: [],
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
        relationDraft: null,
        splitPickUnitId: null,
        multiSelectedUnitIds: [],
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
      if (last) {
        set({
          sourceId: last.sourceId as DiscourseSourceId,
          bookNum: last.bookNum,
          startRef: last.startRef,
          endRef: last.endRef,
          granularity: (last.granularity as DiscourseGranularity) ?? 'sentence',
        });
        await get().loadRange();
        // A restored range that matches the demo signature is the demo: stamp it
        // so the "Remove demo" affordance appears after a reload.
        if (isDemoRange(get())) set({ isDefaultDemo: true });
      }
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
      if (get().status === 'loaded' && isDemoRange(get())) set({ isDefaultDemo: true });
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
        relationDraft: null,
        splitPickUnitId: null,
        multiSelectedUnitIds: [],
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
      set({
        selection,
        // A plain selection restarts the wrap multi-selection at the new unit.
        multiSelectedUnitIds: selection.unitId ? [selection.unitId] : [],
      }),
    setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),
    setSuggestionsOpen: (suggestionsOpen) => set({ suggestionsOpen }),

    splitUnit: (unitId, atTokenId) => commit((d) => splitDiscourseUnit(d, unitId, atTokenId)),
    mergeUnits: (aId, bId) => commit((d) => mergeAdjacentDiscourseUnits(d, aId, bId)),
    mergeWithPrevious: (unitId) => commit((d) => removeDiscourseBreak(d, unitId)),
    indentUnit: (unitId) => commit((d) => indentDiscourseUnit(d, unitId)),
    outdentUnit: (unitId) => commit((d) => outdentDiscourseUnit(d, unitId)),
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
        pendingRelationSource: has(s.pendingRelationSource) ? s.pendingRelationSource : null,
        splitPickUnitId: has(s.splitPickUnitId) ? s.splitPickUnitId : null,
        relationDraft:
          s.relationDraft && has(s.relationDraft.sourceUnitId) && has(s.relationDraft.targetUnitId)
            ? s.relationDraft
            : null,
      }));
    },
    labelUnit: (unitId, label) => commit((d) => labelDiscourseUnit(d, unitId, label)),
    setUnitNotes: (unitId, notes) => commit((d) => setDiscourseUnitNotes(d, unitId, notes)),
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
    deleteRelation: (relationId) => commit((d) => deleteDiscourseRelation(d, relationId)),
    setMarkerScope: (markerId, unitId) => commit((d) => assignMarkerScope(d, markerId, unitId)),
    acceptSuggestion: (suggestionId) => commit((d) => acceptDiscourseSuggestion(d, suggestionId)),
    rejectSuggestion: (suggestionId) => commit((d) => rejectDiscourseSuggestion(d, suggestionId)),
    startRelation: (sourceUnitId) =>
      set({ pendingRelationSource: sourceUnitId, relationDraft: null, splitPickUnitId: null }),
    cancelRelation: () => set({ pendingRelationSource: null, relationDraft: null }),
    setRelationDraft: (relationDraft) => set({ relationDraft, pendingRelationSource: null }),
    beginSplit: (splitPickUnitId) =>
      set({ splitPickUnitId, pendingRelationSource: null, relationDraft: null }),

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
        relationDraft: null,
        splitPickUnitId: null,
        multiSelectedUnitIds: [],
      });
    },
  };
});
