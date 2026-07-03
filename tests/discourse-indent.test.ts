import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildDiscourseDocumentFromPlainText,
  discourseOutlineHtml,
  discourseOutlineMarkdown,
  leafUnits,
  setDiscourseUnitIndent,
  nudgeDiscourseUnitIndent,
  splitDiscourseUnit,
  mergeAdjacentDiscourseUnits,
  MAX_USER_INDENT,
} from '@/domain/discourse';
import { useDiscourseStore } from '@/state';

/**
 * Explicit per-line indentation (`userIndent`): absolute, independent of
 * neighbours, clamped, carried through split/merge, persisted, undoable, and
 * honoured by the exporters.
 */

const TEXT = 'Alpha one. Beta two. Gamma three. Delta four.';

function freshDoc() {
  return buildDiscourseDocumentFromPlainText(TEXT, { title: 'T' })!;
}

describe('userIndent — pure model', () => {
  it('sets an absolute indent on exactly one line, not its neighbours', () => {
    const doc = freshDoc();
    const [a, b, c] = leafUnits(doc);
    const next = setDiscourseUnitIndent(doc, b!.id, 3);
    const by = (id: string) => next.units.find((u) => u.id === id)!;
    expect(by(b!.id).userIndent).toBe(3);
    expect(by(a!.id).userIndent ?? 0).toBe(0);
    expect(by(c!.id).userIndent ?? 0).toBe(0);
  });

  it('clamps to [0, MAX] and rounds', () => {
    const doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    // Clamp low: from 0 to a negative value is a no-op (stays 0).
    expect(
      setDiscourseUnitIndent(doc, u.id, -5).units.find((x) => x.id === u.id)!.userIndent ?? 0,
    ).toBe(0);
    // Clamp high.
    expect(
      setDiscourseUnitIndent(doc, u.id, 999).units.find((x) => x.id === u.id)!.userIndent,
    ).toBe(MAX_USER_INDENT);
  });

  it('nudges by a delta, independently', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[1]!;
    doc = nudgeDiscourseUnitIndent(doc, u.id, 2);
    doc = nudgeDiscourseUnitIndent(doc, u.id, -1);
    expect(doc.units.find((x) => x.id === u.id)!.userIndent).toBe(1);
  });

  it('preserves arbitrary non-sequential patterns (no staircase normalisation)', () => {
    let doc = freshDoc();
    const ids = leafUnits(doc).map((u) => u.id);
    const pattern = [0, 4, 1, 3];
    ids.forEach((id, i) => (doc = setDiscourseUnitIndent(doc, id, pattern[i]!)));
    expect(ids.map((id) => doc.units.find((u) => u.id === id)!.userIndent ?? 0)).toEqual(pattern);
  });

  it('split inherits the indent into both halves; each can then diverge', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[0]!; // "Alpha one."
    doc = setDiscourseUnitIndent(doc, u.id, 2);
    const secondToken = u.tokenIds[1]!;
    doc = splitDiscourseUnit(doc, u.id, secondToken);
    const halves = leafUnits(doc).filter((x) => (x.refStart || x.id).length >= 0).slice(0, 2);
    // Both resulting halves carry the original explicit indent (2).
    expect(halves[0]!.userIndent).toBe(2);
    expect(halves[1]!.userIndent).toBe(2);
    // Dragging one does not move the other.
    doc = setDiscourseUnitIndent(doc, halves[1]!.id, 5);
    expect(doc.units.find((x) => x.id === halves[0]!.id)!.userIndent).toBe(2);
  });

  it('merge keeps the primary (first) line’s indent', () => {
    let doc = freshDoc();
    const [a, b] = leafUnits(doc);
    doc = setDiscourseUnitIndent(doc, a!.id, 1);
    doc = setDiscourseUnitIndent(doc, b!.id, 4);
    doc = mergeAdjacentDiscourseUnits(doc, a!.id, b!.id);
    expect(doc.units.find((x) => x.id === a!.id)!.userIndent).toBe(1);
  });
});

describe('userIndent — exporters honour it', () => {
  it('Markdown indents by depth + userIndent', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[1]!;
    doc = setDiscourseUnitIndent(doc, u.id, 2);
    const md = discourseOutlineMarkdown(doc, { includeText: false });
    // The indented unit's bullet is padded by two levels (4 spaces) more than a 0-indent one.
    const line = md.split('\n').find((l) => l.includes('- **') && l.startsWith('    '));
    expect(line).toBeTruthy();
  });

  it('HTML margin-left reflects userIndent', () => {
    let doc = freshDoc();
    const u = leafUnits(doc)[0]!;
    doc = setDiscourseUnitIndent(doc, u.id, 3);
    const html = discourseOutlineHtml(doc, { includeText: false });
    // depth 0 + userIndent 3 → 3 * 22 = 66px.
    expect(html).toContain('margin-left:66px');
  });
});

describe('userIndent — store (undo/redo/persist)', () => {
  beforeEach(() => {
    localStorage.clear();
    useDiscourseStore.setState({
      baseDoc: null, doc: null, status: 'idle', error: null, past: [], future: [],
      selection: {}, isDefaultDemo: false, firstLoadModalOpen: false, newTextRequest: 0,
    });
  });

  it('setUnitIndent updates only the target, and undo/redo restore it', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const [a, b] = leafUnits(useDiscourseStore.getState().doc!);
    useDiscourseStore.getState().setUnitIndent(b!.id, 3);
    const cur = () => useDiscourseStore.getState().doc!;
    expect(cur().units.find((u) => u.id === b!.id)!.userIndent).toBe(3);
    expect(cur().units.find((u) => u.id === a!.id)!.userIndent ?? 0).toBe(0);
    useDiscourseStore.getState().undo();
    expect(cur().units.find((u) => u.id === b!.id)!.userIndent ?? 0).toBe(0);
    useDiscourseStore.getState().redo();
    expect(cur().units.find((u) => u.id === b!.id)!.userIndent).toBe(3);
  });

  it('nudgeUnitIndent applies the same delta to every selected line independently', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const [a, b, c] = leafUnits(useDiscourseStore.getState().doc!);
    useDiscourseStore.getState().setUnitIndent(a!.id, 1); // start non-uniform
    useDiscourseStore.getState().nudgeUnitIndent([a!.id, c!.id], 2);
    const cur = useDiscourseStore.getState().doc!;
    expect(cur.units.find((u) => u.id === a!.id)!.userIndent).toBe(3);
    expect(cur.units.find((u) => u.id === c!.id)!.userIndent).toBe(2);
    expect(cur.units.find((u) => u.id === b!.id)!.userIndent ?? 0).toBe(0); // untouched
  });

  it('indent edits persist across a reload and are cleared by reset', () => {
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    const u = leafUnits(useDiscourseStore.getState().doc!)[2]!;
    useDiscourseStore.getState().setUnitIndent(u.id, 4);
    // Fresh session: re-load the same plaintext (same ids/baseHash) → patch reapplies.
    useDiscourseStore.setState({ baseDoc: null, doc: null, past: [], future: [] });
    useDiscourseStore.getState().loadPlainText(TEXT, 'T');
    expect(
      useDiscourseStore.getState().doc!.units.find((x) => x.id === u.id)!.userIndent,
    ).toBe(4);
    // Reset clears the indent edit.
    useDiscourseStore.getState().resetEdits();
    expect(
      useDiscourseStore.getState().doc!.units.find((x) => x.id === u.id)!.userIndent ?? 0,
    ).toBe(0);
  });
});
