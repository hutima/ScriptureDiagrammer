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
const { maculaHebrewToDocuments } = await import('../src/io/macula-hebrew.ts');
const { GNT_BOOKS } = await import('../src/io/gnt.ts');
const { OT_BOOKS, chapterFile } = await import('../src/io/ot.ts');
const { KrDocumentSchema, SyntaxPatchSchema } = await import('../src/domain/schema/index.ts');
const { GUIDED_PASSAGES, GUIDED_HEBREW_PASSAGES } = await import('../src/data/guidedPassages.ts');
const { combinePassage } = await import('../src/io/passage.ts');
const { applyPatch } = await import('../src/domain/patch/index.ts');
const { overlayToPatch } = await import('../src/domain/contested/apply.ts');
const { ROM_9_5_APPOSITION_TO_CHRIST_PATCH } = await import('../src/data/contestedSyntaxSblgnt.ts');

const SBLGNT_SRC = 'https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/SBLGNT/lowfat/';
const OT_SRC = 'https://raw.githubusercontent.com/Clear-Bible/macula-hebrew/main/WLC/lowfat/';

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

/**
 * Ids the AUTHORED guides actually use (bundledPassageIds + per-step
 * passageIds). Once guides exist, the bundle keeps ONLY these documents, so an
 * extraction range that yields many sentences never bloats the shipped bundle
 * with sentences no guide walks. Pass `--all` (or before any guide references a
 * range) to keep every extracted sentence — the mode used to inspect ids
 * (`npm run guided:dump`) while authoring a new guide.
 */
const keepAll = process.argv.includes('--all');
let referenced = new Set<string>();
try {
  const { grammarHighlightGuides } = await import('../src/data/grammarHighlights.ts');
  for (const g of grammarHighlightGuides) {
    for (const id of g.bundledPassageIds) referenced.add(id);
    for (const s of g.steps) {
      if (s.passageId) referenced.add(s.passageId);
      if (s.secondaryPassageId) referenced.add(s.secondaryPassageId);
    }
  }
} catch (e) {
  console.warn('(could not read the guide registry; keeping all extracted docs)', e);
  referenced = new Set();
}
const filtering = !keepAll && referenced.size > 0;

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
    // In filtering mode keep only sentences an authored guide references.
    if (filtering && !referenced.has(d.id)) continue;
    const valid = KrDocumentSchema.parse(d);
    if (!documents.some((x) => (x as { id: string }).id === valid.id)) documents.push(valid);
    ids.push(valid.id);
  }
  manifest.push({ ref: `${p.book} ${p.chapter}:${p.verseFrom}–${p.verseTo}`, book: p.book, passageIds: ids });
  console.log(`✓ ${p.book} ${p.chapter}:${p.verseFrom}–${p.verseTo} → ${ids.join(', ') || '(none referenced)'}`);
}

// --- Romans 9:5 SPECIAL CASE — bake the app's STANDARD reading into the base.
// The contested doxology (ὁ ὢν ἐπὶ πάντων θεὸς εὐλογητός) is read here in
// apposition to ὁ Χριστός: "the Christ ... who is God over all, blessed forever"
// (see `iss_rom_9_5_doxology_sblgnt` in contestedSyntaxSblgnt.ts). Rather than
// leave that as an on-demand cross-sentence preview, we merge the two source
// sentences (9:3–5a `sblgnt_romans_228` + 9:5b `sblgnt_romans_229`) with
// `combinePassage` and apply the apposition-to-Christ overlay, so ALL FOUR
// diagram lenses show the christological structure by default. The single
// merged document REPLACES both standalone sentences under the stable id
// `sblgnt_romans_228`; the guide (`src/data/guides/romans-9-5.ts`) references
// its `s0_`/`s1_`-prefixed ids. The demoted independent-doxology reading is the
// registry alternate `alt_rom_9_5_independent_doxology_sblgnt` (the inverse).
{
  const romans = GNT_BOOKS.find((b) => b.name === 'Romans')!;
  const romansXml = await loadXml(`public/sblgnt/${romans.file}`, SBLGNT_SRC + romans.file);
  const romansDocs = lowfatToDocuments(romansXml, {
    book: romans.name,
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
  });
  const d228 = romansDocs.find((d) => d.id === 'sblgnt_romans_228');
  const d229 = romansDocs.find((d) => d.id === 'sblgnt_romans_229');
  if (!d228 || !d229) {
    throw new Error('Romans 9:5 merge: could not find sblgnt_romans_228 / sblgnt_romans_229.');
  }
  const merged = combinePassage([d228, d229]);
  const overlay = SyntaxPatchSchema.parse(ROM_9_5_APPOSITION_TO_CHRIST_PATCH);
  // Force the stable id so downstream consumers keep referencing sblgnt_romans_228.
  const patched = { ...applyPatch(merged, overlayToPatch(merged, overlay)), id: 'sblgnt_romans_228' };
  const mergedDoc = KrDocumentSchema.parse(patched);
  // Drop either standalone sentence (whichever survived filtering) and insert the
  // one merged document in its place.
  for (let i = documents.length - 1; i >= 0; i--) {
    const id = (documents[i] as { id: string }).id;
    if (id === 'sblgnt_romans_228' || id === 'sblgnt_romans_229') documents.splice(i, 1);
  }
  documents.push(mergedDoc);
  // Keep the manifest honest: the Romans 9:5 range now bundles just the merged id.
  for (const m of manifest) {
    if (m.passageIds.includes('sblgnt_romans_229') || m.passageIds.includes('sblgnt_romans_228')) {
      m.passageIds = m.passageIds
        .filter((x) => x !== 'sblgnt_romans_229' && x !== 'sblgnt_romans_228')
        .concat('sblgnt_romans_228');
    }
  }
  console.log('✓ Romans 9:5 → merged sblgnt_romans_228 (doxology in apposition to Χριστός)');
}

// --- Hebrew (WLC Lowfat) — a SEPARATE bundle for OT parallels stacked beneath a
// guide's NT sentence (a step's `secondaryPassageId`). macula-hebrew ships one
// file per CHAPTER, so a passage is picked by book + chapter; `public/ot/` is
// empty in-repo, so the chapters are fetched from the upstream source.
const hebrewDocuments: unknown[] = [];
const hebrewManifest: { ref: string; book: string; passageIds: string[] }[] = [];

for (const p of GUIDED_HEBREW_PASSAGES) {
  const book = OT_BOOKS.find((b) => b.name === p.book);
  if (!book) throw new Error(`Unknown OT book "${p.book}" in GUIDED_HEBREW_PASSAGES.`);
  const file = chapterFile(book, p.chapter);
  const xml = await loadXml(`public/ot/${file}`, OT_SRC + file);
  const docs = maculaHebrewToDocuments(xml, {
    book: book.name,
    sourceId: 'macula-hebrew-wlc-lowfat',
  });
  const matched = docs.filter((d) => overlapsRange(d.title, p.chapter, p.verseFrom, p.verseTo));
  if (!matched.length) {
    throw new Error(`No WLC sentence matched ${p.book} ${p.chapter}:${p.verseFrom}-${p.verseTo}.`);
  }
  const ids: string[] = [];
  for (const d of matched) {
    if (filtering && !referenced.has(d.id)) continue;
    const valid = KrDocumentSchema.parse(d);
    if (!hebrewDocuments.some((x) => (x as { id: string }).id === valid.id)) hebrewDocuments.push(valid);
    ids.push(valid.id);
  }
  hebrewManifest.push({ ref: `${p.book} ${p.chapter}:${p.verseFrom}–${p.verseTo}`, book: p.book, passageIds: ids });
  console.log(`✓ ${p.book} ${p.chapter}:${p.verseFrom}–${p.verseTo} → ${ids.join(', ') || '(none referenced)'}`);
}

if (filtering) {
  const has = (id: string) =>
    documents.some((d) => (d as { id: string }).id === id) ||
    hebrewDocuments.some((d) => (d as { id: string }).id === id);
  const missing = [...referenced].filter((id) => !has(id));
  if (missing.length) {
    throw new Error(
      `Guides reference passage ids not produced by any range: ${missing.join(', ')}. ` +
        `Add the covering verse range to GUIDED_PASSAGES / GUIDED_HEBREW_PASSAGES.`,
    );
  }
  console.log(
    `(lean bundle: kept ${documents.length} Greek + ${hebrewDocuments.length} Hebrew referenced document(s))`,
  );
}

const outDir = resolve(root, 'src/fixtures/guided');
mkdirSync(outDir, { recursive: true });

const out = {
  version: 1,
  sourceId: 'macula-greek-sblgnt-lowfat',
  license:
    'SBLGNT Lowfat trees: Clear-Bible/macula-greek, CC BY 4.0; SBLGNT text © SBL, CC BY 4.0.',
  builtBy: 'scripts/build-guided-highlights.mts',
  manifest,
  documents,
};
const outPath = resolve(outDir, 'grammar-highlights-sblgnt.json');
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`\nWrote ${documents.length} Greek document(s) to ${outPath}`);

const outHe = {
  version: 1,
  sourceId: 'macula-hebrew-wlc-lowfat',
  license: 'WLC Lowfat trees: Clear-Bible/macula-hebrew, CC BY 4.0.',
  builtBy: 'scripts/build-guided-highlights.mts',
  manifest: hebrewManifest,
  documents: hebrewDocuments,
};
const outHePath = resolve(outDir, 'grammar-highlights-wlc.json');
writeFileSync(outHePath, JSON.stringify(outHe, null, 1));
console.log(`Wrote ${hebrewDocuments.length} Hebrew document(s) to ${outHePath}`);
