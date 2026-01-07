function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const api = typeof browser !== "undefined" ? browser : chrome;

async function ensureToday() {
  const { usageDate } = await api.storage.local.get(["usageDate"]);
  const today = todayKey();
  if (usageDate !== today) {
    await api.storage.local.set({ usage: {}, usageDate: today });
  }
}

let currentDomain = null;
let lastTick = null;

async function commitTime() {
  if (!currentDomain || !lastTick) return;

  await ensureToday();

  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;

  chrome.storage.local.get(["usage"], ({ usage = {} }) => {
    usage[currentDomain] = (usage[currentDomain] || 0) + delta;
    chrome.storage.local.set({ usage });
  });
}

async function updateActiveTab() {
  const [tab] = await api.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (!tab?.url || !tab.url.startsWith("http")) {
    currentDomain = null;
    lastTick = null;
    return;
  }

  const domain = new URL(tab.url).hostname;
  if (domain !== currentDomain) {
    await commitTime();
    currentDomain = domain;
    lastTick = Date.now();
  }
}

chrome.alarms.create("tick", { periodInMinutes: 1 / 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tick") commitTime();
});

chrome.tabs.onActivated.addListener(updateActiveTab);
chrome.tabs.onUpdated.addListener(updateActiveTab);
chrome.windows.onFocusChanged.addListener(updateActiveTab);

chrome.runtime.onStartup.addListener(updateActiveTab);
chrome.runtime.onInstalled.addListener(updateActiveTab);

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg === "GET_DATA") {
    ensureToday().then(() => {
      chrome.storage.local.get(["usage"], ({ usage = {} }) => {
        sendResponse(
          Object.entries(usage).map(([domain, ms]) => ({ domain, ms }))
        );
      });
    });
    return true;
  }
});
