# Discourse default demo + first-load guidance modal — implementation note

This note records the staged enhancement layered on top of PR196 (Discourse
mode) and the KJV/ASV/plaintext/PDF work in
`docs/discourse-english-and-pdf-plan.md`. It preserves the PR196 boundary:
Discourse keeps its own document model, store, persistence namespace, range
loader, canvas, edit model, and exports; it never mutates syntax `KrDocument`s
and is never routed through `layoutForMode`.

## What already existed (verified, not re-implemented)

The earlier plan (`discourse-english-and-pdf-plan.md`) and the recon confirmed
these were already present, tested, and correct — so this pass only verified
them:

- **KJV & ASV English-only Discourse sources** — `src/io/english-bible-remote.ts`
  (`english-kjv`, `english-asv`, on-demand fetch + in-memory promise cache, no
  Strong's/lemma/morphology/alignment) surfaced through `src/io/english-bible.ts`
  and the range selector. Failed fetches are not cached and surface a readable
  error. Tests: `english-bible-remote.test.ts`, `discourse-english-remote.test.ts`.
- **English Bible discourse build** — `src/domain/discourse/english.ts`.
- **Plaintext "New text" loader** — `src/domain/discourse/plaintext.ts`,
  `DiscoursePlaintextPicker`, store `loadPlainText`, "New text" LeftPanel tab.
  No LLM prompt, no syntax `KrDocument`. Test: `discourse-plaintext.test.ts`.
- **Syntax PDF/Print export** — `buildPrintableSvgHtml` / `printDocumentPdf`
  (`src/io/export.ts`) + the ExportModal PDF option, using the browser print
  dialog ("Save as PDF"). Test: `syntax-pdf-export.test.tsx`.

## What was newly added

1. **Default demo passage — Ephesians 2:12–19** (`src/state/discourse.ts`).
   Loaded through the NORMAL range pipeline (`loadDefaultDemo` sets the KJV /
   Ephesians / 2:12–19 / verse range and calls `loadRange`), never a static
   fixture, so it is fully editable and its edits persist like any document. The
   loaded doc is stamped `isDefaultDemo` (also re-stamped when a restored range
   matches the demo signature) which drives the "Remove demo" affordance.
2. **First-load guidance modal** (`src/ui/discourse/DiscourseFirstLoadModal.tsx`)
   — a real, focus-trapped dialog (Escape + backdrop dismiss, initial + return
   focus), with three actions: *Use demo passage* / *Start with my own passage* /
   *Dismiss*. Shown once on first Discourse entry; reopenable from the ⓘ button.
3. **Ordering orchestration** — `enterDiscourseMode` (replaces the raw
   `restoreLastRange` effect in `DiscourseCanvas`): restore any prior range,
   else on first-ever visit open the modal and WAIT (no demo loaded behind it),
   else (modal already dismissed, nothing loaded, demo not hidden) auto-load the
   demo. Deterministic; a loaded document short-circuits it so a mode round-trip
   never re-triggers the modal.
4. **Remove-demo + preferences** — `removeDefaultDemo` clears the visible doc,
   drops the demo's own edit patch, forgets the range pointer, and persists a
   hide flag. New persistence helpers in `src/persistence/discourse.ts`.

## What was hardened

- The discourse title meta previously mislabelled every non-OpenText/SBLGNT doc
  as "Nestle 1904" — it now shows a source-aware label (KJV / ASV / BSB / Your
  text) via `sourceMetaLabel`, so the English demo is labelled honestly.
- The ⓘ "About discourse mode" control was an inline toggle note; it now opens
  the real guidance modal (one guidance surface instead of two).

## KJV / ASV provenance & licence

Unchanged from `discourse-english-and-pdf-plan.md`: KJV from `aruljohn/Bible-kjv`
(per-book JSON; KJV text is public domain outside the UK), ASV from
`scrollmapper/bible_databases` (whole-Bible JSON, MIT-licensed repo; ASV 1901 is
public domain). Only a manifest + URL template + adapter ship in-repo; no Bible
text is bundled for these two. The demo defaults to **KJV** as the lowest-
friction English-only source (public domain, no original-language linking).

## Persistence — two SEPARATE preferences

Both live under a distinct `kr:discoursePref:` prefix, chosen so they are never
swept by the `kr:discourse:` edit-patch prefix scan in `clearAllDiscourseData`:

| Key | Meaning |
| --- | --- |
| `kr:discoursePref:firstLoadModalDismissed` | The guidance modal has been dismissed — do not auto-show it again. |
| `kr:discoursePref:hideDefaultDemo:ephesians-2-12-19` | The demo has been removed — do not auto-restore it again. |

Both are plain `localStorage`, so they survive refreshes, browser restarts, and
service-worker/PWA updates. Storage access is wrapped in try/catch and fails
safe (a read returns `false`), so the modal never blocks the app when storage is
unavailable.

### Why they are separate

Dismissing the modal is a *UI* preference ("stop showing me this dialog");
hiding the demo is a *content* preference ("stop bringing back this passage").
A user may dismiss the modal but keep the demo, or remove the demo but still
reopen the modal from the ⓘ button. Collapsing them into one flag would make one
action silently imply the other. They therefore never share a key, and the tests
assert each action touches only its own flag.

### Reset vs. remove

- **Reset** (`resetEdits`) discards the demo's edits, restoring the base text —
  it does NOT set the hide flag.
- **Remove** (`removeDefaultDemo`) clears the demo and sets the hide flag —
  it does NOT touch syntax state, sermon notes, or unrelated discourse patches.
- **Manual load** after hiding works (the ⓘ modal's *Use demo passage*, or a
  future "Load demo") and does NOT clear the hide flag; only an explicit
  "restore on startup" (`unhideDefaultDemo`) would.

## Sample chiasm overlay (Phase 6) — deliberately skipped

No seeded chiasm/annotations are baked into the demo. The base document is the
KJV passage text only; any structure (contrast, inclusio, chiasm) is authored by
the user with provenance `manual`. Baking an interpretation into the base would
make demo annotations indistinguishable from user-authored patches and present
one reading as authoritative — both explicitly disallowed. If a removable
demo-overlay system is added later, it can seed the A/B/C/C′/B′/A′ movement as
clearly-labelled sample material; until then only the passage text loads.

## Why Discourse stays separate from syntax diagrams

Discourse is a multi-verse interpretive *analysis layer*, not a rendering of a
sentence parse. It has its own `DiscourseDocument`, `useDiscourseStore`,
`kr:discourse:*` / `kr:discoursePref:*` persistence, range loader, canvas, and
exports. The demo and modal work touches only discourse state: loading, hiding,
or removing the demo never reads or writes the syntax passage, and mode switching
preserves the previously loaded syntax diagram and discourse document
independently. This keeps the free-word-order syntax model and the discourse
outline from leaking into each other.
