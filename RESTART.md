# RESTART — guided discourse: Psalm 46 / Ephesians / Acts  (COMPLETE)

Branch: `claude/guided-discourse-psalm-acts-a7yvgf`

All planned work is done and committed. Full suite green (2347 tests), typecheck
clean, `guided:check` passes (22 guides), production build succeeds.

## What shipped (commits on this branch)
1. `2ce21ca` infra — `seededIndents`/`seededLabels` on GuidedDiscourseSpec +
   opt-in `sectionLabels` in `mergeDiscourseDocuments` + check-script validation + CSS.
2. `5374e70` Psalm 46 guide — corrected for BSB **Hebrew versification**
   (46:1 = superscription; psalm proper 46:2–46:12; closing refrain A′ at 46:12).
   Superscription shown, labelled "Superscription — not part of the chiasm", no
   arc/colour. Arcs A 46:2↔46:12, B 46:3↔46:11, C 46:7↔46:9; centre 46:8 highlighted.
3. `4c962e2` Ephesians 2:12–19 — seeded indent staircase (0-1-2-3-3-2-1-0).
4. `464b97a` Acts 2:39 — Genesis-first ordering; each range renders as a titled
   section (heading + gap); step-1 prose updated.
5. `fae78d1` **Blank/comment rows** (user request) — `kind:'note'` unit:
   `addDiscourseCommentRow` mutation, store `addCommentRow`, toolbar "+ Comment row",
   muted-italic/blank rendering; delete-prune fixed so note rows survive unrelated
   deletions. Reuses the whole existing unit pipeline (label/indent/delete/diff/undo).
6. `c7d5c71` tests (comment-rows + Psalm-46 e2e + Acts order fix) + regenerated `guided-text.md`.

## Notes for follow-up
- No PR opened (user did not request one). If a PR is made + merged, this file can be removed.
- Live-browser screenshots not captured; rendering verified via e2e tests that
  assert the exact rendered data model + CSS classes.

## Checks
`npm run typecheck` · `npm run guided:check` · `npm test` · `npm run build` · `npm run guided:text:export`
