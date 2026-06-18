---
phase: 4
slug: shell-sidebar-read-only-content-tree
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-06-17
---

# Phase 4 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 + @testing-library/react |
| **Quick run command** | `npx vitest run src/store/ src/utils/ src/components/` |
| **Full suite command** | `npm test && npm run ci` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** `npm test` + visual check in Chrome
- **After every plan wave:** `npm test && npm run ci && npm run build`
- **Max feedback latency:** 30 seconds automated; human check for UI interactions

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-T1 | 04-01 | 1 | UI-06 | unit | `npx vitest run src/app/` | ❌ Wave 0 | ⬜ pending |
| 04-01-T2 | 04-01 | 1 | UI-02, UI-03, UI-04, UI-05, UI-06 | unit | `npx vitest run src/store/ src/utils/` | ❌ Wave 0 | ⬜ pending |
| 04-02-T1 | 04-02 | 2 | UI-01, UI-02, UI-03, UI-04, UI-05, UI-07, UI-08 | unit+visual | `npx vitest run src/components/` | ❌ Wave 0 | ⬜ pending |
| 04-02-T2 | 04-02 | 2 | STORE-06 (ContentTree + StorageToast) | unit+visual | `npx vitest run src/components/` | ❌ Wave 0 | ⬜ pending |
| 04-03-T1 | 04-03 | 3 | UI-01–UI-08 | visual | human + `npm run build` | ❌ Wave 0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Install `@testing-library/react`, `@testing-library/user-event`, `@tanstack/react-virtual`
- [ ] Create `src/app/styles.css` with Tailwind v4 directives + `@custom-variant dark`
- [ ] Create `src/store/app.ts` (Zustand store stub)
- [ ] Create `src/store/app.test.ts` stub
- [ ] Create `src/utils/theme.ts` (FOUC-safe dark mode)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode FOUC prevention | UI-06 | Requires real Chrome extension page load | Hard-reload extension page; verify no flash of light-then-dark |
| Sidebar overlay on narrow viewport | UI-01 | Visual layout check | Resize window to ≤768px, confirm sidebar overlays content |
| prefers-reduced-motion sidebar animation | UI-08 | Requires system preference change | Enable reduced motion in macOS settings, confirm no slide animation |
| Keyboard navigation through question tree | UI-07 | Screen reader + keyboard test | Tab through sidebar filters and question cards; verify focus rings visible |

---

## Security Threat Model

| Threat | Mitigation | Status |
|--------|------------|--------|
| FOUC reveals dark/light preference | External theme.ts loaded before React | ⬜ pending |
| MV3 CSP violation via inline script | No inline scripts; external theme.ts only | ⬜ pending |
| Set fields corrupted in storage | Array serialization in subscribe; Set reconstruction in hydration | ⬜ pending |
