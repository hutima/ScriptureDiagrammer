import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

/** Minimum gap kept between the popover and the viewport edges. */
const VIEWPORT_MARGIN = 10;
/** Vertical gap between the trigger and the popover (matches the CSS `6px`). */
const TRIGGER_GAP = 6;
/** Below this viewport width the popover goes full-width (`position: fixed`). */
const FULL_WIDTH_BREAKPOINT = 480;

/**
 * Measure the just-opened popover against the viewport and write inline style
 * overrides so it never renders off-screen:
 *
 * - Normally it stays `position: absolute` (anchored to the trigger) but is
 *   clamped horizontally to the viewport, and flips above the trigger when
 *   there is not enough room below (and more room above).
 * - On narrow viewports (< 480px), or when even a clamped popover cannot fit,
 *   it switches to `position: fixed` spanning the viewport width (with side
 *   margins) so the definition text gets maximum room.
 *
 * Positions are computed from the popover's own DEFAULT rect (inline styles
 * are cleared before measuring), so the math is exact even when the inline
 * wrapper fragments across line boxes.
 */
function positionPopover(popover: HTMLElement, trigger: HTMLElement) {
  // Reset any override from a previous pass so we measure the CSS defaults.
  popover.style.position = '';
  popover.style.left = '';
  popover.style.right = '';
  popover.style.top = '';
  popover.style.bottom = '';
  popover.style.width = '';

  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const triggerRect = trigger.getBoundingClientRect();
  const defaultRect = popover.getBoundingClientRect();

  const fitsWhenClamped = defaultRect.width <= viewportWidth - 2 * VIEWPORT_MARGIN;
  if (viewportWidth < FULL_WIDTH_BREAKPOINT || !fitsWhenClamped) {
    // Full-width mode: fixed, spanning the viewport with side margins.
    popover.style.position = 'fixed';
    popover.style.left = `${VIEWPORT_MARGIN}px`;
    popover.style.right = `${VIEWPORT_MARGIN}px`;
    popover.style.width = 'auto';
    popover.style.bottom = 'auto';
    // The new width can change the wrapped height — re-measure before
    // choosing above vs. below.
    const height = popover.getBoundingClientRect().height;
    const belowTop = triggerRect.bottom + TRIGGER_GAP;
    const fitsBelow = belowTop + height <= viewportHeight - VIEWPORT_MARGIN;
    const aboveTop = triggerRect.top - TRIGGER_GAP - height;
    const top = fitsBelow
      ? belowTop
      : aboveTop >= VIEWPORT_MARGIN
        ? aboveTop
        : // Fits neither side: clamp within the viewport (top-aligned).
          Math.max(VIEWPORT_MARGIN, Math.min(belowTop, viewportHeight - VIEWPORT_MARGIN - height));
    popover.style.top = `${top}px`;
    return;
  }

  // Anchored mode: clamp horizontally by shifting relative to the default
  // position (CSS `left: 0` on the wrapper).
  const maxLeft = viewportWidth - VIEWPORT_MARGIN - defaultRect.width;
  const clampedLeft = Math.max(VIEWPORT_MARGIN, Math.min(defaultRect.left, maxLeft));
  if (clampedLeft !== defaultRect.left) {
    popover.style.left = `${clampedLeft - defaultRect.left}px`;
  }

  // Flip above the trigger when it overflows below and there is more room above.
  const overflowsBelow = defaultRect.bottom > viewportHeight - VIEWPORT_MARGIN;
  const spaceAbove = triggerRect.top - TRIGGER_GAP - VIEWPORT_MARGIN;
  const spaceBelow = viewportHeight - VIEWPORT_MARGIN - (triggerRect.bottom + TRIGGER_GAP);
  if (overflowsBelow && spaceAbove > spaceBelow) {
    popover.style.top = 'auto';
    popover.style.bottom = `calc(100% + ${TRIGGER_GAP}px)`;
  }
}
/**
 * Inline "grammar term help": a single occurrence of a known glossary term in
 * guided teaching prose, rendered as a dashed-underline, `cursor: help`
 * control in normal tab order. Activating it (click/tap, Enter, or Space)
 * opens a small anchored popover with the term's beginner-friendly
 * definition; Escape, an outside click, or the popover's own Close button
 * dismiss it. The visible text is exactly the matched word/phrase (so
 * copy/pasting the surrounding prose is unaffected) — the accessible name
 * carries the "definition available" hint instead.
 *
 * Deliberately styled distinctly from `.guided-term-link` (the Greek
 * word/gloss buttons elsewhere in this prose): no accent color or bold
 * weight, a DASHED (not dotted) underline, and `cursor: help` (not
 * `pointer`) — so "tap for the Greek word" and "tap for what this grammar
 * word means" never look like the same affordance.
 */
export function GrammarTermHelp({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();

  // Keep the popover on-screen: position it right after it opens (before
  // paint), and re-position while open on resize/scroll. Inline styles are
  // written directly to the popover element (React sets no `style` prop on
  // it, so nothing fights these overrides).
  useLayoutEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (popoverRef.current && triggerRef.current) {
        positionPopover(popoverRef.current, triggerRef.current);
      }
    };
    reposition();
    window.addEventListener('resize', reposition);
    // Capture-phase so scrolls inside nested scroll containers also re-anchor.
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: Event) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <span className="grammar-term-help-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className="grammar-term-help"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`${term} — grammar term, definition available`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          // Handled explicitly (rather than relying on the browser's native
          // Enter/Space-on-button activation) so this is deterministic in
          // every environment; `preventDefault` stops the browser from ALSO
          // synthesizing its own click for Enter/Space, which would double-
          // toggle the popover right back closed.
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        {term}
      </button>
      {open && (
        // Plain `phrasing content` tags only (span/button, no div/p): this
        // popover can render while nested inside the surrounding prose's own
        // `<p>` (`.guided-step-body` etc.), and a block-level tag there would
        // be invalid HTML — the browser would silently close the outer `<p>`
        // early, splitting the DOM out from under React. `position: absolute`
        // (see the CSS) still gives it its own block-formatting box visually.
        <span
          id={popoverId}
          ref={popoverRef}
          className="grammar-term-popover"
          role="dialog"
          aria-label={`Definition of ${term}`}
        >
          <span className="grammar-term-popover-def">{definition}</span>
          <button
            type="button"
            className="link-btn grammar-term-popover-close"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </span>
      )}
    </span>
  );
}
