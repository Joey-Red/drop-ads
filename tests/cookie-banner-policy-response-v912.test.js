import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("cookie-banner controller requires an exact plain enabled response", () => {
  assert.match(source, /prototype = Object\.getPrototypeOf\(value\)/);
  assert.match(source, /isArray = Array\.isArray\(value\)/);
  assert.match(source, /prototype !== Object\.prototype && prototype !== null/);
  assert.match(source, /keys\.length !== 1 \|\| keys\[0\] !== "enabled"/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(value, "enabled"\)/);
  assert.match(source, /descriptor\.enumerable === true/);
  assert.match(source, /"value" in descriptor/);
  assert.match(source, /typeof descriptor\.value === "boolean"/);
  assert.doesNotMatch(source, /response\.(?:url|domain|page|title|text|html|click|request)/i);
});
