import { useState } from 'react';
import type { HighlightCategory, SermonAnchor } from '@/domain/schema';
import { useEditorStore, useDiscourseStore } from '@/state';
import { formatRange } from '@/domain/discourse';
import { HighlightToolbar } from './HighlightToolbar';
import { describeAnchor, highlightColor, HIGHLIGHT_CATEGORIES } from './highlights';

/** Anchor for the current selection (falls back to the whole passage). */
function selectionAnchor(selection: { nodeId?: string; relationId?: string }): SermonAnchor {
  if (selection.relationId) return { type: 'relation', relationId: selection.relationId };
  if (selection.nodeId) return { type: 'node', nodeId: selection.nodeId };
  return { type: 'passage' };
}

/**
 * Desktop Study workspace. It has TWO shapes over one shared data model:
 *   - the syntax Study panel (default) — notes/highlights against the syntax
 *     document, driven by `useEditorStore`;
 *   - the Discourse Study panel — passage highlights (drag/tap token selection
 *     in the canvas) plus notes/observations/outline against the discourse
 *     document's own sermon record, driven by `useDiscourseStore`.
 * Which one shows is decided by the active visualization; the syntax branch is
 * unchanged.
 */
export function SermonPrepDrawer() {
  const diagramMode = useEditorStore((s) => s.diagramMode);
  return diagramMode === 'discourse' ? <DiscourseStudyPanel /> : <SyntaxSermonPanel />;
}

// --- discourse Study panel --------------------------------------------------------

/** Join a token-id list's surfaces from the discourse doc, truncated for display. */
function surfacesFor(
  tokens: { id: string; surface: string }[],
  tokenIds: string[],
  max = 80,
): string {
  const byId = new Map(tokens.map((t) => [t.id, t.surface]));
  const text = tokenIds.map((id) => byId.get(id) ?? '').filter(Boolean).join(' ');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function DiscourseStudyPanel() {
  const doc = useDiscourseStore((s) => s.doc);
  const sermon = useDiscourseStore((s) => s.sermon);
  const studySelection = useDiscourseStore((s) => s.studySelection);
  const clearStudySelection = useDiscourseStore((s) => s.clearStudySelection);
  const addStudyHighlight = useDiscourseStore((s) => s.addStudyHighlight);
  const removeHighlightById = useDiscourseStore((s) => s.removeHighlightById);
  const setHighlightNote = useDiscourseStore((s) => s.setHighlightNote);
  const addStudyNote = useDiscourseStore((s) => s.addStudyNote);
  const removeStudyNote = useDiscourseStore((s) => s.removeStudyNote);
  const addStudyObservation = useDiscourseStore((s) => s.addStudyObservation);
  const removeStudyObservation = useDiscourseStore((s) => s.removeStudyObservation);
  const setStudyBigIdea = useDiscourseStore((s) => s.setStudyBigIdea);
  const addStudyOutlineSection = useDiscourseStore((s) => s.addStudyOutlineSection);
  const updateStudyOutlineSection = useDiscourseStore((s) => s.updateStudyOutlineSection);
  const removeStudyOutlineSection = useDiscourseStore((s) => s.removeStudyOutlineSection);
  const select = useDiscourseStore((s) => s.select);

  const [quickNote, setQuickNote] = useState('');
  const [obs, setObs] = useState('');

  if (!doc) {
    return (
      <div className="sermon-drawer">
        <section className="sermon-section">
          <p className="empty">Load a discourse range to start studying it.</p>
        </section>
      </div>
    );
  }

  const greek = doc.language !== 'en';
  const selectedUnit = studySelection
    ? doc.units.find((u) => u.id === studySelection.unitId)
    : undefined;
  const selectedWords = studySelection ? surfacesFor(doc.tokens, studySelection.tokenIds) : '';

  // Every study-scope highlight across every unit (for the roll-up list).
  const studyHighlights = doc.units.flatMap((u) =>
    (u.textHighlights ?? [])
      .filter((h) => h.scope === 'study')
      .map((h) => ({ unit: u, highlight: h })),
  );

  const addQuick = () => {
    if (!quickNote.trim()) return;
    const anchor: SermonAnchor = studySelection
      ? { type: 'tokenRange', tokenIds: studySelection.tokenIds, id: studySelection.unitId }
      : { type: 'passage' };
    addStudyNote({ anchor, category: 'observation', body: quickNote });
    setQuickNote('');
  };
  const addObs = () => {
    if (!obs.trim()) return;
    addStudyObservation(obs);
    setObs('');
  };

  const notes = sermon?.notes ?? [];
  const observations = sermon?.observations ?? [];
  const outline = sermon?.outline;

  return (
    <div className="sermon-drawer">
      <section className="sermon-section">
        <h3>This selection</h3>
        {studySelection ? (
          <p className="sermon-anchor">
            <span className={greek ? 'greek' : undefined}>{selectedWords}</span>
            {selectedUnit && (
              <small> · {formatRange(selectedUnit.refStart, selectedUnit.refEnd)}</small>
            )}
            <button className="link-btn sermon-clear" onClick={clearStudySelection}>
              Clear
            </button>
          </p>
        ) : (
          <p className="sermon-anchor muted">Select words in the passage to highlight them.</p>
        )}
        <div className="highlight-toolbar" role="group" aria-label="Highlight">
          {HIGHLIGHT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className="hl-chip"
              style={{ ['--hl' as string]: c.color }}
              title={studySelection ? c.label : 'Select words first'}
              disabled={!studySelection}
              onClick={() => addStudyHighlight(c.id)}
            >
              <span className="hl-swatch" style={{ background: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
        <div className="sermon-quicknote">
          <textarea
            placeholder={
              studySelection ? 'Quick note on the selected words…' : 'Quick note on this passage…'
            }
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
          />
          <button className="btn primary" onClick={addQuick} disabled={!quickNote.trim()}>
            Add note
          </button>
        </div>
      </section>

      <section className="sermon-section">
        <h3>Big idea & outline</h3>
        <textarea
          className="sermon-bigidea"
          placeholder="The one main idea of this passage…"
          value={outline?.bigIdea ?? ''}
          onChange={(e) => setStudyBigIdea(e.target.value)}
        />
        {(outline?.sections ?? []).map((sec, i) => (
          <div key={sec.id} className="outline-section">
            <div className="outline-head">
              <input
                placeholder={`Point ${i + 1}`}
                value={sec.title}
                onChange={(e) => updateStudyOutlineSection(sec.id, { title: e.target.value })}
              />
              <button className="link-btn danger" onClick={() => removeStudyOutlineSection(sec.id)}>
                ✕
              </button>
            </div>
            <textarea
              placeholder="Notes for this point…"
              value={sec.body}
              onChange={(e) => updateStudyOutlineSection(sec.id, { body: e.target.value })}
            />
          </div>
        ))}
        <button className="btn" onClick={addStudyOutlineSection}>
          + Add outline point
        </button>
      </section>

      <section className="sermon-section">
        <h3>Highlights ({studyHighlights.length})</h3>
        {studyHighlights.length === 0 && (
          <p className="empty">
            No highlights yet — select words in the passage and pick a category above.
          </p>
        )}
        <ul className="sermon-list">
          {studyHighlights.map(({ unit, highlight: h }) => (
            <li key={h.id}>
              <span className="hl-swatch" style={{ background: highlightColor(h.category as HighlightCategory) }} />
              <button className="link-btn" onClick={() => select({ unitId: unit.id })}>
                <span className={greek ? 'greek' : undefined}>
                  {surfacesFor(doc.tokens, h.tokenIds, 40)}
                </span>
                <small>
                  {' · '}
                  {formatRange(unit.refStart, unit.refEnd)} · {h.category}
                </small>
              </button>
              <button className="link-btn danger" onClick={() => removeHighlightById(unit.id, h.id)}>
                ✕
              </button>
              <input
                className="hl-note"
                placeholder="Note…"
                value={h.note ?? ''}
                onChange={(e) => setHighlightNote(unit.id, h.id, e.target.value)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="sermon-section">
        <h3>Notes ({notes.length})</h3>
        {notes.length === 0 && <p className="empty">No notes yet.</p>}
        <ul className="sermon-list notes">
          {notes.map((n) => (
            <li key={n.id}>
              <div className="note-meta">
                <span className="note-cat">{n.category}</span>
                {n.anchor.tokenIds?.length ? (
                  <span className={greek ? 'greek' : undefined}>
                    {surfacesFor(doc.tokens, n.anchor.tokenIds, 40)}
                  </span>
                ) : (
                  <span className="muted">passage</span>
                )}
                <button className="link-btn danger" onClick={() => removeStudyNote(n.id)}>
                  ✕
                </button>
              </div>
              {n.body && <p className="note-body">{n.body}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="sermon-section">
        <h3>Observations ({observations.length})</h3>
        <ul className="sermon-list">
          {observations.map((o) => (
            <li key={o.id}>
              <span className="note-body">{o.body}</span>
              <button className="link-btn danger" onClick={() => removeStudyObservation(o.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="sermon-quicknote">
          <textarea
            placeholder="An observation about the text…"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
          <button className="btn" onClick={addObs} disabled={!obs.trim()}>
            Add observation
          </button>
        </div>
      </section>
    </div>
  );
}

// --- syntax Study panel (unchanged behaviour) ------------------------------------

/**
 * Notes/highlights for the current selection, the big idea + outline, and
 * rolled-up lists of every highlight, note, and observation in the passage.
 * Sermon prep is kept separate from Edit mode — it answers "what do I need to
 * notice and preach?", not "what is the syntax?".
 */
function SyntaxSermonPanel() {
  const doc = useEditorStore((s) => s.doc);
  const selection = useEditorStore((s) => s.selection);
  const sermon = useEditorStore((s) => s.sermon);
  const select = useEditorStore((s) => s.select);
  const addSermonNote = useEditorStore((s) => s.addSermonNote);
  const removeSermonNote = useEditorStore((s) => s.removeSermonNote);
  const removeHighlight = useEditorStore((s) => s.removeHighlight);
  const addObservation = useEditorStore((s) => s.addObservation);
  const removeObservation = useEditorStore((s) => s.removeObservation);
  const setBigIdea = useEditorStore((s) => s.setBigIdea);
  const addOutlineSection = useEditorStore((s) => s.addOutlineSection);
  const updateOutlineSection = useEditorStore((s) => s.updateOutlineSection);
  const removeOutlineSection = useEditorStore((s) => s.removeOutlineSection);

  const anchor = selectionAnchor(selection);
  const greek = doc.language === 'grc';
  const [quickNote, setQuickNote] = useState('');
  const [obs, setObs] = useState('');

  const addQuick = () => {
    if (!quickNote.trim()) return;
    addSermonNote({ anchor, category: 'observation', body: quickNote });
    setQuickNote('');
  };
  const addObs = () => {
    if (!obs.trim()) return;
    addObservation(obs);
    setObs('');
  };

  return (
    <div className="sermon-drawer">
      <section className="sermon-section">
        <h3>This selection</h3>
        <p className="sermon-anchor">
          <span className={greek ? 'greek' : undefined}>{describeAnchor(doc, anchor)}</span>
          {(selection.nodeId || selection.relationId) && (
            <button className="link-btn sermon-clear" onClick={() => select({})}>
              Clear selection
            </button>
          )}
        </p>
        <HighlightToolbar anchor={anchor} />
        <div className="sermon-quicknote">
          <textarea
            placeholder="Quick note on this selection…"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
          />
          <button className="btn primary" onClick={addQuick} disabled={!quickNote.trim()}>
            Add note
          </button>
        </div>
      </section>

      <section className="sermon-section">
        <h3>Big idea & outline</h3>
        <textarea
          className="sermon-bigidea"
          placeholder="The one main idea of this passage…"
          value={sermon.outline?.bigIdea ?? ''}
          onChange={(e) => setBigIdea(e.target.value)}
        />
        {(sermon.outline?.sections ?? []).map((sec, i) => (
          <div key={sec.id} className="outline-section">
            <div className="outline-head">
              <input
                placeholder={`Point ${i + 1}`}
                value={sec.title}
                onChange={(e) => updateOutlineSection(sec.id, { title: e.target.value })}
              />
              <button className="link-btn danger" onClick={() => removeOutlineSection(sec.id)}>
                ✕
              </button>
            </div>
            <textarea
              placeholder="Notes for this point…"
              value={sec.body}
              onChange={(e) => updateOutlineSection(sec.id, { body: e.target.value })}
            />
          </div>
        ))}
        <button className="btn" onClick={addOutlineSection}>
          + Add outline point
        </button>
      </section>

      <section className="sermon-section">
        <h3>Highlights ({sermon.highlights.length})</h3>
        {sermon.highlights.length === 0 && <p className="empty">No highlights yet.</p>}
        <ul className="sermon-list">
          {sermon.highlights.map((h) => (
            <li key={h.id}>
              <span className="hl-swatch" style={{ background: highlightColor(h.category) }} />
              <button
                className="link-btn"
                onClick={() => h.anchor.nodeId && select({ nodeId: h.anchor.nodeId })}
              >
                <span className={greek ? 'greek' : undefined}>{describeAnchor(doc, h.anchor)}</span>
                <small> · {h.category}</small>
              </button>
              <button className="link-btn danger" onClick={() => removeHighlight(h.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="sermon-section">
        <h3>Notes ({sermon.notes.length})</h3>
        {sermon.notes.length === 0 && <p className="empty">No notes yet.</p>}
        <ul className="sermon-list notes">
          {sermon.notes.map((n) => (
            <li key={n.id}>
              <div className="note-meta">
                <span className="note-cat">{n.category}</span>
                <button
                  className="link-btn"
                  onClick={() => n.anchor.nodeId && select({ nodeId: n.anchor.nodeId })}
                >
                  <span className={greek ? 'greek' : undefined}>{describeAnchor(doc, n.anchor)}</span>
                </button>
                <button className="link-btn danger" onClick={() => removeSermonNote(n.id)}>
                  ✕
                </button>
              </div>
              {n.title && <strong>{n.title}</strong>}
              {n.body && <p className="note-body">{n.body}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="sermon-section">
        <h3>Observations ({sermon.observations.length})</h3>
        <ul className="sermon-list">
          {sermon.observations.map((o) => (
            <li key={o.id}>
              <span className="note-body">{o.body}</span>
              <button className="link-btn danger" onClick={() => removeObservation(o.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="sermon-quicknote">
          <textarea
            placeholder="An observation about the text…"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
          <button className="btn" onClick={addObs} disabled={!obs.trim()}>
            Add observation
          </button>
        </div>
      </section>
    </div>
  );
}
