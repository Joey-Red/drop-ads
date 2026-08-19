import test from "node:test";
import assert from "node:assert/strict";

import { downloadAndParseSubscription } from "../src/core/list-updates.js";

const subscription = Object.freeze({
  id: "m430-response-test",
  title: "M430 response test",
  format: "hosts",
  sourceUrl: "https://example.com/drop-ads-m430.txt",
  enabled: true,
  builtIn: false
});

test("M430 accepts native Response prototype metadata and Headers methods", async () => {
  const result = await downloadAndParseSubscription(subscription, async () => new Response(
    "0.0.0.0 ads.example.com\n",
    { status: 200, headers: { "content-type": "text/plain", "content-length": "24" } }
  ));
  assert.equal(result.block.length, 1);
  assert.equal(result.allow.length, 0);
});

test("M430 rejects accessor-backed synthetic response metadata before body consumption", async () => {
  let bodyReads = 0;
  const response = {
    redirected: false,
    status: 200,
    headers: { get() { return "text/plain"; } },
    text() { bodyReads += 1; return Promise.resolve("0.0.0.0 ads.example.com\n"); }
  };
  Object.defineProperty(response, "ok", {
    enumerable: true,
    get() { throw new Error("must not execute response ok getter"); }
  });

  await assert.rejects(
    downloadAndParseSubscription(subscription, async () => response),
    /Remote list response ok must be an own enumerable data field/
  );
  assert.equal(bodyReads, 0);
});

test("M430 validates primitive response metadata before list parsing", async () => {
  let bodyReads = 0;
  const response = {
    ok: true,
    redirected: "false",
    status: 200,
    headers: { get() { return "text/plain"; } },
    text() { bodyReads += 1; return Promise.resolve("0.0.0.0 ads.example.com\n"); }
  };
  await assert.rejects(
    downloadAndParseSubscription(subscription, async () => response),
    /Remote list response redirected must be boolean/
  );
  assert.equal(bodyReads, 0);
});
