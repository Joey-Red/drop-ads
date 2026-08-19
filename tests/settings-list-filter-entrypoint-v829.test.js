import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");
const dynamic = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("Settings owns list filtering through one explicit runtime entrypoint", () => {
  assert.match(html, /<script type="module" src="list-filter\.js"><\/script>/);
  assert.doesNotMatch(dynamic, /import "\.\/list-filter\.js";/);
});
