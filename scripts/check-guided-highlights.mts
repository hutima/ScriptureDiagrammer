/**
 * check-guided-highlights — validate the Grammar-Highlights registry against
 * the bundled guided passages, so a guide can never ship with a guessed or
 * stale id.
 *
 *   npm run guided:check
 *
 * Checks, per guide:
 *  - `bundledPassageIds` all exist in the guided bundle;
 *  - every focus/highlight token/node/relation id exists in those documents;
 *  - every Greek term's `tokenId` exists, and the term's `surface` matches the
 *    token's surface (a mismatch means the id points at the wrong word);
 *  - every `[[termId]]` marker in step bodies resolves to a Greek term;
 *  - every `greekTermIds` entry resolves.
 *
 * Exits non-zero with a readable report on any failure.
 */
const { grammarHighlightGuides } = await import('../src/data/grammarHighlights.ts');
const { guidedDocuments } = await import('../src/fixtures/guided/index.ts');

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`✗ ${msg}`);
};

for (const guide of grammarHighlightGuides) {
  const docs = guide.bundledPassageIds.map((id) => {
    const d = guidedDocuments.find((x) => x.id === id);
    if (!d) fail(`${guide.id}: bundled passage "${id}" is not in the guided bundle (run guided:build?)`);
    return d;
  });
  const present = docs.filter((d): d is NonNullable<typeof d> => !!d);
  const tokenIds = new Set(present.flatMap((d) => d.tokens.map((t) => t.id)));
  const tokenSurface = new Map(present.flatMap((d) => d.tokens.map((t) => [t.id, t.surface] as const)));
  const nodeIds = new Set(present.flatMap((d) => d.syntax.nodes.map((n) => n.id)));
  const relationIds = new Set(present.flatMap((d) => d.syntax.relations.map((r) => r.id)));
  const termIds = new Set(guide.greekTerms.map((t) => t.id));

  for (const term of guide.greekTerms) {
    if (!tokenIds.has(term.tokenId)) {
      fail(`${guide.id}: term "${term.id}" tokenId ${term.tokenId} not found`);
    } else if (tokenSurface.get(term.tokenId) !== term.surface) {
      fail(
        `${guide.id}: term "${term.id}" surface "${term.surface}" ≠ token ${term.tokenId} surface "${tokenSurface.get(term.tokenId)}"`,
      );
    }
  }

  for (const step of guide.steps) {
    const where = `${guide.id} / ${step.id}`;
    for (const id of step.focus.tokenIds ?? []) {
      if (!tokenIds.has(id)) fail(`${where}: focus token ${id} not found`);
    }
    for (const id of step.focus.nodeIds ?? []) {
      if (!nodeIds.has(id)) fail(`${where}: focus node ${id} not found`);
    }
    for (const id of step.focus.relationIds ?? []) {
      if (!relationIds.has(id)) fail(`${where}: focus relation ${id} not found`);
    }
    const h = step.highlights;
    for (const id of [
      ...(h?.addedNodeIds ?? []),
      ...(h?.changedNodeIds ?? []),
      ...(h?.removedNodeIds ?? []),
      ...(h?.emphasizedNodeIds ?? []),
    ]) {
      if (!nodeIds.has(id)) fail(`${where}: highlight node ${id} not found`);
    }
    for (const id of h?.relationIds ?? []) {
      if (!relationIds.has(id)) fail(`${where}: highlight relation ${id} not found`);
    }
    for (const id of step.greekTermIds ?? []) {
      if (!termIds.has(id)) fail(`${where}: greekTermIds entry "${id}" has no matching term`);
    }
    for (const m of step.body.matchAll(/\[\[([a-zA-Z0-9_-]+)\]\]/g)) {
      if (!termIds.has(m[1]!)) fail(`${where}: body references unknown term [[${m[1]}]]`);
    }
    const hasFocus =
      (step.focus.tokenIds?.length ?? 0) +
        (step.focus.nodeIds?.length ?? 0) +
        (step.focus.relationIds?.length ?? 0) >
      0;
    if (!hasFocus && step.panZoom?.fit !== 'whole-diagram') {
      fail(`${where}: step has no focus targets and does not fit the whole diagram`);
    }
  }
  console.log(`✓ ${guide.id} (${guide.steps.length} steps, ${guide.greekTerms.length} terms)`);
}

if (failures) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log(`\nAll ${grammarHighlightGuides.length} guide(s) validate against the bundled passages.`);
