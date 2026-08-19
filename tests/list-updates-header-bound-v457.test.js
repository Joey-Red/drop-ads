import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MAX_REMOTE_RESPONSE_HEADER_CHARS,
  readResponseTextBounded
} from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M457 locks the raw remote response header ceiling before normalization", () => {
  assert.equal(MAX_REMOTE_RESPONSE_HEADER_CHARS, 8_192);
  assert.match(source, /if \(value\.length > MAX_REMOTE_RESPONSE_HEADER_CHARS\)/);
  assert.match(source, /function responseMediaType\(headersGet\)[\s\S]*headerValue\(headersGet, "content-type"\)[\s\S]*\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /function declaredContentLength\(headersGet\)[\s\S]*headerValue\(headersGet, "content-length"\)[\s\S]*raw\.trim\(\)/);
});

test("M457 rejects an oversized captured Content-Length string before body work", async () => {
  let bodyCalls = 0;
  const response = {
    body: null,
    text() {
      bodyCalls += 1;
      return "example.com\n";
    }
  };
  const headersGet = (name) => name === "content-length"
    ? "1".repeat(MAX_REMOTE_RESPONSE_HEADER_CHARS + 1)
    : null;

  await assert.rejects(
    readResponseTextBounded(response, 1024, { headersGet }),
    new RegExp(`content-length exceeds ${MAX_REMOTE_RESPONSE_HEADER_CHARS} characters`)
  );
  assert.equal(bodyCalls, 0);
});
