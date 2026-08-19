import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("M809 derived popup guidance yields to explicit status text without self-trigger loops", () => {
  assert.match(source, /let lastDerivedStatus = ""/);
  assert.match(source, /function releaseDerivedStatusOwnership\(\)/);
  assert.match(source, /if \(current === lastDerivedStatus\) return/);
  assert.match(source, /delete sessionStatus\.dataset\.derivedStatus/);
  assert.match(source, /sessionStatusObserver = new globalThis\.MutationObserver\(handleSessionStatusMutation\)/);
  assert.match(source, /if \(existing !== next\) sessionStatus\.textContent = next/);
  assert.match(source, /sessionStatusObserver\?\.disconnect\(\)/);
});
