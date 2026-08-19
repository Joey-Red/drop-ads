import assert from "node:assert/strict";
import test from "node:test";

import { openPopupOptionsPage } from "../src/core/popup-boundary.js";

test("popup options opener preserves the runtime receiver", async () => {
  const runtime = Object.create(null);
  Object.defineProperty(runtime, "openOptionsPage", {
    enumerable: true,
    value() {
      assert.equal(this, runtime);
      return Promise.resolve("opened");
    }
  });
  const api = Object.create(null);
  Object.defineProperty(api, "runtime", { enumerable: true, value: runtime });

  assert.equal(await openPopupOptionsPage(api), "opened");
});

test("popup options opener rejects accessor collaborator without executing it", () => {
  let getterCalls = 0;
  const runtime = Object.create(null);
  Object.defineProperty(runtime, "openOptionsPage", {
    get() {
      getterCalls += 1;
      return () => {};
    }
  });

  assert.throws(() => openPopupOptionsPage({ runtime }), /data property/);
  assert.equal(getterCalls, 0);
});

test("popup options opener rejects non-function collaborators", () => {
  assert.throws(() => openPopupOptionsPage({ runtime: { openOptionsPage: false } }), /must be a data function/);
});
