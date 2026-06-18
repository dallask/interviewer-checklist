import { useRef } from 'react';
import { useAppStore } from '../store/app.js';
import { ActionsGroup } from './ActionsGroup.js';
import { CandidateModal } from './CandidateModal.js';
import { DifficultyFilter } from './DifficultyFilter.js';
import { SearchGroup } from './SearchGroup.js';
import { SectionFilter } from './SectionFilter.js';
import { SidebarFooter } from './SidebarFooter.js';
import { SidebarGroup } from './SidebarGroup.js';
import { SidebarHeader } from './SidebarHeader.js';

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const groupOpen = useAppStore((s) => s.groupOpen);
  const toggleGroup = useAppStore((s) => s.toggleGroup);

  const candidateDialogRef = useRef<HTMLDialogElement>(null);

  // Backdrop is owned by App.tsx (the layout shell) — see CR-03 (REVIEW.md):
  // rendering it here too caused two `fixed inset-0` overlays to stack,
  // doubling visible opacity and creating two click targets for the same
  // close action. Single backdrop now lives in App.tsx.
  return (
    <>
      <aside
        aria-label="Filters"
        className={`w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col transition-transform duration-200 ease-in-out motion-reduce:transition-none print:hidden
          fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:inset-auto md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}
      >
        <SidebarHeader
          onCandidateClick={() => candidateDialogRef.current?.showModal()}
        />
        <div className="flex-1 overflow-y-auto flex flex-col">
          <SidebarGroup
            groupId="search"
            label="Search"
            icon="🔍"
            isOpen={groupOpen.search ?? true}
            onToggle={() => toggleGroup('search')}
          >
            <SearchGroup />
          </SidebarGroup>

          <SidebarGroup
            groupId="difficulty"
            label="Difficulty"
            icon="🎯"
            isOpen={groupOpen.difficulty ?? true}
            onToggle={() => toggleGroup('difficulty')}
          >
            <DifficultyFilter />
          </SidebarGroup>

          <SidebarGroup
            groupId="sections"
            label="Sections"
            icon="📋"
            isOpen={groupOpen.sections ?? true}
            onToggle={() => toggleGroup('sections')}
          >
            <SectionFilter />
          </SidebarGroup>

          <SidebarGroup
            groupId="actions"
            label="Actions"
            icon="⚡"
            isOpen={groupOpen.actions ?? true}
            onToggle={() => toggleGroup('actions')}
          >
            <ActionsGroup />
          </SidebarGroup>
        </div>
        <SidebarFooter />
      </aside>
      <CandidateModal dialogRef={candidateDialogRef} />
    </>
  );
}
