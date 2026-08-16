# Components

`components/` contains source snippets, not runtime dependencies. The final release remains one HTML file.

## Confirmation dialog

Pocket Level uses the template-compatible API:

```js
await AppConfirm.ask({
  title: 'Reset calibration?',
  message: '...',
  confirmLabel: 'Reset',
  cancelLabel: 'Cancel',
  tone: 'danger'
});
```

The embedded implementation preserves Esc cancellation, backdrop cancellation, visible focus, focus restoration, and a safe-area-aware mobile bottom-sheet layout.
