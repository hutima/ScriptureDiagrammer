import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { useEditorStore } from '@/state';
import { previewMoveNodeUnder, keepType } from '@/ui/editor/hierarchy';
import { getNode, parentRelations, descendantIds } from '@/domain/model';
import type { KrDocument } from '@/domain/schema';

/**
 * Phrase/Block drag-preview — the pure `previewMoveNodeUnder` helper: it must
 * (1) apply EXACTLY the transformation the drop would commit (same pure
 * `reattachNode` the store's attachNodeTo uses), (2) never mutate the input,
 * and (3) refuse cycles / self-drops / no-ops with readable reasons.
 */

const heb = (): KrDocument =>
  lowfatToDocuments(readFileSync('tests/fixtures-sblgnt-lowfat-heb-1-1-4.xml', 'utf8'), {
    book: 'Hebrews',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
  })[0]!;

describe('previewMoveNodeUnder', () => {
  // A word with a real subtree: ἀπαύγασμα (w_n58001003003) heads the fork
  // (genitive + conjunct children); its parent is ὢν (w_n58001003002).
  const NODE = 'w_n58001003003';
  const OLD_HEAD = 'w_n58001003002';
  const TARGET = 'w_n58001002006'; // ἐλάλησεν, the main verb

  it('produces a candidate doc without touching the original', () => {
    const doc = heb();
    const snapshot = JSON.stringify(doc);
    const p = previewMoveNodeUnder(doc, NODE, TARGET);
    expect(p.ok).toBe(true);
    expect(p.noop).toBeFalsy();
    expect(JSON.stringify(doc)).toBe(snapshot); // input untouched
    const moved = parentRelations(p.doc!.syntax, NODE)[0];
    expect(moved?.headId).toBe(TARGET);
    expect(moved?.type).toBe(keepType(doc, NODE)); // role kept across the move
    expect(p.oldHeadId).toBe(OLD_HEAD);
    expect(p.newHeadId).toBe(TARGET);
    expect(p.changedNodeIds).toContain(NODE);
    expect(p.changedNodeIds).toContain(OLD_HEAD);
    expect(p.changedNodeIds).toContain(TARGET);
    expect(p.changedRelationIds.length).toBeGreaterThanOrEqual(1);
  });

  it('matches what the store commit produces (same shared transformation)', () => {
    const doc = heb();
    const p = previewMoveNodeUnder(doc, NODE, TARGET);
    useEditorStore.getState().loadDocument(heb(), { corpus: 'gnt' });
    useEditorStore.getState().attachNodeTo(NODE, TARGET, keepType(doc, NODE));
    const committed = useEditorStore.getState().doc;
    // Same relation endpoints/types for every relation id in both results.
    const rels = (d: KrDocument) =>
      [...d.syntax.relations]
        .map((r) => `${r.id}:${r.headId}>${r.dependentId}:${r.type}`)
        .sort();
    expect(rels(committed)).toEqual(rels(p.doc!));
  });

  it('rejects self-drop and descendant drops (cycles) with reasons', () => {
    const doc = heb();
    const self = previewMoveNodeUnder(doc, NODE, NODE);
    expect(self.ok).toBe(false);
    expect(self.reason).toMatch(/itself/);
    const child = descendantIds(doc.syntax, NODE)[0]!;
    const cyc = previewMoveNodeUnder(doc, NODE, child);
    expect(cyc.ok).toBe(false);
    expect(cyc.reason).toMatch(/own parts/);
  });

  it('rejects the root and unknown nodes', () => {
    const doc = heb();
    expect(previewMoveNodeUnder(doc, doc.syntax.rootId, NODE).ok).toBe(false);
    expect(previewMoveNodeUnder(doc, 'nope', NODE).ok).toBe(false);
    expect(previewMoveNodeUnder(doc, NODE, 'nope').ok).toBe(false);
  });

  it('flags a drop on the current parent as a no-op (nothing to commit)', () => {
    const doc = heb();
    const p = previewMoveNodeUnder(doc, NODE, OLD_HEAD);
    expect(p.ok).toBe(true);
    expect(p.noop).toBe(true);
    expect(p.changedRelationIds).toEqual([]);
  });

  it('candidate doc lays out in Kellogg-Reed for every legal word target', () => {
    // Broad sweep: moving the fork head under each of a handful of words must
    // never throw (previewMoveNodeUnder itself layouts as a guard — ok:true
    // means it rendered).
    const doc = heb();
    const words = doc.syntax.nodes.filter((n) => n.kind === 'word').slice(0, 25);
    const banned = new Set([NODE, ...descendantIds(doc.syntax, NODE)]);
    for (const w of words) {
      if (banned.has(w.id)) continue;
      const p = previewMoveNodeUnder(doc, NODE, w.id);
      expect(p.ok, `${NODE} → ${w.id}`).toBe(true);
    }
  });
});

describe('store attachNodeTo (after reattachNode extraction)', () => {
  beforeEach(() => {
    useEditorStore.getState().loadDocument(heb(), { corpus: 'gnt' });
  });

  it('still swaps a clause subject when a new word takes the slot', () => {
    const s = useEditorStore.getState();
    // ὁ θεός (w_n58001001006) is the main-clause subject; move ἡμῖν
    // (w_n58001002007) into that slot and the old subject must be evicted,
    // not doubled.
    s.attachNodeTo('w_n58001002007', 'cl_s0_0', 'subject');
    const doc = useEditorStore.getState().doc;
    const subjects = doc.syntax.relations.filter(
      (r) => r.headId === 'cl_s0_0' && r.type === 'subject',
    );
    expect(subjects).toHaveLength(1);
    expect(subjects[0]!.dependentId).toBe('w_n58001002007');
  });

  it('remains undoable as one step', () => {
    const s = useEditorStore.getState();
    const before = useEditorStore.getState().doc.syntax.relations.find(
      (r) => r.dependentId === 'w_n58001003003',
    )!;
    s.attachNodeTo('w_n58001003003', 'w_n58001002006', 'directObject');
    useEditorStore.getState().undo();
    const after = useEditorStore.getState().doc.syntax.relations.find(
      (r) => r.dependentId === 'w_n58001003003',
    )!;
    expect(after.headId).toBe(before.headId);
    expect(after.type).toBe(before.type);
  });
});
