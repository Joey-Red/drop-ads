import test from "node:test";
import assert from "node:assert/strict";
import { downloadAndParseSubscription } from "../src/core/list-updates.js";

const subscription = {
  id: "response-metadata-test",
  title: "Response metadata test",
  format: "hosts",
  sourceUrl: "https://example.com/list.txt",
  enabled: true,
  builtIn: false
};

function validResponse() {
  const headers = {
    get(name) {
      assert.equal(this, headers);
      if (name === "content-type") return "text/plain";
      if (name === "content-length") return null;
      return null;
    }
  };
  return {
    ok: true,
    redirected: false,
    status: 200,
    headers,
    body: null,
    async text() { return "0.0.0.0 ads.example.com\n"; }
  };
}

test("remote-list response metadata accepts detached own-data fields and preserves headers receiver", async () => {
  const parsed = await downloadAndParseSubscription(subscription, async () => validResponse(), { timeoutMs: 1_000 });
  assert.equal(parsed.block.some((rule) => rule.kind === "domain" && rule.value === "ads.example.com"), true);
});

test("remote-list response metadata rejects accessors without executing them or reading the body", async () => {
  let getterCalls = 0;
  let bodyReads = 0;
  const response = validResponse();
  Object.defineProperty(response, "ok", {
    enumerable: true,
    get() { getterCalls += 1; return true; }
  });
  response.text = async () => { bodyReads += 1; return "0.0.0.0 ads.example.com\n"; };

  await assert.rejects(
    downloadAndParseSubscription(subscription, async () => response, { timeoutMs: 1_000 }),
    /response ok must be an own enumerable data field/
  );
  assert.equal(getterCalls, 0);
  assert.equal(bodyReads, 0);
});

test("remote-list response metadata rejects type-confused flags before body consumption", async () => {
  for (const [key, value] of [["ok", 1], ["redirected", "false"], ["status", 200.5]]) {
    let bodyReads = 0;
    const response = validResponse();
    response[key] = value;
    response.text = async () => { bodyReads += 1; return "0.0.0.0 ads.example.com\n"; };
    await assert.rejects(downloadAndParseSubscription(subscription, async () => response, { timeoutMs: 1_000 }));
    assert.equal(bodyReads, 0);
  }
});
