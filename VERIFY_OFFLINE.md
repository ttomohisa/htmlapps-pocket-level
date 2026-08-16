# Offline / no-network verification

1. Build the repository.
2. Open `dist/index.html` with browser developer tools and verify no runtime request is made after the document load.
3. Confirm the CSP contains `connect-src 'none'`.
4. Open `dist/index.html` and `dist/index.self-extract.html` directly through `file://` and confirm the UI renders.
5. Note that physical motion-sensor access may be unavailable through `file://`; test actual measurement over HTTPS on a smartphone.
