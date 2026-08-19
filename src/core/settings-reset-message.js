export const SETTINGS_RESET_MESSAGE_TYPE = "drop-ads:reset-settings";

export function validateSettingsResetMessage(message) {
  let isArray;
  let prototype;
  let keys;
  let descriptor;
  try {
    isArray = Array.isArray(message);
    prototype = message && typeof message === "object" ? Object.getPrototypeOf(message) : null;
    keys = message && typeof message === "object" ? Reflect.ownKeys(message) : [];
    descriptor = message && typeof message === "object" ? Object.getOwnPropertyDescriptor(message, "type") : null;
  } catch {
    throw new TypeError("Settings reset message is not safely inspectable");
  }
  if (!message || typeof message !== "object" || isArray || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError("Settings reset message must be a plain object");
  }
  if (keys.length !== 1 || keys[0] !== "type") throw new TypeError("Settings reset message must contain only type");
  if (!descriptor?.enumerable || !("value" in descriptor) || descriptor.value !== SETTINGS_RESET_MESSAGE_TYPE) {
    throw new TypeError("Settings reset message type is invalid");
  }
  return Object.freeze({ type: SETTINGS_RESET_MESSAGE_TYPE });
}
