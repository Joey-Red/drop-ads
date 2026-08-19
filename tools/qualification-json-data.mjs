const MAX_DEPTH = 8;
const MAX_NODES = 256;
const MAX_FIELDS_PER_OBJECT = 128;
const MAX_KEY_BYTES = 256;
const MAX_STRING_BYTES = 256 * 1024;

function boundedString(value, currentLabel) {
  if (Buffer.byteLength(value, "utf8") > MAX_STRING_BYTES) {
    throw new TypeError(`${currentLabel} exceeds qualification string byte limit`);
  }
  return value;
}

export function cloneQualificationJsonData(value, label = "qualification data") {
  const budget = { nodes: 0 };

  function clone(current, currentLabel, depth) {
    budget.nodes += 1;
    if (budget.nodes > MAX_NODES) throw new TypeError(`${label} exceeds clone work limit`);
    if (depth > MAX_DEPTH) throw new TypeError(`${label} exceeds clone depth limit`);

    if (current === null || typeof current === "boolean") return current;
    if (typeof current === "string") return boundedString(current, currentLabel);
    if (typeof current === "number" && Number.isFinite(current)) return current;
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      throw new TypeError(`${currentLabel} contains an unsupported value`);
    }

    let prototype;
    let keys;
    try {
      prototype = Object.getPrototypeOf(current);
      keys = Reflect.ownKeys(current);
    } catch {
      throw new TypeError(`${currentLabel} is not safely inspectable`);
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${currentLabel} must be a plain data object`);
    }
    if (keys.length > MAX_FIELDS_PER_OBJECT) {
      throw new TypeError(`${currentLabel} exceeds qualification object field limit`);
    }

    const copy = Object.create(null);
    for (const key of keys) {
      if (typeof key !== "string") throw new TypeError(`${currentLabel} contains a symbol field`);
      if (Buffer.byteLength(key, "utf8") > MAX_KEY_BYTES) {
        throw new TypeError(`${currentLabel} contains an oversized field name`);
      }
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
      catch { throw new TypeError(`${currentLabel}.${key} is not safely inspectable`); }
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        throw new TypeError(`${currentLabel}.${key} must be an enumerable data field`);
      }
      copy[key] = clone(descriptor.value, `${currentLabel}.${key}`, depth + 1);
    }
    return Object.freeze(copy);
  }

  return clone(value, label, 0);
}

export function stringifyQualificationJsonData(value, label = "qualification data") {
  return `${JSON.stringify(cloneQualificationJsonData(value, label), null, 2)}\n`;
}
