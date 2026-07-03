import { useState } from 'react';
import { DiscourseSidePanel } from './DiscourseSidePanel';

/**
 * The discourse TOOLS column, mounted in the shell's right-panel slot — the
 * same position and collapse affordance as the syntax modes' `RightPanel`, so
 * the workspace reads identically across modes. Content is the
 * `DiscourseSidePanel` (action toolbar + unit / relation details).
 */
export function DiscourseRightPanel() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`panel right discourse-right${collapsed ? ' collapsed' : ''}`}>
      <div className="tabs">
        {!collapsed && <span className="discourse-right-title">Tools</span>}
        <button
          className="collapse-btn"
          aria-expanded={!collapsed}
          title={collapsed ? 'Show discourse tools' : 'Hide discourse tools'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </div>
      {!collapsed && (
        <div className="panel-body">
          <DiscourseSidePanel />
        </div>
      )}
    </aside>
  );
}
