import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");
assert.match(source, /remove\.textContent = "Remove list"/);
assert.match(source, /remove\.setAttribute\("aria-label", `Remove filter list \$\{titleText\}`\)/);
