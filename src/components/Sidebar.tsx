import { useAppStore } from '../store/app.js';
import { ActionsGroup } from './ActionsGroup.js';
import { DifficultyFilter } from './DifficultyFilter.js';
import { SearchGroup } from './SearchGroup.js';
import { SectionFilter } from './SectionFilter.js';
import { SidebarFooter } from './SidebarFooter.js';
import { SidebarGroup } from './SidebarGroup.js';

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const groupOpen = useAppStore((s) => s.groupOpen);
  const toggleGroup = useAppStore((s) => s.toggleGroup);

  return (
    <>
      {/* Backdrop — narrow viewports only; click to close */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        aria-label="Filters"
        className={`w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out motion-reduce:transition-none md:relative md:translate-x-0 fixed inset-y-0 left-0 z-50 print:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarGroup
          groupId="search"
          label="Search"
          isOpen={groupOpen.search ?? true}
          onToggle={() => toggleGroup('search')}
        >
          <SearchGroup />
        </SidebarGroup>

        <SidebarGroup
          groupId="difficulty"
          label="Difficulty"
          isOpen={groupOpen.difficulty ?? true}
          onToggle={() => toggleGroup('difficulty')}
        >
          <DifficultyFilter />
        </SidebarGroup>

        <SidebarGroup
          groupId="sections"
          label="Sections"
          isOpen={groupOpen.sections ?? true}
          onToggle={() => toggleGroup('sections')}
        >
          <SectionFilter />
        </SidebarGroup>

        <SidebarGroup
          groupId="actions"
          label="Actions"
          isOpen={groupOpen.actions ?? true}
          onToggle={() => toggleGroup('actions')}
        >
          <ActionsGroup />
        </SidebarGroup>

        <SidebarFooter />
      </aside>
    </>
  );
}
