import { useEffect, useRef } from 'react';

/**
 * DISCOURSE FIRST-LOAD MODAL — the one-time guidance dialog shown the first time
 * a user enters Discourse mode. It is a real modal (focus-trapped, Escape- and
 * backdrop-dismissable), NOT an inline notice/banner. Its three actions and the
 * decision of when to show it live in the discourse store; this component is
 * presentation + accessibility only.
 *
 * The modal-dismissed preference is SEPARATE from the default-demo hide flag:
 * every action here dismisses the modal, but only "Remove demo" (elsewhere)
 * hides the demo.
 */
export function DiscourseFirstLoadModal({
  open,
  onUseDemo,
  onStartOwn,
  onDismiss,
}: {
  open: boolean;
  /** "Use demo passage": dismiss + load Ephesians 2:12–19 via the normal loader. */
  onUseDemo: () => void;
  /** "Start with my own passage": dismiss + open the plaintext "New text" flow. */
  onStartOwn: () => void;
  /** "Dismiss": dismiss only — load/hide/reset nothing. */
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  // The control that had focus when the modal opened, so we can restore it.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    // Focus the primary action once mounted.
    primaryRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
        return;
      }
      if (e.key !== 'Tab') return;
      // Basic focus trap: keep Tab / Shift+Tab cycling within the dialog.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      // Return focus to whatever opened the modal.
      returnFocusRef.current?.focus?.();
    };
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onDismiss}>
      <div
        ref={dialogRef}
        className="modal discourse-first-load"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discourseFirstLoadTitle"
        aria-describedby="discourseFirstLoadBody"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, maxHeight: '86vh', overflowY: 'auto' }}
      >
        <h2 className="modal-title" id="discourseFirstLoadTitle">
          Discourse mode is self-directed
        </h2>
        <div id="discourseFirstLoadBody">
          <p style={{ lineHeight: 1.5 }}>
            Discourse mode gives you tools for arranging passages, adding indentation,
            marking relationships, and exploring structures such as contrast, progression,
            inclusio, or chiasm. The app may provide source text and basic suggestions
            where available, but the final structure is your own analysis.
          </p>
          <p className="hint" style={{ lineHeight: 1.5 }}>
            The default demo passage is Ephesians 2:12–19, a compact passage that moves from
            alienation to nearness and reconciliation in Christ. You can edit it, replace it,
            or remove the demo so it does not return automatically.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 16,
          }}
        >
          <button type="button" className="mini" onClick={onDismiss}>
            Dismiss
          </button>
          <button type="button" className="mini" onClick={onStartOwn}>
            Start with my own passage
          </button>
          <button ref={primaryRef} type="button" className="mini accept" onClick={onUseDemo}>
            Use demo passage
          </button>
        </div>
      </div>
    </div>
  );
}
