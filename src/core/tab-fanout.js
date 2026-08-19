import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const MAX_TAB_MESSAGE_CONCURRENCY = 32;
export const MAX_TAB_MESSAGE_TARGETS = 10_000;
export const MAX_TAB_FANOUT_MESSAGE_DEPTH = 8;
export const MAX_TAB_FANOUT_MESSAGE_NODES = 4_096;
export const MAX_TAB_FANOUT_MESSAGE_KEYS = 128;
export const MAX_TAB_FANOUT_MESSAGE_ARRAY_ITEMS = 1_024;
export const MAX_TAB_FANOUT_MESSAGE_TEXT_CHARS = 256 * 1024;

const FANOUT_OPTION_KEYS = new Set(["batchSize"]);
const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;

function cloneFanoutMessage(message) {
  const seen = new WeakSet();
  let nodes = 0;
  let textChars = 0;

  function snapshot(value, depth, label) {
    nodes += 1;
    if (nodes > MAX_TAB_FANOUT_MESSAGE_NODES) {
      throw new Error(`Tab fanout message exceeds ${MAX_TAB_FANOUT_MESSAGE_NODES} data nodes`);
    }
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError(`${label} number must be finite`);
      return value;
    }
    if (typeof value === "string") {
      textChars += value.length;
      if (textChars > MAX_TAB_FANOUT_MESSAGE_TEXT_CHARS) {
        throw new Error(`Tab fanout message text exceeds ${MAX_TAB_FANOUT_MESSAGE_TEXT_CHARS} characters`);
      }
      return value;
    }
    if (!value || typeof value !== "object") {
      throw new TypeError(`${label} must contain only plain structured data`);
    }
    if (depth >= MAX_TAB_FANOUT_MESSAGE_DEPTH) {
      throw new Error(`Tab fanout message exceeds depth ${MAX_TAB_FANOUT_MESSAGE_DEPTH}`);
    }
    if (seen.has(value)) throw new Error("Tab fanout message cannot contain cycles or repeated object references");
    seen.add(value);

    let isArray;
    try { isArray = Array.isArray(value); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (isArray) {
      const entries = snapshotDenseDataArray(value, label, MAX_TAB_FANOUT_MESSAGE_ARRAY_ITEMS);
      const result = entries.map((entry, index) => snapshot(entry, depth + 1, `${label}[${index}]`));
      return Object.freeze(result);
    }

    let prototype;
    let ownKeys;
    try {
      prototype = Object.getPrototypeOf(value);
      ownKeys = Reflect.ownKeys(value);
    } catch {
      throw new TypeError(`${label} is not safely inspectable`);
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${label} must be a plain object`);
    }
    if (ownKeys.length > MAX_TAB_FANOUT_MESSAGE_KEYS) {
      throw new Error(`${label} exceeds ${MAX_TAB_FANOUT_MESSAGE_KEYS} fields`);
    }
    if (ownKeys.some((key) => typeof key === "symbol")) {
      throw new Error(`${label} cannot contain symbol fields`);
    }

    const result = Object.create(null);
    for (const key of ownKeys) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
      catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
      if (!descriptor?.enumerable || !("value" in descriptor)) {
        throw new TypeError(`${label}.${key} must be an enumerable data field`);
      }
      result[key] = snapshot(descriptor.value, depth + 1, `${label}.${key}`);
    }
    return Object.freeze(result);
  }

  return snapshot(message, 0, "Tab fanout message");
}

function captureReceiverData(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    throw new TypeError(`${label} receiver is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor)) throw new TypeError(`${label} must be a data property`);
      return descriptor.value;
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  throw new TypeError(`${label} is unavailable`);
}

function captureReceiverMethod(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    throw new TypeError(`${label} receiver is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") {
        throw new TypeError(`${label} must be a data function`);
      }
      const callback = descriptor.value;
      return (...args) => Reflect.apply(callback, receiver, args);
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  throw new TypeError(`${label} is unavailable`);
}

function captureTabSender(api) {
  const tabs = captureReceiverData(api, "tabs", "Tab fanout tabs API");
  return captureReceiverMethod(tabs, "sendMessage", "Tab fanout tabs.sendMessage");
}

function fanoutResult(attempted, failed) {
  return Object.freeze({ attempted, failed });
}

export async function sendTabMessageBatched(api, tabs, message, options = {}) {
  assertPlainExactObject(options, "Tab fanout options", FANOUT_OPTION_KEYS);
  const batchSizeField = readPlainDataField(options, "batchSize");
  if (!batchSizeField.safe) throw new TypeError("Tab fanout options.batchSize must be an own enumerable data field when present");
  const batchSize = batchSizeField.present ? batchSizeField.value : MAX_TAB_MESSAGE_CONCURRENCY;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_TAB_MESSAGE_CONCURRENCY) {
    throw new Error(`Tab message batch size must be between 1 and ${MAX_TAB_MESSAGE_CONCURRENCY}`);
  }
  const sendMessage = captureTabSender(api);
  const tabCandidates = snapshotDenseDataArray(tabs, "Tab fanout tabs", MAX_TAB_MESSAGE_TARGETS);

  // Capture a bounded descriptor-only snapshot before the first send/await so caller
  // mutation cannot alter later batches and hostile accessors cannot execute here.
  const messageSnapshot = cloneFanoutMessage(message);
  const tabIds = [];
  const seen = new Set();
  for (const tab of tabCandidates) {
    const idField = readPlainDataField(tab, "id");
    if (!idField.safe || !idField.present) continue;
    const id = idField.value;
    if (!Number.isSafeInteger(id) || id < 0 || seen.has(id)) continue;
    seen.add(id);
    tabIds.push(id);
  }

  const sendOne = (tabId) => Promise.resolve().then(() => sendMessage(tabId, messageSnapshot));
  let failed = 0;
  for (let index = 0; index < tabIds.length; index += batchSize) {
    const batch = tabIds.slice(index, index + batchSize);
    const results = await Promise.allSettled(batch.map(sendOne));
    failed += results.filter((result) => result.status === "rejected").length;
  }
  return fanoutResult(tabIds.length, failed);
}
