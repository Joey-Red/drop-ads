import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

async function loadContract() {
  const source = await readFile(resolve(import.meta.dirname, "../src/content/message-contract.js"), "utf8");
  const context = {};
  vm.runInNewContext(source, context, { filename: "content/message-contract.js" });
  return context.DropAdsContentMessageContract;
}

function message(fields) {
  return Object.assign(Object.create(null), fields);
}

test("content control messages accept only their exact lightweight schemas", async () => {
  const contract = await loadContract();
  assert.equal(contract.accepts(message({ type: "drop-ads:start-element-picker" }), "drop-ads:start-element-picker"), true);
  assert.equal(contract.accepts(message({ type: "drop-ads:cosmetic-refresh" }), "drop-ads:cosmetic-refresh"), true);
  assert.equal(contract.accepts(message({ type: "drop-ads:start-element-picker", pageText: "never" }), "drop-ads:start-element-picker"), false);
  assert.equal(contract.accepts(message({ type: "drop-ads:cosmetic-refresh", html: "never" }), "drop-ads:cosmetic-refresh"), false);
});

test("context cleanup target URL is bounded and accepts no extra page fields", async () => {
  const contract = await loadContract();
  const exact = "x".repeat(contract.MAX_CONTEXT_TARGET_URL_CHARS);
  assert.equal(contract.accepts(message({ type: "drop-ads:cleanup-context-target", targetUrl: exact }), "drop-ads:cleanup-context-target"), true);
  assert.equal(contract.accepts(message({ type: "drop-ads:cleanup-context-target", targetUrl: `${exact}x` }), "drop-ads:cleanup-context-target"), false);
  assert.equal(contract.accepts(message({ type: "drop-ads:cleanup-context-target", targetUrl: "https://example.com/ad.png", innerHTML: "never" }), "drop-ads:cleanup-context-target"), false);
});

test("content contract rejects malformed envelopes and cross-action confusion", async () => {
  const contract = await loadContract();
  assert.equal(contract.accepts([], "drop-ads:start-element-picker"), false);
  assert.equal(contract.accepts(null, "drop-ads:start-element-picker"), false);
  assert.equal(contract.accepts(message({ type: "drop-ads:cosmetic-refresh" }), "drop-ads:start-element-picker"), false);
  assert.equal(contract.accepts(message({ type: "drop-ads:cleanup-context-target", targetUrl: 123 }), "drop-ads:cleanup-context-target"), false);
});
