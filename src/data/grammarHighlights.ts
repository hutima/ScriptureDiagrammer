import {
  GrammarHighlightsRegistrySchema,
  type GrammarHighlightGuide,
  type GrammarHighlightsRegistry,
} from '@/domain/schema';
import { hebrews1 } from './guides/hebrews-1';
import { john1 } from './guides/john-1-1';
import { mark5 } from './guides/mark-5-25-34';
import { matthew28 } from './guides/matthew-28-19-20';
import { lordsPrayerBread } from './guides/lords-prayer-bread';
import { johnSin } from './guides/1-john-sin';
import { firstPeter3 } from './guides/1-peter-3-18-22';
import { acts2 } from './guides/acts-2-38';
import { romans6 } from './guides/romans-6-3-4';
import { ephesians1 } from './guides/ephesians-1-3-14';
import { romans9doxology } from './guides/romans-9-5';
import { romans9election } from './guides/romans-9-6-13';
import { firstTimothy2 } from './guides/1-timothy-2-11-15';
import { titus2 } from './guides/titus-2-13';
import { secondPeter1 } from './guides/2-peter-1-1';

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
 *   settles a doctrine by itself. A `confessionalFrame` (Reformed-Anglican
 *   where relevant) stays a clearly-separate, labelled note.
 * - Greek terms in step bodies are written as `[[termId]]` and resolved
 *   against `greekTerms`; details live in the term panel, not the step card.
 *
 * Order below is the reading order in the guided library: a gentle difficulty
 * ramp, core grammar first, then the contested / deeper passages.
 */
const guides: GrammarHighlightGuide[] = [
  // Core set — grammar first, gentle ramp.
  john1, // beginner on-ramp
  hebrews1,
  mark5,
  matthew28,
  lordsPrayerBread,
  johnSin,
  // Contested / deeper — grammar opens the question.
  firstPeter3,
  acts2,
  romans6,
  ephesians1,
  romans9doxology,
  romans9election,
  firstTimothy2,
  titus2,
  secondPeter1,
];

export const grammarHighlightsRegistry: GrammarHighlightsRegistry =
  GrammarHighlightsRegistrySchema.parse({ version: 1, guides });

export const grammarHighlightGuides: GrammarHighlightGuide[] = grammarHighlightsRegistry.guides;

export function getGuide(id: string): GrammarHighlightGuide | undefined {
  return grammarHighlightGuides.find((g) => g.id === id);
}
