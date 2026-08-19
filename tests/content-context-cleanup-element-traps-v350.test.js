import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/context-cleanup.js", import.meta.url), "utf8");
const sandbox = { console, URL, setTimeout, clearTimeout };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "context-cleanup.js" });
const cleanup = sandbox.DropAdsContextCleanup;

const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
assert.doesNotThrow(() => cleanup.cleanupElement(proxy));
assert.equal(cleanup.cleanupElement(proxy).reason, "target-missing");

const trappedIdentity = { nodeType: 1, isConnected: true };
Object.defineProperty(trappedIdentity, "localName", { get() { throw new Error("tag trap"); } });
assert.equal(cleanup.cleanupElement(trappedIdentity).reason, "target-missing");

let removed = 0;
const activeTrapDocument = {};
Object.defineProperty(activeTrapDocument, "activeElement", { get() { throw new Error("active trap"); } });
const activeTrapElement = {
  nodeType: 1,
  isConnected: true,
  localName: "div",
  ownerDocument: activeTrapDocument,
  remove() { removed += 1; }
};
assert.deepEqual({ ...cleanup.cleanupElement(activeTrapElement) }, { cleaned: true, kind: "element", placeholder: false });
assert.equal(removed, 1);

removed = 0;
const focusTarget = { blur() { throw new Error("blur trap"); } };
const containsTrapElement = {
  nodeType: 1,
  isConnected: true,
  localName: "div",
  ownerDocument: { activeElement: focusTarget },
  remove() { removed += 1; }
};
Object.defineProperty(containsTrapElement, "contains", { get() { throw new Error("contains trap"); } });
assert.equal(cleanup.cleanupElement(containsTrapElement).cleaned, true);
assert.equal(removed, 1);

removed = 0;
const media = {
  nodeType: 1,
  isConnected: true,
  localName: "video",
  ownerDocument: { activeElement: null },
  remove() { removed += 1; }
};
Object.defineProperty(media, "pause", { get() { throw new Error("pause trap"); } });
const mediaResult = cleanup.cleanupElement(media);
assert.equal(mediaResult.cleaned, true);
assert.equal(mediaResult.kind, "media");
assert.equal(removed, 1);

const unremovable = {
  nodeType: 1,
  isConnected: true,
  localName: "div",
  ownerDocument: { activeElement: null }
};
Object.defineProperty(unremovable, "remove", { get() { throw new Error("remove trap"); } });
assert.deepEqual({ ...cleanup.cleanupElement(unremovable) }, { cleaned: false, reason: "target-not-removable" });

console.log("context cleanup element trap containment repository coverage present");
