/**
 * The APPROVED Grammar-Highlights passage list — the ONLY passages the guided
 * bundle (`npm run guided:build`) extracts from the SBLGNT. Keep this list
 * small and curated; the whole SBLGNT is never bundled.
 *
 * Adding a passage here is step 1 of authoring a guide:
 *   1. add the verse range below and run `npm run guided:build`;
 *   2. dump the REAL ids (`npm run dump-syntax -- 'sblgnt:<ref>'`);
 *   3. author the guide in `src/data/grammarHighlights.ts` against those ids;
 *   4. validate with `npm run guided:check`.
 */
export interface GuidedPassageRange {
  /** GNT book name exactly as in `GNT_BOOKS` (src/io/gnt.ts). */
  book: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
}

export const GUIDED_PASSAGES: GuidedPassageRange[] = [
  // Hebrews 1:1–4 — sample/testing guide (elegant theological compression);
  // also the Phase-1 KR fork-connection regression passage.
  { book: 'Hebrews', chapter: 1, verseFrom: 1, verseTo: 4 },
];
