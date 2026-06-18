// CHANGELOG.md is bundled into the build at compile time via Vite's `?raw`
// suffix. In test (vitest) the raw import resolves to the file contents the
// same way it does in the dev/prod browser bundle.
import changelogContent from '../../CHANGELOG.md?raw';

/**
 * ChangelogViewer (POLISH-06).
 *
 * Renders the bundled CHANGELOG.md as preformatted text. Used inside
 * SidebarFooter when the user toggles "What's new" open.
 */
export function ChangelogViewer() {
  return (
    <pre className="text-xs font-normal text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-64 overflow-y-auto px-3 pb-3 print:hidden">
      {changelogContent || 'No changelog entries found.'}
    </pre>
  );
}
