import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import {
  addDiscourseRelation,
  buildDiscourseDocumentFromKrDocuments,
  buildDiscourseDocumentFromRange,
  collapseDiscourseUnit,
  discourseRows,
  labelDiscourseUnit,
  leafUnits,
  nestDiscourseUnits,
  visibleRelationEndpoints,
} from '@/domain/discourse';
import { DIAGRAM_MODES } from '@/domain/layout';
import { useDiscourseStore, useEditorStore } from '@/state';
import { DiscourseView } from '@/ui/discourse/DiscourseView';
import { DiscourseSidePanel } from '@/ui/discourse/DiscourseSidePanel';
import { DiscourseUnitBlock } from '@/ui/discourse/DiscourseUnitBlock';

/**
 * PR 3 acceptance — the Discourse visualization and read-only renderer.
 */

const NOW = '2026-01-01T00:00:00.000Z';

function bookDocs(fixture: string, book: string) {
  const xml = readFileSync(fixture, 'utf8');
  return lowfatToDocuments(xml, {
    book,
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
    sourceId: 'macula-greek-sblgnt-lowfat',
  });
}

const ephesians = () =>
  buildDiscourseDocumentFromRange(bookDocs('tests/fixtures-sblgnt-lowfat-eph-5-3-33.xml', 'Ephesians'), {
    sourceId: 'macula-greek-sblgnt-lowfat',
    editionId: 'sblgnt',
    book: 'Ephesians',
    startRef: '5:3',
    endRef: '5:33',
    now: NOW,
  });

const philemon = () =>
  buildDiscourseDocumentFromKrDocuments(bookDocs('tests/fixtures-sblgnt-lowfat-philemon.xml', 'Philemon'), {
    sourceId: 'macula-greek-sblgnt-lowfat',
    editionId: 'sblgnt',
    book: 'Philemon',
    now: NOW,
  });

describe('DiagramMode registry', () => {
  it('offers Discourse in the visualization list', () => {
    const m = DIAGRAM_MODES.find((x) => x.id === 'discourse');
    expect(m?.label).toBe('Discourse');
    expect(m?.description).toBe('Argument flow / discourse structure');
  });
});

describe('discourse view-model (rows + visible relations)', () => {
  it('flattens the outline with visibility from collapsed ancestors', () => {
    let doc = ephesians();
    const [a, b] = leafUnits(doc);
    doc = nestDiscourseUnits(doc, [a!.id, b!.id], { label: 'A', id: 'du_wrap' }, NOW);
    let rows = discourseRows(doc);
    expect(rows.every((r) => r.visible)).toBe(true);
    doc = collapseDiscourseUnit(doc, 'du_wrap', NOW);
    rows = discourseRows(doc);
    const hidden = rows.filter((r) => !r.visible).map((r) => r.unit.id);
    expect(hidden).toEqual([a!.id, b!.id]);
  });

  it('re-anchors a relation into a collapsed group to the visible ancestor', () => {
    let doc = ephesians();
    const leaves = leafUnits(doc);
    doc = nestDiscourseUnits(doc, [leaves[0]!.id, leaves[1]!.id], { id: 'du_wrap' }, NOW);
    doc = addDiscourseRelation(
      doc,
      { sourceUnitId: leaves[0]!.id, targetUnitId: leaves[4]!.id, type: 'ground', id: 'dr_x' },
      NOW,
    );
    doc = collapseDiscourseUnit(doc, 'du_wrap', NOW);
    const endpoints = visibleRelationEndpoints(doc, discourseRows(doc));
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0]!.sourceId).toBe('du_wrap'); // anchored to the collapsed wrapper
    expect(endpoints[0]!.targetId).toBe(leaves[4]!.id);
  });
});

describe('DiscourseView (read-only render)', () => {
  afterEach(cleanup);
  beforeEach(() => {
    useDiscourseStore.setState({
      selection: {},
      view: {
        showMarkers: true,
        showRelations: true,
        showLabels: true,
        showSourceText: true,
        showEnglish: false,
        compact: false,
      },
    });
  });

  it('renders Ephesians 5:3–33 as readable blocks with refs, Greek, and labels', () => {
    const doc = labelDiscourseUnit(ephesians(), leafUnits(ephesians())[0]!.id, 'A', NOW);
    // Read-only (Explore) render: marker chips are Edit-mode-only and off by
    // default, so they don't appear here — the direct-block test below covers
    // their rendering with an explicit view + editing.
    const html = renderToStaticMarkup(createElement(DiscourseView, { doc }));
    expect(html).toContain('discourse-unit');
    expect(html).toContain('5:3'); // ref labels
    expect(html).toContain('Πορνεία'); // Greek text (Eph 5:3 opens Πορνεία δὲ…)
    expect(html).not.toContain('discourse-marker-chip'); // chips are edit-only
    expect(html).toContain('>A<'); // the unit label chip
  });

  it('renders whole-book Philemon without crashing', () => {
    const doc = philemon();
    const html = renderToStaticMarkup(createElement(DiscourseView, { doc }));
    expect(html).toContain('discourse-unit');
    // Every leaf sentence unit renders a block.
    const leaves = leafUnits(doc);
    expect(leaves.length).toBeGreaterThan(10);
    expect((html.match(/data-unit-id=/g) ?? []).length).toBe(leaves.length);
  });

  it('marker chips always speak in hints ("possible …"), never conclusions', () => {
    const doc = ephesians();
    const row = discourseRows(doc).find((r) => r.markers.length > 0)!;
    const html = renderToStaticMarkup(
      createElement(DiscourseUnitBlock, {
        row,
        view: useDiscourseStore.getState().view,
        selected: false,
        relationCount: 0,
        registerEl: () => {},
        onSelect: () => {},
        editing: true, // marker chips only render in Edit mode
      }),
    );
    expect(html).toContain('possible');
    expect(html).not.toContain('detected');
  });

  it('lists relations textually for the selected unit (arcs are never the only reading)', () => {
    let doc = ephesians();
    const leaves = leafUnits(doc);
    doc = labelDiscourseUnit(doc, leaves[0]!.id, 'A', NOW);
    doc = labelDiscourseUnit(doc, leaves[19]!.id, 'A′', NOW);
    doc = addDiscourseRelation(
      doc,
      { sourceUnitId: leaves[0]!.id, targetUnitId: leaves[19]!.id, type: 'chiasm', id: 'dr_c' },
      NOW,
    );
    // The textual listing lives in the side panel (docked next to the view).
    useDiscourseStore.setState({ doc, selection: { unitId: leaves[0]!.id } });
    const { container } = render(createElement(DiscourseSidePanel));
    const inspector = container.querySelector('.discourse-inspector');
    expect(inspector).toBeTruthy();
    expect(inspector!.textContent).toContain('chiasm');
    expect(inspector!.textContent).toContain('A′');
  });

  it("shows a relation's OWN detail card (with its own notes) when an arc is selected", () => {
    let doc = ephesians();
    const leaves = leafUnits(doc);
    doc = addDiscourseRelation(
      doc,
      { sourceUnitId: leaves[0]!.id, targetUnitId: leaves[19]!.id, type: 'chiasm', id: 'dr_c', notes: 'mirrored themes' },
      NOW,
    );
    // Arc click selects the RELATION only — no unit required.
    useDiscourseStore.setState({ doc, selection: { relationId: 'dr_c' } });
    // The action toolbar is Edit-mode only now (D5).
    useEditorStore.setState({ appMode: 'edit' });
    const { container } = render(createElement(DiscourseSidePanel));
    const editor = container.querySelector('.discourse-relation-editor');
    expect(editor).toBeTruthy();
    expect((editor!.querySelector('textarea') as HTMLTextAreaElement).value).toBe('mirrored themes');
    // The action toolbar mounts in Edit mode.
    expect(container.querySelector('.discourse-toolbar')).toBeTruthy();
  });
});

/**
 * The `DiscourseRelationLayer` rewrite (per-relation hit paths instead of a
 * `pointerEvents:'all'` group) + the dynamic (pure-helper-driven) gutter +
 * the left/right view toggle. Needs a REAL DOM render (not
 * `renderToStaticMarkup`) so refs attach, `measure()` runs, and click events
 * fire. jsdom has no layout engine, so `getBoundingClientRect()` returns all
 * zeros — every endpoint's y ends up 0 (or a small deterministic nudge off
 * 0), which is fine: these assertions check STRUCTURE/attributes (path
 * count, pointer-events, positioning), never real pixel geometry.
 */
describe('DiscourseRelationLayer — selectability + dynamic gutter (live DOM)', () => {
  const originalScrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight');
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    if (originalScrollHeight) Object.defineProperty(Element.prototype, 'scrollHeight', originalScrollHeight);
  });
  beforeEach(() => {
    useDiscourseStore.setState({
      selection: {},
      view: {
        showMarkers: false,
        showRelations: true,
        showLabels: true,
        showSourceText: true,
        showEnglish: false,
        compact: false,
        relationSide: 'right',
      },
    });
    // jsdom does no layout: every element's getBoundingClientRect() (and
    // .scrollHeight) is 0 by default, which the relation layer treats as
    // "nothing to draw" (height <= 0) — exactly the guard that keeps it from
    // rendering into a collapsed/unmeasured container. Give every unit block
    // a non-zero (uniform — exact geometry isn't under test) rect so the
    // relation layer actually renders and these DOM/attribute assertions have
    // something to inspect.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      right: 100,
      bottom: 20,
      width: 100,
      height: 20,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect);
    Object.defineProperty(Element.prototype, 'scrollHeight', {
      configurable: true,
      value: 400,
    });
  });

  function docWithTwoRelations() {
    let doc = ephesians();
    const leaves = leafUnits(doc);
    doc = addDiscourseRelation(
      doc,
      { sourceUnitId: leaves[0]!.id, targetUnitId: leaves[5]!.id, type: 'ground', id: 'dr_a' },
      NOW,
    );
    doc = addDiscourseRelation(
      doc,
      { sourceUnitId: leaves[1]!.id, targetUnitId: leaves[19]!.id, type: 'chiasm', id: 'dr_b' },
      NOW,
    );
    return doc;
  }

  it('renders exactly one wide hit path + one visible arc group per relation, and a gutter width driven by the layout helper (not the old fixed 132px)', () => {
    const doc = docWithTwoRelations();
    const { container } = render(createElement(DiscourseView, { doc }));
    const svg = container.querySelector('.discourse-arcs');
    expect(svg).toBeTruthy();
    const allPaths = Array.from(svg!.querySelectorAll('path')) as SVGPathElement[];
    const hitPaths = allPaths.filter((p) => p.style.pointerEvents === 'stroke');
    // One hit path per relation.
    expect(hitPaths.length).toBe(2);
    // Bracket + arrowhead = 2 visible paths per relation, none of them
    // carrying the hit paths' 'stroke' pointer-events value.
    const visiblePaths = allPaths.filter((p) => p.style.pointerEvents !== 'stroke');
    expect(visiblePaths.length).toBe(4);
    const groups = svg!.querySelectorAll('.discourse-arc');
    expect(groups.length).toBe(2);
    groups.forEach((g) => expect((g as HTMLElement).style.pointerEvents).toBe('none'));
    const gutter = container.querySelector('.discourse-gutter') as HTMLElement;
    expect(gutter).toBeTruthy();
    expect(gutter.style.width).not.toBe('132px');
    expect(Number.parseFloat(gutter.style.width)).toBeGreaterThan(0);
  });

  it('clicking a relation\'s hit path selects it even while a DIFFERENT relation is already selected', () => {
    const doc = docWithTwoRelations();
    useDiscourseStore.setState({ selection: { relationId: 'dr_a' } });
    const { container } = render(createElement(DiscourseView, { doc }));
    const svg = container.querySelector('.discourse-arcs')!;
    const hitPaths = Array.from(svg.querySelectorAll('path')).filter(
      (p) => (p as SVGPathElement).style.pointerEvents === 'stroke',
    ) as SVGPathElement[];
    // The hit path's <title> child names the relation by type ("chiasm" for
    // dr_b, since neither relation has a custom label) — find dr_b's, the one
    // NOT already selected, and click it.
    const target = hitPaths.find((p) => p.textContent?.includes('chiasm'));
    expect(target).toBeTruthy();
    fireEvent.click(target!);
    expect(useDiscourseStore.getState().selection.relationId).toBe('dr_b');
  });

  it('showRelations off ⇒ no arc svg/gutter and base (16px) padding on both sides', () => {
    const doc = docWithTwoRelations();
    useDiscourseStore.setState({
      view: { ...useDiscourseStore.getState().view, showRelations: false },
    });
    const { container } = render(createElement(DiscourseView, { doc }));
    expect(container.querySelector('.discourse-arcs')).toBeNull();
    expect(container.querySelector('.discourse-gutter')).toBeNull();
    const content = container.querySelector('.discourse-content') as HTMLElement;
    expect(content.style.paddingLeft).toBe('16px');
    expect(content.style.paddingRight).toBe('16px');
  });

  it('showLabels off ⇒ no arc label text elements', () => {
    const doc = docWithTwoRelations();
    useDiscourseStore.setState({
      view: { ...useDiscourseStore.getState().view, showLabels: false },
    });
    const { container } = render(createElement(DiscourseView, { doc }));
    expect(container.querySelector('.discourse-arcs')).toBeTruthy();
    expect(container.querySelectorAll('.discourse-arc-label').length).toBe(0);
  });

  it("relationSide 'left' ⇒ the gutter div sits on the left, and the content's LEFT padding (not the right) carries the gutter width", () => {
    const doc = docWithTwoRelations();
    useDiscourseStore.setState({
      view: { ...useDiscourseStore.getState().view, relationSide: 'left' },
    });
    const { container } = render(createElement(DiscourseView, { doc }));
    const gutter = container.querySelector('.discourse-gutter') as HTMLElement;
    expect(gutter).toBeTruthy();
    expect(gutter.style.left).toBe('0px');
    expect(gutter.style.right).toBe('');
    const content = container.querySelector('.discourse-content') as HTMLElement;
    expect(content.style.paddingRight).toBe('16px');
    expect(content.style.paddingLeft).not.toBe('16px');
  });
});
