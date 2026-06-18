# CWS Fresh-Profile Smoke Test

CWS-04 requires the extension to load cleanly in a Chrome profile that is **not** the developer profile. Run this checklist end-to-end after the production build is ready (`dist/` from Plan 10-02 task 1) and before pressing **Submit** in the Chrome Web Store Developer Dashboard. Implements decision D-06.

**Recommended fresh-profile options:**

- Create a fresh Chrome profile via `chrome://profile-picker` → **Add → Without an account**.
- Use **Chrome Canary** as a separate browser binary.
- Launch a temporary profile from the command line: `--user-data-dir=/tmp/cws-smoke-profile` (macOS: `open -na "Google Chrome" --args --user-data-dir=/tmp/cws-smoke-profile`).

Tick every box. Record the date and Chrome version at the bottom when finished.

## 1. Pre-flight

- [ ] `dist/` exists at the repo root (output of `npm run build`).
- [ ] `dist.zip` exists at the repo root (output of the Plan 10-02 packaging step).
- [ ] No other copy of Interviewer Checklist is installed in the test profile (check `chrome://extensions`).

## 2. Install

- [ ] Open `chrome://extensions` in the test profile.
- [ ] Enable **Developer mode** (top-right toggle).
- [ ] Click **Load unpacked** and select the `dist/` directory.
- [ ] No error banner appears on the Interviewer Checklist extension card.
- [ ] Service worker shows as **active** (or registers on first action click) under the extension's details.

## 3. First-run welcome flow (POLISH-01)

- [ ] A new tab opens automatically with the welcome page.
- [ ] The welcome page shows the title, the version string (1.0.0), the "Pin to your toolbar" section, and two audience cards (Interviewer / Candidate).
- [ ] Clicking **Start demo session** navigates to the main app with the seeded demo session loaded.

## 4. Toolbar action and shortcut (FOUND-03, POLISH-02)

- [ ] Clicking the toolbar icon opens the app in a full-page tab.
- [ ] The keyboard shortcut **Alt+Shift+I** (macOS: **Cmd+Shift+I**) also opens the app.

## 5. Core scoring loop (SCORE-01..06)

- [ ] Moving a 0–10 slider on at least one question updates the live topic mark.
- [ ] Setting a manual topic override replaces the computed mark; clearing it restores the computed mark.
- [ ] Typing in per-question and per-topic notes persists across a page reload.
- [ ] Opening **Candidate Details** and saving name / email / role / date persists across reload.
- [ ] Adding a custom question shows a **custom** badge and participates in scoring.
- [ ] **Reset All** (with confirmation) clears scores, overrides, notes, and customs in the active session.

## 6. Sessions (SESS-01..04)

- [ ] Opening the session switcher shows the active session.
- [ ] Creating a new session, renaming it, duplicating it, and deleting it all work.
- [ ] Deleting a session shows an undo toast.
- [ ] Switching sessions does not corrupt data: set scores in session A → switch to B → switch back → scores in A are intact.

## 7. YAML import / export (YAML-01..03)

- [ ] **Export** produces a structural YAML file with `meta`, `candidate`, and `sections` blocks.
- [ ] Importing that same file into a new session shows the preview modal and applies correctly.
- [ ] Importing a legacy progress-only YAML matches by stable IDs and applies scores without losing the bank.

## 8. AI prompt (AI-01, AI-02)

- [ ] The **AI Prompt** modal opens from the populated session.
- [ ] The prompt body embeds the candidate details and computed marks.
- [ ] The **Copy** button copies the full text to the clipboard (verify by pasting into a notes app).

## 9. UI shell (UI-01..08)

- [ ] Sidebar collapse / expand works (icon-only state when collapsed).
- [ ] On a narrow viewport (< 900px wide) the sidebar becomes an overlay.
- [ ] Search debounces (typing fast does not thrash) and shows the live result count.
- [ ] Difficulty + section multi-select filters work and show live counts.
- [ ] Dark mode toggle works and persists across reload.
- [ ] Tab order is sensible; focus rings are visible on every interactive element.
- [ ] `prefers-reduced-motion` suppresses non-essential animation (test with macOS System Settings → Accessibility → Display → Reduce motion).

## 10. Print (POLISH-05)

- [ ] **Cmd/Ctrl+P** preview shows all collapsed cards expanded.
- [ ] The sidebar and toolbar controls are hidden in print preview.

## 11. Keyboard shortcuts (POLISH-03)

- [ ] `/` focuses the sidebar search input.
- [ ] `\` toggles the sidebar collapsed state.
- [ ] `Esc` clears the search input when focused there; closes the active modal otherwise.
- [ ] Shortcuts do **not** fire while focus is inside a textarea or input (typing `/` or `\` in a notes field inserts the character).

## 12. Storage / no-network (FOUND-02, CWS-01)

- [ ] Open DevTools → **Network** tab. Exercise the app for 60 seconds (score, switch sessions, open AI prompt, import a YAML). Confirm **zero** non-extension network requests appear in the panel.
- [ ] Open `chrome://extensions` → **Inspect views: service worker** → **Application → Storage**. Confirm only `chrome.storage.local` is populated; `chrome.storage.sync`, `localStorage`, `IndexedDB`, and cookies are empty for the extension origin.

## 13. Uninstall (CWS-01)

- [ ] Remove the extension from `chrome://extensions`.
- [ ] Reinstall the extension (Load unpacked → `dist/`).
- [ ] After reinstall, no prior data is visible — the welcome page reappears and no prior sessions exist.

## Sign-off

- **Date of passing run:** _______________
- **Chrome version:** _______________
- **Profile used:** _______________
- **Tester:** _______________
- **Notes:** _______________
