import { useMemo, useState } from 'react';
import { useEditorStore } from '@/state';
import { glossDoc } from '@/domain/model';
import { DIAGRAM_MODES, type DiagramMode } from '@/domain/layout';
import { diffDocsForCompare } from '@/domain/contested';
import { StaticDiagramFrame } from '@/ui/contested/StaticDiagramFrame';
import { BlockOutlineFrame } from '@/ui/contested/BlockOutlineFrame';
import { useLinkedDiagramView } from '@/ui/contested/useLinkedDiagramView';

/**
 * EDIT-MODE PREVIEW TAB — the right panel's default tab while editing: a
 * read-only, always-current window into the SAME shared syntax graph through
 * another visualization (Kellogg-Reed by default), comparing the passage's
 * gold-standard BASE against the user's current edits.
 *
 * It is a lens, never a second model: it renders `baseDoc` vs `doc` from the
 * one store, has no document/source state of its own, persists nothing, and
 * never steals the main editor's selection. It only sees COMMITTED edits —
 * the Phrase/Block drag preview works on a candidate clone that never touches
 * `doc`, so hover previews can't flicker through here by construction.
 *
 * Diff colors here follow the task's preview convention — additions BLUE,
 * changes YELLOW, removals RED — scoped by `.edit-preview-tab` (the contested
 * comparison keeps its own app-wide convention).
 */
export function EditPreviewTab() {
  const baseDoc = useEditorStore((s) => s.baseDoc);
  const doc = useEditorStore((s) => s.doc);
  const glossMode = useEditorStore((s) => s.glossMode);
  const [mode, setMode] = useState<DiagramMode>('kellogg-reed');

  const gloss = glossMode && mode !== 'morphology';
  const diff = useMemo(
    () => (baseDoc ? diffDocsForCompare(baseDoc, doc) : null),
    [baseDoc, doc],
  );
  const baseShow = useMemo(
    () => (baseDoc ? (gloss ? glossDoc(baseDoc) : baseDoc) : null),
    [gloss, baseDoc],
  );
  const liveShow = useMemo(() => (gloss ? glossDoc(doc) : doc), [gloss, doc]);
  const { leftRef, rightRef, onLeftScroll, onRightScroll } = useLinkedDiagramView(true);

  if (!baseDoc || !baseShow) {
    return (
      <div className="edit-preview-tab">
        <p className="edit-preview-empty">
          No source base is available for this custom passage yet. Load a passage from a source
          (GNT / OT) to compare your edits against its original parse.
        </p>
      </div>
    );
  }

  const modes = DIAGRAM_MODES.filter((m) => m.id !== 'discourse');

  return (
    <div className="edit-preview-tab">
      <div className="edit-preview-bar">
        <span className="edit-preview-title">Preview edits</span>
        <label className="mode-select" title="Read-only preview visualization">
          <span className="sr-only">Preview visualization</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as DiagramMode)}>
            {modes.map((m) => (
              <option key={m.id} value={m.id} title={m.description}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="diff-legend edit-preview-legend" aria-label="Difference colors">
        <span className="diff-legend-item">
          <span className="diff-swatch added" /> added
        </span>
        <span className="diff-legend-item">
          <span className="diff-swatch changed" /> changed
        </span>
        <span className="diff-legend-item">
          <span className="diff-swatch removed" /> removed
        </span>
      </div>
      <div className="edit-preview-frames">
        {mode === 'phrase-block' ? (
          <>
            <BlockOutlineFrame
              ref={leftRef}
              baseDoc={baseShow}
              variantDoc={liveShow}
              role="base"
              diff={diff}
              title="Original parse"
              onScrollSync={onLeftScroll}
            />
            <BlockOutlineFrame
              ref={rightRef}
              baseDoc={baseShow}
              variantDoc={liveShow}
              role="variant"
              diff={diff}
              title="Your edits"
              onScrollSync={onRightScroll}
            />
          </>
        ) : (
          <>
            <StaticDiagramFrame
              ref={leftRef}
              doc={baseShow}
              mode={mode}
              diff={diff}
              title="Original parse"
              onScrollSync={onLeftScroll}
            />
            <StaticDiagramFrame
              ref={rightRef}
              doc={liveShow}
              mode={mode}
              diff={diff}
              title="Your edits"
              onScrollSync={onRightScroll}
            />
          </>
        )}
      </div>
    </div>
  );
}
