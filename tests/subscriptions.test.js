import test from "node:test";
import assert from "node:assert/strict";
import {
  ANUDEEP_ADSERVERS_SUBSCRIPTION,
  BLOCKLIST_PROJECT_ADS_SUBSCRIPTION,
  BUILT_IN_SUBSCRIPTIONS,
  DEFAULT_COMMUNITY_SUBSCRIPTION,
  HAGEZI_PRO_MINI_SUBSCRIPTION,
  STEVENBLACK_HOSTS_SUBSCRIPTION,
  mergeCachedRules,
  normalizeSubscription,
  normalizeSubscriptions,
  pruneListCache,
  subscriptionSourceKey
} from "../src/core/subscriptions.js";

test("subscriptions require HTTPS, a recognized format, and credential-free source URLs", () => {
  assert.throws(() => normalizeSubscription({ id: "x", title: "X", format: "hosts", sourceUrl: "http://example.com/hosts" }), /HTTPS/);
  assert.throws(() => normalizeSubscription({ id: "x", title: "X", format: "javascript", sourceUrl: "https://example.com/x" }), /format/);
  assert.throws(() => normalizeSubscription({ id: "x", title: "X", format: "hosts", sourceUrl: "https://user:secret@example.com/hosts" }), /credentials/);
  assert.throws(() => normalizeSubscription({ id: "x", title: "X", format: "hosts", sourceUrl: "https://token@example.com/hosts" }), /credentials/);
});

test("subscription source keys canonicalize fragments but preserve format", () => {
  const base = { id: "external-a", title: "A", format: "hosts", sourceUrl: "https://example.com/list.txt#ignored" };
  assert.equal(subscriptionSourceKey(base), "hosts\u0000https://example.com/list.txt");
  assert.notEqual(
    subscriptionSourceKey(base),
    subscriptionSourceKey({ ...base, id: "external-b", format: "third-party" })
  );
});

test("query-bearing subscription URLs remain available for legitimate private feeds", () => {
  const normalized = normalizeSubscription({
    id: "external-query",
    title: "Query source",
    format: "hosts",
    sourceUrl: "https://lists.example.com/hosts.txt?channel=stable&key=opaque#ignored"
  });
  assert.equal(normalized.sourceUrl, "https://lists.example.com/hosts.txt?channel=stable&key=opaque");
});

test("all built-in subscriptions are restored for fresh or older persisted state", () => {
  const normalized = normalizeSubscriptions([]);
  assert.equal(BUILT_IN_SUBSCRIPTIONS.every((builtIn) => normalized.some((item) => item.id === builtIn.id)), true);
  assert.equal(normalized.some((item) => item.id === DEFAULT_COMMUNITY_SUBSCRIPTION.id), true);
  assert.equal(normalized.some((item) => item.id === HAGEZI_PRO_MINI_SUBSCRIPTION.id), true);
});

test("additional curated built-ins are available but disabled by default", () => {
  const normalized = normalizeSubscriptions([]);
  for (const builtIn of [
    STEVENBLACK_HOSTS_SUBSCRIPTION,
    BLOCKLIST_PROJECT_ADS_SUBSCRIPTION,
    ANUDEEP_ADSERVERS_SUBSCRIPTION
  ]) {
    const restored = normalized.find((item) => item.id === builtIn.id);
    assert.ok(restored, `${builtIn.id} should be present`);
    assert.equal(restored.enabled, false, `${builtIn.id} should be opt-in by default`);
    assert.equal(restored.builtIn, true);
    assert.equal(restored.sourceUrl, builtIn.sourceUrl);
  }
});

test("built-in source metadata cannot be replaced through persisted state but disabled preference survives", () => {
  const normalized = normalizeSubscriptions([
    { ...DEFAULT_COMMUNITY_SUBSCRIPTION },
    {
      id: HAGEZI_PRO_MINI_SUBSCRIPTION.id,
      title: "Tampered",
      format: "hosts",
      sourceUrl: "https://example.com/not-the-built-in.txt",
      enabled: false,
      builtIn: true
    },
    {
      id: STEVENBLACK_HOSTS_SUBSCRIPTION.id,
      title: "Tampered optional source",
      format: "third-party",
      sourceUrl: "https://example.com/replace-hosts.txt",
      enabled: true,
      builtIn: true
    }
  ]);

  const community = normalized.find((item) => item.id === DEFAULT_COMMUNITY_SUBSCRIPTION.id);
  const hagezi = normalized.find((item) => item.id === HAGEZI_PRO_MINI_SUBSCRIPTION.id);
  const stevenBlack = normalized.find((item) => item.id === STEVENBLACK_HOSTS_SUBSCRIPTION.id);

  assert.equal(community.sourceUrl, DEFAULT_COMMUNITY_SUBSCRIPTION.sourceUrl);
  assert.equal(hagezi.sourceUrl, HAGEZI_PRO_MINI_SUBSCRIPTION.sourceUrl);
  assert.equal(hagezi.title, HAGEZI_PRO_MINI_SUBSCRIPTION.title);
  assert.equal(hagezi.enabled, false);
  assert.equal(stevenBlack.sourceUrl, STEVENBLACK_HOSTS_SUBSCRIPTION.sourceUrl);
  assert.equal(stevenBlack.format, STEVENBLACK_HOSTS_SUBSCRIPTION.format);
  assert.equal(stevenBlack.title, STEVENBLACK_HOSTS_SUBSCRIPTION.title);
  assert.equal(stevenBlack.enabled, true);
});

test("duplicate external sources are collapsed without re-enabling an existing disabled subscription", () => {
  const normalized = normalizeSubscriptions([
    {
      id: "external-first",
      title: "First",
      format: "hosts",
      sourceUrl: "https://lists.example.com/ads.txt#one",
      enabled: false
    },
    {
      id: "external-second",
      title: "Second",
      format: "hosts",
      sourceUrl: "https://lists.example.com/ads.txt#two",
      enabled: true
    }
  ]);

  const external = normalized.filter((item) => !item.builtIn);
  assert.equal(external.length, 1);
  assert.equal(external[0].id, "external-first");
  assert.equal(external[0].enabled, false);
  assert.equal(external[0].sourceUrl, "https://lists.example.com/ads.txt");
});

test("external aliases cannot duplicate a built-in source but a distinct format remains distinct", () => {
  const normalized = normalizeSubscriptions([
    {
      id: "external-built-in-alias",
      title: "Alias",
      format: HAGEZI_PRO_MINI_SUBSCRIPTION.format,
      sourceUrl: `${HAGEZI_PRO_MINI_SUBSCRIPTION.sourceUrl}#duplicate`,
      enabled: true
    },
    {
      id: "external-distinct-format",
      title: "Distinct format",
      format: "hosts",
      sourceUrl: HAGEZI_PRO_MINI_SUBSCRIPTION.sourceUrl,
      enabled: true
    }
  ]);

  assert.equal(normalized.some((item) => item.id === "external-built-in-alias"), false);
  assert.equal(normalized.some((item) => item.id === "external-distinct-format"), true);
});

test("cache pruning removes orphaned sources but keeps disabled configured sources", () => {
  const subscriptions = normalizeSubscriptions([
    {
      id: "external-disabled",
      title: "Disabled",
      format: "hosts",
      sourceUrl: "https://example.com/disabled.txt",
      enabled: false
    }
  ]);
  const pruned = pruneListCache(subscriptions, {
    [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: { block: [], allow: [] },
    [HAGEZI_PRO_MINI_SUBSCRIPTION.id]: { block: [], allow: [] },
    [STEVENBLACK_HOSTS_SUBSCRIPTION.id]: { block: [{ kind: "domain", value: "optional-kept.example" }], allow: [] },
    "external-disabled": { block: [{ kind: "domain", value: "kept.example" }], allow: [] },
    "external-removed": { block: [{ kind: "domain", value: "removed.example" }], allow: [] }
  });

  assert.equal(Object.hasOwn(pruned, "external-removed"), false);
  assert.equal(Object.hasOwn(pruned, "external-disabled"), true);
  assert.equal(Object.hasOwn(pruned, DEFAULT_COMMUNITY_SUBSCRIPTION.id), true);
  assert.equal(Object.hasOwn(pruned, HAGEZI_PRO_MINI_SUBSCRIPTION.id), true);
  assert.equal(Object.hasOwn(pruned, STEVENBLACK_HOSTS_SUBSCRIPTION.id), true);
});

test("cached rules merge only from enabled sources and skip corrupt cache data", () => {
  const subscriptions = normalizeSubscriptions([
    { ...DEFAULT_COMMUNITY_SUBSCRIPTION },
    { ...HAGEZI_PRO_MINI_SUBSCRIPTION, enabled: false },
    { id: "external-test", title: "External", format: "hosts", sourceUrl: "https://example.com/hosts", enabled: false }
  ]);
  const merged = mergeCachedRules(subscriptions, {
    [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: {
      block: [{ kind: "domain", value: "ads.example.com" }, { nope: true }],
      allow: []
    },
    [HAGEZI_PRO_MINI_SUBSCRIPTION.id]: { block: [{ kind: "domain", value: "hagezi.example.com" }], allow: [] },
    [STEVENBLACK_HOSTS_SUBSCRIPTION.id]: { block: [{ kind: "domain", value: "optional-disabled.example.com" }], allow: [] },
    "external-test": { block: [{ kind: "domain", value: "disabled.example.com" }], allow: [] }
  });
  assert.deepEqual(merged.block, [{ kind: "domain", value: "ads.example.com" }]);
});

test("legacy shared cache is revalidated so private/local rules cannot survive an upgrade", () => {
  const subscriptions = normalizeSubscriptions([{ ...DEFAULT_COMMUNITY_SUBSCRIPTION }]);
  const merged = mergeCachedRules(subscriptions, {
    [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: {
      block: [
        { kind: "domain", value: "ads.example.com" },
        { kind: "domain", value: "192.168.1.10" },
        { kind: "url", value: "http://127.0.0.1/admin" },
        { kind: "pattern", value: "||router.local^" },
        { kind: "pattern", value: "http://[fd00::1]/ads/*" }
      ],
      allow: [{ kind: "domain", value: "needed.example.com" }]
    }
  });

  assert.deepEqual(merged.block, [{ kind: "domain", value: "ads.example.com" }]);
  assert.deepEqual(merged.allow, [{ kind: "domain", value: "needed.example.com" }]);
});
