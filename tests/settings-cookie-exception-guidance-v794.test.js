import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("cookie exception removal references visible site and policy guidance", () => {
  assert.match(source, /const siteId = `cookie-exception-site-\$\{rowIndex\}`/);
  assert.match(source, /action\.setAttribute\("aria-describedby", `\$\{siteId\} cookie-help cookie-exception-error`\)/);
});
