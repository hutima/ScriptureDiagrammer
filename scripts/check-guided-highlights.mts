/**
 * check-guided-highlights — validate the Grammar-Highlights registry against
 * the bundled guided passages, so a guide can never ship with a guessed or
 * stale id.
 *
 *   npm run guided:check
 *
 * Checks, per guide:
 *  - `bundledPassageIds` all exist in the guided bundle;
 *  - every `step.passageId` (when present) is one of `bundledPassageIds`;
 *  - every focus/highlight token/node/relation id exists in the STEP'S OWN
 *    passage (step.passageId, else the guide's first passage) — so a
 *    two-passage guide can't point a step at the wrong sentence's ids;
 *  - every Greek term's `tokenId` exists somewhere in the guide's passages, and
 *    the term's `surface` matches the token's surface (a mismatch means the id
 *    points at the wrong word);
 *  - every `[[termId]]` marker in step bodies resolves to a Greek term;
 *  - every `greekTermIds` entry resolves;
 *  - every `step.contested.issueId` resolves to a REAL issue in the curated
 *    contested-syntax registry, and that issue applies to the step's own
 *    passage (its `passageId` or one of its `mergePassageIds`).
 *
 * Exits non-zero with a readable report on any failure.
 */
const { grammarHighlightGuides } = await import('../src/data/grammarHighlights.ts');
const { guidedDocuments } = await import('../src/fixtures/guided/index.ts');
const { getIssueById } = await import('../src/domain/contested/index.ts');

type Doc = (typeof guidedDocuments)[number];

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`✗ ${msg}`);
};

const idSets = (docs: Doc[]) => ({
  tokenIds: new Set(docs.flatMap((d) => d.tokens.map((t) => t.id))),
  nodeIds: new Set(docs.flatMap((d) => d.syntax.nodes.map((n) => n.id))),
  relationIds: new Set(docs.flatMap((d) => d.syntax.relations.map((r) => r.id))),
});

for (const guide of grammarHighlightGuides) {
  const docs = guide.bundledPassageIds.map((id) => {
    const d = guidedDocuments.find((x) => x.id === id);
    if (!d) fail(`${guide.id}: bundled passage "${id}" is not in the guided bundle (run guided:build?)`);
    return d;
  });
  const present = docs.filter((d): d is NonNullable<typeof d> => !!d);
  const bundledIds = new Set(guide.bundledPassageIds);
  // Pool (across all the guide's passages) — used for guide-global term ids.
  const pool = idSets(present);
  const tokenSurface = new Map(present.flatMap((d) => d.tokens.map((t) => [t.id, t.surface] as const)));
  const termIds = new Set(guide.greekTerms.map((t) => t.id));

  for (const term of guide.greekTerms) {
    if (!pool.tokenIds.has(term.tokenId)) {
      fail(`${guide.id}: term "${term.id}" tokenId ${term.tokenId} not found`);
    } else if (tokenSurface.get(term.tokenId) !== term.surface) {
      fail(
        `${guide.id}: term "${term.id}" surface "${term.surface}" ≠ token ${term.tokenId} surface "${tokenSurface.get(term.tokenId)}"`,
      );
    }
  }

  const firstPassage = guide.steps[0]?.passageId ?? guide.bundledPassageIds[0];

  for (const step of guide.steps) {
    const where = `${guide.id} / ${step.id}`;
    // The passage this step is about — must be one the guide bundles.
    const stepPassageId = step.passageId ?? firstPassage;
    if (step.passageId && !bundledIds.has(step.passageId)) {
      fail(`${where}: passageId "${step.passageId}" is not in bundledPassageIds`);
    }
    const stepDoc = present.find((d) => d.id === stepPassageId);
    // Validate the step's structural ids against ITS OWN passage.
    const scope = stepDoc ? idSets([stepDoc]) : pool;
    for (const id of step.focus.tokenIds ?? []) {
      if (!scope.tokenIds.has(id)) fail(`${where}: focus token ${id} not in passage ${stepPassageId}`);
    }
    for (const id of step.focus.nodeIds ?? []) {
      if (!scope.nodeIds.has(id)) fail(`${where}: focus node ${id} not in passage ${stepPassageId}`);
    }
    for (const id of step.focus.relationIds ?? []) {
      if (!scope.relationIds.has(id)) fail(`${where}: focus relation ${id} not in passage ${stepPassageId}`);
    }
    const h = step.highlights;
    for (const id of [
      ...(h?.addedNodeIds ?? []),
      ...(h?.changedNodeIds ?? []),
      ...(h?.removedNodeIds ?? []),
      ...(h?.emphasizedNodeIds ?? []),
    ]) {
      if (!scope.nodeIds.has(id)) fail(`${where}: highlight node ${id} not in passage ${stepPassageId}`);
    }
    for (const id of h?.relationIds ?? []) {
      if (!scope.relationIds.has(id)) fail(`${where}: highlight relation ${id} not in passage ${stepPassageId}`);
    }
    for (const id of step.greekTermIds ?? []) {
      if (!termIds.has(id)) fail(`${where}: greekTermIds entry "${id}" has no matching term`);
    }
    for (const m of step.body.matchAll(/\[\[([a-zA-Z0-9_-]+)\]\]/g)) {
      if (!termIds.has(m[1]!)) fail(`${where}: body references unknown term [[${m[1]}]]`);
    }
    if (step.contested) {
      const issue = getIssueById(step.contested.issueId);
      if (!issue) {
        fail(`${where}: contested issueId "${step.contested.issueId}" not in the contested registry`);
      } else if (
        issue.passageId !== stepPassageId &&
        !(issue.mergePassageIds?.includes(stepPassageId!) ?? false)
      ) {
        fail(
          `${where}: contested issue "${issue.id}" does not apply to passage ${stepPassageId} (issue passage: ${issue.passageId})`,
        );
      }
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
