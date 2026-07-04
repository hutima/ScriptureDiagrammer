import { DISCOURSE_UNIT_COLORS } from '@/domain/schema';
import type { DiscourseUnitColor } from '@/domain/schema';

/**
 * A row of the seven unit-color swatches (+ a "none" clear button). Shared by
 * the single-unit color-tag control (`DiscourseSidePanel`'s inspector), the
 * highlight-color picker, and the multi-select batch color control
 * (`DiscourseToolbar`) — `active` marks the currently selected color
 * (clicking it again clears, via `onClear`).
 */
export function SwatchRow({
  active,
  onPick,
  onClear,
  ariaPrefix,
}: {
  active: DiscourseUnitColor | undefined;
  onPick: (color: DiscourseUnitColor) => void;
  onClear?: () => void;
  ariaPrefix: string;
}) {
  return (
    <div className="discourse-swatch-row">
      {DISCOURSE_UNIT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`discourse-swatch swatch-${c}${active === c ? ' active' : ''}`}
          aria-label={`${ariaPrefix} ${c}`}
          aria-pressed={active === c}
          title={c}
          onClick={() => (active === c ? onClear?.() : onPick(c))}
        />
      ))}
      {onClear && (
        <button type="button" className="mini" onClick={onClear} aria-label={`Clear ${ariaPrefix.toLowerCase()}`}>
          ✕ none
        </button>
      )}
    </div>
  );
}
