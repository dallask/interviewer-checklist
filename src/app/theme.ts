// FOUC prevention — applies dark class before React mounts
// MV3 CSP bans inline scripts; this external module is loaded via <script type="module"> in app.html

// Apply OS preference synchronously (no callback) to minimize flash
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Override with stored preference once chrome.storage.local resolves
chrome.storage.local.get(['darkMode'], (result) => {
  if (chrome.runtime.lastError) return; // fail silently — T-04-01-01 guard
  if (typeof result.darkMode === 'boolean') {
    document.documentElement.classList.toggle('dark', result.darkMode);
  }
});
