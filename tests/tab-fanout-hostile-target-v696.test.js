import test from "node:test";
import assert from "node:assert/strict";
import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("fanout skips hostile tab entries without invoking id accessors", async () => {
  let idReads = 0;
  const accessorTab = {};
  Object.defineProperty(accessorTab, "id", {
    enumerable: true,
    get() { idReads += 1; return 1; }
  });
  const customPrototypeTab = Object.create({ inherited: true });
  Object.defineProperty(customPrototypeTab, "id", { enumerable: true, value: 2 });
  const revocable = Proxy.revocable({ id: 3 }, {});
  revocable.revoke();

  const seen = [];
  const api = { tabs: { async sendMessage(tabId) { seen.push(tabId); } } };
  const result = await sendTabMessageBatched(
    api,
    [accessorTab, customPrototypeTab, revocable.proxy, { id: 4 }],
    { type: "refresh" }
  );

  assert.equal(idReads, 0);
  assert.deepEqual(seen, [4]);
  assert.deepEqual(result, { attempted: 1, failed: 0 });
});

test("fanout rejects accessor-based sendMessage collaborator without invocation", async () => {
  let reads = 0;
  const tabs = {};
  Object.defineProperty(tabs, "sendMessage", {
    enumerable: true,
    get() { reads += 1; return async () => undefined; }
  });

  await assert.rejects(sendTabMessageBatched({ tabs }, [{ id: 1 }], { type: "refresh" }), /data function/);
  assert.equal(reads, 0);
});
