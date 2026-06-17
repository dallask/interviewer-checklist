# Phase 8: AI Prompt Modal - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the AI Prompt Modal: a native `<dialog>` that opens from ActionsGroup, generates an editable tool-agnostic AI feedback prompt from the active session's scores/notes/candidate data, and lets the user copy it to the clipboard in one click. The prompt generation is a pure utility function; the modal is prop-driven following established Phase 5–7 patterns.

</domain>

<decisions>
## Implementation Decisions

### Prompt Content & Structure
- Sections in order: candidate name/role block → scored questions per topic (score + note) → unscored questions (marked as skipped) → custom questions inline with their parent topic → one-sentence difficulty weighting note per topic → structured task spec block at end
- Always English — AI prompts are tool-agnostic and universal; session data values (candidate name, notes) are embedded as-is regardless of language
- Difficulty weighting: one-sentence note per topic only (e.g., "difficulty: High — weighted 1.5×"); no full legend paragraph
- Custom questions appear inline with their parent topic after the scored bank questions for that topic

### Modal UX & Copy Behavior
- Trigger button placed in ActionsGroup after the session switcher button and before the Reset button — logically grouped with session-output actions (export, AI)
- Textarea is pre-filled with the generated prompt on modal open (no extra click required)
- Dialog stays open after a successful copy — user may want to edit and copy again
- Copy confirmation: brief "Copied!" aria-live text flash below the copy button, auto-clears after 2 seconds

### Fallback & Empty Session Handling
- Clipboard API unavailable: auto-select all textarea text + display a "Select all and copy manually" instruction line below the textarea
- Modal may open on any session including empty ones — prompt renders with "No scores yet" placeholder text where applicable
- No minimum data requirement — even an empty session generates a valid (partial) prompt structure

### Prompt Generation Architecture
- Pure utility function: `src/utils/buildAiPrompt.ts` with no React or store dependencies — TDD-able with Vitest
- Prompt is regenerated fresh on every modal open from current session state — no caching in store or session
- No "Regenerate" button inside the modal — prompt auto-refreshes on open; user edits the textarea freely
- ActionsGroup passes `DEFAULT_SECTIONS` into the modal prop (same pattern as yamlExport in Phase 7)

### Claude's Discretion
- Exact prompt wording/formatting within the textarea (heading levels, emoji usage, whitespace)
- Whether the task spec block uses a fixed template or is dynamically shaped from session data
- Aria-label text for trigger button and modal

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ImportPreviewModal.tsx` — closest analog: prop-driven `<dialog>`, `isPending` guard, focus trap with WR-02 guard, `dialogRef: RefObject<HTMLDialogElement | null>`, `disabled={isPending || condition}` pattern
- `src/components/ResetConfirmDialog.tsx` — focus trap `useEffect` (verbatim source for copy)
- `src/components/CandidateModal.tsx` — WR-02 `focusable.length === 0` guard pattern
- `src/utils/yamlExport.ts` — pure utility with no React deps; accepts `V3Session + sections`; commit as RED/GREEN/REFACTOR TDD
- `src/utils/buildFlatRows.ts` — pure utility structure to follow for `buildAiPrompt.ts`
- `src/components/ActionsGroup.tsx` — owns modal refs + trigger buttons; existing pattern for adding new modals

### Established Patterns
- Native `<dialog>` element, never set `open` attribute programmatically — call `.showModal()` / `.close()`
- Prop-driven modals: `dialogRef + data prop + onConfirm/onClose callback` — no `useAppStore` inside modal
- Focus restore target: `document.getElementById('open-ai-prompt')?.focus()` (trigger button id convention)
- `useEffect([preview])` to reset internal state when prop changes
- Tailwind dark-mode via `dark:` class variants; `className` follows `ResetConfirmDialog` width/positioning
- TDD for store-adjacent and utility code: RED commit → GREEN commit → REFACTOR commit

### Integration Points
- `ActionsGroup.tsx` — add trigger button + `useRef<HTMLDialogElement>` + `AiPromptModal` render
- `src/utils/buildAiPrompt.ts` (new) — pure function, no deps beyond `V3Session`, `Section[]`, `DEFAULT_SECTIONS`
- `src/components/AiPromptModal.tsx` (new) — prop-driven modal component
- `src/data/bank/index.ts` — `DEFAULT_SECTIONS` passed from ActionsGroup (already imported there)

</code_context>

<specifics>
## Specific Ideas

- The copy button text should be "Copy to clipboard" and the confirmation flash text should be "Copied!" (matches common UX conventions)
- Focus restore target id: `'open-ai-prompt'` on the trigger button in ActionsGroup
- The textarea should be `readOnly` initially but user can edit (remove readOnly or leave editable) — user confirmed editable
- `navigator.clipboard.writeText` called synchronously in the click handler (no async wrapper at call site; the Promise rejection handled via `.catch`)

</specifics>

<deferred>
## Deferred Ideas

- Storing the last-generated prompt in the session for history/diffing — out of scope for Phase 8
- Multiple prompt templates (e.g., "formal" vs "casual" tone) — out of scope
- Prompt length controls (short/detailed toggle) — out of scope

</deferred>
