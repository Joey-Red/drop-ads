import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");
assert.match(source, /action\.textContent = "Re-enable"/);
assert.match(source, /action\.setAttribute\("aria-label", `Re-enable protection on \$\{site\}`\)/);
assert.match(source, /disabledSitesObserver\.observe\(disabledSitesList, \{ childList: true \}\)/);
assert.match(source, /disabledSitesObserver\?\.disconnect\(\)/);
