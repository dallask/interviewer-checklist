---
phase: 19
title: Typography & Transitions
created: 2026-06-19
status: context-complete
---

# Phase 19 Context — Typography & Transitions

## Phase Goal

The interface uses a 13px base font with tightened spacing throughout, and key interactions feel smooth with CSS transitions.

## Requirements

- **POL-02**: Base font size is 13px and key spacing is tightened for a more compact layout throughout the sidebar and content tree
- **POL-03**: Key interactions (sidebar open/close, topic/section expand/collapse, modal open/close, note toggle) have CSS transitions or animations for a smooth feel

## Success Criteria

1. Base font `text-[13px]` Tailwind v4 arbitrary value reads as 13px across sidebar and content tree
2. Interface is noticeably more compact — reduced padding, tighter line heights — without cramping content
3. Sidebar open/close, topic/section expand/collapse, modal open/close, note-textarea toggle each have a visible CSS transition or animation
4. All 675+ existing tests pass

---

## Locked Decisions

### D-01 — Font replacement scope

**Decision:** Replace `text-sm` → `text-[13px]` for body text. Keep `text-base` on section/group headers for visual hierarchy. Leave `text-xs` (12px) accents unchanged.

**Scope:**
- `text-sm` (~65 instances across src/components/) → `text-[13px]`
- `text-base` instances (SectionRow line 19, SidebarGroup line 28, CandidateModal heading) → **keep as-is**
- `text-xs` instances → **keep as-is**
- D-06 compliance: static class literals only (no template string construction)

**Files affected (non-exhaustive):** SidebarGroup, SidebarHeader, SidebarFooter, SectionFilter, SectionRow, TopicRow, QuestionCard, SessionRow, SessionSwitcherModal, SearchGroup, ActionsGroup, DifficultyFilter, ContentTree add-forms.

### D-02 — Padding / density reduction

**Decision:** Tighten vertical padding in the content tree and sidebar without dropping below `min-h-[44px]` touch targets.

| Location | Current | Target |
|----------|---------|--------|
| SectionRow toggle button | `py-3` | `py-2` |
| SectionRow delete button | `py-3` | `py-2` |
| TopicRow toggle button | `py-2` | `py-1.5` |
| TopicRow delete button | `py-2` | `py-1.5` |
| SectionFilter buttons | `py-2` | `py-1.5` |
| SidebarGroup content | `pb-3` | `pb-2` |
| ContentTree add-section/topic buttons | `py-2` | `py-1.5` |

QuestionCard row already at `py-1.5` — keep as-is.
`min-h-[44px]` on all interactive elements — keep as-is (touch target rule).

### D-03 — SidebarGroup expand/collapse animation

**Decision:** `grid-template-rows: 0fr → 1fr` transition.

**Implementation pattern:**
```tsx
// SidebarGroup.tsx — replace hidden attr approach:
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
- Remove `hidden` attribute (breaks CSS animation)
- Static `style` prop is acceptable here; the `grid-template-rows` value can't be a Tailwind class due to dynamic content (two literal states only → acceptable)
- `motion-safe:` prefix (opt-in) — consistent with SessionRow and UndoToast

### D-04 — Note textarea toggle animation (QuestionCard + TopicRow)

**Decision:** Same `grid-template-rows` technique as D-03.

**QuestionCard implementation:**
- Wrap `<textarea>` in `<div className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden" style={{ gridTemplateRows: notesOpen ? '1fr' : '0fr' }}>`
- Inner wrapper: `<div className="min-h-0">`
- Remove the `hidden` conditional class from `<textarea>`
- Keep `print:h-auto print:overflow-visible print:resize-none` on the textarea itself

**TopicRow implementation:** Same pattern around the topic notes `<textarea>`.

### D-05 — Content-tree row fade-in animation

**Decision:** CSS keyframe `fade-in` on SectionRow, TopicRow, and QuestionCard mounts. No exit animation (TanStack Virtual removes rows from DOM instantly on collapse — exit animations are not feasible).

**Implementation:**
- Define `@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }` in `src/index.css` (or global CSS)
- Add class `motion-safe:animate-[fade-in_150ms_ease-out]` to the outermost `<div>` of SectionRow, TopicRow, and QuestionCard
- Only `motion-safe:` — users with `prefers-reduced-motion: reduce` get no animation

### D-06 — Modal open/close animation

**Decision:** CSS `@starting-style` + `transition` on `<dialog>` elements.

**Implementation** (applied via global CSS, not inline):
```css
/* src/index.css */
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

**Rationale:** Chrome Extension = Chrome 117+ guaranteed. `@starting-style` is supported in Chrome 117+, Firefox 129+, Safari 17.4+. No JS changes needed to modal components (showModal/close calls stay as-is).

### D-07 — motion-safe convention

**Decision:** Use `motion-safe:` prefix (opt-in) for all new Phase 19 transitions. Do not retroactively change the existing `motion-reduce:transition-none` on Sidebar.tsx and SidebarGroup chevron — too risky, pre-existing pattern.

### D-08 — D-06 Tailwind compliance (static classes)

All new Tailwind classes must be static string literals per the project's D-06 rule. The `grid-template-rows` values are applied via inline `style` prop where dynamic (two-state toggle) — this is acceptable per the project constraint since Tailwind arbitrary values for dynamic CSS custom properties are not reliably tree-shakeable in v4.

---

## Scope Fence

**In scope:**
- `text-sm` → `text-[13px]` across all component files
- Padding tightening per D-02 table
- SidebarGroup grid-transition (D-03)
- QuestionCard + TopicRow textarea grid-transition (D-04)
- SectionRow / TopicRow / QuestionCard fade-in (D-05)
- Dialog `@starting-style` animation (D-06)
- `@keyframes fade-in` keyframe in global CSS

**Out of scope / deferred:**
- Sidebar open/close transition — already implemented (`transition-transform duration-200 ease-in-out` in Sidebar.tsx)
- Changing `motion-reduce:transition-none` on existing Sidebar.tsx / SidebarGroup chevron
- Animating dialog close (opacity fade-out on close handled by `display allow-discrete` in D-06 CSS)
- Any font changes beyond `text-sm` → `text-[13px]`

---

## Codebase Patterns Observed

- Icon sizing: `w-4 h-4` inline, `w-5 h-5` standalone action buttons (Phase 18)
- D-06: No dynamic Tailwind class construction
- Test framework: vitest + @testing-library/react
- Pre-existing tsc errors in test fixture files — not blocking
- `motion-reduce:transition-none` on Sidebar.tsx (existing) and SidebarGroup chevron (existing) — leave intact
- `motion-safe:transition-opacity` pattern (SessionRow) — model for new motion-safe usage
- `@keyframes` in CSS: UndoToast uses `animate-[slide-up_150ms_ease-out]` — Phase 19 adds `animate-[fade-in_150ms_ease-out]` using same pattern
