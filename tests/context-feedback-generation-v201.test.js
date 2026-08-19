import assert from "node:assert/strict";
import test from "node:test";

import { installContextBlockFeedback } from "../src/core/context-feedback.js";
import { MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

test("older visible status completion and stale timer cannot replace newer feedback", async () => {
  let clickListener;
  let storageListener;
  let nextTimer = 1;
  const timers = new Map();
  const cleared = [];
  const titles = [];
  const firstTitle = deferred();
  let visibleTitleCalls = 0;

  const api = {
    contextMenus: { onClicked: { addListener(fn) { clickListener = fn; }, removeListener() {} } },
    storage: { onChanged: { addListener(fn) { storageListener = fn; }, removeListener() {} } },
    action: {
      setTitle(update) {
        titles.push(update);
        if (update.title.startsWith("Drop Ads")) {
          visibleTitleCalls += 1;
          if (visibleTitleCalls === 1) return firstTitle.promise;
        }
        return Promise.resolve();
      }
    },
    tabs: { async sendMessage() { return { cleaned: false }; } }
  };

  const registration = installContextBlockFeedback({
    api,
    setTimeoutImpl(callback) {
      const id = nextTimer++;
      timers.set(id, callback);
      return id;
    },
    clearTimeoutImpl(id) { cleared.push(id); }
  });

  const commit = async (name) => {
    clickListener({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: `https://${name}.example.com/ad.js` }, { id: 7 });
    storageListener({ [STORAGE_KEY]: { newValue: { personalBlock: [{ kind: "domain", value: `${name}.example.com` }] } } }, "local");
    await flush();
  };

  await commit("first");
  await commit("second");
  assert.equal(nextTimer, 4); // two pending timers plus one current visible timer

  firstTitle.resolve();
  await flush();
  assert.equal(nextTimer, 4); // stale first completion did not install another timer

  const staleVisibleTimer = 3;
  await commit("third");
  assert.ok(cleared.includes(staleVisibleTimer));
  const resetsBeforeStaleCallback = titles.filter((item) => item.title === "drop-ads").length;
  timers.get(staleVisibleTimer)?.();
  await flush();
  assert.equal(titles.filter((item) => item.title === "drop-ads").length, resetsBeforeStaleCallback);

  registration.dispose();
});
