const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/app-harness.cjs');

const invalid = [null, undefined, NaN, Infinity, -Infinity, '', '0', false, true, [], {}];
for (const [index, value] of invalid.entries()) {
  for (const axis of ['beta', 'gamma']) {
    test(`orientation rejects original non-finite ${axis} (case ${index}) without starting measurement`, () => {
      const h = createHarness();
      for (let i = 0; i < 24; i++) h.orientation(axis === 'beta' ? value : 0, axis === 'gamma' ? value : 0);
      assert.equal(h.state.hasSensorData, false);
      assert.equal(h.state.source, null);
      assert.equal(h.state.samples.length, 0);
      assert.equal(h.nodes.get('startOverlay').classList.contains('hidden'), false);
      for (const id of ['zeroButton', 'holdButton', 'precisionButton', 'calibrateButton']) assert.equal(h.nodes.get(id).disabled, true, id);
      assert.equal(h.text('stageStatusText'), 'Waiting for sensors');
      assert.equal(h.permissionCalls(), 0);
    });
  }
}
test('numeric zero orientation remains a valid flat measurement', () => {
  const h = createHarness(); h.orientation(0, 0);
  assert.equal(h.state.hasSensorData, true); assert.equal(h.state.current.main, 0);
  assert.equal(h.nodes.get('startOverlay').classList.contains('hidden'), true);
  assert.equal(h.nodes.get('zeroButton').disabled, false);
});
test('nonzero orientation still calculates the same reading', () => {
  const h = createHarness(); h.orientation(0, -12);
  assert(Math.abs(h.state.current.x - 12) < 1e-9); assert.equal(h.state.current.y, 0);
  assert.equal(h.text('mainReading'), '12.0');
});
test('invalid orientation cannot replace motion after the fallback interval', () => {
  const h = createHarness(); h.motion(1, 0, 10); h.advance(501);
  const before = JSON.stringify({ current: h.state.current, samples: h.state.samples, lastSensorAt: h.state.lastSensorAt });
  for (const value of invalid) { h.orientation(value, 0); h.orientation(0, value); }
  assert.equal(h.state.source, 'motion');
  assert.equal(JSON.stringify({ current: h.state.current, samples: h.state.samples, lastSensorAt: h.state.lastSensorAt }), before);
});
test('motion preference lasts 500 ms and valid fallback still works at the boundary', () => {
  const h = createHarness(); h.motion(1, 0, 10); const before = JSON.stringify(h.state.current);
  h.advance(499); h.orientation(0, 0); assert.equal(h.state.source, 'motion'); assert.equal(JSON.stringify(h.state.current), before);
  h.advance(1); h.orientation(0, 0); assert.equal(h.state.source, 'orientation'); assert.notEqual(JSON.stringify(h.state.current), before);
});
test('missing and zero-magnitude motion remain invalid', () => {
  const h = createHarness(); h.dispatch('devicemotion', {}); h.motion(null, null, null); h.motion(0, 0, 0);
  assert.equal(h.state.hasSensorData, false);
});
