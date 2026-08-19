import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M447 captures each core event add/remove collaborator before registration", () => {
  assert.match(source, /function captureEventCollaborators\(event, label\)/);
  assert.match(source, /add: captureBoundMethod\(event, "addListener"/);
  assert.match(source, /remove: captureBoundMethod\(event, "removeListener"[^\n]*false\)/);
  for (const fragment of [
    "api.runtime.onInstalled",
    "api.runtime.onStartup",
    "api.contextMenus.onClicked",
    "api.alarms.onAlarm",
    "api.runtime.onMessage",
    "api.storage.onChanged"
  ]) assert.match(source, new RegExp(fragment.replaceAll(".", "\\.")));
});

test("M447 registration and rollback use captured operations rather than rereading event methods", () => {
  assert.match(source, /function registerListener\(collaborators, listener\) \{\s*collaborators\.add\(listener\);\s*listenerRegistrations\.push\(Object\.freeze\(\{ remove: collaborators\.remove, listener \}\)\);\s*\}/s);
  assert.match(source, /removeListenerBestEffort\(registration\.remove, registration\.listener\)/);
  assert.doesNotMatch(source, /function registerListener[\s\S]{0,300}\.addListener\(/);
  assert.doesNotMatch(source, /function removeListenerBestEffort[\s\S]{0,250}\.removeListener/);
});
