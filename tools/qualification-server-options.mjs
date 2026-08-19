const OPTION_KEYS = new Set(["port", "quiet"]);

export function parseQualificationPort(value) {
  let number;
  if (typeof value === "number") number = value;
  else if (typeof value === "string" && /^(?:0|[1-9]\d{0,4})$/.test(value)) number = Number(value);
  else throw new TypeError("qualification fixture port must be a decimal integer");
  if (!Number.isSafeInteger(number) || number < 0 || number > 65_535) {
    throw new RangeError("qualification fixture port must be between 0 and 65535");
  }
  return number;
}

export function snapshotQualificationServerOptions(value, defaultPort) {
  if (value === undefined) return Object.freeze({ port: parseQualificationPort(defaultPort), quiet: false });
  let prototype;
  let keys;
  try {
    prototype = value && typeof value === "object" ? Object.getPrototypeOf(value) : null;
    keys = value && typeof value === "object" ? Reflect.ownKeys(value) : [];
  } catch {
    throw new TypeError("qualification fixture options are not safely inspectable");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("qualification fixture options must be an object");
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError("qualification fixture options must be a plain data object");
  if (keys.some((key) => typeof key !== "string" || !OPTION_KEYS.has(key))) throw new TypeError("qualification fixture option fields are invalid");

  const read = (key, fallback) => {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`qualification fixture options.${key} is not safely inspectable`); }
    if (!descriptor) return fallback;
    if (!("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`qualification fixture options.${key} must be an enumerable data field`);
    return descriptor.value;
  };

  const port = parseQualificationPort(read("port", defaultPort));
  const quiet = read("quiet", false);
  if (typeof quiet !== "boolean") throw new TypeError("qualification fixture quiet must be boolean");
  return Object.freeze({ port, quiet });
}
