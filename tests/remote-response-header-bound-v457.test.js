import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_REMOTE_RESPONSE_HEADER_CHARS,
  downloadAndParseSubscription,
  readResponseTextBounded
} from "../src/core/list-updates.js";

const subscription = Object.freeze({
  id: "header-bound-test",
  title: "Header bound test",
  format: "hosts",
  sourceUrl: "https://example.com/hosts.txt",
  enabled: true,
  builtIn: false
});

test("M457 oversized Content-Length is rejected before body text work", async () => {
  let textCalls = 0;
  const response = {
    body: null,
    async text() {
      textCalls += 1;
      return "0.0.0.0 ads.example";
    }
  };
  const headersGet = (name) => name === "content-length"
    ? "9".repeat(MAX_REMOTE_RESPONSE_HEADER_CHARS + 1)
    : null;

  await assert.rejects(
    readResponseTextBounded(response, 1024, { headersGet }),
    /header content-length exceeds/i
  );
  assert.equal(textCalls, 0);
});

test("M457 oversized Content-Type is rejected before remote body parsing", async () => {
  let textCalls = 0;
  const fetchImpl = async () => ({
    ok: true,
    redirected: false,
    status: 200,
    headers: {
      get(name) {
        if (name === "content-type") return "text/plain;" + "x".repeat(MAX_REMOTE_RESPONSE_HEADER_CHARS);
        return null;
      }
    },
    body: null,
    async text() {
      textCalls += 1;
      return "0.0.0.0 ads.example";
    }
  });

  await assert.rejects(
    downloadAndParseSubscription(subscription, fetchImpl),
    /header content-type exceeds/i
  );
  assert.equal(textCalls, 0);
});
