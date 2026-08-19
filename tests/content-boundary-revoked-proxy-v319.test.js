import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

function loadContract() {
  const context = { TextEncoder, globalThis: null };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(new URL("../src/content/message-contract.js", import.meta.url), "utf8"), context);
  return context.DropAdsContentMessageContract;
}

function revokedProxy(target = {}) {
  const pair = Proxy.revocable(target, {});
  pair.revoke();
  return pair.proxy;
}

test("revoked root proxies fail closed across content boundaries", () => {
  const contract = loadContract();
  const revoked = revokedProxy({ type: "drop-ads:start-element-picker" });
  assert.doesNotThrow(() => contract.snapshot(revoked, "drop-ads:start-element-picker"));
  assert.equal(contract.snapshot(revoked, "drop-ads:start-element-picker"), null);
  assert.equal(contract.accepts(revoked, "drop-ads:start-element-picker"), false);
  assert.equal(contract.snapshotCosmeticPolicyResponse(revoked), null);
  assert.equal(contract.snapshotCosmeticMutationResponse(revoked), null);
  assert.equal(contract.contentCaughtErrorMessage(revoked, "fallback"), "fallback");
});

test("revoked nested proxies fail closed across content response boundaries", () => {
  const contract = loadContract();
  assert.doesNotThrow(() => contract.snapshotCosmeticPolicyResponse({ ok: true, policy: revokedProxy({}) }));
  assert.equal(contract.snapshotCosmeticPolicyResponse({ ok: true, policy: revokedProxy({}) }), null);

  const revokedRule = revokedProxy({ selector: ".ad" });
  assert.doesNotThrow(() => contract.snapshotCosmeticMutationResponse({ ok: true, result: { changed: true, rule: revokedRule } }));
  assert.equal(contract.snapshotCosmeticMutationResponse({ ok: true, result: { changed: true, rule: revokedRule } }), null);
});
