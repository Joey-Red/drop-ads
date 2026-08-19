import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");
assert.match(source, /let disabledSiteRecoveryPending = false/);
assert.match(source, /if \(disabledSitesList\?\.querySelector\("button\.remove"\)\) return/);
assert.match(source, /disabledSitesHeading\.tabIndex = -1/);
assert.match(source, /disabledSitesHeading\.focus\(\{ preventScroll: true \}\)/);
assert.match(source, /disabledSitesList\?\.removeEventListener\("click", handleDisabledSiteAction\)/);
