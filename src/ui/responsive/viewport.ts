/**
 * VIEWPORT / RESPONSIVE MODEL.
 *
 * Primary design principle: do not force one giant UI onto every screen. We
 * detect three device classes and a user override ("force desktop on a phone")
 * so the shell can present a distinct experience per class while sharing one
 * data model.
 */

export type ViewportKind = 'mobile' | 'tablet' | 'desktop';

/** Breakpoints (px). Tablet is the middle band; desktop is the widest. */
export const MOBILE_MAX = 767;
export const TABLET_MAX = 1023;

export function classifyWidth(width: number): ViewportKind {
  if (width <= MOBILE_MAX) return 'mobile';
  if (width <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

const FORCE_DESKTOP_KEY = 'kr:forceDesktop';

export function loadForceDesktop(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(FORCE_DESKTOP_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveForceDesktop(value: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (value) localStorage.setItem(FORCE_DESKTOP_KEY, '1');
    else localStorage.removeItem(FORCE_DESKTOP_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * TOUCH-DEVICE DETECTION — deliberately separate from the width-based class
 * above. `classifyWidth`/force-desktop describe how wide the window is and
 * what layout the reader WANTS rendered; forcing desktop mode changes the
 * effective viewport class but never changes the PHYSICAL input device. A
 * phone forced into "desktop" is still a touch screen, where pinch-to-zoom on
 * the diagram (see DiagramCanvas's pointer handlers) already covers zooming —
 * so on-screen +/- zoom and row-spacing buttons are redundant chrome there,
 * regardless of the force-desktop preference. We key off pointer coarseness
 * (the primary pointer, which is what actually drives clicks/taps) plus a
 * touch-point/UA fallback for browsers that misreport `pointer`, with a
 * specific carve-out for iPadOS, which reports as a Mac.
 */
let cachedIsTouchDevice: boolean | null = null;

function detectTouchDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      return true;
    }
  } catch {
    /* matchMedia can throw in odd embeddings (e.g. some test/SSR shims) — fall
       through to the touch-point/UA heuristics below. */
  }
  const ua = navigator.userAgent ?? '';
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  if (maxTouchPoints > 1 && /iPhone|iPad|Android/i.test(ua)) return true;
  // iPadOS identifies itself as a Mac ("MacIntel") with no touch-related UA
  // token at all — a touch-capable "Mac" is the only tell available.
  if (navigator.platform === 'MacIntel' && maxTouchPoints > 1) return true;
  return false;
}

/**
 * True when the PHYSICAL device is touch-first (a phone/tablet OS), regardless
 * of the force-desktop layout preference. The device class never changes
 * mid-session, so the result is cached after the first call.
 */
export function isTouchDevice(): boolean {
  if (cachedIsTouchDevice === null) cachedIsTouchDevice = detectTouchDevice();
  return cachedIsTouchDevice;
}

/** Test-only escape hatch: forces the next `isTouchDevice()` call to re-detect. */
export function resetTouchDeviceCache(): void {
  cachedIsTouchDevice = null;
}
