// FOUC prevention — applies dark class before React mounts
// MV3 CSP bans inline scripts; this external module is loaded via <script type="module"> in app.html

// Default to dark; override with stored preference or OS preference below
document.documentElement.classList.add('dark');

// Override with stored preference once chrome.storage.local resolves
// darkMode is persisted nested inside uiState (not as a top-level key)
chrome.storage.local.get(['uiState'], (result) => {
  if (chrome.runtime.lastError) return; // fail silently — T-04-01-01 guard
  const stored = (result.uiState as { darkMode?: boolean } | undefined)?.darkMode;
  if (typeof stored === 'boolean') {
    document.documentElement.classList.toggle('dark', stored);
  }
});
