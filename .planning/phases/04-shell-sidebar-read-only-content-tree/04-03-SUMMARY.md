---
phase: 04-shell-sidebar-read-only-content-tree
plan: 03
subsystem: ui-shell
tags: [react, tailwind-v4, zustand, chrome-extension, accessibility, aria, dark-mode, store-hydration]

requires:
  - phase: 04-shell-sidebar-read-only-content-tree
    plan: 01
    provides: "useAppStore Zustand store, buildFlatRows utility, VirtualRow types, styles.css dark mode"
  - phase: 04-shell-sidebar-read-only-content-tree
    plan: 02
    provides: "Sidebar, ContentTree, StorageToast components fully implemented and tested"

provides:
  - "src/app/App.tsx — Full shell layout: skip link, sidebar backdrop, <aside> Sidebar, sidebar toggle button with aria-expanded, <main id=main-content> ContentTree, StorageToast"
  - "src/app/main.tsx — Zustand store hydration from bootstrap() uiState; Sets reconstructed as Set<Difficulty> and Set<string> from stored arrays"
  - "199 tests passing; npm run ci exits 0; npm run build exits 0"

affects:
  - Phase 5 scoring (App.tsx is the shell that Phase 5 adds scoring inputs inside)
  - All future phases that compose the shell

tech-stack:
  added: []
  patterns:
    - "App.tsx as pure composition layer: reads store, calls buildFlatRows, passes rows to ContentTree"
    - "Sidebar reads all state from store directly — no props passthrough needed"
    - "Store hydration pattern: (initialState as Record<string, unknown>).uiState cast to Partial<AppState> with Set reconstruction"
    - "Set<Difficulty> typed cast required for tsc strict mode — uiState.selectedDifficulties cast as Difficulty[] not string[]"

key-files:
  created: []
  modified:
    - "src/app/App.tsx — 65 lines; full shell layout replacing Phase 1 placeholder"
    - "src/app/main.tsx — 40 lines; added store hydration from bootstrap() uiState"

key-decisions:
  - "Sidebar takes no props — reads all state (sidebarOpen, groupOpen, etc.) from useAppStore directly; App.tsx does not pass resultCount/totalCount because SearchGroup hardcodes TOTAL_QUESTIONS=1067"
  - "selectedDifficulties uses Set<Difficulty> typed constructor to satisfy tsc strict mode — cast stored array as Difficulty[] not string[]"
  - "styles.css import placed first in App.tsx per plan requirement to ensure Tailwind CSS loads before component styles"

requirements-completed: [UI-01, UI-02, UI-06, UI-07, UI-08]

duration: ~10 min
completed: 2026-06-17
---

# Phase 04, Plan 03: App.tsx Shell Layout + main.tsx Store Hydration Summary

**Full shell layout composing Sidebar, ContentTree, and StorageToast in App.tsx; useAppStore hydrated from bootstrap() uiState with Set reconstruction in main.tsx**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-17T09:50:00Z
- **Completed:** 2026-06-17T09:57:00Z
- **Tasks:** 1 automated (Task 2 is human smoke test checkpoint — pending)
- **Files modified:** 2 (src/app/App.tsx, src/app/main.tsx)

## Accomplishments

- Replaced Phase 1 `App.tsx` placeholder with full shell layout: skip link + sidebar backdrop + `<Sidebar />` + sidebar toggle button + `<main id="main-content">` + `<ContentTree rows={rows} />` + `<StorageToast />`
- `main.tsx`: replaced `_initialState` TODO stub with `useAppStore.setState()` hydration from `bootstrap()` result; `Set<Difficulty>` and `Set<string>` reconstructed from stored arrays — T-04-03-01 mitigated
- All 199 tests pass (no regressions from Wave 1 and Wave 2)
- `npm run ci` (biome + tsc --noEmit) exits 0
- `npm run build` exits 0 (339 kB bundle)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| Task 1 | Wire App.tsx shell layout + main.tsx store hydration | `66ecbf9` | src/app/App.tsx, src/app/main.tsx |

Task 2 (human smoke test) is a checkpoint — pending human verification.

## Files Created/Modified

- `src/app/App.tsx` — 65 lines; full shell layout: skip link, backdrop, Sidebar, toggle button, main#main-content, ContentTree, StorageToast; `import './styles.css'` is first import
- `src/app/main.tsx` — 40 lines; Zustand store hydration from bootstrap() uiState; Sets reconstructed with proper typed casts

## Decisions Made

- **Sidebar no-props pattern:** `Sidebar` reads all store state internally (sidebarOpen, groupOpen, setSidebarOpen, toggleGroup). `SearchGroup` hardcodes `TOTAL_QUESTIONS = 1067`. App.tsx does not pass `resultCount`/`totalCount` props — they are not part of the actual component interfaces from Plan 02.
- **Set<Difficulty> typed cast:** TypeScript strict mode rejects `new Set(string[])` where `Set<Difficulty>` is expected. Fixed by casting the stored array as `Difficulty[]` and using the typed `new Set<Difficulty>(...)` constructor.
- **Biome import ordering:** Biome requires `type` imports before value imports, and alphabetical ordering within groups. Applied via `biome check --write --unsafe` after initial write.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error: Set<string> not assignable to Set<Difficulty>**
- **Found during:** Task 1 — `npm run ci` tsc phase
- **Issue:** `new Set((uiState.selectedDifficulties as string[] | undefined) ?? [])` produces `Set<string>`, which is incompatible with `Set<Difficulty>` in AppState. Plan noted to use `as unknown as Partial<AppState>` if needed — instead used typed cast on array.
- **Fix:** Changed to `new Set<Difficulty>((uiState.selectedDifficulties as Difficulty[] | undefined) ?? [])` with `import type { Difficulty }` from data bank
- **Files modified:** `src/app/main.tsx`
- **Committed in:** `66ecbf9` (Task 1)

**2. [Rule 1 - Bug] Biome import ordering violations in both files**
- **Found during:** Task 1 — `npm run ci` biome phase
- **Issue:** App.tsx had wrong import order (CSS first, then data/bank before components); main.tsx had type imports interspersed with value imports
- **Fix:** Ran `biome format --write` then `biome check --write --unsafe` to apply correct ordering
- **Files modified:** `src/app/App.tsx`, `src/app/main.tsx`
- **Committed in:** `66ecbf9` (Task 1)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — type correctness and lint correctness)
**Impact on plan:** Both auto-fixes necessary for correctness/CI compliance. No scope creep.

## Known Stubs

None. App.tsx is fully wired:
- `buildFlatRows` receives live store state and returns rows to `ContentTree`
- `Sidebar` composes all 4 SidebarGroups reading from store
- `StorageToast` listens to `storage-quota-warning` event
- `useAppStore.setState` hydrates from `bootstrap()` before React mounts

## Threat Flags

No new security-relevant surface beyond the plan's threat model:
- T-04-03-01 (bootstrap uiState tampering): `Partial<AppState>` cast + `Set(array ?? [])` — malformed non-iterable produces empty Set, not a crash — IMPLEMENTED
- T-04-03-02 (skip link href): Internal anchor `#main-content` — no user-supplied href — ACCEPTED
- T-04-03-03 (backdrop click): Closes UI state only — ACCEPTED

## Self-Check

Files exist:
- src/app/App.tsx: FOUND (65 lines, contains `<a href="#main-content">` and `<main id="main-content">`)
- src/app/main.tsx: FOUND (40 lines, contains `useAppStore.setState`)

Commits in git log:
- 66ecbf9: FOUND (Task 1)

Test suite: 199 tests, 17 test files — ALL PASS
CI: biome ci + tsc --noEmit — EXIT 0
Build: npm run build — EXIT 0

## Self-Check: PASSED

## Next Phase Readiness

- Phase 5 scoring: `App.tsx` shell is the mounting point — Phase 5 adds scoring inputs to `QuestionCard` and wires scoring state to `SectionFilter` mark display
- Human smoke test (Task 2): `npm run build` complete, `dist/` ready for Chrome extension loading
- All Phase 4 automated work complete; only human verification remains

---
*Phase: 04-shell-sidebar-read-only-content-tree*
*Plan: 03*
*Completed: 2026-06-17 (automated tasks); pending human smoke test*
