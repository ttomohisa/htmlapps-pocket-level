# Security and privacy

Pocket Level is designed as a local-first browser utility.

- Runtime CSP blocks connections with `connect-src 'none'`.
- The application does not use remote scripts, styles, fonts, images, analytics, or telemetry.
- Motion/orientation readings are processed in memory.
- Preferences, zero references, and calibration offsets may be stored in localStorage.
- The app does not request camera, microphone, geolocation, contacts, Bluetooth, NFC, or account access.
- Sensor permission prompts are browser-controlled and are requested only after the user taps **Start measuring**.

Report security issues through the repository's normal private security-reporting channel when available. Do not include sensitive personal data in public issues.
