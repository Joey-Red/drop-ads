import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { auditShippedCode, findForbiddenExecutablePatterns, maskCommentsAndStrings } from "../tools/code-safety-audit.mjs";

const forbidden = [
  ["eval", "eval(userCode)", "eval"],
  ["new Function", "const fn = new Function('x', 'return x')", "Function constructor"],
  ["importScripts", "importScripts('https://example.com/code.js')", "importScripts"],
  ["setTimeout string", "setTimeout('doBadThing()', 1)", "string timer"],
  ["setInterval template", "setInterval(`doBadThing()`, 1)", "string timer"],
  ["WASM compile", "WebAssembly.compile(bytes)", "WebAssembly runtime compilation"],
  ["WASM instantiate", "WebAssembly.instantiate(bytes)", "WebAssembly runtime compilation"]
];

for (const [name, source, kind] of forbidden) {
  test(`detects forbidden ${name}`, () => {
    assert.equal(findForbiddenExecutablePatterns(source).some((item) => item.kind === kind), true);
  });
}

test("ordinary comments and quoted documentation do not trigger executable findings", () => {
  const source = [
    "// eval(userCode)",
    "/* new Function('x') */",
    "const note = \"importScripts('remote.js')\";",
    "const words = 'WebAssembly.compile(bytes)';",
    "const safe = () => setTimeout(callback, 1);"
  ].join("\n");
  assert.deepEqual(findForbiddenExecutablePatterns(source), []);
  const masked = maskCommentsAndStrings(source);
  assert.equal(masked.includes("eval(userCode)"), false);
  assert.equal(masked.includes("importScripts"), false);
});

test("function callbacks remain valid timer usage", () => {
  assert.deepEqual(findForbiddenExecutablePatterns("setTimeout(() => run(), 10); setInterval(tick, 1000);"), []);
});

test("current shipped source passes the code-safety audit", async () => {
  const root = resolve(import.meta.dirname, "..");
  const result = await auditShippedCode(root);
  assert.ok(result.files > 0);
});
