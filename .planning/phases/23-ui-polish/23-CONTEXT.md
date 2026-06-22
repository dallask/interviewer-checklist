# Phase 23: UI Polish — Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Four targeted polish improvements across the UI:

- **POL-01**: AI feedback dialog is taller so the user can read more of the generated prompt without scrolling.
- **POL-02**: Every action button inside all modal dialogs has a Lucide icon alongside its text label.
- **POL-03**: The ActionsGroup panel uses a two-column grid with visible text labels and smaller icons.
- **POL-04**: All interactive button-state hover transitions include `transition-colors` so color changes animate smoothly.

No layout changes, no new features, no new modals.

</domain>

<decisions>
## Implementation Decisions

### POL-01 — Taller AI Dialog

- **D-01**: `AiPromptModal.tsx` line 102: Change modal container from `max-w-sm` to `max-w-2xl` — wider also allows more text to be visible per line.
- **D-02**: `AiPromptModal.tsx` line 116: Change textarea from `h-64` (256px) to `h-80` (320px). The `resize-y` attribute stays so the user can still manually resize.
- **D-03**: No other changes to AiPromptModal layout — the prompt generation, copy button, and focus management stay unchanged.

### POL-02 — Modal Button Icons

Add a Lucide icon before the text label on every action button in every modal. Icon size: `w-4 h-4` (16px). Buttons get `flex items-center gap-1.5` to align icon + text.

**Modals and their buttons:**

| Modal | Button | Icon |
|-------|--------|------|
| AiPromptModal | Close | `X` |
| AiPromptModal | Copy to clipboard | `Copy` |
| AboutModal | Close | `X` |
| CandidateModal | Discard changes | `X` |
| CandidateModal | Save details | `Check` |
| CandidateModal | Reset details (text-only link-style) | `RotateCcw` |
| ResetConfirmDialog | Cancel | `X` |
| ResetConfirmDialog | Reset all (destructive) | `Trash2` |
| ImportPreviewModal | Cancel | `X` |
| ImportPreviewModal | Import (confirm) | `Download` |

- **D-04**: The `SessionSwitcherModal.tsx` — no action buttons to add icons to (it has inline session item buttons, not dialog-level action buttons). Skip.
- **D-05**: Icon placement: always before the text label (`<Icon aria-hidden="true" />{label}`).
- **D-06**: Import Lucide icons at top of each file. Prefer icons already imported in the file when available (e.g., `Trash2` is already in ActionsGroup but not in ResetConfirmDialog — add there).

### POL-03 — Action Panel Two-Column Grid

- **D-07**: `ActionsGroup.tsx` line 171: Change `grid grid-cols-3 gap-1.5` to `grid grid-cols-2 gap-1.5`.
- **D-08**: Each button gets a text label beneath the icon. Button layout changes from `p-2` (icon-only) to `flex flex-col items-center gap-0.5 px-2 py-1.5` with:
  - Icon: `w-4 h-4` (down from `w-5 h-5`)
  - Label: `<span className="text-[10px] leading-tight truncate w-full text-center">Label</span>`
- **D-09**: `btnBase` and `btnActive` constants must be updated to include the layout classes instead of each button duplicating them.
- **D-10**: Button labels (short, max ~10 chars):
  - RefreshCw → "Sessions"
  - Bot → "AI Prompt"
  - Sun/Moon → "Light" / "Dark"
  - ChevronsUpDown → "Expand"
  - ChevronsLeftRight → "Collapse"
  - Eye → "Hide Done"
  - Download (import) → "Import"
  - Upload (export) → "Export"
  - Trash2 (reset) → "Reset"
- **D-11**: The 9 buttons in a 2-column grid produce a 5-row layout (4 full rows + 1 button in the last row). This is acceptable — the reset button is last and stands visually isolated.

### POL-04 — Hover Transition Colors

- **D-12**: Add `transition-colors` to every button `className` that includes a `hover:bg-*` or `hover:text-*` but does not already have a transition class. This covers:
  - `btnBase` and `btnActive` in ActionsGroup
  - All modal close/confirm/cancel buttons updated in POL-02
- **D-13**: Use `duration-150` (matches existing sidebar `duration-200` is for transforms; `duration-150` is the project standard for color/background transitions from Phase 19).
- **D-14**: Do NOT add transitions to elements that already have `motion-safe:transition-*` or `transition-transform` (SectionRow, TopicRow, Sidebar — already covered in Phase 19).

### Claude's Discretion

- Whether `Check` or `Save` icon is used for the "Save details" button in CandidateModal.
- Whether the Reset link-style button in CandidateModal gets an icon (it's a text link, not a pill button — adding icon is optional).
- Exact label text for Sun/Moon toggle (can be "Dark Mode" / "Light Mode" if width allows).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### POL-01 Fix Targets
- `src/components/AiPromptModal.tsx` — lines 102 (max-w-sm → max-w-2xl) and 116 (h-64 → h-80)

### POL-02 Fix Targets
- `src/components/AiPromptModal.tsx` — Close button (line 133), Copy button (line 140)
- `src/components/AboutModal.tsx` — Close button (line 98)
- `src/components/CandidateModal.tsx` — Cancel/Discard (line 232), Save (line 238), Reset link (line 222)
- `src/components/ResetConfirmDialog.tsx` — Cancel (line 85), Reset (line 92)
- `src/components/ImportPreviewModal.tsx` — Cancel (line 154), Import (line 162)

### POL-03 Fix Targets
- `src/components/ActionsGroup.tsx` — `btnBase`/`btnActive` constants (lines 158–161), `grid grid-cols-3` (line 171), all 9 button icons (lines 172–269)

### POL-04 Fix Targets
- Same files as POL-02 + POL-03 (add `transition-colors duration-150` to their hover buttons)
- No additional files needed

### Read-Only References
- `src/components/SectionRow.tsx` — already has `motion-safe:animate-[fade-in_150ms_ease-out]`, no changes
- `src/components/TopicRow.tsx` — already has `motion-safe:transition-[grid-template-rows]`, no changes
- `src/components/Sidebar.tsx` — already has `transition-transform duration-200`, no changes

</canonical_refs>

<code_context>
## Existing Code Insights

### Lucide icons already imported per file
- `AiPromptModal.tsx` — no Lucide imports currently; add `Copy, X` from `lucide-react`
- `AboutModal.tsx` — no Lucide imports; add `X`
- `CandidateModal.tsx` — no Lucide imports; add `X, Check, RotateCcw`
- `ResetConfirmDialog.tsx` — no Lucide imports; add `X, Trash2`
- `ImportPreviewModal.tsx` — no Lucide imports; add `X, Download`
- `ActionsGroup.tsx` — already imports most icons; `Check` may need to be added

### btnBase pattern
Current ActionsGroup `btnBase`:
```
'p-2 min-h-[36px] min-w-[36px] text-[13px] text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none'
```
After POL-03 update: replace `p-2` with `flex flex-col items-center gap-0.5 px-2 py-1.5`; reduce icon size to `w-4 h-4`; add label span. Add `transition-colors duration-150` per D-12.

### Modal button pattern
Current typical modal cancel button:
```
'text-[13px] font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none'
```
Add `transition-colors duration-150` and change from a plain text button to `flex items-center gap-1.5` with `<Icon className="w-4 h-4" aria-hidden="true" />` before the label text.

### Test Coverage
- `ActionsGroup.test.tsx` tests buttons by `aria-label` — labels are stable. Adding visible text doesn't break existing tests.
- Modal tests (if any) target button text or aria-label — adding icons doesn't break them.

</code_context>

<specifics>
## Specific Ideas

### POL-01: AiPromptModal resize
```tsx
// Line 102 — change max-w-sm to max-w-2xl
className="fixed inset-0 m-auto w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl border ..."
// Line 116 — change h-64 to h-80
className="w-full h-80 mt-3 mb-3 text-[13px] ..."
```

### POL-02: Modal button with icon (pattern)
```tsx
<button type="button" onClick={onClose}
  className="flex items-center gap-1.5 transition-colors duration-150 text-[13px] font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
  <X className="w-4 h-4" aria-hidden="true" />
  Close
</button>
```

### POL-03: ActionsGroup button with label (pattern)
```tsx
const btnBase = 'flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors duration-150';

<button type="button" aria-label="Switch session" className={btnBase}>
  <RefreshCw className="w-4 h-4" aria-hidden="true" />
  <span className="truncate">Sessions</span>
</button>
```

</specifics>

<deferred>
## Deferred Ideas

- Animated modal open/close (CSS keyframes on `<dialog>` element — complex browser compat)
- Score dropdown animation (select element — not animatable with CSS)

</deferred>

---

*Phase: 23-UI-Polish*
*Context gathered: 2026-06-22*
