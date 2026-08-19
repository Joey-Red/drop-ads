import test from "node:test";
import assert from "node:assert/strict";
import { setActionCountEnabled } from "../src/core/action-count.js";

test("M397 setActionCountEnabled keeps one captured operation set through rollback", async () => {
  const calls = [];
  const local = {
    async get() {
      calls.push("get");
      local.set = async () => calls.push("mutated-set");
      return { dropAdsActionCountBadgeEnabled: false };
    },
    async set() {
      calls.push("set");
      throw new Error("persist failed");
    }
  };
  const dnr = {
    async setExtensionActionOptions({ displayActionCountAsBadgeText }) {
      calls.push(`dnr:${displayActionCountAsBadgeText}`);
      dnr.setExtensionActionOptions = async () => calls.push("mutated-dnr");
    }
  };

  await assert.rejects(
    setActionCountEnabled({ storage: { local }, declarativeNetRequest: dnr }, true),
    /persist failed/
  );
  assert.deepEqual(calls, ["get", "dnr:true", "set", "dnr:false"]);
});

test("M397 accessor-backed storage operations are rejected without executing accessors", async () => {
  let getterCalls = 0;
  const local = {};
  Object.defineProperty(local, "get", {
    get() { getterCalls += 1; return async () => ({}); }
  });
  local.set = async () => {};
  await assert.rejects(
    setActionCountEnabled({ storage: { local }, declarativeNetRequest: {} }, true),
    /storage\.local\.get/
  );
  assert.equal(getterCalls, 0);
});
