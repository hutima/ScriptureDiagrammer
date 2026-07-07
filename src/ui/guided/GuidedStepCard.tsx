import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { useDiscourseStore, useEditorStore, useGuidedStore } from '@/state';
import { getGuide } from '@/data/grammarHighlights';
import { getIssueById } from '@/domain/contested';
import type { GrammarHighlightGuide, GuidedGreekTerm, GuidedStep } from '@/domain/schema';
import { GUIDED_HIGHLIGHT_COLORS, usedHighlightKinds } from './focus';
import { GuidedGreekTermPanel } from './GuidedGreekTermPanel';
import { highlightGrammarTerms } from './highlightGrammarTerms';

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
 * turning `[[id]]` markers into either a tappable Greek-term link (the term's
 * surface form) or, when `id` instead names one of the guide's `citations`, a
 * real external hyperlink (the citation's short `label`, e.g. "[1]", with the
 * full bibliographic citation as its accessible/tooltip title). Greek terms
 * are checked first, so the two id spaces may never collide in practice (each
 * guide's own ids are validated distinct by `guided:check`). Unknown ids
 * render as plain text so a typo degrades readably (and `guided:check`
 * catches it at build time anyway). In ENGLISH display mode every term link
 * carries an inline transliteration + gloss (see `inlineGlossFor`), so the
 * explanatory copy stays readable to someone who cannot read Greek script.
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
  // Shared across every plain-text fragment of THIS prose block, so a
  // grammar term found in it gets highlighted only on its first occurrence
  // in the whole block (repeats would just be noise) — see
  // `highlightGrammarTerms`.
  const usedGlossaryTerms = new Set<string>();
  return parts.map((part, i) => {
    if (i % 2 === 0)
      return <Fragment key={i}>{highlightGrammarTerms(part, usedGlossaryTerms, `p${i}`)}</Fragment>;
    const term = guide.greekTerms.find((t) => t.id === part);
    if (term) {
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
    }
    const citation = guide.citations?.find((c) => c.id === part);
    if (citation) {
      return (
        <a
          key={i}
          className="guided-citation-link"
          href={citation.url}
          title={citation.title}
          target="_blank"
          rel="noopener noreferrer"
        >
          {citation.label}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
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
  // Honest, reader-facing note when a discourse-backed guide's range had to
  // fall back to a bundled source (see `GuidedDiscourseRange.fallback`).
  // Shown on EVERY step, not just the first — a reader may land on any step.
  const guidedNotice = useDiscourseStore((s) => s.guidedNotice);

  const scrollRef = useRef<HTMLDivElement>(null);
  const debateRef = useRef<HTMLDetailsElement>(null);
  // Each step (or guide) change starts the card fresh: close the "Where
  // readers differ" disclosure — it belongs to the GUIDE, not the step, so it
  // would otherwise stay open from step to step — and jump the scrollable
  // prose back to the top so the new step is read from its beginning.
  // (`scrollTo` is optional-called: jsdom doesn't implement it.)
  useEffect(() => {
    if (debateRef.current) debateRef.current.open = false;
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [guideId, stepIndex]);

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
      {/* Everything but the nav scrolls in its own inner area, so the nav below
          reads as a fixed header/body/footer bar: it sits at the true bottom of
          the card even when a step's prose is short (nothing to scroll), and it
          stays put — never scrolling out of view — once prose is long enough to
          scroll. See the CSS for `.guided-step-scroll` / `.guided-step-nav`. */}
      <div className="guided-step-scroll" ref={scrollRef}>
        <div className="guided-step-head">
          <span className="guided-step-ref">{guide.reference}</span>
          <span className="guided-step-count">
            Step {stepIndex + 1} of {guide.steps.length}
          </span>
        </div>
        {guidedNotice && <p className="guided-source-notice">{guidedNotice}</p>}
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
        {guide.debateSummary && (
          <details className="guided-debate" ref={debateRef}>
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
    </div>
  );
}
