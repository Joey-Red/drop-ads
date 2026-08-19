import assert from "node:assert/strict";
import test from "node:test";

import { buildCosmeticPolicy, installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";

function apiFixture() {
  let messageListener = null;
  let storageListener = null;
  const api = {
    runtime: {
      onMessage: {
        addListener(listener) { messageListener = listener; },
        removeListener() {}
      }
    },
    storage: {
      local: { async get() { return {}; }, async set() {} },
      session: { async get() { return {}; }, async set() {} },
      onChanged: {
        addListener(listener) { storageListener = listener; },
        removeListener() {}
      }
    },
    tabs: { async query() { return []; }, async sendMessage() {} },
    declarativeNetRequest: { async updateDynamicRules() {}, async getDynamicRules() { return []; } }
  };
  return { api, messageListener: () => messageListener, storageListener: () => storageListener };
}

test("buildCosmeticPolicy consumes descriptor snapshots without normal get traps", () => {
  let gets = 0;
  const input = new Proxy({
    hostname: "example.com",
    state: { enabled: false },
    session: { disabledSites: [] },
    cache: {}
  }, {
    get() {
      gets += 1;
      throw new Error("normal get trap must not run");
    }
  });

  assert.deepEqual(buildCosmeticPolicy(input), { enabled: false, selectorCount: 0, stylesheet: "" });
  assert.equal(gets, 0);
});

test("changing cosmetic option descriptors fail deterministically on the detached read", () => {
  let hostnameDescriptorReads = 0;
  const input = new Proxy({ hostname: "example.com" }, {
    getOwnPropertyDescriptor(target, key) {
      if (key !== "hostname") return Reflect.getOwnPropertyDescriptor(target, key);
      hostnameDescriptorReads += 1;
      if (hostnameDescriptorReads === 1) return Reflect.getOwnPropertyDescriptor(target, key);
      return { configurable: true, enumerable: true, get() { throw new Error("getter must not run"); } };
    }
  });

  assert.throws(() => buildCosmeticPolicy(input), /must remain an own enumerable data field/);
  assert.equal(hostnameDescriptorReads, 2);
});

test("runtime message dispatch uses exact descriptor snapshots and contains revoked roots", () => {
  const fixture = apiFixture();
  const runtime = installCosmeticRuntime({ api: fixture.api });
  const listener = fixture.messageListener();
  assert.equal(typeof listener, "function");

  let gets = 0;
  const message = new Proxy({ type: "drop-ads:get-cosmetic-policy" }, {
    get() {
      gets += 1;
      throw new Error("normal message get trap must not run");
    }
  });
  assert.equal(listener(message, { url: "https://example.com/" }, () => {}), true);
  assert.equal(gets, 0);

  const revoked = Proxy.revocable({ type: "drop-ads:get-cosmetic-policy" }, {});
  revoked.revoke();
  assert.equal(listener(revoked.proxy, {}, () => {}), false);
  assert.doesNotThrow(() => fixture.storageListener()(revoked.proxy, "local"));
  runtime.dispose();
});
