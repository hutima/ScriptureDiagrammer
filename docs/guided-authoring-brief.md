# Grammar Highlights — guide authoring brief (for guide authors)

You are authoring ONE guide module for the "Grammar Highlights" feature: a
devotional, Bible-study walkthrough of a passage's **Greek syntax diagram** for
lay readers. Work in `/home/user/ScriptureDiagrammer`.

## Procedure

1. **Get REAL ids.** Run `npm run guided:dump -- <passageId> [more ids]` for the
   passage id(s) you are assigned. It prints every token (`id · index · surface
   · lemma · pos · morphology · gloss`), node, and relation. Author ONLY against
   these exact ids. **Never guess an id or a surface.**
2. **Read the template + schema.** `src/data/guides/hebrews-1.ts` is the exact
   shape to copy; `src/domain/schema/guided.ts` documents every field.
3. **Overwrite your stub file** at the path you are given, exporting
   `export const <name>: GrammarHighlightGuide = { … }` (import the type from
   `@/domain/schema`). Keep the export name and `id` exactly as assigned.
4. **Self-check surfaces.** After writing, re-run `npm run guided:dump` and
   confirm each term's `surface` matches its token's surface **character for
   character, accents included** — `guided:check` compares them exactly. Do NOT
   run `guided:check` yourself (it needs sibling guides that may not exist yet).

## Shape requirements

- `id`, `title` (e.g. `"Mark 5:25–34 — the woman who touched him"`),
  `reference`, `sourceId: 'macula-greek-sblgnt-lowfat'`, `bundledPassageIds`
  (list EVERY passage id you use), `defaultDiagramMode: 'kellogg-reed'`,
  `difficulty`, `summary` (1–2 sentence library blurb), `steps` (3–5),
  `greekTerms` (4–7).
- **Steps**: each needs a real `focus` (`nodeIds`/`relationIds`/`tokenIds` that
  exist in THAT step's passage) and a short devotional `body`. Optional:
  `implication` ("why it matters"), `caution`, `highlights` (emphasizedNodeIds
  etc.), `greekTermIds` (chips), `panZoom` (`{ fit: 'nodes', padding: 120 }` is
  a good default). Reference Greek terms inline as `[[termId]]` — every marker
  must be a term in `greekTerms`.
- **Terms**: `surface` copied EXACTLY from the dump; `tokenId` is that token's
  id; plus `transliteration`, `lemma` (from dump), `gloss`, `parsing`
  (human-readable, from the morphology, e.g. "aorist active imperative, 2nd
  singular"), `explanation`, and where apt `implication` / `caution`.
- **Multi-passage guides** (walking more than one sentence): set `passageId` on
  EVERY step to the sentence it is about; `bundledPassageIds` lists them all;
  `steps[0].passageId` is where the guide opens. Use at most 3–4 sentences —
  pick the ones that best show the grammar. **Single-passage guides: omit
  `passageId`.**

## Guardrails (non-negotiable — the app owner's rules)

- **Tone**: Bible-study / devotional / pastoral — warm, clear, for a layperson.
  Not academic. No seminary jargon in the body (hide detail in the term panel).
- **Affirm translations.** English Bibles are reliable; the guide shows WHY
  translators choose as they do. NEVER imply Greek is a secret code that
  overturns English translations.
- **Aspect caution (critical).** NEVER write "aorist = once-for-all" or
  "present = always continuous / always habitual". Say the action is *viewed* a
  certain way — aorist views it as a whole/simple, present as ongoing/in
  progress — and that **context** decides how much weight the tense carries.
- **Contested passages** get a `debateSummary`: `issue` + 2+ `views` (each a
  fair `label` + `summary`, optional `cautions`) + `grammarOpensQuestionHow`
  (how the grammar frames but does NOT settle the question). Grammar rarely
  settles a whole doctrine by itself — say so.
- **`confessionalFrame`** may state a confessional Reformed reading,
  but keep it a clearly-labelled SEPARATE note and represent other views fairly.

## Return

A 3-line summary: the file you wrote, the passage + key node/relation ids used,
and any theological point you want the reviewer to double-check.
