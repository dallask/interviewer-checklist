import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function StorageToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('storage-quota-warning', handler);
    return () => {
      window.removeEventListener('storage-quota-warning', handler);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg px-4 py-3 shadow-lg flex items-start gap-3 max-w-sm"
    >
      <p className="flex-1 text-[13px]">
        Storage is almost full. Export a YAML backup to free space.
      </p>
      <button
        type="button"
        aria-label="Dismiss storage warning"
        onClick={() => setVisible(false)}
        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
