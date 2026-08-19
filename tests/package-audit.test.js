import test from "node:test";
import assert from "node:assert/strict";
import { auditPackageMetadata, FORBIDDEN_DEPENDENCY_FIELDS, FORBIDDEN_LIFECYCLE_SCRIPTS } from "../tools/package-audit.mjs";

function validPackage() {
  return {
    name: "drop-ads",
    version: "0.1.0",
    private: true,
    type: "module",
    engines: { node: ">=22.0.0", npm: ">=10.0.0" },
    scripts: { check: "echo ok" }
  };
}

function validLock() {
  return {
    name: "drop-ads",
    version: "0.1.0",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": { name: "drop-ads", version: "0.1.0", engines: { node: ">=22.0.0", npm: ">=10.0.0" } }
    }
  };
}

test("current dependency-free package metadata passes", () => {
  assert.deepEqual(auditPackageMetadata(validPackage(), validLock()), { name: "drop-ads", version: "0.1.0", packages: 1 });
});

test("every dependency/workspace field is an explicit audit failure", () => {
  for (const field of FORBIDDEN_DEPENDENCY_FIELDS) {
    const pkg = validPackage();
    pkg[field] = field === "workspaces" ? ["packages/*"] : {};
    assert.throws(() => auditPackageMetadata(pkg, validLock()), new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("automatic npm lifecycle hooks are forbidden", () => {
  for (const name of FORBIDDEN_LIFECYCLE_SCRIPTS) {
    const pkg = validPackage();
    pkg.scripts[name] = "node surprise.js";
    assert.throws(() => auditPackageMetadata(pkg, validLock()), new RegExp(name));
  }
});

test("lockfile may contain only the root package", () => {
  const lock = validLock();
  lock.packages["node_modules/example"] = { version: "1.0.0" };
  assert.throws(() => auditPackageMetadata(validPackage(), lock), /non-root package entries/);
});

test("package and lock identity/engines must stay aligned", () => {
  const nameDrift = validLock();
  nameDrift.name = "other";
  assert.throws(() => auditPackageMetadata(validPackage(), nameDrift), /package identity differ/);

  const versionDrift = validLock();
  versionDrift.packages[""].version = "0.2.0";
  assert.throws(() => auditPackageMetadata(validPackage(), versionDrift), /root identity differs/);

  const engineDrift = validLock();
  engineDrift.packages[""].engines = { node: ">=20.0.0", npm: ">=10.0.0" };
  assert.throws(() => auditPackageMetadata(validPackage(), engineDrift), /engines differ/);
});
