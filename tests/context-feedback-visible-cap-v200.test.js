import assert from "node:assert/strict";
import test from "node:test";

import { installContextBlockFeedback, MAX_VISIBLE_CONTEXT_FEEDBACK } from "../src/core/context-feedback.js";
import { MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

test("visible context feedback evicts the oldest tab at the 128-status cap", async () => {
  let clickListener;
  let storageListener;
  let nextTimer = 1;
  const cleared = [];
  const titles = [];
  const api = {
    contextMenus: { onClicked: { addListener(fn) { clickListener = fn; }, removeListener() {} } },
    storage: { onChanged: { addListener(fn) { storageListener = fn; }, removeListener() {} } },
    action: {
      async setTitle(update) { titles.push(update); }
    },
    tabs: {
      async sendMessage() { return { cleaned: false }; }
    }
  };
  const registration = installContextBlockFeedback({
    api,
    setTimeoutImpl() { return nextTimer++; },
    clearTimeoutImpl(timer) { cleared.push(timer); }
  });

  for (let tabId = 0; tabId <= MAX_VISIBLE_CONTEXT_FEEDBACK; tabId += 1) {
    const domain = `ad${tabId}.example.com`;
    clickListener({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: `https://${domain}/asset.js` }, { id: tabId });
    storageListener({
      [STORAGE_KEY]: { newValue: { personalBlock: [{ kind: "domain", value: domain }] } }
    }, "local");
    await flush();
  }

  assert.equal(MAX_VISIBLE_CONTEXT_FEEDBACK, 128);
  assert.ok(titles.some((update) => update.tabId === 0 && update.title === "drop-ads"));
  assert.ok(cleared.length > MAX_VISIBLE_CONTEXT_FEEDBACK);
  registration.dispose();
});
