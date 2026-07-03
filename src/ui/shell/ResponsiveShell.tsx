import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/state';
import { useViewport } from '@/ui/responsive';
import { TopBar } from '@/ui/components/TopBar';
import { DiagramCanvas } from '@/ui/components/DiagramCanvas';
import { DiscourseCanvas } from '@/ui/discourse/DiscourseCanvas';
import { LeftPanel } from '@/ui/panels/LeftPanel';
import { RightPanel } from '@/ui/panels/RightPanel';
import { DiscourseRightPanel } from '@/ui/discourse/DiscourseRightPanel';
import { EditorController } from '@/ui/editor/EditorController';
import { SermonPrepDrawer } from '@/ui/sermon/SermonPrepDrawer';
import { MobileSermonPrepSheet } from '@/ui/sermon/MobileSermonPrepSheet';
import { MobileAlternateReadingSheet } from '@/ui/contested/MobileAlternateReadingSheet';
import { DesktopAlternateReadingDrawer } from '@/ui/contested/DesktopAlternateReadingDrawer';

/**
 * Top-level responsive layout. ONE data model, three distinct experiences:
 *
 *  - Desktop/tablet: persistent left (sources) + center (diagram) + right drawer
 *    (reader info in Explore, sermon workspace in Sermon Prep). Edit overlays the
 *    center via the EditorController.
 *  - Mobile: full-bleed diagram, sources as a slide-over drawer, no persistent
 *    side/bottom panels; Sermon Prep is a light bottom sheet. Edit is hidden
 *    unless desktop mode is forced.
 */
export function ResponsiveShell() {
  const vp = useViewport();
  const appMode = useEditorStore((s) => s.appMode);
  const setAppMode = useEditorStore((s) => s.setAppMode);
  const leftCollapsed = useEditorStore((s) => s.leftCollapsed);
  const setLeftCollapsed = useEditorStore((s) => s.setLeftCollapsed);
  const setDiagramMode = useEditorStore((s) => s.setDiagramMode);
  const firstRun = useEditorStore((s) => s.firstRun);
  // Discourse mode swaps the whole center canvas for its own (separate
  // document model, separate store); switching back re-mounts the syntax
  // canvas over the UNTOUCHED syntax state — no reload happens either way.
  const discourseMode = useEditorStore((s) => s.diagramMode === 'discourse');

  // On a phone, lead with the most finger-friendly syntax lens, and keep the
  // sources drawer closed so the diagram gets the screen. One-time per mount —
  // except on a first-ever launch, where we deliberately reveal the passage
  // selector (restoreLastSession opens it) so it's obvious where to pick a text.
  const initedMobile = useRef(false);
  useEffect(() => {
    if (vp.isMobile && !initedMobile.current) {
      initedMobile.current = true;
      setDiagramMode('phrase-block');
      if (!firstRun) setLeftCollapsed(true);
    }
  }, [vp.isMobile, firstRun, setDiagramMode, setLeftCollapsed]);

  // Discourse is a desktop-only analysis layer: it is removed from the mode
  // selectors on mobile, and here we guarantee it can never be the ACTIVE mode
  // on a phone (e.g. after toggling force-desktop off, or a persisted mode from
  // a desktop session) — fall back to the finger-friendly block lens.
  useEffect(() => {
    if (vp.isMobile && discourseMode) setDiagramMode('phrase-block');
  }, [vp.isMobile, discourseMode, setDiagramMode]);

  // Discourse is manual-first: entering it makes **Edit** the default app mode
  // in place of Explore (Study is kept if already active). Discourse is
  // desktop-only, so Edit is always available here.
  useEffect(() => {
    if (discourseMode && appMode === 'explore' && vp.isDesktop) setAppMode('edit');
  }, [discourseMode, appMode, vp.isDesktop, setAppMode]);

  if (vp.isMobile) {
    return (
      // `sermon-open` adds scroll room at the bottom of the diagram so the
      // outline can clear the fixed Sermon-prep sheet instead of being covered.
      <div className={`app mobile${appMode === 'sermon' ? ' sermon-open' : ''}`}>
        <TopBar />
        <main className="mobile-main">
          {discourseMode ? <DiscourseCanvas /> : <DiagramCanvas />}
        </main>
        {!leftCollapsed && (
          <div className="left-drawer">
            <div className="drawer-backdrop" onClick={() => setLeftCollapsed(true)} />
            <LeftPanel />
          </div>
        )}
        {appMode === 'sermon' && (
          <MobileSermonPrepSheet onClose={() => useEditorStore.getState().setAppMode('explore')} />
        )}
        <MobileAlternateReadingSheet />
        <EditorController />
      </div>
    );
  }

  // Tablet & desktop: three-column workspace; right side depends on the mode.
  return (
    <div className={`app ${vp.effective}`}>
      <TopBar />
      <div className="workspace">
        <LeftPanel />
        <main className="panel" style={{ borderRight: 'none', background: 'var(--bg)' }}>
          {discourseMode ? <DiscourseCanvas /> : <DiagramCanvas />}
        </main>
        {appMode === 'sermon' ? (
          <aside className="panel right sermon-aside">
            <div className="panel-head">
              <span className="panel-head-title">Study</span>
            </div>
            <div className="panel-body">
              <SermonPrepDrawer />
            </div>
          </aside>
        ) : discourseMode ? (
          // Discourse gets its own tools/details column in the SAME right slot
          // (collapsible like the syntax RightPanel); the syntax right panel
          // stays hidden because it inspects the syntax passage.
          <DiscourseRightPanel />
        ) : (
          <RightPanel />
        )}
      </div>
      <DesktopAlternateReadingDrawer />
      <EditorController />
    </div>
  );
}
