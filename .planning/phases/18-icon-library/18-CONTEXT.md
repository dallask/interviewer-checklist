# Phase 18: Icon Library - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all ad-hoc emoji and icon-like text characters in UI chrome with Lucide React SVG glyphs. Scope covers every character that functions as a visual icon in interactive controls or structural UI elements — including emoji AND the `×` close/dismiss character (U+00D7). User-authored section icon fields (AddSectionForm) are excluded — those are user content, not UI chrome.

Lucide React (`lucide-react`) will be installed as a new dependency.

</domain>

<decisions>
## Implementation Decisions

### Icon Library Selection
- **D-01:** Use Lucide React — already decided (STATE.md). Tree-shakeable, MIT, React 19 compatible, material-like aesthetic.
- **D-02:** Import individual named icons: `import { Menu, Pencil, X, Search } from 'lucide-react'` — enables tree-shaking, same pattern used in most React projects.

### Scope: What Gets Replaced
- **D-03:** `×` (U+00D7 MULTIPLICATION SIGN) in 11 components is IN SCOPE — replace with Lucide `X` icon. VIS-03 targets ad-hoc icon usage, and `×` is used exclusively as a close/delete icon.
- **D-04:** `✓` (U+2713 CHECK MARK) in SessionRow is IN SCOPE — replace with Lucide `Check` icon (active session indicator).
- **D-05:** AddSectionForm editable icon field (default `🔧`, user can enter any emoji) is OUT OF SCOPE — this is user-authored content, not UI chrome.

### Full Replacement Inventory
Ordered by file (verified by codebase scan):

| Emoji / char | File | Line | Lucide replacement |
|---|---|---|---|
| `☰` | `src/app/App.tsx:96` | 96 | `Menu` |
| `☰` | `src/components/SidebarHeader.tsx:79` | 79 | `Menu` |
| `📝` | `src/components/QuestionCard.tsx:130` | 130 | `Pencil` |
| `📋` | `src/components/SectionFilter.tsx:44` | 44 | `ClipboardList` |
| `🔍` | `src/components/Sidebar.tsx:38` (icon prop) | 38 | `Search` |
| `📋` | `src/components/Sidebar.tsx:58` (icon prop) | 58 | `ClipboardList` |
| `👁` | `src/components/ActionsGroup.tsx:211` | 211 | `Eye` |
| `📥` | `src/components/ActionsGroup.tsx:231` | 231 | `Download` |
| `📤` | `src/components/ActionsGroup.tsx:240` | 240 | `Upload` |
| `🗑` | `src/components/ActionsGroup.tsx:250` | 250 | `Trash2` |
| `✓` | `src/components/SessionRow.tsx:78` | 78 | `Check` |
| `×` | `src/components/QuestionCard.tsx:149` | 149 | `X` |
| `×` | `src/components/SearchGroup.tsx:124` | 124 | `X` |
| `×` | `src/components/SectionRow.tsx:39` | 39 | `X` |
| `×` | `src/components/TopicRow.tsx:86` | 86 | `X` |
| `×` | `src/components/SessionRow.tsx:128` | 128 | `X` |
| `×` | `src/components/SessionSwitcherModal.tsx:100` | 100 | `X` |
| `×` | `src/components/StorageToast.tsx:30` | 30 | `X` |
| `×` | `src/components/UndoToast.tsx:36` | 36 | `X` |
| `×` | `src/components/UpdateBanner.tsx:123` | 123 | `X` |
| `×` | `src/components/TopicMarkDisplay.tsx:116` | 116 | `X` |
| `×` | `src/components/MigrationErrorBanner.tsx:40` | 40 | `X` |

Note: Final Lucide icon name mapping (Pencil vs FilePen, ClipboardList vs List, etc.) is Claude's discretion — pick the best visual fit from Lucide's icon set.

### Icon Sizing Convention
- **D-06:** Two-tier sizing:
  - `w-4 h-4` (16px) — inline icons within text rows (note toggle `📝`, close `×`, active `✓`, small inline icons)
  - `w-5 h-5` (20px) — standalone action buttons (import `📥`, export `📤`, hide-notes `👁`, delete `🗑`, sidebar toggle `☰`)
- **D-07:** `strokeWidth` — use Lucide default (1.5). Do not override unless a specific icon looks too thin/thick at the target size.
- **D-08:** `aria-hidden="true"` on every SVG icon — the containing `<button>` already carries `aria-label`, the icon is decorative.

### Test Strategy
- **D-09:** Tests that query by emoji text (e.g., `getByText('×')`) will break after replacement. Fix by updating test queries to use `getByRole('button', {name: '...'})` or `getByLabelText('...')` — the existing `aria-label` attributes on buttons provide stable query targets. Do NOT add `data-testid` for this purpose (avoids cluttering production DOM with test-only attrs).
- **D-10:** Tests in `*.test.tsx` files that match on emoji/× as button text content should be rewritten to use the button's existing `aria-label`. If a button lacks an `aria-label` (some `×` dismiss buttons), add one during the replacement.

### Claude's Discretion
- Exact Lucide icon name when multiple candidates exist (e.g., `Pencil` vs `FilePen` vs `Edit` for the note icon — pick best visual fit)
- Whether to create a shared `Icon` wrapper component or import Lucide directly at each site
- `strokeWidth` value per-icon if default looks off at the target size

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — VIS-03 requirement definition
- `.planning/ROADMAP.md` §Phase 18 — Success criteria (sidebar actions, toggle buttons, section icons, badge icons)

### Prior Phase Context
- `.planning/phases/17-difficulty-indicators/17-CONTEXT.md` — D-06 static literal class maps pattern (follow for any icon-related class strings)

### No external specs
No external ADRs or design specs — all decisions captured in `<decisions>` above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Emoji Locations (all verified by grep)
- `src/app/App.tsx:96` — `☰` in JSX, the sidebar toggle button body
- `src/components/SidebarHeader.tsx:79` — `☰` same role
- `src/components/QuestionCard.tsx:130` — `📝` in the note toggle `<button>` body
- `src/components/QuestionCard.tsx:149` — `×` in the delete/remove `<button>` body
- `src/components/SectionFilter.tsx:44` — `📋` in a `<span aria-hidden="true">` inside a label
- `src/components/Sidebar.tsx:38,58` — `icon` prop passed as emoji string to a child component (SearchGroup/SectionFilter probably consume it)
- `src/components/ActionsGroup.tsx:211,231,240,250` — 4 emoji in action button bodies (`👁 📥 📤 🗑`)
- `src/components/SessionRow.tsx:78,128` — `✓` active indicator + `×` delete button
- `src/components/SearchGroup.tsx:124` — `×` clear search button
- `src/components/SectionRow.tsx:39` — `×` remove section button
- `src/components/TopicRow.tsx:86` — `×` remove topic button
- `src/components/SessionSwitcherModal.tsx:100` — `×` modal close button
- `src/components/StorageToast.tsx:30` — `×` dismiss toast
- `src/components/UndoToast.tsx:36` — `×` dismiss toast
- `src/components/UpdateBanner.tsx:123` — `×` dismiss banner
- `src/components/TopicMarkDisplay.tsx:116` — `×` (likely remove override or clear)
- `src/components/MigrationErrorBanner.tsx:40` — `×` dismiss error banner

### Established Patterns
- All interactive icon buttons already have `aria-label` (established in Phase 9 polish) — add `aria-label` to any `×` buttons that lack it during replacement
- `aria-hidden="true"` is already used on decorative spans (see `SectionFilter.tsx:44`) — carry this to SVG icons
- Tailwind `w-4 h-4` / `w-5 h-5` size utilities are established and in the content scanner

### Integration Points
- `lucide-react` must be added to `package.json` `dependencies` (not devDependencies — it's a runtime dep)
- Tree-shaking: import named icons per-file, never `import * as icons from 'lucide-react'`
- CRXJS/Vite should handle SVG bundling from lucide-react without additional config

</code_context>

<specifics>
## Specific Ideas

No specific visual references or "I want it like X" moments from discussion. Standard Lucide defaults apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-Icon Library*
*Context gathered: 2026-06-19*
