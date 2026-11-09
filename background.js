import { STORAGE_KEY, getSites, hostMatches, blockedPagePath } from './shared.js';

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

function enabledDomains(sites) {
  return new Set(sites.filter((s) => s.enabled).map((s) => s.domain));
}

chrome.runtime.onInstalled.addListener(() => queueSync());
chrome.runtime.onStartup.addListener(() => queueSync());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes[STORAGE_KEY]) return;

  const before = enabledDomains(changes[STORAGE_KEY].oldValue ?? []);
  const after = enabledDomains(changes[STORAGE_KEY].newValue ?? []);
  const newlyBlocked = [...after].filter((domain) => !before.has(domain));

  queueSync().then(() => blockOpenTabs(newlyBlocked));
});
