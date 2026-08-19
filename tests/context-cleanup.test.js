import test from "node:test";
import assert from "node:assert/strict";

await import("../src/content/context-cleanup.js");
const helpers = globalThis.DropAdsContextCleanup;

test("context cleanup URL comparison is exact, HTTP(S)-only, and hash-insensitive", () => {
  assert.equal(helpers.normalizeComparableUrl("/ad.png#slot", "https://example.test/page"), "https://example.test/ad.png");
  assert.equal(helpers.normalizeComparableUrl("javascript:alert(1)", "https://example.test/"), null);
  assert.equal(helpers.cleanupKindForTag("IMG"), "image");
  assert.equal(helpers.cleanupKindForTag("iframe"), "frame");
  assert.equal(helpers.cleanupKindForTag("a"), "link");
});

test("cleanup replaces a visible explicit resource with a neutral noninteractive placeholder", () => {
  let replacement = null;
  const placeholder = {
    style: {},
    setAttribute(name, value) { this[name] = value; },
    tabIndex: 0
  };
  const documentRef = {
    activeElement: null,
    createElement(tag) { assert.equal(tag, "span"); return placeholder; }
  };
  const element = {
    nodeType: 1,
    localName: "img",
    isConnected: true,
    ownerDocument: documentRef,
    contains() { return false; },
    getBoundingClientRect() { return { width: 320.2, height: 100.1 }; },
    replaceWith(value) { replacement = value; }
  };

  const result = helpers.cleanupElement(element);
  assert.deepEqual(result, { cleaned: true, kind: "image", placeholder: true });
  assert.equal(replacement, placeholder);
  assert.equal(placeholder["aria-hidden"], "true");
  assert.equal(placeholder.role, "presentation");
  assert.equal(placeholder.tabIndex, -1);
  assert.equal(placeholder.style.width, "321px");
  assert.equal(placeholder.style.height, "101px");
});

test("detached targets fail closed instead of removing a different element", () => {
  assert.deepEqual(helpers.cleanupElement({ nodeType: 1, isConnected: false }), { cleaned: false, reason: "target-missing" });
});

test("remembered target remains eligible only while its live resource URL is unchanged", () => {
  const element = {
    nodeType: 1,
    localName: "img",
    isConnected: true,
    currentSrc: "https://cdn.example/ad-a.png",
    src: "https://cdn.example/ad-a.png"
  };
  const remembered = {
    element,
    url: "https://cdn.example/ad-a.png",
    capturedAt: 1_000
  };
  assert.deepEqual(
    helpers.rememberedTargetStatus(remembered, "https://cdn.example/ad-a.png#ignored", 1_100),
    { matches: true, reason: null }
  );

  element.currentSrc = "https://cdn.example/article-image.png";
  assert.deepEqual(
    helpers.rememberedTargetStatus(remembered, "https://cdn.example/ad-a.png", 1_200),
    { matches: false, reason: "context-target-changed" }
  );
});

test("frame/link target mutations and expiry fail closed", () => {
  const frame = { nodeType: 1, localName: "iframe", isConnected: true, src: "https://ads.example/frame" };
  const remembered = { element: frame, url: "https://ads.example/frame", capturedAt: 5_000 };
  frame.src = "https://example.test/checkout";
  assert.equal(helpers.rememberedTargetStatus(remembered, "https://ads.example/frame", 5_100).reason, "context-target-changed");

  frame.src = "https://ads.example/frame";
  assert.equal(
    helpers.rememberedTargetStatus(remembered, "https://ads.example/frame", 5_000 + helpers.TARGET_TTL_MS + 1).reason,
    "context-target-expired"
  );
});
