import { useEffect, useMemo, useState } from 'react';
import type { KrDocument, SermonAnchor } from '@/domain/schema';
import type { DiagramMode, TreeOrientation } from '@/domain/layout';
import type { SvgHighlights } from '@/domain/render';
import {
  documentNaturalSize,
  downloadDocumentPng,
  downloadDocumentSvg,
  downloadDocumentJson,
  printDocumentPdf,
} from '@/io';
import { useEditorStore } from '@/state';
import { nodeHighlightColors, relationHighlightColors } from '@/ui/sermon/highlights';
import { useContestedAffectedNodes } from '@/ui/contested';
import { getNode, getRelation, nodeText } from '@/domain/model';

/**
 * Human anchor label for a sermon note, resolved against the DOCUMENT BEING
 * EXPORTED (so labels match the printed diagram even in gloss mode, where a
 * glossed `doc` is passed rather than the source). Mirrors the anchor-label
 * logic in `ui/editor/modals/NoteModal.tsx`.
 */
function sermonAnchorLabel(doc: KrDocument, anchor: SermonAnchor): string {
  if (anchor.nodeId) {
    const n = getNode(doc.syntax, anchor.nodeId);
    return n ? nodeText(doc, n) || n.label || n.kind : 'word';
  }
  if (anchor.relationId) {
    const r = getRelation(doc.syntax, anchor.relationId);
    return r ? `relation (${r.type})` : 'relation';
  }
  if (anchor.verseRef) return anchor.verseRef;
  if (anchor.tokenIds && anchor.tokenIds.length > 0) {
    const byId = new Map(doc.tokens.map((t) => [t.id, t]));
    const surface = anchor.tokenIds
      .map((id) => byId.get(id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .sort((a, b) => a.index - b.index)
      .map((t) => t.surface)
      .join(' ');
    return surface || 'selection';
  }
  return 'passage';
}

/**
 * Export dialogue. The diagram is vector, so SVG exports at any size; PNG lets the
 * reader pick exact pixel dimensions (aspect-locked to the diagram). JSON is
 * offered as a secondary action. Export honours the active diagram `mode`, the
 * on-screen language (the glossed `doc`), AND any sermon highlights / contested
 * washes, so what you see is what you export. JSON falls back to `sourceDoc`
 * (the un-glossed model) so a data export still round-trips in the source
 * language.
 */
export function ExportModal({
  doc,
  sourceDoc,
  verticalScale,
  treeOrientation,
  rtl,
  colorMode,
  mode,
  onClose,
}: {
  doc: KrDocument;
  sourceDoc?: KrDocument;
  verticalScale: number;
  treeOrientation?: TreeOrientation;
  /** Effective right-to-left flag (RTL doc, unless the flip toggle un-mirrors it). */
  rtl?: boolean;
  /** Tint words by grammatical category — the on-screen grammar-colour toggle. */
  colorMode?: boolean;
  mode: DiagramMode;
  onClose: () => void;
}) {
  const jsonDoc = sourceDoc ?? doc;
  // Carry the on-screen options so the export matches the canvas exactly.
  const opts = { verticalScale, treeOrientation, rtl, colorMode };
  // Sermon highlights + the amber contested wash, as plain id → colour lookups,
  // so exports paint the same swashes as the canvas (a sermon colour wins over
  // the contested wash, exactly as on screen).
  const sermonHighlights = useEditorStore((s) => s.sermon.highlights);
  const sermonNotes = useEditorStore((s) => s.sermon.notes);
  const contestedAffected = useContestedAffectedNodes();
  const highlights = useMemo<SvgHighlights | undefined>(() => {
    const nodeFills = nodeHighlightColors(sermonHighlights);
    for (const id of contestedAffected) {
      if (!nodeFills.has(id)) nodeFills.set(id, 'rgba(217,119,6,0.26)');
    }
    const relationFills = relationHighlightColors(sermonHighlights);
    return nodeFills.size || relationFills.size ? { nodeFills, relationFills } : undefined;
  }, [sermonHighlights, contestedAffected]);
  const natural = useMemo(
    () => documentNaturalSize(doc, opts, mode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc, verticalScale, treeOrientation, rtl, colorMode, mode],
  );
  const aspect = natural.height / natural.width;

  const [format, setFormat] = useState<'png' | 'svg' | 'pdf'>('png');
  // Default PNG to 2× the natural size — a crisp, print-friendly raster.
  const [width, setWidth] = useState(() => natural.width * 2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // PDF only: consolidate document + sermon-prep notes in a section below the
  // diagram. Defaults on so nothing is silently dropped from the printed page.
  const [includeNotes, setIncludeNotes] = useState(true);
  const height = Math.round(width * aspect);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setW = (v: number) => setWidth(Math.max(16, Math.min(20000, Math.round(v || 0))));

  // Document notes + sermon-prep notes, resolved to a human anchor label
  // against `doc` (the exported document — glossed, if gloss mode is active —
  // so labels match what's on the printed diagram). Consolidated at the
  // bottom of the PDF page by `buildPrintableSvgHtml`.
  const exportNotes = useMemo(() => {
    const list: { label: string; text: string }[] = [];
    if (doc.notes && doc.notes.trim()) {
      list.push({ label: 'Passage', text: doc.notes.trim() });
    }
    for (const n of sermonNotes) {
      const label = sermonAnchorLabel(doc, n.anchor);
      const titlePart = n.title ? `${n.title} ` : '';
      list.push({ label, text: `— ${n.category}: ${titlePart}${n.body}`.trim() });
    }
    return list;
  }, [doc, sermonNotes]);

  const doExport = async () => {
    setError(null);
    if (format === 'svg') {
      downloadDocumentSvg(doc, opts, mode, highlights);
      onClose();
      return;
    }
    if (format === 'pdf') {
      const ok = printDocumentPdf(doc, opts, mode, highlights, {
        title: doc.title,
        date: new Date().toLocaleDateString(),
        notes: includeNotes && exportNotes.length > 0 ? exportNotes : undefined,
      });
      if (ok) onClose();
      else setError('Couldn’t open the print dialog — allow pop-ups for this site and try again.');
      return;
    }
    setBusy(true);
    try {
      await downloadDocumentPng(doc, width / natural.width, opts, mode, highlights);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal export-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Export diagram"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Export diagram</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="export-formats" role="radiogroup" aria-label="Format">
          <button
            role="radio"
            aria-checked={format === 'png'}
            className={format === 'png' ? 'active' : ''}
            onClick={() => setFormat('png')}
          >
            PNG
            <small>raster image</small>
          </button>
          <button
            role="radio"
            aria-checked={format === 'svg'}
            className={format === 'svg' ? 'active' : ''}
            onClick={() => setFormat('svg')}
          >
            SVG
            <small>vector, any size</small>
          </button>
          <button
            role="radio"
            aria-checked={format === 'pdf'}
            className={format === 'pdf' ? 'active' : ''}
            onClick={() => setFormat('pdf')}
          >
            PDF / Print
            <small>print dialog</small>
          </button>
        </div>

        {format === 'png' ? (
          <div className="export-dims">
            <label>
              Width
              <input
                type="number"
                min={16}
                value={width}
                onChange={(e) => setW(Number(e.target.value))}
              />
              px
            </label>
            <span className="export-times">×</span>
            <label>
              Height
              <input
                type="number"
                min={16}
                value={height}
                onChange={(e) => setW(Number(e.target.value) / aspect)}
              />
              px
            </label>
            <div className="export-presets">
              {[1, 2, 4].map((m) => (
                <button key={m} onClick={() => setW(natural.width * m)}>
                  {m}×
                </button>
              ))}
            </div>
            <p className="export-hint">
              Natural size {natural.width} × {natural.height} px. Aspect ratio is locked.
            </p>
          </div>
        ) : format === 'svg' ? (
          <p className="export-hint">
            Scalable vector — sharp at any zoom or print size. ({natural.width} × {natural.height}{' '}
            px natural.)
          </p>
        ) : (
          <>
            <p className="export-hint">
              Your browser’s print dialog will open — choose “Save as PDF”. The page contains
              the current diagram exactly as shown (same mode, spacing, colours, and highlights).
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
              <span>Include notes</span>
            </label>
          </>
        )}

        {error && (
          <p className="export-hint" role="alert" style={{ color: 'var(--danger, #c0392b)' }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          <div className="export-secondary">
            <button className="link-btn" onClick={() => downloadDocumentJson(jsonDoc)}>
              JSON
            </button>
          </div>
          <div className="modal-buttons">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" onClick={doExport} disabled={busy}>
              {busy ? 'Exporting…' : `Export ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
