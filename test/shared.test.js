import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeDomain, hostMatches, blockedPagePath, isHistoryUrl } from '../shared.js';

test('normalizeDomain reduces URLs and bare domains to a lowercase domain', () => {
  assert.equal(normalizeDomain('facebook.com'), 'facebook.com');
  assert.equal(normalizeDomain('  Facebook.COM  '), 'facebook.com');
  assert.equal(normalizeDomain('https://www.Facebook.com/feed'), 'facebook.com');
  assert.equal(normalizeDomain('http://example.co.uk/path?q=1#frag'), 'example.co.uk');
  assert.equal(normalizeDomain('facebook.com.'), 'facebook.com');
  assert.equal(normalizeDomain('twitch.tv'), 'twitch.tv');
});

test('normalizeDomain strips only a leading "www." and keeps other subdomains', () => {
  assert.equal(normalizeDomain('www.reddit.com'), 'reddit.com');
  assert.equal(normalizeDomain('m.instagram.com'), 'm.instagram.com');
});

test('normalizeDomain rejects input that is not a domain', () => {
  for (const input of ['', '   ', null, undefined, 'localhost', 'not a domain', '192.168.1.1', 'foo.', '-bad-.com']) {
    assert.equal(normalizeDomain(input), null, `expected ${JSON.stringify(input)} to be rejected`);
  }
});

test('hostMatches matches the domain itself and its subdomains only', () => {
  assert.equal(hostMatches('facebook.com', 'facebook.com'), true);
  assert.equal(hostMatches('www.facebook.com', 'facebook.com'), true);
  assert.equal(hostMatches('WWW.Facebook.com', 'facebook.com'), true);
  assert.equal(hostMatches('a.b.facebook.com', 'facebook.com'), true);

  assert.equal(hostMatches('notfacebook.com', 'facebook.com'), false);
  assert.equal(hostMatches('facebook.com.evil.example', 'facebook.com'), false);
  assert.equal(hostMatches('example.com', 'facebook.com'), false);
});

test('blockedPagePath encodes the blocked domain into the query string', () => {
  assert.equal(blockedPagePath('facebook.com'), '/blocked.html?site=facebook.com');
  assert.equal(blockedPagePath('a&b=c'), '/blocked.html?site=a%26b%3Dc');
});

test('isHistoryUrl recognises the browser history page and nothing else', () => {
  for (const url of ['chrome://history', 'chrome://history/', 'chrome://history/?q=cats', 'chrome://history/#x', 'edge://history', 'brave://history/', 'CHROME://History']) {
    assert.equal(isHistoryUrl(url), true, `expected ${url} to match`);
  }
  for (const url of ['chrome://settings', 'chrome://historyfoo', 'https://example.com/history', 'chrome-extension://abc/history', '', null, undefined]) {
    assert.equal(isHistoryUrl(url), false, `expected ${String(url)} not to match`);
  }
});
