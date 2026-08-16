# AGENTS.md — Pocket Level / Single HTML App Contract

Read `APP_SPEC.md`, `docs/ARCHITECTURE.md`, and the current `src/index.template.html` before editing.

## Non-negotiable constraints

- Produce `dist/index.html` and `dist/index.self-extract.html` as one-file release artifacts.
- Do not add runtime CDN, remote font, analytics, telemetry, remote API calls, or hidden network dependencies.
- Keep `connect-src 'none'` in the release CSP.
- Use browser-native APIs where practical. Third-party dependencies must be pinned and declared in `dependencies.json`.
- Smartphone and desktop layouts are first-class; smartphone UX is the priority for this product.
- Keep Japanese and English in the same HTML.
- Keep visible focus, labels / accessible names, sufficient contrast, and reduced-motion handling.
- Do not use generic emoji as primary UI icons; use inline SVG.
- Do not hand-edit generated `dist/` files. Edit source/config/build scripts and rebuild.
- Motion-sensor access may require HTTPS; local `file://` must still render and explain limitations gracefully.

## Source organization

- Main editable source: `src/index.template.html`.
- Keep the three build placeholders exactly once: `__APP_CONFIG_JSON__`, `__BUILD_MANIFEST_JSON__`, `__EMBEDDED_ASSET_BUNDLE_BASE64__`.
- Keep `APP:BEGIN` / `APP:END` and `APP:HELP:BEGIN` / `APP:HELP:END` markers.
- Keep measurement math commented or readable enough to audit.

## Required verification

Run on Windows:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Also verify Surface/Edge modes on a real phone over HTTPS because desktop headless testing cannot validate physical sensor accuracy.
