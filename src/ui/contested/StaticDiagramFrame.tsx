import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KrDocument, AlternateDiff } from '@/domain/schema';
import { layoutForMode, type DiagramMode } from '@/domain/layout';
import { measureText, BASE_FONT, SMALL_FONT } from '@/domain/layout/measure';
import { dashFor, toneColor } from '@/domain/render';
import { clamp, minZoomScale, maxZoomScale, wheelZoomFactor } from '@/ui/zoom';
import { highlightForElement, impactedNodeIds } from './diffHighlighting';

/**
 * A READ-ONLY diagram frame for one document and diagram mode. Used by the
 * side-by-side comparison and the guided-mode stacked secondary diagram: it
 * renders the same geometric primitives the main canvas draws (so the frames
 * match), with drag-to-pan and (opt-in via `zoomable`) cursor-anchored
 * wheel-zoom, but no selection or editing — just the picture, plus subtle
 * difference outlines from a diff.
 */
const INK = '#1f2933';

export const StaticDiagramFrame = forwardRef<
  HTMLDivElement,
  {
    doc: KrDocument;
    mode: DiagramMode;
    diff?: AlternateDiff | null;
    title: string;
    onScrollSync?: () => void;
    /**
     * Optional highlight swashes (guided-mode stacked diagram), painted behind
     * matching words / connector lines exactly like the live canvas does. When
     * absent, no swashes are drawn — so the contested comparison usage is
     * unchanged.
     */
    highlightFills?: { nodeFills: Map<string, string>; relationFills: Map<string, string> };
    /**
     * Right-to-left layout (Hebrew / Arabic). When omitted the layout engine
     * still derives RTL from the document's own direction, so leaving it unset
     * is identical to the previous behaviour.
     */
    rtl?: boolean;
    /**
     * Opt into wheel/trackpad scroll-to-zoom, anchored to the cursor — the
     * SAME feel as the interactive `DiagramCanvas` (shared `wheelZoomFactor`
     * math from `@/ui/zoom`), applied by scaling the SVG's own pixel size
     * (crisp vector scaling; the existing scroll container still handles
     * drag/scrollbar pan, so panning is untouched). Off by default so every
     * OTHER `StaticDiagramFrame` consumer (contested comparison, edit
     * preview, source compare) keeps its current plain-scroll behaviour; the
     * guided-mode stacked secondary diagram is the one caller that turns it
     * on. The wheel listener is bound directly to this frame's own scroll
     * element (non-passive, so it can `preventDefault`), so it only ever
     * hijacks the wheel while the cursor is over THIS diagram — normal page /
     * guide-text scrolling elsewhere is untouched.
     */
    zoomable?: boolean;
  }
>(function StaticDiagramFrame(
  { doc, mode, diff = null, title, onScrollSync, highlightFills, rtl, zoomable = false },
  ref,
) {
  const layout = useMemo(
    () => layoutForMode(mode, doc, doc.layoutHints, { rtl }),
    [doc, mode, rtl],
  );
  const greek = doc.language === 'grc';
  const hebrew = doc.language === 'hbo';
  const nodeFills = highlightFills?.nodeFills;
  const relationFills = highlightFills?.relationFills;

  // ---- wheel-to-zoom (opt-in; see `zoomable` doc comment above) ----------
  const innerRef = useRef<HTMLDivElement | null>(null);
  const setRefs = (node: HTMLDivElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  // A new document (new passage, or a mode switch) always starts unzoomed —
  // matching `DiagramCanvas`'s `resetZoom` on doc/mode change — so a guided
  // step never inherits a stray zoom level from whatever the previous step
  // (or a previous secondary passage) left behind.
  useEffect(() => {
    if (zoomable) setScale(1);
  }, [zoomable, doc.id, mode]);
  // Zoom toward the cursor: keep the content point under the pointer fixed by
  // adjusting scroll offsets right after the scale (and so the SVG's pixel
  // size) changes — a `useLayoutEffect` so it applies before paint, with no
  // visible jump.
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = innerRef.current;
    const pending = pendingScroll.current;
    if (!el || !pending) return;
    pendingScroll.current = null;
    el.scrollLeft = pending.left;
    el.scrollTop = pending.top;
  }, [scale]);
  useEffect(() => {
    if (!zoomable) return;
    const el = innerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const lo = minZoomScale(el.clientWidth, el.clientHeight, layout.width, layout.height);
      const hi = maxZoomScale(lo);
      const oldScale = scaleRef.current;
      const newScale = clamp(oldScale * wheelZoomFactor(e.deltaY), lo, hi);
      if (newScale === oldScale) return;
      // The content-space point currently under the cursor, so it stays put.
      const contentX = (el.scrollLeft + px) / oldScale;
      const contentY = (el.scrollTop + py) / oldScale;
      pendingScroll.current = {
        left: contentX * newScale - px,
        top: contentY * newScale - py,
      };
      setScale(newScale);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomable, layout.width, layout.height]);

  // Words impacted by the change, resolved AGAINST THIS FRAME'S document so the
  // base frame marks the OLD attachment and the variant frame marks the NEW one —
  // making it clear in both which clause attachment is changing.
  const impactedNodes = useMemo(() => impactedNodeIds(diff, doc), [diff, doc]);

  // Drag-to-pan (grab the diagram and pull), in addition to wheel / scrollbar.
  const drag = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    drag.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
    el.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const el = e.currentTarget;
    el.scrollLeft = drag.current.sl - (e.clientX - drag.current.x);
    el.scrollTop = drag.current.st - (e.clientY - drag.current.y);
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="vc-frame">
      {title && <div className="vc-frame-head">{title}</div>}
      <div
        className="vc-frame-scroll"
        ref={setRefs}
        onScroll={onScrollSync}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg
          className={`diagram-paper${hebrew ? ' hebrew' : ''}`}
          width={layout.width * scale}
          height={layout.height * scale}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label={`${title}: ${doc.text || doc.title}`}
        >
          {/* Draw structural lines/curves first, then every word on top, so a
              word's white halo masks ANY line crossing it — the same stable
              partition the live canvas and `layoutToSvg` use, so this static
              frame (the guided stacked diagram, the contested comparison)
              matches them instead of letting a later-emitted spine draw OVER
              the words. */}
          {[
            ...layout.elements.filter((e) => e.kind !== 'text'),
            ...layout.elements.filter((e) => e.kind === 'text'),
          ].map((el) => {
            const hi = highlightForElement(el, diff);
            const hiClass = hi ? ` vc-hi vc-hi-${hi}` : '';
            const relHl = el.relationId ? relationFills?.get(el.relationId) : undefined;
            if (el.kind === 'line') {
              const dash = dashFor(el.style);
              return (
                <g key={el.id}>
                  {relHl && (
                    <line
                      x1={el.x1}
                      y1={el.y1}
                      x2={el.x2}
                      y2={el.y2}
                      stroke={relHl}
                      strokeWidth={7}
                      strokeLinecap="round"
                      opacity={0.55}
                    />
                  )}
                  <line
                    className={`kr-line${hiClass}`}
                    x1={el.x1}
                    y1={el.y1}
                    x2={el.x2}
                    y2={el.y2}
                    stroke={el.color ?? INK}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    {...(dash ? { strokeDasharray: dash } : {})}
                  />
                </g>
              );
            }
            if (el.kind === 'curve') {
              const dash = dashFor(el.style);
              const d = `M ${el.x1} ${el.y1} Q ${el.cx} ${el.cy} ${el.x2} ${el.y2}`;
              const ang = Math.atan2(el.y2 - el.cy, el.x2 - el.cx);
              const s = 6;
              const head = el.arrow
                ? `M ${el.x2} ${el.y2} L ${el.x2 + s * Math.cos(ang + Math.PI - 0.4)} ${el.y2 + s * Math.sin(ang + Math.PI - 0.4)} L ${el.x2 + s * Math.cos(ang + Math.PI + 0.4)} ${el.y2 + s * Math.sin(ang + Math.PI + 0.4)} Z`
                : '';
              const color = el.color ?? INK;
              return (
                <g key={el.id}>
                  {relHl && (
                    <path d={d} fill="none" stroke={relHl} strokeWidth={7} strokeLinecap="round" opacity={0.55} />
                  )}
                  <path
                    className={`kr-line${hiClass}`}
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    {...(dash ? { strokeDasharray: dash } : {})}
                  />
                  {head && <path d={head} fill={color} stroke="none" />}
                </g>
              );
            }
            const fill = el.color ?? toneColor(el.tone) ?? (el.muted ? '#8a97a3' : INK);
            const size = el.small ? 13 : 18;
            const w = measureText(el.text, el.small ? SMALL_FONT : BASE_FONT);
            const bx = el.anchor === 'middle' ? el.x - w / 2 : el.anchor === 'end' ? el.x - w : el.x;
            // A word is marked if it's directly changed OR it's an endpoint of a
            // changed/added/removed relation in this frame's tree.
            const textHi = hi ?? (el.nodeId && impactedNodes.has(el.nodeId) ? 'changed' : null);
            // Guided-mode highlight swash: a soft fill behind the glyph, mirroring
            // the live canvas's `hlByNode` painting (drawn under any diff outline).
            const hlFill = el.nodeId ? nodeFills?.get(el.nodeId) : undefined;
            return (
              <g key={el.id}>
                {hlFill && (
                  <rect
                    x={bx - 3}
                    y={el.y - size * 0.72 - 1.5}
                    width={w + 6}
                    height={size * 0.95 + 3}
                    rx={3}
                    fill={hlFill}
                    {...(el.rotate ? { transform: `rotate(${el.rotate} ${el.x} ${el.y})` } : {})}
                  />
                )}
                {textHi && !el.rotate && (
                  <rect
                    className={`vc-hi-rect vc-hi-${textHi}`}
                    x={bx - 3}
                    y={el.y - size * 0.72 - 2}
                    width={w + 6}
                    height={size * 0.95 + 4}
                    rx={3}
                  />
                )}
                {/* Upright words carry the white halo (paint-order stroke) the
                    canvas and SVG export use, masking a line passing behind the
                    glyphs; a rotated word lies ALONG its own slant, where a halo
                    would erase the line under its tails. */}
                <text
                  className={`kr-text${greek ? '' : ''}`}
                  x={el.x}
                  y={el.y}
                  textAnchor={el.anchor}
                  fontSize={size}
                  fontStyle={el.italic ? 'italic' : undefined}
                  fill={fill}
                  {...(el.rotate
                    ? { transform: `rotate(${el.rotate} ${el.x} ${el.y})` }
                    : { stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke', strokeLinejoin: 'round' })}
                >
                  {el.text}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});
