import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");
assert.match(source, /let pendingRemoveIndex = null/);
assert.match(source, /subscriptionList\.addEventListener\("click", handleSubscriptionClick, true\)/);
assert.match(source, /if \(!rows\.length\) \{\s*subscriptionUrlInput\?\.focus\(\)/s);
assert.match(source, /rows\[Math\.min\(index, rows\.length - 1\)\]/);
assert.match(source, /control\.matches\?\.\("button\.remove"\) === true && pendingRemoveIndex != null/);
