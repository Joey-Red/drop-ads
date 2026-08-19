import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

function fallbackResponse(text) {
  return {
    body: null,
    async text() { return text; }
  };
}

const options = { headersGet: () => null };

test("exact-bound ASCII fallback remains accepted", async () => {
  assert.equal(await readResponseTextBounded(fallbackResponse("abcd"), 4, options), "abcd");
});

test("code-unit preflight and exact multibyte byte gate both reject oversize text", async () => {
  await assert.rejects(
    () => readResponseTextBounded(fallbackResponse("abcde"), 4, options),
    /Remote list is too large/
  );
  await assert.rejects(
    () => readResponseTextBounded(fallbackResponse("ééé"), 4, options),
    /Remote list is too large/
  );
});

test("code-unit check precedes TextEncoder allocation on fallback path", () => {
  const start = source.indexOf("const text = await bodyCollaborators.text()");
  const end = source.indexOf("return text;", start);
  assert.ok(start >= 0 && end > start);
  const body = source.slice(start, end);
  assert.ok(body.indexOf("text.length > byteLimit") < body.indexOf("new TextEncoder().encode(text).byteLength"));
});
