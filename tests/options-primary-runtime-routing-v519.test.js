import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/options.js", import.meta.url), "utf8");

test("primary Settings routes runtime messaging through captured sender", () => {
  assert.match(source, /import \{ sendOptionsRuntimeMessage \} from "\.\.\/core\/options-runtime\.js";/);
  assert.doesNotMatch(source, /api\.runtime\.sendMessage\s*\(/);
  assert.match(source, /sendOptionsRuntimeMessage\(api, message\)/);
  assert.match(source, /drop-ads:submit-community/);
  assert.match(source, /drop-ads:add-subscription/);
  assert.match(source, /drop-ads:set-subscription-enabled/);
  assert.match(source, /drop-ads:remove-subscription/);
  assert.match(source, /drop-ads:refresh-lists/);
  assert.match(source, /drop-ads:import-settings/);
});

test("primary Settings preserves internal mutation suppression around background mutations", () => {
  assert.match(source, /async function withInternalMutation\(task\)/);
  assert.match(source, /return withInternalMutation\(async \(\) => \{/);
  assert.match(source, /internalMutationDepth \+= 1/);
  assert.match(source, /internalMutationDepth -= 1/);
});
