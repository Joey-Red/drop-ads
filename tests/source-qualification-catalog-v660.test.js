import assert from "node:assert/strict";
import test from "node:test";
import { snapshotQualificationSourceCatalog } from "../tools/source-qualification-summary.mjs";

function source(id, url) {
  return {
    id,
    title: id,
    format: "hosts",
    sourceUrl: url,
    enabled: true,
    builtIn: true
  };
}

test("qualification catalog rejects duplicate normalized ids", () => {
  assert.throws(() => snapshotQualificationSourceCatalog([
    source("same", "https://example.com/a.txt"),
    source("same", "https://example.com/b.txt")
  ]), /duplicate id/);
});

test("qualification catalog rejects duplicate normalized source identities", () => {
  assert.throws(() => snapshotQualificationSourceCatalog([
    source("one", "https://example.com/list.txt#one"),
    source("two", "https://example.com/list.txt#two")
  ]), /duplicate source identity/);
});
