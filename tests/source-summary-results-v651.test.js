import assert from "node:assert/strict";
import test from "node:test";
import { snapshotSourceQualificationResults } from "../tools/source-qualification-summary.mjs";

const SOURCE_KEY = "hosts\u0000https://example.com/list.txt";

function subscription() {
  return {
    id: "test-source",
    title: "Test Source",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    enabled: true,
    builtIn: false
  };
}

function parsed() {
  return { block: [], allow: [], cosmeticHide: [], cosmeticAllow: [], sourceKey: SOURCE_KEY };
}

function result() {
  return { subscription: subscription(), parsed: parsed(), declaredBytes: null };
}

test("snapshots a standard dense result array", () => {
  const snapshot = snapshotSourceQualificationResults([result()]);
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].subscription.id, "test-source");
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot[0]), true);
});

test("rejects holes, extra fields, and custom array prototypes", () => {
  const sparse = new Array(1);
  assert.throws(() => snapshotSourceQualificationResults(sparse), /holes|length/);
  const extra = [result()];
  extra.extra = true;
  assert.throws(() => snapshotSourceQualificationResults(extra), /length/);
  const custom = [result()];
  Object.setPrototypeOf(custom, {});
  assert.throws(() => snapshotSourceQualificationResults(custom), /standard dense array/);
});

test("rejects accessor-backed result fields without invoking getters", () => {
  let touched = false;
  const entry = { parsed: parsed(), declaredBytes: null };
  Object.defineProperty(entry, "subscription", {
    enumerable: true,
    get() { touched = true; return subscription(); }
  });
  assert.throws(() => snapshotSourceQualificationResults([entry]), /data field/);
  assert.equal(touched, false);
});

test("rejects extra result fields and custom prototypes", () => {
  assert.throws(() => snapshotSourceQualificationResults([{ ...result(), extra: true }]), /fields are invalid/);
  const entry = Object.create({});
  Object.assign(entry, result());
  assert.throws(() => snapshotSourceQualificationResults([entry]), /plain object/);
});
