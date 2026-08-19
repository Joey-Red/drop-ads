import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dynamicList = await readFile(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");
const subscriptions = await readFile(new URL("../src/options/subscription-presentation.js", import.meta.url), "utf8");
const policyRows = await readFile(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("Settings subtree observers avoid self-triggering text rewrites", () => {
  assert.match(dynamicList, /if \(remove\.textContent !== "Remove list"\) remove\.textContent = "Remove list"/);
  assert.match(dynamicList, /if \(remove\.textContent !== "Remove rule"\) remove\.textContent = "Remove rule"/);

  assert.match(subscriptions, /function setTextIfChanged\(/);
  assert.doesNotMatch(subscriptions, /ensureNote\([^\n]+\)\.textContent\s*=/);

  assert.match(policyRows, /if \(remove\.textContent !== "Remove country block"\) remove\.textContent = "Remove country block"/);
  assert.match(policyRows, /if \(remove\.textContent !== "Remove cosmetic rule"\) remove\.textContent = "Remove cosmetic rule"/);
});
