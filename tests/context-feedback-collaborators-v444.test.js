import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/context-feedback.js", import.meta.url), "utf8");

test("M444 captures browser methods through bounded prototype data", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /function captureReceiverMethod\(receiver, key, label, required = true\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\)/);
  assert.doesNotMatch(source, /callback\.bind\(/);
});

test("M444 captures context/storage events and action/tab/storage collaborators once", () => {
  assert.match(source, /const contextClickedEvent = captureEvent\(contextClicked, "Context feedback context-menu event"\)/);
  assert.match(source, /const storageChangedEvent = captureEvent\(storageChanged, "Context feedback storage event"\)/);
  assert.match(source, /captureReceiverMethod\(action, "setTitle"/);
  assert.match(source, /captureReceiverMethod\(action, "setBadgeText"/);
  assert.match(source, /captureReceiverMethod\(tabs, "sendMessage"/);
  assert.match(source, /captureReceiverMethod\(storageLocal, "get"/);
});

test("M444 listener ownership remains transactional and teardown is failure-isolated", () => {
  assert.match(source, /function installListenersTransactionally\(entries\)/);
  assert.match(source, /for \(let index = installed\.length - 1; index >= 0; index -= 1\)/);
  assert.match(source, /removeListenerBestEffort\(collaborators\.contextClickedEvent\.removeListener, onContextClick\)/);
  assert.match(source, /removeListenerBestEffort\(collaborators\.storageChangedEvent\.removeListener, onStorageChanged\)/);
  assert.match(source, /pending\.clear\(\);\s*visibleTimers\.clear\(\)/s);
});
