import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(name) { return fs.readFileSync(new URL(`./${name}`, import.meta.url), "utf8"); }

const files = [
  "cookie-banner-revalidation-v904.test.js",
  "cookie-banner-hit-test-v907.test.js",
  "cookie-banner-semantic-availability-v915.test.js",
  "cookie-banner-shadow-activation-v917.test.js",
  "cookie-banner-direct-label-overflow-v962.test.js",
  "cookie-banner-descendant-overflow-v963.test.js",
  "cookie-banner-action-name-conflict-v965.test.js",
  "cookie-banner-labelledby-agreement-v966.test.js",
  "cookie-banner-navigation-ancestry-v967.test.js",
  "cookie-banner-dropads-descendant-v974.test.js",
  "cookie-banner-hidden-action-text-v976.test.js",
  "cookie-banner-invisible-format-v977.test.js",
  "cookie-banner-activation-ancestry-v982.test.js",
  "cookie-banner-editable-context-v983.test.js",
  "cookie-banner-editable-descendants-v984.test.js",
  "cookie-banner-editable-labelledby-v985.test.js",
  "cookie-banner-popup-launch-semantics-v986.test.js",
  "cookie-banner-popover-target-v988.test.js",
  "cookie-banner-disclosure-semantics-v992.test.js",
  "cookie-banner-busy-semantics-v995.test.js",
  "cookie-banner-controlled-region-v996.test.js",
  "cookie-banner-command-semantics-v997.test.js",
  "cookie-banner-action-context-composition-v1024.test.js",
  "cookie-banner-action-semantics-composition-v1025.test.js"
];

test("M1047 keeps historical cookie-banner regressions aligned with captured primitives", () => {
  for (const file of files) {
    const source = read(file);
    assert.ok(source.includes("assert."), `${file} must retain executable assertions`);
  }
  assert.match(read("cookie-banner-hit-test-v907.test.js"), /styleValue/);
  assert.match(read("cookie-banner-semantic-availability-v915.test.js"), /nativeHiddenGetter/);
  assert.match(read("cookie-banner-navigation-ancestry-v967.test.js"), /nativeShadowHostGetter/);
  assert.match(read("cookie-banner-editable-descendants-v984.test.js"), /nativeTreeWalkerNextNode/);
  assert.match(read("cookie-banner-busy-semantics-v995.test.js"), /elementHasAttribute/);
  assert.match(read("cookie-banner-action-context-composition-v1024.test.js"), /ownDataValue/);
  assert.match(read("cookie-banner-action-semantics-composition-v1025.test.js"), /ownDataValue/);
});
