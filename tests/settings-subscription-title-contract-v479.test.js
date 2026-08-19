import test from "node:test";
import assert from "node:assert/strict";
import { unwrapOptionsSubscriptionResponse } from "../src/core/options-boundary.js";
import { isSubscriptionTitleTextSafe } from "../src/core/subscriptions.js";

function response(title) {
  return { ok: true, subscription: { id: "custom-feed", title } };
}

test("M479 shared subscription title predicate preserves normal Unicode titles", () => {
  const title = "Publicités — München";
  assert.equal(isSubscriptionTitleTextSafe(title), true);
  assert.equal(unwrapOptionsSubscriptionResponse(response(title), "failed").title, title);
});

test("M479 Settings rejects subscription-result control and line-separator titles", () => {
  for (const title of ["bad\u0000title", "bad\u001ftitle", "bad\u007ftitle", "bad\u2028title", "bad\u2029title"]) {
    assert.equal(isSubscriptionTitleTextSafe(title), false);
    assert.throws(() => unwrapOptionsSubscriptionResponse(response(title), "failed"), /subscription\.title is invalid/);
  }
});
