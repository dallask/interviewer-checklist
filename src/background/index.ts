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
