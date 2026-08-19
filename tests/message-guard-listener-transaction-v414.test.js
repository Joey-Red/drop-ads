import test from "node:test";
import assert from "node:assert/strict";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

function fakeApi() {
  const added = [];
  let failAdd = true;
  let failRemove = false;
  return {
    added,
    setFailAdd(value) { failAdd = value; },
    setFailRemove(value) { failRemove = value; },
    api: {
      runtime: {
        onMessage: {
          addListener(listener) {
            if (failAdd) throw new Error("add failed");
            added.push(listener);
          },
          removeListener() {
            if (failRemove) throw new Error("remove failed");
          }
        }
      }
    }
  };
}

test("M414 failed browser registration releases logical listener identity for retry", () => {
  const fake = fakeApi();
  const guarded = createMessageGuardedApi(fake.api, { group: "core" });
  const listener = () => false;

  assert.throws(() => guarded.runtime.onMessage.addListener(listener), /add failed/);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);

  fake.setFailAdd(false);
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);
  assert.equal(fake.added.length, 1);
});

test("M414 removal releases logical identity before throwing browser teardown", () => {
  const fake = fakeApi();
  fake.setFailAdd(false);
  const guarded = createMessageGuardedApi(fake.api, { group: "core" });
  let calls = 0;
  const listener = () => {
    calls += 1;
    return false;
  };

  guarded.runtime.onMessage.addListener(listener);
  const staleWrapper = fake.added[0];
  fake.setFailRemove(true);
  assert.doesNotThrow(() => guarded.runtime.onMessage.removeListener(listener));
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);

  assert.equal(staleWrapper({ type: "drop-ads:get-ui-state" }, {}, () => {}), false);
  assert.equal(calls, 0);

  fake.setFailRemove(false);
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);
  assert.equal(fake.added.length, 2);
});
