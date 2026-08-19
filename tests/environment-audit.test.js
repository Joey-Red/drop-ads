import test from "node:test";
import assert from "node:assert/strict";
import {
  MIN_NODE_VERSION,
  MIN_NPM_VERSION,
  auditEnvironment,
  npmVersionFromUserAgent,
  parseVersion,
  versionAtLeast
} from "../tools/environment-audit.mjs";

test("exact minimum supported toolchain passes", () => {
  assert.deepEqual(auditEnvironment({ nodeVersion: "22.0.0", npmUserAgent: "npm/10.0.0 node/v22.0.0 win32 x64" }), {
    node: "22.0.0",
    npm: "10.0.0"
  });
  assert.deepEqual(MIN_NODE_VERSION, [22, 0, 0]);
  assert.deepEqual(MIN_NPM_VERSION, [10, 0, 0]);
});

test("newer Node and npm majors remain supported", () => {
  assert.deepEqual(auditEnvironment({ nodeVersion: "24.12.0", npmUserAgent: "npm/11.6.2 node/v24.12.0 linux x64" }), {
    node: "24.12.0",
    npm: "11.6.2"
  });
});

test("below-minimum Node and npm fail with clear requirements", () => {
  assert.throws(() => auditEnvironment({ nodeVersion: "21.9.0", npmUserAgent: "npm/10.9.0 node/v21.9.0" }), /requires Node >=22\.0\.0/);
  assert.throws(() => auditEnvironment({ nodeVersion: "22.0.0", npmUserAgent: "npm/9.9.9 node/v22.0.0" }), /requires npm >=10\.0\.0/);
});

test("version parsing is strict and deterministic", () => {
  assert.deepEqual(parseVersion("v22.1.3"), [22, 1, 3]);
  assert.deepEqual(parseVersion("22.1.3-rc.1"), [22, 1, 3]);
  assert.throws(() => parseVersion("22"), /not a supported semantic version/);
  assert.throws(() => parseVersion("latest"), /not a supported semantic version/);
  assert.equal(versionAtLeast([22, 0, 0], [22, 0, 0]), true);
  assert.equal(versionAtLeast([21, 99, 99], [22, 0, 0]), false);
});

test("npm version is read only from npm user-agent metadata", () => {
  assert.equal(npmVersionFromUserAgent("npm/10.8.2 node/v22.5.1 win32 x64"), "10.8.2");
  assert.throws(() => npmVersionFromUserAgent("node/v22.5.1"), /npm version is unavailable/);
});
