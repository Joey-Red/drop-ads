import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M428 remote response metadata is detached before admission", () => {
  assert.match(source, /function responseMetadataSnapshot\(response\)/);
  assert.match(source, /const metadata = responseMetadataSnapshot\(response\);/);
  assert.match(source, /if \(metadata\.redirected\)/);
  assert.match(source, /if \(!metadata\.ok\)/);
  assert.match(source, /assertListMediaType\(metadata\.headersGet\)/);
  assert.doesNotMatch(source, /if \(response\.redirected === true\)/);
  assert.doesNotMatch(source, /if \(!response\.ok\)/);
});

test("M428 plain response header access is descriptor-safe and captured", async () => {
  let textCalls = 0;
  const response = {
    headers: { get(name) { return name === "content-length" ? "2" : null; } },
    body: null,
    async text() { textCalls += 1; return "ok"; }
  };
  assert.equal(await readResponseTextBounded(response, 16), "ok");
  assert.equal(textCalls, 1);

  let headerGetterCalls = 0;
  const hostile = { body: null, async text() { throw new Error("must not read body"); } };
  Object.defineProperty(hostile, "headers", {
    enumerable: true,
    get() { headerGetterCalls += 1; return { get() { return null; } }; }
  });
  await assert.rejects(() => readResponseTextBounded(hostile, 16), /headers must be an own enumerable data field/);
  assert.equal(headerGetterCalls, 0);
});
