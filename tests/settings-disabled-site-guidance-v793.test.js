import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("disabled-site recovery references visible site and guidance", () => {
  assert.match(source, /disabledSitesHelp\.id = "disabled-sites-help"/);
  assert.match(source, /const siteId = `disabled-site-\$\{rowIndex\}`/);
  assert.match(source, /action\.setAttribute\("aria-describedby", `\$\{siteId\} disabled-sites-help`\)/);
});
