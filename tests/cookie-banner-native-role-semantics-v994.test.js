import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-semantics-safety.js", import.meta.url), "utf8");

test("M994 refuses conflicting native control roles", () => {
  assert.match(safety, /function nativeRoleSemanticsSafe\(element\)/);
  assert.match(safety, /tag !== "button" && tag !== "input"/);
  assert.match(safety, /return role === "" \|\| role === "button"/);
  assert.match(safety, /!nativeRoleSemanticsSafe\(element\)/);
});
