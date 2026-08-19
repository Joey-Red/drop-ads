import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertGeneratedEntryName, MAX_GENERATED_TREE_PATH_BYTES } from "../tools/artifact-audit.mjs";

const source = await readFile(new URL("../tools/artifact-audit.mjs", import.meta.url), "utf8");

test("M1229 validates directory entry names before generated path construction", () => {
  const validation = source.indexOf("assertGeneratedEntryName(entry?.name, browser)");
  const join = source.indexOf("join(current, entry.name)");
  assert.ok(validation >= 0 && join > validation);
});

test("M1229 rejects non-canonical generated directory entry names", () => {
  for (const value of ["", ".", "..", "a/b", "a\\b", "bad\0name", "bad\u202ename"]) {
    assert.throws(() => assertGeneratedEntryName(value, "chromium"));
  }
});

test("M1229 enforces the generated entry-name UTF-8 ceiling", () => {
  assert.equal(assertGeneratedEntryName("a".repeat(MAX_GENERATED_TREE_PATH_BYTES), "firefox").length, MAX_GENERATED_TREE_PATH_BYTES);
  assert.throws(
    () => assertGeneratedEntryName("a".repeat(MAX_GENERATED_TREE_PATH_BYTES + 1), "firefox"),
    /exceeds .* UTF-8 bytes/
  );
});
