# Restart notes — session claude/ephesians-2-gospel-guide-uu7ymp

Branch: `claude/ephesians-2-gospel-guide-uu7ymp` (from origin/main @ 8877d8b)

NOTE: the previous RESTART.md content (matthew-layout-clash session, already
merged) is preserved in git history at 8877d8b; restore it (`git checkout
8877d8b -- RESTART.md`) during final cleanup so this PR carries no RESTART.md
diff.

## Task goal
Add a guided Grammar Highlights study for **Ephesians 2:8–10** as a gospel
presentation from an explicitly confessional Reformed perspective.
- Salvation by grace alone, through faith alone, in Christ alone, not from
  works, no boasting; good works as fruit/prepared path (v10).
- NO debateSummary, NO contested links, NO alternate readings.
- Tone: warm, pastoral, evangelistic, lay-accessible; affirm English
  translations; never "Greek unlocks hidden meaning".
- Careful on τοῦτο: "the whole saving reality… is not from ourselves but is
  God's gift" — do not overclaim faith as sole antecedent.

## Checklist
- [x] A. Added `{ book: 'Ephesians', chapter: 2, verseFrom: 8, verseTo: 10 }` to
      `src/data/guidedPassages.ts`; ran `npm run guided:build -- --all` (wrote
      60 Greek docs); dumped ids. Commit: "Add Ephesians 2 gospel passage range"
- [x] B. Authored `src/data/guides/ephesians-2-8-10.ts` (`ephesians2Gospel`,
      6 steps, 13 greekTerms, real ids, no debateSummary/contested/alternates).
- [x] C. Registered in `src/data/grammarHighlights.ts` after `ephesians1`.
      Bundle: SPLICED (see note) — committed bundle + Eph 2:8–10 manifest
      entry + 4 docs; purely additive diff. guided:check: all 22 guides pass.
      Commit: "Register Ephesians 2 gospel guide"

### Bundle splice note (IMPORTANT for future regens)
A fresh full `npm run guided:build` on current main DRIFTS from the committed
bundle (pre-existing, unrelated to this task):
- derived clause/relation ids renumber in sblgnt_1-timothy_17
  (cl_s17_13→cl_s17_14; guide-1-timothy-2-11-15 step-not-but would fail
  guided:check on a full regen — its ids need updating whenever the bundle is
  regenerated wholesale);
- sblgnt_acts_47 is no longer referenced (acts-2-39 guide is discourse-backed
  now) and would be dropped by a lean rebuild; kept as committed;
- grammar-highlights-wlc.json would go to 0 docs (Genesis 17:12 no longer
  referenced); restored to committed state.
This task therefore spliced ONLY the four new Ephesians docs + manifest entry
into the committed bundle (node one-off, JSON.stringify(out, null, 1) same as
the builder), leaving every previously committed byte unchanged.
- [ ] D. `npm run guided:check`, `npm run typecheck`, `npm test`. Commit:
      "Validate Ephesians 2 gospel study"
- [ ] E. Final theological/product review; `npm run build`; restore RESTART.md
      to prior state (see NOTE). Commit: "Finalize Ephesians 2 gospel guide"
- [ ] PR (only if mergeable).

## Files touched so far
- RESTART.md (this file)
- src/data/guidedPassages.ts (Eph 2:8–10 range)
- src/fixtures/guided/grammar-highlights-sblgnt.json (rebuilt, --all)

## Commands run
- npm ci
- npm run guided:build -- --all  → Eph 2:8–10 = sblgnt_ephesians_12..15
- npm run guided:dump -- sblgnt_ephesians_12 sblgnt_ephesians_13 sblgnt_ephesians_14 sblgnt_ephesians_15

## Discovered ids (Ephesians 2:8–10)
Four bundled docs (one per Greek sentence):
- **sblgnt_ephesians_12** (2:8a "τῇ γὰρ χάριτί ἐστε σεσῳσμένοι διὰ πίστεως")
  tokens: t_n49002008001 τῇ · t_n49002008002 γὰρ · t_n49002008003 χάριτί ·
  t_n49002008004 ἐστε · t_n49002008005 σεσῳσμένοι (perf pass ptc) ·
  t_n49002008006 διὰ · t_n49002008007 πίστεως
  nodes: w_s12_1 = predicate [ἐστε σεσῳσμένοι]; w_n49002008003 χάριτί
  (+art w_n49002008001); w_n49002008006 διὰ → w_n49002008007 πίστεως;
  w_n49002008002 γάρ; root cl_s12_0
  rels: r_s12_2 predicate; r_s12_3 det(τῇ); r_s12_4 adverbial χάριτί→pred;
  r_s12_5 prepObj(πίστεως); r_s12_6 adverbial διὰ→pred; r_s12_7 conj γάρ
- **sblgnt_ephesians_13** (2:8b "καὶ τοῦτο οὐκ ἐξ ὑμῶν θεοῦ τὸ δῶρον")
  tokens: t_n49002008008 καὶ · t_n49002008009 τοῦτο · t_n49002008010 οὐκ ·
  t_n49002008011 ἐξ · t_n49002008012 ὑμῶν · t_n49002008013 θεοῦ ·
  t_n49002008014 τὸ · t_n49002008015 δῶρον
  nodes: cl_s13_0 coord root; cl_s13_1 (τοῦτο οὐκ ἐξ ὑμῶν, impl pred
  impl_cl_s13_1, subj w_n49002008009); cl_s13_8 (θεοῦ τὸ δῶρον, impl pred
  impl_cl_s13_8, predNom w_n49002008015 + gen w_n49002008013 + det w_n49002008014)
  rels: r_s13_2 pred; r_s13_3 subject τοῦτο; r_s13_4 adv οὐκ; r_s13_5 prepObj ὑμῶν;
  r_s13_6 adv ἐξ; r_s13_7 conjunct cl_s13_1; r_s13_9 pred; r_s13_10 det;
  r_s13_11 genitive θεοῦ; r_s13_12 predNom δῶρον; r_s13_13 conjunct cl_s13_8;
  r_s13_14 adjunct καὶ
- **sblgnt_ephesians_14** (2:9 "οὐκ ἐξ ἔργων ἵνα μή τις καυχήσηται")
  tokens: t_n49002009001 οὐκ · t_n49002009002 ἐξ · t_n49002009003 ἔργων ·
  t_n49002009004 ἵνα · t_n49002009005 μή · t_n49002009006 τις ·
  t_n49002009007 καυχήσηται (aor mid subj 3sg)
  nodes: cl_s14_0 root (impl pred impl_cl_s14_0); w_n49002009001 οὐκ;
  w_n49002009002 ἐξ; w_n49002009003 ἔργων; w_n49002009004 ἵνα (node exists,
  unattached in rels? label on r_s14_9); cl_s14_5 purpose clause
  (w_n49002009007 καυχήσηται, w_n49002009006 τις, w_n49002009005 μή)
  rels: r_s14_1 pred; r_s14_2 adv οὐκ; r_s14_3 prepObj ἔργων; r_s14_4 adv ἐξ;
  r_s14_6 pred καυχήσηται; r_s14_7 adv μή; r_s14_8 subj τις;
  r_s14_9 adverbial ἵνα-clause
- **sblgnt_ephesians_15** (2:10 whole verse)
  tokens: t_n49002010001 αὐτοῦ · t_n49002010002 γάρ · t_n49002010003 ἐσμεν ·
  t_n49002010004 ποίημα · t_n49002010005 κτισθέντες (aor pass ptc) ·
  t_n49002010006 ἐν · t_n49002010007 Χριστῷ · t_n49002010008 Ἰησοῦ ·
  t_n49002010009 ἐπὶ · t_n49002010010 ἔργοις · t_n49002010011 ἀγαθοῖς ·
  t_n49002010012 οἷς · t_n49002010013 προητοίμασεν · t_n49002010014 ὁ ·
  t_n49002010015 θεὸς · t_n49002010016 ἵνα · t_n49002010017 ἐν ·
  t_n49002010018 αὐτοῖς · t_n49002010019 περιπατήσωμεν
  nodes: cl_s15_0 root (ἐσμεν w_n49002010003, predNom ποίημα w_n49002010004,
  gen αὐτοῦ w_n49002010001); cl_s15_4 ptc clause (κτισθέντες w_n49002010005,
  ἐν w_n49002010006 → Χριστῷ w_n49002010007 + appos Ἰησοῦ w_n49002010008,
  ἐπὶ w_n49002010009 → cl_s15_9); cl_s15_9 (προητοίμασεν w_n49002010013,
  obj οἷς w_n49002010012, subj θεὸς w_n49002010015 + det w_n49002010014,
  appos ἔργοις w_n49002010010 + adj ἀγαθοῖς w_n49002010011);
  cl_s15_14 ἵνα clause (περιπατήσωμεν w_n49002010019, ἐν w_n49002010017 →
  αὐτοῖς w_n49002010018)
  rels: r_s15_1 pred ἐσμεν; r_s15_2 gen αὐτοῦ; r_s15_3 predNom ποίημα;
  r_s15_5 pred κτισθέντες; r_s15_6 appos Ἰησοῦ; r_s15_7 prepObj Χριστῷ;
  r_s15_8 adv ἐν→κτισθέντες; r_s15_10 pred προητοίμασεν; r_s15_11 dirObj οἷς;
  r_s15_12 det ὁ; r_s15_13 subj θεὸς; r_s15_15 pred περιπατήσωμεν;
  r_s15_16 prepObj αὐτοῖς; r_s15_17 adv ἐν→περιπ.; r_s15_18 adv ἵνα-clause;
  r_s15_19 adj ἀγαθοῖς; r_s15_20 appos ἔργοις; r_s15_21 prepObj cl_s15_9→ἐπὶ;
  r_s15_22 adv ἐπὶ→κτισθέντες; r_s15_23 adv cl_s15_4→ἐσμεν; r_s15_24 conj γάρ

## guided:check rules (read scripts/check-guided-highlights.mts)
- term.surface must EXACTLY equal the token's surface (single token only)
- step focus/highlight ids validate against the STEP'S OWN passage
  (step.passageId, else guide's first bundled passage) → multi-passage guide
  steps MUST set passageId
- [[termId]] markers in body/implication/caution/devotionalFrame must resolve
- every step needs focus targets or panZoom.fit 'whole-diagram'

## Next step
Author src/data/guides/ephesians-2-8-10.ts (Section B), register (Section C),
lean `npm run guided:build`, then guided:check/typecheck/test (Section D).

## Known blockers
- none
