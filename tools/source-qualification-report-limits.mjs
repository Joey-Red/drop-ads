import { MAX_REMOTE_SUPPORTED_RULES } from "../src/core/list-limits.js";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";

export function assertSourceRowRuleCeiling(network, cosmetic) {
  const total = network.supported + cosmetic.supported;
  if (!Number.isSafeInteger(total) || total > MAX_REMOTE_SUPPORTED_RULES) {
    throw new TypeError(`source report row exceeds ${MAX_REMOTE_SUPPORTED_RULES} supported rules`);
  }
  return total;
}

export function assertSourceDeclaredBytes(value) {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_REMOTE_LIST_BYTES) {
    throw new TypeError(`source report row declaredBytes must be null or an integer from 0 through ${MAX_REMOTE_LIST_BYTES}`);
  }
  return value;
}
