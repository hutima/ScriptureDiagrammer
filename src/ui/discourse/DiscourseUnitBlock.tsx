import { memo, useCallback, useRef, useState } from 'react';
import type { DiscourseRow } from '@/domain/discourse';
import { formatRange, MAX_USER_INDENT, MIN_USER_INDENT } from '@/domain/discourse';
import type { DiscourseToken, DiscourseUnit } from '@/domain/schema';
import type { DiscourseViewToggles } from '@/state';
import { DiscourseMarkerChip } from './DiscourseMarkerChip';

/** Horizontal pixels per indent level — matches the structural depth step. */
const INDENT_STEP_PX = 26;
const clampIndent = (n: number) => Math.max(MIN_USER_INDENT, Math.min(MAX_USER_INDENT, n));

/**
 * Render a unit's tokens as per-token spans, marking any token covered by one
 * of `highlights` with `discourse-hl hl-<color>` (later highlights in the
 * array win on overlap). Real spaces between tokens keep normal text flow.
 */
function renderTokensWithHighlights(
  tokens: DiscourseToken[],
  highlights: NonNullable<DiscourseUnit['textHighlights']>,
) {
  const colorByToken = new Map<string, string>();
  for (const h of highlights) for (const tid of h.tokenIds) colorByToken.set(tid, h.color);
  return tokens.map((t, i) => {
    const color = colorByToken.get(t.id);
    return (
      <span key={t.id} className={color ? `discourse-hl hl-${color}` : undefined}>
        {t.surface}
        {i < tokens.length - 1 ? ' ' : ''}
      </span>
    );
  });
}

/**
 * One discourse unit row: ref label, unit label, Greek text (or gloss text),
 * marker chips, indentation by outline depth, and a collapse chevron for
 * container units. Memoized — whole-book documents render hundreds of rows.
 *
 * Edit-mode affordances are additive props: `splitPicking` renders the text as
 * clickable words (pick where the new unit starts), `relateTarget` highlights
 * the row as a valid relation target, `multiSelected` shows the wrap-group
 * selection. All of them are inert in Explore mode.
 */
export const DiscourseUnitBlock = memo(function DiscourseUnitBlock({
  row,
  view,
  isEnglish = false,
  selected,
  relationCount,
  registerEl,
  onSelect,
  onToggleCollapsed,
  multiSelected = false,
  splitPicking = false,
  relateTarget = false,
  onTokenSplit,
  editing = false,
  onSetIndent,
  highlightPicking = false,
  onAddHighlight,
  highlightColor,
}: {
  row: DiscourseRow;
  view: DiscourseViewToggles;
  /** English-only source (BSB/KJV/ASV): always show the English source text,
   *  no Greek font/lang, no gloss line. */
  isEnglish?: boolean;
  selected: boolean;
  /** Relations touching this unit (badge for accessibility / arc-free reading). */
  relationCount: number;
  registerEl: (unitId: string, el: HTMLElement | null) => void;
  onSelect: (unitId: string, opts: { shift: boolean }) => void;
  onToggleCollapsed?: (unitId: string, collapsed: boolean) => void;
  multiSelected?: boolean;
  splitPicking?: boolean;
  relateTarget?: boolean;
  onTokenSplit?: (unitId: string, tokenId: string) => void;
  /** Edit mode: show the horizontal indent drag handle. */
  editing?: boolean;
  /** Commit an absolute explicit indent for this unit (drag/keyboard). */
  onSetIndent?: (unitId: string, userIndent: number) => void;
  /** Word-level "drag to highlight" mode is active for this unit. */
  highlightPicking?: boolean;
  /** Commit a text highlight over the dragged/clicked token span. */
  onAddHighlight?: (unitId: string, tokenIds: string[]) => void;
  /** The color new highlights preview as while picking. */
  highlightColor?: string;
}) {
  const { unit, tokens, markers, hasChildren } = row;
  const refLabel = formatRange(unit.refStart, unit.refEnd);
  const isContainer = unit.tokenIds.length === 0;
  const gloss = tokens.map((t) => t.gloss ?? '').filter(Boolean).join(' ');

  const baseIndent = unit.userIndent ?? 0;
  // While dragging, preview the snapped indent locally and commit once on drop
  // (keeps undo history to one entry per drag).
  const [dragIndent, setDragIndent] = useState<number | null>(null);
  const drag = useRef<{ startX: number; startIndent: number } | null>(null);
  const shownIndent = dragIndent ?? baseIndent;

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onSetIndent) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { startX: e.clientX, startIndent: baseIndent };
      setDragIndent(baseIndent);
    },
    [onSetIndent, baseIndent],
  );
  const onHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    setDragIndent(clampIndent(drag.current.startIndent + Math.round(dx / INDENT_STEP_PX)));
  }, []);
  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      const final = dragIndent ?? drag.current.startIndent;
      drag.current = null;
      setDragIndent(null);
      if (final !== baseIndent) onSetIndent?.(unit.id, final);
    },
    [dragIndent, baseIndent, onSetIndent, unit.id],
  );
  const onHandleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onSetIndent) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        onSetIndent(unit.id, clampIndent(baseIndent + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        onSetIndent(unit.id, clampIndent(baseIndent - 1));
      }
    },
    [onSetIndent, unit.id, baseIndent],
  );

  // --- drag-to-highlight (word-level) --------------------------------------------
  const hlParaRef = useRef<HTMLParagraphElement | null>(null);
  const [hlDragStart, setHlDragStart] = useState<number | null>(null);
  const [hlDragEnd, setHlDragEnd] = useState<number | null>(null);

  const tokenIndexAt = useCallback((x: number, y: number): number | null => {
    const el = document.elementFromPoint?.(x, y) as HTMLElement | null;
    const span = el?.closest?.('[data-token-index]') as HTMLElement | null;
    const idx = span?.dataset.tokenIndex;
    return idx !== undefined ? Number(idx) : null;
  }, []);

  const onHlWordPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.stopPropagation();
      hlParaRef.current?.setPointerCapture?.(e.pointerId);
      setHlDragStart(index);
      setHlDragEnd(index);
    },
    [],
  );
  const onHlPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (hlDragStart === null) return;
      const idx = tokenIndexAt(e.clientX, e.clientY);
      if (idx !== null) setHlDragEnd(idx);
    },
    [hlDragStart, tokenIndexAt],
  );
  const onHlPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (hlDragStart === null) return;
      hlParaRef.current?.releasePointerCapture?.(e.pointerId);
      const endIdx = hlDragEnd ?? hlDragStart;
      const lo = Math.min(hlDragStart, endIdx);
      const hi = Math.max(hlDragStart, endIdx);
      setHlDragStart(null);
      setHlDragEnd(null);
      const ids = tokens.slice(lo, hi + 1).map((t) => t.id);
      if (ids.length) onAddHighlight?.(unit.id, ids);
    },
    [hlDragStart, hlDragEnd, tokens, onAddHighlight, unit.id],
  );

  return (
    <div
      ref={(el) => registerEl(unit.id, el)}
      className={[
        'discourse-unit',
        isContainer ? 'container' : 'leaf',
        selected ? 'selected' : '',
        multiSelected && !selected ? 'multi-selected' : '',
        relateTarget ? 'relate-target' : '',
        splitPicking ? 'split-picking' : '',
        highlightPicking ? 'highlight-picking' : '',
        view.compact ? 'compact' : '',
        unit.color ? `color-${unit.color}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ marginLeft: (unit.depth + shownIndent) * INDENT_STEP_PX }}
      role="listitem"
      aria-label={`${unit.label ? `${unit.label}, ` : ''}${unit.kind} ${refLabel}`}
      data-unit-id={unit.id}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(unit.id, { shift: e.shiftKey });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Plain selection only — the view-level handler owns edit shortcuts.
          if (e.currentTarget === e.target) {
            e.preventDefault();
            onSelect(unit.id, { shift: e.shiftKey });
          }
        }
      }}
    >
      <div className="discourse-unit-head">
        {/* Indent drag handle — INLINE in the row head (an absolutely
            positioned handle at the row's left edge sat under the arc gutter
            and was effectively invisible). Horizontal drag snaps userIndent;
            ← / → nudge when focused. */}
        {editing && onSetIndent && (
          <button
            type="button"
            className={`discourse-indent-handle${dragIndent !== null ? ' dragging' : ''}`}
            aria-label="Drag to set indent"
            title="Drag to indent (← / → to nudge)"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onKeyDown={onHandleKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            ⋮⋮
          </button>
        )}
        {hasChildren && onToggleCollapsed && (
          <button
            type="button"
            className="discourse-collapse"
            aria-expanded={!unit.collapsed}
            title={unit.collapsed ? 'Expand' : 'Collapse'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapsed(unit.id, !unit.collapsed);
            }}
          >
            {unit.collapsed ? '▸' : '▾'}
          </button>
        )}
        {refLabel && <span className="discourse-ref">{refLabel}</span>}
        {view.showLabels && unit.label && (
          <span className="discourse-label" title="Unit label (your analysis)">
            {unit.label}
          </span>
        )}
        {isContainer && !unit.label && (
          <span className="discourse-label muted">{unit.kind}</span>
        )}
        {relationCount > 0 && (
          <span
            className="discourse-relcount"
            title={`${relationCount} relation${relationCount === 1 ? '' : 's'} touch this unit — select it to list them`}
          >
            ⤳{relationCount}
          </span>
        )}
        {unit.notes && (
          <span className="discourse-notedot" title={unit.notes} aria-label="Has a note">
            ✎
          </span>
        )}
        {relateTarget && <span className="discourse-target-hint">← relate here</span>}
      </div>

      {!isContainer && (isEnglish || view.showSourceText) && !splitPicking && !highlightPicking && (
        <p
          className={`discourse-text${isEnglish ? '' : ' greek'}${view.compact ? ' clamp' : ''}`}
          lang={isEnglish ? 'en' : 'grc'}
        >
          {unit.textHighlights?.length
            ? renderTokensWithHighlights(tokens, unit.textHighlights)
            : tokens.map((t) => t.surface).join(' ')}
        </p>
      )}
      {!isContainer && splitPicking && (
        <p
          className={`discourse-text${isEnglish ? '' : ' greek'} discourse-split-words`}
          lang={isEnglish ? 'en' : 'grc'}
        >
          {tokens.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className="discourse-split-word"
              disabled={i === 0}
              title={
                i === 0
                  ? 'A unit cannot start empty — pick a later word'
                  : `Start the new unit at “${t.surface}” (${t.ref})`
              }
              onClick={(e) => {
                e.stopPropagation();
                onTokenSplit?.(unit.id, t.id);
              }}
            >
              {t.surface}
            </button>
          ))}
        </p>
      )}
      {!isContainer && highlightPicking && (
        <p
          ref={hlParaRef}
          className={`discourse-text${isEnglish ? '' : ' greek'} discourse-hl-words`}
          lang={isEnglish ? 'en' : 'grc'}
          onPointerMove={onHlPointerMove}
          onPointerUp={onHlPointerUp}
        >
          {tokens.map((t, i) => {
            const lo = hlDragStart === null ? null : Math.min(hlDragStart, hlDragEnd ?? hlDragStart);
            const hi = hlDragStart === null ? null : Math.max(hlDragStart, hlDragEnd ?? hlDragStart);
            const picking = lo !== null && hi !== null && i >= lo && i <= hi;
            return (
              <span
                key={t.id}
                data-token-id={t.id}
                data-token-index={i}
                className={`discourse-hl-word${picking ? ` picking${highlightColor ? ` picking-${highlightColor}` : ''}` : ''}`}
                onPointerDown={(e) => onHlWordPointerDown(e, i)}
              >
                {t.surface}
                {i < tokens.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </p>
      )}
      {!isContainer && view.showEnglish && gloss && !splitPicking && !highlightPicking && (
        <p className={`discourse-gloss${view.compact ? ' clamp' : ''}`}>{gloss}</p>
      )}

      {view.showMarkers && markers.length > 0 && !splitPicking && !highlightPicking && (
        <div className="discourse-markers" aria-label="Discourse marker hints">
          {markers.map((m) => (
            <DiscourseMarkerChip key={m.id} marker={m} />
          ))}
        </div>
      )}
    </div>
  );
});
