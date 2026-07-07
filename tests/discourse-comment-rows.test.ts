import { describe, it, expect } from 'vitest';
import {
  addDiscourseCommentRow,
  buildDiscourseDocumentFromPlainText,
  childUnits,
  deleteDiscourseUnit,
  leafUnits,
  mergeDiscourseDocuments,
  outlineOrder,
} from '@/domain/discourse';

/**
 * Blank / comment annotation rows (`kind:'note'`) and multi-range SECTION
 * headings — the two presentation features added for the guided-discourse work.
 */

function threeSentenceDoc() {
  // Three sentence units, one top-level group.
  return buildDiscourseDocumentFromPlainText('Alpha one. Beta two. Gamma three.', { title: 'T' })!;
}

describe('addDiscourseCommentRow — blank / comment annotation rows', () => {
  it('inserts a note row after a unit as its next sibling', () => {
    const doc = threeSentenceDoc();
    const first = leafUnits(doc)[0]!;
    const next = addDiscourseCommentRow(doc, { afterUnitId: first.id, text: 'A comment' }, 'now');
    expect(next).not.toBe(doc);
    const notes = next.units.filter((u) => u.kind === 'note');
    expect(notes.length).toBe(1);
    const note = notes[0]!;
    expect(note.label).toBe('A comment');
    expect(note.tokenIds).toEqual([]);
    expect(note.parentId).toBe(first.parentId);
    // It sits directly after the first unit in outline order.
    const order = outlineOrder(next).map((u) => u.id);
    expect(order[order.indexOf(first.id) + 1]).toBe(note.id);
    // It is NOT a leaf (no tokens) so it never affects leaf/ref resolution.
    expect(leafUnits(next).some((u) => u.id === note.id)).toBe(false);
  });

  it('appends a blank spacer row at the top level when no anchor is given', () => {
    const doc = threeSentenceDoc();
    const next = addDiscourseCommentRow(doc, { text: '' }, 'now');
    const note = next.units.find((u) => u.kind === 'note')!;
    expect(note.label).toBeUndefined(); // empty text ⇒ blank spacer
    expect(note.parentId).toBeUndefined();
  });

  it('is a no-op when afterUnitId does not exist', () => {
    const doc = threeSentenceDoc();
    expect(addDiscourseCommentRow(doc, { afterUnitId: 'nope', text: 'x' })).toBe(doc);
  });

  it('survives an UNRELATED deletion (never pruned as an empty container)', () => {
    const doc = threeSentenceDoc();
    const leaves = leafUnits(doc);
    const withNote = addDiscourseCommentRow(doc, { afterUnitId: leaves[0]!.id, text: 'keep me' }, 'now');
    const note = withNote.units.find((u) => u.kind === 'note')!;
    // Delete a DIFFERENT leaf unit — the comment row must remain.
    const after = deleteDiscourseUnit(withNote, leaves[1]!.id, 'now');
    expect(after.units.some((u) => u.id === note.id)).toBe(true);
    // The deleted leaf is gone.
    expect(after.units.some((u) => u.id === leaves[1]!.id)).toBe(false);
  });
});

describe('mergeDiscourseDocuments — opt-in section headings', () => {
  it('wraps each labelled part in a titled kind:"section" container', () => {
    const a = buildDiscourseDocumentFromPlainText('Alpha beta.', { title: 'A' })!;
    const b = buildDiscourseDocumentFromPlainText('Gamma delta.', { title: 'B' })!;
    const merged = mergeDiscourseDocuments([a, b], {
      id: 'combined',
      title: 'A + B',
      sectionLabels: ['First section', 'Second section'],
    });
    const sections = merged.units.filter((u) => u.kind === 'section');
    expect(sections.map((s) => s.label)).toEqual(['First section', 'Second section']);
    // Every original leaf now nests under a section (depth ≥ 1), and leaves
    // still resolve unchanged (sections carry no tokens).
    for (const leaf of [...leafUnits(a), ...leafUnits(b)]) {
      const m = merged.units.find((u) => u.id === leaf.id)!;
      expect(m.parentId).toBeTruthy();
      expect(m.depth).toBe(leaf.depth + 1);
    }
    // Top level is exactly the two section containers, in order.
    const roots = childUnits(merged, undefined);
    expect(roots.map((u) => u.id)).toEqual(sections.map((s) => s.id));
  });

  it('stays flat when no section labels are supplied (unchanged behaviour)', () => {
    const a = buildDiscourseDocumentFromPlainText('Alpha beta.', { title: 'A' })!;
    const b = buildDiscourseDocumentFromPlainText('Gamma delta.', { title: 'B' })!;
    const merged = mergeDiscourseDocuments([a, b], { id: 'c', title: 'A + B' });
    expect(merged.units.some((u) => u.kind === 'section')).toBe(false);
  });
});
