# Phase 12 — UI Review

**Audited:** 2026-06-18
**Baseline:** 12-UI-SPEC.md (approved)
**Screenshots:** not captured (no dev server on port 3000 or 5173)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All icon-only buttons carry correct title/aria-label per spec; no generic labels introduced |
| 2. Visuals | 3/4 | Icon emoji assignments match spec; icon-only buttons lose discoverability — title tooltip is the only label path on touch devices |
| 3. Color | 4/4 | 60/30/10 distribution intact; pressed-state blue tokens used only on declared aria-pressed elements; destructive red retained on Reset all |
| 4. Typography | 3/4 | SidebarGroup and ActionsGroup use only spec-permitted xs/sm/base; pre-existing text-xl/text-3xl/font-medium in unmodified files is a carry-forward gap |
| 5. Spacing | 2/4 | SidebarGroup icon wrapper uses gap-2 (8px) instead of spec-declared mr-1 (4px); all touch targets meet 44px minimum |
| 6. Experience Design | 4/4 | All 6 UAT defects closed; aria-pressed, print-mode guard, backdrop close, stopPropagation all correctly implemented |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **SidebarGroup icon gap deviates from spec** — `gap-2` (8px) used instead of `mr-1` (4px). The UI-SPEC explicitly declares `xs = 4px` for icon-gap-before-section-title. An 8px gap is not a severe visual error, but it directly contradicts the spacing contract on a file this phase introduced. Fix: change `gap-2` to `gap-1` (or replace the flex wrapper with a simpler `mr-1` on the icon span) in `src/components/SidebarGroup.tsx` line 30.

2. **Icon-only buttons provide zero label on touch/pointer devices** — All 11 ActionsGroup buttons and the new sidebar toggle have no visible text. Native `title` attributes do not surface on touch screens (iOS Safari, Android Chrome). The spec accepts this via D-14 ("native title, no custom tooltip"), but this creates a WARNING-level discoverability gap for a Chrome extension that runs on mobile-adjacent contexts. Fix: add a persistent visually-hidden `<span>` (sr-only) inside each button as a belt-and-suspenders fallback, or document explicitly that mobile is out-of-scope for this extension.

3. **Pre-existing out-of-spec typography not corrected** — `src/app/Welcome.tsx` uses `text-3xl` and `text-xl`; `src/components/ContentTree.tsx` uses `text-xl`; `src/components/ImportPreviewModal.tsx` uses `font-medium`. The UI-SPEC permits only xs/sm/base sizes and normal/semibold weights. These files were not modified in Phase 12, so the violations were not introduced here, but Phase 12's UI-SPEC explicitly locks the type scale and no corrective sweep was done. Fix: update Welcome.tsx headings to `text-base font-semibold`, ContentTree h1 to `text-base font-semibold`, ImportPreviewModal `font-medium` to `font-normal`.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

All copywriting requirements are met with no deviations found.

- Every ActionsGroup button has `title` matching `aria-label` (grep confirms 11 title= occurrences).
- "Hide notes" label is consistent in both states; `aria-pressed` communicates state per spec.
- "Switch session", "AI feedback prompt", all icon assignments match the UI-SPEC table exactly.
- Import error strings ("File too large", "Invalid YAML:", "Unrecognized YAML format") are unchanged.
- No generic labels ("Submit", "OK", "Cancel") introduced in Phase 12 files.
- The one "Cancel" occurrence found is in `ImportPreviewModal.tsx` which predates this phase.

### Pillar 2: Visuals (3/4)

WARNING: Icon-only buttons with no text fallback.

- Icon emoji assignments are correct per spec: 🔄 🤖 ↕ ↔ 👁 📝 🌙/☀ 👤 📥 📤 🗑 — all match the UI-SPEC icon table.
- SidebarGroup section icons (🔍 🎯 📋 ⚡) render before label text with `aria-hidden="true"` — correct.
- Chevron ▾ unchanged, stays on right side — correct.
- `aria-pressed=true` visual state (blue background + text) is applied on "Hide marked topics", "Hide notes", and "Dark mode" buttons — visual hierarchy communicates state.
- WARNING: 11 action buttons in a vertical `flex flex-col gap-2` stack with no text label create a tall column of unlabeled emoji icons. Without a legend or on-hover tooltip discovery path on touch, users cannot identify buttons. This is a spec-accepted tradeoff (D-14) but is a real discoverability regression from the previous text-label buttons.

### Pillar 3: Color (4/4)

60/30/10 distribution is intact and accent usage is correctly scoped.

- Dominant: `bg-white / dark:bg-gray-900` — main content areas, modal backgrounds.
- Secondary: `bg-gray-100 / dark:bg-gray-700` — all 11 action button rest states confirmed in ActionsGroup.tsx.
- Accent `blue-500/600` reserved for: focus rings (`focus-visible:ring-blue-500` on every interactive element), pressed state (`bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`) only on the three `aria-pressed` buttons — no accent spillover found.
- Destructive `text-red-600 dark:text-red-400` confirmed on Reset all button only; hover `hover:bg-red-50 dark:hover:bg-red-900/20` matches spec.
- No hardcoded hex color literals found in Phase 12 modified files.
- One pre-existing arbitrary value `max-h-[352px]` in SessionSwitcherModal.tsx (line 106) — not introduced in this phase.

### Pillar 4: Typography (3/4)

Phase 12 modified files comply with the spec. Pre-existing violations in unmodified files persist.

**In-scope (Phase 12 modified files):**
- `SidebarGroup.tsx`: `text-base font-semibold` on section header — matches spec.
- `ActionsGroup.tsx`: `text-xs` on session name label, `text-sm` on buttons — matches spec.
- `TopicMarkDisplay.tsx`, `SessionSwitcherModal.tsx`, `TopicRow.tsx`, `QuestionCard.tsx`, `app.ts`: no new typography classes introduced.

**Pre-existing violations (not introduced in Phase 12):**
- `src/app/Welcome.tsx:61` — `text-3xl font-semibold` (spec permits only xs/sm/base)
- `src/app/Welcome.tsx:75,92,108` — `text-xl font-semibold` (out-of-spec size)
- `src/components/ContentTree.tsx:45` — `text-xl font-semibold` (out-of-spec size)
- `src/components/ImportPreviewModal.tsx:101` — `font-medium` (spec permits only normal/semibold)

These were not corrected during Phase 12 and remain open carry-forward violations.

### Pillar 5: Spacing (2/4)

BLOCKER-class deviation: icon gap in SidebarGroup does not match spec.

- **DEFECT:** `src/components/SidebarGroup.tsx:30` — `<span className="flex items-center gap-2">` uses `gap-2` (8px). UI-SPEC declares `xs = 4px` for icon gap before section-title text (`mr-1` or `gap-1`). This is a direct spec violation in a file modified by this phase.
- `p-2 min-h-[44px] min-w-[44px]` on all action buttons — correct per spec touch target rule.
- `px-4` on SidebarGroup content area — matches spec `md = 16px`.
- `gap-2` between action buttons in ActionsGroup (outer `flex flex-col gap-2`) — this is the container gap between buttons, which is reasonable and consistent with the spec's `sm = 8px` gap guidance.
- One pre-existing arbitrary value: `max-h-[352px]` in SessionSwitcherModal.tsx — not introduced in Phase 12.
- No other arbitrary `[Npx]` or `[Nrem]` values found in Phase 12 modified files.

### Pillar 6: Experience Design (4/4)

All 6 UAT defects are correctly closed with no regression.

- **SCORE-07:** `TopicMarkDisplay.tsx:84-85` — `onClick` and `onMouseDown` both call `e.stopPropagation()` on the `<fieldset>`. Both needed per RESEARCH.md Pitfall 4. Correct.
- **SESS-05:** `SessionSwitcherModal.tsx:78-81` — `onClick` on `<dialog>` with `e.target === dialogRef.current` guard. Matches CandidateModal pattern. Correct.
- **UI-09:** `hideNotes` state added to store (not in subscribe block — confirmed volatile). `QuestionCard.tsx:142` and `TopicRow.tsx:79` apply `hidden` CSS class conditional with `hideNotes && !printMode` guard — print mode takes priority. Correct.
- **UI-10:** All 11 buttons are emoji-only with `title` and `aria-label`. `p-2 min-h-[44px] min-w-[44px]` touch targets met. Pressed visual state on all three `aria-pressed` buttons. Correct.
- **UI-11:** `SidebarGroup` `icon?: ReactNode` prop added; `aria-hidden="true"` on icon span. All four groups wired with correct emoji. Correct.
- **UI-12:** `md:relative md:translate-x-0` removed from `Sidebar.tsx` aside. `md:hidden` removed from `App.tsx` backdrop. Sidebar visibility controlled solely by `sidebarOpen`. Correct.
- **aria-pressed coverage:** hideMarked, hideNotes, darkMode, DifficultyFilter, SectionFilter, ImportPreviewModal — all have `aria-pressed` with visual state. State management is comprehensive.
- **Error states:** Import errors surfaced via `role="alert"` paragraph. Correct.
- **Print mode:** Notes suppression correctly guarded; `hidden` class on wrapper div (not `hidden` attribute on textarea) preserves `print:` Tailwind variant override capability.
- Full test suite: 598 tests passing with no regressions per Plan 04 SUMMARY.

---

## Registry Safety

Registry audit: 0 third-party blocks checked — shadcn not initialized (`components.json` absent). No registry safety section required.

---

## Files Audited

- `src/components/ActionsGroup.tsx` (Phase 12 Plan 04 — primary modified file)
- `src/components/SidebarGroup.tsx` (Phase 12 Plan 03)
- `src/components/Sidebar.tsx` (Phase 12 Plan 03)
- `src/app/App.tsx` (Phase 12 Plan 03)
- `src/components/TopicMarkDisplay.tsx` (Phase 12 Plan 01)
- `src/components/SessionSwitcherModal.tsx` (Phase 12 Plan 01)
- `src/components/TopicRow.tsx` (Phase 12 Plan 02)
- `src/components/QuestionCard.tsx` (Phase 12 Plan 02)
- `src/store/app.ts` (Phase 12 Plan 02 — store additions only, not audited for full file)
- `.planning/phases/12-uat-defect-cleanup/12-UI-SPEC.md` (design contract)
- `.planning/phases/12-uat-defect-cleanup/12-CONTEXT.md`
- `.planning/phases/12-uat-defect-cleanup/12-01-SUMMARY.md` through `12-04-SUMMARY.md`
- `.planning/phases/12-uat-defect-cleanup/12-01-PLAN.md` through `12-04-PLAN.md`
