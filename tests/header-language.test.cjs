const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/app-harness.cjs');

// The real app and event bindings run against synthetic browser boundaries.
// Reverting JA, localized target descriptions, Help title, or badge text must fail.
function assertHeader(h, language) {
  const button = h.nodes.get('languageButton');
  const target = language === 'ja' ? '英語に切り替え' : 'Switch to Japanese';
  const help = language === 'ja' ? '使い方と注意事項' : 'How to use & notes';
  assert.equal(h.document.documentElement.lang, language);
  assert.equal(button.textContent, language === 'ja' ? 'EN' : 'JA');
  assert.equal(button.getAttribute('aria-label'), target);
  assert.equal(button.title, target);
  assert.equal(h.nodes.get('helpButton').getAttribute('aria-label'), help);
  assert.equal(h.nodes.get('helpButton').title, help);
  assert.equal(h.text('helpTitle'), help);
  const close = h.allNodes.find(node => node.dataset.closeDialog === 'helpDialog');
  assert.equal(close.getAttribute('aria-label'), language === 'ja' ? '閉じる' : 'Close');
  assert.equal(h.allNodes.find(node => node.dataset.i18n === 'localOnly').textContent,
    language === 'ja' ? '完全ローカル処理' : 'Processed on device');
  assert.equal(h.permissionCalls(), 0);
}

for (const language of ['ja', 'en']) {
  test(`${language}: fresh header describes the target language and Help in the current UI language`, () => {
    assertHeader(createHarness({ language }), language);
  });
  test(`${language}: repeated language clicks persist and restore the current header without changing settings`, () => {
    const stored = { lang: language, mode: 'edge', readout: 'slope', tolerance: .5 };
    const h = createHarness({ stored, language: language === 'ja' ? 'en' : 'ja' });
    const settings = () => ({ mode: h.state.mode, readout: h.state.readout, tolerance: h.state.tolerance });
    const before = settings();
    let current = language;
    for (let i = 0; i < 4; i++) {
      assertHeader(h, current);
      assert.equal(h.stored().lang, current);
      assert.deepEqual(settings(), before);
      assertHeader(createHarness({ stored: h.stored() }), current);
      h.nodes.get('languageButton').click();
      current = current === 'ja' ? 'en' : 'ja';
    }
  });
}
test('language switching works when localStorage is unavailable', () => {
  const h = createHarness({ storageUnavailable: true, language: 'ja' });
  assertHeader(h, 'ja');
  h.nodes.get('languageButton').click();
  assertHeader(h, 'en');
});
test('Japanese privacy badge uses the shared local-processing wording', () => {
  const h = createHarness({ language: 'ja' });
  assert.equal(h.allNodes.find(node => node.dataset.i18n === 'localOnly').textContent, '完全ローカル処理');
  assert.match(h.html, /data-i18n="localOnly">完全ローカル処理<\/span>/);
});
test('Help tooltip follows both UI languages', () => {
  const h = createHarness({ language: 'ja' });
  assert.equal(h.nodes.get('helpButton').title, '使い方と注意事項');
  h.nodes.get('languageButton').click();
  assert.equal(h.nodes.get('helpButton').title, 'How to use & notes');
});
test('initial Japanese HTML describes the language target before initialization', () => {
  const h = createHarness();
  const button = h.html.match(/<button[^>]*id="languageButton"[^>]*>/)[0];
  assert.match(button, /aria-label="英語に切り替え"/);
  assert.match(button, /title="英語に切り替え"/);
});
test('existing Help close control stays localized while the dialog is open', () => {
  const h = createHarness({ language: 'ja' });
  h.nodes.get('helpButton').click();
  assert.equal(h.nodes.get('helpDialog').open, true);
  const close = h.allNodes.find(node => node.dataset.closeDialog === 'helpDialog');
  assert.equal(close.getAttribute('aria-label'), '閉じる');
  h.nodes.get('languageButton').click();
  assert.equal(close.getAttribute('aria-label'), 'Close');
  close.click();
  assert.equal(h.nodes.get('helpDialog').open, false);
});
