import { useGuidedStore } from '@/state';
import { Modal } from '@/ui/components/common/Modal';

/**
 * Grammar Highlights entry modal (⋯ → Grammar highlights…). Explains what the
 * guided examples are and asks whether to start in Greek mode (Greek words,
 * tap terms for details) or English mode (glosses/English aids over the same
 * Greek syntax). Choosing either enters guided mode; closing just dismisses.
 */
export function GrammarHighlightsIntroModal({ onClose }: { onClose: () => void }) {
  const enter = useGuidedStore((s) => s.enter);
  return (
    <Modal title="Grammar highlights" onClose={onClose} className="guided-intro-modal">
      <p>
        These are <strong>guided examples</strong> showing why the grammar of the original
        language matters for reading the Bible well. Each one walks through a real passage's
        syntax diagram, a step at a time.
      </p>
      <ul className="guided-intro-points">
        <li>
          The diagram always follows the <strong>Greek grammar</strong> — even when English
          glosses are shown.
        </li>
        <li>
          Keep your own Bible open and <strong>follow along in it</strong>: your translation is
          carrying this same structure into English.
        </li>
        <li>
          The walkthrough illuminates the text; it is <strong>not a replacement</strong> for
          your translation or a commentary.
        </li>
      </ul>
      <p style={{ marginBottom: 6 }}>How would you like to read?</p>
      <div className="guided-intro-choices">
        <button className="btn guided-choice" onClick={() => enter('greek')}>
          <span className="guided-choice-title">Greek mode</span>
          <span className="guided-choice-desc">
            Show the Greek words; tap any term for its parsing and meaning.
          </span>
        </button>
        <button className="btn guided-choice" onClick={() => enter('english')}>
          <span className="guided-choice-title">English mode</span>
          <span className="guided-choice-desc">
            Show English glosses and reading aids — the diagram underneath stays the Greek
            syntax.
          </span>
        </button>
      </div>
    </Modal>
  );
}
