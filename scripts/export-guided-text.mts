/**
 * export-guided-text — dump ALL Grammar-Highlights (guided mode) prose into
 * one reviewable Markdown file.
 *
 *   npm run guided:text:export              → writes ./guided-text.md
 *   npm run guided:text:export -- --out my-review.md
 *
 * Every reader-facing text field of every guide (including hidden guides) is
 * emitted between `<!-- @field <key> -->` … `<!-- @end -->` markers; edit the
 * text, then apply it back onto the guide sources with
 * `npm run guided:text:import` (a drop-in replacement of exactly those string
 * literals — see scripts/lib/guided-text.mts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildGuidedTextExport, GUIDED_TEXT_DEFAULT_FILE } from './lib/guided-text.mts';

const { grammarHighlightGuides } = await import('../src/data/grammarHighlights.ts');

const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outPath = path.resolve(
  outFlag !== -1 && args[outFlag + 1] ? args[outFlag + 1]! : GUIDED_TEXT_DEFAULT_FILE,
);

const { markdown, entries } = buildGuidedTextExport(grammarHighlightGuides, {
  generatedNote: `${new Date().toISOString().slice(0, 10)} · ${grammarHighlightGuides.length} guides`,
});

fs.writeFileSync(outPath, markdown, 'utf8');

const perGuide = new Map<string, number>();
for (const e of entries) perGuide.set(e.guideId, (perGuide.get(e.guideId) ?? 0) + 1);
console.log(`✓ exported ${entries.length} text fields from ${perGuide.size} guides`);
console.log(`  → ${outPath}`);
console.log('');
console.log('Edit the text between the @field markers, then re-import with:');
console.log(`  npm run guided:text:import -- ${path.relative(process.cwd(), outPath)}`);
