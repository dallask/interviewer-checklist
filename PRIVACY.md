# Privacy Policy — Interviewer Checklist

**Last updated:** 2026-06-18
**Extension version:** 1.0.0

## Summary

This extension stores all data locally in `chrome.storage.local`. No data is transmitted to any external service. No analytics, tracking, or telemetry are used. All data is removed when the extension is uninstalled.

## Data we collect

The extension persists only the data you enter yourself. Specifically:

- Interview scoring sessions (per-question scores 0–10, per-topic manual overrides, computed marks)
- Candidate details: name, email, role, interview date, interviewer, free-text notes
- Per-question and per-topic notes (free-text)
- Custom questions you add to any topic, including their difficulty levels
- User preferences: dark-mode setting, sidebar collapsed state, last-seen extension version, and the `hasSeenWelcome` flag for the first-run welcome page
- Session manifest metadata (session id, name, created-at and updated-at timestamps, active-session pointer)

All of this data is entered by you inside the extension. The extension does not read data from any other source — not from other browser tabs, not from the page DOM, not from the file system (outside of YAML files you explicitly choose to import), and not from any remote server.

## Where data is stored

All data is stored in `chrome.storage.local`, which is an extension-partitioned local store inside your own Chrome profile on your own device. The extension uses no other browser storage surface:

- No `chrome.storage.sync` (no cross-device sync)
- No `localStorage`
- No `IndexedDB`
- No cookies

## Data transmission

This extension does not transmit any data to any external service. It performs no network requests at runtime. There are no analytics, no telemetry, no error reporting, no crash reporting, and no remote configuration.

This is enforced by the extension's locked permission set: only `"storage"` is requested in `manifest.json`. There are no `host_permissions` and no `scripting` permission, so the extension cannot read or write any web page, cannot make HTTP requests to arbitrary origins, and cannot inject any code into other tabs.

## Third-party services

None.

## Data sharing

None. The extension does not share data with anyone because it does not transmit data.

## Data removal

Uninstalling the extension from Chrome (via `chrome://extensions`) removes the extension's `chrome.storage.local` partition automatically. Every stored session, candidate detail, custom question, note, and preference is deleted at that point — there is no copy anywhere else.

You may also clear data manually from inside the extension:

- **Reset All** (with confirmation) clears scores, overrides, notes, custom questions, candidate details, and filters in the active session while preserving the session structure.
- **Delete session** in the session switcher removes a single named session.

## Permissions

| Permission | Purpose |
| ---------- | ------- |
| `storage`  | Save interview scoring sessions, candidate details, custom questions, and user preferences locally to `chrome.storage.local`. Required for the extension to retain any state across browser restarts. |

No other Chrome permissions are requested. The extension declares no `host_permissions`.

## Children's privacy

This extension is a tool for adult job interviewers and candidates and is not directed at children under 13.

## Changes to this policy

If material changes are made, this document will be updated and the date at the top will reflect the change. There is no remote update mechanism — users see updates via the in-app update banner when a new extension version is installed.

## Contact

Questions and concerns can be filed as issues on the GitHub repository: <https://github.com/<owner>/<repo>/issues>
