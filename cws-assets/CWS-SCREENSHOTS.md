# CWS Screenshots — Capture Checklist

The Chrome Web Store requires at least three screenshots for a published listing. This document specifies exactly three required shots at **1280×800 pixels**, in **PNG** format, captured inside real Chrome (no third-party screenshot tool window-chrome). Implements decisions D-04 (manual capture in real Chrome) and D-05 (1280×800 target size). Final captures live in `cws-assets/screenshots/`.

## How to capture

1. Build the production bundle: `npm run build` produces `dist/` (covered in Plan 10-02 task 1).
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `dist/` directory.
3. Click the toolbar action to open the extension in a full Chrome window.
4. Open **DevTools** (Cmd/Ctrl+Option+I), click the **device toolbar** toggle (Cmd/Ctrl+Shift+M), set the mode to **Responsive**, and enter dimensions exactly **`1280 × 800`**.
5. In the DevTools `...` (overflow) menu choose **Capture screenshot**. This produces a pixel-perfect 1280×800 PNG without any window chrome.
6. Save each PNG into `cws-assets/screenshots/` using the exact filenames in the table below.

## Required shots

| # | Filename | What MUST be visible | State setup |
| - | -------- | -------------------- | ----------- |
| 1 | `01-scoring-view-populated.png` | A populated scoring view: at least one expanded section in the content area, multiple visible question cards with non-zero 0–10 score sliders, at least one topic showing a live difficulty-weighted mark with a color band, and the sidebar visible on the left with the active session name. | From the welcome page, click **Start demo session**. Score 6–8 questions across at least two topics at varying levels (mix low / mid / high). Make sure at least one topic shows a computed (non-zero) mark with a color band. Confirm no Candidate Details modal is open. |
| 2 | `02-sidebar-with-filters.png` | The sidebar with multiple filter groups active: expanded **Search**, **Difficulty** (at least one level selected), and **Sections** (at least 2 sections selected) groups; the live result count visible; the content area on the right showing the filtered tree. | In the populated demo session, type a non-trivial search term (`react` or `system design`) into the sidebar search field. Check at least one difficulty level checkbox. In the Sections group, select at least two sections. Wait for the debounce so the result count and filtered tree are in sync. |
| 3 | `03-ai-prompt-modal.png` | The AI prompt modal as a centered overlay: the textarea pre-populated with the candidate-feedback prompt, the **Copy** button visible, and at least the candidate name from the demo session present in the prompt body. | From the populated session, open **Actions → AI Prompt** (or the matching menu entry). Verify the modal renders with text in the textarea before capturing. |

## What MUST NOT appear

- No empty-state screens or zero-score views — every shot must reflect real, populated UX.
- No DevTools panel (toggle device toolbar **without** showing the DevTools dock — undock to a separate window before capturing, or close DevTools after setting the viewport size).
- No browser window chrome (address bar, tab strip, OS title bar) — the DevTools "Capture screenshot" output already excludes these.
- No other tabs visible.
- No personally-identifying real data — use only the seeded demo session. Do not paste real candidate names, emails, or notes.
- No mouse cursor overlays.

## After capture

- Verify each file is exactly **1280×800**. Quick checks:
  - macOS: open the PNG in Preview → **Tools → Show Inspector** → check **Image Size**.
  - With ImageMagick installed: `identify cws-assets/screenshots/*.png` should print `1280x800` for each.
  - From the shell on macOS: `sips -g pixelWidth -g pixelHeight cws-assets/screenshots/01-scoring-view-populated.png`.
- The `cws-assets/screenshots/` directory is gitignored by default. To commit the captured PNGs, force-add them: `git add -f cws-assets/screenshots/*.png`. This is intentional — keeps accidental binary commits opt-in.
- Once the three PNGs are added, commit them with a clear message (`docs(10): add CWS screenshot captures`).
- Upload each PNG to the **Store listing → Screenshots** section of the CWS Developer Dashboard during submission (Plan 10-03).
