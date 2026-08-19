import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");

test("picker publishes active session before arming lifetime", () => {
  const activeIndex = source.indexOf("active = { sessionId, cleanup, host };");
  const armIndex = source.indexOf("lifetime.arm();", activeIndex);
  assert.notEqual(activeIndex, -1);
  assert.notEqual(armIndex, -1);
  assert.ok(activeIndex < armIndex);
});

test("picker lifetime arm failure invokes cleanup before rethrow", () => {
  assert.match(source, /active = \{ sessionId, cleanup, host \};\s*try \{\s*lifetime\.arm\(\);\s*\} catch \(error\) \{\s*cleanup\(\);\s*throw error;\s*\}/s);
});

test("cleanup clears only its own published active session", () => {
  assert.match(source, /if \(active\?\.sessionId === sessionId\) active = null;/);
});
