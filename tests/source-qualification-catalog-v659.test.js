import assert from "node:assert/strict";
import test from "node:test";
import { MAX_QUALIFICATION_CATALOG_SOURCES, snapshotQualificationSourceCatalog } from "../tools/source-qualification-summary.mjs";

function source(id = "example") {
  return {
    id,
    title: "Example",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    enabled: true,
    builtIn: true
  };
}

test("qualification catalog snapshots normalized dense source data", () => {
  const input = [source()];
  const snapshot = snapshotQualificationSourceCatalog(input);
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].sourceUrl, "https://example.com/list.txt");
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot[0]), true);
  assert.notEqual(snapshot[0], input[0]);
});

test("qualification catalog rejects holes, extra fields, custom prototypes, and oversize", () => {
  const sparse = new Array(1);
  assert.throws(() => snapshotQualificationSourceCatalog(sparse), /holes|length/);
  const extra = [source()];
  extra.extra = true;
  assert.throws(() => snapshotQualificationSourceCatalog(extra), /length/);
  const custom = [source()];
  Object.setPrototypeOf(custom, {});
  assert.throws(() => snapshotQualificationSourceCatalog(custom), /standard dense array/);
  assert.throws(() => snapshotQualificationSourceCatalog(new Array(MAX_QUALIFICATION_CATALOG_SOURCES + 1)), /length/);
});

test("qualification catalog rejects accessor entries without invoking them", () => {
  let touched = false;
  const catalog = [];
  Object.defineProperty(catalog, "0", {
    enumerable: true,
    configurable: true,
    get() { touched = true; return source(); }
  });
  catalog.length = 1;
  assert.throws(() => snapshotQualificationSourceCatalog(catalog), /holes or accessors/);
  assert.equal(touched, false);
});
