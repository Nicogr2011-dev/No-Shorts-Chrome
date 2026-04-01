// background.js — No Shorts. No Excuses.

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true, blockedToday: 0, lastDate: new Date().toDateString() });
});
