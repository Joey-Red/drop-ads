import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("picker panel stays usable at narrow width and high zoom", () => {
  assert.match(source, /max-height:\s*calc\(100vh - 44px\)/);
  assert.match(source, /overflow:\s*auto/);
  assert.match(source, /#actions \{[^}]*flex-wrap:\s*wrap/s);
  assert.match(source, /@media \(max-width: 420px\)/);
  assert.match(source, /#actions \{ flex-direction:column; \}/);
  assert.match(source, /#actions button \{ width:100%/);
});
