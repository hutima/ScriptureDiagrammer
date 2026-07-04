import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useEditorStore, useGuidedStore } from '@/state';
import {
  getGntTutorialBridge,
  isTutorialResetPending,
  isTutorialSeen,
  useTutorialStore,
  type TutorialStepId,
} from './tutorialState';
import { stepById, stepProgress, type TutorialCtx } from './tutorialSteps';

/**
 * First-launch walkthrough overlay: a highlight ring around the current step's
 * control plus a small card with the instruction. Deliberately lightweight and
 * NON-BLOCKING — the dim layer never intercepts pointer events, the highlighted
 * control stays clickable (performing the step is how you advance), focus is
 * never trapped, and Escape / “Exit tour” leaves immediately. Steps advance by
 * OBSERVING the app (store fields and the picker bridge), so doing things out
 * of order, skipping steps, or ignoring the card entirely all just work.
 */

const POLL_MS = 250;

/** Estimated card height used to decide above/below placement (desktop). */
const CARD_H = 230;

function findTargetRect(selector?: string): DOMRect | null {
  if (!selector || typeof document === 'undefined') return null;
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // display:none / detached targets measure 0×0 — treat as missing.
  if (r.width === 0 && r.height === 0) return null;
  return r;
}

export function FirstRunTutorial() {
  const active = useTutorialStore((s) => s.active);
  const firstRun = useEditorStore((s) => s.firstRun);

  // Offer the tour once, after the shell has settled (session restore opens the
  // sources panel and the picker starts loading John). Two reasons to offer it:
  // a device's first-ever launch (`firstRun`), or a one-time version reset for a
  // returning user who saw an OLDER tutorial (`isTutorialResetPending`, see
  // tutorialState). Never when the CURRENT version has been completed/dismissed,
  // and never when localStorage is unavailable (both checks fail open).
  useEffect(() => {
    if (isTutorialSeen()) return;
    if (!firstRun && !isTutorialResetPending()) return;
    const t = setTimeout(() => {
      if (!isTutorialSeen()) useTutorialStore.getState().start();
    }, 700);
    return () => clearTimeout(t);
  }, [firstRun]);

  if (!active) return null;
  return <TutorialOverlay />;
}

function TutorialOverlay() {
  const stepId = useTutorialStore((s) => s.stepId);
  const advance = useTutorialStore((s) => s.advance);
  const exit = useTutorialStore((s) => s.exit);
  const openGuidedIntro = useGuidedStore((s) => s.openIntro);
  const step = stepById(stepId);
  const progress = stepProgress(stepId);

  // Selecting the observed fields makes the overlay re-render (and so re-check
  // isDone) the moment the user performs a step's action through the normal UI.
  const docId = useEditorStore((s) => s.doc.id);
  const glossMode = useEditorStore((s) => s.glossMode);
  const sourceTextVersion = useEditorStore((s) => s.sourceTextVersion);
  const diagramMode = useEditorStore((s) => s.diagramMode);

  // The open document when the step became current — the Open step advances on
  // any change to it (a passage was opened). Set during render on step change
  // so the first done-check of the new step already has it.
  const entryDocId = useRef<string | null>(null);
  const seenStep = useRef<TutorialStepId | null>(null);
  if (seenStep.current !== stepId) {
    seenStep.current = stepId;
    entryDocId.current = useEditorStore.getState().doc.id;
  }

  const ctx = (): TutorialCtx => ({
    editor: useEditorStore.getState(),
    bridge: getGntTutorialBridge(),
    entryDocId: entryDocId.current,
  });

  // Checkbox state (picker bridge) and target geometry aren't store-observable,
  // so tick a few times a second while the tour is up; resize/scroll bump it
  // immediately so the ring tracks drawer slides and layout changes.
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const t = setInterval(bump, POLL_MS);
    window.addEventListener('resize', bump);
    window.addEventListener('scroll', bump, true);
    return () => {
      clearInterval(t);
      window.removeEventListener('resize', bump);
      window.removeEventListener('scroll', bump, true);
    };
  }, []);

  // Advance as soon as the step's action has been performed — whether the user
  // just did it, had already done it, or a skip applied it.
  const done = step.isDone?.(ctx()) ?? false;
  useEffect(() => {
    if (done) advance();
  }, [done, advance, stepId]);

  // The picker steps live in the sources panel: entering them re-opens it if
  // collapsed (once per step entry, so the user can still close it on purpose).
  useEffect(() => {
    if (stepId !== 'pick' && stepId !== 'open') return;
    const s = useEditorStore.getState();
    if (s.leftCollapsed) s.setLeftCollapsed(false);
  }, [stepId]);

  // Escape leaves the tour from anywhere (never a focus trap).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit({ completed: stepId === 'done' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exit, stepId]);

  const rect = findTargetRect(step.targetSelector);
  const missing = !!step.targetSelector && !rect;

  // Card placement: anchored under/over the target on desktop, a fixed bottom
  // card on phones (clear of the Safari bottom bar via the safe-area inset).
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw <= 820;
  const cardW = Math.min(340, vw - 16);
  let cardStyle: CSSProperties;
  if (mobile || !rect) {
    cardStyle = {
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      width: cardW,
    };
  } else {
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 8);
    cardStyle =
      rect.bottom + CARD_H < vh
        ? { left, top: rect.bottom + 12, width: cardW }
        : { left, bottom: vh - rect.top + 12, width: cardW };
  }

  // Reference the observed fields so linters keep them subscribed (their only
  // job is triggering re-renders for the isDone checks above).
  void docId; void glossMode; void sourceTextVersion; void diagramMode;

  return (
    <>
      {rect ? (
        <div
          className="tour-ring"
          aria-hidden="true"
          style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      ) : (
        <div className="tour-dim" aria-hidden="true" />
      )}
      <div className="tour-card" role="dialog" aria-label={`Walkthrough — ${step.title}`} style={cardStyle}>
        <div className="tour-head">
          <span className="tour-progress">
            {progress ? `Step ${progress.n} of ${progress.of}` : 'Walkthrough'}
          </span>
          <button
            className="tour-x"
            aria-label="Exit the walkthrough"
            title="Exit the walkthrough"
            onClick={() => exit({ completed: stepId === 'done' })}
          >
            ✕
          </button>
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body" aria-live="polite">
          {missing ? step.missingText ?? step.body : step.body}
        </p>
        {!missing && step.note && <p className="tour-note">{step.note}</p>}
        <div className="tour-actions">
          {missing && step.recover && (
            <button className="mini" onClick={() => step.recover!.run(ctx())}>
              {step.recover.label}
            </button>
          )}
          {stepId === 'done' ? (
            <>
              <button className="mini" onClick={() => exit({ completed: true })}>
                Finish
              </button>
              <button
                className="mini accept"
                title="Leave the walkthrough and start Guided Exploration"
                onClick={() => {
                  // Close the tour first so it doesn't sit behind the guided
                  // intro modal, then open the Guided Exploration launcher
                  // (Greek/English choice) which enters guided mode.
                  exit({ completed: true });
                  openGuidedIntro();
                }}
              >
                Start Guided Exploration
              </button>
            </>
          ) : (
            <>
              <button
                className="mini"
                title="Do this step for me and move on"
                onClick={() => {
                  step.applyOnSkip?.(ctx());
                  advance();
                }}
              >
                Skip step
              </button>
              <button className="mini tour-leave" title="Leave the walkthrough" onClick={() => exit()}>
                Exit tour
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
