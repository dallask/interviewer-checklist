import type { ReactNode } from 'react';

export interface SidebarGroupProps {
  groupId: string;
  label: string;
  icon?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SidebarGroup({
  groupId,
  label,
  icon,
  isOpen,
  onToggle,
  children,
}: SidebarGroupProps) {
  const regionId = `sidebar-group-${groupId}`;
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={regionId}
        onClick={onToggle}
        className="min-h-[44px] w-full flex items-center justify-between px-4 font-semibold text-base text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <span className="flex items-center gap-2">
          {icon && <span aria-hidden="true">{icon}</span>}
          {label}
        </span>
        <span
          className={`transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      {isOpen && <div id={regionId} className="px-4 pb-3">{children}</div>}
    </div>
  );
}
