import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import {
  addDiscourseStudyHighlight,
  applyDiscoursePatch,
  buildDiscourseDocumentFromPlainText,
  diffDiscourseDocuments,
  discourseRows,
  leafUnits,
  setDiscourseTextHighlightNote,
} from '@/domain/discourse';
import { DiscourseDocumentSchema, DiscoursePatchSchema } from '@/domain/schema';
import { useDiscourseStore } from '@/state';
import { DiscourseUnitBlock } from '@/ui/discourse/DiscourseUnitBlock';
import { highlightColor } from '@/ui/sermon/highlights';

/**
 * Phase 4 — Study-mode passage highlights: schema backward-compat + new-field
 * round-trip, the store's studySelection → addStudyHighlight / remove / note
 * flow (incl. undo/redo), and category-coloured rendering of a study highlight.
 */

const TEXT = 'Alpha one two three. Beta four. Gamma five.';
const NOW = '2026-01-01T00:00:00.000Z';

function freshDoc() {
  return buildDiscourseDocumentFromPlainText(TEXT, { title: 'T' })!;
}

function resetStore() {
  localStorage.clear();
  useDiscourseStore.setState({
    baseDoc: null,
    doc: null,
    status: 'idle',
    error: null,
    past: [],
    future: [],
    selection: {},
    pendingRelationSource: null,
    typeEditRelationId: null,
    splitPickUnitId: null,
    highlightPickUnitId: null,
    highlightColor: 'yellow',
    multiSelectedUnitIds: [],
    studySelection: null,
    sermon: null,
    isDefaultDemo: false,
    firstLoadModalOpen: false,
    newTextRequest: 0,
  });
}

describe('schema — textHighlights backward compat + new fields', () => {
  it('parses a legacy colour-only highlight entry (no scope/category)', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    // Hand-craft a legacy entry: {id, tokenIds, color} — as older builds stored.
    doc = {
      ...doc,
      units: doc.units.map((x) =>
        x.id === u.id
          ? { ...x, textHighlights: [{ id: 'legacy1', tokenIds: [u.tokenIds[0]!], color: 'yellow' }] }
          : x,
      ),
    };
    const parsed = DiscourseDocumentSchema.parse(doc);
    const pu = parsed.units.find((x) => x.id === u.id)!;
    expect(pu.textHighlights).toEqual([
      { id: 'legacy1', tokenIds: [u.tokenIds[0]], color: 'yellow' },
    ]);
  });

  it('round-trips a study highlight through diff → JSON → parse → apply', () => {
    const base = freshDoc();
    const u = leafUnits(base)[0]!;
    const withHl = addDiscourseStudyHighlight(
      base,
      u.id,
      [u.tokenIds[0]!, u.tokenIds[1]!],
      'command',
      NOW,
      'hl_test',
    );
    const noted = setDiscourseTextHighlightNote(withHl, u.id, 'hl_test', 'a key command', NOW);

    const round = DiscoursePatchSchema.parse(
      JSON.parse(JSON.stringify(diffDiscourseDocuments(base, noted, NOW))),
    );
    const applied = applyDiscoursePatch(base, round);
    const h = applied.units.find((x) => x.id === u.id)!.textHighlights![0]!;
    expect(h).toMatchObject({
      id: 'hl_test',
      scope: 'study',
      category: 'command',
      note: 'a key command',
      tokenIds: [u.tokenIds[0], u.tokenIds[1]],
    });
    // No stray `color` on a study highlight.
    expect(h.color).toBeUndefined();
  });
});

describe('pure mutation — addDiscourseStudyHighlight / note', () => {
  it('rejects tokenIds foreign to the unit; sets and clears a note', () => {
    const doc = freshDoc();
    const [u, other] = leafUnits(doc);
    // Foreign token → no-op.
    expect(addDiscourseStudyHighlight(doc, u!.id, [other!.tokenIds[0]!], 'promise')).toBe(doc);

    const added = addDiscourseStudyHighlight(doc, u!.id, [u!.tokenIds[0]!], 'promise', NOW, 'h1');
    const noted = setDiscourseTextHighlightNote(added, u!.id, 'h1', 'note text', NOW);
    expect(noted.units.find((x) => x.id === u!.id)!.textHighlights![0]!.note).toBe('note text');
    const cleared = setDiscourseTextHighlightNote(noted, u!.id, 'h1', '   ', NOW);
    expect(cleared.units.find((x) => x.id === u!.id)!.textHighlights![0]!.note).toBeUndefined();
    // A note on a missing highlight is a no-op.
    expect(setDiscourseTextHighlightNote(added, u!.id, 'nope', 'x', NOW)).toBe(added);
  });
});

describe('store — study selection → highlight, undo/redo, note, remove', () => {
  beforeEach(resetStore);

  it('addStudyHighlight consumes the selection and is undoable', () => {
    const store = useDiscourseStore.getState();
    store.loadPlainText(TEXT, 'T');
    const cur = () => useDiscourseStore.getState().doc!;
    const u = leafUnits(cur())[0]!;

    useDiscourseStore.getState().setStudySelection({ unitId: u.id, tokenIds: [u.tokenIds[0]!] });
    useDiscourseStore.getState().addStudyHighlight('mainIdea');

    const hl = () => cur().units.find((x) => x.id === u.id)!.textHighlights;
    expect(hl()).toHaveLength(1);
    expect(hl()![0]).toMatchObject({ scope: 'study', category: 'mainIdea', tokenIds: [u.tokenIds[0]] });
    // Selection is consumed once committed.
    expect(useDiscourseStore.getState().studySelection).toBeNull();

    useDiscourseStore.getState().undo();
    expect(hl()).toBeUndefined();
    useDiscourseStore.getState().redo();
    expect(hl()).toHaveLength(1);
  });

  it('addStudyHighlight is a no-op with no selection', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const before = useDiscourseStore.getState().doc;
    useDiscourseStore.getState().addStudyHighlight('warning');
    expect(useDiscourseStore.getState().doc).toBe(before);
  });

  it('setHighlightNote + removeHighlightById work and persist across reload', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const cur = () => useDiscourseStore.getState().doc!;
    const u = leafUnits(cur())[0]!;
    useDiscourseStore.getState().setStudySelection({ unitId: u.id, tokenIds: [u.tokenIds[0]!] });
    useDiscourseStore.getState().addStudyHighlight('emphasis');
    const hid = cur().units.find((x) => x.id === u.id)!.textHighlights![0]!.id;

    useDiscourseStore.getState().setHighlightNote(u.id, hid, 'remember this');
    expect(cur().units.find((x) => x.id === u.id)!.textHighlights![0]!.note).toBe('remember this');

    // Reload same plaintext (same ids/baseHash) → patch reapplies.
    useDiscourseStore.setState({ baseDoc: null, doc: null, past: [], future: [] });
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const reloaded = useDiscourseStore.getState().doc!.units.find((x) => x.id === u.id)!;
    expect(reloaded.textHighlights![0]!.note).toBe('remember this');

    useDiscourseStore.getState().removeHighlightById(u.id, hid);
    expect(useDiscourseStore.getState().doc!.units.find((x) => x.id === u.id)!.textHighlights).toBeUndefined();
  });

  it('deleteUnit clears a study selection pointing at the gone unit', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const u = leafUnits(useDiscourseStore.getState().doc!)[0]!;
    useDiscourseStore.getState().setStudySelection({ unitId: u.id, tokenIds: [u.tokenIds[0]!] });
    useDiscourseStore.getState().deleteUnit(u.id);
    expect(useDiscourseStore.getState().studySelection).toBeNull();
  });
});

describe('store — discourse sermon record', () => {
  beforeEach(resetStore);

  it('notes / observations / big idea are held + persisted separately from the doc', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const docId = useDiscourseStore.getState().doc!.id;
    expect(useDiscourseStore.getState().sermon?.passageId).toBe(docId);

    useDiscourseStore.getState().addStudyNote({ anchor: { type: 'passage' }, category: 'observation', body: 'hi' });
    useDiscourseStore.getState().addStudyObservation('an observation');
    useDiscourseStore.getState().setStudyBigIdea('The big idea');

    const sermon = useDiscourseStore.getState().sermon!;
    expect(sermon.notes).toHaveLength(1);
    expect(sermon.observations).toHaveLength(1);
    expect(sermon.outline?.bigIdea).toBe('The big idea');

    // Persisted under kr:sermon:<docId>; a fresh load restores it.
    useDiscourseStore.setState({ baseDoc: null, doc: null, sermon: null, past: [], future: [] });
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const restored = useDiscourseStore.getState().sermon!;
    expect(restored.notes).toHaveLength(1);
    expect(restored.outline?.bigIdea).toBe('The big idea');

    // Sermon data is NOT in the discourse undo history.
    expect(useDiscourseStore.getState().past).toHaveLength(0);
  });
});

describe('rendering — study highlight is category-coloured', () => {
  afterEach(cleanup);

  it('paints a study-scope token with the category tint', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    doc = addDiscourseStudyHighlight(doc, u.id, [u.tokenIds[0]!], 'command', NOW, 'h1');
    const row = discourseRows(doc).find((r) => r.unit.id === u.id)!;
    const { container } = render(
      createElement(DiscourseUnitBlock, {
        row,
        view: useDiscourseStore.getState().view,
        selected: false,
        relationCount: 0,
        registerEl: () => {},
        onSelect: () => {},
      }),
    );
    const mark = container.querySelector('span.discourse-hl-study') as HTMLElement | null;
    expect(mark).toBeTruthy();
    // Inline background derived from the sermon category colour.
    expect(mark!.style.background.toLowerCase()).toContain(highlightColor('command').toLowerCase());
  });

  it('renders selectable token spans in study mode', () => {
    const doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    const row = discourseRows(doc).find((r) => r.unit.id === u.id)!;
    const { container } = render(
      createElement(DiscourseUnitBlock, {
        row,
        view: useDiscourseStore.getState().view,
        selected: false,
        relationCount: 0,
        registerEl: () => {},
        onSelect: () => {},
        studyMode: true,
        studySelectionTokenIds: [u.tokenIds[0]!],
        onStudySelect: () => {},
      }),
    );
    const words = container.querySelectorAll('span.discourse-study-word');
    expect(words.length).toBe(row.tokens.length);
    // The selected token carries the pending-selection class.
    expect(container.querySelector('span.discourse-study-word.selected')).toBeTruthy();
  });
});
