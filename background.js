import {
  STORAGE_KEY,
  HISTORY_KEY,
  HISTORY_BLOCKED_PATH,
  getSites,
  hostMatches,
  blockedPagePath,
  getBlockHistory,
  isHistoryUrl,
} from './shared.js';

// Rebuilds the declarativeNetRequest rules from the stored block list.
// Every enabled site becomes one redirect rule; `requestDomains` also covers subdomains.
async function syncRules() {
  const sites = await getSites();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();

  const addRules = sites
    .filter((site) => site.enabled)
    .map((site, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { extensionPath: blockedPagePath(site.domain) },
      },
      condition: {
        requestDomains: [site.domain],
        resourceTypes: ['main_frame'],
      },
    }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules,
  });
}

// Rule updates must not overlap (they would collide on rule ids), so run them one at a time.
let syncQueue = Promise.resolve();
function queueSync() {
  syncQueue = syncQueue.catch(() => {}).then(syncRules);
  return syncQueue;
}

// Rules only apply to new navigations, so tabs that are already open on a newly
// blocked site are sent to the blocked page right away.
async function blockOpenTabs(domains) {
  if (domains.length === 0) return;
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });

  await Promise.all(
    tabs.map(async (tab) => {
      let hostname;
      try {
        hostname = new URL(tab.url).hostname;
      } catch {
        return;
      }
      const domain = domains.find((d) => hostMatches(hostname, d));
      if (!domain) return;
      const url = chrome.runtime.getURL(blockedPagePath(domain));
      await chrome.tabs.update(tab.id, { url }).catch(() => {});
    }),
  );
}

// The browser's history page (chrome://history) cannot be redirected by declarativeNetRequest,
// so tabs that navigate to it are sent to the blocked page while the switch is on.
async function blockHistoryTab(tabId, url) {
  if (tabId === undefined || !isHistoryUrl(url)) return;
  if (!(await getBlockHistory())) return;
  await chrome.tabs.update(tabId, { url: chrome.runtime.getURL(HISTORY_BLOCKED_PATH) }).catch(() => {});
}

async function blockOpenHistoryTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => blockHistoryTab(tab.id, tab.url ?? tab.pendingUrl)));
}

function enabledDomains(sites) {
  return new Set(sites.filter((s) => s.enabled).map((s) => s.domain));
}

chrome.runtime.onInstalled.addListener(() => queueSync());
chrome.runtime.onStartup.addListener(() => queueSync());

chrome.tabs.onCreated.addListener((tab) => blockHistoryTab(tab.id, tab.pendingUrl ?? tab.url));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
  blockHistoryTab(tabId, changeInfo.url ?? tab.pendingUrl ?? tab.url),
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes[HISTORY_KEY]?.newValue === true) blockOpenHistoryTabs();
  if (!changes[STORAGE_KEY]) return;

  const before = enabledDomains(changes[STORAGE_KEY].oldValue ?? []);
  const after = enabledDomains(changes[STORAGE_KEY].newValue ?? []);
  const newlyBlocked = [...after].filter((domain) => !before.has(domain));

  queueSync().then(() => blockOpenTabs(newlyBlocked));
});
