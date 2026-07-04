import { create } from 'zustand';

/**
 * First-launch walkthrough state. Deliberately independent of the editor store
 * and of the syntax/document model: the tutorial only OBSERVES the app (via
 * store selectors and a small picker bridge) and never carries document state
 * of its own, so exiting it at any point leaves the app exactly as it is.
 *
 * Persistence is one key, `kr:tutorial:v2` — absent until the tour has been
 * completed or dismissed once, after which it never auto-shows again. It can
 * still be replayed manually from the Guide. Where localStorage is unavailable
 * (private mode, some embedded webviews) we FAIL OPEN: the app works normally
 * and the tour simply never auto-starts (we could not remember a dismissal, so
 * auto-showing would nag on every launch).
 *
 * The key is VERSIONED. Bumping it (v1 → v2) re-shows the tour EXACTLY ONCE for
 * every existing user, so a meaningful tutorial change (here: the new "Start
 * guided mode" hand-off on the closing card) is stepped through on the next
 * launch. To do that reliably we can't lean on `firstRun` (false for anyone who
 * has ever opened a passage): instead, a user who completed an OLDER version
 * still has that older key in storage, and `isTutorialResetPending()` reports
 * "the current version is unseen AND a superseded version was seen" — which the
 * overlay treats as a one-time reason to re-show. The moment the new version is
 * completed or dismissed, `markTutorialSeen` writes the current key and sweeps
 * the superseded ones, so the reset never fires a second time. It only fires
 * again when the version is bumped anew (add the retired key to
 * `LEGACY_TUTORIAL_KEYS`). A returning user who never saw ANY tutorial has no
 * legacy key, so they are NOT nagged.
 */
export const TUTORIAL_KEY = 'kr:tutorial:v2';

/** Superseded tutorial keys: their presence marks a user due the reset once. */
const LEGACY_TUTORIAL_KEYS = ['kr:tutorial:v1'];

/**
 * True when the current tutorial version is unseen but a SUPERSEDED version was
 * seen — i.e. this user completed an older tour and the version has since been
 * bumped. The overlay uses this as a one-time reason to re-offer the tour even
 * though it is not a first run. Pure read (no side effects) so it stays a
 * stable signal until `markTutorialSeen` sweeps the legacy keys. Fail-open to
 * false where storage is unavailable (we'd rather not nag than nag forever).
 */
export function isTutorialResetPending(): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (isTutorialSeen()) return false;
  try {
    return LEGACY_TUTORIAL_KEYS.some((key) => localStorage.getItem(key) != null);
  } catch {
    return false;
  }
}

/** Drop superseded tutorial flags once the current version is acknowledged. */
function cleanupLegacyTutorialKeys(): void {
  if (typeof localStorage === 'undefined') return;
  for (const key of LEGACY_TUTORIAL_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* best-effort */
    }
  }
}

/** The five guided steps plus the closing card. */
export type TutorialStepId = 'pick' | 'open' | 'gloss' | 'bsb' | 'kellogg' | 'done';

export const TUTORIAL_FLOW: TutorialStepId[] = ['pick', 'open', 'gloss', 'bsb', 'kellogg', 'done'];

/** True when the tour has already been completed or dismissed (or storage is unavailable). */
export function isTutorialSeen(): boolean {
  if (typeof localStorage === 'undefined') return true;
  try {
    return localStorage.getItem(TUTORIAL_KEY) != null;
  } catch {
    return true;
  }
}

function markTutorialSeen(value: 'completed' | 'dismissed'): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(TUTORIAL_KEY, value);
  } catch {
    /* best-effort — worst case the tour offers itself again next launch */
  }
  // Now that the current version is recorded, retire the superseded flags so
  // the one-time reset can never re-fire (until the version is bumped anew).
  cleanupLegacyTutorialKeys();
}

/** Test/dev helper: forget that the tour was seen (not surfaced in the UI). */
export function resetTutorialForDev(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    /* ignore */
  }
}

export interface TutorialStore {
  /** Whether the walkthrough overlay is showing. */
  active: boolean;
  /** The current step (meaningful only while `active`). */
  stepId: TutorialStepId;
  /** Start (or restart) the walkthrough from the first step. */
  start: () => void;
  /** Move to the next step; finishing the last step exits as completed. */
  advance: () => void;
  /**
   * Leave the walkthrough. Always persists (completed or dismissed) so the
   * tour never auto-shows twice — it stays replayable from the Guide.
   */
  exit: (opts?: { completed?: boolean }) => void;
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  active: false,
  stepId: 'pick',
  start: () => set({ active: true, stepId: TUTORIAL_FLOW[0] }),
  advance: () => {
    const i = TUTORIAL_FLOW.indexOf(get().stepId);
    const next = TUTORIAL_FLOW[i + 1];
    if (next) set({ stepId: next });
    else get().exit({ completed: true });
  },
  exit: (opts) => {
    markTutorialSeen(opts?.completed ? 'completed' : 'dismissed');
    set({ active: false });
  },
}));

/**
 * A tiny imperative bridge the GntPicker registers while mounted, so the
 * walkthrough can observe the sentence checkboxes and reuse the picker's OWN
 * open path when a step is skipped — never a duplicated open flow and never
 * a synthetic DOM click. All methods are safe to call at any time; they no-op
 * (returning false) when the picker isn't in a state where they apply.
 */
export interface GntTutorialBridge {
  /** True when the SBLGNT John sentence list is loaded and showing. */
  johnListReady: () => boolean;
  /** True while the picker is fetching a sentence list. */
  listLoading: () => boolean;
  /** True when any sentence is ticked. */
  anyChecked: () => boolean;
  /** True when the John 1:1 sentence specifically is ticked. */
  isJohn11Checked: () => boolean;
  /** Tick the John 1:1 sentence. False when the list isn't loaded. */
  checkJohn11: () => boolean;
  /** Steer the picker to SBLGNT · John so the sentence list loads. */
  ensureJohn: () => void;
  /**
   * Open the ticked sentences — or John 1:1 when nothing is ticked — through
   * the picker's normal open path. False when there is nothing to open yet.
   */
  openCheckedOrJohn11: () => boolean;
}

let gntBridge: GntTutorialBridge | null = null;

/** Register the picker bridge; returns an unregister callback for unmount. */
export function registerGntTutorialBridge(bridge: GntTutorialBridge): () => void {
  gntBridge = bridge;
  return () => {
    if (gntBridge === bridge) gntBridge = null;
  };
}

/** The currently mounted picker's bridge, if any. */
export function getGntTutorialBridge(): GntTutorialBridge | null {
  return gntBridge;
}
