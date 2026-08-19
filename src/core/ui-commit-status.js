export const GLOBAL_BLOCKING_ON_STATUS = "Global blocking is on.";
export const GLOBAL_BLOCKING_OFF_STATUS = "Global blocking is off. Your saved local rules and exceptions remain stored.";

export function subscriptionCommitStatus(checked, busy = false) {
  if (typeof checked !== "boolean" || typeof busy !== "boolean") throw new TypeError("Subscription UI state must use booleans");
  if (busy) return "Configured state: applying change…";
  return checked ? "Configured: enabled" : "Configured: disabled";
}

export function globalBlockingCommitStatus(enabled) {
  if (typeof enabled !== "boolean") throw new TypeError("Global blocking UI state must be boolean");
  return enabled ? GLOBAL_BLOCKING_ON_STATUS : GLOBAL_BLOCKING_OFF_STATUS;
}
