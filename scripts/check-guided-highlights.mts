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
const { grammarHighlightGuides, guideDisplayDoc } = await import('../src/data/grammarHighlights.ts');
const { guidedDocuments } = await import('../src/fixtures/guided/index.ts');
const { getIssueById } = await import('../src/domain/contested/index.ts');
const { refInRange } = await import('../src/domain/discourse/index.ts');

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
  // Discourse-backed guides host the Discourse view over verse RANGES rather
  // than a bundled syntax diagram, so the token/node/relation id checks below
  // do not apply. Validate their range spec instead and move on.
  if (guide.kind === 'discourse') {
    if (!guide.discourse || guide.discourse.ranges.length === 0) {
      fail(`${guide.id}: discourse guide has no discourse.ranges`);
    }
    for (const r of guide.discourse?.ranges ?? []) {
      if (!r.sourceId || !r.startRef || !r.endRef || !r.bookNum) {
        fail(`${guide.id}: discourse range is missing sourceId/bookNum/startRef/endRef`);
      }
    }
    // Every seededArcs endpoint, seededHighlights ref, and seededSplits ref
    // must fall inside at least one declared range, so a typo'd ref is caught
    // here instead of silently being skipped at guided-load time. A ref may
    // carry a `/N` ordinal suffix (addressing the Nth leaf unit produced by a
    // seededSplit for that refStart) — strip it before checking the range,
    // and reject a malformed suffix (non-integer or non-positive) outright.
    const ranges = guide.discourse?.ranges ?? [];
    const stripOrdinalSuffix = (ref: string): { base: string; malformed: boolean } => {
      const m = /^(.*)\/([^/]+)$/.exec(ref);
      if (!m) return { base: ref, malformed: false };
      const n = Number(m[2]);
      const malformed = !Number.isInteger(n) || n < 1;
      return { base: m[1]!, malformed };
    };
    const refInAnyRange = (ref: string): boolean => {
      const { base, malformed } = stripOrdinalSuffix(ref);
      if (malformed) return false;
      return ranges.some((r) => refInRange(base, r.startRef, r.endRef));
    };
    const refIsMalformed = (ref: string): boolean => stripOrdinalSuffix(ref).malformed;
    for (const arc of guide.discourse?.seededArcs ?? []) {
      if (refIsMalformed(arc.sourceRef)) {
        fail(`${guide.id}: seededArcs "${arc.id}" sourceRef ${arc.sourceRef} has a malformed /N ordinal suffix`);
      } else if (!refInAnyRange(arc.sourceRef)) {
        fail(`${guide.id}: seededArcs "${arc.id}" sourceRef ${arc.sourceRef} is outside every declared range`);
      }
      if (refIsMalformed(arc.targetRef)) {
        fail(`${guide.id}: seededArcs "${arc.id}" targetRef ${arc.targetRef} has a malformed /N ordinal suffix`);
      } else if (!refInAnyRange(arc.targetRef)) {
        fail(`${guide.id}: seededArcs "${arc.id}" targetRef ${arc.targetRef} is outside every declared range`);
      }
    }
    for (const h of guide.discourse?.seededHighlights ?? []) {
      for (const ref of h.refs) {
        if (refIsMalformed(ref)) {
          fail(`${guide.id}: seededHighlights (${h.color}) ref ${ref} has a malformed /N ordinal suffix`);
        } else if (!refInAnyRange(ref)) {
          fail(`${guide.id}: seededHighlights (${h.color}) ref ${ref} is outside every declared range`);
        }
      }
    }
    for (const s of guide.discourse?.seededSplits ?? []) {
      if (refIsMalformed(s.ref)) {
        fail(`${guide.id}: seededSplits ref ${s.ref} has a malformed /N ordinal suffix`);
      } else if (!refInAnyRange(s.ref)) {
        fail(`${guide.id}: seededSplits ref ${s.ref} is outside every declared range`);
      }
    }
    for (const ind of guide.discourse?.seededIndents ?? []) {
      if (refIsMalformed(ind.ref)) {
        fail(`${guide.id}: seededIndents ref ${ind.ref} has a malformed /N ordinal suffix`);
      } else if (!refInAnyRange(ind.ref)) {
        fail(`${guide.id}: seededIndents ref ${ind.ref} is outside every declared range`);
      }
    }
    for (const lab of guide.discourse?.seededLabels ?? []) {
      if (refIsMalformed(lab.ref)) {
        fail(`${guide.id}: seededLabels ref ${lab.ref} has a malformed /N ordinal suffix`);
      } else if (!refInAnyRange(lab.ref)) {
        fail(`${guide.id}: seededLabels ref ${lab.ref} is outside every declared range`);
      }
    }
    if (guide.steps.length === 0) fail(`${guide.id}: guide has no steps`);
    console.log(
      `✓ ${guide.id} (discourse: ${guide.discourse?.ranges.length ?? 0} range(s), ${guide.steps.length} steps)`,
    );
    continue;
  }
  const docs = guide.bundledPassageIds.map((id) => {
    const d = guidedDocuments.find((x) => x.id === id);
    if (!d) fail(`${guide.id}: bundled passage "${id}" is not in the guided bundle (run guided:build?)`);
    return d;
  });
  // Validate step ids against what the guide actually DISPLAYS: a guide with a
  // `displayAlternateReadingId` re-draws its base through that alternate reading,
  // so the ids the steps point at are the displayed doc's, not the pristine base's.
  const present = docs
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map((d) => guideDisplayDoc(guide, d));
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

  // The devotional frame renders through the same `[[termId]]`-aware path as
  // the step prose, so its markers must resolve too.
  for (const m of (guide.devotionalFrame ?? '').matchAll(/\[\[([a-zA-Z0-9_-]+)\]\]/g)) {
    if (!termIds.has(m[1]!)) fail(`${guide.id}: devotionalFrame references unknown term [[${m[1]}]]`);
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
    // Stacked secondary passage — its focus/highlight ids resolve in the
    // SECONDARY passage's OWN id pool (not the primary's), mirroring the
    // per-step scope logic above.
    if (step.secondaryPassageId) {
      if (!bundledIds.has(step.secondaryPassageId)) {
        fail(`${where}: secondaryPassageId "${step.secondaryPassageId}" is not in bundledPassageIds`);
      }
      const secDoc = present.find((d) => d.id === step.secondaryPassageId);
      const secScope = secDoc ? idSets([secDoc]) : pool;
      for (const id of step.secondaryFocus?.tokenIds ?? []) {
        if (!secScope.tokenIds.has(id))
          fail(`${where}: secondary focus token ${id} not in passage ${step.secondaryPassageId}`);
      }
      for (const id of step.secondaryFocus?.nodeIds ?? []) {
        if (!secScope.nodeIds.has(id))
          fail(`${where}: secondary focus node ${id} not in passage ${step.secondaryPassageId}`);
      }
      for (const id of step.secondaryFocus?.relationIds ?? []) {
        if (!secScope.relationIds.has(id))
          fail(`${where}: secondary focus relation ${id} not in passage ${step.secondaryPassageId}`);
      }
      const sh = step.secondaryHighlights;
      for (const id of [
        ...(sh?.addedNodeIds ?? []),
        ...(sh?.changedNodeIds ?? []),
        ...(sh?.removedNodeIds ?? []),
        ...(sh?.emphasizedNodeIds ?? []),
      ]) {
        if (!secScope.nodeIds.has(id))
          fail(`${where}: secondary highlight node ${id} not in passage ${step.secondaryPassageId}`);
      }
      for (const id of sh?.relationIds ?? []) {
        if (!secScope.relationIds.has(id))
          fail(`${where}: secondary highlight relation ${id} not in passage ${step.secondaryPassageId}`);
      }
    }
    for (const id of step.greekTermIds ?? []) {
      if (!termIds.has(id)) fail(`${where}: greekTermIds entry "${id}" has no matching term`);
    }
    // Every prose field the step card renders through `renderBody` may carry
    // `[[termId]]` markers — validate them all, not just the body (a marker in
    // `caution`/`implication` used to slip through and render literally).
    const proseFields: Array<[string, string | undefined]> = [
      ['body', step.body],
      ['implication', step.implication],
      ['caution', step.caution],
    ];
    for (const [field, prose] of proseFields) {
      for (const m of (prose ?? '').matchAll(/\[\[([a-zA-Z0-9_-]+)\]\]/g)) {
        if (!termIds.has(m[1]!)) fail(`${where}: ${field} references unknown term [[${m[1]}]]`);
      }
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
