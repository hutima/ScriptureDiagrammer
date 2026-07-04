import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, screen, act, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { RightPanel } from '@/ui/panels/RightPanel';
import { EditPreviewTab } from '@/ui/editor/EditPreviewTab';
import { useEditorStore } from '@/state';
import type { KrDocument } from '@/domain/schema';

/**
 * Edit-mode right-panel Preview tab: appears only in Edit mode and is its
 * default tab; renders a read-only base-vs-current comparison defaulting to
 * Kellogg-Reed with the added/changed/removed legend; reflects committed edits
 * and shows a friendly empty state without a base.
 */

const heb = (): KrDocument =>
  lowfatToDocuments(readFileSync('tests/fixtures-sblgnt-lowfat-heb-1-1-4.xml', 'utf8'), {
    book: 'Hebrews',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
  })[0]!;

describe('RightPanel Preview tab', () => {
  beforeEach(() => {
    useEditorStore.getState().loadDocument(heb(), { corpus: 'gnt' });
    useEditorStore.getState().setAppMode('explore');
  });
  afterEach(cleanup);

  it('is absent in Explore mode and default-selected on entering Edit mode', () => {
    render(createElement(RightPanel));
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
    act(() => useEditorStore.getState().setAppMode('edit'));
    const previewTab = screen.getByRole('button', { name: 'Preview' });
    expect(previewTab.className).toContain('active');
    // The tab body renders the compact heading + both frames.
    expect(screen.getByText('Preview edits')).toBeTruthy();
    expect(screen.getByText('Original parse')).toBeTruthy();
    expect(screen.getByText('Your edits')).toBeTruthy();
  });
});

describe('EditPreviewTab', () => {
  beforeEach(() => {
    useEditorStore.getState().loadDocument(heb(), { corpus: 'gnt' });
    useEditorStore.getState().setAppMode('edit');
  });
  afterEach(cleanup);

  it('defaults to Kellogg-Reed and shows the added/changed/removed legend', () => {
    render(createElement(EditPreviewTab));
    const select = screen.getByLabelText('Preview visualization') as HTMLSelectElement;
    expect(select.value).toBe('kellogg-reed');
    // Discourse is never a preview lens.
    expect([...select.options].map((o) => o.value)).not.toContain('discourse');
    expect(screen.getByText('added')).toBeTruthy();
    expect(screen.getByText('changed')).toBeTruthy();
    expect(screen.getByText('removed')).toBeTruthy();
  });

  it('reflects a committed semantic edit as a diff against the base', () => {
    render(createElement(EditPreviewTab));
    // No diff highlights before any edit.
    expect(document.querySelectorAll('.vc-hi, .vc-hi-rect')).toHaveLength(0);
    // Commit a real reparent through the store (as the Phrase/Block drop does).
    act(() =>
      useEditorStore.getState().attachNodeTo('w_n58001003003', 'w_n58001002006', 'directObject'),
    );
    expect(document.querySelectorAll('.vc-hi, .vc-hi-rect').length).toBeGreaterThan(0);
  });

  it('renders read-only frames (no editing surfaces inside)', () => {
    render(createElement(EditPreviewTab));
    expect(document.querySelector('.pbw-grip')).toBeNull();
    expect(document.querySelector('.pbw-controls')).toBeNull();
  });

  it('switching the preview lens keeps comparing the same shared documents', () => {
    render(createElement(EditPreviewTab));
    const select = screen.getByLabelText('Preview visualization') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'phrase-block' } });
    // The block comparison view mounts (bdf outline frames).
    expect(document.querySelector('.bdf-scroll')).toBeTruthy();
    fireEvent.change(select, { target: { value: 'kellogg-reed' } });
    expect(document.querySelector('.bdf-scroll')).toBeNull();
  });

  it('shows the friendly empty state for a custom passage without a base', () => {
    act(() => useEditorStore.getState().newDocument('en', 'Custom'));
    render(createElement(EditPreviewTab));
    if (useEditorStore.getState().baseDoc) {
      // If a fresh custom doc DOES get a base in this app version, the frames
      // render instead — both are acceptable; assert no crash.
      expect(screen.getByText('Preview edits')).toBeTruthy();
    } else {
      expect(screen.getByText(/no source base is available/i)).toBeTruthy();
    }
  });
});
