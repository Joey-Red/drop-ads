import assert from "node:assert/strict";
import test from "node:test";

import { installCosmeticRuntime, MAX_COSMETIC_RUNTIME_ERROR_CHARS } from "../src/core/cosmetic-runtime.js";

function apiFixture({ localGet = async () => ({}), tabsQuery = async () => [] } = {}) {
  let messageListener = null;
  let messageAdds = 0;
  let storageAdds = 0;
  const api = {
    runtime: {
      onMessage: {
        addListener(listener) { messageListener = listener; messageAdds += 1; },
        removeListener() {}
      }
    },
    storage: {
      local: { get: localGet, async set() {} },
      session: { async get() { return {}; }, async set() {} },
      onChanged: { addListener() { storageAdds += 1; }, removeListener() {} }
    },
    tabs: { query: tabsQuery, async sendMessage() {} },
    declarativeNetRequest: { async updateDynamicRules() {}, async getDynamicRules() { return []; } }
  };
  return { api, listener: () => messageListener, counts: () => ({ messageAdds, storageAdds }) };
}

test("supplied cosmetic logger warn accessor fails without getter execution or listener registration", () => {
  const fixture = apiFixture();
  let reads = 0;
  const logger = {};
  Object.defineProperty(logger, "warn", {
    enumerable: true,
    get() {
      reads += 1;
      return () => {};
    }
  });
  assert.throws(() => installCosmeticRuntime({ api: fixture.api, logger }), /own enumerable data field/);
  assert.equal(reads, 0);
  assert.deepEqual(fixture.counts(), { messageAdds: 0, storageAdds: 0 });
});

test("cosmetic runtime warnings use the captured warn function without normal logger gets", async () => {
  let gets = 0;
  let warnings = 0;
  const logger = new Proxy({ warn() { warnings += 1; } }, {
    get() {
      gets += 1;
      throw new Error("normal logger get trap must not run");
    }
  });
  const fixture = apiFixture({ tabsQuery: async () => { throw new Error("tab query failed"); } });
  const runtime = installCosmeticRuntime({ api: fixture.api, logger });
  assert.deepEqual(await runtime.broadcastRefresh(), { attempted: 0, failed: 0 });
  assert.equal(warnings, 1);
  assert.equal(gets, 0);
  runtime.dispose();
});

async function policyFailureResponse(thrown) {
  const fixture = apiFixture({ localGet: async () => { throw thrown; } });
  const runtime = installCosmeticRuntime({ api: fixture.api, logger: { warn() {} } });
  const response = await new Promise((resolve, reject) => {
    const handled = fixture.listener()({ type: "drop-ads:get-cosmetic-policy" }, { url: "https://example.com/" }, resolve);
    if (!handled) reject(new Error("cosmetic policy message was not handled"));
  });
  runtime.dispose();
  return response;
}

test("cosmetic runtime error replies read only bounded own-data messages", async () => {
  let getterReads = 0;
  const accessorError = {};
  Object.defineProperty(accessorError, "message", {
    get() { getterReads += 1; return "must not run"; }
  });
  assert.deepEqual(await policyFailureResponse(accessorError), { ok: false, error: "Could not read cosmetic policy" });
  assert.equal(getterReads, 0);

  const oversized = {};
  Object.defineProperty(oversized, "message", { value: "x".repeat(MAX_COSMETIC_RUNTIME_ERROR_CHARS + 1) });
  assert.deepEqual(await policyFailureResponse(oversized), { ok: false, error: "Could not read cosmetic policy" });

  assert.deepEqual(await policyFailureResponse(new Error("bounded failure")), { ok: false, error: "bounded failure" });
});
