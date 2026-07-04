import { useEffect, useId, useRef, useState } from 'react';
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
  const popoverId = useId();

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
