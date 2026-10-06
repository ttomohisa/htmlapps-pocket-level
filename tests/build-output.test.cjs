const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { gunzipSync } = require('node:zlib');

const root = path.join(__dirname, '..');
const shell = process.env.PWSH_PATH || (process.platform === 'win32' ? 'powershell.exe' : 'pwsh');
function build(cwd) {
  const result = spawnSync(shell, ['-NoLogo', '-NoProfile', '-File', path.join(cwd, 'build-standalone.ps1')], { cwd, encoding: 'utf8' });
  assert.equal(result.error, undefined, `PowerShell must be available: ${result.error?.message}`);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}
for (const custom of [false, true]) {
  test(`build refreshes canonical download and self-extract bytes (${custom ? 'custom' : 'default'} paths)`, t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'pocket-level-build-'));
    t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
    for (const name of ['src', 'scripts', 'app.config.json', 'dependencies.json', 'build-standalone.ps1']) fs.cpSync(path.join(root, name), path.join(fixture, name), { recursive: true });
    // Seed a stale public download: rebuilding must replace it from source.
    fs.writeFileSync(path.join(fixture, 'pocket-level.html'), 'stale download');
    const config = JSON.parse(fs.readFileSync(path.join(fixture, 'app.config.json'), 'utf8'));
    if (custom) {
      config.build.output = 'custom/readable.html'; config.build.selfExtract.output = 'custom/wrapper.html';
      fs.writeFileSync(path.join(fixture, 'app.config.json'), JSON.stringify(config));
      fs.mkdirSync(path.join(fixture, 'custom'));
    }
    build(fixture);
    const readable = fs.readFileSync(path.join(fixture, config.build.output));
    assert.equal(fs.readFileSync(path.join(fixture, 'pocket-level.html')).equals(readable), true, 'canonical root download must match readable output byte for byte');
    const wrapper = fs.readFileSync(path.join(fixture, config.build.selfExtract.output), 'utf8');
    const payload = wrapper.match(/const b='([^']+)'/); assert(payload);
    assert.equal(gunzipSync(Buffer.from(payload[1], 'base64')).equals(readable), true, 'self-extract payload matches readable output');
    assert.match(readable.toString('utf8'), /id="primaryReadoutSelect"/);
    assert.match(readable.toString('utf8'), /connect-src 'none'/);
    assert.doesNotMatch(readable.toString('utf8'), /__(?:APP_CONFIG_JSON|BUILD_MANIFEST_JSON|EMBEDDED_ASSET_BUNDLE_BASE64)__/);
  });
}
