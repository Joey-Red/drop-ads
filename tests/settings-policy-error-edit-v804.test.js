import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

test("editing a policy control clears only its bound stale error", () => {
  for (const needle of [
    '["#block-error", [["#block-input", "input"]]]',
    '["#allow-error", [["#allow-input", "input"]]]',
    '["#cookie-exception-error", [["#cookie-exception-input", "input"]]]',
    '["#cosmetic-hide-error", [["#cosmetic-hide-domain", "input"], ["#cosmetic-hide-selector", "input"]]]',
    '["#cosmetic-allow-error", [["#cosmetic-allow-domain", "input"], ["#cosmetic-allow-selector", "input"]]]',
    '["#backup-error", [["#import-settings-file", "change"]]]'
  ]) assert.ok(source.includes(needle), `missing edit-clear binding: ${needle}`);
  assert.match(source, /if \(textContent\(errorNode\)\) errorNode\.textContent = ""/);
  assert.match(source, /control\.removeEventListener\(eventName, listener\)/);
});
