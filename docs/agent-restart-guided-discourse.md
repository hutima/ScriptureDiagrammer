# Agent restart doc — guided/discourse/copy/Lowfat fixes

**Branch:** `claude/guided-discourse-syntax-fixes-g8hsod` (push target; never push elsewhere)
**Base commit (main):** `ef08809a4e652b0e40602079f2de33921a1db670`
**Latest commit:** `ef08809` — see git log

## Task list

| # | Task | Status |
|---|------|--------|
| A1 | Rename top "Grammar" mode button to guided-exploration wording | done (66e5ccd) |
| A2 | Three-dot menu: `Guide` → `How to Use` | done (66e5ccd) |
| A3 | Remove ellipses from three-dot menu items | done (66e5ccd) |
| A4 | Condense guided card summaries (~60–110 chars; John 1:1 example) | done (66e5ccd) |
| A5 | Greek word + gloss pair line-breaking in guided prose | done (66e5ccd) |
| B1 | Colossians 2:11–12 copy vs diagram (συνταφέντες apposition?) | done (5631a56) |
| B2 | Romans 9:6–13 intro: shorten drastically | done (5631a56) |
| B3 | Difficulty ordering + `topics?: string[]` tags on guides | done (5631a56) |
| C  | Lowfat 1 Cor 5:1 `ὥστε` missing (1904 + SBLGNT) + regression tests | done (95fe9f1) |
| D1 | Stacked diagram zoom (Matt 6:11 / Luke 11:3 step 3, secondary diagram) | in progress |
| D2 | Guided Next button sticky near lower-right | in progress |
| E  | Discourse-backed guided examples (Acts 2:39, Eph 2:12–19, Psalm 46 chiasm; suppress self-directed modal from guided) | todo |
| F  | Guided grammar term help (dashed underline + glossary popover) | todo |
| G  | (user, 2026-07-04) Matt 6:9 vocative cascade follow-up to #241: "the" slant under "heavens" still clashes with the dashed connector; extend the sub-baseline minimally so the connector joins clear of the modifier | done (see log) |

## Checks

Scripts (verified in package.json): `npm run typecheck`, `npm test`, `npm run build`, `npm run lint`,
`npm run guided:build`, `npm run guided:check`, `npm run guided:dump -- <id>`, `npm run dump-syntax -- …`.

Run per-section: typecheck + test. Before final PR: typecheck, test, build, lint.

## Files touched

(none yet)

## Known risks

- Commit `ef08809` (#241) hid Acts 2:39 from the guided library — Section E restores it as discourse-backed.
- Guides live in `src/data/guides/*.ts`; schema `src/domain/schema/guided.ts`; picker `src/ui/guided/GuidedPassagePicker.tsx`; state `src/state/guided.ts`.
- Do not fix Lowfat issues in the renderer; converter is `src/io/lowfat.ts`.

### Follow-up (logged, not blocking)

- **Col 2:11–12 base-tree oddity:** in `sblgnt_colossians_13`, "ἐν ᾧ καὶ συνηγέρθητε" is not attached as a modifier of βαπτισμῷ; instead βαπτισμῷ hangs as `apposition` DEPENDENT of the clause (r_s13_86), so it draws trailing the clause cascade. Guide copy now matches the diagram; the head/dependent direction inherited from SBLGNT Lowfat deserves a data/inference review as separate follow-up work.

## Next command for the next agent

```
git checkout claude/guided-discourse-syntax-fixes-g8hsod && git log --oneline -5
```

Then continue with the first `todo` section above.

## Notes / decisions

- Working directly on the designated branch (equals current main). Commit per section; every commit must keep the app mergeable.
