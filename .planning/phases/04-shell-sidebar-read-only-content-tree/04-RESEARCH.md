# Phase 4: Shell, Sidebar & Read-Only Content Tree — Research

**Researched:** 2026-06-17
**Domain:** React 19 + Zustand 5 + Tailwind v4 + @tanstack/react-virtual — Chrome MV3 Extension UI Shell
**Confidence:** MEDIUM

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **CSS:** Tailwind v4 (already installed in Phase 1) — utility classes throughout, no CSS Modules
- **Dark mode:** `class="dark"` on `<html>` toggled by JS; persisted via StorageAdapter; Tailwind `dark:` variant for all dark styles; system preference (`prefers-color-scheme`) as initial default
- **State management:** First Zustand store created in Phase 4 — `useAppStore` in `src/store/app.ts`; wired to StorageAdapter.write() on every state change; sidebar collapsed/group-open states live here
- **Question tree rendering:** Virtualized list using `@tanstack/virtual` for 1067 questions grouped by section/topic — prevents DOM overload; flat row model with section/topic/question row types
- **Search debounce:** 150ms trailing debounce on search input; searches question names, descriptions, tags, and full question text; shows live result count
- **Filter persistence:** Multi-select difficulty + section filters in Zustand store (same `useAppStore`), persisted via StorageAdapter — survive sessions
- **Section labels with marks:** Section filter shows group name + placeholder mark "—" in Phase 4 (scoring state empty); marks populate in Phase 5 when scoring engine is wired
- **Collapse/expand all:** "Expand all" and "Collapse all" buttons in sidebar Actions group; "Hide already-marked topics" toggle (always off in Phase 4)
- **Skip link:** `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` — visible on keyboard focus, hidden otherwise
- **Sidebar ARIA:** `aria-expanded` on sidebar toggle button; `<aside aria-label="Filters">` with `role="complementary"`; `aria-pressed` on filter buttons
- **Sidebar animation:** `transition-transform duration-200` CSS on sidebar panel; wrapped in `@media (prefers-reduced-motion: reduce)` override — matches UI-08
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` on all interactive elements via Tailwind

### Claude's Discretion
- Component file layout (the UI-SPEC defines components, but folder organization within `src/` is discretion)
- TDD approach: co-located `*.test.tsx` files per established pattern

### Deferred Ideas (OUT OF SCOPE)
- Scoring inputs on question cards (Phase 5)
- Session switcher (Phase 6)
- YAML export/import button (Phase 7)
- AI prompt button (Phase 8)
- Print stylesheet (Phase 9)
- `chrome.commands` keyboard shortcuts (Phase 9)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Shell layout — collapsible sidebar + scrollable content area; sidebar becomes a responsive overlay on narrow viewports | Sidebar CSS pattern: `translate-x-[-100%]`/`translate-x-0`, overlay pattern for ≤768px using `fixed inset-0 z-50` |
| UI-02 | Sidebar four collapsible groups (Search / Difficulty / Sections / Actions); collapsed state remembered per group | Zustand store `groupOpen` Record<string, boolean>; subscribe → storageAdapter.write() |
| UI-03 | Search input debounced ~150ms, searches name/description/tags/text; live result count | setTimeout debounce in useRef; avoid useDeferredValue (wrong semantic — see Pitfall 5) |
| UI-04 | Multi-select difficulty filter with counts; multi-select section filter with marks | `selectedDifficulties: Set<Difficulty>`, `selectedSections: Set<string>` in Zustand; filter applied during flat-row computation |
| UI-05 | View toolbar: Expand all, Collapse all, Hide already-marked topics toggle | Zustand actions: `expandAll()`, `collapseAll()` that batch-update `topicOpen` Record; `hideMarked: boolean` always false Phase 4 |
| UI-06 | Dark mode — OS preference default; user toggle persists | FOUC prevention via `src/app/theme.ts` external script (no inline scripts in MV3); Tailwind `@custom-variant dark` |
| UI-07 | Accessibility: landmark elements, skip link, ARIA roles/labels/expanded/pressed, focus rings | SR-only skip link; `<aside role="complementary">`, `aria-expanded`, `aria-pressed`, `aria-live="polite"` live region |
| UI-08 | `prefers-reduced-motion` gates sidebar transitions | Tailwind `motion-reduce:transition-none` on sidebar panel |
</phase_requirements>

---

## Summary

Phase 4 builds the full application shell for the Interviewer Checklist Chrome MV3 extension: a collapsible sidebar with four filter groups, a virtualized content tree of ~1067 questions organized into 9 sections and ~86 topics, and a dark mode toggle. The phase introduces the first Zustand store (`useAppStore`), replaces the Phase 1 App.tsx placeholder, and wires everything to the StorageAdapter from Phase 3.

The most technically involved areas are: (1) the flat-row model for `@tanstack/react-virtual` that mixes section/topic/question row types into a single array, (2) the Tailwind v4 dark mode setup which requires a `@custom-variant` declaration in a new CSS file rather than a config file, and (3) the FOUC prevention strategy for dark mode in MV3 extensions, where inline scripts are categorically banned by CSP — requiring an external `theme.ts` script bundled by Vite.

The StorageAdapter already exists (Phase 3) and accepts a generic `Record<string, unknown>` payload via `write()`. The Zustand store must call `storageAdapter.write(snapshot)` inside a `subscribe()` listener after every state change — not via middleware, since the project uses a custom adapter rather than Zustand's built-in `persist` middleware.

**Primary recommendation:** Build in this order: (1) CSS file with Tailwind import + dark variant, (2) theme.ts FOUC script, (3) Zustand store with subscribe-to-persist, (4) flat-row builder utility, (5) shell layout, (6) sidebar, (7) virtualizer content tree, (8) wire filters/search.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Shell layout (sidebar + content) | Browser / Client (React) | — | Pure client-side HTML/CSS layout; no SSR |
| Dark mode toggle + FOUC prevention | Browser / Client (DOM) | Extension HTML (app.html) | JS must run before React mounts; DOM manipulation only |
| State management (filters, sidebar, dark mode) | Browser / Client (Zustand) | Storage (StorageAdapter) | Zustand is the single source of truth; StorageAdapter is the persistence sink |
| Question tree virtualization | Browser / Client (React) | — | DOM rendering performance; no server involvement |
| Search filtering | Browser / Client (computed) | — | Pure client filter over in-memory DEFAULT_SECTIONS data |
| Filter state (difficulty, section) | Browser / Client (Zustand) | Storage (StorageAdapter) | Filter state persists via StorageAdapter; Zustand is runtime owner |
| Accessibility (ARIA) | Browser / Client (JSX attrs) | — | HTML attributes in component markup |
| Storage persistence | Storage (StorageAdapter) | — | Already implemented Phase 3; Phase 4 only calls write() |

---

## Standard Stack

### Core (already installed — no new installs except @tanstack/react-virtual)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.7 | UI rendering | Locked — Phase 1 |
| Zustand | 5.0.14 | Client state management | Locked — Phase 1 stack decision |
| Tailwind v4 | 4.3.1 | Utility CSS | Locked — Phase 1, already in vite.config.ts |
| @tanstack/react-virtual | 3.14.3 | Virtualizes ~1400+ DOM rows into ~20 visible | Locked — CONTEXT.md decision; 16.6M weekly downloads [VERIFIED: npm registry] |
| TypeScript | ~6.0 | Type safety | Locked |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.3.2 | Component tests | All UI component tests |
| @testing-library/jest-dom | 6.9.1 | DOM matchers | Paired with testing-library |
| vitest | 4.1.9 | Test runner | Already in use |
| vitest-chrome | 0.1.0 | Chrome API mocks | Already configured in setup.ts |
| happy-dom | 20.10.4 | DOM environment | Already in vitest.config.ts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-virtual | react-window | react-window requires fixed item sizes; tanstack supports variable heights via measureElement — needed for mixed row types |
| @tanstack/react-virtual | react-virtuoso | react-virtuoso has a simpler GroupedVirtuoso API but adds a larger bundle; tanstack is already the locked decision |
| setTimeout debounce | useDeferredValue | useDeferredValue defers re-renders but does not debounce input events — it doesn't prevent rapid searches; setTimeout is correct for 150ms trailing debounce (see Pitfall 5) |
| External theme.ts for FOUC | inline `<script>` in app.html | MV3 CSP bans inline scripts entirely — external file is the only valid approach |

### New Installation Required

```bash
npm install @tanstack/react-virtual
```

**Version verification:** `npm view @tanstack/react-virtual version` returns `3.14.3` (published 2026-06-15) [VERIFIED: npm registry]

No other new dependencies. All other libraries are already installed.

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @tanstack/react-virtual | npm | ~5 yrs (v3.14.3 published 2026-06-15) | 16.6M/wk | github.com/TanStack/virtual | SUS (too-new flag on latest patch) | Approved — flagged as SUS due to recency of latest patch only; established package, official TanStack org, 16.6M weekly downloads. Proceed. |
| zustand | npm | ~5 yrs (5.0.14 published 2026-05-28) | 41.6M/wk | github.com/pmndrs/zustand | SUS (too-new flag on latest patch) | Approved — already installed (package.json), established library |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** @tanstack/react-virtual, zustand — both flagged due to recency of their most recent patch release only, not due to origin or legitimacy concerns. Both are established packages from recognized organizations with massive weekly download counts. The `too-new` signal refers to the latest patch version date, not the package origin. No postinstall scripts on either package. Proceed normally.

> **Note on SUS rating:** The legitimacy tool flags both packages as `SUS` purely because their most recent patch was published within 30 days. This is expected behavior for actively maintained, popular packages. Neither package has suspicious signals (no missing source repo, no low downloads, no postinstall scripts). The planner should NOT add `checkpoint:human-verify` tasks for these packages.

---

## Architecture Patterns

### System Architecture Diagram

```
 User interaction
        │
        ▼
 [app.html] ──theme.ts──► DOM: apply dark/light class before React mounts
        │
        ▼
 [main.tsx] ──await bootstrap()──► StorageAdapter.read() ──► V2 state
        │
        │ setState(initialState)
        ▼
 [useAppStore] ◄──────────────────────────────────────────────┐
   Zustand store                                               │
   - sidebarOpen: bool                                        │
   - groupOpen: Record<string,bool>                           │  subscribe()
   - topicOpen: Record<string,bool>                           │  on every change
   - searchQuery: string                                      │
   - selectedDifficulties: Set<Difficulty>                    │
   - selectedSections: Set<string>                            │
   - hideMarked: bool                                         │
   - darkMode: bool                                           │
        │                                                     │
        │ state slice                          StorageAdapter.write(snapshot)
        ▼                                                     │
 [App.tsx] shell layout                                       │
   │                      │                                   │
   ▼                      ▼                                   │
 <aside>              <main>                                  │
 Sidebar              ContentTree                             │
   │                      │                                   │
   │ filters           buildFlatRows(DEFAULT_SECTIONS,        │
   │ sidebar state     filters, openState)                    │
   │                      │                                   │
   │              flat VirtualRow[]                           │
   │                      │                                   │
   │              useVirtualizer()                            │
   │                      │                                   │
   │              virtualItems.map()                          │
   │                   → SectionRow | TopicRow | QuestionRow  │
   │                                                          │
   └─────────────── Zustand actions (set) ───────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   ├── app.html        # CRXJS entry — add theme.ts script tag
│   ├── App.tsx         # REPLACE Phase 1 placeholder → full shell layout
│   ├── main.tsx        # Already exists — wire _initialState to store
│   └── theme.ts        # NEW: FOUC prevention — apply dark class before React
├── store/
│   └── app.ts          # NEW: useAppStore (Zustand) — all Phase 4 state
├── components/
│   ├── Sidebar.tsx         # NEW: <aside> with four groups
│   ├── SidebarGroup.tsx    # NEW: collapsible group wrapper
│   ├── SearchGroup.tsx     # NEW: search input + result count
│   ├── DifficultyFilter.tsx  # NEW: multi-select difficulty pills
│   ├── SectionFilter.tsx   # NEW: multi-select section list
│   ├── ActionsGroup.tsx    # NEW: expand/collapse/hide/dark-mode buttons
│   ├── ContentTree.tsx     # NEW: @tanstack/react-virtual list
│   ├── SectionRow.tsx      # NEW: section header row
│   ├── TopicRow.tsx        # NEW: topic row with collapse
│   ├── QuestionCard.tsx    # NEW: read-only question card
│   └── StorageToast.tsx    # NEW: quota warning toast
├── utils/
│   └── buildFlatRows.ts    # NEW: DEFAULT_SECTIONS → VirtualRow[]
├── data/
│   └── bank/               # Existing — DEFAULT_SECTIONS
├── scoring/                # Existing
└── storage/                # Existing
```

### Pattern 1: Tailwind v4 Dark Mode Setup

**What:** Tailwind v4 does not enable class-based dark mode by default — it uses `prefers-color-scheme`. To enable `class="dark"` on `<html>`, you must declare a `@custom-variant` in a CSS file.

**When to use:** Required for user-toggled dark mode with `dark:` utility classes.

**Where:** Create `src/app/styles.css` (imported in main.tsx or App.tsx):

```css
/* Source: https://tailwindcss.com/docs/dark-mode [CITED] */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

Then import in `main.tsx` or `App.tsx`:
```tsx
import './styles.css';
```

> **Critical:** Without `@custom-variant dark`, Tailwind v4's `dark:` classes respond to OS preference only — toggling `class="dark"` on `<html>` will NOT work.

### Pattern 2: FOUC Prevention in MV3 (External Script)

**What:** MV3 extension pages ban inline `<script>` tags by CSP (`script-src 'self' 'wasm-unsafe-eval'`). The standard web trick of using an inline script in `<head>` to apply dark class before React mounts is not available.

**Solution:** Create a separate `src/app/theme.ts` bundled by Vite, loaded via a `<script type="module" src="./theme.ts">` tag BEFORE the main.tsx script tag in app.html. [VERIFIED: developer.chrome.com/docs/extensions/reference/manifest/content-security-policy]

```html
<!-- src/app/app.html -->
<head>
  <!-- theme.ts runs BEFORE main.tsx; applies dark class immediately -->
  <script type="module" src="./theme.ts"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
```

```typescript
// src/app/theme.ts — FOUC prevention
// Apply OS preference immediately (synchronous) to avoid any flash
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
  document.documentElement.classList.add('dark');
}

// Then override with stored preference once chrome.storage.local resolves
chrome.storage.local.get(['darkMode'], (result) => {
  if (chrome.runtime.lastError) return; // fail silently
  if (typeof result.darkMode === 'boolean') {
    document.documentElement.classList.toggle('dark', result.darkMode);
  }
});
```

**Important:** theme.ts must NOT import from React or any module that transitively imports React, as it runs in a separate module context before React mounts. It accesses `chrome.storage.local` and `document` directly. [ASSUMED — module isolation behavior; verify during execution that CRXJS bundles theme.ts as a standalone module]

### Pattern 3: Zustand Store with subscribe-to-persist

**What:** Zustand `subscribe()` listener fires synchronously after every state mutation. Use it to call `storageAdapter.write()` with the new snapshot.

**When to use:** This is the Phase 3 integration point. Do NOT use Zustand's built-in `persist` middleware — the project uses a custom StorageAdapter.

```typescript
// src/store/app.ts
// Source: Zustand official docs [CITED: zustand.docs.pmnd.rs]
import { create } from 'zustand';
import type { Difficulty } from '../data/bank/index.js';
import { storageAdapter } from '../storage/index.js';

export interface AppState {
  // Sidebar UI state
  sidebarOpen: boolean;
  groupOpen: Record<string, boolean>;
  // Content tree state
  topicOpen: Record<string, boolean>;
  // Filter state
  searchQuery: string;
  selectedDifficulties: Set<Difficulty>;
  selectedSections: Set<string>;
  hideMarked: boolean;
  // Theme
  darkMode: boolean;
}

export interface AppActions {
  setSidebarOpen: (open: boolean) => void;
  toggleGroup: (groupId: string) => void;
  toggleTopic: (topicId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSearchQuery: (q: string) => void;
  toggleDifficulty: (d: Difficulty) => void;
  toggleSection: (id: string) => void;
  setHideMarked: (v: boolean) => void;
  setDarkMode: (dark: boolean) => void;
}

const DEFAULT_STATE: AppState = {
  sidebarOpen: true,
  groupOpen: { search: true, difficulty: true, sections: true, actions: true },
  topicOpen: {},
  searchQuery: '',
  selectedDifficulties: new Set(),
  selectedSections: new Set(),
  hideMarked: false,
  darkMode: false,
};

export const useAppStore = create<AppState & AppActions>()((set) => ({
  ...DEFAULT_STATE,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleGroup: (id) =>
    set((s) => ({
      groupOpen: { ...s.groupOpen, [id]: !s.groupOpen[id] },
    })),
  // ... remaining actions
  setDarkMode: (dark) => {
    document.documentElement.classList.toggle('dark', dark);
    set({ darkMode: dark });
  },
}));

// Wire subscribe AFTER store creation — fires on every mutation
useAppStore.subscribe((state) => {
  // Serialize Set to Array for storage (JSON does not support Set)
  storageAdapter.write({
    uiState: {
      sidebarOpen: state.sidebarOpen,
      groupOpen: state.groupOpen,
      topicOpen: state.topicOpen,
      searchQuery: state.searchQuery,
      selectedDifficulties: [...state.selectedDifficulties],
      selectedSections: [...state.selectedSections],
      hideMarked: state.hideMarked,
      darkMode: state.darkMode,
    },
  });
});
```

**Hydration in main.tsx** — replace the `_initialState` stub:

```typescript
// src/app/main.tsx — after await bootstrap()
const initialState = await bootstrap();
// Hydrate store with persisted UI state if it exists
const uiState = initialState.uiState as Partial<AppState> | undefined;
if (uiState) {
  useAppStore.setState({
    ...uiState,
    selectedDifficulties: new Set(uiState.selectedDifficulties as Difficulty[] ?? []),
    selectedSections: new Set(uiState.selectedSections as string[] ?? []),
  });
}
```

> **Important:** `Set` is not JSON-serializable. Store Sets as arrays in chrome.storage.local and reconstruct as Sets on hydration. [ASSUMED — standard JS serialization constraint, universally known]

### Pattern 4: Flat Row Model for useVirtualizer

**What:** `@tanstack/react-virtual` takes a single flat array of items. To virtualize a grouped section/topic/question tree, build a flat `VirtualRow[]` array with a type discriminator, then render different components based on `row.type`.

**When to use:** Always — this is the only correct approach with useVirtualizer for mixed-type lists.

```typescript
// src/utils/buildFlatRows.ts
import type { Section, Topic, Question, Difficulty } from '../data/bank/index.js';

export type SectionRow = {
  type: 'section';
  id: string;
  label: string;
  icon: string;
  questionCount: number;
};
export type TopicRow = {
  type: 'topic';
  sectionId: string;
  topic: Topic;
  questionCount: number;
  isOpen: boolean;
};
export type QuestionRow = {
  type: 'question';
  sectionId: string;
  topicId: string;
  question: Question;
  index: number; // original index within topic.questions — for score key
};

export type VirtualRow = SectionRow | TopicRow | QuestionRow;

export function buildFlatRows(
  sections: readonly Section[],
  topicOpen: Record<string, boolean>,
  sectionOpen: Record<string, boolean>, // for section collapse
  filters: {
    searchQuery: string;
    selectedDifficulties: Set<Difficulty>;
    selectedSections: Set<string>;
  },
): VirtualRow[] {
  const rows: VirtualRow[] = [];
  const q = filters.searchQuery.toLowerCase();

  for (const section of sections) {
    // Section filter
    if (filters.selectedSections.size > 0 && !filters.selectedSections.has(section.id)) {
      continue;
    }

    const visibleTopics: typeof section.items[number][] = [];
    for (const topic of section.items) {
      const visibleQuestions = topic.questions.filter((question) => {
        const matchesDifficulty =
          filters.selectedDifficulties.size === 0 ||
          filters.selectedDifficulties.has(question.level);
        const matchesSearch =
          !q ||
          topic.name.toLowerCase().includes(q) ||
          topic.desc.toLowerCase().includes(q) ||
          topic.tag.toLowerCase().includes(q) ||
          question.q.toLowerCase().includes(q);
        return matchesDifficulty && matchesSearch;
      });
      if (visibleQuestions.length > 0) {
        visibleTopics.push({ ...topic, questions: visibleQuestions });
      }
    }

    if (visibleTopics.length === 0) continue;

    const totalQCount = visibleTopics.reduce((sum, t) => sum + t.questions.length, 0);
    rows.push({ type: 'section', id: section.id, label: section.label, icon: section.icon, questionCount: totalQCount });

    if (sectionOpen[section.id] === false) continue; // section collapsed

    for (const topic of visibleTopics) {
      rows.push({
        type: 'topic',
        sectionId: section.id,
        topic,
        questionCount: topic.questions.length,
        isOpen: topicOpen[topic.id] !== false, // default open
      });

      if (topicOpen[topic.id] === false) continue; // topic collapsed

      topic.questions.forEach((question, index) => {
        rows.push({ type: 'question', sectionId: section.id, topicId: topic.id, question, index });
      });
    }
  }
  return rows;
}
```

### Pattern 5: useVirtualizer Rendering

**What:** The virtualizer requires a fixed-height scroll container, an inner div sized to the total virtual height, and each item positioned with `transform: translateY`.

**Critical options for React 19:** Set `useFlushSync: false` to avoid React 19 lifecycle warnings. [CITED: tanstack.com/virtual/latest/docs/framework/react/react-virtual]

```tsx
// src/components/ContentTree.tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualRow } from '../utils/buildFlatRows.js';

// Estimated heights per row type (px) — measureElement refines these
const ESTIMATE_SIZE: Record<VirtualRow['type'], number> = {
  section: 52,
  topic: 44,
  question: 72,
};

interface Props {
  rows: VirtualRow[];
}

export function ContentTree({ rows }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => ESTIMATE_SIZE[rows[index].type],
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 10,
    useFlushSync: false, // Required for React 19
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const row = rows[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
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

### Pattern 6: 150ms Search Debounce

**What:** A `useRef`-based debounce that delays updating `searchQuery` in Zustand by 150ms after the last keypress.

**Why not `useDeferredValue`:** `useDeferredValue` defers re-rendering but does NOT prevent the state update from happening immediately — it does not batch or delay writes. It is wrong for this use case (see Pitfall 5).

```tsx
// Inside SearchGroup.tsx
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setLocalValue(value); // local state for controlled input — immediate
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setSearchQuery(value); // Zustand action — debounced
  }, 150);
};

useEffect(() => () => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
}, []);
```

### Anti-Patterns to Avoid

- **Rendering all 1400+ rows without virtualization:** Adding the full DEFAULT_SECTIONS tree directly to DOM will create thousands of DOM nodes. Vitest tests will pass but the extension will lag severely on scroll. Use useVirtualizer always.
- **Inline script in app.html for FOUC prevention:** MV3 CSP `script-src 'self'` categorically bans inline `<script>`. The extension will fail to install with a CSP error. Use an external `theme.ts` file.
- **Storing Set directly to chrome.storage.local:** `chrome.storage.local.set({ s: new Set([1,2,3]) })` will silently store an empty object `{}`. Always serialize Set to Array before writing.
- **Using `@custom-variant dark` without a CSS file:** Tailwind v4 via `@tailwindcss/vite` requires a CSS file with `@import "tailwindcss"` to emit any Tailwind utilities. There is no `tailwind.config.*` in v4. A CSS file must be created and imported.
- **Subscribing inside a React component:** `useAppStore.subscribe()` at module level (outside React) fires for every render regardless of component mount state. Inside a component, it must be in `useEffect` with cleanup. The persist-to-storage subscription belongs at module level in `src/store/app.ts`, not in a component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Virtualized list | Custom windowing logic with position calculations | `@tanstack/react-virtual` `useVirtualizer` | Scroll offset math, overscan, dynamic measurement, and resize handling are subtle; bugs only appear under specific scroll conditions |
| State management | Custom React context + useReducer | Zustand (already installed) | Context causes all consumers to re-render on any state change; selector-based subscriptions avoid this |
| CSS dark mode toggle | Manual style injection | Tailwind `dark:` variant + `class="dark"` on `<html>` | Tailwind generates all dark variants at build time; manual injection misses utility classes |
| Debounce implementation | Lodash import | Plain `setTimeout` in `useRef` | One function, no additional dependency, zero bundle cost |

**Key insight:** The only genuinely complex custom code in this phase is `buildFlatRows()` — everything else delegates to proven libraries.

---

## Common Pitfalls

### Pitfall 1: Missing @custom-variant for Dark Mode

**What goes wrong:** `dark:bg-gray-900` and other dark utilities have no effect even when `class="dark"` is on `<html>`.

**Why it happens:** Tailwind v4 defaults to `prefers-color-scheme` for the dark variant. Without `@custom-variant dark (&:where(.dark, .dark *))` in the CSS file, the `dark:` prefix generates `@media (prefers-color-scheme: dark)` rules, not class-based selectors.

**How to avoid:** Create `src/app/styles.css` with both `@import "tailwindcss"` and the `@custom-variant dark` line. Import it once in App.tsx.

**Warning signs:** Dark mode toggle button works (class toggles on `<html>`) but colors don't change.

### Pitfall 2: No CSS File → No Tailwind Utilities

**What goes wrong:** All Tailwind classes generate no CSS; the page renders unstyled.

**Why it happens:** `@tailwindcss/vite` only scans for utility usage and generates CSS when a CSS file importing `@import "tailwindcss"` is processed. Without a CSS file, the plugin has nothing to compile.

**How to avoid:** `src/app/styles.css` with `@import "tailwindcss"` must exist and must be imported in a JS/TS file that Vite processes.

**Warning signs:** Build succeeds but no styles appear; browser dev tools show no Tailwind-generated classes.

### Pitfall 3: MV3 CSP Blocks Inline Script for FOUC

**What goes wrong:** The extension fails to load with a Content Security Policy error if `app.html` contains any `<script>` tag without a `src` attribute.

**Why it happens:** MV3 extension pages enforce `script-src 'self'` by default. Inline scripts (`<script>document.documentElement.classList...</script>`) violate this even though they are harmless. Chrome blocks the page load entirely.

**How to avoid:** Use `<script type="module" src="./theme.ts"></script>` pointing to a locally-bundled file. Vite/CRXJS will bundle theme.ts as a separate chunk.

**Warning signs:** Extension page blank/error on load; Chrome DevTools console shows CSP violation.

### Pitfall 4: Set Serialization in chrome.storage.local

**What goes wrong:** Stored filter state (`selectedDifficulties`, `selectedSections`) restores as empty on reload.

**Why it happens:** `chrome.storage.local` uses JSON serialization internally. `JSON.stringify(new Set([1,2]))` produces `"{}"` — an empty object. The Set's contents are lost silently.

**How to avoid:** In the Zustand subscribe listener, spread Sets to arrays: `[...state.selectedDifficulties]`. On hydration, reconstruct: `new Set(stored.selectedDifficulties ?? [])`.

**Warning signs:** Filters reset to empty on page reload despite being persisted.

### Pitfall 5: useDeferredValue Is Wrong for Debounce

**What goes wrong:** Zustand `searchQuery` updates on every keystroke even with `useDeferredValue`, causing `buildFlatRows()` to re-run on each character.

**Why it happens:** `useDeferredValue` defers the re-render but not the state update. The Zustand `setSearchQuery` action fires immediately on every change event regardless of `useDeferredValue`. The correct primitive is `setTimeout` in a `useRef`.

**How to avoid:** Use the `useRef` + `setTimeout` pattern shown in Pattern 6. `useDeferredValue` is correct for deferring expensive derived calculations — but the store update itself must be debounced first.

**Warning signs:** The search filters correctly but re-runs on every keystroke with no perceived debounce.

### Pitfall 6: useVirtualizer Measures Zero-Height Items

**What goes wrong:** All items collapse to 0px; the scroll container appears empty.

**Why it happens:** If the `measureElement` callback fires before the DOM element has rendered content (e.g., during server-side rendering or when `display: none`), it returns 0. The virtualizer uses 0px for subsequent positioning, causing all items to overlap at the top.

**How to avoid:** Ensure items render with their full content before measurement. The `estimateSize` function provides a fallback until measurement; set it to realistic values (section=52, topic=44, question=72). Do not hide items with `display:none` — use `visibility:hidden` if needed before measurement.

**Warning signs:** Content tree renders but items overlap; scroll container height is incorrect.

### Pitfall 7: Zustand Subscribe Fires on Initial Store Creation

**What goes wrong:** `storageAdapter.write()` is called immediately on app mount before the user has made any changes, causing a spurious storage write on every page load.

**Why it happens:** In Zustand 5, `subscribe()` fires on the initial state hydration when `setState()` is called in main.tsx. This write is harmless but adds latency to startup.

**How to avoid:** This is acceptable behavior — `storageAdapter.write()` debounces at 300ms, so the write is cheap. However, if absolutely needed, use `subscribeWithSelector` middleware and compare old vs new values before writing.

---

## Code Examples

### Verified Patterns

#### Tailwind v4 CSS file
```css
/* src/app/styles.css */
/* Source: tailwindcss.com/docs/dark-mode [CITED] */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

#### Sidebar overlay (narrow viewports ≤768px)
```tsx
{/* Backdrop — click to close */}
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-40 md:hidden"
    aria-hidden="true"
    onClick={() => setSidebarOpen(false)}
  />
)}

{/* Sidebar */}
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

#### Skip link
```tsx
{/* Source: CONTEXT.md + WCAG 2.4.1 [CITED] */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-gray-900 focus:rounded focus:ring-2 focus:ring-blue-500"
>
  Skip to main content
</a>
```

#### aria-live region for search count
```tsx
<p aria-live="polite" aria-atomic="true" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
  {resultCount === totalCount
    ? `Showing all ${totalCount.toLocaleString()} questions`
    : `Showing ${resultCount.toLocaleString()} of ${totalCount.toLocaleString()} questions`
  }
</p>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `darkMode: 'class'` | `@custom-variant dark` in CSS file | Tailwind v4.0 (Dec 2024) | No tailwind.config.* file exists in v4; config is CSS-based |
| `react-window` with fixed item heights | `@tanstack/react-virtual` with `measureElement` | 2023+ | Variable height support; no external CSS |
| Zustand `persist` middleware | Custom StorageAdapter + `subscribe()` | Phase 3 decision | StorageAdapter provides debouncing, quota checking, snapshotting |
| Inline `<script>` FOUC prevention | External bundled `theme.ts` | MV3 (Chrome 88+) | MV3 CSP prohibits inline scripts in extension pages |

**Deprecated/outdated:**
- `tailwind.config.js darkMode: 'class'` — Tailwind v4 ignores config files; use `@custom-variant` in CSS.
- `react-window` — No longer the recommendation for variable-height lists; use @tanstack/react-virtual.
- `useDeferredValue` for debounce — Incorrect usage (defers renders, not state updates).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `theme.ts` loaded as a separate `<script type="module">` tag before `main.tsx` will execute and finish before React renders (or at minimum apply OS-fallback before React mounts) | Pattern 2 (FOUC) | FOUC remains on first load; mitigation: OS preference is applied synchronously before the `chrome.storage.local` callback, which minimizes flash |
| A2 | CRXJS bundles `theme.ts` as a separate entry module when referenced in `app.html` via `<script type="module" src="./theme.ts">` | Pattern 2 (FOUC) | If CRXJS does not auto-detect theme.ts as an entry, it won't be bundled; fix: add explicit Vite input entry in vite.config.ts |
| A3 | Zustand `subscribe()` at module level in `app.ts` does not fire during Vitest import (only fires when `setState` is actually called) | Pattern 3 | Test isolation issue — subscribe fires during test setup and calls storageAdapter.write(); fix: mock storageAdapter in component tests |
| A4 | `useFlushSync: false` on `useVirtualizer` is supported in @tanstack/react-virtual 3.14.3 and suppresses React 19 warnings | Pattern 5 | React 19 may log warnings during scroll but virtualization still works; not a blocking issue |
| A5 | V2Schema (src/storage/types.ts) does not have a field for `uiState` — the Zustand store state will be written to a new top-level `uiState` key in chrome.storage.local | Pattern 3 | bootstrap() will not populate uiState on first run (expected — defaults are used); no migration needed since it's additive |

**If this table is empty:** Not empty — 5 assumptions recorded above.

---

## Open Questions

1. **Does CRXJS auto-bundle `theme.ts` when referenced in `app.html` as a `<script type="module">` entry?**
   - What we know: CRXJS uses Vite's multi-entry build system and already bundles `main.tsx` from `app.html`.
   - What's unclear: Whether CRXJS's manifest-aware bundler treats `theme.ts` as a valid entry point when it's referenced in the HTML but not in `manifest.json`.
   - Recommendation: In Wave 0, verify by running `npm run build` and checking that `dist/` contains a bundled theme file. If not, add `'src/app/theme': 'src/app/theme.ts'` to `rollupOptions.input` in `vite.config.ts`.

2. **Should `uiState` be stored at the manifest level or inside the active session?**
   - What we know: V2Schema stores `manifest` (sessions list + activeSessionId) and `session:<id>` (scores/notes/etc). There is no `uiState` key.
   - What's unclear: UI state (sidebar open/closed, group open/closed) could logically belong to either the manifest (global) or the active session (per-session).
   - Recommendation: Store as a top-level `uiState` key (outside manifest/session scheme) — it is viewport state, not session content. Phase 3 StorageAdapter.write() accepts any key, so this requires no schema changes.

3. **Does `vitest.config.ts` coverage block need updating to include `src/store/**` and `src/components/**`?**
   - What we know: Current coverage config includes only `src/scoring/**` and `src/storage/**` with 100% thresholds.
   - What's unclear: Whether Phase 4 should add new modules to coverage or keep the strict 100% only on storage/scoring.
   - Recommendation: Add `src/store/**` and `src/utils/**` to the coverage include list with lower thresholds (e.g., 80%). Do NOT add `src/components/**` — component rendering tests are checked via test pass/fail, not branch coverage.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | ✓ | 20.20.2 | — |
| npm | Package install | ✓ | 10.8.2 | — |
| @tanstack/react-virtual | Content tree | ✗ (not yet installed) | — | None — must install |
| Tailwind v4 CSS file | All styling | ✗ (styles.css not yet created) | — | Wave 0 task |
| @testing-library/react | Component tests | ✓ (in devDependencies) | 16.3.2 | — |
| vitest-chrome | Chrome API mocks in tests | ✓ (in setup.ts) | 0.1.0 | — |

**Missing dependencies with no fallback:**
- `@tanstack/react-virtual` — must be installed before ContentTree.tsx can be implemented.
- `src/app/styles.css` — must be created with Tailwind import before any styling works.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (exists) |
| Setup file | `src/test/setup.ts` (imports vitest-chrome + jest-dom) |
| Quick run command | `npx vitest run src/store/ src/components/ src/utils/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Sidebar renders open/closed; overlay present on narrow viewport | unit | `npx vitest run src/components/Sidebar.test.tsx` | ❌ Wave 0 |
| UI-02 | SidebarGroup toggles open/closed; state persists | unit | `npx vitest run src/components/SidebarGroup.test.tsx` | ❌ Wave 0 |
| UI-03 | Search debounce: Zustand not updated until 150ms after last input | unit | `npx vitest run src/components/SearchGroup.test.tsx` | ❌ Wave 0 |
| UI-04 | Difficulty filter toggles; section filter toggles; counts update | unit | `npx vitest run src/components/DifficultyFilter.test.tsx` | ❌ Wave 0 |
| UI-05 | Expand all: all topicOpen keys set true; Collapse all: all set false | unit | `npx vitest run src/store/app.test.ts` | ❌ Wave 0 |
| UI-06 | Dark mode toggle: html.classList contains 'dark'; darkMode in store | unit | `npx vitest run src/store/app.test.ts` | ❌ Wave 0 |
| UI-07 | Skip link visible on focus; aria-expanded/pressed correct values | unit | `npx vitest run src/components/Sidebar.test.tsx` | ❌ Wave 0 |
| UI-08 | motion-reduce:transition-none present in sidebar className | unit | `npx vitest run src/components/Sidebar.test.tsx` | ❌ Wave 0 |
| UTIL | buildFlatRows: filters correctly; collapsed sections/topics excluded | unit | `npx vitest run src/utils/buildFlatRows.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/store/ src/utils/`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/store/app.test.ts` — covers UI-05, UI-06
- [ ] `src/utils/buildFlatRows.test.ts` — covers UTIL (filter logic, collapse logic)
- [ ] `src/components/Sidebar.test.tsx` — covers UI-01, UI-07, UI-08
- [ ] `src/components/SidebarGroup.test.tsx` — covers UI-02
- [ ] `src/components/SearchGroup.test.tsx` — covers UI-03
- [ ] `src/components/DifficultyFilter.test.tsx` — covers UI-04
- [ ] Coverage config update: add `src/store/**`, `src/utils/**` with 80% thresholds

> **Coverage threshold note:** The existing vitest.config.ts requires 100% coverage on `src/scoring/**` and `src/storage/**`. Phase 4 should NOT add `src/components/**` to the 100% threshold — component tests verify behavior, not branches. Add `src/store/**` and `src/utils/buildFlatRows.ts` at 90% threshold.

---

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this phase or product |
| V3 Session Management | No | No HTTP sessions; chrome.storage.local is extension-partitioned |
| V4 Access Control | No | Single-user, no roles |
| V5 Input Validation | Yes | Search query: rendered as text content via React (auto-escaped); no innerHTML, no eval |
| V6 Cryptography | No | No crypto operations in this phase |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via search input rendered in DOM | Tampering | React JSX auto-escapes all string values; never use `dangerouslySetInnerHTML` with user input |
| DOM clobbering via `id` attribute collision | Tampering | `<main id="main-content">` is the only id; all others use classes |
| Storage flooding via rapid filter state writes | Denial of Service | StorageAdapter 300ms debounce already implemented (Phase 3) |
| Dark mode class injection via URL params | Tampering | theme.ts reads only `chrome.storage.local`, not URL params or `document.cookie` |

---

## Sources

### Primary (MEDIUM confidence — Context7 provider)

- @tanstack/react-virtual v3.14.3 docs — useVirtualizer API, VirtualItem interface, measureElement pattern, React 19 useFlushSync flag [CITED: tanstack.com/virtual/latest/docs/api/virtualizer]
- Zustand 5.x TypeScript guide — create<T>()() curried form, subscribe(), getState() [CITED: zustand.docs.pmnd.rs/learn/guides/beginner-typescript]
- Tailwind v4 dark mode — @custom-variant dark, class strategy [CITED: tailwindcss.com/docs/dark-mode]
- Tailwind v4 reduced motion — motion-reduce: variant [CITED: tailwindcss.com/docs/transition-property]

### Secondary (MEDIUM — npm registry verified)

- @tanstack/react-virtual@3.14.3 — npm view confirms version 3.14.3, 16.6M/wk, github.com/TanStack/virtual [VERIFIED: npm registry]
- zustand@5.0.14 — npm view confirms version 5.0.14, 41.6M/wk, github.com/pmndrs/zustand [VERIFIED: npm registry]

### Tertiary (LOW confidence — WebSearch/WebFetch, marked for validation)

- MV3 CSP: `script-src 'self'` blocks inline scripts; external `<script type="module">` is allowed [CITED: developer.chrome.com/docs/extensions/reference/manifest/content-security-policy]
- FOUC via external theme.ts — logical derivation from CSP constraint; no existing blog post specifically covers this combination [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — all packages verified on npm registry; Tailwind/Zustand/React API patterns cited from official docs
- Architecture: MEDIUM — patterns derived from official docs and codebase analysis; flat-row model is well-established for useVirtualizer
- Pitfalls: MEDIUM — MV3 CSP confirmed from Chrome developer docs; Tailwind v4 @custom-variant verified from official docs; Set serialization is universally known JS behavior

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (30 days — all libraries are stable; @tanstack/react-virtual 3.x has been stable since 2023)
