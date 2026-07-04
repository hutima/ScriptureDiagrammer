import {
  DiscoursePatchSchema,
  type DiscourseDocument,
  type DiscoursePatch,
} from '@/domain/schema';
import { applyDiscoursePatch, hashDiscourseBase } from '@/domain/discourse';

/**
 * DISCOURSE PERSISTENCE — compact per-range patch records, kept in their OWN
 * localStorage namespace, fully separate from syntax patches (`kr:patch:*`),
 * sermon prep (`kr:sermon:*`), notes (`kr:notes:*`), and contested overlays.
 * Only DIFFS are stored — the base discourse document is regenerated from the
 * source book XML on load. Everything is Zod-validated on the way out so a
 * corrupt record can never crash the app.
 *
 * Keys embed the generated base document id, which itself encodes
 * `sourceId + book + range + granularity` — so a patch can never silently
 * cross source editions or ranges. A `baseHash` guards source drift.
 */

const DISCOURSE_PATCH_PREFIX = 'kr:discourse:';
const LAST_RANGE_KEY = 'kr:lastDiscourse';

// Discourse UI PREFERENCES live under a DISTINCT prefix (`kr:discoursePref:`)
// so they are never caught by the `kr:discourse:` patch-prefix scan in
// `clearAllDiscourseData` (which only clears edit patches + the range pointer).
// Two flags, deliberately SEPARATE:
//   - the first-load guidance modal has been dismissed (a UI preference), and
//   - the default Ephesians demo has been hidden (a content preference).
// Dismissing the modal must NOT hide the demo, and hiding the demo must NOT
// dismiss the modal — so they can never share a key.
const DISCOURSE_PREF_PREFIX = 'kr:discoursePref:';
const FIRST_LOAD_MODAL_DISMISSED_KEY = `${DISCOURSE_PREF_PREFIX}firstLoadModalDismissed`;

/** The stable identity of the built-in default demo passage. */
export const DEFAULT_DEMO_ID = 'ephesians-2-12-19';
const HIDE_DEFAULT_DEMO_KEY = `${DISCOURSE_PREF_PREFIX}hideDefaultDemo:${DEFAULT_DEMO_ID}`;

// Two independent panel-collapse preferences (same `kr:discoursePref:` prefix,
// distinct keys so collapsing one never affects the other):
//   - the Edit-mode toolbar's Structure/Indent/Annotation/History groups
//     (Relate and Delete unit stay outside, always visible);
//   - the relation editor's Type/Label/Confidence/Color/Dash/Width "Style &
//     details" section (the header, Notes, highlights, and Delete stay outside).
// Both default OPEN (absent key === not collapsed).
const TOOLBAR_GROUPS_COLLAPSED_KEY = `${DISCOURSE_PREF_PREFIX}toolbarGroupsCollapsed`;
const RELATION_DETAILS_COLLAPSED_KEY = `${DISCOURSE_PREF_PREFIX}relationDetailsCollapsed`;

function safeGet(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or disabled — degrade to no persistence */
  }
}

function safeRemove(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// --- discourse patches ---------------------------------------------------------

export function saveDiscoursePatch(discourseDocId: string, patch: DiscoursePatch): void {
  safeSet(DISCOURSE_PATCH_PREFIX + discourseDocId, JSON.stringify(patch));
}

export function loadDiscoursePatch(discourseDocId: string): DiscoursePatch | null {
  const raw = safeGet(DISCOURSE_PATCH_PREFIX + discourseDocId);
  if (!raw) return null;
  try {
    const parsed = DiscoursePatchSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function deleteDiscoursePatch(discourseDocId: string): void {
  safeRemove(DISCOURSE_PATCH_PREFIX + discourseDocId);
}

/**
 * Reconstruct the live (edited) discourse document for a generated base —
 * but ONLY when the stored patch was authored against THIS base: the source
 * edition must match and the base fingerprint must not have drifted. On any
 * mismatch the patch is SKIPPED (never deleted) and a warning logged, exactly
 * like the syntax-side `applyStoredPatch`.
 */
export function applyStoredDiscoursePatch(base: DiscourseDocument): DiscourseDocument {
  const patch = loadDiscoursePatch(base.id);
  if (!patch) return base;
  if (patch.base.sourceId !== base.sourceId) {
    console.warn(
      `Stored discourse edits for ${base.id} belong to ${patch.base.sourceId}, not ${base.sourceId}; showing the base unedited.`,
    );
    return base;
  }
  if (patch.base.baseHash && patch.base.baseHash !== hashDiscourseBase(base)) {
    console.warn(
      `Stored discourse edits for ${base.id} were made against a different base version; showing the base unedited.`,
    );
    return base;
  }
  return applyDiscoursePatch(base, patch);
}

// --- last-loaded range (session restore) ----------------------------------------

export interface LastDiscourseRange {
  sourceId: string;
  bookNum: number;
  startRef: string;
  endRef: string;
  granularity: string;
}

export function saveLastDiscourseRange(range: LastDiscourseRange): void {
  safeSet(LAST_RANGE_KEY, JSON.stringify(range));
}

export function loadLastDiscourseRange(): LastDiscourseRange | null {
  const raw = safeGet(LAST_RANGE_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<LastDiscourseRange>;
    if (
      typeof v.sourceId === 'string' &&
      typeof v.bookNum === 'number' &&
      typeof v.startRef === 'string' &&
      typeof v.endRef === 'string'
    ) {
      return {
        sourceId: v.sourceId,
        bookNum: v.bookNum,
        startRef: v.startRef,
        endRef: v.endRef,
        granularity: typeof v.granularity === 'string' ? v.granularity : 'sentence',
      };
    }
    return null;
  } catch {
    return null;
  }
}

// --- UI preferences (first-load modal + default-demo hiding) --------------------

/**
 * Has the user dismissed the one-time Discourse guidance modal? Persists across
 * reloads and PWA/service-worker updates (plain localStorage). Fails safe: if
 * storage is unavailable this returns `false`, so the modal simply shows again
 * rather than blocking the app.
 */
export function isDiscourseFirstLoadModalDismissed(): boolean {
  return safeGet(FIRST_LOAD_MODAL_DISMISSED_KEY) === '1';
}

/** Record that the Discourse guidance modal has been dismissed (idempotent). */
export function dismissDiscourseFirstLoadModal(): void {
  safeSet(FIRST_LOAD_MODAL_DISMISSED_KEY, '1');
}

/**
 * Has the user removed the default Ephesians 2:12–19 demo? When `true` the demo
 * is never auto-restored on future Discourse entries, reloads, or PWA updates.
 * Independent of the modal-dismissed flag.
 */
export function isDefaultDemoHidden(): boolean {
  return safeGet(HIDE_DEFAULT_DEMO_KEY) === '1';
}

/** Hide the default demo so it is not auto-restored (survives reloads/updates). */
export function hideDefaultDemo(): void {
  safeSet(HIDE_DEFAULT_DEMO_KEY, '1');
}

/** Clear the hide flag so the default demo may auto-restore again. */
export function unhideDefaultDemo(): void {
  safeRemove(HIDE_DEFAULT_DEMO_KEY);
}

/** Has the user collapsed the Edit-mode toolbar's grouped tools section? */
export function isDiscourseToolbarGroupsCollapsed(): boolean {
  return safeGet(TOOLBAR_GROUPS_COLLAPSED_KEY) === '1';
}

/** Persist the toolbar grouped-tools collapse state (removes the key when open,
 *  so an absent key and an explicit "open" are indistinguishable — both mean
 *  the OPEN default). */
export function setDiscourseToolbarGroupsCollapsed(collapsed: boolean): void {
  if (collapsed) safeSet(TOOLBAR_GROUPS_COLLAPSED_KEY, '1');
  else safeRemove(TOOLBAR_GROUPS_COLLAPSED_KEY);
}

/** Has the user collapsed the relation editor's "Style & details" section? */
export function isDiscourseRelationDetailsCollapsed(): boolean {
  return safeGet(RELATION_DETAILS_COLLAPSED_KEY) === '1';
}

/** Persist the relation editor's "Style & details" collapse state. */
export function setDiscourseRelationDetailsCollapsed(collapsed: boolean): void {
  if (collapsed) safeSet(RELATION_DETAILS_COLLAPSED_KEY, '1');
  else safeRemove(RELATION_DETAILS_COLLAPSED_KEY);
}

/** Forget the last-loaded range pointer (used when removing the default demo). */
export function clearLastDiscourseRange(): void {
  safeRemove(LAST_RANGE_KEY);
}

/** Remove all discourse patches + the range pointer (backup reset path). */
export function clearAllDiscourseData(): void {
  if (typeof localStorage === 'undefined') return;
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(DISCOURSE_PATCH_PREFIX)) keys.push(k);
    }
  } catch {
    /* ignore */
  }
  for (const k of keys) safeRemove(k);
  safeRemove(LAST_RANGE_KEY);
}
