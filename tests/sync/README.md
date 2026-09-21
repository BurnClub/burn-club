# Sync tests

```bash
tests/sync/run.sh
```

Two simulated devices, `phone` and `pc`, each with their own `localStorage`,
sharing one in-memory Supabase — driving the real `sync.js`. macOS only
(built-in JavaScriptCore), nothing to install.

Every test here exists because the case it covers was broken:

| test | the bug it guards |
|---|---|
| `stale-device` | A device signing in last deleted a newer pin made on another device, then pulled its own old list back |
| `last-item-removed` | Removing the *last* pin never reached other devices — an empty list was read as "nothing synced yet" |
| `offline-notes` | The rule that fixed the above could delete notes written offline; proves it doesn't |
| `reset-counter` | Wiping an account on the server was undone by the first device to sign in, which re-uploaded its old copy |
| `open-tab-during-reset` | A tab already open and signed in during a reset never passed through sign-in again, so it kept pushing its stale copy and undid the reset |

**Run them before changing `sync.js`.** Its failures are silent by design —
work is saved on the device either way — which is exactly why a regression
here would not show up by using the app.

One trap already hit: the mock's `localStorage` must expose stored keys through
`Object.keys()` the way a real one does. An early version kept them in a nested
property, so code that walks the keys found nothing to act on and two tests
failed for a reason that had nothing to do with the code under test.
