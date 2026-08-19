import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { bootstrapBackground } from "../src/core/background-bootstrap.js";

const source = fs.readFileSync(new URL("../src/core/background-bootstrap.js", import.meta.url), "utf8");

test("M419 mandatory recovery install failure rolls back the already-started core", () => {
  let disposed = 0;
  const originalFailure = new Error("mandatory failed");
  assert.throws(() => bootstrapBackground({
    startCore() {
      return { dispose() { disposed += 1; } };
    },
    installMandatoryRecovery() {
      throw originalFailure;
    }
  }), (error) => error === originalFailure);
  assert.equal(disposed, 1);
});

test("M419 failed-startup core cleanup cannot replace the mandatory failure", () => {
  const originalFailure = new Error("mandatory failed");
  assert.throws(() => bootstrapBackground({
    logger: { warn() {} },
    startCore() {
      return { dispose() { throw new Error("cleanup failed"); } };
    },
    installMandatoryRecovery() {
      throw originalFailure;
    }
  }), (error) => error === originalFailure);
});

test("M419 rejected async failed-startup cleanup is contained best effort", async () => {
  const originalFailure = new Error("mandatory failed");
  assert.throws(() => bootstrapBackground({
    logger: { warn() {} },
    startCore() {
      return { dispose() { return Promise.reject(new Error("async cleanup failed")); } };
    },
    installMandatoryRecovery() {
      throw originalFailure;
    }
  }), (error) => error === originalFailure);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(source, /Promise\.resolve\(result\)\.catch/);
});
