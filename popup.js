import { normalizeDomain, getSites, setSites } from './shared.js';

const SUGGESTED = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'x.com',
  'twitter.com',
  'reddit.com',
  'netflix.com',
  'twitch.tv',
  'linkedin.com',
];

const form = document.getElementById('add-form');
const input = document.getElementById('site-input');
const errorEl = document.getElementById('error');
const listEl = document.getElementById('site-list');
const emptyEl = document.getElementById('empty');
const summaryEl = document.getElementById('summary');
const currentBtn = document.getElementById('add-current');
const suggestionsEl = document.getElementById('suggestions');
const chipsEl = document.getElementById('chips');

let sites = [];
let currentDomain = null;

function showError(message) {
  errorEl.textContent = message ?? '';
  errorEl.hidden = !message;
}

async function save(next) {
  sites = next;
  await setSites(sites);
  render();
}

// Adds a site (or re-enables it if it is already listed).
async function addSite(raw) {
  const domain = normalizeDomain(raw);
  if (!domain) {
    showError('That doesn’t look like a website. Try something like facebook.com');
    return false;
  }
  showError('');

  const existing = sites.find((site) => site.domain === domain);
  if (existing) {
    if (existing.enabled) {
      showError(`${domain} is already blocked.`);
      return false;
    }
    await save(sites.map((s) => (s.domain === domain ? { ...s, enabled: true } : s)));
    return true;
  }

  await save([{ domain, enabled: true }, ...sites]);
  return true;
}

function renderList() {
  listEl.replaceChildren(
    ...sites.map((site) => {
      const li = document.createElement('li');
      li.classList.toggle('disabled', !site.enabled);

      const label = document.createElement('label');
      label.className = 'switch';
      label.title = site.enabled ? 'Blocking – click to allow' : 'Allowed – click to block';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = site.enabled;
      checkbox.setAttribute('aria-label', `Block ${site.domain}`);
      checkbox.addEventListener('change', () =>
        save(sites.map((s) => (s.domain === site.domain ? { ...s, enabled: checkbox.checked } : s))),
      );
      const track = document.createElement('span');
      track.className = 'track';
      label.append(checkbox, track);

      const name = document.createElement('span');
      name.className = 'domain';
      name.textContent = site.domain;
      name.title = site.domain;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = '×';
      remove.title = `Remove ${site.domain}`;
      remove.setAttribute('aria-label', `Remove ${site.domain}`);
      remove.addEventListener('click', () => save(sites.filter((s) => s.domain !== site.domain)));

      li.append(label, name, remove);
      return li;
    }),
  );
  emptyEl.hidden = sites.length > 0;
}

function renderSuggestions() {
  const listed = new Set(sites.map((s) => s.domain));
  const remaining = SUGGESTED.filter((domain) => !listed.has(domain));

  chipsEl.replaceChildren(
    ...remaining.map((domain) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = `+ ${domain}`;
      chip.addEventListener('click', () => addSite(domain));
      return chip;
    }),
  );
  suggestionsEl.hidden = remaining.length === 0;
}

function renderCurrentSite() {
  const alreadyListed = sites.some((s) => s.domain === currentDomain && s.enabled);
  currentBtn.hidden = !currentDomain || alreadyListed;
  if (!currentBtn.hidden) {
    currentBtn.replaceChildren('Block current site: ', Object.assign(document.createElement('strong'), { textContent: currentDomain }));
  }
}

function render() {
  const active = sites.filter((s) => s.enabled).length;
  summaryEl.textContent = sites.length ? `${active} of ${sites.length} blocking` : '';
  renderList();
  renderSuggestions();
  renderCurrentSite();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (await addSite(input.value)) input.value = '';
  input.focus();
});

input.addEventListener('input', () => showError(''));
currentBtn.addEventListener('click', () => addSite(currentDomain));

async function init() {
  sites = await getSites();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && /^https?:/.test(tab.url)) currentDomain = normalizeDomain(tab.url);
  } catch {
    // No active tab info available; the "block current site" shortcut just stays hidden.
  }

  render();
  input.focus();
}

init();
