import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("Country Settings routes runtime messages through the shared captured sender", () => {
  assert.match(source, /import \{ sendOptionsRuntimeMessage \} from "\.\.\/core\/options-runtime\.js";/);
  assert.match(source, /await sendOptionsRuntimeMessage\(api, message\)/);
  assert.doesNotMatch(source, /api\.runtime\.sendMessage\s*\(/);
});
