import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");
assert.match(source, /action\.textContent = "Remove exception"/);
assert.match(source, /Remove cookie exception for \$\{site\}/);
assert.match(source, /cookieExceptionObserver\.observe\(cookieExceptionList, \{ childList: true \}\)/);
assert.match(source, /cookieExceptionObserver\?\.disconnect\(\)/);
