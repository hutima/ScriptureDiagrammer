import { KrDocumentSchema, type KrDocument } from '@/domain/schema';
import bundle from './grammar-highlights-sblgnt.json';

/**
 * The bundled Grammar-Highlights passages — ONLY the approved guided passages
 * (see `src/data/guidedPassages.ts` + `scripts/build-guided-highlights.mts`),
 * never the whole SBLGNT. Validated at module load so a malformed or
 * hand-edited bundle fails loudly in development and tests.
 *
 * Ids are identical to what the app mints when the same passage is loaded
 * from the normal SBLGNT source picker (the build script runs the same
 * Lowfat conversion), so guides authored against these ids also match the
 * live-loaded passage.
 */
const raw = bundle as {
  version: number;
  sourceId: string;
  manifest: { ref: string; book: string; passageIds: string[] }[];
  documents: unknown[];
};

export const guidedDocuments: KrDocument[] = raw.documents.map((d) => KrDocumentSchema.parse(d));

export const guidedManifest = raw.manifest;

export function getGuidedDocument(id: string): KrDocument | undefined {
  const found = guidedDocuments.find((d) => d.id === id);
  // Deep clone so loading into the editor never mutates the bundle.
  return found ? KrDocumentSchema.parse(JSON.parse(JSON.stringify(found))) : undefined;
}
