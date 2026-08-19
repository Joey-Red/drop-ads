import assert from "node:assert/strict";
import test from "node:test";

import { queryPopupActiveTab } from "../src/core/popup-boundary.js";

test("popup active-tab query preserves the tabs receiver and exact query envelope", async () => {
  let seenQuery = null;
  const tabs = Object.create(null);
  Object.defineProperty(tabs, "query", {
    enumerable: true,
    value(queryInfo) {
      assert.equal(this, tabs);
      seenQuery = queryInfo;
      return Promise.resolve([{ id: 7, url: "https://example.com/" }]);
    }
  });
  const api = Object.create(null);
  Object.defineProperty(api, "tabs", { enumerable: true, value: tabs });

  const result = await queryPopupActiveTab(api);
  assert.deepEqual(result, [{ id: 7, url: "https://example.com/" }]);
  assert.deepEqual(seenQuery, { active: true, currentWindow: true });
  assert.equal(Object.isFrozen(seenQuery), true);
});

test("popup active-tab query rejects accessor tabs without executing it", () => {
  let getterCalls = 0;
  const api = Object.create(null);
  Object.defineProperty(api, "tabs", {
    get() {
      getterCalls += 1;
      return {};
    }
  });

  assert.throws(() => queryPopupActiveTab(api), /data property/);
  assert.equal(getterCalls, 0);
});

test("popup active-tab query rejects non-function query collaborators", () => {
  const api = { tabs: { query: 1 } };
  assert.throws(() => queryPopupActiveTab(api), /must be a data function/);
});
