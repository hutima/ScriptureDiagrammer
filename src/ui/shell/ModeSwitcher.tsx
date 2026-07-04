import type { AppMode } from '@/state/types';
import { useEditorStore } from '@/state';

const MODES: { id: AppMode; label: string; short: string }[] = [
  { id: 'explore', label: 'Explore', short: 'Explore' },
  { id: 'edit', label: 'Edit', short: 'Edit' },
  { id: 'sermon', label: 'Study', short: 'Study' },
];

/**
 * The three user-facing modes. Edit is desktop-first: it is hidden on small
 * screens unless the user has forced desktop mode (`canEdit`). Discourse mode
 * keeps all three modes available but *defaults* to Edit on entry (that default
 * lives in ResponsiveShell) because Discourse is manual-first.
 */
export function ModeSwitcher({ canEdit, locked = false }: { canEdit: boolean; locked?: boolean }) {
  const appMode = useEditorStore((s) => s.appMode);
  const setAppMode = useEditorStore((s) => s.setAppMode);
  const modes = MODES.filter((m) => m.id !== 'edit' || canEdit);
  return (
    <div className="mode-switcher" role="group" aria-label="App mode">
      {modes.map((m) => (
        <button
          key={m.id}
          className={appMode === m.id ? 'active' : ''}
          // Grammar Highlights locks the app to Explore while it is active —
          // reading, not editing, is the whole point of the guided walkthrough.
          disabled={locked && m.id !== appMode}
          onClick={() => setAppMode(m.id)}
          title={locked ? 'Locked to Explore during Grammar highlights' : m.label}
        >
          {m.short}
        </button>
      ))}
    </div>
  );
}
