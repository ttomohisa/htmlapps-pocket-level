# Pocket Level

An install-free, single-HTML **spirit level / inclinometer** for smartphones.

Pocket Level uses only device motion sensors and processes readings locally in the browser. It has no runtime CDN, analytics, telemetry, or remote API.

![Pocket Level desktop](assets/screenshot.png)

<img src="assets/screenshot-mobile.png" alt="Pocket Level mobile" width="320">

## Features

- **Surface mode** — 2-axis bullseye, X/Y angles, combined tilt
- **Edge / plumb mode** — one-axis level using a long or short phone edge
- **Slope %** alongside degrees
- **Stability indicator** based on recent sensor variance
- **Set zero** and **Hold / Resume**
- Configurable level tolerance: ±0.1°, ±0.3°, ±0.5°, ±1.0°
- Optional sound and vibration when a stable reading enters the level zone
- Screen Wake Lock when supported
- **2-second precision average** with reported spread
- **180° two-point calibration** that estimates device-side X/Y bias from two readings on the same surface
- Japanese / English in one HTML

## Why the two-point calibration?

A normal zero button assumes the reference surface is already level. Pocket Level can instead record the same surface twice after the phone is rotated 180°. Approximately:

`m1 = surface + deviceBias`

`m2 = -surface + deviceBias`

so `(m1 + m2) / 2` estimates the device-side bias. This cannot remove errors caused by changing physical contact geometry, such as a case or camera bump, and the app is not certified measuring equipment.

## Privacy and offline behavior

- Runtime networking blocked with `connect-src 'none'`
- No camera, microphone, GPS, account, or cloud storage
- No third-party library
- Preferences and calibration remain in localStorage when available

The self-contained file opens through `file://`, but some browsers restrict motion sensors outside a secure context. Use HTTPS (for example GitHub Pages / Browser Kitty) for actual measurement.

## Build

On Windows:

```bat
build-standalone.bat
```

Outputs:

- `dist/index.html`
- `dist/index.self-extract.html`
- `dist/build-manifest.json`
- `dist/dependency-manifest.json`

Repository check:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Edit `src/index.template.html`, not generated files in `dist/`.

## License

MIT

### If sensor readings are unavailable

Pocket Level uses the device motion sensors. Some browsers do not provide sensor events to HTML opened directly with `file://`; use the HTTPS-hosted version on Browser Kitty / GitHub Pages for reliable access.

Unsupported browsers, insecure contexts, denied permission, and missing sensor events are detected and shown in the start screen. The Start button is disabled after a fatal availability error, and `0.0°` is not presented as a live reading before the first real sensor sample arrives.
