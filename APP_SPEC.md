# APP_SPEC.md

## 1. Product identity

- **Name:** Pocket Level
- **Purpose:** Turn a smartphone into a fast, install-free spirit level / inclinometer using browser motion sensors.
- **Primary users:** Smartphone users who need a level for quick DIY, furniture, shelf, appliance, photo-frame, or everyday alignment checks.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`.

## 2. Problem and outcome

Users often need a spirit level only briefly and do not want to install a native app. Pocket Level opens from a URL and immediately provides a touch-first level UI. All sensor processing is local and there is no runtime network dependency.

## 3. Core user flow

1. Open over HTTPS on a smartphone.
2. Tap **Start measuring** and grant motion-sensor permission if requested.
3. Choose **Surface** or **Edge / plumb**.
4. Place the phone on the surface or against an edge and read the bubble / angle.
5. Optionally set a temporary zero reference or hold a reading.
6. Open Settings only when tolerance, feedback, precision averaging, or calibration is needed.

## 4. Functional requirements

- Surface mode with two-axis bullseye and X/Y angles.
- Edge / plumb mode with one-axis bubble and angle.
- Slope percentage derived from the active angle.
- Adjustable level tolerance: 0.1°, 0.3°, 0.5°, 1.0°.
- Stability indicator derived from recent sensor variance.
- Temporary zero reference per measurement mode.
- Hold / resume current reading.
- Optional vibration and generated tone when entering the level tolerance while stable.
- Screen Wake Lock when available and enabled.
- 2-second average precision measurement that freezes the averaged result and reports spread.
- 180° two-point surface calibration: record twice on the same surface after rotating the phone 180°, then estimate device-side X/Y bias with `(position1 + position2) / 2`.
- Persist language, mode, tolerance, feedback settings, zero references, and calibration in localStorage when available.
- Japanese and English in the same HTML.
- Light-only UI.

## 5. Data and privacy

- Motion / orientation values are processed in memory only.
- Preferences and calibration values may be stored in localStorage.
- No analytics, telemetry, remote API, camera, microphone, GPS, account, or cloud storage.
- CSP keeps `connect-src 'none'`.

## 6. UX decisions

- The primary screen exposes only mode switching, zero, hold, and settings.
- Advanced calibration and precision averaging live in Settings to avoid clutter.
- Smartphone layout should feel like a native measuring instrument, with large visual feedback and a thumb-friendly sticky control dock.
- Header language and help controls are icon/text-only without filled backgrounds.
- No dark mode.

## 7. Browser / platform behavior

- Target current stable Chromium, Safari, and Firefox where motion APIs are exposed.
- Some browsers require HTTPS and explicit permission for motion/orientation data.
- `file://` builds must open and render without network access, but sensor acquisition is not guaranteed from `file://`; HTTPS deployment is the supported measurement environment.
- Wake Lock requires a supporting secure context and falls back silently when unavailable.
- Vibration may be unavailable on some browsers; it is optional feedback only.

## 8. Measurement limitations

- This is a convenience tool, not certified measuring equipment.
- Phone sensor quality, sensor calibration, case geometry, camera bumps, and contact points affect accuracy.
- Two-point calibration estimates device-side bias but cannot eliminate changing contact geometry.

## 9. Performance

- Sensor updates should render without rebuilding large DOM sections.
- Bubble movement uses transforms.
- Recent-sample windows are bounded.
- No third-party dependency is required.

## 10. Acceptance criteria

- Both release HTML variants are fully self-contained.
- No external script, stylesheet, font, image, frame, or runtime connection is present.
- `connect-src 'none'` remains in CSP.
- UI works at 320px and desktop widths.
- Keyboard focus is visible and dialogs support Esc/backdrop cancellation.
- Japanese / English switching does not reload.
- Simulated DeviceMotion input updates Surface and Edge views without console errors.
- Zero, hold, tolerance, and language persist as designed.
- Precision averaging and two-point calibration fail safely when there are insufficient sensor samples.

## 11. Non-goals

- Construction-grade accuracy certification.
- Camera-assisted AR angle measurement.
- Cloud history or accounts.
- GPS, compass heading, or magnetometer-based navigation.
- Themes / dark mode.


## Sensor availability behavior

- The meter must not present `0.0°` as a live measurement until at least one real motion/orientation sample has been received.
- If the browser/device exposes neither Device Motion nor Device Orientation, disable the start button and explain that the environment is unsupported.
- If the page is not a secure context, disable the start button and explain that HTTPS is required.
- On iOS-style permission APIs, start Motion and Orientation permission requests synchronously from the same user gesture before awaiting either result.
- If permission is denied, or no sensor event arrives after starting, return to the start overlay, show a specific reason, and disable the start button for that page load.
- For `file://` with no sensor events, explicitly explain that the local HTML opening method is not supported by that browser and recommend the HTTPS-hosted version.
- Sensor-dependent actions such as Set zero, Hold, precision averaging, and calibration remain disabled until real sensor data is available.
- The static HTML may still open through `file://`, but sensor measurement itself is browser-dependent and is only a guaranteed target when served from a supported secure context.
