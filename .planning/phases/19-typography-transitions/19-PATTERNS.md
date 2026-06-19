# Phase 19: Typography & Transitions - Pattern Map

**Mapped:** 2026-06-19
**Files analyzed:** 22 (20 component files + styles.css + 2 test files)
**Analogs found:** 22 / 22

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/styles.css` | config/CSS | event-driven | `src/app/styles.css` (self — extend existing pattern) | exact |
| `src/components/SidebarGroup.tsx` | component | event-driven | `src/components/SidebarGroup.tsx` (self — in-place edit) | exact |
| `src/components/SidebarGroup.test.tsx` | test | request-response | `src/components/SidebarGroup.test.tsx` (self — update assertion) | exact |
| `src/components/QuestionCard.tsx` | component | event-driven | `src/components/QuestionCard.tsx` (self — in-place edit) | exact |
| `src/components/QuestionCard.test.tsx` | test | request-response | `src/components/QuestionCard.test.tsx` (self — update assertion) | exact |
| `src/components/TopicRow.tsx` | component | event-driven | `src/components/TopicRow.tsx` (self — in-place edit) | exact |
| `src/components/SectionRow.tsx` | component | event-driven | `src/components/SectionRow.tsx` (self — in-place edit) | exact |
| `src/components/SectionFilter.tsx` | component | request-response | `src/components/SectionFilter.tsx` (self) | exact |
| `src/components/ContentTree.tsx` | component | event-driven | `src/components/ContentTree.tsx` (self) | exact |
| `src/components/ActionsGroup.tsx` | component | request-response | `src/components/ActionsGroup.tsx` (self) | exact |
| `src/components/SessionRow.tsx` | component | event-driven | `src/components/SessionRow.tsx` (self) | exact |
| `src/components/CandidateModal.tsx` | component | request-response | `src/components/CandidateModal.tsx` (self) | exact |
| `src/components/ImportPreviewModal.tsx` | component | request-response | `src/components/CandidateModal.tsx` | role-match |
| `src/components/AiPromptModal.tsx` | component | request-response | `src/components/CandidateModal.tsx` | role-match |
| `src/components/AddTopicForm.tsx` | component | request-response | `src/components/AddTopicForm.tsx` (self) | exact |
| `src/components/AddSectionForm.tsx` | component | request-response | `src/components/AddSectionForm.tsx` (self) | exact |
| `src/components/AboutModal.tsx` | component | request-response | `src/components/AboutModal.tsx` (self) | exact |
| `src/components/CustomQuestionForm.tsx` | component | request-response | `src/components/CustomQuestionForm.tsx` (self) | exact |
| `src/components/ResetConfirmDialog.tsx` | component | request-response | `src/components/ResetConfirmDialog.tsx` (self) | exact |
| `src/components/DeleteSessionConfirmDialog.tsx` | component | request-response | `src/components/ResetConfirmDialog.tsx` | role-match |
| `src/components/DifficultyFilter.tsx` | component | request-response | `src/components/SectionFilter.tsx` | role-match |
| `src/components/SearchGroup.tsx` | component | request-response | `src/components/SearchGroup.tsx` (self) | exact |
| `src/components/StorageToast.tsx` | component | event-driven | `src/components/UndoToast.tsx` | role-match |

---

## Pattern Assignments

### `src/app/styles.css` (config/CSS — global keyframes + dialog animation)

**Analog:** `src/app/styles.css` (self — extend existing `@keyframes slide-up` pattern)

**Existing keyframe pattern** (lines 9-12):
```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

**D-05 addition — fade-in keyframe** (append after slide-up):
```css
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**D-06 addition — dialog @starting-style animation** (append after fade-in):
```css
dialog {
  opacity: 1;
  scale: 1;
  transition: opacity 150ms ease-out, scale 150ms ease-out,
              display 150ms allow-discrete, overlay 150ms allow-discrete;
}

@starting-style {
  dialog[open] {
    opacity: 0;
    scale: 0.95;
  }
}

@media (prefers-reduced-motion: reduce) {
  dialog {
    transition: none;
  }
}
```

Note: `allow-discrete` is required for `display` and `overlay` to animate. The `@media (prefers-reduced-motion)` block in CSS replaces the `motion-safe:` prefix used in TSX — the dialog is CSS-only, so Tailwind variants do not apply here.

---

### `src/components/SidebarGroup.tsx` (component, event-driven — D-03 grid-rows transition)

**Analog:** `src/components/SidebarGroup.tsx` (self)

**Current collapsible region** (lines 40-44 — TO BE REPLACED):
```tsx
<div
  id={regionId}
  hidden={!isOpen}
  className="px-4 pb-3"
>
  {children}
</div>
```

**D-03 replacement pattern** (locked in CONTEXT.md D-03):
```tsx
<div
  id={regionId}
  className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
>
  <div className="min-h-0 px-4 pb-2">
    {children}
  </div>
</div>
```

Key changes:
- Remove `hidden={!isOpen}` — `hidden` sets `display: none` which prevents CSS animation
- Add `grid` class to enable `grid-template-rows` on the outer div
- Use `style` prop for dynamic `gridTemplateRows` value (D-08: acceptable for two-state toggle)
- `overflow-hidden` clips content during animation
- `min-h-0` on inner div: required — without it, `min-height: auto` prevents collapsing
- `pb-3` → `pb-2` (D-02 density reduction)
- `motion-safe:` prefix (D-07): opt-in, consistent with `UndoToast.tsx` line 16 and `SessionRow.tsx` line 113

**Existing motion-safe reference** (`src/components/UndoToast.tsx` line 16):
```tsx
className="... motion-safe:animate-[slide-up_150ms_ease-out]"
```

**Existing motion-safe reference** (`src/components/SessionRow.tsx` line 113):
```tsx
className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 motion-safe:transition-opacity flex items-center gap-1"
```

---

### `src/components/SidebarGroup.test.tsx` (test — update D-03 assertion)

**Analog:** `src/components/SidebarGroup.test.tsx` (self)

**Breaking assertion** (lines 52-68 — MUST UPDATE):
```tsx
it('region div has hidden attribute when isOpen=false (aria-controls always resolves)', () => {
  // ...
  const region = document.getElementById('sidebar-group-search');
  expect(region).toBeInTheDocument();
  expect(region).toHaveAttribute('hidden');  // <-- WILL FAIL after D-03
});
```

**Replacement assertion pattern** (preserve the WR-02 intent: aria-controls resolves):
```tsx
it('region div is always in DOM when isOpen=false (aria-controls always resolves)', () => {
  render(
    <SidebarGroup groupId="search" label="Search" isOpen={false} onToggle={onToggle}>
      <p>Hidden content</p>
    </SidebarGroup>,
  );
  const region = document.getElementById('sidebar-group-search');
  expect(region).toBeInTheDocument();           // still in DOM — aria-controls resolves
  expect(region).not.toHaveAttribute('hidden'); // D-03: no hidden attr; grid-rows controls visibility
  expect(region?.style.gridTemplateRows).toBe('0fr'); // collapsed state
});
```

---

### `src/components/QuestionCard.tsx` (component, event-driven — D-01 text-sm, D-04 textarea grid-rows, D-05 fade-in)

**Analog:** `src/components/QuestionCard.tsx` (self)

**D-01: text-sm instances to replace** (lines 102, 157, 164 — change `text-sm` → `text-[13px]`):
```tsx
// line 102 — question text span
<span className="text-[13px] font-normal text-gray-900 dark:text-gray-100 flex-1 truncate">

// line 157 — print row question text
<span className="text-[13px] font-normal text-gray-900">{question.q}</span>

// line 164 — print row score
<span className="ml-auto text-[13px] font-normal text-gray-700">
```

**D-04: Current textarea toggle** (lines 170-180 — TO BE REPLACED):
```tsx
<div className={hideNotes && !printMode ? 'hidden' : ''}>
  <textarea
    ...
    className={`w-full resize-y min-h-[64px] text-sm ... print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0${!notesOpen && !printMode ? ' hidden' : ''}`}
  />
</div>
```

**D-04 replacement pattern** (outer `hideNotes` wrapper stays; inner `notesOpen` toggle becomes grid-rows):
```tsx
<div className={hideNotes && !printMode ? 'hidden' : ''}>
  <div
    className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
    style={{ gridTemplateRows: notesOpen || printMode ? '1fr' : '0fr' }}
  >
    <div className="min-h-0">
      <textarea
        id={`notes-${questionId}`}
        aria-label={`Notes for ${question.q}`}
        value={localNote}
        onChange={(e) => handleNoteChange(e.target.value)}
        placeholder="Question notes…"
        className="w-full resize-y min-h-[64px] text-[13px] font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mx-3 mb-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0"
        style={{ width: 'calc(100% - 1.5rem)' }}
      />
    </div>
  </div>
</div>
```

Key: remove the `${!notesOpen && !printMode ? ' hidden' : ''}` from textarea className; move the toggle to `gridTemplateRows` on the wrapper. The `printMode` condition on `gridTemplateRows` keeps notes visible for print.

**D-05: fade-in on outermost div** (line 79 — add `motion-safe:animate-[fade-in_150ms_ease-out]`):
```tsx
<div
  className={`bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 motion-safe:animate-[fade-in_150ms_ease-out] ${BORDER_CLASSES[question.level]}`}
>
```

---

### `src/components/QuestionCard.test.tsx` (test — update D-04 assertion)

**Analog:** `src/components/QuestionCard.test.tsx` (self)

**Breaking assertions** (lines 182, 187 — MUST UPDATE):
```tsx
// line 179-189 — tests className-based hidden toggle (BREAKS after D-04)
it('clicking note icon button shows the textarea (className toggle, not hidden attribute)', () => {
  const textarea = screen.getByLabelText('Notes for What is JSX?');
  expect(textarea.className).toContain('hidden');       // <-- WILL FAIL
  fireEvent.click(btn);
  expect(textarea.className).not.toContain('hidden');   // <-- WILL FAIL
  expect(textarea).not.toHaveAttribute('hidden');
});
```

**Replacement assertion pattern** (test grid-rows wrapper instead):
```tsx
it('clicking note icon button expands the textarea grid wrapper', () => {
  render(<QuestionCard row={mockRow} />);
  const textarea = screen.getByLabelText('Notes for What is JSX?');
  // D-04: textarea no longer uses hidden class — wrapper grid-rows controls visibility
  expect(textarea.className).not.toContain('hidden');
  const wrapper = textarea.closest('.grid') as HTMLElement;
  expect(wrapper?.style.gridTemplateRows).toBe('0fr'); // collapsed initially
  const btn = screen.getByRole('button', { name: /Toggle note for What is JSX\?/ });
  fireEvent.click(btn);
  expect(wrapper?.style.gridTemplateRows).toBe('1fr'); // expanded after click
});
```

---

### `src/components/TopicRow.tsx` (component, event-driven — D-01 text-sm, D-02 padding, D-04 textarea grid-rows, D-05 fade-in)

**Analog:** `src/components/TopicRow.tsx` (self)

**D-01: text-sm on header row** (line 64):
```tsx
// CURRENT:
<div className="bg-white dark:bg-gray-900 font-normal text-sm border-b ...">
// CHANGE TO:
<div className="bg-white dark:bg-gray-900 font-normal text-[13px] border-b ...">
```

**D-02: padding reduction on toggle button** (line 69 — `py-2` → `py-1.5`):
```tsx
// CURRENT:
className="flex-1 flex items-center justify-between px-4 py-2 pl-8 ..."
// CHANGE TO:
className="flex-1 flex items-center justify-between px-4 py-1.5 pl-8 ..."
```

**D-02: padding reduction on delete button** (line 85 — `py-2` → `py-1.5`):
```tsx
// CURRENT:
className="text-xs text-red-600 ... px-4 py-2 print:hidden"
// CHANGE TO:
className="text-xs text-red-600 ... px-4 py-1.5 print:hidden"
```

**D-04: Current textarea toggle** (lines 106-114 — `hidden={!topicNotesOpen && !localTopicNote && !printMode}` on textarea — TO BE REPLACED):
```tsx
// CURRENT: HTML hidden attribute on textarea directly
<textarea
  id={`topic-notes-${topicId}`}
  hidden={!topicNotesOpen && !localTopicNote && !printMode}
  className="mt-2 w-full resize-y min-h-[80px] text-sm ..."
/>
```

**D-04 replacement pattern** (wrap in grid-rows div):
```tsx
<div
  className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
  style={{ gridTemplateRows: (topicNotesOpen || localTopicNote || printMode) ? '1fr' : '0fr' }}
>
  <div className="min-h-0">
    <textarea
      id={`topic-notes-${topicId}`}
      aria-label={`Notes for ${row.topic.name}`}
      value={localTopicNote}
      onChange={(e) => handleTopicNoteChange(e.target.value)}
      placeholder="Topic notes…"
      className="mt-2 w-full resize-y min-h-[80px] text-[13px] font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0"
    />
  </div>
</div>
```

Key: the `hidden` prop is removed from the `<textarea>` itself; the condition moves to `gridTemplateRows` on the wrapper.

**D-05: fade-in on outermost div** (line 61 — add `motion-safe:animate-[fade-in_150ms_ease-out]`):
```tsx
<div className="motion-safe:animate-[fade-in_150ms_ease-out]">
```

---

### `src/components/SectionRow.tsx` (component, event-driven — D-01 text-sm, D-02 padding, D-05 fade-in)

**Analog:** `src/components/SectionRow.tsx` (self)

**D-02: padding on toggle button** (line 24 — `py-3` → `py-2`):
```tsx
// CURRENT:
className="flex-1 flex items-center justify-between px-4 py-3 ..."
// CHANGE TO:
className="flex-1 flex items-center justify-between px-4 py-2 ..."
```

**D-02: padding on delete button** (line 38 — `py-3` → `py-2`):
```tsx
// CURRENT:
className="text-xs text-red-600 ... px-4 py-3 print:hidden"
// CHANGE TO:
className="text-xs text-red-600 ... px-4 py-2 print:hidden"
```

Note: SectionRow has `text-base` on its header (line 19 `font-semibold text-base`) — D-01 says keep `text-base` on section headers, so this is NOT changed. Also check: there is a `text-sm` at line 29 (question count span) — this IS replaced:
```tsx
// CURRENT:
<span className="text-sm font-normal text-gray-500 dark:text-gray-400">
// CHANGE TO:
<span className="text-[13px] font-normal text-gray-500 dark:text-gray-400">
```

**D-05: fade-in on outermost div** (line 18 — add `motion-safe:animate-[fade-in_150ms_ease-out]`):
```tsx
<div className="bg-gray-50 dark:bg-gray-800/50 font-semibold text-base border-b border-gray-200 dark:border-gray-700 w-full flex items-center text-gray-900 dark:text-gray-100 motion-safe:animate-[fade-in_150ms_ease-out]">
```

**Touch target note (Pitfall 5):** After changing `py-3` → `py-2` on SectionRow buttons, verify rendered height is still ≥ 44px in DevTools. If not, add `min-h-[44px]` — use `QuestionCard.tsx` line 82 and `TopicRow.tsx` line 82 as model (`min-h-[44px]` already present on those).

---

### `src/components/SectionFilter.tsx` (component — D-01 text-sm, D-02 padding)

**Analog:** `src/components/SectionFilter.tsx` (self)

**D-01 + D-02: button class** (lines 42, 72 — confirmed by grep):
```tsx
// CURRENT:
className={`w-full flex items-center px-3 py-2 text-sm text-left ...`}
// CHANGE TO:
className={`w-full flex items-center px-3 py-1.5 text-[13px] text-left ...`}
```

Both button instances at lines 42 and 72 receive the same change.

---

### D-01 Font Replacement — All Remaining Component Files

For the 16 remaining component files (ContentTree, ActionsGroup, SessionRow, CandidateModal, ImportPreviewModal, AiPromptModal, AddTopicForm, AddSectionForm, AboutModal, CustomQuestionForm, ResetConfirmDialog, DeleteSessionConfirmDialog, DifficultyFilter, SearchGroup, StorageToast), the change is uniform:

**Pattern (D-01 — same across all files):**
- Find: `text-sm` in Tailwind class strings
- Replace: `text-[13px]`
- Do NOT change: `text-base` (section/group headers), `text-xs` (accent text)
- D-06 rule: only static string literals — no template construction

**Reference for correct arbitrary value syntax** (`src/components/QuestionCard.tsx` score select, line 91):
```tsx
className="text-xs font-normal text-gray-900 ..."
// text-xs stays; text-sm instances get text-[13px]
```

**Tailwind v4 arbitrary value confirmation:** `text-[13px]` is the correct syntax. No bracket escaping needed.

---

## Shared Patterns

### motion-safe: Opt-in Transition (D-07)

**Source:** `src/components/UndoToast.tsx` line 16 and `src/components/SessionRow.tsx` line 113
**Apply to:** All new Phase 19 transition classes

```tsx
// Mount animation pattern (D-05):
motion-safe:animate-[fade-in_150ms_ease-out]

// Accordion transition pattern (D-03 / D-04):
motion-safe:transition-[grid-template-rows] motion-safe:duration-200
```

Note: The existing `motion-reduce:transition-none` on `Sidebar.tsx` line 28 and `SidebarGroup.tsx` line 35 (chevron) is NOT changed per D-07. These are pre-existing patterns with different opt-out semantics.

### grid-template-rows Accordion (D-03 / D-04)

**Source:** CONTEXT.md D-03 (locked pattern — no existing analog in codebase before Phase 19)
**Apply to:** `SidebarGroup.tsx` region div, `QuestionCard.tsx` textarea wrapper, `TopicRow.tsx` textarea wrapper

```tsx
// Outer container — must have: grid, overflow-hidden, motion-safe: classes, style prop
<div
  className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
>
  {/* Inner wrapper — must have min-h-0 */}
  <div className="min-h-0">
    {children}
  </div>
</div>
```

Requirements checklist:
- `grid` class (enables `grid-template-rows` CSS property)
- `overflow-hidden` (clips content during animation)
- `min-h-0` on inner div (prevents implicit `min-height: auto` blocking collapse)
- Remove any `hidden` attribute or `hidden` className from the animated region
- `style` prop for `gridTemplateRows` (D-08: acceptable because value is runtime-dynamic)

### Keyframe Reference Pattern

**Source:** `src/app/styles.css` lines 9-12 (existing `@keyframes slide-up`)
**Apply to:** `src/app/styles.css` — new `@keyframes fade-in` follows same file pattern

The `@keyframes` block lives in global CSS; the Tailwind arbitrary animation class references it by name:
```tsx
// TSX usage (same pattern as UndoToast slide-up):
motion-safe:animate-[fade-in_150ms_ease-out]
```

### Test Update Pattern

**Source:** `src/components/SidebarGroup.test.tsx` lines 52-68, `src/components/QuestionCard.test.tsx` lines 179-189
**Apply to:** Both test files must be updated in the SAME task as their companion component

When removing `hidden` attribute/class, replace assertions with `style.gridTemplateRows` checks:
```tsx
// Assert collapsed:
expect(element.style.gridTemplateRows).toBe('0fr');
// Assert expanded:
expect(element.style.gridTemplateRows).toBe('1fr');
// Assert still in DOM:
expect(element).toBeInTheDocument();
```

---

## No Analog Found

All changes in Phase 19 modify existing files in-place. There are no new files being created, and all patterns are either self-analogs (modifying the file itself) or directly locked in CONTEXT.md decisions.

The `grid-template-rows: 0fr → 1fr` accordion technique has no existing analog in the codebase before Phase 19. The locked CONTEXT.md D-03/D-04 patterns are the authority; RESEARCH.md confirms they are technically correct.

The `@starting-style` dialog animation has no existing analog. CONTEXT.md D-06 CSS is the authority; Chrome Extension target guarantees Chrome 117+ support.

---

## Metadata

**Analog search scope:** `src/components/`, `src/app/`
**Files scanned:** 23 (component files + styles.css + test files)
**Pattern extraction date:** 2026-06-19
