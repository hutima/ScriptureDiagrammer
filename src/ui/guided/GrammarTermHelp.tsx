import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { GRAMMAR_GLOSSARY, findGrammarGlossaryEntry } from '@/data/grammarGlossary';

/**
 * One regex matching every glossary term/phrase, longest-first so a multi-word
 * entry (e.g. "present participle") is matched whole rather than being
 * shadowed by — or shadowing — a shorter entry ("participle"). Built once at
 * module load; the glossary is static data.
 */
const GRAMMAR_TERM_PATTERN = new RegExp(
  `\\b(${GRAMMAR_GLOSSARY.slice()
    .sort((a, b) => b.term.length - a.term.length)
    .map((e) => e.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})\\b`,
  'gi',
);

/**
 * Wrap the FIRST occurrence of each known glossary term found in a block of
 * guided teaching prose with a `GrammarTermHelp` control, leaving every
 * subsequent occurrence of that same term as plain text (repeat highlights
 * would just be noise). `used` is shared across every plain-text fragment of
 * ONE prose block (a step's body/implication/caution, or a guide's
 * devotional frame) so the "first occurrence" rule holds across the whole
 * block, not just one fragment split out by `[[termId]]` Greek-term markers.
 *
 * `keyPrefix` keeps React keys unique across the several plain-text fragments
 * a single prose block can be split into.
 */
export function highlightGrammarTerms(text: string, used: Set<string>, keyPrefix: string): ReactNode[] {
  if (!text) return [text];
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let n = 0;
  GRAMMAR_TERM_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GRAMMAR_TERM_PATTERN.exec(text))) {
    const matched = match[0];
    const lower = matched.toLowerCase();
    if (used.has(lower)) continue; // already highlighted once in this block
    const entry = findGrammarGlossaryEntry(matched);
    if (!entry) continue;
    nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <GrammarTermHelp key={`${keyPrefix}-gt-${n++}`} term={matched} definition={entry.definition} />,
    );
    lastIndex = match.index + matched.length;
    used.add(lower);
  }
  nodes.push(text.slice(lastIndex));
  return nodes;
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
