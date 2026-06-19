# Phase 18: Icon Library - Pattern Map

**Mapped:** 2026-06-19
**Files analyzed:** 14 component files + 1 app file + 1 test file (16 total)
**Analogs found:** 14 / 14 (all modified files exist; no new files created)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/App.tsx` | component | request-response | `src/components/SidebarHeader.tsx` | exact (same ☰ button pattern) |
| `src/components/SidebarHeader.tsx` | component | request-response | `src/app/App.tsx` | exact (same ☰ + action button) |
| `src/components/ActionsGroup.tsx` | component | event-driven | `src/components/ActionsGroup.tsx` (self) | self-analog — 9 icons in one file |
| `src/components/QuestionCard.tsx` | component | event-driven | `src/components/SessionRow.tsx` | role-match (inline + dismiss icon combo) |
| `src/components/SearchGroup.tsx` | component | request-response | `src/components/StorageToast.tsx` | role-match (× dismiss button) |
| `src/components/SectionFilter.tsx` | component | request-response | `src/components/SectionFilter.tsx` (self) | self-analog (aria-hidden span icon) |
| `src/components/Sidebar.tsx` | component | request-response | `src/components/Sidebar.tsx` (self) | self-analog (icon prop string → JSX) |
| `src/components/SessionRow.tsx` | component | event-driven | `src/components/SessionRow.tsx` (self) | self-analog (✓ span + × delete) |
| `src/components/SectionRow.tsx` | component | event-driven | `src/components/TopicRow.tsx` | exact (same × remove button pattern) |
| `src/components/TopicRow.tsx` | component | event-driven | `src/components/SectionRow.tsx` | exact (same × remove button pattern) |
| `src/components/SessionSwitcherModal.tsx` | component | event-driven | `src/components/StorageToast.tsx` | role-match (× dismiss with aria-label) |
| `src/components/StorageToast.tsx` | component | event-driven | `src/components/MigrationErrorBanner.tsx` | exact (same dismiss toast/banner pattern) |
| `src/components/UndoToast.tsx` | component | event-driven | `src/components/StorageToast.tsx` | exact (same × dismiss toast) |
| `src/components/UpdateBanner.tsx` | component | event-driven | `src/components/MigrationErrorBanner.tsx` | exact (same × dismiss banner) |
| `src/components/TopicMarkDisplay.tsx` | component | event-driven | `src/components/SectionRow.tsx` | role-match (× clear/remove button) |
| `src/components/MigrationErrorBanner.tsx` | component | event-driven | `src/components/StorageToast.tsx` | exact (same dismiss pattern) |

---

## Pattern Assignments

### Pattern A: Standalone action button — `w-5 h-5` tier

**Files:** `src/app/App.tsx`, `src/components/SidebarHeader.tsx`, `src/components/ActionsGroup.tsx`

**Analog:** `src/app/App.tsx` lines 88–98, `src/components/SidebarHeader.tsx` lines 72–80, `src/components/ActionsGroup.tsx` lines 155–251

**Existing button structure (App.tsx lines 88–97):**
```tsx
<button
  type="button"
  aria-expanded={false}
  onClick={() => setSidebarOpen(true)}
  aria-label="Open sidebar"
  className="fixed top-2 left-2 z-50 p-2 min-h-[44px] min-w-[44px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded print:hidden"
>
  ☰
</button>
```

**After replacement — import at top of file, swap body:**
```tsx
import { Menu } from 'lucide-react';

<button
  type="button"
  aria-expanded={false}
  onClick={() => setSidebarOpen(true)}
  aria-label="Open sidebar"
  className="fixed top-2 left-2 z-50 p-2 min-h-[44px] min-w-[44px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded print:hidden"
>
  <Menu className="w-5 h-5" aria-hidden="true" />
</button>
```

**ActionsGroup btnBase buttons (lines 155–251) — same pattern, w-5 h-5:**
```tsx
// Existing (ActionsGroup.tsx line 155-164):
<button
  type="button"
  id="open-session-switcher"
  title="Switch session"
  aria-label="Switch session"
  onClick={() => sessionSwitcherRef.current?.showModal()}
  className={btnBase}
>
  🔄
</button>

// After — add named import, replace body only. Button element unchanged.
import { RefreshCw } from 'lucide-react';

<button ... className={btnBase}>
  <RefreshCw className="w-5 h-5" aria-hidden="true" />
</button>
```

**Conditional icon (darkMode toggle, ActionsGroup.tsx line 183):**
```tsx
// Existing:
{darkMode ? '☀' : '🌙'}

// After:
import { Sun, Moon } from 'lucide-react';

{darkMode
  ? <Sun className="w-5 h-5" aria-hidden="true" />
  : <Moon className="w-5 h-5" aria-hidden="true" />}
```

**Icon map for ActionsGroup (all w-5 h-5):**

| Char | Line | Import name |
|------|------|-------------|
| `🔄` | 163 | `RefreshCw` |
| `🤖` | 173 | `Bot` |
| `☀/🌙` | 183 | `Sun` / `Moon` |
| `↕` | 192 | `ChevronsUpDown` |
| `↔` | 201 | `ChevronsLeftRight` |
| `👁` | 211 | `Eye` |
| `📥` | 231 | `Download` |
| `📤` | 240 | `Upload` |
| `🗑` | 250 | `Trash2` |

---

### Pattern B: Inline icon in button — `w-4 h-4` tier

**Files:** `src/components/QuestionCard.tsx`, `src/components/SearchGroup.tsx`, `src/components/SectionRow.tsx`, `src/components/TopicRow.tsx`, `src/components/SessionRow.tsx`, `src/components/SessionSwitcherModal.tsx`, `src/components/StorageToast.tsx`, `src/components/UndoToast.tsx`, `src/components/UpdateBanner.tsx`, `src/components/TopicMarkDisplay.tsx`, `src/components/MigrationErrorBanner.tsx`

**Analog — StorageToast.tsx lines 24–31 (has aria-label, confirmed):**
```tsx
// Existing:
<button
  type="button"
  aria-label="Dismiss storage warning"
  onClick={() => setVisible(false)}
  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0"
>
  ×
</button>

// After — only the button body changes:
import { X } from 'lucide-react';

<button
  type="button"
  aria-label="Dismiss storage warning"
  onClick={() => setVisible(false)}
  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0"
>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

**Analog — SearchGroup.tsx lines 118–126 (clear button, confirmed):**
```tsx
// Existing:
<button
  type="button"
  aria-label="Clear search"
  onClick={handleClear}
  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  ×
</button>

// After:
import { X } from 'lucide-react';

<button ... >
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

**Analog — MigrationErrorBanner.tsx lines 34–41 (has aria-label confirmed):**
```tsx
// Existing:
<button
  type="button"
  aria-label="Dismiss migration error"
  onClick={onDismiss}
  className="text-amber-700 dark:text-yellow-300 hover:text-amber-900 dark:hover:text-yellow-100 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0 ml-3"
>
  ×
</button>
```

**Analog — SectionRow.tsx lines 33–40 (remove button):**
```tsx
// Existing:
<button
  type="button"
  aria-label={`Remove section ${row.label}`}
  onClick={() => removeSection(row.id)}
  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-4 py-3 print:hidden"
>
  ×
</button>

// After:
import { X } from 'lucide-react';

<button ... >
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

**Analog — QuestionCard.tsx lines 122–131 (Pencil note toggle, w-4 h-4):**
```tsx
// Existing:
<button
  type="button"
  aria-label={`Toggle note for ${question.q}`}
  aria-expanded={notesOpen}
  aria-controls={`notes-${questionId}`}
  onClick={() => setNotesOpen((prev) => !prev)}
  className={`p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${notesOpen || localNote ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
>
  📝
</button>

// After:
import { Pencil } from 'lucide-react';

<button ... >
  <Pencil className="w-4 h-4" aria-hidden="true" />
</button>
```

**SessionRow inline icons (lines 111, 119, 128 — all w-4 h-4):**
```tsx
// Existing (lines 104–130):
<button type="button" aria-label={`Rename ${session.name}`} ... >
  ✎
</button>
<button type="button" aria-label={`Duplicate ${session.name}`} ... >
  ⧉
</button>
<button type="button" aria-label={`Delete ${session.name}`} ... >
  ×
</button>

// After:
import { Pencil, Copy, X } from 'lucide-react';

<button ... aria-label={`Rename ${session.name}`}>
  <Pencil className="w-4 h-4" aria-hidden="true" />
</button>
<button ... aria-label={`Duplicate ${session.name}`}>
  <Copy className="w-4 h-4" aria-hidden="true" />
</button>
<button ... aria-label={`Delete ${session.name}`}>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

**aria-label status for × buttons (verified from codebase reads):**

| File | Line | aria-label | Status |
|------|------|-----------|--------|
| `StorageToast.tsx` | 30 | `"Dismiss storage warning"` | confirmed present |
| `MigrationErrorBanner.tsx` | 40 | `"Dismiss migration error"` | confirmed present |
| `UpdateBanner.tsx` | 123 | `"Dismiss update banner"` | confirmed present |
| `SearchGroup.tsx` | 124 | `"Clear search"` | confirmed present |
| `SectionRow.tsx` | 39 | `"Remove section {label}"` | confirmed present |
| `TopicRow.tsx` | 86 | `"Remove topic {name}"` | confirmed present |
| `SessionRow.tsx` | 128 | `"Delete {session.name}"` | confirmed present |
| `SessionSwitcherModal.tsx` | 100 | needs implementation-time check | verify |
| `UndoToast.tsx` | 36 | needs implementation-time check | verify |
| `QuestionCard.tsx` | 149 | needs implementation-time check | verify |
| `TopicMarkDisplay.tsx` | 116 | needs implementation-time check | verify |

---

### Pattern C: Decorative span wrapping icon (no aria-hidden on SVG itself)

**Files:** `src/components/SessionRow.tsx` (✓ checkmark), `src/components/SectionFilter.tsx` (📋 label icon)

**DEVIATION from D-08:** When an SVG icon is inside `<span aria-hidden="true">`, do NOT add `aria-hidden="true"` to the icon itself — the span already hides the whole subtree.

**Analog — SessionRow.tsx line 77–79:**
```tsx
// Existing:
<span className={checkmarkClass} aria-hidden="true">
  ✓
</span>

// After:
import { Check } from 'lucide-react';

<span className={checkmarkClass} aria-hidden="true">
  <Check className="w-4 h-4" />
</span>
// NOTE: NO aria-hidden="true" on <Check> — span handles it
```

**Analog — SectionFilter.tsx line 44:**
```tsx
// Existing:
<span aria-hidden="true" className="mr-1">📋</span>

// After:
import { ClipboardList } from 'lucide-react';

<span aria-hidden="true" className="mr-1">
  <ClipboardList className="w-4 h-4" />
</span>
// NOTE: NO aria-hidden="true" on <ClipboardList> — span handles it
```

---

### Pattern D: Icon prop migration (string → ReactNode)

**File:** `src/components/Sidebar.tsx`

**Analog — Sidebar.tsx lines 35–73 (all four SidebarGroup icon props):**
```tsx
// Existing (lines 35–43):
<SidebarGroup
  groupId="search"
  label="Search"
  icon="🔍"
  isOpen={groupOpen.search ?? true}
  onToggle={() => toggleGroup('search')}
>
  <SearchGroup />
</SidebarGroup>

// After — add lucide imports, change icon="..." to icon={<JSX />}:
import { Search, Target, ClipboardList, Zap } from 'lucide-react';

<SidebarGroup
  groupId="search"
  label="Search"
  icon={<Search className="w-5 h-5" aria-hidden="true" />}
  isOpen={groupOpen.search ?? true}
  onToggle={() => toggleGroup('search')}
>
  <SearchGroup />
</SidebarGroup>

<SidebarGroup
  groupId="difficulty"
  label="Difficulty"
  icon={<Target className="w-5 h-5" aria-hidden="true" />}
  ...
>

<SidebarGroup
  groupId="sections"
  label="Sections"
  icon={<ClipboardList className="w-5 h-5" aria-hidden="true" />}
  ...
>

<SidebarGroup
  groupId="actions"
  label="Actions"
  icon={<Zap className="w-5 h-5" aria-hidden="true" />}
  ...
>
```

**SidebarGroup already accepts `icon?: ReactNode` (verified) — no prop type change needed. The span wrapper `<span aria-hidden="true">{icon}</span>` is already in SidebarGroup.tsx line 31 — no aria-hidden on the SVG itself.**

---

### Pattern E: SidebarHeader — two button icons (☰ + 👤)

**File:** `src/components/SidebarHeader.tsx`

**Analog — SidebarHeader.tsx lines 72–90:**
```tsx
// Existing:
<button
  type="button"
  aria-expanded={sidebarOpen}
  aria-label="Close sidebar"
  className="p-2 min-h-[44px] min-w-[44px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
  onClick={() => setSidebarOpen(false)}
>
  ☰
</button>
<button
  type="button"
  id="open-candidate-modal"
  aria-label="Candidate details"
  title="Candidate details"
  className="ml-auto p-2 min-h-[44px] min-w-[44px] ..."
  onClick={onCandidateClick}
>
  👤
</button>

// After:
import { Menu, User } from 'lucide-react';

<button ... aria-label="Close sidebar">
  <Menu className="w-5 h-5" aria-hidden="true" />
</button>
<button ... aria-label="Candidate details">
  <User className="w-5 h-5" aria-hidden="true" />
</button>
```

---

### Pattern F: Test fix — `getByText('✓')` → DOM query

**File:** `src/components/SessionRow.test.tsx` (lines 85, 101)

**Pattern from RESEARCH.md pitfall 2:**
```tsx
// Existing broken pattern (SessionRow.test.tsx lines 85, 101):
screen.getByText('✓')   // <-- breaks after Check SVG replacement

// Replacement pattern A (query span by aria-hidden inside the li):
const li = document.getElementById('session-row-session-1');
const checkSpan = li?.querySelector('[aria-hidden="true"]');
expect(checkSpan?.className).toContain('text-blue-600');

// Replacement pattern B (container.querySelector):
const { container } = render(<SessionRow ... />);
const checkSpan = container.querySelector('[aria-hidden="true"]');
expect(checkSpan?.className).toContain('text-blue-600');
```

---

## Shared Patterns

### Import Convention
**Apply to:** All 14 modified component files
```tsx
// Named imports only — one import statement per file listing all icons used
import { Menu, User } from 'lucide-react';           // SidebarHeader
import { X } from 'lucide-react';                    // any × file
import { RefreshCw, Bot, Sun, Moon, ... } from 'lucide-react';  // ActionsGroup

// NEVER:
import * as Icons from 'lucide-react';  // defeats tree-shaking
```

### Icon className Rule
**Apply to:** All 14 modified component files
```tsx
// ONLY sizing classes — no color classes on the icon itself
<X className="w-4 h-4" aria-hidden="true" />          // inline icons
<Menu className="w-5 h-5" aria-hidden="true" />        // action buttons

// NEVER add text-* color to the icon:
<X className="w-4 h-4 text-red-500" />  // WRONG — breaks hover/dark transitions
```

### aria-hidden Placement
**Apply to:** All 14 modified component files
```tsx
// Case 1: Icon directly inside <button> — aria-hidden on the SVG
<button aria-label="Close">
  <X className="w-4 h-4" aria-hidden="true" />
</button>

// Case 2: Icon inside <span aria-hidden="true"> — NO aria-hidden on SVG
<span aria-hidden="true">
  <Check className="w-4 h-4" />
</span>
```

### Existing Button Wrapper Unchanged
**Apply to:** All 14 modified component files

The `<button>` element — its `type`, `aria-label`, `aria-expanded`, `aria-pressed`, `onClick`, `className`, and all other attributes — is NOT changed. Only the text/emoji body is replaced with the Lucide JSX element. This minimizes diff noise and test surface.

### Color Inheritance
**Source:** Anti-patterns documented in RESEARCH.md

Lucide icons use `currentColor` for stroke by default. The parent button's `text-*` class determines icon color. Hover and dark-mode transitions on the button cascade to the icon automatically. No special handling required — just don't add color classes to the icon itself.

---

## Full Replacement Map (implementation reference)

| File | Char | Line | Lucide import | Size | aria-hidden on SVG? |
|------|------|------|--------------|------|---------------------|
| `src/app/App.tsx` | `☰` | 96 | `Menu` | `w-5 h-5` | yes |
| `src/components/SidebarHeader.tsx` | `☰` | 79 | `Menu` | `w-5 h-5` | yes |
| `src/components/SidebarHeader.tsx` | `👤` | 89 | `User` | `w-5 h-5` | yes |
| `src/components/QuestionCard.tsx` | `📝` | 130 | `Pencil` | `w-4 h-4` | yes |
| `src/components/QuestionCard.tsx` | `×` | 149 | `X` | `w-4 h-4` | yes |
| `src/components/SectionFilter.tsx` | `📋` | 44 | `ClipboardList` | `w-4 h-4` | NO (span wraps it) |
| `src/components/Sidebar.tsx` | `🔍` | 38 | `Search` | `w-5 h-5` | NO (SidebarGroup span) |
| `src/components/Sidebar.tsx` | `🎯` | 48 | `Target` | `w-5 h-5` | NO (SidebarGroup span) |
| `src/components/Sidebar.tsx` | `📋` | 58 | `ClipboardList` | `w-5 h-5` | NO (SidebarGroup span) |
| `src/components/Sidebar.tsx` | `⚡` | 68 | `Zap` | `w-5 h-5` | NO (SidebarGroup span) |
| `src/components/ActionsGroup.tsx` | `🔄` | 163 | `RefreshCw` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `🤖` | 173 | `Bot` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `☀/🌙` | 183 | `Sun`/`Moon` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `↕` | 192 | `ChevronsUpDown` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `↔` | 201 | `ChevronsLeftRight` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `👁` | 211 | `Eye` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `📥` | 231 | `Download` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `📤` | 240 | `Upload` | `w-5 h-5` | yes |
| `src/components/ActionsGroup.tsx` | `🗑` | 250 | `Trash2` | `w-5 h-5` | yes |
| `src/components/SessionRow.tsx` | `✓` | 78 | `Check` | `w-4 h-4` | NO (span wraps it) |
| `src/components/SessionRow.tsx` | `✎` | 111 | `Pencil` | `w-4 h-4` | yes |
| `src/components/SessionRow.tsx` | `⧉` | 119 | `Copy` | `w-4 h-4` | yes |
| `src/components/SessionRow.tsx` | `×` | 128 | `X` | `w-4 h-4` | yes |
| `src/components/SearchGroup.tsx` | `×` | 124 | `X` | `w-4 h-4` | yes |
| `src/components/SectionRow.tsx` | `×` | 39 | `X` | `w-4 h-4` | yes |
| `src/components/TopicRow.tsx` | `×` | 86 | `X` | `w-4 h-4` | yes |
| `src/components/SessionSwitcherModal.tsx` | `×` | 100 | `X` | `w-4 h-4` | yes |
| `src/components/StorageToast.tsx` | `×` | 30 | `X` | `w-4 h-4` | yes |
| `src/components/UndoToast.tsx` | `×` | 36 | `X` | `w-4 h-4` | yes |
| `src/components/UpdateBanner.tsx` | `×` | 123 | `X` | `w-4 h-4` | yes |
| `src/components/TopicMarkDisplay.tsx` | `×` | 116 | `X` | `w-4 h-4` | yes |
| `src/components/MigrationErrorBanner.tsx` | `×` | 40 | `X` | `w-4 h-4` | yes |

---

## No Analog Found

No files fall in this category — all 14 modified files are existing components in the codebase. No new files are created in this phase.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`
**Files read:** App.tsx, SidebarHeader.tsx, ActionsGroup.tsx, Sidebar.tsx, SessionRow.tsx, QuestionCard.tsx, SearchGroup.tsx, SectionFilter.tsx, SectionRow.tsx, TopicRow.tsx, StorageToast.tsx, MigrationErrorBanner.tsx, UpdateBanner.tsx
**Pattern extraction date:** 2026-06-19
