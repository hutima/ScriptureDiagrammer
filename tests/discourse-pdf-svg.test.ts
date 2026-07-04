import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import {
  addDiscourseRelation,
  buildDiscourseDocumentFromRange,
  discourseOutlineHtml,
  discourseOutlineSvg,
  labelDiscourseUnit,
  leafUnits,
  setDiscourseUnitNotes,
  updateDiscourseRelation,
  type DiscourseDocument,
} from '@/domain/discourse';

/**
 * PDF (print-ready HTML) + SVG (vector) export of the discourse outline.
 * Pure generators, so they are tested directly; the modal wires them to
 * `printHtmlDocument` / a `.svg` download.
 */

const NOW = '2026-01-01T00:00:00.000Z';

function ephesians(): DiscourseDocument {
  const xml = readFileSync('tests/fixtures-sblgnt-lowfat-eph-5-3-33.xml', 'utf8');
  const docs = lowfatToDocuments(xml, {
    book: 'Ephesians',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
    sourceId: 'macula-greek-sblgnt-lowfat',
  });
  let doc = buildDiscourseDocumentFromRange(docs, {
    sourceId: 'macula-greek-sblgnt-lowfat',
    editionId: 'sblgnt',
    book: 'Ephesians',
    startRef: '5:3',
    endRef: '5:33',
    now: NOW,
  });
  const [a, b] = leafUnits(doc);
  doc = labelDiscourseUnit(doc, a!.id, 'A', NOW);
  doc = setDiscourseUnitNotes(doc, a!.id, 'opening warning', NOW);
  doc = addDiscourseRelation(
    doc,
    { id: 'dr_1', sourceUnitId: b!.id, targetUnitId: a!.id, type: 'ground', notes: 'because of the flow' },
    NOW,
  );
  return doc;
}

/** A document with no relations at all, for gutter-width comparisons. */
function ephesiansNoRelations(): DiscourseDocument {
  const xml = readFileSync('tests/fixtures-sblgnt-lowfat-eph-5-3-33.xml', 'utf8');
  const docs = lowfatToDocuments(xml, {
    book: 'Ephesians',
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
    sourceId: 'macula-greek-sblgnt-lowfat',
  });
  return buildDiscourseDocumentFromRange(docs, {
    sourceId: 'macula-greek-sblgnt-lowfat',
    editionId: 'sblgnt',
    book: 'Ephesians',
    startRef: '5:3',
    endRef: '5:33',
    now: NOW,
  });
}

describe('discourse PDF (print-ready HTML) export', () => {
  it('produces a self-contained, well-formed HTML document', () => {
    const html = discourseOutlineHtml(ephesians());
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<title>Ephesians 5:3–33</title>');
    expect(html).toContain('@media print');
    // No external assets (CSP-safe) — no http(s) links or script tags.
    expect(html).not.toMatch(/src=|href=|<script/i);
    // Content is present: label, note, and the relation.
    expect(html).toContain('A —');
    expect(html).toContain('opening warning');
    expect(html).toContain('ground →');
  });

  it('escapes user content', () => {
    let doc = ephesians();
    doc = labelDiscourseUnit(doc, leafUnits(doc)[2]!.id, '<b>x</b>', NOW);
    const html = discourseOutlineHtml(doc);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
  });
});

describe('discourse SVG (vector) export', () => {
  it('produces a valid, sized SVG of the outline', () => {
    const svg = discourseOutlineSvg(ephesians());
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toMatch(/height="\d+"/);
    expect(svg).toContain('<text');
    // Title + a heading render as text.
    expect(svg).toContain('Ephesians 5:3');
    expect(svg).toContain('ground →');
    // Balanced-ish: as many closing text tags as opening.
    const open = (svg.match(/<text/g) ?? []).length;
    const close = (svg.match(/<\/text>/g) ?? []).length;
    expect(open).toBe(close);
    expect(svg.trim().endsWith('</svg>')).toBe(true);
  });

  it('consolidates unit and relation notes into a bottom "Notes" section (not inline)', () => {
    const svg = discourseOutlineSvg(ephesians(), { includeNotes: true });
    expect(svg).toContain('>Notes<');
    // The unit note and the relation note both appear, addressed by heading.
    expect(svg).toContain('opening warning');
    expect(svg).toContain('because of the flow');
    // Order: everything up to and including the LAST unit heading/body line
    // comes before the "Notes" heading — i.e. notes are appended at the end,
    // not interleaved under their unit.
    const notesIdx = svg.indexOf('>Notes<');
    const lastUnitHeadingIdx = svg.lastIndexOf('>• ');
    expect(notesIdx).toBeGreaterThan(lastUnitHeadingIdx);
    const openingWarningIdx = svg.indexOf('opening warning');
    const flowIdx = svg.indexOf('because of the flow');
    expect(openingWarningIdx).toBeGreaterThan(notesIdx);
    expect(flowIdx).toBeGreaterThan(notesIdx);
    // Not rendered directly under the "A —" unit heading line (no inline "Note:").
    expect(svg).not.toMatch(/Note: opening warning/);
  });

  it('omits notes entirely when includeNotes is false', () => {
    const svg = discourseOutlineSvg(ephesians(), { includeNotes: false });
    expect(svg).not.toContain('opening warning');
    expect(svg).not.toContain('because of the flow');
    expect(svg).not.toContain('>Notes<');
  });

  it('draws a bracket path + arrowhead per relation, colored and dashed per type', () => {
    let doc = ephesians();
    const leaves = leafUnits(doc);
    doc = addDiscourseRelation(
      doc,
      { id: 'dr_2', sourceUnitId: leaves[2]!.id, targetUnitId: leaves[0]!.id, type: 'chiasm' },
      NOW,
    );
    const svg = discourseOutlineSvg(doc);
    // One bracket path (M ... H ... V ... H ...) and one arrowhead path (M ... L ... L ...)
    // per relation — two relations, so two of each.
    const brackets = svg.match(/<path d="M [\d.-]+ [\d.-]+ H [\d.-]+ V [\d.-]+ H [\d.-]+"/g) ?? [];
    const arrows = svg.match(/<path d="M [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+"/g) ?? [];
    expect(brackets.length).toBe(2);
    expect(arrows.length).toBe(2);
    // Colors come from resolvedRelationColor — at least one distinct color used.
    const colors = new Set((svg.match(/stroke="(#[0-9a-fA-F]{3,6})"/g) ?? []).map((m) => m));
    expect(colors.size).toBeGreaterThanOrEqual(1);
    // The chiasm relation renders dashed; the ground relation does not (so the
    // dash attribute appears, but not on every path).
    expect(svg).toContain('stroke-dasharray="5 3"');
    const dashedCount = (svg.match(/stroke-dasharray="5 3"/g) ?? []).length;
    expect(dashedCount).toBe(1); // only the bracket, not the arrowhead
    expect(brackets.length + arrows.length).toBeGreaterThan(dashedCount);
  });

  it('exports a custom color / explicit dash / explicit width for a styled relation', () => {
    let doc = ephesians();
    const leaves = leafUnits(doc);
    doc = addDiscourseRelation(
      doc,
      {
        id: 'dr_styled',
        sourceUnitId: leaves[3]!.id,
        targetUnitId: leaves[0]!.id,
        type: 'ground', // non-paired type, so dashed would NOT be the default
      },
      NOW,
    );
    doc = updateDiscourseRelation(
      doc,
      'dr_styled',
      { customColor: '#123abc', strokeDash: 'dotted', strokeWidth: 'thick' },
      NOW,
    );
    const svg = discourseOutlineSvg(doc);
    expect(svg).toContain('stroke="#123abc"');
    expect(svg).toContain('stroke-dasharray="1.5 3"');
    expect(svg).toContain('stroke-width="3.4"');
  });

  it('reserves gutter width only when the document has relations', () => {
    const withRelations = discourseOutlineSvg(ephesians());
    const withoutRelations = discourseOutlineSvg(ephesiansNoRelations());
    const widthOf = (svg: string) => Number(/width="(\d+)"/.exec(svg)![1]);
    expect(widthOf(withoutRelations)).toBe(820);
    expect(widthOf(withRelations)).toBeGreaterThan(820);
    expect(withoutRelations).not.toMatch(/<path d="M/);
  });

  it('escapes special characters in SVG text', () => {
    let doc = ephesians();
    doc = labelDiscourseUnit(doc, leafUnits(doc)[3]!.id, 'A & <B>', NOW);
    const svg = discourseOutlineSvg(doc);
    expect(svg).toContain('A &amp; &lt;B&gt;');
  });
});
