---
phase: 12-uat-defect-cleanup
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/app/App.tsx
  - src/components/ActionsGroup.tsx
  - src/components/QuestionCard.tsx
  - src/components/SessionSwitcherModal.tsx
  - src/components/Sidebar.test.tsx
  - src/components/Sidebar.tsx
  - src/components/SidebarGroup.tsx
  - src/components/TopicMarkDisplay.tsx
  - src/components/TopicRow.tsx
  - src/store/app.ts
  - src/test/phase-12-defects.test.tsx
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-06-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 12 fixes UAT defects across session management, note suppression, sidebar group icons, and action button tooltips. The overall implementation is sound. Two critical issues were found: a stale local state bug in `TopicMarkDisplay` that causes the override input to display wrong values after an external override change (e.g. session switch), and a type mismatch in a test fixture that causes `DIFFICULTY_COEFFICIENTS` to return `undefined` and silently break the scoring path under test. Four warnings cover a manifest `activeSessionId` transient inconsistency in `createSession`, a missing `useEffect` sync in `TopicMarkDisplay`, an incorrect ARIA role tree in `SessionSwitcherModal`, and a weak test assertion in UI-10. Two info items cover an unused `groupId` prop in `SidebarGroup` and a miscount comment in the test file.

---

## Critical Issues

### CR-01: `TopicMarkDisplay` override input goes stale after external override change

**File:** `src/components/TopicMarkDisplay.tsx:45-47`

**Issue:** `overrideInput` local state is initialised from `override` once via `useState`, but there is no `useEffect` to re-sync it when `override` changes from outside the component (session switch, undo-delete, YAML import). After any of those operations the number `<input>` will show the previous session's override value while the store holds the new value. Because `onBlur` fires `setOverride` with the stale displayed value it can silently write the wrong override into the newly loaded session.

```tsx
// current — stale after session switch
const [overrideInput, setOverrideInput] = useState<string>(
  override !== null ? String(override) : '',
);
```

**Fix:** Add a synchronising effect:

```tsx
useEffect(() => {
  setOverrideInput(override !== null ? String(override) : '');
}, [override]);
```

---

### CR-02: Test fixture uses `'junior'` — an invalid `Difficulty` value — causing silent scoring failure

**File:** `src/test/phase-12-defects.test.tsx:59`

**Issue:** The `mockTopic` fixture for the SCORE-07 tests uses `level: 'junior' as const`. The `Difficulty` union is `'novice' | 'intermediate' | 'advanced' | 'expert'`; `'junior'` is not a member. TypeScript would catch this without the `as const` escape hatch. At runtime `DIFFICULTY_COEFFICIENTS['junior']` returns `undefined`, so `coef * score` produces `NaN`, `coeffSum` never advances, and `computeTopicMark` returns `mark: null` for every question in this fixture. Any future test that asserts on the computed mark against this topic will silently pass with incorrect data. Additionally, `TopicMarkDisplay` renders `—` (no mark) instead of a numeric value, which may mask rendering assertions.

```ts
// line 59 — 'junior' is not a valid Difficulty
{ q: 'What is closure?', level: 'junior' as const },
```

**Fix:** Replace with a valid difficulty level:

```ts
{ q: 'What is closure?', level: 'intermediate' as const },
```

---

## Warnings

### WR-01: `createSession` sets manifest without updating `manifest.activeSessionId` when a manifest already exists

**File:** `src/store/app.ts:402-409`

**Issue:** When `state.manifest` is not null (all invocations after the very first session is created), `createSession` builds `updatedManifest` by spreading the existing manifest — which preserves the old `activeSessionId` in the manifest object. The manifest is written to storage via the `subscribe` block immediately after `set({ manifest: updatedManifest })` at line 409. The subsequent `switchSession` call (line 412) does update `manifest.activeSessionId` atomically, but there is a window where the persisted manifest records the wrong `activeSessionId`. If the extension is reloaded between the two `set()` calls (e.g. a crash or forced reload triggered by a browser update during the async gap), bootstrap will load the old active session rather than the newly created one.

```ts
// line 402-409: old activeSessionId is preserved in the spread
const updatedManifest: V2Manifest = state.manifest
  ? { ...state.manifest, sessions: [...state.manifest.sessions, newMeta] }
  : { version: 2, activeSessionId: id, sessions: [newMeta] };
set({ manifest: updatedManifest });
await useAppStore.getState().switchSession(id); // updates activeSessionId later
```

**Fix:** Set `activeSessionId` to `id` in the spread branch as well, so the manifest written at line 409 is already consistent:

```ts
const updatedManifest: V2Manifest = state.manifest
  ? { ...state.manifest, activeSessionId: id, sessions: [...state.manifest.sessions, newMeta] }
  : { version: 2, activeSessionId: id, sessions: [newMeta] };
```

---

### WR-02: `SessionSwitcherModal` uses `role="listbox"` with interactive child buttons — invalid ARIA tree

**File:** `src/components/SessionSwitcherModal.tsx:104-108`

**Issue:** The `<ul>` is given `role="listbox"` and `aria-activedescendant`. The children (`SessionRow`) render `<li role="option">` elements, but each `<li>` contains focusable `<button>` elements (Switch, Rename, Duplicate, Delete). The ARIA spec for `listbox` requires `option` children to be non-interactive leaf nodes; placing interactive controls inside `option` elements is invalid and produces accessibility tree errors in screen readers and automated a11y checkers. `aria-activedescendant` also only works reliably when the listbox element itself receives keyboard focus, not child buttons.

**Fix:** Remove `role="listbox"` / `role="option"` and use a plain `<ul>` / `<li>` with appropriate focus management. If selection semantics are needed, adopt a `role="menu"` / `role="menuitem"` pattern (which allows nested interactive controls) or a custom composite widget.

```tsx
// Replace:
<ul role="listbox" aria-label="Sessions" aria-activedescendant={...}>
  ...
// With:
<ul aria-label="Sessions">
  ...
```

---

### WR-03: `SidebarGroup` accepts a `groupId` prop but never uses it — no `id` or `aria-controls` wiring

**File:** `src/components/SidebarGroup.tsx:4,12-18`

**Issue:** `SidebarGroupProps` declares `groupId: string` and callers pass values (`"search"`, `"difficulty"`, etc.), but the component destructures only `{ label, icon, isOpen, onToggle, children }` — `groupId` is silently discarded. As a result the toggle button has `aria-expanded` but no `aria-controls` pointing at the collapsible region, and the region has no `id`. `aria-expanded` without `aria-controls` provides less information to assistive technologies than the full pattern.

**Fix:** Wire `groupId` to generate the `id`/`aria-controls` pair:

```tsx
export function SidebarGroup({ groupId, label, icon, isOpen, onToggle, children }: SidebarGroupProps) {
  const regionId = `sidebar-group-${groupId}`;
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={regionId}
        onClick={onToggle}
        ...
      >
        ...
      </button>
      {isOpen && <div id={regionId} className="px-4 pb-3">{children}</div>}
    </div>
  );
}
```

---

### WR-04: UI-10 test assertion `toBeGreaterThanOrEqual(11)` is too weak to catch regressions

**File:** `src/test/phase-12-defects.test.tsx:622`

**Issue:** The test that checks all ActionsGroup buttons have a `title` attribute counts buttons with a non-empty `title` and asserts there are `>= 11`. If a button's `title` is accidentally removed, the count drops to 10 but the assertion still passes if child modal buttons happen to have titles — the lower bound does not enforce that all 11 specific action buttons retain their titles. The test can pass even when the feature it covers is broken.

**Fix:** Assert the exact count, and/or iterate all buttons expected to have `title` and assert each one individually:

```ts
expect(buttonsWithTitle.length).toBe(11);
```

Or use `screen.getByRole('button', { name: '...' })` for each expected button and assert `getAttribute('title')` directly.

---

## Info

### IN-01: `markedTopicIds` memo dependency does not include custom question scores

**File:** `src/app/App.tsx:38-50`

**Issue:** `markedTopicIds` iterates `DEFAULT_SECTIONS` only — it does not account for custom questions appended to a topic. A topic whose only scored questions are custom ones will not be added to `markedTopicIds`, so the `hideMarked` filter will not hide it even though a mark is visible in `TopicMarkDisplay`. The `useMemo` dependency array is `[scores]` which is correct given the current implementation, but the implementation itself is incomplete with respect to custom questions. This is a minor behavioral gap rather than a crash.

---

### IN-02: `TopicMarkDisplay` comment on line 60 references `overrideInput` but never uses it — misleading

**File:** `src/components/TopicMarkDisplay.tsx:59-61`

**Issue:** The `handleOverrideBlur` function contains the comment `// Use controlled state (overrideInput) OR fallback to e.target.value` but then reads only `e.target.value` and never reads `overrideInput`. The comment implies a deliberate choice between two sources, but the local state is not consulted. This is a documentation inaccuracy that may mislead future maintainers into believing `overrideInput` is used for blur logic.

```ts
function handleOverrideBlur(e: React.FocusEvent<HTMLInputElement>) {
  // Use controlled state (overrideInput) OR fallback to e.target.value  ← misleading
  const val = e.target.value;  // overrideInput is never read here
```

**Fix:** Remove the misleading comment or change the logic to actually use `overrideInput` (which would also be more resilient to synthetic events).

---

_Reviewed: 2026-06-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
