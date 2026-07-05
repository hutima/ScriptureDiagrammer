/**
 * import-guided-text — apply an edited guided-text Markdown file back onto the
 * guide sources as a DROP-IN replacement.
 *
 *   npm run guided:text:import                       → reads ./guided-text.md
 *   npm run guided:text:import -- my-review.md
 *   npm run guided:text:import -- my-review.md --dry-run
 *
 * For every `<!-- @field <guideId> :: <path> -->` block whose (whitespace-
 * normalized) text differs from the registry, the matching string literal in
 * `src/data/guides/*.ts` is rewritten in place — ids, focus targets, comments,
 * and formatting are untouched, so the result is exactly the guide the app
 * already loads, with the new prose.
 *
 * Safety, in order, BEFORE anything is written:
 *  1. every key must exist in the current registry (a stale key means the
 *     sources changed since the export — re-export and re-apply your edits);
 *  2. no block may be emptied (delete the whole block to leave a field alone);
 *  3. every `[[termId]]` marker in the new text must resolve to a Greek term
 *     of that guide;
 *  4. all edits are applied to an in-memory clone of the registry and the
 *     result must still pass the Zod registry schema;
 *  5. every changed path must resolve to a string literal in its guide module.
 * After writing, each file is re-parsed and every changed field re-read to
 * verify the new text landed. Finish with `npm run guided:check` + tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildGuidedTextExport,
  GUIDED_TEXT_DEFAULT_FILE,
  indexGuideFiles,
  normalizeGuidedText,
  parseGuidedTextMarkdown,
  readGuideStringAtPath,
  rewriteGuideText,
  setGuideTextAtPath,
  type GuideTextChange,
} from './lib/guided-text.mts';

const { grammarHighlightGuides } = await import('../src/data/grammarHighlights.ts');
const { GrammarHighlightsRegistrySchema } = await import('../src/domain/schema/index.ts');

const GUIDES_DIR = path.resolve('src/data/guides');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.find((a) => a !== '--dry-run');
const inPath = path.resolve(fileArg ?? GUIDED_TEXT_DEFAULT_FILE);

if (!fs.existsSync(inPath)) {
  console.error(`✗ file not found: ${inPath}`);
  console.error('  Run `npm run guided:text:export` first, edit the file, then re-import.');
  process.exit(1);
}

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`✗ ${msg}`);
};

// --- 1. parse the edited file and the current registry text -----------------
const blocks = parseGuidedTextMarkdown(fs.readFileSync(inPath, 'utf8'));
const { entries } = buildGuidedTextExport(grammarHighlightGuides);
const currentByKey = new Map(entries.map((e) => [e.key, e]));

const changesByGuide = new Map<string, GuideTextChange[]>();
let unchanged = 0;

for (const block of blocks.values()) {
  const current = currentByKey.get(block.key);
  if (!current) {
    fail(
      `line ${block.line}: unknown key "${block.key}" — the guide sources may have changed since this file was exported; re-run \`npm run guided:text:export\``,
    );
    continue;
  }
  const newText = normalizeGuidedText(block.text);
  if (newText === '') {
    fail(
      `line ${block.line}: "${block.key}" is empty — emptying a field is not supported; delete the whole block to leave it unchanged`,
    );
    continue;
  }
  if (newText === normalizeGuidedText(current.text)) {
    unchanged++;
    continue;
  }
  const list = changesByGuide.get(current.guideId) ?? [];
  list.push({ path: current.path, text: newText });
  changesByGuide.set(current.guideId, list);
}

// --- 2. `[[termId]]` markers in new text must resolve ------------------------
for (const [guideId, changes] of changesByGuide) {
  const guide = grammarHighlightGuides.find((g) => g.id === guideId)!;
  const termIds = new Set(guide.greekTerms.map((t) => t.id));
  for (const change of changes) {
    for (const m of change.text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      if (!termIds.has(m[1]!)) {
        fail(`${guideId} :: ${change.path}: references unknown Greek term [[${m[1]}]]`);
      }
    }
  }
}

// --- 3. schema-validate the edited registry in memory ------------------------
if (failures === 0 && changesByGuide.size > 0) {
  const editedGuides = grammarHighlightGuides.map((guide) => {
    const changes = changesByGuide.get(guide.id);
    if (!changes) return guide;
    const clone = structuredClone(guide);
    for (const change of changes) {
      try {
        setGuideTextAtPath(clone, change.path, change.text);
      } catch (err) {
        fail(`${guide.id} :: ${change.path}: ${(err as Error).message}`);
      }
    }
    return clone;
  });
  if (failures === 0) {
    const parsed = GrammarHighlightsRegistrySchema.safeParse({ version: 1, guides: editedGuides });
    if (!parsed.success) {
      fail(`edited text no longer passes the registry schema:\n${parsed.error.message}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n✗ ${failures} problem(s) — nothing was written.`);
  process.exit(1);
}

if (changesByGuide.size === 0) {
  console.log(`✓ ${unchanged} fields checked — no text differs from the sources; nothing to do.`);
  process.exit(0);
}

// --- 4. resolve guide modules and rewrite the string literals ----------------
const guideFiles = indexGuideFiles(GUIDES_DIR);
const totalChanges = [...changesByGuide.values()].reduce((n, c) => n + c.length, 0);

for (const [guideId, changes] of changesByGuide) {
  const filePath = guideFiles.get(guideId);
  if (!filePath) {
    fail(`guide "${guideId}" not found in any module under ${GUIDES_DIR}`);
    continue;
  }
  const sourceText = fs.readFileSync(filePath, 'utf8');
  let rewritten: string;
  try {
    rewritten = rewriteGuideText(sourceText, guideId, changes);
  } catch (err) {
    fail(`${path.basename(filePath)}: ${(err as Error).message}`);
    continue;
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}${path.relative(process.cwd(), filePath)}:`);
  for (const change of changes) {
    const preview = change.text.length > 72 ? `${change.text.slice(0, 72)}…` : change.text;
    console.log(`  · ${change.path}`);
    console.log(`      → ${preview}`);
  }

  if (dryRun) continue;
  fs.writeFileSync(filePath, rewritten, 'utf8');

  // Post-write verification: re-read the file and confirm each field landed.
  const written = fs.readFileSync(filePath, 'utf8');
  for (const change of changes) {
    const landed = readGuideStringAtPath(written, guideId, change.path);
    if (landed !== change.text) {
      fail(`${path.basename(filePath)}: verification failed for ${change.path}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n✗ ${failures} problem(s) — review the messages above.`);
  process.exit(1);
}

console.log('');
if (dryRun) {
  console.log(
    `✓ dry run: ${totalChanges} field(s) across ${changesByGuide.size} guide(s) would change (${unchanged} unchanged).`,
  );
} else {
  console.log(
    `✓ updated ${totalChanges} field(s) across ${changesByGuide.size} guide(s) (${unchanged} unchanged).`,
  );
  console.log('  Now run: npm run guided:check && npm run typecheck && npm run test');
}
