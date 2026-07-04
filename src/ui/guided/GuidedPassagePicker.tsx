import { useGuidedStore } from '@/state';
import { visibleGrammarHighlightGuides } from '@/data/grammarHighlights';

/**
 * The curated guided library — replaces the normal source/passage pickers in
 * the left panel while Grammar Highlights is active. Only approved guided
 * examples appear here; the source label deliberately reads "Grammar
 * Highlights", not an unrestricted edition name.
 */
export function GuidedPassagePicker() {
  const selectedGuideId = useGuidedStore((s) => s.selectedGuideId);
  const openGuide = useGuidedStore((s) => s.openGuide);
  return (
    <div className="guided-picker">
      <div className="guided-picker-source">
        Source: <strong>Grammar Highlights</strong> — curated guided passages (SBLGNT text)
      </div>
      <ul className="guided-picker-list">
        {visibleGrammarHighlightGuides.map((g) => (
          <li key={g.id}>
            <button
              className={`guided-picker-item${g.id === selectedGuideId ? ' active' : ''}`}
              onClick={() => openGuide(g.id)}
            >
              <span className="guided-picker-title">{g.title}</span>
              <span className="guided-picker-meta">
                {g.reference} · {g.difficulty}
              </span>
              <span className="guided-picker-summary">{g.summary}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="guided-picker-note">
        More guided examples are coming. Leave guided mode to browse the full Greek and Hebrew
        sources again.
      </p>
    </div>
  );
}
