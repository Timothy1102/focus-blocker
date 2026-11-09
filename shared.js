// Helpers shared by the popup, the background service worker and the blocked page.

export const STORAGE_KEY = 'sites';
export const HISTORY_KEY = 'blockHistory';

/**
 * Turns whatever the user typed ("https://www.Facebook.com/feed", "facebook.com",
 * "m.instagram.com") into a bare domain ("facebook.com"). Returns null when the
 * input is not a usable domain.
 */
export function normalizeDomain(input) {
  let value = String(input ?? '').trim().toLowerCase();
  if (!value) return null;

  // Allow plain domains by adding a scheme so URL() can parse them.
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(value)) value = `https://${value}`;

  let host;
  try {
    host = new URL(value).hostname;
  } catch {
    return null;
  }

  host = host.replace(/\.$/, '').replace(/^www\./, '');

  // At least one dot, labels of letters/digits/hyphens, and a TLD that starts with a letter.
  const valid = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]+$/.test(host);
  return valid ? host : null;
}

/** True when `hostname` is `domain` itself or any of its subdomains. */
export function hostMatches(hostname, domain) {
  const host = hostname.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

/** Reads the block list: [{ domain: string, enabled: boolean }]. */
export async function getSites() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY] : [];
}

export async function setSites(sites) {
  await chrome.storage.local.set({ [STORAGE_KEY]: sites });
}

export function blockedPagePath(domain) {
  return `/blocked.html?site=${encodeURIComponent(domain)}`;
}

/** Path of the blocked page when it stands in for the browser's history page. */
export const HISTORY_BLOCKED_PATH = '/blocked.html?page=history';

/**
 * True for the browser's built-in history page (chrome://history, edge://history, ...),
 * including any path, query or hash after it. Extensions cannot redirect these with
 * declarativeNetRequest, so the background worker watches tab URLs instead.
 */
export function isHistoryUrl(url) {
  return /^(?:chrome|edge|brave|vivaldi|opera):\/\/history(?:[/?#]|$)/i.test(String(url ?? ''));
}

/** Whether the "block browser history" switch is on. Off by default. */
export async function getBlockHistory() {
  const stored = await chrome.storage.local.get(HISTORY_KEY);
  return stored[HISTORY_KEY] === true;
}

export async function setBlockHistory(enabled) {
  await chrome.storage.local.set({ [HISTORY_KEY]: Boolean(enabled) });
}
