const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/app-harness.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const formatted = value => (Math.abs(value) < .05 ? 0 : value).toFixed(1);
function measurement(h) {
  return JSON.stringify({ current: h.state.current, display: h.state.display, locked: h.state.locked, held: h.state.lockedReading, samples: h.state.samples, gravity: h.state.gravity, zero: h.state.zero, calibration: h.state.calibration, tolerance: h.state.tolerance, precision: h.state.precision, source: h.state.source });
}

test('Angle is the default and the native selector has a translated visible label and help', () => {
  const h = createHarness();
  assert.equal(h.state.readout, 'angle');
  assert.equal(h.nodes.get('primaryReadoutSelect')?.tagName, 'SELECT');
  assert.match(h.html, /<label[^>]*for="primaryReadoutSelect"[^>]*>/);
  assert.equal(h.nodes.get('primaryReadoutSelect').getAttribute('aria-describedby'), 'primaryReadoutHelp');
  assert.equal(h.nodes.get('primaryReadoutSelect').value, 'angle');
  assert.equal(h.text('primaryReadoutLabel'), 'Primary reading');
  assert.equal(h.text('mainReadingUnit'), '°');
  assert.equal(h.permissionCalls(), 0);
});
for (const preference of ['angle', 'slope', undefined, 'percent', '', null, false, 1, {}, ['slope']]) {
  test(`stored readout is validated: ${JSON.stringify(preference)}`, () => {
    const h = createHarness({ stored: { readout: preference } });
    const expected = preference === 'slope' ? 'slope' : 'angle';
    assert.equal(h.state.readout, expected); assert.equal(h.nodes.get('primaryReadoutSelect').value, expected);
    assert.equal(h.stored().readout, expected);
  });
}
for (const options of [{ stored: '{' }, { storageUnavailable: true }]) {
  test(`readout remains usable when persistence is unavailable (${JSON.stringify(options)})`, () => {
    const h = createHarness(options); assert.equal(h.state.readout, 'angle');
    h.preference('slope'); h.motion(1, 0, 10);
    assert.equal(h.text('mainReading'), '10.0'); assert.equal(h.text('mainReadingUnit'), '%');
  });
}
test('selecting Slope reuses current slope and preserves geometry, tolerance, state, and secondary angle readings', () => {
  const h = createHarness(); h.motion(1, 0, 10);
  const before = measurement(h), bubble = h.nodes.get('bubble').style.transform;
  const sub = h.text('readingSub'), status = h.text('stageStatusText');
  h.preference('slope');
  assert.equal(h.text('mainReading'), '10.0'); assert.equal(h.text('mainReadingUnit'), '%');
  assert.equal(h.text('slopeDisplay'), '10.0%'); assert.equal(h.text('readingSub'), sub);
  assert.equal(h.text('xReading'), '5.7°'); assert.equal(h.nodes.get('bubble').style.transform, bubble);
  assert.equal(h.text('stageStatusText'), status); assert.equal(h.text('toleranceDisplay'), '±0.3°');
  assert.equal(measurement(h), before); assert.equal(h.stored().readout, 'slope');
  for (let i = 0; i < 4; i++) { h.preference('angle'); assert.equal(h.text('mainReading'), '5.7'); h.preference('slope'); }
  assert.equal(measurement(h), before); assert.equal(h.permissionCalls(), 0);
});
test('preference changes do not enable sensor controls or dismiss the waiting overlay', () => {
  const h = createHarness(); h.preference('slope');
  assert.equal(h.state.hasSensorData, false); assert.equal(h.nodes.get('startOverlay').classList.contains('hidden'), false);
  for (const id of ['zeroButton', 'holdButton', 'precisionButton', 'calibrateButton']) assert.equal(h.nodes.get(id).disabled, true);
  h.orientation(null, null); assert.equal(h.state.hasSensorData, false);
});
test('invalid control values do not replace the last valid preference', () => {
  const h = createHarness(); h.preference('slope'); h.preference('percent');
  assert.equal(h.state.readout, 'slope'); assert.equal(h.stored().readout, 'slope'); assert.equal(h.nodes.get('primaryReadoutSelect').value, 'slope');
});
test('saved readout restores without changing zero, calibration, mode or feedback preferences', () => {
  const saved = { lang: 'en', mode: 'edge', readout: 'angle', tolerance: .5, vibration: false, sound: false, wakeEnabled: false, zero: { flatX: 1, flatY: -2, edge: 3 }, calibration: { biasX: .2, biasY: -.3, updatedAt: '2026-10-01T00:00:00.000Z' } };
  const h = createHarness({ stored: saved }); h.preference('slope');
  assert.deepEqual(h.stored(), { ...saved, readout: 'slope' });
  const reloaded = createHarness({ stored: h.stored() }); assert.equal(reloaded.state.readout, 'slope'); assert.deepEqual(reloaded.stored(), h.stored());
});
test('language switching updates Settings labels while preserving the selected readout and measurement', () => {
  const h = createHarness(); h.motion(1, 0, 10); h.preference('slope'); const before = measurement(h);
  h.nodes.get('languageButton').click();
  assert.equal(h.text('primaryReadoutLabel'), '大きく表示する値');
  assert.equal(h.text('angleReadoutOption'), '角度 (°)'); assert.equal(h.text('slopeReadoutOption'), '勾配 (%)');
  assert.equal(h.nodes.get('primaryReadoutSelect').value, 'slope'); assert.equal(measurement(h), before);
  h.nodes.get('languageButton').click(); assert.equal(h.text('primaryReadoutLabel'), 'Primary reading');
});
test('Hold keeps its captured reading when switching units; Resume returns to the latest sample', () => {
  const h = createHarness(); h.motion(1, 0, 10); h.nodes.get('holdButton').click(); const held = clone(h.state.lockedReading);
  h.motion(3, 0, 10); assert.notEqual(h.state.current.slope, held.slope);
  h.preference('slope'); assert.equal(h.text('mainReading'), formatted(held.slope)); assert.deepEqual(clone(h.state.lockedReading), held);
  h.preference('angle'); assert.equal(h.text('mainReading'), formatted(held.main));
  h.preference('slope'); h.nodes.get('holdButton').click(); assert.equal(h.text('mainReading'), formatted(h.state.current.slope));
});
test('two-second averaging can change display units while collecting and uses the frozen result afterward', () => {
  const h = createHarness(); h.motion(1, 0, 10); h.nodes.get('precisionButton').click();
  const session = h.state.precision; h.preference('slope'); assert.equal(h.state.precision, session);
  for (let i = 0; i < 12; i++) { h.advance(100); h.motion(1 + i / 20, 0, 10); }
  h.advance(800); assert.equal(h.state.locked, true); assert.equal(h.state.precision, null);
  const held = clone(h.state.lockedReading); assert.equal(h.text('mainReading'), formatted(held.slope));
  h.motion(8, 0, 10); h.preference('angle'); assert.equal(h.text('mainReading'), formatted(held.main));
  h.preference('slope'); assert.equal(h.text('mainReading'), formatted(held.slope)); assert.deepEqual(clone(h.state.lockedReading), held);
  assert.match(h.text('precisionSummary'), /°/);
});
test('Surface and Edge preserve signed angle and posture guidance when Slope is primary', () => {
  const h = createHarness(); h.motion(-1, 10, 0); h.nodes.get('edgeModeButton').click();
  const sub = h.text('readingSub'), edge = h.nodes.get('edgeBubble').style.transform;
  assert.match(sub, /^-5\.7°/); h.preference('slope');
  assert.equal(h.text('mainReading'), '10.0'); assert.equal(h.text('readingSub'), sub);
  assert.equal(h.nodes.get('edgeBubble').style.transform, edge); assert.equal(h.nodes.get('axisReadings').hidden, true);
  h.nodes.get('flatModeButton').click(); assert.equal(h.text('mainReading'), formatted(h.state.current.slope));
  assert.equal(h.nodes.get('axisReadings').hidden, false);
  const flat = createHarness({ stored: { mode: 'edge', readout: 'slope' } }); flat.motion(1, 0, 10);
  assert.equal(flat.text('readingSub'), 'Stand the phone on one of its edges');
  assert.equal(flat.nodes.get('sensorStage').classList.contains('is-level'), false);
});
test('zero/reset zero and calibration continue using degrees with the selected display preference', () => {
  const h = createHarness({ stored: { calibration: { biasX: 1, biasY: -2, updatedAt: '2026-10-01' } } });
  h.motion(1, 2, 10); h.preference('slope'); const calibration = clone(h.state.calibration);
  h.nodes.get('zeroButton').click(); h.motion(1, 2, 10);
  assert(Math.abs(h.state.current.main) < 1e-10); assert.equal(h.text('mainReading'), '0.0');
  h.nodes.get('settingsButton').click(); h.nodes.get('resetZeroButton').click();
  assert.deepEqual(clone(h.state.zero), { flatX: 0, flatY: 0, edge: 0 }); assert.deepEqual(clone(h.state.calibration), calibration);
  assert.equal(h.state.readout, 'slope'); assert.equal(h.text('mainReading'), formatted(h.state.current.slope));
});
test('large slope retains the existing capped slope value and non-finite formatting', () => {
  const h = createHarness(); h.motion(1, 0, 0); h.preference('slope');
  assert.equal(h.text('mainReading'), '5729.0'); assert.equal(h.text('mainReadingUnit'), '%');
  h.state.locked = true; h.state.lockedReading = { ...h.state.current, slope: Infinity }; h.render();
  assert.equal(h.text('mainReading'), '—'); assert.equal(h.text('slopeDisplay'), '—%');
});
test('a near-vertical averaged slope uses compact primary text without changing the frozen measurement', () => {
  const h = createHarness(); h.motion(1, 0, 0); h.preference('slope'); h.nodes.get('precisionButton').click();
  for (let i = 0; i < 12; i++) { h.advance(100); h.motion(1, 0, 0); }
  h.advance(800);
  const held = clone(h.state.lockedReading);
  assert.equal(held.main, 90); assert.equal(held.slope, Math.tan(Math.PI / 2) * 100);
  assert.equal(h.text('mainReading'), '1.6e+18'); assert.equal(h.text('mainReadingUnit'), '%');
  assert.equal(h.text('slopeDisplay'), `${formatted(held.slope)}%`);
  h.preference('angle'); assert.equal(h.text('mainReading'), '90.0');
  h.preference('slope'); assert.equal(h.text('mainReading'), '1.6e+18'); assert.deepEqual(clone(h.state.lockedReading), held);
});
