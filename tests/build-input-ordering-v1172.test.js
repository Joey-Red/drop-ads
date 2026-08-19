import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { compareBuildInputText } from "../tools/build-input-discovery.mjs";

const discovery = fs.readFileSync(new URL("../tools/build-input-discovery.mjs", import.meta.url), "utf8");
const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1172 uses one locale-independent comparator for discovery and fingerprints", () => {
  assert.equal(compareBuildInputText("A", "a"), -1);
  assert.equal(compareBuildInputText("a", "A"), 1);
  assert.equal(compareBuildInputText("same", "same"), 0);
  assert.match(discovery, /entries\.sort\(\(a, b\) => compareBuildInputText\(a\.name, b\.name\)\)/);
  assert.match(buildInfo, /absolutePaths\.sort\(\(a, b\) => compareBuildInputText\(canonicalByPath\.get\(a\), canonicalByPath\.get\(b\)\)\)/);
  assert.match(buildInfo, /canonical\.sort\(\(a, b\) => compareBuildInputText\(a\.path, b\.path\)\)/);
});

test("M1172 removes locale-sensitive ordering from build-input identity", () => {
  assert.doesNotMatch(discovery, /localeCompare/);
  assert.doesNotMatch(buildInfo, /localeCompare/);
  assert.match(buildInfo, /compareBuildInputText/);
});
