# Guided-mode text review workflow (export → edit → reimport)

All reader-facing prose in the Grammar-Highlights guides (guided mode) can be
reviewed in one Markdown file and applied back onto the guide sources as a
drop-in replacement. The prose lives as string literals in the hand-written
modules under `src/data/guides/*.ts`; the round-trip tooling lives in
`scripts/lib/guided-text.mts` (shared core), `scripts/export-guided-text.mts`,
and `scripts/import-guided-text.mts`, with the guarantees locked by
`tests/guided-text.test.ts`.

## The three commands

```bash
# 1. Export every guide's text (~1,600 fields, all 22 guides) to ./guided-text.md
npm run guided:text:export

# 2. Preview what an edited file would change (writes nothing)
npm run guided:text:import -- guided-text.md --dry-run

# 3. Apply the edits onto src/data/guides/*.ts
npm run guided:text:import -- guided-text.md
```

The import rewrites **exactly the changed string literals** via the TypeScript
AST — ids, focus targets, verse refs, comments, and formatting are untouched,
so the git diff is only the edited prose.

## Editing rules (also printed in the export file's header)

- Edit ONLY the text between `<!-- @field <key> -->` and `<!-- @end -->`
  markers. Headings and `**labels**` are decoration, ignored on import.
- Never edit the marker lines — the key addresses the exact string in source.
- Re-wrap lines freely: whitespace is collapsed to single spaces on import.
- Keep `[[termId]]` markers intact (tappable Greek-term links); the import
  refuses an unknown term id.
- Deleting a whole block (markers included) leaves that field unchanged.
  Emptying a block is an error, never a deletion.
- Structural data (ids, focus targets, refs, colors, topics) is deliberately
  not exported — edit the guide modules directly for that.

## Built-in safety (nothing is written if any check fails)

1. Every key must exist in the current registry (a stale key → re-export).
2. No emptied blocks.
3. Every `[[termId]]` in new text must resolve within its guide.
4. The edited registry is re-validated against the Zod schema in memory.
5. Every changed path must resolve to a string literal in its module; after
   writing, each file is re-read to verify the new text landed.

## Prompt for a new Claude session

Paste something like this (attach or commit the edited file first):

> I've edited `guided-text.md` (the guided-mode text review file — see
> `docs/guided-text-review-workflow.md`). Apply my edits:
>
> 1. Run `npm run guided:text:import -- guided-text.md --dry-run` and show me
>    a summary of what will change.
> 2. Apply with `npm run guided:text:import -- guided-text.md`.
> 3. Validate: `npm run guided:check && npm run typecheck && npm run test`.
> 4. Regenerate the review file so the committed copy stays in sync:
>    `npm run guided:text:export`.
> 5. Commit the changed guide modules together with the regenerated
>    `guided-text.md`, and push.
>
> If the import reports unknown keys, the guide sources changed since my
> export — re-export, tell me, and don't guess at applying my edits.

Note: the committed `guided-text.md` at the repo root is a generated snapshot
for review convenience; the guide modules under `src/data/guides/` remain the
single source of truth. Regenerate the snapshot after any import (step 4) or
whenever guide sources change.
