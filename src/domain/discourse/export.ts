import type { DiscourseDocument, DiscoursePatch, DiscourseUnit } from '@/domain/schema';
import { formatRange } from './refs';
import { outlineOrder } from './mutations';
import { relationColor, relationTypeLabel } from './layout';

/**
 * DISCOURSE EXPORTS — pure serializers. JSON round-trips through the Zod
 * schema; the Markdown outline is the shareable, human-readable form of the
 * analysis; the relation table travels as Markdown or CSV. (SVG/PNG diagram
 * export belongs to the syntax visualizations' geometry pipeline; the
 * discourse view is HTML and exports these text forms instead.)
 */

/**
 * The visual indentation level for exports: the structural outline depth PLUS
 * the explicit per-line user indent, matching the on-screen rendering
 * (`(depth + userIndent) * step`). Every exporter uses this so a user's
 * hand-set indentation carries into Markdown, HTML/PDF, and SVG.
 */
function effectiveIndent(unit: DiscourseUnit): number {
  return unit.depth + (unit.userIndent ?? 0);
}

/** Pretty JSON of the (live, edited) discourse document. */
export function discourseDocumentJson(doc: DiscourseDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Pretty JSON of a discourse patch (the compact user-edit diff). */
export function discoursePatchJson(patch: DiscoursePatch): string {
  return JSON.stringify(patch, null, 2);
}

/** Short book abbreviation for refs in the outline ("Ephesians" → "Eph",
 *  "1 Corinthians" → "1 Cor"). */
function bookAbbr(book: string): string {
  const m = /^([1-3]\s)?([A-Za-z]+)/.exec(book.trim());
  if (!m) return book;
  const stem = m[2]!.length > 4 ? m[2]!.slice(0, 3) : m[2]!;
  return `${m[1] ?? ''}${stem}`;
}

function unitHeading(doc: DiscourseDocument, unit: DiscourseUnit): string {
  const abbr = bookAbbr(doc.range.book);
  const refs = unit.refStart ? `${abbr} ${formatRange(unit.refStart, unit.refEnd)}` : '';
  const label = unit.label ?? (unit.tokenIds.length ? '' : `(${unit.kind})`);
  if (label && refs) return `${label} — ${refs}`;
  return label || refs || unit.kind;
}

/**
 * The analysis as a Markdown outline: units in outline order, indented by
 * depth, each with its label + refs, optional source text / glosses, notes,
 * and its outgoing relations.
 *
 *   # Ephesians 5:3–33
 *   - **A — Eph 5:3–4**
 *     - Πορνεία δὲ καὶ …
 *     - Note: …
 *     - Relation: chiasm → A′ (Eph 5:31–33)
 */
export function discourseOutlineMarkdown(
  doc: DiscourseDocument,
  opts: { includeText?: boolean; includeGlosses?: boolean; includeNotes?: boolean } = {},
): string {
  const includeText = opts.includeText ?? true;
  const includeGlosses = opts.includeGlosses ?? false;
  const includeNotes = opts.includeNotes ?? true;
  const tokens = new Map(doc.tokens.map((t) => [t.id, t]));
  const byId = new Map(doc.units.map((u) => [u.id, u]));

  const lines: string[] = [`# ${doc.title}`, ''];
  for (const unit of outlineOrder(doc)) {
    const pad = '  '.repeat(effectiveIndent(unit));
    lines.push(`${pad}- **${unitHeading(doc, unit)}**`);
    if (includeText && unit.tokenIds.length) {
      const text = unit.tokenIds.map((tid) => tokens.get(tid)?.surface ?? '').join(' ').trim();
      if (text) lines.push(`${pad}  - ${text}`);
    }
    if (includeGlosses && unit.tokenIds.length) {
      const gloss = unit.tokenIds
        .map((tid) => tokens.get(tid)?.gloss ?? '')
        .filter(Boolean)
        .join(' ')
        .trim();
      if (gloss) lines.push(`${pad}  - _${gloss}_`);
    }
    if (includeNotes && unit.notes) lines.push(`${pad}  - Note: ${unit.notes}`);
    for (const r of doc.relations.filter((x) => x.sourceUnitId === unit.id)) {
      const target = byId.get(r.targetUnitId);
      const targetName = target ? unitHeading(doc, target) : r.targetUnitId;
      const label = r.label ? ` (${r.label})` : '';
      lines.push(`${pad}  - Relation: ${relationTypeLabel(r.type)} → ${targetName}${label}`);
    }
  }
  lines.push('', `_Exported from Scripture Diagrammer — user-authored discourse analysis over ${doc.sourceId}._`);
  return lines.join('\n');
}

/** The relations as a Markdown table. */
export function discourseRelationsMarkdown(doc: DiscourseDocument): string {
  const byId = new Map(doc.units.map((u) => [u.id, u]));
  const name = (id: string) => {
    const u = byId.get(id);
    return u ? unitHeading(doc, u) : id;
  };
  const rows = doc.relations.map((r) =>
    [
      relationTypeLabel(r.type),
      name(r.sourceUnitId),
      name(r.targetUnitId),
      r.label ?? '',
      r.confidence ?? '',
      r.notes ?? '',
    ]
      .map((c) => c.replace(/\|/g, '\\|'))
      .join(' | '),
  );
  return [
    `# Relations — ${doc.title}`,
    '',
    'Type | Source | Target | Label | Confidence | Notes',
    '--- | --- | --- | --- | --- | ---',
    ...rows,
  ].join('\n');
}

// --- printable HTML (Save as PDF) + SVG (vector) --------------------------------

interface OutlineRenderOptions {
  includeText?: boolean;
  includeGlosses?: boolean;
  includeNotes?: boolean;
}

/** Mid-tone hex per unit color tag, for the exported outline's left border. */
const UNIT_COLOR_HEX: Record<string, string> = {
  red: '#c0392b',
  orange: '#ca6f1e',
  yellow: '#b7950b',
  green: '#1e8449',
  blue: '#2e6da4',
  purple: '#7d3c98',
  gray: '#626f7a',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The outgoing relations of a unit, as display strings. */
function unitRelationLines(doc: DiscourseDocument, unit: DiscourseUnit): string[] {
  const byId = new Map(doc.units.map((u) => [u.id, u]));
  return doc.relations
    .filter((r) => r.sourceUnitId === unit.id)
    .map((r) => {
      const target = byId.get(r.targetUnitId);
      const targetName = target ? unitHeading(doc, target) : r.targetUnitId;
      const label = r.label ? ` (${r.label})` : '';
      return `${relationTypeLabel(r.type)} → ${targetName}${label}`;
    });
}

/**
 * The analysis as a SELF-CONTAINED printable HTML document. Opening it and
 * printing (Save as PDF) is the discourse view's PDF export — the view is HTML
 * (text blocks, not layout geometry), so a print-styled outline is its faithful
 * paged form. Fully inline (no external assets); the Greek font stack matches
 * the app so polytonic text stays legible.
 */
export function discourseOutlineHtml(
  doc: DiscourseDocument,
  opts: OutlineRenderOptions = {},
): string {
  const includeText = opts.includeText ?? true;
  const includeGlosses = opts.includeGlosses ?? false;
  const includeNotes = opts.includeNotes ?? true;
  const tokens = new Map(doc.tokens.map((t) => [t.id, t]));
  const greek = doc.language !== 'en';

  const rows: string[] = [];
  for (const unit of outlineOrder(doc)) {
    const indent = effectiveIndent(unit) * 22;
    const colorHex = unit.color ? UNIT_COLOR_HEX[unit.color] : undefined;
    const colorStyle = colorHex ? `border-left:3px solid ${colorHex};padding-left:6px` : '';
    const style = [`margin-left:${indent}px`, colorStyle].filter(Boolean).join(';');
    const parts: string[] = [`<div class="u" style="${style}">`];
    parts.push(`<div class="h">${escapeHtml(unitHeading(doc, unit))}</div>`);
    if (includeText && unit.tokenIds.length) {
      const text = unit.tokenIds.map((tid) => tokens.get(tid)?.surface ?? '').join(' ').trim();
      if (text) parts.push(`<div class="t${greek ? ' grc' : ''}">${escapeHtml(text)}</div>`);
    }
    if (includeGlosses && unit.tokenIds.length) {
      const gloss = unit.tokenIds
        .map((tid) => tokens.get(tid)?.gloss ?? '')
        .filter(Boolean)
        .join(' ')
        .trim();
      if (gloss) parts.push(`<div class="g">${escapeHtml(gloss)}</div>`);
    }
    if (includeNotes && unit.notes) parts.push(`<div class="n">${escapeHtml(unit.notes)}</div>`);
    for (const rel of unitRelationLines(doc, unit)) {
      parts.push(`<div class="r">${escapeHtml(rel)}</div>`);
    }
    parts.push('</div>');
    rows.push(parts.join(''));
  }

  const style = `
    * { box-sizing: border-box; }
    body { font: 14px/1.5 -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 32px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { color: #666; font-size: 12px; margin: 0 0 18px; }
    .u { margin: 0 0 10px; padding-left: 8px; border-left: 2px solid #e2e2e2; }
    .h { font-weight: 600; }
    .t { margin-top: 2px; }
    .t.grc { font-family: 'Gentium Plus', 'Cardo', 'New Athena Unicode', 'Palatino Linotype', 'Times New Roman', serif; }
    .g { color: #555; font-style: italic; margin-top: 2px; }
    .n { color: #333; margin-top: 2px; }
    .n::before { content: 'Note: '; color: #888; }
    .r { color: #444; margin-top: 2px; font-size: 13px; }
    .r::before { content: '↳ '; color: #888; }
    footer { margin-top: 24px; color: #888; font-size: 11px; }
    @media print { body { margin: 0.6in; } .u { break-inside: avoid; } }
  `.trim();

  return [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8">',
    `<title>${escapeHtml(doc.title)}</title>`,
    `<style>${style}</style></head><body>`,
    `<h1>${escapeHtml(doc.title)}</h1>`,
    `<p class="meta">Discourse analysis over ${escapeHtml(doc.sourceId)} — ${doc.units.filter((u) => u.tokenIds.length).length} units, ${doc.relations.length} relation${doc.relations.length === 1 ? '' : 's'}.</p>`,
    ...rows,
    '<footer>Exported from Scripture Diagrammer — user-authored discourse analysis.</footer>',
    '</body></html>',
  ].join('\n');
}

/** Wrap a string to <= `max` chars on word boundaries. */
function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (line && line.length + 1 + w.length > max) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function escapeXml(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

/**
 * The analysis as a self-contained VECTOR SVG of the outline (the fallback when
 * a paged PDF isn't wanted). Units are laid out top-to-bottom, indented by
 * depth; heading + optional text/glosses/notes/relations each on their own
 * line, long lines wrapped. Pure and deterministic.
 */
export function discourseOutlineSvg(
  doc: DiscourseDocument,
  opts: OutlineRenderOptions = {},
): string {
  const includeText = opts.includeText ?? true;
  const includeGlosses = opts.includeGlosses ?? false;
  const includeNotes = opts.includeNotes ?? true;
  const tokens = new Map(doc.tokens.map((t) => [t.id, t]));
  const greek = doc.language !== 'en';

  const PAD = 24;
  // Left GUTTER carries the relation arcs (like the on-screen view), so the
  // correspondence lines appear in the exported SVG / PDF, not just as text.
  const GUTTER = doc.relations.length ? 132 : 0;
  const WIDTH = 820 + GUTTER;
  const LINE = 20;
  const INDENT = 22;
  const CHARW = 7.1; // rough average glyph advance at 13px
  const greekFont =
    "'Gentium Plus','Cardo','New Athena Unicode','Palatino Linotype','Times New Roman',serif";

  interface Line { x: number; cls: 'h' | 't' | 'g' | 'n' | 'r'; text: string; grc?: boolean }
  const lines: Line[] = [];
  const wrapAt = (x: number) => Math.max(20, Math.floor((WIDTH - GUTTER - PAD - x) / CHARW));
  // y of each unit's heading line (arc endpoints connect these).
  const headY = new Map<string, number>();
  const yOfLineIndex = (i: number) => PAD + (i + 1) * LINE;

  lines.push({ x: 0, cls: 'h', text: doc.title });
  lines.push({
    x: 0,
    cls: 'g',
    text: `Discourse analysis over ${doc.sourceId} — ${doc.units.filter((u) => u.tokenIds.length).length} units, ${doc.relations.length} relation${doc.relations.length === 1 ? '' : 's'}.`,
  });
  lines.push({ x: 0, cls: 'n', text: '' }); // spacer

  for (const unit of outlineOrder(doc)) {
    const x = effectiveIndent(unit) * INDENT;
    headY.set(unit.id, yOfLineIndex(lines.length)); // this heading's y
    lines.push({ x, cls: 'h', text: `• ${unitHeading(doc, unit)}` });
    if (includeText && unit.tokenIds.length) {
      const text = unit.tokenIds.map((tid) => tokens.get(tid)?.surface ?? '').join(' ').trim();
      for (const l of wrap(text, wrapAt(x + 14))) lines.push({ x: x + 14, cls: 't', text: l, grc: greek });
    }
    if (includeGlosses && unit.tokenIds.length) {
      const gloss = unit.tokenIds.map((tid) => tokens.get(tid)?.gloss ?? '').filter(Boolean).join(' ').trim();
      if (gloss) for (const l of wrap(gloss, wrapAt(x + 14))) lines.push({ x: x + 14, cls: 'g', text: l });
    }
    if (includeNotes && unit.notes) {
      for (const l of wrap(`Note: ${unit.notes}`, wrapAt(x + 14))) lines.push({ x: x + 14, cls: 'n', text: l });
    }
    for (const rel of unitRelationLines(doc, unit)) {
      lines.push({ x: x + 14, cls: 'r', text: `↳ ${rel}` });
    }
  }

  const height = PAD * 2 + lines.length * LINE;
  const color: Record<Line['cls'], string> = { h: '#1a1a1a', t: '#1a1a1a', g: '#666', n: '#333', r: '#444' };
  const body = lines
    .map((l, i) => {
      const y = PAD + (i + 1) * LINE;
      const weight = l.cls === 'h' ? ' font-weight="600"' : '';
      const style = l.cls === 't' && l.grc ? ` font-family="${greekFont}"` : '';
      const italic = l.cls === 'g' ? ' font-style="italic"' : '';
      return `<text x="${GUTTER + PAD + l.x}" y="${y}" fill="${color[l.cls]}"${weight}${style}${italic}>${escapeXml(l.text)}</text>`;
    })
    .join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="13">`,
    `<rect width="${WIDTH}" height="${height}" fill="#ffffff"/>`,
    GUTTER ? renderOutlineArcs(doc, headY, GUTTER + PAD - 6) : '',
    body,
    '</svg>',
  ].join('\n');
}

/**
 * Relation arcs for the SVG/PDF outline export — bracket paths in the left
 * gutter connecting the two units' heading rows, with the SAME greedy lane
 * packing and centred short labels as the on-screen `DiscourseRelationLayer`, so
 * the printed correspondences match the view (and nested arcs don't clash).
 */
function renderOutlineArcs(
  doc: DiscourseDocument,
  headY: Map<string, number>,
  rightX: number,
): string {
  const specs = doc.relations
    .map((r) => ({ r, y1: headY.get(r.sourceUnitId), y2: headY.get(r.targetUnitId) }))
    .filter((s): s is { r: DiscourseDocument['relations'][number]; y1: number; y2: number } =>
      s.y1 !== undefined && s.y2 !== undefined,
    )
    .sort((a, b) => Math.abs(a.y1 - a.y2) - Math.abs(b.y1 - b.y2));
  if (!specs.length) return '';
  const lanes = new Map<string, number>();
  const placed: { lane: number; top: number; bottom: number }[] = [];
  for (const s of specs) {
    const top = Math.min(s.y1, s.y2);
    const bottom = Math.max(s.y1, s.y2);
    const taken = new Set(placed.filter((p) => p.top < bottom && p.bottom > top).map((p) => p.lane));
    let lane = 0;
    while (taken.has(lane)) lane++;
    lanes.set(s.r.id, lane);
    placed.push({ lane, top, bottom });
  }
  const laneCount = Math.max(1, ...[...lanes.values()].map((l) => l + 1));
  const laneStep = Math.max(14, Math.min(24, (rightX - 12) / laneCount));
  return specs
    .map((s) => {
      const lane = lanes.get(s.r.id) ?? 0;
      const x = Math.max(10, rightX - 6 - lane * laneStep);
      const midY = (s.y1 + s.y2) / 2;
      const col = relationColor(s.r.type);
      const paired = s.r.type === 'chiasm' || s.r.type === 'parallel' || s.r.type === 'inclusio';
      const dash = paired ? ' stroke-dasharray="5 3"' : '';
      const label = s.r.label || relationTypeLabel(s.r.type);
      const bracket = `<path d="M ${rightX} ${s.y1} H ${x} V ${s.y2} H ${rightX}" fill="none" stroke="${col}" stroke-width="1.5"${dash} opacity="0.85"/>`;
      const arrow = `<path d="M ${rightX - 5} ${s.y2 - 4} L ${rightX} ${s.y2} L ${rightX - 5} ${s.y2 + 4}" fill="none" stroke="${col}" stroke-width="1.5"/>`;
      const text = label
        ? `<text x="${x - 3}" y="${midY}" fill="${col}" font-size="11" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 ${x - 3} ${midY})">${escapeXml(label)}</text>`
        : '';
      return bracket + arrow + text;
    })
    .join('\n');
}

/**
 * A print-ready HTML document wrapping the arc-annotated outline SVG — this is
 * the discourse "Save as PDF" surface, so the printed page shows the same
 * correspondence arcs as the on-screen view (the plain HTML outline lists
 * relations only as text). Self-contained; the browser print dialog does the
 * PDF step.
 */
export function discourseOutlineSvgPrintHtml(
  doc: DiscourseDocument,
  opts: OutlineRenderOptions = {},
): string {
  const svg = discourseOutlineSvg(doc, opts);
  return [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8">',
    `<title>${escapeHtml(doc.title)}</title>`,
    '<style>',
    '  @media print { @page { margin: 12mm; } }',
    '  body { margin: 0; padding: 16px; background: #fff; }',
    '  svg { max-width: 100%; height: auto; }',
    '</style></head><body>',
    svg,
    '</body></html>',
  ].join('\n');
}

/** The relations as CSV (RFC-4180 quoting). */
export function discourseRelationsCsv(doc: DiscourseDocument): string {
  const byId = new Map(doc.units.map((u) => [u.id, u]));
  const name = (id: string) => {
    const u = byId.get(id);
    return u ? unitHeading(doc, u) : id;
  };
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = doc.relations.map((r) =>
    [
      r.id,
      r.type ?? '',
      name(r.sourceUnitId),
      name(r.targetUnitId),
      r.label ?? '',
      r.confidence ?? '',
      r.provenance.source,
      r.notes ?? '',
    ]
      .map(q)
      .join(','),
  );
  return ['id,type,source,target,label,confidence,provenance,notes', ...rows].join('\n');
}
