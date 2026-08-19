import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/cosmetic.js", import.meta.url), "utf8");
const observers = [];
let appendCalls = 0;

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnectCalls = 0;
    observers.push(this);
  }
  observe() {}
  disconnect() { this.disconnectCalls += 1; }
}

function makeStyleNode() {
  return {
    isConnected: false,
    textContent: "",
    setAttribute() {},
    remove() {}
  };
}

const documentRef = {
  documentElement: { append() { appendCalls += 1; } },
  createElement() { return makeStyleNode(); }
};

const sandbox = {
  browser: {
    runtime: {
      sendMessage() { return Promise.resolve({ ok: false, error: "offline" }); },
      onMessage: { addListener() {} }
    }
  },
  DropAdsContentMessageContract: {
    accepts() { return false; },
    snapshotCosmeticPolicyResponse() { return Object.freeze({ ok: false }); }
  },
  document: documentRef,
  MutationObserver: FakeMutationObserver,
  queueMicrotask() {},
  console
};
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "cosmetic.js" });
const lifecycle = sandbox.DropAdsCosmeticLifecycle;
assert.ok(lifecycle);

lifecycle.ensureStyle(".first { display: none !important; }\n");
assert.equal(observers.length, 1);
const first = observers[0];

lifecycle.removeStyle();
assert.equal(first.disconnectCalls, 1);
lifecycle.ensureStyle(".second { display: none !important; }\n");
assert.equal(observers.length, 2);
const second = observers[1];
const beforeStaleAppend = appendCalls;

assert.doesNotThrow(() => first.callback());
assert.equal(second.disconnectCalls, 0);
assert.equal(appendCalls, beforeStaleAppend);

lifecycle.stopAttachObserver(second);
assert.equal(second.disconnectCalls, 1);

console.log("content cosmetic observer identity repository coverage present");
