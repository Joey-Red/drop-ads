import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/context-feedback.js", import.meta.url), "utf8");

test("M454 context feedback captures browser namespaces, events, and methods once", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /function captureContextFeedbackCollaborators\(api\)/);
  assert.match(source, /captureEvent\(contextClicked, "Context feedback context-menu event"\)/);
  assert.match(source, /captureEvent\(storageChanged, "Context feedback storage event"\)/);
  assert.match(source, /captureReceiverMethod\(action, "setTitle"/);
  assert.match(source, /captureReceiverMethod\(tabs, "sendMessage"/);
  assert.match(source, /captureReceiverMethod\(storageLocal, "get"/);
});

test("M454 captured collaborator calls preserve receivers and listener install rolls back", () => {
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);/);
  assert.match(source, /function installListenersTransactionally\(entries\)/);
  assert.match(source, /for \(let index = installed\.length - 1; index >= 0; index -= 1\)/);
  assert.doesNotMatch(source, /\.bind\(/);
});
