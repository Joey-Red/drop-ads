import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/cosmetic.js", import.meta.url), "utf8");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function loadLifecycle() {
  const requests = [];
  const nodes = [];
  const documentRef = {
    documentElement: {
      append(node) { node.isConnected = true; }
    },
    createElement() {
      const node = {
        isConnected: false,
        textContent: "",
        setAttribute() {},
        remove() { this.isConnected = false; }
      };
      nodes.push(node);
      return node;
    }
  };
  const sandbox = {
    browser: {
      runtime: {
        sendMessage() {
          const request = deferred();
          requests.push(request);
          return request.promise;
        },
        onMessage: { addListener() {} }
      }
    },
    DropAdsContentMessageContract: {
      accepts() { return false; },
      snapshotCosmeticPolicyResponse(value) { return value; }
    },
    document: documentRef,
    MutationObserver: class { observe() {} disconnect() {} },
    queueMicrotask(callback) { callback(); },
    console
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: "cosmetic.js" });
  return { lifecycle: sandbox.DropAdsCosmeticLifecycle, requests, nodes };
}

const staleFailure = loadLifecycle();
assert.equal(staleFailure.requests.length, 1);
const latest = staleFailure.lifecycle.refresh();
assert.equal(staleFailure.requests.length, 2);
staleFailure.requests[1].resolve({ ok: true, policy: { enabled: true, stylesheet: ".new { display: none !important; }\n" } });
await latest;
assert.equal(staleFailure.nodes.length, 1);
assert.equal(staleFailure.nodes[0].textContent, ".new { display: none !important; }\n");
staleFailure.requests[0].reject(new Error("old background failure"));
await Promise.resolve();
await Promise.resolve();
assert.equal(staleFailure.nodes[0].textContent, ".new { display: none !important; }\n");
assert.equal(staleFailure.nodes[0].isConnected, true);

const staleSuccess = loadLifecycle();
assert.equal(staleSuccess.requests.length, 1);
const latestDisabled = staleSuccess.lifecycle.refresh();
staleSuccess.requests[1].resolve({ ok: true, policy: { enabled: false, stylesheet: "" } });
await latestDisabled;
assert.equal(staleSuccess.nodes.length, 0);
staleSuccess.requests[0].resolve({ ok: true, policy: { enabled: true, stylesheet: ".old { display: none !important; }\n" } });
await Promise.resolve();
await Promise.resolve();
assert.equal(staleSuccess.nodes.length, 0);

console.log("content cosmetic refresh generation repository coverage present");
