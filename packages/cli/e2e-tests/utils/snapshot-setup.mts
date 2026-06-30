import { snapshot } from 'node:test';

// Keep report snapshots as readable multi-line text instead of JSON-escaped
// strings. node:test isolates each test file in its own process, so every suite
// that uses `t.assert.snapshot()` imports this module for its side effect.
snapshot.setDefaultSnapshotSerializers([(value) => String(value)]);
