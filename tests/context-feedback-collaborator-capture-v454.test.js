import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/context-feedback.js", import.meta.url), "utf8");

test("M454 context feedback captures namespaces, events, and methods before lifecycle work", () => {
  assert.match(source, /captureReceiverValue\(api, "contextMenus"/);
  assert.match(source, /captureReceiverValue\(api, "storage"/);
  assert.match(source, /captureReceiverValue\(api, "action"/);
  assert.match(source, /captureReceiverValue\(api, "tabs"/);
  assert.match(source, /captureEvent\(contextClicked, "Context feedback context-menu event"\)/);
  assert.match(source, /captureEvent\(storageChanged, "Context feedback storage event"\)/);
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);/);
  assert.match(source, /installListenersTransactionally/);
});
