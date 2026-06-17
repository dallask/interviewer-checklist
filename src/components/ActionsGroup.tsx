import { useAppStore } from '../store/app.js';

export function ActionsGroup() {
  const expandAll = useAppStore((s) => s.expandAll);
  const collapseAll = useAppStore((s) => s.collapseAll);
  const hideMarked = useAppStore((s) => s.hideMarked);
  const setHideMarked = useAppStore((s) => s.setHideMarked);
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={expandAll}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Expand all
      </button>
      <button
        type="button"
        onClick={collapseAll}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Collapse all
      </button>
      <button
        type="button"
        aria-pressed={false}
        onClick={() => setHideMarked(!hideMarked)}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Hide marked topics
      </button>
      <button
        type="button"
        aria-pressed={darkMode}
        onClick={() => setDarkMode(!darkMode)}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        {darkMode ? 'Light mode' : 'Dark mode'}
      </button>
    </div>
  );
}
