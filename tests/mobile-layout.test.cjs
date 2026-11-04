'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHarness } = require('./helpers/app-harness.cjs');

const html = fs.readFileSync(path.join(__dirname, '../src/index.template.html'), 'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';

test('mobile measurement screen focuses on the meter rather than auxiliary cards', () => {
  assert.match(css, /\/\* Mobile measuring surface: treat the phone as an instrument, not a dashboard\. \*\//);
  assert.match(css, /@media\(max-width:760px\)\{/);
  assert.match(css, /\.page-intro\{display:none\}/);
  assert.match(css, /\.info-panel\{display:none\}/);
  assert.match(css, /\.control-dock\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.control-dock #settingsButton\{display:none\}/);
  assert.match(css, /\.start-overlay\{background:var\(--bg\);backdrop-filter:none/);
  for (const id of ['flatModeButton', 'edgeModeButton', 'zeroButton', 'holdButton', 'quickPrecisionButton', 'autoCaptureButton', 'cancelCaptureButton', 'settingsButton']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test('mobile Settings is a separate accessible header action with localized names', () => {
  const h = createHarness({ language: 'ja' });
  const settings = h.nodes.get('mobileSettingsButton');
  assert.ok(settings);
  assert.equal(settings.getAttribute('aria-label'), '設定');
  settings.click();
  assert.equal(h.nodes.get('settingsDialog').open, true);
  h.nodes.get('languageButton').click();
  assert.equal(settings.getAttribute('aria-label'), 'Settings');
  assert.equal(settings.title, 'Settings');
  assert.equal(h.nodes.get('settingsDialog').open, true);
});

test('relative zero context is only emphasized when a custom reference is active', () => {
  const h = createHarness({ language: 'ja' });
  h.motion(0, 0, 10);
  assert.equal(h.nodes.get('sensorStage').classList.contains('has-relative-reference'), false);
  h.nodes.get('zeroButton').click();
  h.motion(1, 0, 10);
  assert.equal(h.nodes.get('sensorStage').classList.contains('has-relative-reference'), false, 'zero reference at absolute zero is not custom');
  h.nodes.get('zeroButton').click();
  assert.equal(h.nodes.get('sensorStage').classList.contains('has-relative-reference'), true);
  h.nodes.get('referenceResetButton').click();
  assert.equal(h.nodes.get('sensorStage').classList.contains('has-relative-reference'), false);
});
