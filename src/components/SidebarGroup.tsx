import type { ReactNode } from 'react';

export interface SidebarGroupProps {
  groupId: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SidebarGroup({ label, isOpen, onToggle, children }: SidebarGroupProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="min-h-[44px] w-full flex items-center justify-between px-4 font-semibold text-base text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <span>{label}</span>
        <span
          className={`transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
