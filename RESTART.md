# RESTART — KR rendering clashes: Hebrews 2:8 / 2:10 / 4:12  (REOPENED: 2:10)

Branch: `claude/kr-rendering-clashes-7ic377`

PR #252 merged (squash f9a06a5); branch RESTARTED from main for a follow-up.
USER CONFIRMED 2:10 IS STILL BROKEN after the halo fix — new screenshot shows
the REAL defect: the MAIN-LINE segment between the subject block's drawn y=0
end (right after ἀρχηγὸν, at the σωτηρίας stem, x≈374) and the
subject|predicate divider before Ἔπρεπεν (x≈560) is NEVER EMITTED — a hollow
y=0 strip over the τῆς σωτηρίας αὐτῶν cascade (the Col 1:13 class; see
drawnZeroEnd machinery clause.ts ~930-1024). Reproduced headlessly in
scratchpad/repro/heb-2-10.png. The halo layering fix from #252 was real but
orthogonal. A subagent is fixing: bridge subject zero-end → divider, plus
fixture tests/fixtures-sblgnt-lowfat-heb-2-10.xml + regression test
(must fail pre-fix), full suite, commit on this branch. Then: push, PR, merge
(user standing instruction).

Everything below is the SHIPPED #252 record. Full suite green
(2355 tests / 133 files), typecheck clean, lint clean (one pre-existing
warning in an untouched test), production build succeeds.

Important context discovered on the way: the app's default GNT is the
**SBLGNT lowfat** edition (`src/io/gnt-sblgnt.ts`, `sblgntDialect`) —
`src/io/gnt.ts` (Nestle1904) is legacy. Diagnose against SBLGNT.

## What shipped (commits on this branch)
1. `227a273` **Heb 2:8** (doc 19/241) — packSlice drift-tracking: a packed
   baseline complement no longer inherits a sibling's slide that is unsafe for
   its own deeper footprint (reclaim treats a pre-existing clash as
   grandfathered and can only tighten, never repair). The rotated ἀνυπότακτον
   diagonal under αὐτῷ was drawn through the ἐν τῷ ὑποτάξαι sub-baseline and
   the word πάντα; it now lands clear. Healthy documents are byte-identical
   (reclaim is translation-covariant).
2. `75a177b` **Heb 4:12** (doc 55/241) — per-join coordinator marks ride the
   OPEN side of a fork's dashed bar (word fork, open predicate fork, compound
   predicate): with 3+ members the fan arms sweep the whole throat, so throat
   marks are guaranteed strikes (all three καὶ were crossed). Single-on-bar
   and correlative treatments unchanged. The 5-member stack/fan shape itself
   is the convention and was deliberately left alone.
3. `bc75cef` + `5fc27d6` regression tests for both, each verified to FAIL on
   the pre-fix code (fixtures: tests/fixtures-sblgnt-lowfat-heb-{2-8,4-12}.xml).
4. (final commit) **Heb 2:10** — the baseline under ἀρχηγὸν was always
   EMITTED (verified in layout output, SVG markup, and the live app DOM on
   desktop + iPhone viewports); what erased it visually is the word's white
   halo: with real Greek serifs (Gentium Plus ≈ 6.4px descender ink at
   font-size 18, past the 6px textRise) a descender row's halo bit through
   the 1.6px baseline stroke — worst case exactly ἀρχηγὸν (ρχηγ in a row),
   fatal on iOS WebKit. All three renderers (svg.ts serializer,
   DiagramCanvas, StaticDiagramFrame) now paint in layers: strokes → stroke-
   only halo underlays → solid baseline-role lines REPAINTED → glyph ink.
   Verified with injected Gentium: stroke band 100% continuous after (white
   notches up to 3.3px before). render.test.ts pins the layer order.

## Notes for follow-up
- A naive `textRise` 6→8 lift was tried and REVERTED: it churned 208
  characterization snapshots and broke layout.spine-through-words (glyph tops
  reached stem ends at −22). The layered repaint fixes the symptom without
  moving any geometry.
- Latent nicety not addressed: `measure.ts` models descent as 4px; real
  faces reach ~6.4px. Only matters if some future feature needs true ink
  extents.
- Users on the installed PWA may need a service-worker refresh before they
  see the fixes after the Pages deploy.
