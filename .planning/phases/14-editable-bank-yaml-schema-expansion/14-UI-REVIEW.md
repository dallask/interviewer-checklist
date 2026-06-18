---
phase: 14
phase_name: Editable Bank & YAML Schema Expansion
audit_type: retroactive-6-pillar
overall_score: 21
max_score: 24
---

# UI Review — Phase 14: Editable Bank & YAML Schema Expansion

**Overall: 21/24**

| Pillar | Score |
|--------|-------|
| Copywriting | 4/4 |
| Visuals | 3/4 |
| Color | 4/4 |
| Typography | 3/4 |
| Spacing | 4/4 |
| Experience Design | 3/4 |

---

## Pillar 1 — Copywriting (4/4)

All copy matches the contract exactly.

- "Add section" / "Add topic" / "Discard" in forms — exact matches
- "+ Add section" / "+ Add topic" triggers in ContentTree — exact matches
- Placeholder text: "Section name…", "🔧", "Topic name…", "Description (optional)…" — all exact matches
- `aria-label="Section name"`, `"Section emoji icon"`, `"Topic name"`, `"Topic description"` — exact matches
- `aria-label={\`Remove section ${row.label}\`}` and `aria-label={\`Remove topic ${row.topic.name}\`}` — exact spec match
- QuestionCard: `aria-label={row.isCustom ? 'Delete custom question' : 'Remove question'}` — exact spec match
- Empty name guard: `if (name.trim() === '') return` in both forms — silently blocked as specified

No generic labels ("Submit"/"Cancel"/"OK") found. No deviation from copywriting contract.

---

## Pillar 2 — Visuals (3/4)

**WARNING — Delete button `ml-2` gap missing on SectionRow and TopicRow.**

The UI-SPEC specified `ml-2` margin for delete buttons (mirroring the QuestionCard delete button's `ml-2` class). The implementation instead uses `px-4` padding with no `ml-2`, creating a wider visual gap between the question-count/mark-display and the × button than the contract intended.

- `src/components/SectionRow.tsx:37` — delete button: `px-4 py-3` (no `ml-2`)
- `src/components/TopicRow.tsx:84` — delete button: `px-4 py-2` (no `ml-2`)
- `src/components/QuestionCard.tsx:112` — delete button: `ml-2` present (reference)

**Fix:** Add `ml-2` and reduce `px-4` to `px-2` on delete buttons in SectionRow and TopicRow to match the QuestionCard delete button pattern.

**Positive:** The refactored sibling-button pattern (`div > button + button`) resolves the invalid nested `<button>` HTML violation that the spec acknowledged as a risk. This is an improvement over the spec's accepted approach. Trigger buttons render at the correct visual weight.

---

## Pillar 3 — Color (4/4)

All color usage matches the 60/30/10 distribution contract.

- Accent (`bg-blue-600 dark:bg-blue-500`) appears only on "Add section" and "Add topic" submit buttons — correct 10% usage
- Destructive red (`text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300`) appears only on × delete buttons in SectionRow, TopicRow, QuestionCard — correct destructive usage
- Trigger links (`text-gray-500 dark:text-gray-400`) and discard buttons (`text-gray-600 dark:text-gray-400`) use gray tones — no accent misuse

No hardcoded hex colors in any new file. All elements carry both light and dark class pairs.

---

## Pillar 4 — Typography (3/4)

**WARNING — `text-xl` present in ContentTree.tsx:55 (print-only candidate header).**

The spec declares "no new type sizes introduced; maximum 4 active: 12px, 14px, 16px, and no larger." `text-xl` (20px) exceeds this. However this element is pre-existing (not introduced in Phase 14) and is `print:block hidden` (screen-invisible). Impact is cosmetic for print only.

**Fix:** Change `text-xl` to `text-base` on the print header in `src/components/ContentTree.tsx:55`. Differentiate with `font-semibold`.

All new Phase 14 components (AddSectionForm, AddTopicForm, delete buttons) strictly use `text-xs` (12px) and `text-sm` (14px) — both within the declared scale. Font weights consistent.

---

## Pillar 5 — Spacing (4/4)

All spacing exactly matches the declared scale:

- AddSectionForm wrapper: `px-4 py-3 gap-3` — matches spec
- AddTopicForm wrapper: `px-8 py-3 gap-3` — matches spec
- "+ Add section" trigger: `px-4 py-2` — matches spec
- "+ Add topic" trigger: `px-8 py-2` — matches spec
- Button row: `gap-2` — matches spec

No arbitrary `[Npx]` or `[Nrem]` values in new components.

---

## Pillar 6 — Experience Design (3/4)

**WARNING — No `autoFocus` on first input when inline forms open.**

When `addSectionOpen` or `addTopicOpenFor` transitions to active, focus remains on the now-replaced trigger. The user must manually click into the name field. The existing `CustomQuestionForm` has the same gap, so this is behaviorally consistent — but it is a UX friction point.

**Fix:** Add `autoFocus` to the first `<input>` in `AddSectionForm.tsx` (line ~32, "Section name" input) and `AddTopicForm.tsx` (line ~32, "Topic name" input).

**Positive — all other UX contract items verified:**
- Empty submit blocked silently: `name.trim() === ''` guard — `AddSectionForm.tsx:15`, `AddTopicForm.tsx:16`
- Delete is immediate, no dialog — matches spec and custom-question delete pattern
- `print:hidden` on all new affordances (forms, triggers, delete buttons) — confirmed
- Dark mode fully paired on all interactive elements
- No loading states needed (synchronous Zustand mutations)
- Focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`) on every interactive element

---

## Top 3 Priority Fixes

1. **Visuals — `ml-2` missing on SectionRow/TopicRow delete buttons** (`src/components/SectionRow.tsx:37`, `src/components/TopicRow.tsx:84`): Add `ml-2`, reduce `px-4` to `px-2` to match QuestionCard delete button visual gap.

2. **Typography — `text-xl` in ContentTree.tsx:55**: Change to `text-base` on the print-only candidate header. Add `font-semibold` to maintain visual hierarchy.

3. **Experience Design — No autoFocus on form open**: Add `autoFocus` to the first `<input>` in `AddSectionForm.tsx` and `AddTopicForm.tsx`.

---

## Files Audited

- `src/components/AddSectionForm.tsx` (created in Phase 14)
- `src/components/AddTopicForm.tsx` (created in Phase 14)
- `src/components/SectionRow.tsx` (modified in Phase 14)
- `src/components/TopicRow.tsx` (modified in Phase 14)
- `src/components/QuestionCard.tsx` (modified in Phase 14)
- `src/components/ContentTree.tsx` (modified in Phase 14)
- `.planning/phases/14-editable-bank-yaml-schema-expansion/14-UI-SPEC.md` (design contract)
- `.planning/phases/14-editable-bank-yaml-schema-expansion/14-CONTEXT.md`
