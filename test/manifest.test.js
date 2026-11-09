import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (name) => JSON.parse(readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8'));
const exists = (path) => existsSync(fileURLToPath(new URL(`../${path}`, import.meta.url)));

const manifest = read('manifest.json');

test('manifest is Manifest V3', () => {
  assert.equal(manifest.manifest_version, 3);
});

test('manifest version matches package.json', () => {
  assert.equal(manifest.version, read('package.json').version);
});

test('every file referenced by the manifest exists', () => {
  const referenced = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.action.default_icon),
    ...Object.values(manifest.icons),
    ...manifest.web_accessible_resources.flatMap((entry) => entry.resources),
  ];

  for (const path of referenced) {
    assert.ok(exists(path), `${path} is referenced in manifest.json but missing`);
  }
});
