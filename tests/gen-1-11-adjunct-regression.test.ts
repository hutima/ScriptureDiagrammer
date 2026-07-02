import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { maculaHebrewToDocuments } from '@/io/macula-hebrew';
import { layoutDocument } from '@/domain/layout';
import type { LineElement } from '@/domain/layout';

/**
 * GEN 1:11 ADJUNCT-RAIL REGRESSION — "עַל־הָאָרֶץ" floated disconnected.
 *
 * The clause "תַּדְשֵׁא הָאָרֶץ דֶּשֶׁא עֵשֶׂב… וְעֵץ…" carries its direct object as
 * an OPEN coordination fork (דֶּשֶׁא / עֵשֶׂב / עֵץ fan out from a junction), so
 * the drawn baseline STOPS at the fork junction. The clause-level adjunct
 * עַל־הָאָרֶץ used to hang from the right-hand adjunct rail, whose carrier line
 * started past the fork's full width — a stub attached to nothing, leaving the
 * PP floating in space. With an open-fork baseline tail, the clause's word
 * adjuncts hang beneath the VERB instead (the ordinary verb-modifier cascade),
 * which keeps every slant attached to a drawn line.
 */

const doc = () =>
  maculaHebrewToDocuments(readFileSync('tests/fixtures-macula-hebrew-gen-1-11.xml', 'utf8'), {
    book: 'Genesis',
  })[0]!;

const isLine = (e: { kind: string }): e is LineElement => e.kind === 'line';

describe('Genesis 1:11 — clause adjunct עַל־הָאָרֶץ stays connected', () => {
  it('parses with the PP as a clause-level adjunct', () => {
    const d = doc();
    const al = d.tokens.find((t) => t.surface === 'עַל')!;
    const alNode = d.syntax.nodes.find((n) => n.tokenIds.includes(al.id))!;
    const rel = d.syntax.relations.find((r) => r.dependentId === alNode.id)!;
    expect(rel.type).toBe('adjunct');
    expect(d.syntax.nodes.find((n) => n.id === rel.headId)!.kind).toBe('clause');
  });

  it("the PP's slant is CONNECTED (through touching lines) to its verb's baseline", () => {
    const d = doc();
    const al = d.tokens.find((t) => t.surface === 'עַל')!;
    const alNode = d.syntax.nodes.find((n) => n.tokenIds.includes(al.id))!;
    const rel = d.syntax.relations.find((r) => r.dependentId === alNode.id)!;
    // The subject | predicate divider of the עַל-PP's own clause (tagged with
    // the SUBJECT relation) anchors the reachability check on the baseline.
    const subjRel = d.syntax.relations.find(
      (r) => r.headId === rel.headId && r.type === 'subject',
    )!;

    const layout = layoutDocument(d, d.layoutHints);
    const lines = layout.elements.filter(isLine);
    const slant = lines.find((l) => l.relationId === rel.id && l.role === 'slant');
    expect(slant).toBeDefined();
    const divider = lines.find((l) => l.relationId === subjRel.id && l.role === 'divider');
    expect(divider).toBeDefined();

    // Two segments touch when an endpoint of one lies on (or at an endpoint
    // of) the other. The slant must reach the divider transitively — the
    // pre-fix bug drew the slant on a rail STUB floating hundreds of px from
    // the baseline. The engine leaves deliberate ~2px micro-gaps beside the
    // divider (covered by stroke width), so the epsilon must clear those
    // while still failing on a real disconnect.
    const eps = 3;
    const onSegment = (x: number, y: number, l: LineElement): boolean => {
      const dx = l.x2 - l.x1;
      const dy = l.y2 - l.y1;
      const len2 = dx * dx + dy * dy;
      const t = len2 === 0 ? 0 : ((x - l.x1) * dx + (y - l.y1) * dy) / len2;
      const tc = Math.max(0, Math.min(1, t));
      const px = l.x1 + tc * dx;
      const py = l.y1 + tc * dy;
      return Math.hypot(px - x, py - y) <= eps;
    };
    // Proper crossing (the divider crosses the baseline mid-segment).
    const cross = (ox: number, oy: number, ax: number, ay: number, bx: number, by: number) =>
      (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
    const intersects = (a: LineElement, b: LineElement): boolean => {
      const d1 = cross(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
      const d2 = cross(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
      const d3 = cross(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
      const d4 = cross(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
      return d1 * d2 < 0 && d3 * d4 < 0;
    };
    const touches = (a: LineElement, b: LineElement): boolean =>
      onSegment(a.x1, a.y1, b) ||
      onSegment(a.x2, a.y2, b) ||
      onSegment(b.x1, b.y1, a) ||
      onSegment(b.x2, b.y2, a) ||
      intersects(a, b);

    const queue = [slant!];
    const seen = new Set<LineElement>(queue);
    let reached = false;
    while (queue.length && !reached) {
      const cur = queue.pop()!;
      if (cur === divider) {
        reached = true;
        break;
      }
      for (const l of lines) {
        if (!seen.has(l) && touches(cur, l)) {
          seen.add(l);
          queue.push(l);
        }
      }
    }
    expect(reached).toBe(true);
  });
});
