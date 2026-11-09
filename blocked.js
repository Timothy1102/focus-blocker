import { normalizeDomain } from './shared.js';

const MESSAGES = [
  'Take a breath. What were you about to work on?',
  'Future you will be glad you stayed focused.',
  'One scroll turns into an hour. Skip it.',
  'Your attention is worth more than this feed.',
  'Close the tab, do the next small thing.',
];

const site = normalizeDomain(new URLSearchParams(location.search).get('site'));
if (site) {
  document.getElementById('site').textContent = site;
  document.title = `${site} is blocked – Focus Blocker`;
}

document.getElementById('message').textContent =
  MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

document.getElementById('back').addEventListener('click', async () => {
  if (history.length > 1) {
    history.back();
    return;
  }
  // Nothing to go back to (e.g. the site was opened in a fresh tab): close this tab.
  const tab = await chrome.tabs.getCurrent();
  if (tab?.id !== undefined) await chrome.tabs.remove(tab.id);
  else window.close();
});
