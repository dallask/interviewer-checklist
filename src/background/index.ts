chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      const result = await chrome.storage.local.get('hasSeenWelcome');
      if (!result.hasSeenWelcome) {
        await chrome.tabs.create({ url: chrome.runtime.getURL('src/app/welcome.html') });
      }
      await chrome.storage.local.set({
        manifest: {
          version: 1,
          activeSessionId: 'demo',
          sessions: [{ id: 'demo', name: 'Demo Candidate', createdAt: Date.now() }],
        },
      });
      await chrome.storage.local.set({
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
      });
    }
    const currentVersion = chrome.runtime.getManifest().version;
    await chrome.storage.local.set({ lastSeenVersion: currentVersion });
  } catch (err) {
    console.error('[interviewer-checklist] onInstalled handler failed:', err);
  }
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
