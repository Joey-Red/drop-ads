import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MAX_REMOTE_RESPONSE_HEADER_CHARS,
  downloadAndParseSubscription
} from "../src/core/list-updates.js";

const subscription = {
  id: "header-bound",
  title: "Header bound",
  format: "hosts",
  sourceUrl: "https://example.com/list.txt",
  enabled: true,
  builtIn: false
};

function responseWithHeader(name, value) {
  return {
    ok: true,
    redirected: false,
    status: 200,
    headers: {
      get(requested) {
        return requested === name ? value : null;
      }
    },
    body: null,
    text() { return Promise.resolve("0.0.0.0 ads.example\n"); }
  };
}

test("M457 bounds raw response header strings before parsing work", async () => {
  assert.equal(MAX_REMOTE_RESPONSE_HEADER_CHARS, 8_192);
  await assert.rejects(
    downloadAndParseSubscription(subscription, async () => responseWithHeader("content-type", "x".repeat(MAX_REMOTE_RESPONSE_HEADER_CHARS + 1))),
    /header content-type exceeds 8192 characters/
  );
  await assert.rejects(
    downloadAndParseSubscription(subscription, async () => responseWithHeader("content-length", "9".repeat(MAX_REMOTE_RESPONSE_HEADER_CHARS + 1))),
    /header content-length exceeds 8192 characters/
  );
});

test("M457 source applies the header ceiling in the shared header-value boundary", () => {
  const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");
  assert.match(source, /if \(value\.length > MAX_REMOTE_RESPONSE_HEADER_CHARS\)/);
  assert.match(source, /header \$\{name\} exceeds \$\{MAX_REMOTE_RESPONSE_HEADER_CHARS\} characters/);
});
