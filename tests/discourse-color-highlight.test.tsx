import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import {
  addDiscourseRelation,
  addDiscourseTextHighlight,
  applyDiscoursePatch,
  buildDiscourseDocumentFromPlainText,
  diffDiscourseDocuments,
  discourseRows,
  leafUnits,
  mergeAdjacentDiscourseUnits,
  removeDiscourseTextHighlight,
  resolvedRelationColor,
  setDiscourseUnitColor,
  splitDiscourseUnit,
  updateDiscourseRelation,
} from '@/domain/discourse';
import { DiscourseDocumentSchema, DiscoursePatchSchema } from '@/domain/schema';
import { useDiscourseStore } from '@/state';
import { DiscourseUnitBlock } from '@/ui/discourse/DiscourseUnitBlock';
import { DiscourseSidePanel } from '@/ui/discourse/DiscourseSidePanel';

/**
 * Unit color tags + partial-text highlights: pure model (color set/clear,
 * highlight add/remove/split/merge), schema round-trip, store undo/redo +
 * persistence + reset, rendering, and interaction exclusivity with the other
 * "picking" modes (split/relate).
 */

// First sentence has 4 words so a split point can land strictly between a
// spanning highlight's two tokens; the other two sentences exercise merge and
// give a third, untouched neighbour for the color test.
const TEXT = 'Alpha one two three. Beta four. Gamma five.';

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
    isDefaultDemo: false,
    firstLoadModalOpen: false,
    newTextRequest: 0,
  });
}

describe('unit color — pure model', () => {
  it('sets and clears one unit color; neighbours untouched', () => {
    const doc = freshDoc();
    const [a, b, c] = leafUnits(doc);
    const withColor = setDiscourseUnitColor(doc, b!.id, 'blue');
    const by = (d: typeof doc, id: string) => d.units.find((u) => u.id === id)!;
    expect(by(withColor, b!.id).color).toBe('blue');
    expect(by(withColor, a!.id).color).toBeUndefined();
    expect(by(withColor, c!.id).color).toBeUndefined();

    const cleared = setDiscourseUnitColor(withColor, b!.id, undefined);
    expect(by(cleared, b!.id).color).toBeUndefined();
  });

  it('is a no-op for a missing unit or an unchanged color', () => {
    const doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    expect(setDiscourseUnitColor(doc, 'nope', 'red')).toBe(doc);
    expect(setDiscourseUnitColor(doc, u.id, undefined)).toBe(doc); // already untagged
    const tagged = setDiscourseUnitColor(doc, u.id, 'red');
    expect(setDiscourseUnitColor(tagged, u.id, 'red')).toBe(tagged); // same color again
  });

  it('round-trips color + textHighlights through the Zod schema', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    doc = setDiscourseUnitColor(doc, u.id, 'green');
    doc = addDiscourseTextHighlight(doc, u.id, [u.tokenIds[0]!], 'yellow');
    const parsed = DiscourseDocumentSchema.parse(doc);
    const pu = parsed.units.find((x) => x.id === u.id)!;
    expect(pu.color).toBe('green');
    expect(pu.textHighlights).toEqual([
      { id: expect.any(String), tokenIds: [u.tokenIds[0]], color: 'yellow' },
    ]);
  });
});

describe('relation color — resolution + patch round-trip', () => {
  const NOW = '2026-01-01T00:00:00.000Z';

  it('resolves an explicit override, else the type default', () => {
    const doc = freshDoc();
    const [a, b] = leafUnits(doc);
    const withRel = addDiscourseRelation(
      doc,
      { id: 'dr_c', sourceUnitId: a!.id, targetUnitId: b!.id, type: 'ground' },
      NOW,
    );
    const rel = withRel.relations[0]!;
    // No override → type-derived colour (ground = warm brown).
    expect(resolvedRelationColor(rel)).toBe('#8a5d3b');
    // Override wins.
    expect(resolvedRelationColor({ ...rel, color: 'teal' })).toBe('#2f6f6f');
  });

  it('persists a relation colour and clears it (Auto) through diff → JSON → apply', () => {
    const base = freshDoc();
    const [a, b] = leafUnits(base);
    const withRel = addDiscourseRelation(
      base,
      { id: 'dr_c', sourceUnitId: a!.id, targetUnitId: b!.id, type: 'chiasm' },
      NOW,
    );

    // Set the colour and round-trip the patch through serialization.
    const colored = updateDiscourseRelation(withRel, 'dr_c', { color: 'purple' }, NOW);
    let round = DiscoursePatchSchema.parse(
      JSON.parse(JSON.stringify(diffDiscourseDocuments(withRel, colored, NOW))),
    );
    expect(applyDiscoursePatch(withRel, round).relations.find((r) => r.id === 'dr_c')!.color).toBe(
      'purple',
    );

    // Clearing (updateRelation(id, {color: undefined})) must revert to no colour
    // through the same pipeline — the diff drops the undefined field.
    const cleared = updateDiscourseRelation(colored, 'dr_c', { color: undefined }, NOW);
    round = DiscoursePatchSchema.parse(
      JSON.parse(JSON.stringify(diffDiscourseDocuments(withRel, cleared, NOW))),
    );
    expect(
      applyDiscoursePatch(withRel, round).relations.find((r) => r.id === 'dr_c')!.color,
    ).toBeUndefined();
  });
});

describe('text highlights — pure model', () => {
  it('adds a valid highlight; rejects tokenIds foreign to the unit; removes and drops the empty array', () => {
    const doc = freshDoc();
    const [u, other] = leafUnits(doc);

    const added = addDiscourseTextHighlight(doc, u!.id, [u!.tokenIds[0]!], 'red', undefined, 'dh_test');
    const nu = added.units.find((x) => x.id === u!.id)!;
    expect(nu.textHighlights).toEqual([{ id: 'dh_test', tokenIds: [u!.tokenIds[0]], color: 'red' }]);

    // A tokenId belonging to a different unit is rejected — doc unchanged.
    const rejected = addDiscourseTextHighlight(doc, u!.id, [other!.tokenIds[0]!], 'red');
    expect(rejected).toBe(doc);

    // Remove drops the highlight and the (now empty) array entirely.
    const removed = removeDiscourseTextHighlight(added, u!.id, 'dh_test');
    expect(removed.units.find((x) => x.id === u!.id)!.textHighlights).toBeUndefined();
    // Removing an absent highlight is a no-op.
    expect(removeDiscourseTextHighlight(added, u!.id, 'nope')).toBe(added);
  });

  it('split partitions a spanning highlight into both halves (h / h_s); a one-sided highlight stays whole', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[0]!; // "Alpha one two three."
    const [t0, t1, t2] = u.tokenIds;
    // Fully within what will become the first half.
    doc = addDiscourseTextHighlight(doc, u.id, [t0!], 'blue', undefined, 'h_solo');
    // Spans the split point (t1 stays first-half, t2 becomes second-half).
    doc = addDiscourseTextHighlight(doc, u.id, [t1!, t2!], 'red', undefined, 'h');

    doc = splitDiscourseUnit(doc, u.id, t2!);
    const first = doc.units.find((x) => x.id === u.id)!;
    const second = doc.units.find((x) => x.id === `du_s_${t2}`)!;

    expect(first.textHighlights).toEqual([
      { id: 'h_solo', tokenIds: [t0], color: 'blue' },
      { id: 'h', tokenIds: [t1], color: 'red' },
    ]);
    expect(second.textHighlights).toEqual([{ id: 'h_s', tokenIds: [t2], color: 'red' }]);
  });

  it('merge concatenates both units’ highlights', () => {
    let doc = freshDoc();
    const [a, b] = leafUnits(doc);
    doc = addDiscourseTextHighlight(doc, a!.id, [a!.tokenIds[0]!], 'green', undefined, 'ha');
    doc = addDiscourseTextHighlight(doc, b!.id, [b!.tokenIds[0]!], 'purple', undefined, 'hb');
    doc = mergeAdjacentDiscourseUnits(doc, a!.id, b!.id);
    const merged = doc.units.find((x) => x.id === a!.id)!;
    expect(merged.textHighlights).toEqual([
      { id: 'ha', tokenIds: [a!.tokenIds[0]], color: 'green' },
      { id: 'hb', tokenIds: [b!.tokenIds[0]], color: 'purple' },
    ]);
  });
});

describe('store — color/highlight undo/redo, persistence, reset', () => {
  beforeEach(resetStore);

  it('setUnitColor and addTextHighlight are undoable', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const cur = () => useDiscourseStore.getState().doc!;
    const u = leafUnits(cur())[0]!;

    useDiscourseStore.getState().setUnitColor(u.id, 'blue');
    expect(cur().units.find((x) => x.id === u.id)!.color).toBe('blue');

    useDiscourseStore.getState().setHighlightColor('red');
    useDiscourseStore.getState().addTextHighlight(u.id, [u.tokenIds[0]!, u.tokenIds[1]!]);
    const withHl = cur().units.find((x) => x.id === u.id)!;
    expect(withHl.textHighlights).toHaveLength(1);
    expect(withHl.textHighlights![0]!.color).toBe('red');
    // Picking mode closes once the highlight commits.
    expect(useDiscourseStore.getState().highlightPickUnitId).toBeNull();

    useDiscourseStore.getState().undo(); // undo the highlight
    expect(cur().units.find((x) => x.id === u.id)!.textHighlights).toBeUndefined();
    useDiscourseStore.getState().redo();
    expect(cur().units.find((x) => x.id === u.id)!.textHighlights).toHaveLength(1);

    useDiscourseStore.getState().undo(); // undo the highlight again
    useDiscourseStore.getState().undo(); // undo the color
    expect(cur().units.find((x) => x.id === u.id)!.color).toBeUndefined();
  });

  it('persists across a reload of the same plaintext and is cleared by resetEdits', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const u = leafUnits(useDiscourseStore.getState().doc!)[1]!;
    useDiscourseStore.getState().setUnitColor(u.id, 'green');
    useDiscourseStore.getState().addTextHighlight(u.id, [u.tokenIds[0]!]);

    // Fresh session: re-load the same plaintext (same ids/baseHash) → patch reapplies.
    useDiscourseStore.setState({ baseDoc: null, doc: null, past: [], future: [] });
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const reloaded = useDiscourseStore.getState().doc!.units.find((x) => x.id === u.id)!;
    expect(reloaded.color).toBe('green');
    expect(reloaded.textHighlights).toHaveLength(1);

    useDiscourseStore.getState().resetEdits();
    const cleared = useDiscourseStore.getState().doc!.units.find((x) => x.id === u.id)!;
    expect(cleared.color).toBeUndefined();
    expect(cleared.textHighlights).toBeUndefined();
  });
});

describe('rendering', () => {
  afterEach(cleanup);

  it('renders a highlighted unit’s covered token as <span class="discourse-hl hl-yellow">', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    doc = addDiscourseTextHighlight(doc, u.id, [u.tokenIds[0]!], 'yellow');
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
    const mark = container.querySelector('span.discourse-hl.hl-yellow');
    expect(mark).toBeTruthy();
    expect(mark!.textContent).toContain(u.tokenIds[0] ? row.tokens[0]!.surface : '');
  });

  it('the side panel shows the color swatch row when a unit is selected', () => {
    resetStore();
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const u = leafUnits(useDiscourseStore.getState().doc!)[0]!;
    useDiscourseStore.getState().select({ unitId: u.id });
    const { container } = render(createElement(DiscourseSidePanel));
    expect(container.querySelectorAll('.discourse-swatch').length).toBeGreaterThanOrEqual(7);
  });
});

describe('interaction exclusivity', () => {
  beforeEach(resetStore);

  it('beginHighlight then beginSplit clears the highlight-picking state (and vice versa)', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const u = leafUnits(useDiscourseStore.getState().doc!)[0]!;

    useDiscourseStore.getState().beginHighlight(u.id);
    expect(useDiscourseStore.getState().highlightPickUnitId).toBe(u.id);

    useDiscourseStore.getState().beginSplit(u.id);
    expect(useDiscourseStore.getState().highlightPickUnitId).toBeNull();
    expect(useDiscourseStore.getState().splitPickUnitId).toBe(u.id);

    useDiscourseStore.getState().beginHighlight(u.id);
    expect(useDiscourseStore.getState().splitPickUnitId).toBeNull();
    expect(useDiscourseStore.getState().highlightPickUnitId).toBe(u.id);
  });
});
