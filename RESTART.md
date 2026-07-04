# Restart notes — session claude/matthew-layout-clash-fix-9cui9y

Branch: `claude/matthew-layout-clash-fix-9cui9y` (from origin/main @ d6fe456)

## Tasks
1. **Matthew 6:9-13 KR layout clash** — first phrase ("Our Father who art in
   heaven…") overlaps the second ("hallowed be thy name"): "heavens" (PP
   object hanging under "Father") is drawn on top of "hallowed be" on the
   second (coordinated) clause's baseline. Fix in `src/domain/layout/engine.ts`
   — sibling-clause clearance must use full subtree extents.
   STATUS: delegated to a background agent (repro test + general fix +
   regression test + full vitest run). Awaiting its report.
2. **Hide Acts 2:39 from Guided mode** — DONE (not yet committed).
   Approach: `hidden: true` flag (NOT deregistration — tests use this guide
   as the canonical stacked-guide subject via `getGuide`/`openGuide`).
   - `src/domain/schema/guided.ts`: optional `hidden` on GrammarHighlightGuideSchema
   - `src/data/guides/acts-2-39.ts`: `hidden: true` + comment
   - `src/data/grammarHighlights.ts`: new `visibleGrammarHighlightGuides` export
   - `src/ui/guided/GuidedPassagePicker.tsx` + `src/state/guided.ts` (enter():
     first guide) use the visible list
   - `tests/guided-ui.test.tsx` picker test now asserts hidden guides absent
   Verified: guided.test.ts + guided-ui + guided-stacked all 62 pass;
   `npm run guided:check` passes (19 guides validate).

## Progress log
- Branch created, RESTART.md added.
- Acts 2:39 hidden via `hidden` flag; guided tests green.
- Layout-clash fix agent launched (background).
