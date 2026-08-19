import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");
assert.match(source, /let pendingToggleSource = null/);
assert.match(source, /subscriptionList\.addEventListener\("change", handleSubscriptionChange, true\)/);
assert.match(source, /if \(hasChildListChange && replacement\)/);
assert.match(source, /checkbox\?\.focus\(\)/);
assert.match(source, /attributeFilter: \["disabled"\]/);
assert.match(source, /subscriptionList\?\.removeEventListener\("change", handleSubscriptionChange, true\)/);
