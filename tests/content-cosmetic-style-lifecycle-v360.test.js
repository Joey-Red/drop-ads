import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/cosmetic.js", import.meta.url), "utf8");
const sandbox = {
  browser: {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage() { return new Promise(() => {}); }
    }
  },
  DropAdsContentMessageContract: {
    accepts() { return false; },
    snapshotCosmeticPolicyResponse() { return null; }
  },
  console,
  queueMicrotask
};
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "cosmetic.js" });
const lifecycle = sandbox.DropAdsCosmeticLifecycle;

const disconnectTrap = {};
Object.defineProperty(disconnectTrap, "disconnect", { get() { throw new Error("disconnect trap"); } });
assert.doesNotThrow(() => lifecycle.bestEffortDisconnect(disconnectTrap));
assert.doesNotThrow(() => lifecycle.bestEffortDisconnect({ disconnect() { throw new Error("disconnect call"); } }));

let removedByParent = 0;
const styleNode = {
  textContent: "body{display:none}",
  remove() { throw new Error("remove failed"); },
  parentNode: { removeChild(node) { assert.equal(node, styleNode); removedByParent += 1; } }
};
assert.doesNotThrow(() => lifecycle.bestEffortRemoveStyleNode(styleNode));
assert.equal(styleNode.textContent, "");
assert.equal(removedByParent, 1);

const connectedTrap = {};
Object.defineProperty(connectedTrap, "isConnected", { get() { throw new Error("connected trap"); } });
assert.equal(lifecycle.styleConnected(connectedTrap), false);

const appendNode = { isConnected: false };
const parent = { append(node) { assert.equal(node, appendNode); node.isConnected = true; } };
assert.equal(lifecycle.appendStyleNode(appendNode, { documentElement: parent }), true);

const documentTrap = {};
Object.defineProperty(documentTrap, "documentElement", { get() { throw new Error("document trap"); } });
assert.equal(lifecycle.appendStyleNode({ isConnected: false }, documentTrap), false);

const appendTrapParent = {};
Object.defineProperty(appendTrapParent, "append", { get() { throw new Error("append trap"); } });
assert.equal(lifecycle.appendStyleNode({ isConnected: false }, { documentElement: appendTrapParent }), false);
assert.equal(lifecycle.appendStyleNode({ isConnected: false }, { documentElement: { append() { throw new Error("append call"); } } }), false);

console.log("content cosmetic style lifecycle repository coverage present");
