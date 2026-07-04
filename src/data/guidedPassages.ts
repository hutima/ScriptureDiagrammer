/**
 * The APPROVED Grammar-Highlights passage list — the ONLY passages the guided
 * bundle (`npm run guided:build`) extracts from the SBLGNT. Keep this list
 * curated; the whole SBLGNT is never bundled.
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
  // --- Core set --------------------------------------------------------------
  // Hebrews 1:1–4 — elegant theological compression; the Phase-1 fork case.
  { book: 'Hebrews', chapter: 1, verseFrom: 1, verseTo: 4 },
  // Mark 5:25–34 — the participle pile.
  { book: 'Mark', chapter: 5, verseFrom: 25, verseTo: 34 },
  // Matthew 28:19–20 — one main imperative, three participles.
  { book: 'Matthew', chapter: 28, verseFrom: 19, verseTo: 20 },
  // Matthew 6:11 ∥ Luke 11:3 — aorist δός vs present δίδου (aspect, cautiously).
  { book: 'Matthew', chapter: 6, verseFrom: 11, verseTo: 11 },
  { book: 'Luke', chapter: 11, verseFrom: 3, verseTo: 3 },
  // Matthew 6:9–13 — the Lord's Prayer: six petitions, every one a command
  // form (3rd-person imperatives, 2nd-person imperatives, one prohibition).
  { book: 'Matthew', chapter: 6, verseFrom: 9, verseTo: 13 },
  // 1 John 2:1 ∥ 1 John 3:6–9 — an act of sin vs a settled pattern.
  { book: '1 John', chapter: 2, verseFrom: 1, verseTo: 1 },
  { book: '1 John', chapter: 3, verseFrom: 6, verseTo: 9 },
  // 1 Peter 3:18–22 — grammar frames the debate, does not settle it.
  { book: '1 Peter', chapter: 3, verseFrom: 18, verseTo: 22 },
  // John 1:1 — anarthrous predicate nominative + word order (beginner on-ramp).
  { book: 'John', chapter: 1, verseFrom: 1, verseTo: 1 },
  // --- Contested / deeper set ------------------------------------------------
  // Acts 2:38 — repentance, baptism, forgiveness (εἰς ἄφεσιν).
  { book: 'Acts', chapter: 2, verseFrom: 38, verseTo: 38 },
  // Acts 2:39 — the covenant promise "to you and to your children" (stacked
  // beneath its Genesis 17:12 parallel below).
  { book: 'Acts', chapter: 2, verseFrom: 39, verseTo: 39 },
  // Romans 6:3–4 — baptism and union with Christ.
  { book: 'Romans', chapter: 6, verseFrom: 3, verseTo: 4 },
  // Colossians 2:11–12 — circumcision without hands, buried and raised with
  // Christ (the ἐν ᾧ antecedent: baptism vs Christ).
  { book: 'Colossians', chapter: 2, verseFrom: 11, verseTo: 12 },
  // Ephesians 1:3–14 — the one long sentence; election + repeated PPs.
  { book: 'Ephesians', chapter: 1, verseFrom: 3, verseTo: 14 },
  // Romans 8:28–30 — the ordo salutis "golden chain" of aorists.
  { book: 'Romans', chapter: 8, verseFrom: 28, verseTo: 30 },
  // Romans 9:5 — punctuation and the Christological doxology.
  { book: 'Romans', chapter: 9, verseFrom: 5, verseTo: 5 },
  // Romans 9:6–13 — the argument's opening move ("not as though…").
  { book: 'Romans', chapter: 9, verseFrom: 6, verseTo: 13 },
  // 1 Timothy 2:11–15 — grammar opens the debated questions.
  { book: '1 Timothy', chapter: 2, verseFrom: 11, verseTo: 15 },
  // Titus 2:13 — Granville-Sharp Christological grammar (with its real limits).
  { book: 'Titus', chapter: 2, verseFrom: 13, verseTo: 13 },
  // 2 Peter 1:1 — the same construction as Titus 2:13.
  { book: '2 Peter', chapter: 1, verseFrom: 1, verseTo: 1 },
];

/**
 * A Hebrew Old-Testament range for the guided bundle. These are extracted from
 * the WLC Lowfat source (macula-hebrew) into a SEPARATE bundle
 * (`src/fixtures/guided/grammar-highlights-wlc.json`) so a guide can stack an OT
 * parallel beneath its NT sentence (see a step's `secondaryPassageId`). The
 * `book` matches a name in `OT_BOOKS` (src/io/ot.ts).
 */
export interface GuidedHebrewPassageRange {
  /** OT book name exactly as in `OT_BOOKS` (src/io/ot.ts). */
  book: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
}

export const GUIDED_HEBREW_PASSAGES: GuidedHebrewPassageRange[] = [
  // Genesis 17:12 — the covenant sign given to Abraham "to you and to your
  // offspring throughout your generations" (parallel to Acts 2:39).
  { book: 'Genesis', chapter: 17, verseFrom: 12, verseTo: 12 },
];
