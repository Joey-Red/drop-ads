import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("cookie-banner actions reject toggle-state semantics", () => {
  assert.match(source, /TOGGLE_ROLES = new Set/);
  assert.match(source, /aria-pressed/);
  assert.match(source, /aria-checked/);
  assert.match(source, /menuitemcheckbox/);
  assert.match(source, /menuitemradio/);
  assert.match(source, /!toggleSemanticsSafe\(element\)/);
});
