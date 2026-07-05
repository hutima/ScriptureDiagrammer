/**
 * guided-text — round-trip guarantees for the guided-mode text export/import
 * (`npm run guided:text:export` / `npm run guided:text:import`).
 *
 * The critical property: EVERY field the export emits must be re-importable as
 * a drop-in replacement, i.e. its key must resolve to a plain string literal
 * in the real guide module on disk whose value matches the registry. If an
 * author ever writes guide prose as a template literal / concatenation, or an
 * id stops being addressable, these tests fail before the scripts mislead a
 * reviewer.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildGuidedTextExport,
  indexGuideFiles,
  normalizeGuidedText,
  parseGuidedTextMarkdown,
  readGuideStringAtPath,
  rewriteGuideText,
} from '../scripts/lib/guided-text.mts';
import { grammarHighlightGuides } from '@/data/grammarHighlights';

const GUIDES_DIR = path.resolve(__dirname, '../src/data/guides');

describe('guided-text export/import round-trip', () => {
  const { markdown, entries } = buildGuidedTextExport(grammarHighlightGuides);

  it('exports a substantial number of fields from every guide', () => {
    expect(entries.length).toBeGreaterThan(500);
    const guideIds = new Set(entries.map((e) => e.guideId));
    for (const guide of grammarHighlightGuides) {
      expect(guideIds.has(guide.id), `no text exported for ${guide.id}`).toBe(true);
    }
  });

  it('parses its own export back losslessly (unedited file = zero changes)', () => {
    const blocks = parseGuidedTextMarkdown(markdown);
    expect(blocks.size).toBe(entries.length);
    for (const entry of entries) {
      const block = blocks.get(entry.key);
      expect(block, `block missing for ${entry.key}`).toBeDefined();
      expect(normalizeGuidedText(block!.text)).toBe(normalizeGuidedText(entry.text));
    }
  });

  it('uses globally unique keys', () => {
    const keys = new Set(entries.map((e) => e.key));
    expect(keys.size).toBe(entries.length);
  });

  it('every exported field resolves to the matching string literal in its guide module', () => {
    const files = indexGuideFiles(GUIDES_DIR);
    const sources = new Map<string, string>();
    for (const entry of entries) {
      const filePath = files.get(entry.guideId);
      expect(filePath, `no module found for guide ${entry.guideId}`).toBeDefined();
      let source = sources.get(filePath!);
      if (source === undefined) {
        source = fs.readFileSync(filePath!, 'utf8');
        sources.set(filePath!, source);
      }
      const inSource = readGuideStringAtPath(source, entry.guideId, entry.path);
      expect(inSource, `source text drift at ${entry.key}`).toBe(entry.text);
    }
  });
});

describe('guided-text markdown parser', () => {
  it('ignores headings/labels and rejects structural damage', () => {
    const ok = parseGuidedTextMarkdown(
      ['# Heading', '**Label**', '<!-- @field g :: title -->', 'Hello', 'world', '<!-- @end -->'].join(
        '\n',
      ),
    );
    expect(ok.get('g :: title')?.text).toBe('Hello\nworld');

    expect(() =>
      parseGuidedTextMarkdown('<!-- @field g :: title -->\nText with no end'),
    ).toThrow(/never closed/);
    expect(() =>
      parseGuidedTextMarkdown(
        '<!-- @field a :: t -->\nx\n<!-- @end -->\n<!-- @field a :: t -->\ny\n<!-- @end -->',
      ),
    ).toThrow(/duplicate key/);
    expect(() => parseGuidedTextMarkdown('<!-- @end -->')).toThrow(/without an open/);
  });
});

describe('guided-text source rewriting', () => {
  const johnPath = path.join(GUIDES_DIR, 'john-1-1.ts');
  const johnSource = fs.readFileSync(johnPath, 'utf8');

  it('replaces exactly the addressed literals and nothing else', () => {
    const changes = [
      { path: 'summary', text: "John's opening claim — with an apostrophe to escape." },
      { path: 'steps[step-word-was-god].body', text: 'New body with a [[theos]] link.' },
      { path: 'greekTerms[theos].gloss', text: 'God (deity)' },
      { path: 'debateSummary.views[0].cautions[1]', text: 'A rewritten caution.' },
    ];
    const rewritten = rewriteGuideText(johnSource, 'guide-john-1-1', changes);

    for (const change of changes) {
      expect(readGuideStringAtPath(rewritten, 'guide-john-1-1', change.path)).toBe(change.text);
    }
    // Untouched fields (and the file's comments) survive byte-for-byte.
    expect(readGuideStringAtPath(rewritten, 'guide-john-1-1', 'title')).toBe(
      readGuideStringAtPath(johnSource, 'guide-john-1-1', 'title'),
    );
    expect(rewritten).toContain('dump with `npm run guided:dump`');
    expect(rewritten).toContain("id: 'guide-john-1-1'");
  });

  it('throws (writing nothing) on a path that does not exist', () => {
    expect(() =>
      rewriteGuideText(johnSource, 'guide-john-1-1', [{ path: 'steps[nope].body', text: 'x' }]),
    ).toThrow(/no element "nope"/);
    expect(() =>
      rewriteGuideText(johnSource, 'guide-missing', [{ path: 'title', text: 'x' }]),
    ).toThrow(/not found/);
  });
});
