import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_REMOTE_RESPONSE_HEADER_CHARS,
  downloadAndParseSubscription,
  readResponseTextBounded
} from "../src/core/list-updates.js";

const subscription = Object.freeze({
  id: "header-bound-fixture",
  title: "Header bound fixture",
  format: "hosts",
  sourceUrl: "https://example.com/hosts.txt",
  enabled: true,
  builtIn: false
});

function textResponse(headersGet) {
  return {
    ok: true,
    redirected: false,
    status: 200,
    headers: { get: headersGet },
    body: null,
    text() { return Promise.resolve("0.0.0.0 ads.example\n"); }
  };
}

test("M457 rejects oversized Content-Length before body consumption", async () => {
  let textCalls = 0;
  const response = {
    body: null,
    text() {
      textCalls += 1;
      return Promise.resolve("ok");
    },
    headers: {
      get(name) {
        return name === "content-length" ? "1".repeat(MAX_REMOTE_RESPONSE_HEADER_CHARS + 1) : null;
      }
    }
  };

  await assert.rejects(
    () => readResponseTextBounded(response, 32),
    /content-length.*exceeds/i
  );
  assert.equal(textCalls, 0);
});

test("M457 rejects oversized Content-Type before remote body parsing", async () => {
  let textCalls = 0;
  const response = textResponse((name) => (
    name === "content-type" ? "x".repeat(MAX_REMOTE_RESPONSE_HEADER_CHARS + 1) : null
  ));
  response.text = () => {
    textCalls += 1;
    return Promise.resolve("0.0.0.0 ads.example\n");
  };

  await assert.rejects(
    () => downloadAndParseSubscription(subscription, async () => response),
    /content-type.*exceeds/i
  );
  assert.equal(textCalls, 0);
});
