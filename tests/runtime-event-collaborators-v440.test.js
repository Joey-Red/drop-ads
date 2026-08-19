import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M440 core browser events capture add/remove through bounded data descriptors", () => {
  assert.match(source, /MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /function captureBoundMethod\(receiver, key, label, required = true\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /Reflect\.apply\(descriptor\.value, receiver, args\)/);
  assert.match(source, /function captureEventCollaborators\(event, label\)/);
});

test("M440 listener rollback uses captured removers instead of rereading browser events", () => {
  assert.match(source, /listenerRegistrations\.push\(Object\.freeze\(\{ remove: collaborators\.remove, listener \}\)\)/);
  assert.match(source, /removeListenerBestEffort\(registration\.remove, registration\.listener\)/);
  assert.doesNotMatch(source, /event\?\.removeListener\?\./);
  assert.match(source, /registerListener\(events\.installed, onInstalled\)/);
  assert.match(source, /registerListener\(events\.storageChanged, onStorageChanged\)/);
});
