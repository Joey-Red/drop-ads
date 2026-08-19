import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const LIVE_STATE_LIMITS = Object.freeze({
  personalRules: 10_000,
  cosmeticRules: 5_000,
  domains: 5_000,
  subscriptions: 128
});

export const PERSISTED_STATE_KEYS = Object.freeze([
  "enabled",
  "autoSubmitCommunity",
  "updateIntervalHours",
  "cookieMode",
  "cookieBannerMode",
  "cookieBannerDisabledSites",
  "cookieAllowSites",
  "personalBlock",
  "personalAllow",
  "personalCosmeticHide",
  "personalCosmeticAllow",
  "disabledSites",
  "subscriptions"
]);

const PERSISTED_STATE_KEY_SET = new Set(PERSISTED_STATE_KEYS);
const COLLECTION_LIMITS = new Map([
  ["personalBlock", LIVE_STATE_LIMITS.personalRules],
  ["personalAllow", LIVE_STATE_LIMITS.personalRules],
  ["personalCosmeticHide", LIVE_STATE_LIMITS.cosmeticRules],
  ["personalCosmeticAllow", LIVE_STATE_LIMITS.cosmeticRules],
  ["disabledSites", LIVE_STATE_LIMITS.domains],
  ["cookieAllowSites", LIVE_STATE_LIMITS.domains],
  ["cookieBannerDisabledSites", LIVE_STATE_LIMITS.domains],
  ["subscriptions", LIVE_STATE_LIMITS.subscriptions]
]);

export function snapshotPersistedState(state) {
  assertPlainExactObject(state, "Persisted state", PERSISTED_STATE_KEY_SET);
  const snapshot = Object.create(null);
  for (const key of PERSISTED_STATE_KEYS) {
    const field = readPlainDataField(state, key);
    if (!field.safe) throw new Error(`Persisted state.${key} must remain an own enumerable data field when present`);
    if (!field.present) continue;
    const limit = COLLECTION_LIMITS.get(key);
    snapshot[key] = limit != null && field.value != null
      ? snapshotDenseDataArray(field.value, key, limit)
      : field.value;
  }
  return snapshot;
}

export function assertPersistedStateBounds(state) {
  snapshotPersistedState(state);
  return state;
}
