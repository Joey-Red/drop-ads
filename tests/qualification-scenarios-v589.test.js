import test from "node:test";
import assert from "node:assert/strict";
import {
  QUALIFICATION_SCENARIOS,
  createQualificationScenarioBrowserResult,
  createQualificationScenarioResultV3,
  createUnobservedScenarioMatrix,
  createUnobservedScenarioMatrixV3
} from "../tools/qualification-scenarios.mjs";

test("v3 browser results start independently unobserved", () => {
  const result = createQualificationScenarioResultV3();
  assert.deepEqual(result, {
    chromium: { status: "UNOBSERVED", notes: "" },
    firefox: { status: "UNOBSERVED", notes: "" }
  });
  assert.notEqual(result.chromium, result.firefox);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.chromium));
  assert.ok(Object.isFrozen(result.firefox));
});

test("v3 scenario matrix contains one isolated result pair per canonical scenario", () => {
  const matrix = createUnobservedScenarioMatrixV3();
  assert.deepEqual(Object.keys(matrix), [...QUALIFICATION_SCENARIOS]);
  for (const id of QUALIFICATION_SCENARIOS) {
    assert.equal(matrix[id].chromium.status, "UNOBSERVED");
    assert.equal(matrix[id].firefox.status, "UNOBSERVED");
    assert.equal(matrix[id].chromium.notes, "");
    assert.equal(matrix[id].firefox.notes, "");
  }
  assert.notEqual(matrix[QUALIFICATION_SCENARIOS[0]], matrix[QUALIFICATION_SCENARIOS[1]]);
});

test("legacy v2 constructor remains unchanged during schema transition", () => {
  const matrix = createUnobservedScenarioMatrix();
  assert.deepEqual(matrix[QUALIFICATION_SCENARIOS[0]], {
    chromium: "UNOBSERVED",
    firefox: "UNOBSERVED",
    notes: ""
  });
});

test("browser result constructor returns a fresh immutable slot", () => {
  const left = createQualificationScenarioBrowserResult();
  const right = createQualificationScenarioBrowserResult();
  assert.deepEqual(left, { status: "UNOBSERVED", notes: "" });
  assert.notEqual(left, right);
  assert.ok(Object.isFrozen(left));
});
