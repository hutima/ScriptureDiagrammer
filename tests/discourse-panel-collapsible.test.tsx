import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { addDiscourseRelation, buildDiscourseDocumentFromPlainText, leafUnits } from '@/domain/discourse';
import { useDiscourseStore, useEditorStore } from '@/state';
import { DiscourseToolbar } from '@/ui/discourse/DiscourseToolbar';
import { DiscourseSidePanel } from '@/ui/discourse/DiscourseSidePanel';
import {
  isDiscourseRelationDetailsCollapsed,
  isDiscourseToolbarGroupsCollapsed,
} from '@/persistence/discourse';

/**
 * Discourse right panel — two independent collapsible sections (fix for the
 * Notes/"Relation highlights" overlap bug also lives in global.css, verified
 * separately by a browser script since jsdom/happy-dom has no layout engine):
 *
 *   1. DiscourseToolbar: Structure/Indent/Annotation/History groups collapse
 *      as one unit; Relate and Delete unit always stay visible.
 *   2. DiscourseSidePanel relation editor: Type/Label/Confidence/Color/Dash/
 *      Width collapse as "Style & details"; the header, Notes, relation
 *      highlights, and Delete relation always stay visible.
 *
 * Both collapse states persist via the `kr:discoursePref:` mechanism
 * (`src/persistence/discourse.ts`), independent of each other and of the
 * first-load-modal / hide-demo prefs that already live under that prefix.
 */

const NOW = '2026-01-01T00:00:00.000Z';
const TEXT = 'Alpha one two three. Beta four five.';

function freshDoc() {
  return buildDiscourseDocumentFromPlainText(TEXT, { title: 'T' })!;
}

describe('DiscourseToolbar — collapsible tool groups', () => {
  afterEach(cleanup);
  beforeEach(() => {
    localStorage.clear();
    const doc = freshDoc();
    const [a] = leafUnits(doc);
    useEditorStore.setState({ appMode: 'edit' });
    useDiscourseStore.setState({
      doc,
      baseDoc: doc,
      selection: { unitId: a!.id },
      multiSelectedUnitIds: [],
      multiSelectMode: false,
      pendingRelationSource: null,
      pendingRelationAwaitingSource: false,
      splitPickUnitId: null,
      past: [],
      future: [],
      toolbarGroupsCollapsed: false,
    });
  });

  it('renders open by default: Structure/History groups sit alongside Relate and Delete unit', () => {
    const { getByText, getByRole } = render(createElement(DiscourseToolbar));
    const toggle = getByRole('button', { name: /editing tools/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(getByText('Relate →')).toBeTruthy();
    expect(getByText('Split')).toBeTruthy();
    expect(getByText('↶ Undo')).toBeTruthy();
    expect(getByText('Label…')).toBeTruthy();
    expect(getByText('Delete unit')).toBeTruthy();
  });

  it('toggling collapses Structure/Indent/Annotation/History but keeps Relate and Delete unit', () => {
    const { getByText, queryByText, getByRole } = render(createElement(DiscourseToolbar));
    const toggle = getByRole('button', { name: /editing tools/i });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(queryByText('Split')).toBeNull();
    expect(queryByText('Merge ←')).toBeNull();
    expect(queryByText('→ Indent')).toBeNull();
    expect(queryByText('Label…')).toBeNull();
    expect(queryByText('↶ Undo')).toBeNull();
    // Relate (above) and Delete unit + hint (below) stay put.
    expect(getByText('Relate →')).toBeTruthy();
    expect(getByText('Delete unit')).toBeTruthy();
    // Toggling again restores everything.
    fireEvent.click(toggle);
    expect(getByText('Split')).toBeTruthy();
  });

  it('persists the collapsed state via the kr:discoursePref: mechanism', () => {
    const { getByRole } = render(createElement(DiscourseToolbar));
    expect(isDiscourseToolbarGroupsCollapsed()).toBe(false);
    fireEvent.click(getByRole('button', { name: /editing tools/i }));
    expect(isDiscourseToolbarGroupsCollapsed()).toBe(true);
    expect(localStorage.getItem('kr:discoursePref:toolbarGroupsCollapsed')).toBe('1');
  });

  it('a fresh mount honours a previously persisted collapsed pref (simulated reload)', () => {
    useDiscourseStore.getState().setToolbarGroupsCollapsed(true);
    cleanup();
    // A real page reload re-hydrates the store's initial state from the pref;
    // mirror that here without actually reloading the module.
    useDiscourseStore.setState({ toolbarGroupsCollapsed: isDiscourseToolbarGroupsCollapsed() });
    const { getByRole, queryByText } = render(createElement(DiscourseToolbar));
    expect(getByRole('button', { name: /editing tools/i }).getAttribute('aria-expanded')).toBe('false');
    expect(queryByText('Split')).toBeNull();
  });
});

describe('DiscourseSidePanel relation editor — collapsible "Style & details"', () => {
  afterEach(cleanup);
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState({ appMode: 'edit' });
    const doc = freshDoc();
    const [a, b] = leafUnits(doc);
    const withRel = addDiscourseRelation(
      doc,
      { sourceUnitId: a!.id, targetUnitId: b!.id, id: 'rel_1' },
      NOW,
    );
    useDiscourseStore.setState({
      doc: withRel,
      baseDoc: withRel,
      selection: { relationId: 'rel_1' },
      relationHighlightPickRelationId: null,
      relationDetailsCollapsed: false,
    });
  });

  it('renders open by default with Type/Dash/Width visible alongside Notes and Delete relation', () => {
    const { getByText, getByRole, container } = render(createElement(DiscourseSidePanel));
    expect(container.querySelector('.discourse-relation-editor')).toBeTruthy();
    const toggle = getByRole('button', { name: /style & details/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(getByText('Type (optional)')).toBeTruthy();
    expect(getByText('Dash')).toBeTruthy();
    expect(getByText('Width')).toBeTruthy();
    expect(getByText('Notes')).toBeTruthy();
    expect(getByText('Relation highlights')).toBeTruthy();
    expect(getByText('Delete relation')).toBeTruthy();
  });

  it('collapsing hides Type/Dash/Width but keeps Notes, highlights, and Delete relation', () => {
    const { getByText, queryByText, getByRole } = render(createElement(DiscourseSidePanel));
    fireEvent.click(getByRole('button', { name: /style & details/i }));
    expect(queryByText('Type (optional)')).toBeNull();
    expect(queryByText('Dash')).toBeNull();
    expect(queryByText('Width')).toBeNull();
    expect(getByText('Notes')).toBeTruthy();
    expect(getByText('Relation highlights')).toBeTruthy();
    expect(getByText('Delete relation')).toBeTruthy();
  });

  it('persists collapsed state independently of the toolbar pref', () => {
    const { getByRole } = render(createElement(DiscourseSidePanel));
    expect(isDiscourseRelationDetailsCollapsed()).toBe(false);
    fireEvent.click(getByRole('button', { name: /style & details/i }));
    expect(isDiscourseRelationDetailsCollapsed()).toBe(true);
    expect(localStorage.getItem('kr:discoursePref:relationDetailsCollapsed')).toBe('1');
    // Toolbar's own pref is untouched.
    expect(isDiscourseToolbarGroupsCollapsed()).toBe(false);
  });

  it('a fresh mount honours a previously persisted collapsed pref (simulated reload)', () => {
    useDiscourseStore.getState().setRelationDetailsCollapsed(true);
    cleanup();
    useDiscourseStore.setState({ relationDetailsCollapsed: isDiscourseRelationDetailsCollapsed() });
    const { getByRole, queryByText } = render(createElement(DiscourseSidePanel));
    expect(getByRole('button', { name: /style & details/i }).getAttribute('aria-expanded')).toBe('false');
    expect(queryByText('Type (optional)')).toBeNull();
  });
});
