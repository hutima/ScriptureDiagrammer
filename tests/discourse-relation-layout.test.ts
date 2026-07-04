import { describe, expect, it } from 'vitest';
import type { DiscourseRelation } from '@/domain/schema';
import {
  layoutDiscourseRelations,
  type LaidOutRelation,
  type RelationEndpointInput,
  type RelationLayoutOptions,
} from '@/domain/discourse/relationLayout';

/**
 * Minimal `DiscourseRelation` literal. The layout helper only reads
 * id/type/label/color, so we build the smallest object the type accepts and cast
 * — the schema carries many optional fields we don't need to exercise here.
 */
function rel(id: string, type?: DiscourseRelation['type'], extra: Partial<DiscourseRelation> = {}): DiscourseRelation {
  return {
    id,
    sourceUnitId: `${id}-s`,
    targetUnitId: `${id}-t`,
    type,
    provenance: { source: 'manual', confidence: 'medium' },
    ...extra,
  } as DiscourseRelation;
}

function ep(id: string, y1: number, y2: number, type?: DiscourseRelation['type']): RelationEndpointInput {
  return { relation: rel(id, type), y1, y2 };
}

const RIGHT: RelationLayoutOptions = { side: 'right', showLabels: true };

/** Overlap test on the [top, bottom] span (touching edges do not count). */
function spansOverlap(a: LaidOutRelation, b: LaidOutRelation): boolean {
  return a.top < b.bottom && a.bottom > b.top;
}

/** Normalize a result to a stable, order-independent shape for deep-equality. */
function normalize(rs: LaidOutRelation[]) {
  return [...rs]
    .sort((a, b) => a.relation.id.localeCompare(b.relation.id))
    .map((r) => ({
      id: r.relation.id,
      lane: r.lane,
      laneU: r.laneU,
      a1: r.a1,
      a2: r.a2,
      y1: r.y1,
      y2: r.y2,
      label: r.label,
      color: r.color,
      dashArray: r.dashArray,
      strokeWidth: r.strokeWidth,
    }));
}

describe('layoutDiscourseRelations — lane packing', () => {
  it('never shares a lane between relations with overlapping vertical spans', () => {
    // Two nested spans overlap → must occupy distinct lanes.
    const res = layoutDiscourseRelations(
      [ep('a', 0, 200), ep('b', 40, 120)],
      RIGHT,
    );
    const a = res.relations.find((r) => r.relation.id === 'a')!;
    const b = res.relations.find((r) => r.relation.id === 'b')!;
    expect(spansOverlap(a, b)).toBe(true);
    expect(a.lane).not.toBe(b.lane);
    expect(res.laneCount).toBe(2);
  });

  it('reuses a lane for non-overlapping (far apart) spans', () => {
    const res = layoutDiscourseRelations(
      [ep('a', 0, 40), ep('b', 200, 260)],
      RIGHT,
    );
    const a = res.relations.find((r) => r.relation.id === 'a')!;
    const b = res.relations.find((r) => r.relation.id === 'b')!;
    expect(spansOverlap(a, b)).toBe(false);
    expect(a.lane).toBe(0);
    expect(b.lane).toBe(0);
    expect(res.laneCount).toBe(1);
  });

  it('nested relations step outward into distinct lanes; an independent far arc reuses lane 0', () => {
    const res = layoutDiscourseRelations(
      [
        ep('outer', 0, 300),
        ep('mid', 40, 260),
        ep('inner', 80, 200),
        ep('far', 500, 560), // disjoint from all three → lane 0 again
      ],
      RIGHT,
    );
    const byId = new Map(res.relations.map((r) => [r.relation.id, r]));
    // inner is shortest → hugs the text (lane 0); nesting steps outward.
    expect(byId.get('inner')!.lane).toBe(0);
    expect(byId.get('mid')!.lane).toBe(1);
    expect(byId.get('outer')!.lane).toBe(2);
    // 'far' overlaps none of them, so first-fit puts it back on lane 0.
    expect(byId.get('far')!.lane).toBe(0);

    // No two lane-mates overlap.
    for (const x of res.relations) {
      for (const y of res.relations) {
        if (x.relation.id !== y.relation.id && x.lane === y.lane) {
          expect(spansOverlap(x, y)).toBe(false);
        }
      }
    }
  });

  it('laneU increases with lane index by exactly laneStep', () => {
    const res = layoutDiscourseRelations([ep('a', 0, 300), ep('b', 40, 260)], RIGHT);
    const a = res.relations.find((r) => r.relation.id === 'a')!;
    const b = res.relations.find((r) => r.relation.id === 'b')!;
    const [lo, hi] = a.lane < b.lane ? [a, b] : [b, a];
    expect(hi.laneU - lo.laneU).toBe(res.laneStep);
  });
});

describe('layoutDiscourseRelations — endpoint offsets', () => {
  it('nudges same-y source endpoints to distinct, symmetric, ±4-clamped offsets', () => {
    const res = layoutDiscourseRelations(
      [ep('a', 100, 300), ep('b', 100, 320), ep('c', 100, 340)],
      RIGHT,
    );
    const ys = res.relations.map((r) => ({ id: r.relation.id, y1: r.y1 }));
    const y1s = ys.map((x) => x.y1);
    // All distinct after nudging.
    expect(new Set(y1s).size).toBe(3);
    // Every nudge within ±4 of the original 100.
    for (const v of y1s) expect(Math.abs(v - 100)).toBeLessThanOrEqual(4);
    // Symmetric around the original: one stays at 100, the others straddle it.
    expect(y1s).toContain(100);
    expect(Math.min(...y1s)).toBeLessThan(100);
    expect(Math.max(...y1s)).toBeGreaterThan(100);
  });

  it('gives the SAME relation the SAME offset regardless of input order', () => {
    const inputs = [ep('a', 100, 300), ep('b', 100, 320), ep('c', 100, 340)];
    const forward = layoutDiscourseRelations(inputs, RIGHT);
    const reversed = layoutDiscourseRelations([...inputs].reverse(), RIGHT);
    const yOf = (res: ReturnType<typeof layoutDiscourseRelations>, id: string) =>
      res.relations.find((r) => r.relation.id === id)!.y1;
    for (const id of ['a', 'b', 'c']) {
      expect(yOf(forward, id)).toBe(yOf(reversed, id));
    }
  });

  it('respects explicit a1/a2 tips (including negative reach into the text)', () => {
    const res = layoutDiscourseRelations(
      [{ relation: rel('a'), y1: 0, y2: 100, a1: -12, a2: 4 }],
      { side: 'left', showLabels: false },
    );
    const a = res.relations[0]!;
    expect(a.a1).toBe(-12);
    expect(a.a2).toBe(4);
  });
});

describe('layoutDiscourseRelations — labels & gutter width', () => {
  it('shows label = relation.label || relationTypeLabel(type) when labels on', () => {
    const res = layoutDiscourseRelations(
      [
        { relation: rel('a', 'ground'), y1: 0, y2: 100 },
        { relation: rel('b', 'contrast', { label: 'but yet' }), y1: 0, y2: 120 },
        { relation: rel('c', undefined), y1: 0, y2: 140 }, // untyped, no label → ''
      ],
      RIGHT,
    );
    const byId = new Map(res.relations.map((r) => [r.relation.id, r]));
    expect(byId.get('a')!.label).toBe('ground');
    expect(byId.get('b')!.label).toBe('but yet');
    expect(byId.get('c')!.label).toBe('');
  });

  it('hidden labels are empty and never widen the gutter beyond the shown case', () => {
    const inputs = [ep('a', 0, 200, 'ground'), ep('b', 40, 120, 'contrast')];
    const shown = layoutDiscourseRelations(inputs, { side: 'right', showLabels: true });
    const hidden = layoutDiscourseRelations(inputs, { side: 'right', showLabels: false });
    for (const r of hidden.relations) expect(r.label).toBe('');
    expect(hidden.gutterWidth).toBeLessThanOrEqual(shown.gutterWidth);
    // Same lane assignment either way (labels don't change packing).
    expect(hidden.laneCount).toBe(shown.laneCount);
  });

  it('empty input → gutterWidth 0 and laneCount 0', () => {
    const res = layoutDiscourseRelations([], RIGHT);
    expect(res.gutterWidth).toBe(0);
    expect(res.laneCount).toBe(0);
    expect(res.relations).toEqual([]);
  });

  it('a single labelled relation reserves a modest gutter (~30–44px)', () => {
    const res = layoutDiscourseRelations([ep('a', 0, 100, 'ground')], RIGHT);
    expect(res.laneCount).toBe(1);
    expect(res.gutterWidth).toBeGreaterThanOrEqual(30);
    expect(res.gutterWidth).toBeLessThanOrEqual(44);
  });

  it('marks paired/structural relations dashed (dashArray set); others solid', () => {
    const res = layoutDiscourseRelations(
      [ep('a', 0, 100, 'chiasm'), ep('b', 200, 260, 'ground')],
      RIGHT,
    );
    const byId = new Map(res.relations.map((r) => [r.relation.id, r]));
    expect(byId.get('a')!.dashArray).toBe('5 3');
    expect(byId.get('b')!.dashArray).toBeUndefined();
  });

  it('defaults strokeWidth to 1.6 when no override is set', () => {
    const res = layoutDiscourseRelations([ep('a', 0, 100)], RIGHT);
    expect(res.relations[0]!.strokeWidth).toBe(1.6);
  });

  it('an explicit strokeDash override wins over the type default', () => {
    const res = layoutDiscourseRelations(
      [{ relation: rel('a', 'chiasm', { strokeDash: 'solid' }), y1: 0, y2: 100 }],
      RIGHT,
    );
    expect(res.relations[0]!.dashArray).toBeUndefined();
  });

  it('an explicit strokeWidth override resolves to the expected px value', () => {
    const res = layoutDiscourseRelations(
      [{ relation: rel('a', undefined, { strokeWidth: 'thick' }), y1: 0, y2: 100 }],
      RIGHT,
    );
    expect(res.relations[0]!.strokeWidth).toBe(3.4);
  });
});

describe('layoutDiscourseRelations — determinism', () => {
  it('produces identical results across input-order permutations', () => {
    const base = [
      ep('r1', 0, 300, 'ground'),
      ep('r2', 40, 260, 'contrast'),
      ep('r3', 80, 200, 'inference'),
      ep('r4', 500, 560),
      ep('r5', 100, 100.4), // rounds to the same y at both ends — degenerate but valid
    ];
    const forward = normalize(layoutDiscourseRelations(base, RIGHT).relations);
    const reversed = normalize(layoutDiscourseRelations([...base].reverse(), RIGHT).relations);
    const shuffled = normalize(
      layoutDiscourseRelations([base[2]!, base[0]!, base[4]!, base[1]!, base[3]!], RIGHT).relations,
    );
    expect(reversed).toEqual(forward);
    expect(shuffled).toEqual(forward);
  });
});

describe('layoutDiscourseRelations — dense fixture (~Colossians 1:15–18)', () => {
  // Eight overlapping/nested/shared-endpoint relations over a stack of eight
  // unit rows at y = 20, 60, 100, … 300. Values chosen to force nesting,
  // independent reuse, and shared endpoints.
  const Y = (row: number) => 20 + row * 40;
  const fixture: RelationEndpointInput[] = [
    ep('c1', Y(0), Y(7), 'inclusio'), // spans everything
    ep('c2', Y(1), Y(2), 'ground'),
    ep('c3', Y(1), Y(4), 'elaboration'), // shares source y with c2
    ep('c4', Y(2), Y(3), 'result'),
    ep('c5', Y(3), Y(6), 'parallel'),
    ep('c6', Y(4), Y(5), 'series'),
    ep('c7', Y(5), Y(6), 'inference'), // shares target y with c5
    ep('c8', Y(6), Y(7), 'contrast'),
  ];

  it('no two lane-mates have overlapping spans', () => {
    const res = layoutDiscourseRelations(fixture, RIGHT);
    for (const x of res.relations) {
      for (const y of res.relations) {
        if (x.relation.id < y.relation.id && x.lane === y.lane) {
          expect(spansOverlap(x, y)).toBe(false);
        }
      }
    }
  });

  it('shared-endpoint relations differ in their adjusted endpoint y', () => {
    const res = layoutDiscourseRelations(fixture, RIGHT);
    const byId = new Map(res.relations.map((r) => [r.relation.id, r]));
    // c2 & c3 both start at Y(1) → nudged apart.
    expect(byId.get('c2')!.y1).not.toBe(byId.get('c3')!.y1);
    // c5 & c7 both end at Y(6) → nudged apart.
    expect(byId.get('c5')!.y2).not.toBe(byId.get('c7')!.y2);
  });

  it('no two relations share BOTH the same lane and an overlapping run', () => {
    const res = layoutDiscourseRelations(fixture, RIGHT);
    const seen = new Set<string>();
    for (const r of res.relations) {
      // A (laneU, top, bottom) fingerprint; overlapping same-lane runs are the
      // failure we care about and are excluded by the packing invariant above.
      const key = `${r.laneU}`;
      // Multiple lanes reused is fine; we only assert same-lane runs are disjoint,
      // which the previous test already covers. Here just sanity-check laneU maps
      // one-to-one with lane.
      seen.add(`${r.lane}:${key}`);
    }
    // Each lane has exactly one laneU value.
    const laneToU = new Map<number, number>();
    for (const r of res.relations) {
      if (laneToU.has(r.lane)) expect(laneToU.get(r.lane)).toBe(r.laneU);
      else laneToU.set(r.lane, r.laneU);
    }
    expect(res.gutterWidth).toBeGreaterThan(0);
  });

  it('is order-independent on the dense fixture', () => {
    const a = normalize(layoutDiscourseRelations(fixture, RIGHT).relations);
    const b = normalize(layoutDiscourseRelations([...fixture].reverse(), RIGHT).relations);
    expect(b).toEqual(a);
  });
});
