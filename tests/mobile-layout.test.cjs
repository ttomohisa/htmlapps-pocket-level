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


test('mobile layout retains the original bubble, edge vial and header colors', () => {
  const mobile = css.slice(css.indexOf('/* Mobile measuring surface:'));
  const desktop = css.slice(0, css.indexOf('/* Mobile measuring surface:'));
  assert.match(desktop, /\.app-header\{[^}]*background:color-mix\(in srgb,var\(--bg\) 92%,transparent\)/);
  assert.doesNotMatch(mobile, /\.app-header\{background:/, 'do not repaint the app header on phones');
  assert.match(desktop, /\.bullseye\{[^}]*radial-gradient/);
  assert.match(desktop, /\.bubble\{[^}]*inset 0 6px 10px/);
  assert.match(desktop, /\.edge-vial\{[^}]*linear-gradient/);
  assert.doesNotMatch(mobile, /\.bullseye\{/);
  assert.doesNotMatch(mobile, /\.target-ring\{/);
  assert.doesNotMatch(mobile, /\.bubble,\.is-level \.bubble\{/);
  assert.doesNotMatch(mobile, /\.edge-bubble,\.is-level \.edge-bubble\{/);
  assert.doesNotMatch(mobile, /\.sensor-stage\.is-level::before,\.sensor-stage\.is-locked::after\{display:none\}/);
  assert.match(mobile, /width:min\(78vw,310px,42svh\)/);
  assert.match(mobile, /@media\(max-width:760px\) and \(orientation:portrait\) and \(max-height:650px\)/);
  assert.match(mobile, /\.sensor-stage,html\[data-measuring="true"\] \.sensor-stage\{height:auto;min-height:0;justify-content:flex-start;padding-top:12px\}/);
  assert.match(mobile, /width:min\(72vw,31svh\)/);
});

test('mobile Settings icon reuses the working desktop gear SVG exactly', () => {
  const icon = id => html.match(new RegExp('<button[^>]*id="' + id + '"[^>]*>(<svg[\\s\\S]*?<\\/svg>)'))?.[1];
  assert.ok(icon('settingsButton'));
  assert.equal(icon('mobileSettingsButton'), icon('settingsButton'));
});

test('short Japanese and English measurement copy is used without privacy boilerplate', () => {
  const h = createHarness({ language: 'ja' });
  const label = key => h.allNodes.find(node => node.dataset.i18n === key)?.textContent;
  assert.equal(label('brandMeta'), 'スマホを水平器に');
  assert.equal(label('pageLead'), 'スマホの傾きセンサーで、平面や辺の傾きを測ります。');
  assert.equal(label('startDescription'), '傾きセンサーを使います。ブラウザーによっては許可が必要です。');
  h.nodes.get('languageButton').click();
  assert.equal(label('brandMeta'), 'Use your phone as a level.');
  assert.equal(label('pageLead'), 'Measure the tilt of surfaces and edges with your phone.');
  assert.equal(label('startDescription'), 'Uses motion sensors. Your browser may ask for permission.');
});
