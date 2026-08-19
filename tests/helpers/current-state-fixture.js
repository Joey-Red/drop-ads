export function currentStateFixture(overrides = {}) {
  return {
    enabled: true,
    autoSubmitCommunity: false,
    updateIntervalHours: 12,
    cookieMode: "third-party",
    cookieBannerMode: "reject",
    cookieBannerDisabledSites: [],
    cookieAllowSites: [],
    personalBlock: [],
    personalAllow: [],
    personalCosmeticHide: [],
    personalCosmeticAllow: [],
    disabledSites: [],
    subscriptions: [],
    ...overrides
  };
}
