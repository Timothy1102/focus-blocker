// Helpers shared by the popup, the background service worker and the blocked page.

export const STORAGE_KEY = 'sites';

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
