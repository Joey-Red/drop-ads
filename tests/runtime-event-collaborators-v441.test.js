import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M441 core browser events capture add/remove through bounded prototype data", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /function captureBoundMethod\(receiver, key, label, required = true\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(descriptor\.value, receiver, args\);/);
  assert.match(source, /function captureEventCollaborators\(event, label\)/);
  for (const token of ["runtime.onInstalled", "runtime.onStartup", "contextMenus.onClicked", "alarms.onAlarm", "runtime.onMessage", "storage.onChanged"]) {
    assert.ok(source.includes(`captureEventCollaborators(api.${token}`) || source.includes(`captureEventCollaborators(api.${token.replace("storage.onChanged", "storage.onChanged")}`), token);
  }
});

test("M441 registration and rollback use only captured event collaborators", () => {
  assert.match(source, /function registerListener\(collaborators, listener\) \{\s*collaborators\.add\(listener\);\s*listenerRegistrations\.push\(Object\.freeze\(\{ remove: collaborators\.remove, listener \}\)\);\s*\}/s);
  assert.match(source, /for \(const registration of registrations\) removeListenerBestEffort\(registration\.remove, registration\.listener\);/);
  assert.doesNotMatch(source, /registration\.event\.removeListener/);
});
