# Changelog

## 1.1.1 - 2026-10-27

- Keep the header version visible on narrow smartphones without overlapping the app name or language/Help controls.

## 1.1.0 - 2026-10-13

- Prioritize the measuring display on phones and place the existing 2-second average beside Hold.
- Show the active mode's absolute or saved-angle reference beside the main value, with a nearby reset.
- Add user-armed capture after placement and one second of fresh stable readings, with cancellation and a 15-second timeout.
- Calculate true Surface inclination and reference separation from gravity vectors; average vectors consistently and show unavailable slope at 90 degrees or beyond.
- Preserve Edge contact-line references across axis changes. Old ambiguous Edge offsets reset once with a notice; compatible Surface references and calibration remain.
- Cancel interrupted captures and guard calibration posture, stale samples, and calibration-reference resets.
- Add synthetic geometry, capture, migration, and interruption regressions across release artifacts. Physical phone accuracy still requires real-device verification.

## Unreleased

- Fix a pre-existing English desktop Help clipping issue found by native layout regression: shrink only the Help scrolling body within its unchanged dialog bounds.

- Hide the informational footer in the existing phone measuring layout and standardize the English local-processing badge, preserving the dock, sensor behavior, and mobile badge hiding.

- Clarify Japanese and English help by removing internal layout, implementation, and audit commentary while preserving usage guidance and cautions.

## 1.0.3 - 2026-10-11

- Stop background page scrolling while a native modal dialog is open, preserving the existing dialog sizing, internal scrolling, and close behavior.
- Use a shield for the existing privacy badge without changing its wording.
- Add bilingual Help guidance and source/artifact scroll-lock regression contracts to the repository check.

## 1.0.2 - 2026-10-09

- Add a real English catalog screenshot and use it in the English README, preserving app behavior and the supplied icon.

## Unreleased

### Added

- Japanese/English Settings choice of Angle (default) or Slope (%) as the primary reading, saved locally and applicable to held and averaged results.
- Synthetic regression tests for sensor validity, primary readout behavior, and default/custom build output consistency across all release variants.

### Fixed

- Normalized the header language switch to EN / JA with localized target descriptions and Help tooltips; unified the Japanese local-processing badge wording (1.0.1).

- Reject null, missing, and non-numeric orientation axes before conversion so unavailable sensors cannot create a false zero measurement. Numeric zero and the existing 500 ms motion preference remain valid.
- Refresh the root `pocket-level.html` download during every build so it stays identical to the configured readable artifact.

## 1.0.0 - 2026-08-16

### Added

- Smartphone-first Surface and Edge / plumb level modes.
- Stability indicator, slope percentage, zero reference, and hold / resume.
- Configurable level tolerance with optional vibration and generated sound feedback.
- Screen Wake Lock support when available.
- 2-second precision averaging with spread reporting.
- 180° two-point calibration for estimating device-side X/Y bias without requiring a perfectly level reference surface.
- Japanese / English UI, help dialog, local persistence, and no-runtime-network CSP.
- Readable and self-extracting single-HTML build outputs.
- Sensor availability detection for unsupported, insecure, denied, and no-data states.
- Clear local-file guidance when `file://` cannot receive sensor events.
- Start screen remains visible until a real sensor sample is received.
- Sensor-dependent controls stay disabled until real sensor data is available.
- iOS motion/orientation permission requests are initiated from the same user gesture.

### Fixed

- Made the repository content check ASCII-safe so Windows PowerShell 5.1 does not misread the `180°` verification token.

