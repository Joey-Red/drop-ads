import test from "node:test";
import assert from "node:assert/strict";
import { downloadAndParseSubscription } from "../src/core/list-updates.js";

const subscription = {
  id: "metadata-test",
  title: "Metadata test",
  format: "third-party",
  sourceUrl: "https://example.com/list.txt",
  enabled: true,
  builtIn: false
};

test("M432 remote metadata snapshot remains compatible with native Response/Headers", async () => {
  const result = await downloadAndParseSubscription(subscription, async () => new Response(
    "||ads.example^\n",
    { status: 200, headers: { "content-type": "text/plain" } }
  ));
  assert.equal(result.block.length, 1);
});

test("M432 synthetic response metadata accessors fail before body consumption", async () => {
  let bodyReads = 0;
  const response = {
    get ok() { throw new Error("hostile metadata getter"); },
    redirected: false,
    status: 200,
    headers: { get() { return "text/plain"; } },
    text() { bodyReads += 1; return Promise.resolve("||ads.example^\n"); }
  };
  await assert.rejects(() => downloadAndParseSubscription(subscription, async () => response));
  assert.equal(bodyReads, 0);
});
