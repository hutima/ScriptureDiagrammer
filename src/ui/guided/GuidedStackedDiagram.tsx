import { useMemo } from 'react';
import type { DiagramMode } from '@/domain/layout';
import type { GuidedStep } from '@/domain/schema';
import { glossDoc, docDirection } from '@/domain/model';
import { getGuidedDocument } from '@/fixtures/guided';
import { StaticDiagramFrame } from '@/ui/contested/StaticDiagramFrame';
import { guidedHighlightMaps } from './focus';

/**
 * A SECONDARY, read-only diagram stacked beneath the main guided canvas — used
 * to lay a parallel passage (e.g. an Old-Testament covenant text) beside the
 * New-Testament sentence a guide is walking, so the reader can see the shared
 * shape at a glance.
 *
 * The secondary document is fetched from the guided bundle and rendered through
 * `StaticDiagramFrame`; it is NEVER loaded into the editor store, so the primary
 * (loaded) passage stays exactly where it is — this sidesteps the guided store's
 * `loadDocument(doc, { corpus: 'gnt' })` path (which is GNT-specific) and lets a
 * Hebrew parallel sit beneath a Greek primary with no coupling.
 *
 * Highlight swashes come from the step's `secondaryFocus` / `secondaryHighlights`
 * (the secondary passage's own real ids), resolved by the same pure
 * `guidedHighlightMaps` helper the live canvas uses. Hebrew lays out RTL. When
 * the guided display mode is English, the secondary words are glossed too, so
 * both stacked diagrams read in the same language.
 */
export function GuidedStackedDiagram({
  step,
  mode,
  glossMode,
}: {
  step: GuidedStep;
  mode: DiagramMode;
  glossMode: boolean;
}) {
  const baseDoc = useMemo(
    () => (step.secondaryPassageId ? getGuidedDocument(step.secondaryPassageId) : undefined),
    [step.secondaryPassageId],
  );
  // English display glosses the secondary words too (structure unchanged), except
  // Morphology which always stays in the source language.
  const doc = useMemo(
    () => (baseDoc && glossMode && mode !== 'morphology' ? glossDoc(baseDoc) : baseDoc),
    [baseDoc, glossMode, mode],
  );
  const maps = useMemo(
    () =>
      doc
        ? guidedHighlightMaps(doc, {
            ...step,
            focus: step.secondaryFocus ?? {},
            highlights: step.secondaryHighlights,
          })
        : null,
    [doc, step],
  );
  if (!baseDoc || !doc || !maps) return null;
  const rtl = docDirection(baseDoc) === 'rtl';
  const title = step.secondaryTitle ?? baseDoc.title;
  return (
    <div className="guided-stacked">
      <div className="guided-stacked-head">{title}</div>
      <StaticDiagramFrame doc={doc} mode={mode} title="" highlightFills={maps} rtl={rtl} />
    </div>
  );
}
