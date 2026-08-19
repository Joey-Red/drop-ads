import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/subscription-presentation.js", import.meta.url), "utf8");

test("filter-list rows expose current committed state as visible text", () => {
  assert.match(source, /import \{ subscriptionCommitStatus \} from "\.\.\/core\/ui-commit-status\.js";/);
  assert.match(source, /subscriptionCommitStatus\(Boolean\(checkbox\.checked\), checkboxBusy\(checkbox\)\)/);
  assert.match(source, /addEventListener\("change", handleSubscriptionStateChange\)/);
  assert.match(source, /removeEventListener\("change", handleSubscriptionStateChange\)/);
});
