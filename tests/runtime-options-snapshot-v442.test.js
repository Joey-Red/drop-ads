import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { createRuntimeApiShell } from "./helpers/runtime-api-shell.js";

function minimalApi() {
  return createRuntimeApiShell();
}

test("M442 constructor does not invoke normal option getters or Proxy get traps", () => {
  let accessorReads = 0;
  const accessorOptions = { api: minimalApi() };
  Object.defineProperty(accessorOptions, "now", {
    enumerable: true,
    get() { accessorReads += 1; return Date.now; }
  });
  assert.throws(() => createBackgroundRuntime(accessorOptions));
  assert.equal(accessorReads, 0);

  let normalGets = 0;
  const proxyOptions = new Proxy({ api: minimalApi() }, {
    get(target, property, receiver) {
      normalGets += 1;
      return Reflect.get(target, property, receiver);
    }
  });
  const controller = createBackgroundRuntime(proxyOptions);
  assert.equal(typeof controller.start, "function");
  assert.equal(normalGets, 0);
});

test("M442 runtime constructor consumes a detached option snapshot", () => {
  const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");
  assert.match(source, /function runtimeOptionsSnapshot\(options\)/);
  assert.match(source, /const runtimeOptions = runtimeOptionsSnapshot\(options\);/);
  assert.match(source, /const api = runtimeOptions\.api;/);
  assert.match(source, /const logger = captureRuntimeLogger\(runtimeOptions\);/);
});
