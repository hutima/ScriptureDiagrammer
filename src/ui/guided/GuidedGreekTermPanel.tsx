import type { GuidedGreekTerm } from '@/domain/schema';

/**
 * Greek-term detail disclosure: the full form / transliteration / lemma /
 * gloss / parsing / explanation for a term the reader tapped in a step body
 * or chip. Details live HERE so the step card itself stays readable.
 */
export function GuidedGreekTermPanel({
  term,
  onClose,
}: {
  term: GuidedGreekTerm;
  onClose: () => void;
}) {
  return (
    <div className="guided-term-panel" role="region" aria-label={`Greek term ${term.surface}`}>
      <div className="guided-term-head">
        <span className="guided-term-surface">{term.surface}</span>
        <span className="guided-term-translit">{term.transliteration}</span>
        <button className="modal-x" onClick={onClose} aria-label="Close term details">
          ✕
        </button>
      </div>
      <dl className="guided-term-grid">
        <dt>Lemma</dt>
        <dd>{term.lemma}</dd>
        <dt>Gloss</dt>
        <dd>{term.gloss}</dd>
        <dt>Parsing</dt>
        <dd>{term.parsing}</dd>
      </dl>
      <p className="guided-term-explanation">{term.explanation}</p>
      {term.implication && (
        <p className="guided-implication">
          <strong>Why it matters here:</strong> {term.implication}
        </p>
      )}
      {term.caution && (
        <p className="guided-caution">
          <strong>A caution:</strong> {term.caution}
        </p>
      )}
    </div>
  );
}
