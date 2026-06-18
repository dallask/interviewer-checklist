chrome.runtime.onInstalled.addListener((details) => {
  // WR-06: in MV3 the service worker can terminate while a Promise is
  // pending. Sequence ALL storage writes ahead of chrome.tabs.create so
  // the most critical state-persisting work commits first; if the SW
  // dies between writes and the welcome-tab open, the demo session and
  // manifest are still seeded and Welcome's "View demo session" CTA
  // lands on a session that exists. The async work is wrapped in a
  // self-invoking IIFE so the callback itself is sync and returns
  // immediately — keeping the SW alive across awaits is not load-bearing.
  (async () => {
    try {
      if (details.reason === 'install') {
        const now = new Date().toISOString();
        const currentVersion = chrome.runtime.getManifest().version;
        // Batch the seed writes so they commit together. Promise.all
        // also ensures we don't open the welcome tab before any of the
        // critical state has landed.
        await Promise.all([
          chrome.storage.local.set({
            manifest: {
              version: 2,
              activeSessionId: 'demo',
              sessions: [
                {
                  id: 'demo',
                  name: 'Demo Candidate',
                  createdAt: now,
                  updatedAt: now,
                },
              ],
            },
          }),
          chrome.storage.local.set({
            'session:demo': {
              version: 3,
              id: 'demo',
              scores: {
                'js-basics-fundamentals-0': 8,
                'js-basics-fundamentals-1': 6,
                'js-basics-closures-0': 7,
              },
              overrides: {},
              notes: {},
              topicNotes: {},
              customQuestions: [],
              candidate: {
                name: 'Demo Candidate',
                email: '',
                role: 'Senior Engineer',
                date: new Date().toISOString().slice(0, 10),
                interviewer: '',
                details: '',
              },
            },
          }),
          // On first install, seed `lastSeenVersion` to the current
          // manifest version so the UpdateBanner does not fire on day one.
          chrome.storage.local.set({ lastSeenVersion: currentVersion }),
        ]);

        const result = await chrome.storage.local.get('hasSeenWelcome');
        if (!result.hasSeenWelcome) {
          await chrome.tabs.create({
            url: chrome.runtime.getURL('src/app/welcome.html'),
          });
        }
      }
      // On `update` / `chrome_update`: do NOT touch `lastSeenVersion` here.
      // UpdateBanner reads it, compares to the manifest version, renders
      // the banner, and writes `lastSeenVersion = currentVersion` after
      // the user dismisses it (so the banner does not re-appear on next
      // launch).
    } catch (err) {
      console.error('[interviewer-checklist] onInstalled handler failed:', err);
    }
  })();
});

chrome.action.onClicked.addListener(async () => {
  try {
    const url = chrome.runtime.getURL('src/app/app.html');
    const [existing] = await chrome.tabs.query({ url });
    if (existing?.id != null) {
      await chrome.tabs.update(existing.id, { active: true });
      if (existing.windowId != null) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
    } else {
      await chrome.tabs.create({ url });
    }
  } catch (err) {
    console.error('[interviewer-checklist] toolbar click failed:', err);
  }
});
