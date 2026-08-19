import test from "node:test";
import assert from "node:assert/strict";

import { ACTION_COUNT_PREFERENCE_KEY, setActionCountEnabled } from "../src/core/action-count.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test("action-count mutation keeps one captured operation set across async gaps", async () => {
  const gate = deferred();
  const calls = [];
  const local = {
    get() { calls.push("get"); return gate.promise; },
    set(value) { calls.push(["set", value[ACTION_COUNT_PREFERENCE_KEY]]); }
  };
  const dnr = {
    setExtensionActionOptions(value) { calls.push(["dnr", value.displayActionCountAsBadgeText]); }
  };
  const api = { storage: { local }, declarativeNetRequest: dnr };

  const operation = setActionCountEnabled(api, true);
  local.set = () => { throw new Error("replacement set must not run"); };
  dnr.setExtensionActionOptions = () => { throw new Error("replacement DNR method must not run"); };
  gate.resolve({ [ACTION_COUNT_PREFERENCE_KEY]: false });

  assert.deepEqual(await operation, { enabled: true, supported: true, changed: true });
  assert.deepEqual(calls, ["get", ["dnr", true], ["set", true]]);
});

test("action-count persistence rollback uses the originally captured DNR operation", async () => {
  const calls = [];
  const local = {
    async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: false }; },
    async set() { throw new Error("persist failed"); }
  };
  const dnr = {
    async setExtensionActionOptions(value) {
      calls.push(value.displayActionCountAsBadgeText);
      if (value.displayActionCountAsBadgeText) {
        dnr.setExtensionActionOptions = () => { throw new Error("replacement rollback must not run"); };
      }
    }
  };

  await assert.rejects(
    setActionCountEnabled({ storage: { local }, declarativeNetRequest: dnr }, true),
    /persist failed/
  );
  assert.deepEqual(calls, [true, false]);
});
