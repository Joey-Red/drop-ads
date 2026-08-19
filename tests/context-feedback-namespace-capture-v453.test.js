import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/context-feedback.js", import.meta.url), "utf8");

test("context feedback captures browser namespaces and events through descriptor/prototype data inspection", () => {
  assert.match(source, /function captureReceiverValue\(receiver, key, label, required = true\)/);
  assert.match(source, /captureReceiverValue\(api, "contextMenus"/);
  assert.match(source, /captureReceiverValue\(api, "storage"/);
  assert.match(source, /captureReceiverValue\(api, "action"/);
  assert.match(source, /captureReceiverValue\(api, "tabs"/);
  assert.match(source, /captureReceiverValue\(api, "declarativeNetRequest"/);
  assert.match(source, /captureReceiverValue\(contextMenus, "onClicked"/);
  assert.match(source, /captureReceiverValue\(storage, "onChanged"/);
  assert.match(source, /captureReceiverValue\(storage, "local"/);
  assert.doesNotMatch(source, /api\?\.contextMenus\?\.onClicked/);
  assert.doesNotMatch(source, /api\?\.storage\?\.onChanged/);
});

test("captured context-feedback methods use receiver-preserving intrinsic invocation", () => {
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);/);
  assert.doesNotMatch(source, /\.bind\(receiver\)/);
});
