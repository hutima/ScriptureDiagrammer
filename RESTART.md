# Restart notes — session claude/matthew-layout-clash-fix-9cui9y

Branch: `claude/matthew-layout-clash-fix-9cui9y` (from origin/main @ d6fe456)

## Tasks
1. **Matthew 6:9-13 KR layout clash** — DONE (see commit on this branch).
   Root cause: in `src/domain/layout/kr/clause.ts` a floating/lead block's
   BASELINE was anchored at the clear level while its own modifier cascade
   descends `block.height` below it, dropping the cascade into the clause
   beneath. Two sites fixed:
   - `layoutClause` floating vocatives/interjections: lift each block by its
     `height` (and stack upward by `blockAscent`).
   - `layoutClauseSpine` lead-word stub (the Matt 6:9 path — Πάτερ ἡμῶν ὁ ἐν
     τοῖς οὐρανοῖς leads the petitions spine): raise the row by the deepest
     cascade (`leadDrop`); when the row carries a cascade the stub rides AT
     `leadY` (blocks draw their own baselines there) and runs under the WHOLE
     row so an overflowing block (ἐξ ἔργων, Rom 11:6) stays connected.
   Regression test: `tests/layout.vocative-cascade-clearance.test.ts`
   (word-overlap guard on `sblgnt_matthew_142`, Greek + gloss; failed with
   'ἁγιασθήτω × οὐρανοῖς' / 'hallowed be × heavens' pre-fix).
   One legit snapshot update: kr-characterization Romans 11:6 bounds
   (370x290→370x340 — the lead cascade now reserves real room).
   Verified: full `npx vitest run` 2294/2294 pass; tsc clean.
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
- Acts 2:39 hidden via `hidden` flag; guided tests green (pushed, 81e4261).
- Layout-clash agent died on session limit with no changes; fix done inline.
- Layout fix + regression test + snapshot committed; full suite green.
- Next: PR + merge (user requested).
