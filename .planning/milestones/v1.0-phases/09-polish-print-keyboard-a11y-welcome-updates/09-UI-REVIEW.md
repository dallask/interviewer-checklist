# Phase 9 — UI Review

**Audited:** 2026-06-18
**Baseline:** 09-UI-SPEC.md (design contract)
**Screenshots:** not captured — no dev server running on ports 3000/5173 (this is a Chrome extension; runtime UI is loaded via `chrome.runtime.getURL` inside the extension context, not a localhost dev server). Audit is code-only.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Welcome, banner, and footer copy match UI-SPEC verbatim; search placeholder missing the `(/)` shortcut hint declared in spec. |
| 2. Visuals | 4/4 | Clear hierarchy on welcome page (title → subtitle → version → pin → cards → CTAs); banner uses dismiss + inline action; sidebar footer has `mt-auto` placement. |
| 3. Color | 4/4 | Accent blue used only for focus rings + welcome primary CTA + secondary link, exactly matching the "welcome page is the only place a filled blue button appears" carve-out. Amber/yellow warning palette on banner matches StorageToast pattern. |
| 4. Typography | 4/4 | Welcome surface uses exactly the declared extended scale (text-3xl/xl/base/xs with font-semibold/normal). Banner uses text-base/font-normal as specified. Footer uses text-xs. Two-weight rule (400 + 600) maintained. |
| 5. Spacing | 4/4 | Welcome uses px-6 py-16 (24/64), mb-2/mb-3/mb-8 (8/12/32), gap-6 (24), p-6 (24), py-4 px-6 CTA (16/24). All multiples of 4 within the declared scale. min-h-[44px] arbitrary value justified by 44px touch-target exception in spec. |
| 6. Experience Design | 3/4 | Storage onChanged listener (WR-08), focus rings on every interactive, skip link, aria-expanded on changelog toggle, aria-live banner. Missing: `print:break-inside-avoid` on topic rows (spec calls this out explicitly). |

**Overall: 22/24**

---

## Top 3 Priority Fixes

1. **Search placeholder missing shortcut hint** — `SearchGroup.tsx:70` uses `placeholder="Search questions…"` but UI-SPEC Copywriting Contract requires `"Search questions… (/)"` as the zero-cost discoverability aid for POLISH-03. Fix: change the placeholder string to include ` (/)` suffix.
2. **`print:break-inside-avoid` missing on topic rows** — UI-SPEC § Surface 4 ("Print Layout") states "`print:break-inside-avoid` on each topic row to prevent awkward mid-topic page breaks." Grep confirms zero occurrences in the codebase. Fix: add `print:break-inside-avoid` to the topic row wrapper in `TopicRow.tsx`.
3. **No empty-state copy for changelog** — `ChangelogViewer.tsx:15` renders `changelogContent || 'No changelog entries found.'`. Because `CHANGELOG.md` is bundled at build time, `changelogContent` is always truthy (even if the file is empty, it returns `""` which is falsy — but a CHANGELOG with whitespace passes through). The fallback exists but the UI-SPEC declares the empty state heading "What's new in this version" should wrap the content; the viewer renders raw markdown without a heading. Fix: add an `<h2 class="text-xs font-semibold mb-2 px-3">What's new in this version</h2>` above the `<pre>` and verify the empty-state fallback shows when content is blank/whitespace-only.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

PASS — Verbatim contract match:
- Welcome page title, subtitle, pin nudge heading + body, both card headings + bodies, primary CTA "Open the extension", secondary "View demo session" — all match UI-SPEC § Copywriting Contract exactly (`Welcome.tsx:62-133`).
- Update banner: `"Updated to v{currentVersion}."` (`UpdateBanner.tsx:108`) + `"What's new"` button + `aria-label="Dismiss update banner"` (line 119) — exact match.
- Sidebar footer: `v{version}` + `"What's new"` toggle (`SidebarFooter.tsx:28-35`) — exact match.

FAIL:
- **`SearchGroup.tsx:70`** — `placeholder="Search questions…"`. UI-SPEC says `"Search questions… (/)"`. Missing the `(/)` shortcut hint. The contract is explicit even though it's labeled "optional, Claude's discretion" elsewhere — the Copywriting Contract row treats it as required.

### Pillar 2: Visuals (4/4)

- Welcome page: page title → subtitle → version line → pin section → 2-card grid → CTAs. Clear focal point (page title is text-3xl semibold, all others smaller).
- Banner: `role="status"`, dismissible, inline action button, `flex items-center justify-between` provides clean L/R layout.
- Sidebar footer: `mt-auto` pushes to bottom; collapsible reveals below the version row.
- Icon-only dismiss "×" button has `aria-label="Dismiss update banner"` (`UpdateBanner.tsx:119`).

### Pillar 3: Color (4/4)

- Accent blue distribution in new files:
  - Welcome.tsx: blue used on skip-link focus ring, primary CTA bg-blue-600 (the documented carve-out), secondary text-blue-600 link, focus rings. Matches spec.
  - UpdateBanner.tsx: amber-50/amber-300/amber-800 light + yellow-900/yellow-700/yellow-200 dark — matches StorageToast warning palette exactly.
  - SidebarFooter.tsx: gray-400 metadata + gray-200 border + blue focus ring — no accent overuse.
  - ChangelogViewer.tsx: gray-600/gray-400 body — clean.
- No hardcoded hex colors (`grep #[0-9a-f]` returned zero hits in the audited files).

### Pillar 4: Typography (4/4)

Welcome.tsx distinct sizes/weights in use:
- Sizes: text-3xl (title), text-xl (section + card headings), text-base (subtitle, body, CTAs), text-xs (version line). Exactly 4 sizes — matches extended welcome scale.
- Weights: font-semibold (headings + primary CTA) + font-normal (everything else). 2-weight rule maintained.

UpdateBanner.tsx: text-base font-normal (matches spec line 159).

SidebarFooter.tsx + ChangelogViewer.tsx: text-xs font-normal (matches spec lines 228, 242).

### Pillar 5: Spacing (4/4)

All spacing classes are multiples of 4 (declared scale tokens). Notable usages:
- Welcome: `px-6 py-16` (24/64), `mb-2 mb-3 mb-8` (8/12/32), `gap-6 my-8 p-6` (24/32/24), CTA `px-6 py-4` (24/16).
- Banner: `px-4 py-2` (16/8) — matches spec exception.
- Footer: `px-3 py-2` (12/8) — matches existing ActionsGroup pattern.

Arbitrary value `min-h-[44px]` appears on Welcome CTAs and QuestionCard slider row — justified by spec's 44px touch-target exception.

### Pillar 6: Experience Design (3/4)

PASS:
- Loading: storage reads handled with `chrome.runtime.lastError` guard (`UpdateBanner.tsx:42, 70`).
- Error: try/catch on Welcome storage writes (`Welcome.tsx:37-47`), `.catch` on dismiss write.
- Empty states: ChangelogViewer fallback string present.
- Disabled / a11y: `aria-expanded`, `aria-live="polite"`, `aria-atomic="true"`, `role="status"`, skip-link, focus-visible rings on every interactive.
- Cross-tab reactivity: `chrome.storage.onChanged` listener (WR-08 fix) prevents stale state.

FAIL:
- **`print:break-inside-avoid` missing** — UI-SPEC explicitly requires this on topic rows. Zero matches in codebase. Printed sessions can break a topic across pages.
- Search shortcut hint missing (also counted under Copywriting) reduces discoverability of POLISH-03.

---

## Files Audited

- src/app/Welcome.tsx
- src/app/welcome.html
- src/app/welcome-main.tsx
- src/app/main.tsx
- src/components/UpdateBanner.tsx
- src/components/ChangelogViewer.tsx
- src/components/SidebarFooter.tsx
- src/components/Sidebar.tsx (modified for footer mount + print:hidden)
- src/components/SearchGroup.tsx (placeholder check)
- src/components/QuestionCard.tsx (print:hidden / print:block / print readout)
- src/components/TopicRow.tsx (print:hidden / print utilities)
- src/components/ContentTree.tsx (print candidate header)
- src/hooks/useKeyboardShortcuts.ts
- src/hooks/usePrintExpansion.ts
- src/store/app.ts (printMode field)
- manifest.json (_execute_action)
