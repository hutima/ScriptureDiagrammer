import { Fragment, type ReactNode } from 'react';
import { useEditorStore, useGuidedStore } from '@/state';
import { getGuide } from '@/data/grammarHighlights';
import { getIssueById } from '@/domain/contested';
import type { GrammarHighlightGuide, GuidedGreekTerm, GuidedStep } from '@/domain/schema';
import { GUIDED_HIGHLIGHT_COLORS, usedHighlightKinds } from './focus';
import { GuidedGreekTermPanel } from './GuidedGreekTermPanel';

const KIND_LABELS: Record<keyof typeof GUIDED_HIGHLIGHT_COLORS, string> = {
  emphasized: 'in focus',
  added: 'added',
  changed: 'changed',
  removed: 'removed',
};

/**
 * The English-mode parenthetical shown after a term link, so a reader who
 * chose English glosses is never faced with bare Greek: "ἀρχῇ (archē,
 * beginning)". When the prose block itself already gives the gloss in-line
 * (e.g. …[[pros]] τὸν θεόν, "with God"…) the parenthetical shortens to just
 * the transliteration — the meaning is already on the line.
 */
function inlineGlossFor(term: GuidedGreekTerm, blockText: string): string {
  const alternatives = term.gloss
    .split(/[,;]\s*/)
    .map((g) => g.trim())
    .filter(Boolean);
  const glossOnLine = alternatives.some((g) => {
    const escaped = g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(blockText);
  });
  if (glossOnLine || alternatives.length === 0) return `(${term.transliteration})`;
  return `(${term.transliteration}, ${alternatives[0]})`;
}

/**
 * Render a step's prose (body, implication, caution, devotional frame),
 * turning `[[termId]]` markers into tappable Greek-term links (the term's
 * surface form). Unknown ids render as plain text so a typo degrades readably
 * (and `guided:check` catches it at build time anyway). In ENGLISH display
 * mode every term link carries an inline transliteration + gloss (see
 * `inlineGlossFor`), so the explanatory copy stays readable to someone who
 * cannot read Greek script.
 */
function renderBody(
  body: string,
  guide: GrammarHighlightGuide,
  onTerm: (id: string) => void,
  english: boolean,
): ReactNode[] {
  const parts = body.split(/\[\[([a-zA-Z0-9_-]+)\]\]/g);
  // The "gloss already on the line" check reads the block's plain prose with
  // marker syntax removed (markers render as Greek, not English).
  const plainText = body.replace(/\[\[[a-zA-Z0-9_-]+\]\]/g, ' ');
  return parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const term = guide.greekTerms.find((t) => t.id === part);
    if (!term) return <Fragment key={i}>{part}</Fragment>;
    return (
      <button key={i} className="guided-term-link" onClick={() => onTerm(term.id)}>
        {term.surface}
        {english && (
          // The space sits OUTSIDE the inline-block span on purpose: leading
          // whitespace inside an inline-block is collapsed by CSS, which ate the
          // gap and rendered "θεὸς(theos)". As a text node in the button's inline
          // flow it survives, giving "θεὸς (theos)".
          <>
            {' '}
            <span className="guided-term-inline-gloss">{inlineGlossFor(term, plainText)}</span>
          </>
        )}
      </button>
    );
  });
}

/**
 * Resolve a step's optional contested-issue reference to a REAL issue that
 * applies to the step's own passage (directly or via `mergePassageIds`).
 * Anything unresolved returns undefined so the affordance degrades to nothing.
 */
function resolveStepContestedIssue(guide: GrammarHighlightGuide, step: GuidedStep) {
  if (!step.contested) return undefined;
  const issue = getIssueById(step.contested.issueId);
  if (!issue) return undefined;
  const passageId = step.passageId ?? guide.bundledPassageIds[0]!;
  const applies =
    issue.passageId === passageId || (issue.mergePassageIds?.includes(passageId) ?? false);
  return applies ? issue : undefined;
}

/**
 * The guided walkthrough card: current step title/body (with tappable Greek
 * terms), the "why it matters" / caution notes, a highlight legend (text +
 * color, never color alone), step navigation, and — when a term is tapped —
 * the term detail panel. Mounted in the right-panel slot on desktop and as a
 * bottom card on mobile; it never blocks the diagram, which stays fully
 * interactive (pan/zoom/tap) between steps.
 */
export function GuidedStepCard() {
  const guideId = useGuidedStore((s) => s.selectedGuideId);
  const stepIndex = useGuidedStore((s) => s.stepIndex);
  const nextStep = useGuidedStore((s) => s.nextStep);
  const prevStep = useGuidedStore((s) => s.prevStep);
  const selectedTermId = useGuidedStore((s) => s.selectedGreekTermId);
  const selectGreekTerm = useGuidedStore((s) => s.selectGreekTerm);
  const english = useGuidedStore((s) => s.displayMode === 'english');
  const openContestedPanel = useEditorStore((s) => s.openContestedPanel);

  const guide = guideId ? getGuide(guideId) : undefined;
  if (!guide) {
    return (
      <div className="guided-step-card">
        <p className="guided-empty">Pick a guided example from the library on the left.</p>
      </div>
    );
  }
  const step = guide.steps[Math.min(stepIndex, guide.steps.length - 1)]!;
  const term: GuidedGreekTerm | undefined = selectedTermId
    ? guide.greekTerms.find((t) => t.id === selectedTermId)
    : undefined;
  const chipTerms = (step.greekTermIds ?? [])
    .map((id) => guide.greekTerms.find((t) => t.id === id))
    .filter((t): t is GuidedGreekTerm => !!t);
  const kinds = usedHighlightKinds(step);
  const contestedIssue = resolveStepContestedIssue(guide, step);

  return (
    <div className="guided-step-card" data-tour="guided-step-card">
      <div className="guided-step-head">
        <span className="guided-step-ref">{guide.reference}</span>
        <span className="guided-step-count">
          Step {stepIndex + 1} of {guide.steps.length}
        </span>
      </div>
      {stepIndex === 0 && guide.devotionalFrame && (
        <p className="guided-frame">{renderBody(guide.devotionalFrame, guide, selectGreekTerm, english)}</p>
      )}
      <h3 className="guided-step-title">{step.title}</h3>
      <p className="guided-step-body">{renderBody(step.body, guide, selectGreekTerm, english)}</p>
      {step.implication && (
        <p className="guided-implication">
          <strong>Why it matters:</strong> {renderBody(step.implication, guide, selectGreekTerm, english)}
        </p>
      )}
      {step.caution && (
        <p className="guided-caution">
          <strong>A caution:</strong> {renderBody(step.caution, guide, selectGreekTerm, english)}
        </p>
      )}
      {chipTerms.length > 0 && (
        <div className="guided-term-chips">
          {chipTerms.map((t) => (
            <button
              key={t.id}
              className={`guided-term-chip${t.id === selectedTermId ? ' active' : ''}`}
              onClick={() => selectGreekTerm(t.id === selectedTermId ? null : t.id)}
            >
              {t.surface}
            </button>
          ))}
        </div>
      )}
      {contestedIssue && (
        <div className="guided-contested">
          {step.contested?.note && <p className="guided-contested-note">{step.contested.note}</p>}
          <button
            className="btn guided-contested-btn"
            title="Open the alternate-readings panel for this debated passage"
            onClick={() => openContestedPanel(contestedIssue.id)}
          >
            See the alternate reading
          </button>
        </div>
      )}
      {term && <GuidedGreekTermPanel term={term} onClose={() => selectGreekTerm(null)} />}
      {kinds.length > 0 && (
        <div className="guided-legend" aria-label="Highlight legend">
          {kinds.map((k) => (
            <span key={k} className="guided-legend-item">
              <span
                className="guided-legend-swatch"
                style={{ background: GUIDED_HIGHLIGHT_COLORS[k] }}
              />
              {KIND_LABELS[k]}
            </span>
          ))}
        </div>
      )}
      <div className="guided-step-nav">
        <button className="btn guided-nav-back" disabled={stepIndex === 0} onClick={prevStep}>
          ← Back
        </button>
        <button
          className="btn primary"
          disabled={stepIndex >= guide.steps.length - 1}
          onClick={nextStep}
        >
          Next →
        </button>
      </div>
      {guide.debateSummary && (
        <details className="guided-debate">
          <summary>Where readers differ</summary>
          <p>{guide.debateSummary.issue}</p>
          <ul>
            {guide.debateSummary.views.map((v) => (
              <li key={v.label}>
                <strong>{v.label}:</strong> {v.summary}
                {v.cautions && v.cautions.length > 0 && (
                  <ul className="guided-debate-cautions">
                    {v.cautions.map((c, i) => (
                      <li key={i} className="guided-debate-caution">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <p className="guided-debate-grammar">{guide.debateSummary.grammarOpensQuestionHow}</p>
        </details>
      )}
    </div>
  );
}
