import { useEffect, useMemo, useRef } from 'react';
import { layoutForMode, type DiagramMode } from '@/domain/layout';
import type { GuidedStep } from '@/domain/schema';
import { glossDoc, docDirection } from '@/domain/model';
import { getGuidedDocument } from '@/fixtures/guided';
import { StaticDiagramFrame } from '@/ui/contested/StaticDiagramFrame';
import { guidedHighlightMaps, resolveFocusIds, focusBounds } from './focus';

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
 * `guidedHighlightMaps` helper the live canvas uses. Hebrew lays out RTL — EXCEPT
 * in the English display mode: once the words are glossed the reader no longer
 * knows the original language, so a Hebrew secondary diagram flips to LTR to read
 * naturally alongside the (also LTR) glossed text. Morphology is never glossed
 * (it always stays in the source language), so it keeps RTL for Hebrew.
 *
 * Like the main canvas's guided focus, the panel auto-scrolls ONCE per step
 * change so the step's secondary focus (or, absent one, its secondary
 * highlights) is centered in the visible area — never re-centering while the
 * reader drags/scrolls within the same step. There is no camera here (the
 * frame has no pan/zoom), so "jump" simply means setting the scroll offsets of
 * the frame's own scroll container.
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const baseDoc = useMemo(
    () => (step.secondaryPassageId ? getGuidedDocument(step.secondaryPassageId) : undefined),
    [step.secondaryPassageId],
  );
  // English display glosses the secondary words too (structure unchanged), except
  // Morphology which always stays in the source language.
  const glossed = glossMode && mode !== 'morphology';
  const doc = useMemo(
    () => (baseDoc && glossed ? glossDoc(baseDoc) : baseDoc),
    [baseDoc, glossed],
  );
  const rtl = !!baseDoc && docDirection(baseDoc) === 'rtl' && !glossed;
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

  // The SAME layout `StaticDiagramFrame` renders below (same doc/mode/rtl), so
  // this stays cheap and in lockstep with what's actually on screen.
  const layout = useMemo(
    () => (doc ? layoutForMode(mode, doc, doc.layoutHints, { rtl }) : null),
    [doc, mode, rtl],
  );

  // Which ids to center on: prefer the step's `secondaryFocus`; when a step
  // gives no focus (only diff-style `secondaryHighlights`), fall back to the
  // highlighted ids so the jump still lands somewhere sensible.
  const targetIds = useMemo(() => {
    if (!doc) return null;
    const sf = step.secondaryFocus;
    const hasFocus =
      !!sf &&
      (sf.nodeIds?.length ?? 0) + (sf.tokenIds?.length ?? 0) + (sf.relationIds?.length ?? 0) > 0;
    if (hasFocus) return resolveFocusIds(doc, { ...step, focus: sf ?? {} });
    const h = step.secondaryHighlights;
    const nodeIds = new Set<string>();
    const relationIds = new Set<string>();
    for (const id of h?.emphasizedNodeIds ?? []) nodeIds.add(id);
    for (const id of h?.addedNodeIds ?? []) nodeIds.add(id);
    for (const id of h?.changedNodeIds ?? []) nodeIds.add(id);
    for (const id of h?.removedNodeIds ?? []) nodeIds.add(id);
    for (const id of h?.relationIds ?? []) relationIds.add(id);
    if (!nodeIds.size && !relationIds.size) return null;
    return { nodeIds, relationIds };
  }, [doc, step]);

  // Jump the scroll container once per step change (tracked by a key, not a
  // dependency-array trick), so a resize-driven re-render never yanks the
  // reader back mid-look. If the panel isn't measurable yet (jsdom, or a
  // not-yet-laid-out frame) the key is left unset so a later render — once
  // real sizes exist — still gets its one jump.
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !layout) return;
    const key = `${step.id}|${step.secondaryPassageId ?? ''}|${glossed}|${rtl}`;
    if (lastKey.current === key) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return; // not yet measurable (e.g. jsdom) — try again later
    lastKey.current = key;
    if (!targetIds) return; // nothing to focus on; natural scroll position stands
    const b = focusBounds(layout, targetIds.nodeIds, targetIds.relationIds);
    if (!b) return;
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;
    el.scrollLeft = Math.max(0, cx - w / 2);
    el.scrollTop = Math.max(0, cy - h / 2);
  }, [step.id, step.secondaryPassageId, glossed, rtl, layout, targetIds]);

  if (!baseDoc || !doc || !maps) return null;
  const title = step.secondaryTitle ?? baseDoc.title;
  return (
    <div className="guided-stacked">
      <div className="guided-stacked-head">{title}</div>
      <StaticDiagramFrame
        ref={scrollRef}
        doc={doc}
        mode={mode}
        title=""
        highlightFills={maps}
        rtl={rtl}
      />
    </div>
  );
}
