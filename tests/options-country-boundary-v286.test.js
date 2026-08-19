import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/options/country.js", import.meta.url), "utf8");

test("Country Settings routes runtime replies through the shared response boundary", () => {
  assert.match(source, /unwrapOptionsRuntimeResponse/);
  assert.match(source, /return unwrapOptionsRuntimeResponse\(response, fallback\);/);
  assert.doesNotMatch(source, /response\?\.(?:ok|error|result)/);
  assert.doesNotMatch(source, /response\.(?:ok|error|result)/);
});

test("Country Settings routes storage relevance through the shared trap-safe helper", () => {
  assert.match(source, /isRelevantOptionsStorageChange\(changes, areaName, STORAGE_KEY\)/);
  assert.doesNotMatch(source, /changes\?\.\[STORAGE_KEY\]/);
  assert.doesNotMatch(source, /changes\[STORAGE_KEY\]/);
});
