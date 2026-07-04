import { describe, it, expect } from 'vitest';
import type { DiscourseRelation } from '@/domain/schema';
import {
  DISCOURSE_RELATION_PALETTE,
  isSafeHexColor,
  resolvedRelationColor,
  resolvedRelationDashArray,
  resolvedRelationStrokeWidth,
} from '@/domain/discourse';

/**
 * Style-resolution helpers backing the relation editor's custom color / dash /
 * width controls (follow-up to PR #227). Each helper has exactly ONE job so
 * the on-screen layer, the SVG/PDF export, and the editor's own swatch never
 * disagree about what a relation actually looks like.
 */

function rel(extra: Partial<DiscourseRelation> = {}): DiscourseRelation {
  return {
    id: 'r1',
    sourceUnitId: 's',
    targetUnitId: 't',
    provenance: { source: 'manual', confidence: 'medium' },
    ...extra,
  } as DiscourseRelation;
}

describe('isSafeHexColor', () => {
  it('accepts #rgb and #rrggbb', () => {
    expect(isSafeHexColor('#abc')).toBe(true);
    expect(isSafeHexColor('#AabbCC')).toBe(true);
  });
  it('rejects non-hex / malformed / missing values', () => {
    expect(isSafeHexColor('red')).toBe(false);
    expect(isSafeHexColor('#12')).toBe(false);
    expect(isSafeHexColor('#1234')).toBe(false);
    expect(isSafeHexColor('#gggggg')).toBe(false);
    expect(isSafeHexColor('')).toBe(false);
    expect(isSafeHexColor(undefined)).toBe(false);
  });
});

describe('resolvedRelationColor', () => {
  it('a valid customColor wins over a named color and the type default', () => {
    const r = rel({ customColor: '#123456', color: 'red', type: 'ground' });
    expect(resolvedRelationColor(r)).toBe('#123456');
  });

  it('an invalid customColor is ignored, falling through to the named color', () => {
    const r = rel({ customColor: 'not-a-color', color: 'red', type: 'ground' });
    expect(resolvedRelationColor(r)).toBe(DISCOURSE_RELATION_PALETTE.red);
  });

  it('a named color beats the type-derived default', () => {
    const withColor = rel({ color: 'blue', type: 'ground' });
    const withoutColor = rel({ type: 'ground' });
    expect(resolvedRelationColor(withColor)).toBe(DISCOURSE_RELATION_PALETTE.blue);
    expect(resolvedRelationColor(withColor)).not.toBe(resolvedRelationColor(withoutColor));
  });

  it('falls back to the type-derived default with no override at all', () => {
    const r = rel({ type: 'chiasm' });
    // The type default for chiasm is the "structure" blue, distinct from the
    // named red swatch — just confirm it resolves to SOME stable hex.
    expect(resolvedRelationColor(r)).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('resolvedRelationDashArray', () => {
  it('paired/structural types (chiasm, parallel, inclusio) default to dashed', () => {
    expect(resolvedRelationDashArray(rel({ type: 'chiasm' }))).toBe('5 3');
    expect(resolvedRelationDashArray(rel({ type: 'parallel' }))).toBe('5 3');
    expect(resolvedRelationDashArray(rel({ type: 'inclusio' }))).toBe('5 3');
  });

  it('other types default to solid (undefined dasharray)', () => {
    expect(resolvedRelationDashArray(rel({ type: 'ground' }))).toBeUndefined();
    expect(resolvedRelationDashArray(rel({ type: undefined }))).toBeUndefined();
  });

  it('an explicit "solid" override clears the dash even on a paired type', () => {
    expect(resolvedRelationDashArray(rel({ type: 'chiasm', strokeDash: 'solid' }))).toBeUndefined();
  });

  it('an explicit "dashed" override applies even on a non-paired type', () => {
    expect(resolvedRelationDashArray(rel({ type: 'ground', strokeDash: 'dashed' }))).toBe('5 3');
  });

  it('dotted and dash-dot resolve to their own patterns', () => {
    expect(resolvedRelationDashArray(rel({ strokeDash: 'dotted' }))).toBe('1.5 3');
    expect(resolvedRelationDashArray(rel({ strokeDash: 'dash-dot' }))).toBe('7 3 1.5 3');
  });

  it('"default" (explicit) behaves the same as absent', () => {
    expect(resolvedRelationDashArray(rel({ type: 'chiasm', strokeDash: 'default' }))).toBe('5 3');
    expect(resolvedRelationDashArray(rel({ type: 'ground', strokeDash: 'default' }))).toBeUndefined();
  });
});

describe('resolvedRelationStrokeWidth', () => {
  it('resolves each named option to its px value', () => {
    expect(resolvedRelationStrokeWidth(rel({ strokeWidth: 'thin' }))).toBe(1);
    expect(resolvedRelationStrokeWidth(rel({ strokeWidth: 'normal' }))).toBe(1.6);
    expect(resolvedRelationStrokeWidth(rel({ strokeWidth: 'medium' }))).toBe(2.4);
    expect(resolvedRelationStrokeWidth(rel({ strokeWidth: 'thick' }))).toBe(3.4);
  });

  it('defaults to 1.6 when absent or explicitly "default"', () => {
    expect(resolvedRelationStrokeWidth(rel())).toBe(1.6);
    expect(resolvedRelationStrokeWidth(rel({ strokeWidth: 'default' }))).toBe(1.6);
  });
});
