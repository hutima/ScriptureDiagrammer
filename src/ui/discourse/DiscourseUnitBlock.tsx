import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { DiscourseRow } from '@/domain/discourse';
import { formatRange, MAX_USER_INDENT, MIN_USER_INDENT } from '@/domain/discourse';
import type { DiscourseToken, DiscourseUnit } from '@/domain/schema';
import type { DiscourseViewToggles } from '@/state';
import { highlightColor as categoryColor } from '@/ui/sermon/highlights';
import { DiscourseMarkerChip } from './DiscourseMarkerChip';

/** Horizontal pixels per indent level — matches the structural depth step. */
const INDENT_STEP_PX = 26;
const clampIndent = (n: number) => Math.max(MIN_USER_INDENT, Math.min(MAX_USER_INDENT, n));

type TextHighlight = NonNullable<DiscourseUnit['textHighlights']>[number];

/**
 * A translucent tint for a Study-scope highlight, from its sermon `category`
 * colour. Translucent so the text stays legible; muted (much fainter) in Edit
 * mode, where study highlights are secondary to the structural editing.
 */
function studyTint(category: string | undefined, muted: boolean): string {
  const hex = categoryColor((category ?? 'emphasis') as never);
  // 6-digit hex + 2-digit alpha; ~40% normally, ~13% when muted.
  return `${hex}${muted ? '22' : '66'}`;
}

/** Resolve the last highlight covering each token id (later ones win on overlap). */
function highlightsByToken(highlights: TextHighlight[]): Map<string, TextHighlight> {
  const byToken = new Map<string, TextHighlight>();
  for (const h of highlights) for (const tid of h.tokenIds) byToken.set(tid, h);
  return byToken;
}

/**
 * The class / inline style for a single token given the highlight covering it:
 *   - `scope:'study'` → the category colour as a translucent inline background
 *     (muted in Edit mode);
 *   - legacy / manual (`color`) → the existing `discourse-hl hl-<color>` class.
 * `scope:'relation'` is left neutral until Phase 5.
 */
function tokenHighlightStyle(
  h: TextHighlight | undefined,
  mutedStudy: boolean,
): { className?: string; style?: React.CSSProperties } {
  if (!h) return {};
  if (h.scope === 'study') {
    return {
      className: `discourse-hl discourse-hl-study${mutedStudy ? ' muted' : ''}`,
      style: { background: studyTint(h.category, mutedStudy) },
    };
  }
  if (h.color) return { className: `discourse-hl hl-${h.color}` };
  return {};
}

/**
 * Render a unit's tokens as per-token spans, tinting any token covered by a
 * highlight (later highlights in the array win on overlap). Study-scope
 * highlights paint in their category colour (muted in Edit mode). Real spaces
 * between tokens keep normal text flow.
 */
function renderTokensWithHighlights(
  tokens: DiscourseToken[],
  highlights: TextHighlight[],
  mutedStudy: boolean,
) {
  const byToken = highlightsByToken(highlights);
  return tokens.map((t, i) => {
    const { className, style } = tokenHighlightStyle(byToken.get(t.id), mutedStudy);
    return (
      <span key={t.id} className={className} style={style}>
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
  studyMode = false,
  studySelectionTokenIds,
  onStudySelect,
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
  /** Study mode: render tokens as drag/tap-selectable spans for highlighting. */
  studyMode?: boolean;
  /** The current Study token selection FOR THIS UNIT (empty when the selection
   *  lives on another unit). */
  studySelectionTokenIds?: string[];
  /** Replace the Study selection with `tokenIds` on this unit (drag = range,
   *  tap = toggle a single token in/out of the current same-unit selection). */
  onStudySelect?: (unitId: string, tokenIds: string[]) => void;
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

  // --- study-mode token selection (drag = range, tap = toggle) -------------------
  const studyParaRef = useRef<HTMLParagraphElement | null>(null);
  const [studyDragStart, setStudyDragStart] = useState<number | null>(null);
  const [studyDragEnd, setStudyDragEnd] = useState<number | null>(null);
  const studyMoved = useRef(false);
  const studySelSet = useMemo(
    () => new Set(studySelectionTokenIds ?? []),
    [studySelectionTokenIds],
  );

  const onStudyPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.stopPropagation();
      studyParaRef.current?.setPointerCapture?.(e.pointerId);
      studyMoved.current = false;
      setStudyDragStart(index);
      setStudyDragEnd(index);
    },
    [],
  );
  const onStudyPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (studyDragStart === null) return;
      const idx = tokenIndexAt(e.clientX, e.clientY);
      if (idx === null) return;
      if (idx !== studyDragStart) studyMoved.current = true;
      setStudyDragEnd(idx);
    },
    [studyDragStart, tokenIndexAt],
  );
  const onStudyPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (studyDragStart === null) return;
      studyParaRef.current?.releasePointerCapture?.(e.pointerId);
      const endIdx = studyDragEnd ?? studyDragStart;
      const lo = Math.min(studyDragStart, endIdx);
      const hi = Math.max(studyDragStart, endIdx);
      const dragged = studyMoved.current;
      setStudyDragStart(null);
      setStudyDragEnd(null);
      studyMoved.current = false;
      if (dragged) {
        // Drag → contiguous range REPLACES the selection (always on this unit).
        const ids = tokens.slice(lo, hi + 1).map((t) => t.id);
        if (ids.length) onStudySelect?.(unit.id, ids);
        return;
      }
      // Tap → toggle the single token in/out of the current same-unit selection.
      const tapped = tokens[lo]?.id;
      if (!tapped) return;
      const nextSet = new Set(studySelSet);
      if (nextSet.has(tapped)) nextSet.delete(tapped);
      else nextSet.add(tapped);
      const ids = tokens.filter((t) => nextSet.has(t.id)).map((t) => t.id);
      onStudySelect?.(unit.id, ids);
    },
    [studyDragStart, studyDragEnd, tokens, studySelSet, onStudySelect, unit.id],
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
      {/* Indent drag handle — a tall thin vertical line overlaid ABSOLUTELY at
          the unit's left edge (the old left arc gutter that used to bury it is
          gone). It sits between the unit border and the text with a wide
          invisible hit area, drawing a 2px accent line on hover/drag. Absolute
          so showing/hiding it between modes never shifts the text. Horizontal
          drag snaps userIndent; ← / → nudge when focused. */}
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
        />
      )}
      <div className="discourse-unit-head">
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

      {!isContainer &&
        (isEnglish || view.showSourceText) &&
        !splitPicking &&
        !highlightPicking &&
        !studyMode && (
          <p
            className={`discourse-text${isEnglish ? '' : ' greek'}${view.compact ? ' clamp' : ''}`}
            lang={isEnglish ? 'en' : 'grc'}
          >
            {unit.textHighlights?.length
              ? renderTokensWithHighlights(tokens, unit.textHighlights, editing)
              : tokens.map((t) => t.surface).join(' ')}
          </p>
        )}
      {!isContainer && studyMode && (isEnglish || view.showSourceText) && (
        <p
          ref={studyParaRef}
          className={`discourse-text${isEnglish ? '' : ' greek'} discourse-study-words${view.compact ? ' clamp' : ''}`}
          lang={isEnglish ? 'en' : 'grc'}
          onPointerMove={onStudyPointerMove}
          onPointerUp={onStudyPointerUp}
        >
          {(() => {
            const byToken = highlightsByToken(unit.textHighlights ?? []);
            return tokens.map((t, i) => {
              const lo =
                studyDragStart === null
                  ? null
                  : Math.min(studyDragStart, studyDragEnd ?? studyDragStart);
              const hi =
                studyDragStart === null
                  ? null
                  : Math.max(studyDragStart, studyDragEnd ?? studyDragStart);
              const inDrag = lo !== null && hi !== null && i >= lo && i <= hi;
              const pending = inDrag || studySelSet.has(t.id);
              // Study mode shows existing study highlights clearly (not muted).
              const { className: hlClass, style } = tokenHighlightStyle(byToken.get(t.id), false);
              return (
                <span
                  key={t.id}
                  data-token-id={t.id}
                  data-token-index={i}
                  className={`discourse-study-word${hlClass ? ` ${hlClass}` : ''}${pending ? ' selected' : ''}`}
                  style={style}
                  onPointerDown={(e) => onStudyPointerDown(e, i)}
                >
                  {t.surface}
                  {i < tokens.length - 1 ? ' ' : ''}
                </span>
              );
            });
          })()}
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

      {editing && view.showMarkers && markers.length > 0 && !splitPicking && !highlightPicking && (
        <div className="discourse-markers" aria-label="Discourse marker hints">
          {markers.map((m) => (
            <DiscourseMarkerChip key={m.id} marker={m} />
          ))}
        </div>
      )}
    </div>
  );
});
