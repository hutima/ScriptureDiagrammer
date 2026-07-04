/**
 * build-guided-highlights — extract ONLY the approved Grammar-Highlights
 * passages from the SBLGNT Lowfat source into a compact bundled fixture,
 * `src/fixtures/guided/grammar-highlights-sblgnt.json`.
 *
 *   npm run guided:build
 *
 * The whole SBLGNT is NEVER bundled: this script fetches each listed book
 * (bundled `public/sblgnt/` copy first, upstream macula-greek otherwise),
 * converts it with the normal Lowfat pipeline (so ids are IDENTICAL to what
 * the app mints when it loads the same passage from the source picker), keeps
 * only the sentences covering the listed verse ranges, validates them against
 * `KrDocumentSchema`, and writes them with a small manifest.
 *
 * Add a passage here ONLY after it is approved for the guided library; then
 * author its guide in `src/data/grammarHighlights.ts` against the REAL ids
 * (`npm run dump-syntax -- 'sblgnt:<ref>'`) and run `npm run guided:check`.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Window } from 'happy-dom';

const win = new Window();
// @ts-expect-error — install the DOM globals the converters rely on.
globalThis.DOMParser = win.DOMParser;

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const { lowfatToDocuments, sblgntDialect } = await import('../src/io/lowfat.ts');
const { GNT_BOOKS } = await import('../src/io/gnt.ts');
const { KrDocumentSchema } = await import('../src/domain/schema/index.ts');
const { GUIDED_PASSAGES } = await import('../src/data/guidedPassages.ts');

const SBLGNT_SRC = 'https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/SBLGNT/lowfat/';

async function loadXml(localRel: string, remote: string): Promise<string> {
  const local = resolve(root, localRel);
  if (existsSync(local)) return readFileSync(local, 'utf8');
  const res = await fetch(remote);
  if (!res.ok) throw new Error(`fetch ${remote} → ${res.status}`);
  return await res.text();
}

/** Whether a sentence title ("Hebrews 1:1–4") overlaps chapter:verseFrom-verseTo. */
function overlapsRange(title: string, chap: number, v0: number, v1: number): boolean {
  const m = title.match(/(\d+):(\d+)(?:[–-](\d+))?\s*$/);
  if (!m) return false;
  const c = Number(m[1]);
  const a = Number(m[2]);
  const b = m[3] ? Number(m[3]) : a;
  return c === chap && b >= v0 && a <= v1;
}

const documents: unknown[] = [];
const manifest: { ref: string; book: string; passageIds: string[] }[] = [];

for (const p of GUIDED_PASSAGES) {
  const book = GNT_BOOKS.find((b) => b.name === p.book);
  if (!book) throw new Error(`Unknown GNT book "${p.book}" in GUIDED_PASSAGES.`);
  const xml = await loadXml(`public/sblgnt/${book.file}`, SBLGNT_SRC + book.file);
  const docs = lowfatToDocuments(xml, {
    book: book.name,
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
  });
  const matched = docs.filter((d) => overlapsRange(d.title, p.chapter, p.verseFrom, p.verseTo));
  if (!matched.length) {
    throw new Error(`No SBLGNT sentence matched ${p.book} ${p.chapter}:${p.verseFrom}-${p.verseTo}.`);
  }
  const ids: string[] = [];
  for (const d of matched) {
    const valid = KrDocumentSchema.parse(d);
    if (!documents.some((x) => (x as { id: string }).id === valid.id)) documents.push(valid);
    ids.push(valid.id);
  }
  manifest.push({ ref: `${p.book} ${p.chapter}:${p.verseFrom}–${p.verseTo}`, book: p.book, passageIds: ids });
  console.log(`✓ ${p.book} ${p.chapter}:${p.verseFrom}–${p.verseTo} → ${ids.join(', ')}`);
}

const out = {
  version: 1,
  sourceId: 'macula-greek-sblgnt-lowfat',
  license:
    'SBLGNT Lowfat trees: Clear-Bible/macula-greek, CC BY 4.0; SBLGNT text © SBL, CC BY 4.0.',
  builtBy: 'scripts/build-guided-highlights.mts',
  manifest,
  documents,
};

const outDir = resolve(root, 'src/fixtures/guided');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'grammar-highlights-sblgnt.json');
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`\nWrote ${documents.length} document(s) to ${outPath}`);
