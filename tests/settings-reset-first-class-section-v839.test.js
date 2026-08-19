import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M839 configured reset is a first-class Settings section", () => {
  assert.match(source, /section\.id = "reset-settings-section"/);
  assert.match(source, /heading\.textContent = "Reset configured settings"/);
  assert.match(source, /backupSection\.insertAdjacentElement\("afterend", section\)/);
  assert.match(source, /link\.href = "#reset-settings-section"/);
  assert.match(source, /link\.textContent = "Reset"/);
  assert.doesNotMatch(source, /backupSection\.append\(panel\)/);
});
