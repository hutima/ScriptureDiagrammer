import {
  GrammarHighlightsRegistrySchema,
  type GrammarHighlightGuide,
  type GrammarHighlightsRegistry,
  type KrDocument,
} from '@/domain/schema';
import { getReadingById, applyAlternateReadingPreview } from '@/domain/contested';
import { hebrews1 } from './guides/hebrews-1';
import { john1 } from './guides/john-1-1';
import { mark5 } from './guides/mark-5-25-34';
import { matthew28 } from './guides/matthew-28-19-20';
import { lordsPrayerBread } from './guides/lords-prayer-bread';
import { lordsPrayerPetitions } from './guides/lords-prayer-petitions';
import { johnSin } from './guides/1-john-sin';
import { firstPeter3 } from './guides/1-peter-3-18-22';
import { acts2 } from './guides/acts-2-38';
import { acts239 } from './guides/acts-2-39';
import { romans6 } from './guides/romans-6-3-4';
import { colossians2 } from './guides/colossians-2-11-12';
import { romans8chain } from './guides/romans-8-28-30';
import { ephesians1 } from './guides/ephesians-1-3-14';
import { romans9doxology } from './guides/romans-9-5';
import { romans9election } from './guides/romans-9-6-13';
import { firstTimothy2 } from './guides/1-timothy-2-11-15';
import { titus2 } from './guides/titus-2-13';
import { secondPeter1 } from './guides/2-peter-1-1';
import { ephesians212 } from './guides/ephesians-2-12-19';
import { psalm46 } from './guides/psalm-46';

/**
 * GRAMMAR HIGHLIGHTS registry — the curated guided walkthroughs, assembled
 * from one module per guide under `src/data/guides/`.
 *
 * Authoring rules (see also the schema notes in `domain/schema/guided.ts`):
 * - Author against REAL ids only — dump them from the bundled passage with
 *   `npm run guided:dump -- <passageId>` (ids are identical to a live load);
 *   validate the whole registry with `npm run guided:check`.
 * - Tone: Bible-study/devotional. English translations are affirmed — a guide
 *   shows WHY translators make the choices they do; it never suggests Greek is
 *   a secret code that invalidates an English Bible.
 * - Aspect caution: never "aorist = once-for-all", never "present = always
 *   continuous". Say how the action is VIEWED; context sets the weight.
 * - Contested passages carry a `debateSummary` with FAIR summaries of the
 *   major readings; grammar opens and constrains the question, it rarely
 *   settles a doctrine by itself. A `confessionalFrame` (confessional Reformed
 *   where relevant) stays a clearly-separate, labelled note.
 * - Greek terms in step bodies are written as `[[termId]]` and resolved
 *   against `greekTerms`; details live in the term panel, not the step card.
 *
 * Order below is the STABLE manual order within a difficulty tier — core
 * grammar first, then the contested / deeper passages. The picker's actual
 * listing order (`visibleGrammarHighlightGuides`) additionally sorts by
 * `difficulty` (beginner → intermediate → advanced); this array's order is
 * only the tie-break within each tier.
 */
const guides: GrammarHighlightGuide[] = [
  // Core set — grammar first, gentle ramp.
  john1, // beginner on-ramp
  hebrews1,
  mark5,
  matthew28,
  lordsPrayerBread,
  lordsPrayerPetitions,
  johnSin,
  // Contested / deeper — grammar opens the question.
  firstPeter3,
  acts2,
  acts239,
  romans6,
  colossians2,
  romans8chain,
  ephesians1,
  romans9doxology,
  romans9election,
  firstTimothy2,
  titus2,
  secondPeter1,
  // Discourse-backed guides (kind: 'discourse') — hosted in the Discourse view.
  // (acts239 is registered above; it is now a discourse guide and un-hidden.)
  ephesians212,
  psalm46,
];

export const grammarHighlightsRegistry: GrammarHighlightsRegistry =
  GrammarHighlightsRegistrySchema.parse({ version: 1, guides });

export const grammarHighlightGuides: GrammarHighlightGuide[] = grammarHighlightsRegistry.guides;

/** Listing order: beginner → intermediate → advanced, gentlest ramp first. */
const DIFFICULTY_ORDER: Record<GrammarHighlightGuide['difficulty'], number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/**
 * The guides shown in the guided library picker (hidden guides excluded),
 * ordered by difficulty (beginner → intermediate → advanced). `Array#sort` is
 * spec-stable, so guides sharing a difficulty keep their existing relative
 * (manually curated) order from the `guides` list above.
 */
export const visibleGrammarHighlightGuides: GrammarHighlightGuide[] = grammarHighlightGuides
  .filter((g) => !g.hidden)
  .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

export function getGuide(id: string): GrammarHighlightGuide | undefined {
  return grammarHighlightGuides.find((g) => g.id === id);
}

/**
 * The document a guide DISPLAYS for `baseDoc` — normally the bundled base itself,
 * but a guide carrying `displayAlternateReadingId` teaches a specific construal by
 * applying that alternate reading (non-destructively, via the shared contested
 * helper) when the reading targets this passage. Pure: the base is never mutated,
 * and it is the ONE authority both the runtime (guided store) and the offline
 * validator (`guided:check`) use, so what the guide draws and what is validated
 * can never drift. A missing/mismatched reading id falls back to the base.
 */
export function guideDisplayDoc(guide: GrammarHighlightGuide, baseDoc: KrDocument): KrDocument {
  const readingId = guide.displayAlternateReadingId;
  if (!readingId) return baseDoc;
  const reading = getReadingById(readingId);
  if (!reading || reading.passageId !== baseDoc.id) return baseDoc;
  return applyAlternateReadingPreview(baseDoc, reading);
}
