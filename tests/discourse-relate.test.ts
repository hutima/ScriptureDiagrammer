import { describe, it, expect, beforeEach } from 'vitest';
import {
  addDiscourseRelation,
  buildDiscourseDocumentFromPlainText,
  leafUnits,
} from '@/domain/discourse';
import { DiscourseRelationSchema } from '@/domain/schema';
import { useDiscourseStore } from '@/state';

/**
 * Part D — the Relate workflow: the connector is created the moment both ends
 * are picked (untyped), and relation type is OPTIONAL metadata added afterwards.
 */

const TEXT = 'Alpha one. Beta two. Gamma three.';

describe('relations — type is optional in the model', () => {
  it('the schema accepts a relation with no type', () => {
    const parsed = DiscourseRelationSchema.safeParse({
      id: 'dr_1',
      sourceUnitId: 'a',
      targetUnitId: 'b',
      provenance: { source: 'manual', confidence: 'high' },
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.type).toBeUndefined();
  });

  it('addDiscourseRelation creates an untyped link when no type is given', () => {
    const doc = buildDiscourseDocumentFromPlainText(TEXT, { title: 'T' })!;
    const [a, b] = leafUnits(doc);
    const next = addDiscourseRelation(doc, { sourceUnitId: a!.id, targetUnitId: b!.id });
    expect(next.relations).toHaveLength(1);
    expect(next.relations[0]!.type).toBeUndefined();
    expect(next.relations[0]!.provenance.source).toBe('manual');
  });
});

describe('relations — store create-first workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    useDiscourseStore.setState({
      baseDoc: null, doc: null, status: 'idle', error: null, past: [], future: [],
      selection: {}, pendingRelationSource: null, typeEditRelationId: null,
      isDefaultDemo: false, firstLoadModalOpen: false, newTextRequest: 0,
    });
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
  });

  const s = () => useDiscourseStore.getState();

  it('picking a target creates an untyped link immediately and opens the type modal', () => {
    const [a, b] = leafUnits(s().doc!);
    s().startRelation(a!.id);
    s().pickRelationTarget(b!.id);
    expect(s().doc!.relations).toHaveLength(1);
    const rel = s().doc!.relations[0]!;
    expect(rel.type).toBeUndefined();
    expect(rel.sourceUnitId).toBe(a!.id);
    expect(rel.targetUnitId).toBe(b!.id);
    expect(s().typeEditRelationId).toBe(rel.id);
    expect(s().pendingRelationSource).toBeNull();
  });

  it('refuses a self-link and creates nothing', () => {
    const [a] = leafUnits(s().doc!);
    s().startRelation(a!.id);
    s().pickRelationTarget(a!.id);
    expect(s().doc!.relations).toHaveLength(0);
    expect(s().pendingRelationSource).toBeNull();
    expect(s().typeEditRelationId).toBeNull();
  });

  it('setting a type updates the same relation id (no duplicate); clearing keeps the link', () => {
    const [a, b] = leafUnits(s().doc!);
    s().startRelation(a!.id);
    s().pickRelationTarget(b!.id);
    const id = s().doc!.relations[0]!.id;
    s().setRelationType(id, 'ground', 'because');
    expect(s().doc!.relations).toHaveLength(1);
    expect(s().doc!.relations[0]!.id).toBe(id);
    expect(s().doc!.relations[0]!.type).toBe('ground');
    expect(s().doc!.relations[0]!.label).toBe('because');
    s().setRelationType(id, undefined);
    expect(s().doc!.relations).toHaveLength(1);
    expect(s().doc!.relations[0]!.type).toBeUndefined();
  });

  it('closing the type modal keeps the (untyped) link; undo removes it, redo restores it untyped', () => {
    const [a, b] = leafUnits(s().doc!);
    s().startRelation(a!.id);
    s().pickRelationTarget(b!.id);
    s().closeRelationTypeEditor();
    expect(s().typeEditRelationId).toBeNull();
    expect(s().doc!.relations).toHaveLength(1); // link survives dismissal
    s().undo();
    expect(s().doc!.relations).toHaveLength(0);
    s().redo();
    expect(s().doc!.relations).toHaveLength(1);
    expect(s().doc!.relations[0]!.type).toBeUndefined();
  });

  it('an untyped link persists across a reload (patch round-trip)', () => {
    const [a, b] = leafUnits(s().doc!);
    s().startRelation(a!.id);
    s().pickRelationTarget(b!.id);
    const id = s().doc!.relations[0]!.id;
    // Fresh session: re-load the same plaintext (same ids/baseHash).
    useDiscourseStore.setState({ baseDoc: null, doc: null, past: [], future: [] });
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const rel = s().doc!.relations.find((r) => r.id === id);
    expect(rel).toBeTruthy();
    expect(rel!.type).toBeUndefined();
  });
});

describe('relations — two-phase Relate draft (source-first entry point)', () => {
  beforeEach(() => {
    localStorage.clear();
    useDiscourseStore.setState({
      baseDoc: null, doc: null, status: 'idle', error: null, past: [], future: [],
      selection: {}, pendingRelationSource: null, pendingRelationAwaitingSource: false,
      typeEditRelationId: null, multiSelectMode: false, multiSelectedUnitIds: [],
      isDefaultDemo: false, firstLoadModalOpen: false, newTextRequest: 0,
    });
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
  });

  const s = () => useDiscourseStore.getState();

  it('startRelationDraft enters the awaiting-source phase', () => {
    s().startRelationDraft();
    expect(s().pendingRelationAwaitingSource).toBe(true);
    expect(s().pendingRelationSource).toBeNull();
  });

  it('startRelation with one unit jumps straight to awaiting-target (skips the draft phase)', () => {
    const [a] = leafUnits(s().doc!);
    s().startRelation(a!.id);
    expect(s().pendingRelationAwaitingSource).toBe(false);
    expect(s().pendingRelationSource).toBe(a!.id);
  });

  it('picking a source while awaiting-source moves to awaiting-target, then picking a target creates the relation', () => {
    const [a, b] = leafUnits(s().doc!);
    s().startRelationDraft();
    // The view calls `startRelation(unitId)` for the click that picks the
    // source while `pendingRelationAwaitingSource` is true (DiscourseView's
    // onUnitSelect) — exercise that same store transition directly here.
    s().startRelation(a!.id);
    expect(s().pendingRelationAwaitingSource).toBe(false);
    expect(s().pendingRelationSource).toBe(a!.id);
    s().pickRelationTarget(b!.id);
    expect(s().doc!.relations).toHaveLength(1);
    expect(s().doc!.relations[0]!.sourceUnitId).toBe(a!.id);
    expect(s().doc!.relations[0]!.targetUnitId).toBe(b!.id);
    expect(s().pendingRelationSource).toBeNull();
  });

  it('cancelRelation clears the draft in EITHER phase', () => {
    s().startRelationDraft();
    s().cancelRelation();
    expect(s().pendingRelationAwaitingSource).toBe(false);
    expect(s().pendingRelationSource).toBeNull();

    const [a] = leafUnits(s().doc!);
    s().startRelation(a!.id);
    s().cancelRelation();
    expect(s().pendingRelationAwaitingSource).toBe(false);
    expect(s().pendingRelationSource).toBeNull();
  });

  it('entering multi-select mode cancels an in-progress draft', () => {
    s().startRelationDraft();
    s().setMultiSelectMode(true);
    expect(s().pendingRelationAwaitingSource).toBe(false);
    expect(s().multiSelectMode).toBe(true);
  });
});
