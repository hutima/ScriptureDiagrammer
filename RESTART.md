# RESTART — KR rendering clashes: Hebrews 2:8 / 2:10 / 4:12  (IN PROGRESS)

Branch: `claude/kr-rendering-clashes-7ic377`

## Task (from user)
Investigate clashes in the Kellogg-Reed rendering engine:
1. **Hebrews 2:8** — element clashes/overlaps in the rendered diagram.
2. **Hebrews 2:10** — missing baseline under ἀρχηγὸν ("archegon").
3. **Hebrews 4:12** — renders correctly but messy; evaluate whether the 5-way
   coordination can be shown more cleanly. If not, leave alone.

Fixes (if any) should land on this branch with tests; keep this file updated
so the work is resumable if the session dies.

## Current state (update on every milestone)
- [x] Branch checked out, clean tree at `ccfa8b3`.
- [x] **Repro**: repeatable script exists at `scratchpad/repro/render-heb.mts`
      (arg-less; renders all three passages; also `overlap-report` collision
      dump). Cached upstream XML at `scratchpad/repro/hebrews.xml`
      (nestle1904-lowfat `19-hebrews.xml`). Requires `npm ci` first.
      If scratchpad is gone on resume, re-fetch per "How to reproduce".
- [x] **Engine map**: done (see Findings for the anchors that matter).
- [x] Diagnosis per passage — recorded under Findings below.
- [x] **Fix Heb 2:8 landed** (`227a273`): packSlice drift-tracking — a packed
      complement no longer inherits a sibling's unsafe slide; ἀνυπότακτον now
      clears the ὑποτάξαι sub-baseline. Suite 2348 green, byte-identical for
      healthy docs. Regression test: subagent writing
      tests/heb-2-8-packing-regression.test.ts + SBLGNT fixture (must fail on
      pre-fix code); it commits (no push) when done.
- [x] **Fix Heb 4:12 landed** (pushed after `227a273`): per-join coordinator
      marks moved to the OPEN side of the fork bar (word fork + open predicate
      fork + compound predicate); single-on-bar and correlative throat
      treatments unchanged. All three main καὶ now clear of the fan arms.
      Overall stack/fan shape kept (deliberate; "leave alone" verdict for the
      shape itself). No regression test yet — consider adding one for doc 55.
- [ ] **Heb 2:10 open**: layout emits the ἀρχηγὸν baseline in BOTH editions
      (verified twice); halo-erasure theory weakened (user's own screenshot
      shows baselines surviving descenders). A subagent is driving the REAL
      app (vite dev + playwright, desktop + iPhone viewport) to capture doc
      22/241 and inspect the live DOM for the baseline element. Next session:
      check scratchpad/appshots/ or re-run that investigation.
- [ ] Final: full suite + typecheck green; push; summary; consider PR note
      that redeploy/PWA-cache-refresh is needed for users to see fixes.

## How to reproduce (for a fresh session)
- Passages come from the default **Nestle1904 Lowfat** GNT source; see
  `scripts/dump-passage-syntax.mts` (`npm run dump-syntax`) for how a book
  loads into `KrDocument`s, `scripts/fetch-gnt.mjs` for the upstream XML URL,
  and `scripts/render-samples.mts` for the `layoutDocument` → `layoutToSvg`
  invocation. Run scripts with `vite-node` like the existing npm scripts.
- Note: sentences span verses — render the document(s) *containing* 2:8, 2:10,
  4:12 and note the true verse range.
- Relevant tests for conventions: `tests/kr-packing.test.ts`,
  `tests/layout.regressions.test.ts`, `tests/kr-characterization.test.ts`,
  `tests/sblgnt-coordination-regression.test.ts`.

## Findings so far

### CRITICAL: use the SBLGNT edition, not Nestle1904
The app's default GNT is the **SBLGNT lowfat** edition — `src/io/gnt-sblgnt.ts`,
`lowfatToDocuments(xml, { …, sblgntDialect })`. `src/io/gnt.ts` (Nestle1904) is
legacy. The first repro pass used Nestle1904 and did NOT match the user's app
(user screenshot: Hebrews doc 19/241, main line `(subject) | ἀφῆκεν | οὐδὲν |
αὐτῷ` with **ἀνυπότακτον as a long rotated diagonal striking through the
ὑποτάξαι…πάντα sub-baseline**; Nestle render put ἀνυπότακτον on the baseline,
no clash). User confirmed the wrong portion had been loaded. Deployment is
current with main (Pages deploy of `c750c1d` succeeded 2026-07-08), so version
skew is ruled out — the difference is the edition. Repro is being redone
against SBLGNT; all diagnosis below must be (re)validated against it.

### Engine facts (from code map, edition-independent)
- `word.ts:302` — every head word gets its baseline unconditionally. The ONLY
  way an upright word shows text with no baseline is diagonal routing:
  `classify.ts:170-176 isDiagonalModifier` (gate: token POS ∈ DIAGONAL_POS at
  `classify.ts:85-94` — noun is NOT in it — and every child itself diagonal)
  → `diagonal.ts` draws slant text with no baseline. For Heb 2:10 ἀρχηγὸν:
  check its POS tag + child attachments in the SBLGNT doc.
- Solid line through text is by doctrine a bug to fix at source
  (`geometry.ts:319-321`); dashed-behind-word is fine (halo +
  `gapDashedLinesBehindWords`, `document.ts:105`).
- Renderer draws lines first, text after with a 3px white halo; word glyph
  baseline sits 6px above the diagram line; measure.ts models desc=4px. With
  real fonts (Gentium, deep descenders ρχηγ) the halo can ERASE a word's own
  baseline — possible contributor to 2:10 if the line does exist in SBLGNT too.
- Heb 4:12 (Nestle parse): 5-member predicate-nominative fork (Ζῶν head +
  4 conjuncts, incl. one clause member). Stack+fan is conventional; the defect
  was solid fan prongs passing THROUGH the rotated καὶ marks, because multiple
  coordinator marks sit in the 30px throat (`coordination.ts:235-242`,
  junction-slide exempts rotated marks at `coordination.ts:144-149`).
  Candidate fix: place multi-marks on the FAR side of the dashed bar
  (single-mark case already sits ON the bar and is fine). Re-verify vs SBLGNT.

### Repro artifacts (scratchpad, ephemeral)
`scratchpad/repro/render-heb.mts` (+ cached XML, SVG/PNG, overlap-report.txt,
heb-2-10-archegon.txt, heb-4-12-coordination.txt). Being regenerated for
SBLGNT. Needs `npm ci` before vite-node runs.

## Notes
- No PR requested. Delete this file when the work is finished/merged.
