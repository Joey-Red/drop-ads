import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function textResponse(text) {
  return {
    body: null,
    text: async () => text
  };
}

test("M439 fallback text uses code-unit preflight before UTF-8 allocation", () => {
  const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");
  const preflight = source.indexOf("if (text.length > byteLimit)");
  const encoder = source.indexOf("new TextEncoder().encode(text)", preflight);
  assert.ok(preflight >= 0);
  assert.ok(encoder > preflight);
});

test("M439 exact-bound ASCII fallback remains valid", async () => {
  assert.equal(await readResponseTextBounded(textResponse("abcd"), 4), "abcd");
});

test("M439 multibyte text inside the character preflight still obeys the byte ceiling", async () => {
  await assert.rejects(readResponseTextBounded(textResponse("éé"), 2), /Remote list is too large/);
});
