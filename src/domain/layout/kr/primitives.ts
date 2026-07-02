import { LAYOUT } from '../constants';
import { measureText } from '../measure';
import type { SyntaxNode } from '@/domain/schema';
import type { DiagramElement, GrammarTone, LineElement, TextElement } from '../types';
import type { Block } from './types';

/**
 * GEOMETRIC PRIMITIVES of the Kellogg-Reed engine — element constructors,
 * block translation/measurement/mirroring, and the per-layout id allocator.
 */
export function translate(block: Block, dx: number, dy: number): DiagramElement[] {
  return block.elements.map((el) => {
    if (el.kind === 'line') {
      return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
    }
    if (el.kind === 'curve') {
      return {
        ...el,
        x1: el.x1 + dx, y1: el.y1 + dy,
        cx: el.cx + dx, cy: el.cy + dy,
        x2: el.x2 + dx, y2: el.y2 + dy,
      };
    }
    return { ...el, x: el.x + dx, y: el.y + dy };
  });
}

let uid = 0;
export const eid = () => `el_${uid++}`;
/** Reset the element-id counter — layoutDocument calls this once per layout
 *  so element ids are deterministic for a given document. */
export const resetEid = (): void => {
  uid = 0;
};

/**
 * Mirror primitives horizontally about `width/2` for a right-to-left diagram.
 * Positions flip (x → width − x) and slants reverse (rotation negated), but the
 * GLYPHS are NOT mirrored — a Hebrew word is already shaped right-to-left by the
 * text engine, so only the diagram's layout direction changes. Text anchors swap
 * start↔end so left/right-aligned labels stay on their intended side.
 */
export function mirrorX(elements: DiagramElement[], width: number): DiagramElement[] {
  return elements.map((el) => {
    if (el.kind === 'line') {
      return { ...el, x1: width - el.x1, x2: width - el.x2 };
    }
    if (el.kind === 'curve') {
      return { ...el, x1: width - el.x1, cx: width - el.cx, x2: width - el.x2 };
    }
    return {
      ...el,
      x: width - el.x,
      anchor: el.anchor === 'start' ? 'end' : el.anchor === 'end' ? 'start' : 'middle',
      rotate: el.rotate ? -el.rotate : el.rotate,
    };
  });
}

/** Axis-aligned bounding box of a set of primitives (line endpoints + text anchors). */
export function bounds(elements: DiagramElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  let seen = false;
  const see = (x: number, y: number) => {
    if (!seen) {
      minX = maxX = x;
      minY = maxY = y;
      seen = true;
      return;
    }
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const el of elements) {
    if (el.kind === 'line') {
      see(el.x1, el.y1);
      see(el.x2, el.y2);
    } else if (el.kind === 'curve') {
      see(el.x1, el.y1);
      see(el.cx, el.cy);
      see(el.x2, el.y2);
    } else {
      see(el.x, el.y);
    }
  }
  return { minX, minY, maxX, maxY };
}

export function emptyBlock(): Block {
  return { width: 0, height: 0, elements: [], wordLeft: 0, wordRight: 0 };
}

// --- a word and its modifiers -------------------------------------------------

export function impliedBlock(label: string): Block {
  const w = measureText(label) + LAYOUT.wordPadX * 2;
  return {
    width: w,
    height: 0,
    wordLeft: 0,
    wordRight: w,
    elements: [
      line(eid(), 0, 0, w, 0, 'solid', 'baseline'),
      {
        kind: 'text',
        id: eid(),
        x: w / 2,
        y: -LAYOUT.textRise,
        text: label,
        anchor: 'middle',
        italic: true,
        muted: true,
      },
    ],
  };
}

export function line(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: LineElement['style'],
  role: LineElement['role'],
  nodeId?: string,
  relationId?: string,
): LineElement {
  return { kind: 'line', id, x1, y1, x2, y2, style, role, nodeId, relationId };
}

export function wordText(
  id: string,
  x: number,
  y: number,
  text: string,
  anchor: TextElement['anchor'],
  node: SyntaxNode,
  tone?: GrammarTone,
): TextElement {
  return {
    kind: 'text',
    id,
    x,
    y,
    text,
    anchor,
    // An implied/elided element reads as a muted ITALIC label — the same
    // treatment `impliedBlock` gives the auto-generated placeholders.
    muted: node.implied,
    italic: node.implied,
    nodeId: node.id,
    tone,
  };
}

export function smallText(
  id: string,
  x: number,
  y: number,
  text: string,
  anchor: TextElement['anchor'],
  relationId?: string,
  nodeId?: string,
): TextElement {
  return { kind: 'text', id, x, y, text, anchor, small: true, italic: true, relationId, nodeId };
}
