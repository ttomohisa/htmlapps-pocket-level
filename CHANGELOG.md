# Changelog

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
