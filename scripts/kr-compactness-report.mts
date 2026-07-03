import { readFileSync, writeFileSync } from 'node:fs';
import { Window } from 'happy-dom';

// lowfat/macula conversion needs a DOMParser; provide happy-dom's in Node.
const win = new Window();
// @ts-expect-error assigning happy-dom's DOMParser onto the Node global
globalThis.DOMParser = win.DOMParser;

const { loadCorpus } = await import('../tests/kr-corpus.ts');
const { layoutDocument } = await import('../src/domain/layout/index.ts');

/**
 * KR COMPACTNESS REPORT — exact per-document width/area over the guarded
 * characterization corpus, for measuring packing PRs.
 *
 *   npm run kr:compactness -- save <file.json>   snapshot the current metrics
 *   npm run kr:compactness -- diff <file.json>   compare current vs snapshot:
 *                                                totals + biggest wins/losses
 *   npm run kr:compactness                       print totals only
 */

type Row = { name: string; width: number; height: number; area: number };

// Corpus names are NOT unique (several sentences per verse share a title), so
// suffix each with its occurrence index to keep the diff pairing stable.
const seen = new Map<string, number>();
const rows: Row[] = loadCorpus().map(({ name, doc }) => {
  const n = (seen.get(name) ?? 0) + 1;
  seen.set(name, n);
  const layout = layoutDocument(doc, doc.layoutHints);
  return {
    name: n > 1 ? `${name} #${n}` : name,
    width: Math.round(layout.width),
    height: Math.round(layout.height),
    area: Math.round(layout.width * layout.height),
  };
});

const totalArea = rows.reduce((s, r) => s + r.area, 0);
const totalWidth = rows.reduce((s, r) => s + r.width, 0);
const fmtM = (n: number) => `${(n / 1e6).toFixed(2)}Mpx²`;

const [cmd, file] = process.argv.slice(2);
if (cmd === 'save') {
  if (!file) throw new Error('save requires a target file');
  writeFileSync(file, JSON.stringify(rows, null, 1));
  console.log(`${rows.length} documents → ${file}`);
  console.log(`total area ${fmtM(totalArea)} · summed width ${totalWidth}px`);
} else if (cmd === 'diff') {
  if (!file) throw new Error('diff requires a baseline file');
  const base: Row[] = JSON.parse(readFileSync(file, 'utf8'));
  const baseBy = new Map(base.map((r) => [r.name, r]));
  const deltas = rows
    .filter((r) => baseBy.has(r.name))
    .map((r) => ({
      name: r.name,
      dArea: r.area - baseBy.get(r.name)!.area,
      dWidth: r.width - baseBy.get(r.name)!.width,
      area: r.area,
    }))
    .sort((a, b) => a.dArea - b.dArea);
  const baseTotal = base.reduce((s, r) => s + r.area, 0);
  const pct = ((totalArea - baseTotal) / baseTotal) * 100;
  console.log(
    `total area ${fmtM(baseTotal)} → ${fmtM(totalArea)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`,
  );
  const changed = deltas.filter((d) => d.dArea !== 0);
  console.log(`${changed.length}/${deltas.length} documents changed`);
  console.log('\nbiggest wins:');
  for (const d of changed.slice(0, 5))
    console.log(`  ${d.name}: area ${d.dArea} px² (width ${d.dWidth >= 0 ? '+' : ''}${d.dWidth}px)`);
  console.log('biggest losses:');
  for (const d of changed.slice(-5).reverse())
    console.log(`  ${d.name}: area +${d.dArea} px² (width ${d.dWidth >= 0 ? '+' : ''}${d.dWidth}px)`);
} else {
  console.log(`${rows.length} documents`);
  console.log(`total area ${fmtM(totalArea)} · summed width ${totalWidth}px`);
}
