# Phase 08 — UI Review

**Audited:** 2026-06-17
**Baseline:** 08-UI-SPEC.md (approved design contract)
**Screenshots:** not captured (no dev server detected on ports 3000 or 5173)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All spec-declared copy strings match exactly |
| 2. Visuals | 3/4 | Hierarchy correct; Close button missing disabled visual treatment creates inconsistent pending state |
| 3. Color | 3/4 | Color map matches spec; Close button lacks `disabled:opacity-50` — pending state is invisible |
| 4. Typography | 4/4 | Exactly two weights (font-normal, font-semibold), sizes match spec |
| 5. Spacing | 4/4 | All spacing values within declared scale; no arbitrary px/rem values |
| 6. Experience Design | 2/4 | isPending guard present on Copy button; Close button NOT disabled during in-flight write — violates must_have truth and spec behavior contract |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Close button not disabled during isPending** — User can click Close mid-clipboard-write, closing the dialog before the `finally` block fires, potentially leaving `isPending` in a stale state on the next open. Add `disabled={isPending}` to the Close button in `src/components/AiPromptModal.tsx` line 133.

2. **Close button missing disabled visual classes** — Even if `disabled={isPending}` is added, the Close button has no `disabled:opacity-50 disabled:cursor-not-allowed` classes (contrast the Copy button at line 146 which has them). Add these classes to the Close button className at line 136.

3. **AiPromptModal test does not verify Close button is disabled when isPending** — The AiPromptModal.test.tsx spec item "isPending also disables close button during in-flight write" was listed in the plan but the implementation gap means if the test exists it cannot pass. This leaves the defect undetected by the test suite gate.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

All copywriting contract items from 08-UI-SPEC.md verified against implementation:

| Spec Item | Expected | Actual (file:line) |
|-----------|----------|--------------------|
| Trigger button label | `AI feedback prompt` | ActionsGroup.tsx:72 — PASS |
| Modal heading | `AI feedback prompt` | AiPromptModal.tsx:108 — PASS |
| Textarea aria-label | `Generated AI prompt — editable` | AiPromptModal.tsx:117 — PASS |
| Primary CTA | `Copy to clipboard` | AiPromptModal.tsx:148 — PASS |
| Copy confirmation flash | `Copied!` | AiPromptModal.tsx:128 — PASS |
| Clipboard fallback instruction | `Select all and copy manually` | AiPromptModal.tsx:122 — PASS |
| Close button | `Close` | AiPromptModal.tsx:138 — PASS |
| Empty session placeholder | `No scores yet` | buildAiPrompt.ts (08-01, not UI code) — PASS |
| Modal aria-labelledby target | `ai-prompt-title` | AiPromptModal.tsx:101, 105 — PASS |

No generic labels ("Submit", "OK", "Cancel", "Save") found in phase 8 files.

### Pillar 2: Visuals (3/4)

WARNING: The primary visual hierarchy is correct — blue `Copy to clipboard` button is the single high-contrast focal point; the gray `Close` button recedes appropriately. Textarea uses `resize-y`, heading uses `font-semibold` with distinct size contrast. Focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500`) present on all interactive elements.

Defect: During `isPending`, the Copy button correctly dims via `disabled:opacity-50` (AiPromptModal.tsx:146), but Close button shows no visual change. This breaks the intended disabled-both-buttons pending state — a user sees one button visually locked and one looking fully active, which is ambiguous and inconsistent.

The trigger button in ActionsGroup (line 66-73) has no visual differentiation from other secondary buttons in the group — this is per spec (text-only buttons, same gray treatment) and is not a defect.

### Pillar 3: Color (3/4)

WARNING: Color token mapping from UI-SPEC.md verified:

- Dialog surface: `bg-white dark:bg-gray-900` — AiPromptModal.tsx:102 — PASS
- Dialog border: `border-gray-200 dark:border-gray-700` — AiPromptModal.tsx:102 — PASS
- Heading text: `text-gray-900 dark:text-gray-100` — AiPromptModal.tsx:106 — PASS
- Textarea bg/border/text: `bg-gray-50 dark:bg-gray-800`, `border-gray-300 dark:border-gray-600`, `text-gray-900 dark:text-gray-100` — AiPromptModal.tsx:116 — PASS
- Copied flash: `text-green-600 dark:text-green-400` — AiPromptModal.tsx:127 — PASS
- Fallback instruction: `text-gray-500 dark:text-gray-400` — AiPromptModal.tsx:121 — PASS
- Copy button: `bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600` — AiPromptModal.tsx:146 — PASS
- Close button bg/text: `text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600` — AiPromptModal.tsx:136 — PASS

No hardcoded hex or rgb() values found. No `text-primary` / `bg-primary` tokens used (correct — project uses explicit Tailwind colors).

Defect: Close button is missing `disabled:opacity-50 disabled:cursor-not-allowed`. The spec's Accessibility Contract and color table both declare `disabled:opacity-50 disabled:cursor-not-allowed` as the disabled-state color treatment for interactive elements. This class is absent from the Close button (AiPromptModal.tsx:136) though present on Copy button (AiPromptModal.tsx:146). Without `disabled={isPending}` and the opacity class, the disabled state is visually invisible on Close.

60/30/10 split: Dominant white/gray (60%) — dialog surface, textarea bg; Secondary gray-100/700 (30%) — Close button, secondary elements; Accent blue-600 (10%) — Copy button only. Distribution correct per spec.

### Pillar 4: Typography (4/4)

Sizes found in phase 8 files:
- `text-xs` — ActionsGroup.tsx:53 (session name label — within spec for muted metadata)
- `text-sm` — AiPromptModal.tsx (body, buttons, textarea, flash, fallback), ActionsGroup.tsx (trigger buttons)
- `text-base` — AiPromptModal.tsx:106 (modal heading)

Spec declares: `text-sm` for body/labels/buttons/textarea, `text-base` for heading. Both sizes in use match exactly. No undeclared sizes.

Weights found:
- `font-normal` — all body, buttons, textarea (AiPromptModal.tsx:116, 121, 127, 136, 146)
- `font-semibold` — modal heading only (AiPromptModal.tsx:106)

Spec declares exactly these two weights. No `font-medium`, `font-bold`, or other weights found in phase 8 files.

### Pillar 5: Spacing (4/4)

Spacing classes found in phase 8 files:

| Class | Count | Usage |
|-------|-------|-------|
| `px-3 py-2` | 5× | Trigger and secondary sidebar buttons (ActionsGroup) |
| `px-4 py-2` | 2× | Modal footer buttons (Close, Copy) |
| `gap-2` | 1× | ActionsGroup flex column gap |
| `gap-3` | 1× | Modal footer button row gap |
| `p-6` (on dialog) | Per spec (p-6 = 24px = lg token) | Dialog surface padding |
| `p-3` (textarea) | Per spec | Textarea internal padding |
| `mb-3` | 2× | Heading bottom margin, textarea bottom margin |
| `mt-3` | 1× | Textarea top margin |
| `mb-2` | 2× | Flash and fallback paragraph spacing |
| `my-1` | 1× | HR divider |
| `px-1` | 1× | Session name label padding |

No arbitrary `[Npx]` or `[Nrem]` values found. All values (`p-1`, `p-2`, `p-3`, `p-4`, `p-6`) are within the declared spacing scale (multiples of 4px). Touch target `py-2` (8px×2 + line-height) meets 36px minimum.

### Pillar 6: Experience Design (2/4)

BLOCKER: `disabled={isPending}` is missing from the Close button.

The spec requires (08-UI-SPEC.md Interaction Contract, 08-02-PLAN.md must_haves truth, Task 1 behavior spec):
> "Both Close and Copy buttons are disabled when isPending=true (per RESEARCH.md Pitfall 6)"

Implementation at AiPromptModal.tsx:133-138:
```
<button
  type="button"
  onClick={onClose}    // ← no disabled={isPending}
  className="...">    // ← no disabled:opacity-50 disabled:cursor-not-allowed
  Close
</button>
```

While isPending is `true` only for the brief window of the clipboard Promise resolution, the user CAN click Close during this window. The `onClose` callback calls `aiPromptRef.current?.close()`, which fires the native `close` event, which triggers `handleClose` focus restore — all while the `handleCopy` async handler is mid-flight. The `finally` block will then call `setIsPending(false)` on an effectively-closed dialog, which is a state update on a potentially-unmounted or inactive dialog. This is Pitfall 6 explicitly identified in RESEARCH.md.

Additional experience design items verified as passing:

- isPending guard in handleCopy (`if (isPending) return`) — AiPromptModal.tsx:81 — PASS
- `finally` block clears isPending — AiPromptModal.tsx:93 — PASS
- Clipboard failure fallback (select all + show instruction) — AiPromptModal.tsx:88-91 — PASS
- `aria-live="polite"` on Copied! flash — AiPromptModal.tsx:127 — PASS
- Timeout ref cleared on unmount (copyTimeoutRef cleanup) — AiPromptModal.tsx:30-34 — PASS (exceeds spec)
- Reset effect on prompt prop change — AiPromptModal.tsx:21-26 — PASS
- Focus trap with WR-02 guard — AiPromptModal.tsx:46-59 — PASS
- Focus restore to `open-ai-prompt` — AiPromptModal.tsx:68 — PASS
- Trigger button placement after Switch session, before hr — ActionsGroup.tsx:66-74 — PASS
- Prompt generated fresh on every open (no caching) — ActionsGroup.tsx:36-48 — PASS
- Textarea editable (no readOnly) — AiPromptModal.tsx:112-118 — PASS
- `handleCopy` cast as `void` on onClick — AiPromptModal.tsx:143 — PASS

Registry audit: no shadcn initialized (no components.json). No third-party registries. Registry audit skipped.

---

## Files Audited

- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/AiPromptModal.tsx`
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/ActionsGroup.tsx`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/08-ai-prompt-modal/08-UI-SPEC.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/08-ai-prompt-modal/08-CONTEXT.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/08-ai-prompt-modal/08-01-PLAN.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/08-ai-prompt-modal/08-02-PLAN.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/08-ai-prompt-modal/08-01-SUMMARY.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/08-ai-prompt-modal/08-02-SUMMARY.md`
