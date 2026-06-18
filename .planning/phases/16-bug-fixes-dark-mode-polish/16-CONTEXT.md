# Phase 16: Bug Fixes & Dark Mode Polish - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three UAT-flagged defects and polish the score dropdown dark mode contrast. New sections and topics added via the inline forms must appear immediately in the virtualizer-driven content tree. The note icon must toggle the textarea closed regardless of whether the note contains text. The score dropdown must be legible in dark mode across browsers using the `color-scheme` CSS property.

</domain>

<decisions>
## Implementation Decisions

### Tree Visibility After Add (BUG-01/BUG-02)
- After `addSection` / `addTopic` store mutations, call `scrollToIndex` on the virtualizer pointing to the new row so the user sees what they just added
- Use `behavior: "auto"` (instant scroll) — avoids animation jank in a dense virtual list
- For BUG-01 (add section): scroll to the new section row at the end of the list
- For BUG-02 (add topic): auto-expand the parent section if collapsed before scrolling to the new topic row; the trigger only renders when the section is expanded so the row index is predictable

### Note Icon Toggle Fix (BUG-03)
- Note content is always preserved in the Zustand store when the textarea closes — never clear on close
- Switch from the HTML `hidden` attribute to CSS `display:none` via a `className` toggle — this triggers the ResizeObserver that TanStack Virtual uses for `measureElement` more reliably than the `hidden` attribute in React 19
- Keep the existing blue icon indicator when `notesOpen || localNote` — the "has content" blue dot is a useful at-a-glance cue

### Score Dropdown Dark Mode (POL-01)
- Add `dark:[color-scheme:dark]` to the score dropdown `<select>` to enable OS-native dark styling for `<option>` elements (no custom dropdown component needed)
- Scope `[color-scheme:dark]` fix to per-element classes, not a global `:root` rule — avoids unintended side effects on scrollbars and other OS widgets
- Scan the codebase for all `<select>` elements and apply the same consistent dark mode treatment (dark background, light text, `dark:[color-scheme:dark]`) to all of them, not just the score dropdown

### Claude's Discretion
- Exact Tailwind class combination for dark selects (e.g., `dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:[color-scheme:dark]`)
- How to pass row index to `scrollToIndex` after store mutation — ref forwarding, a returned value from the store action, or computing from the updated rows array
- Whether to use `rowVirtualizer.scrollToIndex(idx, { align: 'end' })` or `{ align: 'start' }` for newly added items
- Test update strategy (add new assertions for scroll behavior where testable; dark mode tests verify class presence)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ContentTree.tsx` — owns `rowVirtualizer` (TanStack Virtual), `addSectionOpen`, `addTopicOpenFor` state; `scrollToIndex` is available on the `rowVirtualizer` ref
- `AddSectionForm.tsx` / `AddTopicForm.tsx` — call `addSection` / `addTopic` then `onDismiss()`; fix requires `onDismiss` to trigger scroll in parent `ContentTree`
- `QuestionCard.tsx` — `notesOpen` local state controls textarea visibility via `hidden={...}` prop; `localNote` tracks content; fix is to switch to className-based show/hide
- `useAppStore` (Zustand) — `addSection`, `addTopic`, `scores`, `notes`, `setScore`, `setNote` all available
- `buildFlatRows.ts` — produces `VirtualRow[]` including `section`, `topic`, `question`, `add-topic-trigger`, `add-section-trigger` types

### Established Patterns
- TanStack Virtualizer with `measureElement` ref callback on each row div, `estimateSize` per row type, `overscan: 10`, `useFlushSync: false` (React 19)
- Zustand granular selectors to minimize re-renders (e.g., `s.scores[id]`, `s.notes[id]`)
- Tailwind dark mode via `dark:` prefix throughout; dark mode toggle in store
- `color-scheme` CSS property not yet used in the codebase — first introduction here
- `<select>` elements in `QuestionCard` (score dropdown) and potentially `DifficultyFilter`, `CustomQuestionForm`

### Integration Points
- `ContentTree.tsx` must pass a `onScrollToNewRow` or `onAdded` callback to `AddSectionForm` / `AddTopicForm` via the trigger render paths, then call `rowVirtualizer.scrollToIndex` with the new row's index
- `QuestionCard.tsx` textarea visibility change is self-contained — no parent callback needed; just change `hidden={...}` to className pattern

</code_context>

<specifics>
## Specific Ideas

No specific references beyond codebase analysis — open to standard approaches for all three fixes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
