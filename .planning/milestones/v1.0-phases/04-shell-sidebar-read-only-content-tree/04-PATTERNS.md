# Phase 4: Shell, Sidebar & Read-Only Content Tree — Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 15 new/modified files
**Analogs found:** 15 / 15 (all from Phase 1–3 codebase; no analog = RESEARCH.md patterns used)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/App.tsx` | component (shell) | request-response | `src/app/main.tsx` | role-match (entry wiring) |
| `src/app/main.tsx` | entry point | request-response | `src/app/main.tsx` (existing) | exact — additive edit only |
| `src/app/theme.ts` | utility (DOM) | event-driven | `src/storage/lifecycle.ts` | data-flow-match (event/lifecycle) |
| `src/app/styles.css` | config (CSS) | — | none in codebase | no analog — RESEARCH.md pattern |
| `src/store/app.ts` | store | event-driven | `src/storage/adapter.ts` | data-flow-match (stateful class → Zustand module) |
| `src/components/Sidebar.tsx` | component | request-response | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/SidebarGroup.tsx` | component | request-response | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/SearchGroup.tsx` | component | event-driven | `src/storage/adapter.ts` (debounce) | data-flow-match |
| `src/components/DifficultyFilter.tsx` | component | request-response | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/SectionFilter.tsx` | component | request-response | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/ActionsGroup.tsx` | component | event-driven | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/ContentTree.tsx` | component | transform | `src/scoring/scoring.ts` (transform) | data-flow-match |
| `src/components/SectionRow.tsx` | component | request-response | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/TopicRow.tsx` | component | request-response | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/QuestionCard.tsx` | component | request-response | `src/app/App.tsx` (placeholder) | role-match |
| `src/components/StorageToast.tsx` | component | event-driven | `src/storage/adapter.ts` (CustomEvent dispatch) | data-flow-match |
| `src/utils/buildFlatRows.ts` | utility | transform | `src/scoring/scoring.ts` | exact-role (pure transform function) |

---

## Pattern Assignments

### `src/app/App.tsx` (component/shell, request-response)

**Analog:** `src/app/main.tsx` — wiring pattern; `src/app/App.tsx` placeholder to be fully replaced.

**Current placeholder** (`src/app/App.tsx`, lines 1–8):
```tsx
export function App() {
  return (
    <div>
      <h1>Interviewer Checklist</h1>
      <p>Phase 1 scaffold — feature work begins in Phase 2.</p>
    </div>
  );
}
```

**Replace with** — full shell layout. Copy structural pattern from RESEARCH.md Pattern 5 (useVirtualizer rendering). Key rules from existing codebase:
- Named export only (`export function App()`) — never default export
- No CSS Modules — Tailwind utility classes on JSX elements
- `.js` extension on all relative imports: `import { useAppStore } from '../store/app.js'`
- Import styles.css once here: `import './styles.css'`

**Shell structure to implement** (from UI-SPEC.md Component Inventory, Shell Layout):
```tsx
// Named export, no default
export function App() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-gray-900 focus:rounded focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <div className="flex h-screen overflow-hidden">
        {/* Backdrop — narrow viewports */}
        {/* <aside> Sidebar */}
        {/* <main id="main-content"> ContentTree */}
      </div>
    </>
  );
}
```

---

### `src/app/main.tsx` (entry point, request-response)

**Analog:** `src/app/main.tsx` (existing — additive edit).

**Existing pattern** (`src/app/main.tsx`, lines 1–21):
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from '../storage/bootstrap.js';
import { registerLifecycleListeners } from '../storage/lifecycle.js';
import { App } from './App.tsx';

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('Root element not found');
}

// Await migration pipeline before mounting — STORE-03
const _initialState = await bootstrap();
registerLifecycleListeners();
// TODO Phase 4: pass _initialState to Zustand store hydration

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Phase 4 edit** — replace the `_initialState` TODO with store hydration. Add import for `useAppStore`. The guard pattern (`if (rootEl === null) throw`) and `.js` extension imports are established — copy exactly:
```tsx
// Add after existing imports:
import { useAppStore } from '../store/app.js';
import type { AppState } from '../store/app.js';

// Replace the TODO comment block:
const initialState = await bootstrap();
registerLifecycleListeners();
const uiState = (initialState as Record<string, unknown>).uiState as Partial<AppState> | undefined;
if (uiState) {
  useAppStore.setState({
    ...uiState,
    selectedDifficulties: new Set((uiState.selectedDifficulties as string[] | undefined) ?? []),
    selectedSections: new Set((uiState.selectedSections as string[] | undefined) ?? []),
  });
}
```

---

### `src/app/theme.ts` (utility/DOM, event-driven)

**Analog:** `src/storage/lifecycle.ts` — event-driven, side-effect only, no React imports.

**Lifecycle pattern to copy** (event listener registration without React):
```typescript
// src/storage/lifecycle.ts — registers document/window listeners
// No React imports — pure DOM/browser API code
// Named export function
export function registerLifecycleListeners(): void { ... }
```

**theme.ts pattern** — standalone module, no imports from React or any module that transitively imports React (MV3 CSP: bundled as separate entry):
```typescript
// src/app/theme.ts
// No imports — accesses chrome.storage.local and document directly
// Apply OS preference synchronously (before chrome.storage.local callback)
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
  document.documentElement.classList.add('dark');
}
// Override with stored user preference once chrome.storage.local resolves
chrome.storage.local.get(['darkMode'], (result) => {
  if (chrome.runtime.lastError) return;
  if (typeof result['darkMode'] === 'boolean') {
    document.documentElement.classList.toggle('dark', result['darkMode'] as boolean);
  }
});
```

**Key constraint:** No `.js` extension imports here — this file has NO imports at all.

---

### `src/app/styles.css` (config/CSS)

**No codebase analog** — first CSS file in this project (Tailwind v4 uses CSS-based config, no `tailwind.config.*`).

**Pattern from RESEARCH.md** (Pattern 1, Tailwind v4 Dark Mode Setup):
```css
/* src/app/styles.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

**Critical:** Without the `@custom-variant` line, `dark:` classes respond to OS preference only — toggling `class="dark"` on `<html>` will not work.

---

### `src/store/app.ts` (store, event-driven)

**Analog:** `src/storage/adapter.ts` — stateful module with internal state, public API, `.write()` integration.

**Class structure pattern to translate** (`src/storage/adapter.ts`, lines 10–137):
- Private state fields with `#` prefix
- Single responsibility per method
- `storageAdapter` singleton exported at bottom (line 137): `export const storageAdapter = new StorageAdapter()`

**Zustand equivalent:** module-level store + module-level subscribe (not inside a React component). Named exports only. `.js` extensions on imports.

**Import pattern** (copy from `src/storage/adapter.ts` lines 1–9 — style, not content):
```typescript
// src/store/app.ts
import { create } from 'zustand';
import type { Difficulty } from '../data/bank/types.js';
import { storageAdapter } from '../storage/index.js';
```

**Core store pattern** (from RESEARCH.md Pattern 3):
```typescript
export const useAppStore = create<AppState & AppActions>()((set) => ({
  ...DEFAULT_STATE,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleGroup: (id) =>
    set((s) => ({ groupOpen: { ...s.groupOpen, [id]: !s.groupOpen[id] } })),
  setDarkMode: (dark) => {
    document.documentElement.classList.toggle('dark', dark);
    set({ darkMode: dark });
  },
  // ... remaining actions
}));
```

**Subscribe-to-persist pattern** (module level, after store creation — never inside a component):
```typescript
// Wire subscribe AFTER store creation — fires on every mutation
useAppStore.subscribe((state) => {
  storageAdapter.write({
    uiState: {
      sidebarOpen: state.sidebarOpen,
      groupOpen: state.groupOpen,
      topicOpen: state.topicOpen,
      searchQuery: state.searchQuery,
      selectedDifficulties: [...state.selectedDifficulties], // Set → Array (JSON safe)
      selectedSections: [...state.selectedSections],         // Set → Array (JSON safe)
      hideMarked: state.hideMarked,
      darkMode: state.darkMode,
    },
  });
});
```

**Error handling:** none needed for Zustand actions — adapter has its own error handling. Mirror adapter's silent-catch pattern for quota check.

---

### `src/components/Sidebar.tsx` (component, request-response)

**Analog:** `src/app/App.tsx` placeholder (role) + RESEARCH.md code examples (content).

**Named export pattern** (from `src/app/App.tsx` line 1):
```tsx
export function Sidebar() { ... }  // never default export
```

**ARIA + Tailwind pattern** (from RESEARCH.md Code Examples + UI-SPEC.md):
```tsx
// Backdrop (narrow viewports)
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-40 md:hidden"
    aria-hidden="true"
    onClick={() => setSidebarOpen(false)}
  />
)}

// Sidebar panel
<aside
  role="complementary"
  aria-label="Filters"
  className={`
    w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col overflow-y-auto
    transition-transform duration-200 ease-in-out motion-reduce:transition-none
    md:relative md:translate-x-0
    fixed inset-y-0 left-0 z-50
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `}
>
```

**Focus ring pattern** (from UI-SPEC.md Accessibility Contract — applied to ALL interactive elements):
```tsx
className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

**Sidebar toggle button** (from UI-SPEC.md Sidebar Toggle Button):
```tsx
<button
  type="button"
  aria-expanded={sidebarOpen}
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="min-h-[44px] ... focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  ☰
</button>
```

---

### `src/components/SidebarGroup.tsx` (component, request-response)

**Analog:** `src/app/App.tsx` (role).

**Named export, props interface pattern** (from `src/data/bank/types.ts` interface style, lines 4–21):
```tsx
// Named export interface — never inline type
export interface SidebarGroupProps {
  groupId: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function SidebarGroup({ groupId, label, isOpen, onToggle, children }: SidebarGroupProps) { ... }
```

**Collapsible group header** (from UI-SPEC.md Sidebar Group):
```tsx
<button
  type="button"
  aria-expanded={isOpen}
  onClick={onToggle}
  className="min-h-[44px] w-full flex items-center justify-between px-4 font-semibold text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  {label}
  <span className={`transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>
    ▾
  </span>
</button>
{isOpen && <div>{children}</div>}
```

---

### `src/components/SearchGroup.tsx` (component, event-driven)

**Analog:** `src/storage/adapter.ts` debounce pattern (lines 33–41) — same `setTimeout` + clearTimeout pattern.

**Debounce pattern from adapter** (lines 33–41):
```typescript
// StorageAdapter.write() — debounce pattern to copy:
if (this.#debounceTimer !== null) {
  clearTimeout(this.#debounceTimer);
}
this.#debounceTimer = setTimeout(() => {
  void this.#flush();
}, DEBOUNCE_MS);
```

**React translation** (from RESEARCH.md Pattern 6):
```tsx
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [localValue, setLocalValue] = useState('');

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setLocalValue(value);  // immediate — controls the input
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setSearchQuery(value);  // Zustand action — debounced 150ms
  }, 150);
};

useEffect(() => () => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
}, []);
```

**aria-live result count** (from RESEARCH.md Code Examples):
```tsx
<p aria-live="polite" aria-atomic="true" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
  {resultCount === totalCount
    ? `Showing all ${totalCount.toLocaleString()} questions`
    : `Showing ${resultCount.toLocaleString()} of ${totalCount.toLocaleString()} questions`}
</p>
```

---

### `src/components/DifficultyFilter.tsx` (component, request-response)

**Analog:** `src/data/bank/types.ts` — `Difficulty` type is the data contract for pills.

**Difficulty type import** (`src/data/bank/types.ts`, line 1):
```typescript
import type { Difficulty } from '../data/bank/types.js';
// Difficulty = 'novice' | 'intermediate' | 'advanced' | 'expert'
```

**aria-pressed pill pattern** (from UI-SPEC.md Difficulty Filter Group):
```tsx
<button
  type="button"
  aria-pressed={selectedDifficulties.has(difficulty)}
  onClick={() => toggleDifficulty(difficulty)}
  className={`
    text-xs px-2 py-1 rounded-full
    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none
    ${selectedDifficulties.has(difficulty)
      ? 'bg-blue-600 text-white dark:bg-blue-500'
      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}
  `}
>
  {label} ({count})
</button>
```

---

### `src/components/SectionFilter.tsx` (component, request-response)

**Analog:** `src/data/bank/types.ts` — `Section` interface is the data contract; `src/app/App.tsx` for component shell.

**Section import** (`src/data/bank/types.ts`, lines 12–21):
```typescript
import type { Section } from '../data/bank/types.js';
// Section has: id, label, icon, items
```

**aria-pressed + accent border pattern** (from UI-SPEC.md Section Filter Group):
```tsx
<button
  type="button"
  aria-pressed={selectedSections.has(section.id)}
  onClick={() => toggleSection(section.id)}
  className={`
    w-full flex items-center justify-between px-3 py-2 text-sm text-left
    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none
    ${selectedSections.has(section.id)
      ? 'border-l-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
      : ''}
  `}
>
  <span>{section.label}</span>
  <span className="text-gray-400 text-xs ml-auto">—</span>
</button>
```

---

### `src/components/ActionsGroup.tsx` (component, event-driven)

**Analog:** `src/app/App.tsx` (role); `src/storage/adapter.ts` (event dispatch pattern for dark mode toggle).

**Dark mode toggle** (from UI-SPEC.md Actions Group + Interaction Contracts):
```tsx
<button
  type="button"
  aria-pressed={darkMode}
  onClick={() => setDarkMode(!darkMode)}
  className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ..."
>
  {darkMode ? 'Light mode' : 'Dark mode'}
</button>
```

**Expand/Collapse all** (from UI-SPEC.md + CONTEXT.md):
```tsx
<button type="button" onClick={expandAll} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ...">
  Expand all
</button>
<button type="button" onClick={collapseAll} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ...">
  Collapse all
</button>
<button
  type="button"
  aria-pressed={false}
  disabled
  className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ..."
>
  Hide marked topics
</button>
```

---

### `src/components/ContentTree.tsx` (component, transform)

**Analog:** `src/scoring/scoring.ts` — pure transform in, rendered result out. Both consume typed data structures and produce derived output.

**Named export component pattern** (from scoring.ts export style, line 42):
```tsx
// Named export only — no default
export function ContentTree({ rows }: { rows: VirtualRow[] }) { ... }
```

**useVirtualizer pattern** (from RESEARCH.md Pattern 5 — full excerpt):
```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualRow } from '../utils/buildFlatRows.js';

const ESTIMATE_SIZE: Record<VirtualRow['type'], number> = {
  section: 52,
  topic: 44,
  question: 72,
};

export function ContentTree({ rows }: { rows: VirtualRow[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => ESTIMATE_SIZE[rows[index].type],
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 10,
    useFlushSync: false,  // Required for React 19
  });

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)` }}
            >
              {row.type === 'section' && <SectionRow row={row} />}
              {row.type === 'topic' && <TopicRow row={row} />}
              {row.type === 'question' && <QuestionCard row={row} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### `src/components/SectionRow.tsx` (component, request-response)

**Analog:** `src/app/App.tsx` (role); `src/data/bank/types.ts` for `Section` interface.

**Tailwind classes from UI-SPEC.md** (Content Tree, Section row):
```
bg-gray-50 dark:bg-gray-800/50 font-semibold text-base
border-b border-gray-200 dark:border-gray-700 px-4 py-3
```

**Collapsible section row** — section header click toggles `topicOpen` for all topics in section (via `expandAll`/`collapseAll` is handled by ActionsGroup; section-level collapse is `sectionOpen` in store). Use `aria-expanded` on the button.

---

### `src/components/TopicRow.tsx` (component, request-response)

**Analog:** `src/app/App.tsx` (role); `src/data/bank/types.ts` for `Topic` interface.

**Tailwind classes from UI-SPEC.md** (Content Tree, Topic row):
```
bg-white dark:bg-gray-900 px-4 py-2 pl-8 font-normal text-sm
border-b border-gray-100 dark:border-gray-800
```

**Mark placeholder** (Phase 4 — always "—" in `text-gray-400 text-xs`; Phase 5 populates with band color).

---

### `src/components/QuestionCard.tsx` (component, request-response)

**Analog:** `src/data/bank/types.ts` for `Question` interface + `Difficulty` type.

**Difficulty type import** (`src/data/bank/types.ts`, line 1): `import type { Difficulty } from '../data/bank/types.js'`

**Tailwind classes from UI-SPEC.md** (Question Card):
```
bg-white dark:bg-gray-900 px-4 py-3 pl-12 border-b border-gray-100 dark:border-gray-800
```

**Difficulty pill colors** (UI-SPEC.md — declare all 4 branches; all must be present for Tailwind to include in bundle):
```tsx
const DIFFICULTY_CLASSES: Record<Difficulty, string> = {
  novice:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
```

**Tag badge:**
```tsx
<span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
  {question.tag}
</span>
```

**Description truncation:**
```tsx
<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{topic.desc}</p>
```

---

### `src/components/StorageToast.tsx` (component, event-driven)

**Analog:** `src/storage/adapter.ts` lines 85–97 — `storage-quota-warning` CustomEvent dispatch is the producer; StorageToast is the consumer.

**Event producer pattern** (`src/storage/adapter.ts`, lines 88–94):
```typescript
window.dispatchEvent(
  new CustomEvent('storage-quota-warning', {
    detail: { usedBytes: used, quotaBytes: QUOTA_BYTES },
  }),
);
```

**Consumer pattern** — addEventListener in useEffect, cleanup on unmount (mirror lifecycle.ts pattern):
```tsx
export function StorageToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('storage-quota-warning', handler);
    return () => window.removeEventListener('storage-quota-warning', handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg px-4 py-3 shadow-lg"
    >
      <p className="text-sm">Storage is almost full. Export a YAML backup to free space.</p>
      <button
        type="button"
        aria-label="Dismiss storage warning"
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        ×
      </button>
    </div>
  );
}
```

---

### `src/utils/buildFlatRows.ts` (utility, transform)

**Analog:** `src/scoring/scoring.ts` — exact role match. Both are pure transform functions: typed input → typed output, no side effects, no React imports, fully unit-testable.

**Function signature pattern** (`src/scoring/scoring.ts`, lines 42–46):
```typescript
// Pure function — named export, typed params, typed return
export function computeTopicMark(
  topic: Topic,
  scores: ScoreMap,
  override?: number | null,
): TopicResult {
```

**buildFlatRows equivalent** (from RESEARCH.md Pattern 4):
```typescript
// src/utils/buildFlatRows.ts
// Pure function — named export only
import type { Section, Difficulty } from '../data/bank/types.js';

export type SectionRow = { type: 'section'; id: string; label: string; icon: string; questionCount: number; };
export type TopicRow   = { type: 'topic'; sectionId: string; topic: Topic; questionCount: number; isOpen: boolean; };
export type QuestionRow = { type: 'question'; sectionId: string; topicId: string; question: Question; index: number; };
export type VirtualRow = SectionRow | TopicRow | QuestionRow;

export function buildFlatRows(
  sections: readonly Section[],
  topicOpen: Record<string, boolean>,
  sectionOpen: Record<string, boolean>,
  filters: { searchQuery: string; selectedDifficulties: Set<Difficulty>; selectedSections: Set<string>; },
): VirtualRow[] { ... }
```

**Error handling:** none — same as scoring.ts (pure function, no throws, null/empty returns on edge cases).

---

## Shared Patterns

### Named Exports Only
**Source:** `src/scoring/scoring.ts` (all functions), `src/storage/adapter.ts` (class + singleton), `src/app/App.tsx`
**Apply to:** Every file in this phase — never use `export default`
```typescript
// Correct:
export function buildFlatRows(...) { ... }
export function ContentTree(...) { ... }
export const useAppStore = create(...)

// Wrong:
export default function ContentTree() { ... }
```

### Import Path Convention: `.js` Extensions on Relative Imports
**Source:** `src/app/main.tsx` (lines 3–5), `src/scoring/scoring.ts` (line 1), `src/storage/adapter.ts` (lines used in bootstrap.ts)
**Apply to:** All relative imports in all new files
```typescript
// Correct:
import { storageAdapter } from '../storage/index.js';
import type { Difficulty } from '../data/bank/types.js';
import { useAppStore } from '../store/app.js';

// Wrong:
import { storageAdapter } from '../storage/index';
import { useAppStore } from '../store/app';
```

### Biome-Compliant Code Style
**Source:** All existing files — no ESLint/Prettier; Biome 2.5.0
**Apply to:** All new files
- No trailing commas in function parameters (Biome default)
- Single quotes for strings
- `const` over `let` where possible
- Private class fields use `#` prefix (see `adapter.ts` lines 7–9)

### Focus Ring on All Interactive Elements
**Source:** UI-SPEC.md Accessibility Contract; CONTEXT.md
**Apply to:** Every `<button>`, `<input>`, `<a>` in all component files
```tsx
className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

### Dark Mode Tailwind Pair Pattern
**Source:** UI-SPEC.md Color section; RESEARCH.md Pattern 1
**Apply to:** Every element with a background, text, or border color
```tsx
// Always pair light + dark variant:
className="bg-white dark:bg-gray-900"
className="text-gray-900 dark:text-gray-100"
className="text-gray-500 dark:text-gray-400"
className="border-gray-200 dark:border-gray-700"
className="bg-gray-100 dark:bg-gray-800"
```

### StorageAdapter Integration (write only — never read in components)
**Source:** `src/storage/adapter.ts` lines 32–41 (write method); singleton at line 137
**Apply to:** `src/store/app.ts` subscribe listener only — components never call storageAdapter directly
```typescript
import { storageAdapter } from '../storage/index.js';
// Call only from store subscribe, not from components:
storageAdapter.write({ uiState: { ... } });
```

### Test File Convention
**Source:** `src/scoring/scoring.test.ts` (co-located), `src/storage/adapter.test.ts` (co-located)
**Apply to:** All new files with logic — `*.test.tsx` for components, `*.test.ts` for utilities and store

**Test imports pattern** (`src/scoring/scoring.test.ts`, lines 1–8):
```typescript
import { describe, expect, it } from 'vitest';
// For component tests, add:
import { render, screen } from '@testing-library/react';
// For tests touching chrome APIs, add:
import { chrome } from 'vitest-chrome';
```

**beforeEach/afterEach pattern** (`src/storage/adapter.test.ts`, lines 55–64):
```typescript
// For timer-based tests (debounce):
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
});
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/styles.css` | config | — | First CSS file in project; Tailwind v4 CSS-based config has no prior example; use RESEARCH.md Pattern 1 verbatim |

---

## Metadata

**Analog search scope:** `src/app/`, `src/scoring/`, `src/storage/`, `src/data/`, `src/test/`
**Files scanned:** 10 existing source files
**Key insight:** This is the first UI phase — no existing React component or Zustand store to copy from. The scoring.ts pure-function pattern is the strongest analog for `buildFlatRows.ts`. The `adapter.ts` debounce and event-dispatch patterns directly map to `SearchGroup.tsx` and `StorageToast.tsx`. All TypeScript conventions (named exports, `.js` extensions, `#` private fields) are firmly established across Phases 1–3.
**Pattern extraction date:** 2026-06-17
