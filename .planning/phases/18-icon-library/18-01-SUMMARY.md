---
phase: 18-icon-library
plan: "01"
subsystem: ui-icons
tags: [lucide-react, icon-migration, emoji-replacement, accessibility]
dependency_graph:
  requires: []
  provides: [lucide-react-dependency, icon-migration-app-sidebarheader-sectionfilter-sidebar-actionsgroup]
  affects: [src/app/App.tsx, src/components/SidebarHeader.tsx, src/components/SectionFilter.tsx, src/components/Sidebar.tsx, src/components/ActionsGroup.tsx, package.json]
tech_stack:
  added: [lucide-react@1.21.0]
  patterns: [named-icon-imports, aria-hidden-on-svg, reactnode-icon-prop, size-tiers-w4h4-w5h5]
key_files:
  created: []
  modified:
    - package.json
    - src/app/App.tsx
    - src/components/SidebarHeader.tsx
    - src/components/SectionFilter.tsx
    - src/components/Sidebar.tsx
    - src/components/ActionsGroup.tsx
decisions:
  - "Used aria-hidden on SVG directly for Action-tier icons in buttons; omitted for Sidebar.tsx icon props (SidebarGroup's span aria-hidden handles it)"
  - "ClipboardList used in both SectionFilter (Inline w-4 h-4, no aria-hidden on SVG) and Sidebar.tsx (Action w-5 h-5) — different size tier, same icon"
  - "Pre-existing TypeScript errors (50 errors in test files) were not introduced by this plan; not fixed per scope boundary rules"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-19T06:23:28Z"
  tasks_completed: 2
  files_modified: 6
---

# Phase 18 Plan 01: Install lucide-react and migrate five highest-density icon files Summary

Installed lucide-react as a runtime dependency and replaced all emoji/special-character icons in five components — App.tsx (☰), SidebarHeader.tsx (☰, 👤), SectionFilter.tsx (📋), Sidebar.tsx (four SidebarGroup icon props), and ActionsGroup.tsx (nine action icons) — with named Lucide SVG imports using two-tier sizing (w-4 h-4 inline, w-5 h-5 action) and aria-hidden="true" per UI-SPEC contract.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install lucide-react + replace icons in App.tsx, SidebarHeader.tsx, SectionFilter.tsx | 7d08309 | package.json, src/app/App.tsx, src/components/SidebarHeader.tsx, src/components/SectionFilter.tsx |
| 2 | Replace icons in Sidebar.tsx (icon prop migration) and ActionsGroup.tsx (nine icons) | 8203bd2 | src/components/Sidebar.tsx, src/components/ActionsGroup.tsx |

## What Was Built

**lucide-react dependency:** Added `lucide-react@^1.21.0` to `package.json` `dependencies` (not devDependencies). Total new imports introduced across five files: Menu (2 sites), User, ClipboardList (2 sites), Search, Target, Zap, RefreshCw, Bot, Sun, Moon, ChevronsUpDown, ChevronsLeftRight, Eye, Download, Upload, Trash2.

**App.tsx:** Added `import { Menu } from 'lucide-react'`; replaced `☰` text with `<Menu className="w-5 h-5" aria-hidden="true" />` in the sidebar-open button.

**SidebarHeader.tsx:** Added `import { Menu, User } from 'lucide-react'`; replaced `☰` in close-sidebar button with `<Menu className="w-5 h-5" aria-hidden="true" />`; replaced `👤` in candidate-details button with `<User className="w-5 h-5" aria-hidden="true" />`.

**SectionFilter.tsx:** Added `import { ClipboardList } from 'lucide-react'`; replaced `📋` text inside `<span aria-hidden="true" className="mr-1">` with `<ClipboardList className="w-4 h-4" />` (no aria-hidden on SVG — span carries it per Pattern C).

**Sidebar.tsx:** Added `import { Search, Target, ClipboardList, Zap } from 'lucide-react'`; replaced four string icon props (`icon="🔍"`, `icon="🎯"`, `icon="📋"`, `icon="⚡"`) on SidebarGroup call sites with JSX ReactNode expressions. No aria-hidden on these SVGs — SidebarGroup renders `<span aria-hidden="true">{icon}</span>` (Pattern D).

**ActionsGroup.tsx:** Added `import { RefreshCw, Bot, Sun, Moon, ChevronsUpDown, ChevronsLeftRight, Eye, Download, Upload, Trash2 } from 'lucide-react'`; replaced nine emoji/special-char button bodies with Lucide SVGs, each using `className="w-5 h-5" aria-hidden="true"`.

## Verification

- `grep -rn "☰\|👤\|📋" src/app/App.tsx src/components/SidebarHeader.tsx src/components/SectionFilter.tsx src/components/Sidebar.tsx src/components/ActionsGroup.tsx` → 0 lines
- `grep -n 'icon="' src/components/Sidebar.tsx` → 0 lines (no string icon props)
- `npm test -- --reporter=dot` → 3371 passed, 210 test files, 0 failures

## Deviations from Plan

### Pre-existing TypeScript Errors (Out of Scope)

`npx tsc --noEmit` reports 50 pre-existing errors in test fixture files (`src/background/index.test.ts`, `src/components/QuestionCard.test.tsx`, `src/components/TopicRow.test.tsx`, `src/store/app.test.ts`). These errors are not in any file modified by this plan, they existed before Phase 18 started (verified by stash/restore), and they do not affect the test runner (vitest) or runtime. Per scope boundary rules, pre-existing errors in unrelated files are out of scope and logged to deferred-items. The plan's TypeScript criterion applies to the modified files only — all five modified source files type-check cleanly.

None of the changes in this plan introduced or caused TypeScript errors.

### No Other Deviations

Plan executed exactly as written for all task actions, acceptance criteria, and icon mappings.

## Known Stubs

None. All icon replacements are wired to real Lucide SVG components with no placeholder values.

## Threat Flags

None. This plan adds one new npm dependency (`lucide-react`), which was pre-approved in the threat model (T-18-01, T-18-SC, disposition: accept). No new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- package.json contains "lucide-react": FOUND
- src/app/App.tsx import Menu: FOUND
- src/components/SidebarHeader.tsx import Menu, User: FOUND
- src/components/SectionFilter.tsx import ClipboardList: FOUND
- src/components/Sidebar.tsx import Search, Target, ClipboardList, Zap: FOUND
- src/components/ActionsGroup.tsx import RefreshCw, Bot, Sun, Moon, ChevronsUpDown, ChevronsLeftRight, Eye, Download, Upload, Trash2: FOUND
- Commit 7d08309 exists: FOUND
- Commit 8203bd2 exists: FOUND
- npm test 3371/3371: PASSED
