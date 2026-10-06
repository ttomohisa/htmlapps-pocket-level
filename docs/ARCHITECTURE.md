# Architecture

Pocket Level follows the `htmlapps-template` repository model.

```text
app.config.json
APP_SPEC.md
dependencies.json
src/index.template.html
build-standalone.ps1
scripts/build-self-extract.ps1
scripts/verify-standalone.ps1
scripts/check-repository.ps1
dist/index.html
dist/index.self-extract.html
```

## Runtime

The release is one HTML document. Sensor processing, UI, translations, calibration, persistence, generated sound, and dialogs are inline. No third-party package is currently embedded.

The CSP blocks runtime network connections with `connect-src 'none'`.

## Sensor pipeline

1. The user starts measurement from a transient user gesture.
2. The app requests DeviceMotion / DeviceOrientation permission only when the browser exposes `requestPermission()`.
3. `accelerationIncludingGravity` from `DeviceMotionEvent` is preferred because it directly provides the gravity vector in device coordinates.
4. `DeviceOrientationEvent` is a fallback after the existing 500 ms motion preference. Original beta/gamma values must be finite numbers before conversion to an approximate gravity vector; null/missing values are rejected.
5. Gravity is normalized and passed through a light low-pass filter.
6. Surface angles are calculated from normalized gravity components.
7. Edge mode automatically uses the device X/Y axis that is closer to vertical and measures deviation on the other axis.
8. UI updates only mutate numeric text and transforms; large DOM sections are not rebuilt.

## Primary readout

The existing local-storage record stores `readout` as `angle` or `slope`, defaulting to `angle` for missing or invalid values. A native labeled Settings select changes only the displayed primary value and unit. Rendering selects the current or locked reading first, then uses its existing slope or angle. The primary slope uses scientific notation when its fixed-point text would exceed seven characters, keeping large finite averaged results readable without altering the stored number. It does not change measurement math, filtering, precision collection, zero references, calibration, bubble position, posture warnings, or degree-based tolerance.

## Build consistency and tests

Every build also writes `pocket-level.html` from the same rendered HTML as the configured readable output. The self-extract payload must decode to identical bytes. `scripts/check-repository.ps1` runs Node.js synthetic sensor/control tests against source and all three generated artifacts, plus isolated default/custom output-path build tests. These tests do not establish real-device accuracy.

## Calibration

The optional two-point calibration records the raw Surface X/Y angle twice on the same physical surface, after a 180° in-plane rotation. If surface tilt reverses in device coordinates while device bias remains fixed, `(m1 + m2) / 2` estimates the bias. The offsets are stored locally and subtracted before temporary zero references.

## Build placeholders

`src/index.template.html` contains exactly one of each:

- `__APP_CONFIG_JSON__`
- `__BUILD_MANIFEST_JSON__`
- `__EMBEDDED_ASSET_BUNDLE_BASE64__`
