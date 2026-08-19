import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("picker exposes local-only privacy guidance without activity retention", () => {
  assert.match(source, /id="privacy">Local only\./);
  assert.match(source, /does not retain page contents, picked-element history, request history, statistics, or identifiers/);
  assert.match(source, /aria-describedby="message privacy"/);
  assert.match(source, /aria-describedby="candidate message privacy"/);
});
