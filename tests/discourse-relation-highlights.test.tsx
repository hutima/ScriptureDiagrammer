import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import {
  addDiscourseRelation,
  addDiscourseRelationHighlight,
  addDiscourseStudyHighlight,
  applyDiscoursePatch,
  buildDiscourseDocumentFromPlainText,
  deleteDiscourseRelation,
  diffDiscourseDocuments,
  discourseRows,
  leafUnits,
  toggleDiscourseRelationHighlightToken,
} from '@/domain/discourse';
import { DiscoursePatchSchema } from '@/domain/schema';
import { useDiscourseStore } from '@/state';
import { DiscourseUnitBlock } from '@/ui/discourse/DiscourseUnitBlock';

/**
 * Phase 5 — Relation-scope passage highlights: pure add/toggle/prune mutations,
 * a diff → JSON → parse → apply round-trip, relation-coloured (and orphan-safe)
 * rendering, and the store's begin/add/toggle flow with undo/redo.
 */

const TEXT = 'Alpha one two three. Beta four five. Gamma six seven.';
const NOW = '2026-01-01T00:00:00.000Z';

function freshDoc() {
  return buildDiscourseDocumentFromPlainText(TEXT, { title: 'T' })!;
}

/** A doc with two leaf units joined by a relation `rel_1`. */
function docWithRelation() {
  const base = freshDoc();
  const [a, b] = leafUnits(base);
  const withRel = addDiscourseRelation(
    base,
    { sourceUnitId: a!.id, targetUnitId: b!.id, id: 'rel_1' },
    NOW,
  );
  return { doc: withRel, a: a!, b: b! };
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
    relationHighlightPickRelationId: null,
    highlightColor: 'yellow',
    multiSelectedUnitIds: [],
    studySelection: null,
    sermon: null,
    isDefaultDemo: false,
    firstLoadModalOpen: false,
    newTextRequest: 0,
  });
}

describe('pure mutation — addDiscourseRelationHighlight', () => {
  it('adds a scope:relation highlight, rejects foreign tokens, has no colour', () => {
    const { doc, a, b } = docWithRelation();
    // Foreign token (belongs to another unit) → no-op.
    expect(addDiscourseRelationHighlight(doc, a.id, [b.tokenIds[0]!], 'rel_1')).toBe(doc);

    const added = addDiscourseRelationHighlight(
      doc,
      a.id,
      [a.tokenIds[1]!, a.tokenIds[0]!], // out of order on purpose
      'rel_1',
      NOW,
      'rh_1',
    );
    const h = added.units.find((u) => u.id === a.id)!.textHighlights![0]!;
    expect(h).toMatchObject({ id: 'rh_1', scope: 'relation', relationId: 'rel_1' });
    expect(h.color).toBeUndefined();
    // Re-ordered to the unit's surface order.
    expect(h.tokenIds).toEqual([a.tokenIds[0], a.tokenIds[1]]);
  });
});

describe('pure mutation — toggleDiscourseRelationHighlightToken', () => {
  it('adds a token, then removes it (dropping the emptied entry)', () => {
    const { doc, a } = docWithRelation();
    const on = toggleDiscourseRelationHighlightToken(doc, a.id, a.tokenIds[0]!, 'rel_1', NOW);
    const hl = on.units.find((u) => u.id === a.id)!.textHighlights!;
    expect(hl).toHaveLength(1);
    expect(hl[0]).toMatchObject({ scope: 'relation', relationId: 'rel_1', tokenIds: [a.tokenIds[0]] });

    const off = toggleDiscourseRelationHighlightToken(on, a.id, a.tokenIds[0]!, 'rel_1', NOW);
    expect(off.units.find((u) => u.id === a.id)!.textHighlights).toBeUndefined();
  });

  it('shrinks a multi-token entry when one of its tokens is tapped off', () => {
    const { doc, a } = docWithRelation();
    const added = addDiscourseRelationHighlight(
      doc,
      a.id,
      [a.tokenIds[0]!, a.tokenIds[1]!],
      'rel_1',
      NOW,
      'rh_1',
    );
    const shrunk = toggleDiscourseRelationHighlightToken(added, a.id, a.tokenIds[0]!, 'rel_1', NOW);
    const h = shrunk.units.find((u) => u.id === a.id)!.textHighlights![0]!;
    expect(h.tokenIds).toEqual([a.tokenIds[1]]);
  });
});

describe('pure mutation — deleteDiscourseRelation prunes its highlights', () => {
  it('drops only the deleted relation’s highlights; keeps others', () => {
    const { doc, a } = docWithRelation();
    // A second relation to prove selectivity.
    const two = addDiscourseRelation(doc, { sourceUnitId: a.id, targetUnitId: leafUnits(doc)[1]!.id, id: 'rel_2' }, NOW);
    let d = addDiscourseRelationHighlight(two, a.id, [a.tokenIds[0]!], 'rel_1', NOW, 'rh_1');
    d = addDiscourseRelationHighlight(d, a.id, [a.tokenIds[1]!], 'rel_2', NOW, 'rh_2');
    d = addDiscourseStudyHighlight(d, a.id, [a.tokenIds[2]!], 'command', NOW, 'sh_1');

    const afterDelete = deleteDiscourseRelation(d, 'rel_1', NOW);
    const remaining = afterDelete.units.find((u) => u.id === a.id)!.textHighlights!;
    const ids = remaining.map((h) => h.id).sort();
    // rel_1's highlight is gone; rel_2's + the study highlight survive.
    expect(ids).toEqual(['rh_2', 'sh_1']);
    expect(afterDelete.relations.some((r) => r.id === 'rel_1')).toBe(false);
  });
});

describe('patch round-trip — relation highlight survives diff → JSON → parse → apply', () => {
  it('preserves scope/relationId/tokenIds', () => {
    const { doc, a } = docWithRelation();
    const withHl = addDiscourseRelationHighlight(doc, a.id, [a.tokenIds[0]!], 'rel_1', NOW, 'rh_1');
    const round = DiscoursePatchSchema.parse(
      JSON.parse(JSON.stringify(diffDiscourseDocuments(doc, withHl, NOW))),
    );
    const applied = applyDiscoursePatch(doc, round);
    const h = applied.units.find((u) => u.id === a.id)!.textHighlights![0]!;
    expect(h).toMatchObject({ id: 'rh_1', scope: 'relation', relationId: 'rel_1', tokenIds: [a.tokenIds[0]] });
    expect(h.color).toBeUndefined();
  });
});

describe('rendering — relation-scope highlight uses the relation palette colour', () => {
  afterEach(cleanup);

  const RELATION_HEX = '#4a5f8a';

  function rowFor() {
    const { doc, a } = docWithRelation();
    const withHl = addDiscourseRelationHighlight(doc, a.id, [a.tokenIds[0]!], 'rel_1', NOW, 'rh_1');
    const row = discourseRows(withHl).find((r) => r.unit.id === a.id)!;
    return row;
  }

  it('tints the token with the relation’s resolved colour', () => {
    const row = rowFor();
    const { container } = render(
      createElement(DiscourseUnitBlock, {
        row,
        view: useDiscourseStore.getState().view,
        selected: false,
        relationCount: 1,
        registerEl: () => {},
        onSelect: () => {},
        relationColors: new Map([['rel_1', RELATION_HEX]]),
      }),
    );
    const mark = container.querySelector('span.discourse-hl-relation') as HTMLElement | null;
    expect(mark).toBeTruthy();
    expect(mark!.style.background.toLowerCase()).toContain(RELATION_HEX);
  });

  it('renders an orphaned relationId neutrally (no crash, no relation tint)', () => {
    const row = rowFor();
    const { container } = render(
      createElement(DiscourseUnitBlock, {
        row,
        view: useDiscourseStore.getState().view,
        selected: false,
        relationCount: 0,
        registerEl: () => {},
        onSelect: () => {},
        // Empty map → the relationId resolves to nothing.
        relationColors: new Map(),
      }),
    );
    expect(container.querySelector('span.discourse-hl-relation')).toBeNull();
    // The words still render.
    expect(container.textContent).toContain('Alpha');
  });
});

describe('store — relation highlight begin/add/toggle with undo/redo', () => {
  beforeEach(resetStore);

  function setup() {
    const store = useDiscourseStore.getState();
    store.loadPlainText(TEXT, 'T');
    const cur = () => useDiscourseStore.getState().doc!;
    const [a, b] = leafUnits(cur());
    useDiscourseStore.getState().addRelation({ sourceUnitId: a!.id, targetUnitId: b!.id, id: 'rel_1' });
    useDiscourseStore.getState().select({ relationId: 'rel_1' });
    return { cur, a: a!, b: b! };
  }

  it('addRelationHighlight commits to the picked relation and is undoable', () => {
    const { cur, a } = setup();
    useDiscourseStore.getState().beginRelationHighlight('rel_1');
    expect(useDiscourseStore.getState().relationHighlightPickRelationId).toBe('rel_1');

    useDiscourseStore.getState().addRelationHighlight(a.id, [a.tokenIds[0]!]);
    const hl = () => cur().units.find((u) => u.id === a.id)!.textHighlights;
    expect(hl()).toHaveLength(1);
    expect(hl()![0]).toMatchObject({ scope: 'relation', relationId: 'rel_1' });

    useDiscourseStore.getState().undo();
    expect(hl()).toBeUndefined();
    useDiscourseStore.getState().redo();
    expect(hl()).toHaveLength(1);
  });

  it('addRelationHighlight is a no-op with no relation in pick mode', () => {
    const { cur, a } = setup();
    const before = cur();
    useDiscourseStore.getState().addRelationHighlight(a.id, [a.tokenIds[0]!]);
    expect(useDiscourseStore.getState().doc).toBe(before);
  });

  it('toggleRelationHighlightToken removes a highlighted token', () => {
    const { cur, a } = setup();
    useDiscourseStore.getState().beginRelationHighlight('rel_1');
    useDiscourseStore.getState().toggleRelationHighlightToken(a.id, a.tokenIds[0]!);
    expect(cur().units.find((u) => u.id === a.id)!.textHighlights).toHaveLength(1);
    useDiscourseStore.getState().toggleRelationHighlightToken(a.id, a.tokenIds[0]!);
    expect(cur().units.find((u) => u.id === a.id)!.textHighlights).toBeUndefined();
  });

  it('selecting a different relation leaves relation pick mode', () => {
    setup();
    useDiscourseStore.getState().beginRelationHighlight('rel_1');
    useDiscourseStore.getState().select({ relationId: 'other' });
    expect(useDiscourseStore.getState().relationHighlightPickRelationId).toBeNull();
  });

  it('deleteRelation prunes its highlights and exits pick mode', () => {
    const { cur, a } = setup();
    useDiscourseStore.getState().beginRelationHighlight('rel_1');
    useDiscourseStore.getState().addRelationHighlight(a.id, [a.tokenIds[0]!]);
    useDiscourseStore.getState().deleteRelation('rel_1');
    expect(cur().units.find((u) => u.id === a.id)!.textHighlights).toBeUndefined();
    expect(useDiscourseStore.getState().relationHighlightPickRelationId).toBeNull();
  });
});
