/**
 * dump-guided-doc — print the tokens / nodes / relations of one or more
 * documents already in the guided bundle (src/fixtures/guided/…json), so a
 * guide can be authored against REAL ids without any network fetch.
 *
 *   npm run guided:dump -- sblgnt_hebrews_0
 *   npm run guided:dump -- sblgnt_mark_172 sblgnt_mark_175
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const bundlePath = resolve(here, '../src/fixtures/guided/grammar-highlights-sblgnt.json');
const bundle = JSON.parse(readFileSync(bundlePath, 'utf8')) as {
  documents: {
    id: string;
    title: string;
    text: string;
    syntax: { rootId: string; nodes: { id: string; kind: string; role?: string; clauseType?: string; tokenIds: string[]; label?: string }[]; relations: { id: string; type: string; headId: string; dependentId: string; label?: string }[] };
    tokens: { id: string; index: number; surface: string; lemma?: string; pos?: string; gloss?: string; morphology?: Record<string, unknown> }[];
  }[];
};

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('Usage: npm run guided:dump -- <docId> [docId…]');
  console.error('Available ids:');
  for (const d of bundle.documents) console.error(`  ${d.id}\t${d.title}`);
  process.exit(1);
}

for (const id of ids) {
  const doc = bundle.documents.find((d) => d.id === id);
  if (!doc) {
    console.error(`(no document ${id} in the bundle)`);
    continue;
  }
  console.log('═'.repeat(72));
  console.log(`id    : ${doc.id}`);
  console.log(`title : ${doc.title}`);
  console.log(`root  : ${doc.syntax.rootId}`);
  console.log(`text  : ${doc.text}`);
  console.log('\nTOKENS (id · idx · surface · lemma · pos · morph · gloss):');
  for (const t of doc.tokens) {
    const m = t.morphology ? JSON.stringify(t.morphology) : '';
    console.log(`  ${t.id}\t${t.index}\t${t.surface}\t${t.lemma ?? ''}\t${t.pos ?? ''}\t${m}\t${t.gloss ?? ''}`);
  }
  console.log('\nNODES (id · kind · role · clauseType · tokenIds):');
  for (const n of doc.syntax.nodes) {
    console.log(`  ${n.id}\t${n.kind}\t${n.role ?? ''}\t${n.clauseType ?? ''}\t[${n.tokenIds.join(',')}]`);
  }
  console.log('\nRELATIONS (id · type · head → dependent · label):');
  for (const r of doc.syntax.relations) {
    console.log(`  ${r.id}\t${r.type}\t${r.headId} → ${r.dependentId}\t${r.label ?? ''}`);
  }
  console.log('');
}
