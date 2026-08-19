import assert from "node:assert/strict";
import test from "node:test";

import { installContextBlockFeedback } from "../src/core/context-feedback.js";
import { MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { LIVE_STATE_LIMITS } from "../src/core/state-limits.js";

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

test("malformed personalBlock event arrays fail without getters and preserve pending work", async () => {
  let clickListener;
  let storageListener;
  let sends = 0;
  let nextTimer = 1;
  const api = {
    contextMenus: { onClicked: { addListener(fn) { clickListener = fn; }, removeListener() {} } },
    storage: { onChanged: { addListener(fn) { storageListener = fn; }, removeListener() {} } },
    action: { async setTitle() {} },
    tabs: { async sendMessage() { sends += 1; return { cleaned: false }; } }
  };
  const registration = installContextBlockFeedback({
    api,
    setTimeoutImpl() { return nextTimer++; },
    clearTimeoutImpl() {}
  });

  clickListener({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://ads.example.com/a.js" }, { id: 1 });

  let reads = 0;
  const accessorArray = [{ kind: "domain", value: "ads.example.com" }];
  Object.defineProperty(accessorArray, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return { kind: "domain", value: "ads.example.com" };
    }
  });
  storageListener({ [STORAGE_KEY]: { newValue: { personalBlock: accessorArray } } }, "local");
  await flush();
  assert.equal(reads, 0);
  assert.equal(sends, 0);

  const overLimit = Array.from({ length: LIVE_STATE_LIMITS.personalRules + 1 }, () => ({ kind: "domain", value: "other.example.com" }));
  storageListener({ [STORAGE_KEY]: { newValue: { personalBlock: overLimit } } }, "local");
  await flush();
  assert.equal(sends, 0);

  storageListener({ [STORAGE_KEY]: { newValue: { personalBlock: [{ kind: "domain", value: "ads.example.com" }] } } }, "local");
  await flush();
  assert.equal(sends, 1);
  registration.dispose();
});
