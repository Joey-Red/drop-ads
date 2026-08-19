import { MAX_RAW_CACHE_POLICY_ITEMS, cacheNextRefreshAt, encodeCacheEntry } from "./cache-codec.js";
import { assertRemoteListTextStructure, assertRemoteSupportedRuleCount } from "./list-limits.js";
import { parseList } from "./lists.js";
import { parseThirdPartyCosmetics } from "./cosmetic-lists.js";
import { normalizeSubscription, subscriptionSourceKey } from "./subscriptions.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const MAX_REMOTE_LIST_BYTES = 5_000_000;
export const MAX_REMOTE_RESPONSE_HEADER_CHARS = 8_192;
export const MAX_REMOTE_LIST_CHUNKS = 65_536;
export const DEFAULT_REFRESH_MS = 12 * 60 * 60 * 1000;
export const MAX_REFRESH_DEFERRAL_MS = 8 * 24 * 60 * 60 * 1000;
export const DEFAULT_LIST_DOWNLOAD_TIMEOUT_MS = 30_000;
export const MAX_LIST_DOWNLOAD_TIMEOUT_MS = 120_000;

const TIMEOUT_OPTION_KEYS = new Set(["timeoutMs", "setTimeoutImpl", "clearTimeoutImpl", "AbortControllerImpl"]);
const RESPONSE_READ_OPTION_KEYS = new Set(["signal", "headersGet"]);
const READER_RESULT_KEYS = new Set(["done", "value"]);
const CACHE_CREATION_KEYS = new Set(["block", "allow", "cosmeticHide", "cosmeticAllow", "sourceKey"]);
const REJECTED_DOCUMENT_MEDIA_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "application/json",
  "text/json",
  "application/xml",
  "text/xml",
  "application/rss+xml",
  "application/atom+xml"
]);

async function cancelQuietly(cancel) {
  if (!cancel) return;
  try {
    await cancel();
  } catch {
    // The admission failure is actionable; reader cancellation is best-effort cleanup.
  }
}

function releaseReaderLockBestEffort(releaseLock) {
  if (!releaseLock) return;
  try { releaseLock(); } catch { /* lock cleanup must not replace the read outcome */ }
}

function decodeUtf8Chunk(decoder, chunk, options) {
  try {
    return decoder.decode(chunk, options);
  } catch {
    throw new Error("Remote list is not valid UTF-8");
  }
}

function timeoutOption(options, key, fallback) {
  const field = readPlainDataField(options, key);
  if (!field.safe) throw new Error(`List download timeout option ${key} must be an own enumerable data field when present`);
  return field.present ? field.value : fallback;
}

function captureAbortControllerCollaborators(controller) {
  if (!controller || typeof controller !== "object") throw new TypeError("List download AbortController result is invalid");
  let prototype;
  try { prototype = Object.getPrototypeOf(controller); }
  catch { throw new TypeError("List download AbortController result is not safely inspectable"); }

  const NativeAbortController = globalThis.AbortController;
  if (typeof NativeAbortController === "function" && prototype === NativeAbortController.prototype) {
    const signalDescriptor = Object.getOwnPropertyDescriptor(NativeAbortController.prototype, "signal");
    const abortDescriptor = Object.getOwnPropertyDescriptor(NativeAbortController.prototype, "abort");
    if (!signalDescriptor || typeof signalDescriptor.get !== "function"
      || !abortDescriptor || !("value" in abortDescriptor) || typeof abortDescriptor.value !== "function") {
      throw new TypeError("Native AbortController collaborators are unavailable");
    }
    let signal;
    try { signal = Reflect.apply(signalDescriptor.get, controller, []); }
    catch { throw new TypeError("List download AbortController signal is invalid"); }
    return Object.freeze({
      signal,
      abort: (...args) => Reflect.apply(abortDescriptor.value, controller, args)
    });
  }

  let signalDescriptor;
  let abortDescriptor;
  try {
    signalDescriptor = Object.getOwnPropertyDescriptor(controller, "signal");
    abortDescriptor = Object.getOwnPropertyDescriptor(controller, "abort");
  } catch {
    throw new TypeError("Injected list download AbortController result is not safely inspectable");
  }
  if (!signalDescriptor || !("value" in signalDescriptor) || !signalDescriptor.enumerable) {
    throw new TypeError("Injected AbortController signal must be an own enumerable data field");
  }
  if (!abortDescriptor || !("value" in abortDescriptor) || !abortDescriptor.enumerable || typeof abortDescriptor.value !== "function") {
    throw new TypeError("Injected AbortController abort must be an own enumerable data function");
  }
  return Object.freeze({
    signal: signalDescriptor.value,
    abort: (...args) => Reflect.apply(abortDescriptor.value, controller, args)
  });
}

function clearTimeoutBestEffort(clearTimeoutImpl, timer) {
  if (timer == null) return;
  try { clearTimeoutImpl(timer); } catch { /* timer cleanup must not replace the task outcome */ }
}

export async function withListDownloadTimeout(task, options = {}) {
  if (typeof task !== "function") throw new TypeError("List download task must be a function");
  assertPlainExactObject(options, "List download timeout options", TIMEOUT_OPTION_KEYS);
  const timeoutMs = timeoutOption(options, "timeoutMs", DEFAULT_LIST_DOWNLOAD_TIMEOUT_MS);
  const setTimeoutImpl = timeoutOption(options, "setTimeoutImpl", setTimeout);
  const clearTimeoutImpl = timeoutOption(options, "clearTimeoutImpl", clearTimeout);
  const AbortControllerImpl = timeoutOption(options, "AbortControllerImpl", AbortController);

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_LIST_DOWNLOAD_TIMEOUT_MS) {
    throw new Error(`List download timeout must be an integer from 1 through ${MAX_LIST_DOWNLOAD_TIMEOUT_MS} ms`);
  }
  if (typeof setTimeoutImpl !== "function" || typeof clearTimeoutImpl !== "function") throw new Error("List download timer implementation is invalid");
  if (typeof AbortControllerImpl !== "function") throw new Error("List download AbortController implementation is invalid");

  const controller = new AbortControllerImpl();
  const controllerCollaborators = captureAbortControllerCollaborators(controller);
  let timer = null;
  let active = true;
  let expired = false;
  let timeoutReject = null;
  const onTimeout = () => {
    if (!active) return;
    expired = true;
    try { controllerCollaborators.abort(); } catch { /* timeout still fails even if abort fails */ }
    if (timeoutReject) timeoutReject(new Error("List download timed out"));
  };

  try {
    timer = setTimeoutImpl(onTimeout, timeoutMs);
  } catch (error) {
    active = false;
    throw error;
  }

  if (expired) {
    active = false;
    const timerToClear = timer;
    timer = null;
    clearTimeoutBestEffort(clearTimeoutImpl, timerToClear);
    throw new Error("List download timed out");
  }

  const timeout = new Promise((_, reject) => { timeoutReject = reject; });
  const operation = Promise.resolve().then(() => task(controllerCollaborators.signal));

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    active = false;
    timeoutReject = null;
    const timerToClear = timer;
    timer = null;
    clearTimeoutBestEffort(clearTimeoutImpl, timerToClear);
  }
}

function nativeResponseField(response, key) {
  let prototype;
  try { prototype = Object.getPrototypeOf(response); }
  catch { throw new TypeError("Remote list response is invalid"); }

  const NativeResponse = globalThis.Response;
  if (typeof NativeResponse === "function" && prototype === NativeResponse.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(NativeResponse.prototype, key);
    if (!descriptor || typeof descriptor.get !== "function") {
      throw new TypeError(`Native Response.${key} accessor is unavailable`);
    }
    try {
      return { present: true, value: Reflect.apply(descriptor.get, response, []) };
    } catch {
      throw new TypeError(`Remote list response ${key} is invalid`);
    }
  }

  const field = readPlainDataField(response, key);
  if (!field.safe) throw new TypeError(`Remote list response ${key} must be an own enumerable data field`);
  return field;
}

function capturedReceiverCall(callback, receiver) {
  return (...args) => Reflect.apply(callback, receiver, args);
}

function captureNativeCompatibleMethod(receiver, key, label, nativeConstructor, required = false) {
  if (receiver == null) {
    if (required) throw new TypeError(`${label} is unavailable`);
    return null;
  }
  if (typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError(`${label} receiver is invalid`);

  let prototype;
  try { prototype = Object.getPrototypeOf(receiver); }
  catch { throw new TypeError(`${label} receiver is not safely inspectable`); }

  if (typeof nativeConstructor === "function" && prototype === nativeConstructor.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(nativeConstructor.prototype, key);
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "function") {
      if (!required && !descriptor) return null;
      throw new TypeError(`${label} is unavailable`);
    }
    return capturedReceiverCall(descriptor.value, receiver);
  }

  const field = readPlainDataField(receiver, key);
  if (!field.safe) throw new TypeError(`${label} must be an own enumerable data function when present`);
  if (!field.present) {
    if (required) throw new TypeError(`${label} is unavailable`);
    return null;
  }
  if (typeof field.value !== "function") throw new TypeError(`${label} must be a function`);
  return capturedReceiverCall(field.value, receiver);
}

function captureResponseBodyCollaborators(response) {
  const bodyField = nativeResponseField(response, "body");
  const body = bodyField.present ? bodyField.value : null;
  const getReader = body == null
    ? null
    : captureNativeCompatibleMethod(body, "getReader", "Remote list response body getReader", globalThis.ReadableStream, false);
  const text = captureNativeCompatibleMethod(response, "text", "Remote list response text", globalThis.Response, false);
  return Object.freeze({ getReader, text });
}

function captureReaderOperations(reader) {
  if (!reader || typeof reader !== "object") throw new TypeError("Remote list body reader is invalid");
  const NativeReader = globalThis.ReadableStreamDefaultReader;
  const read = captureNativeCompatibleMethod(reader, "read", "Remote list body reader read", NativeReader, true);
  const cancel = captureNativeCompatibleMethod(reader, "cancel", "Remote list body reader cancel", NativeReader, false);
  const releaseLock = captureNativeCompatibleMethod(reader, "releaseLock", "Remote list body reader releaseLock", NativeReader, false);
  return Object.freeze({ read, cancel, releaseLock });
}

function captureAbortSignalCollaborators(signal) {
  if (signal == null) {
    return Object.freeze({
      getAborted: () => false,
      addAbortListener: null,
      removeAbortListener: null
    });
  }
  if (typeof signal !== "object") throw new TypeError("Response body read signal must be an object when present");

  let prototype;
  try { prototype = Object.getPrototypeOf(signal); }
  catch { throw new TypeError("Response body read signal is not safely inspectable"); }

  const NativeAbortSignal = globalThis.AbortSignal;
  if (typeof NativeAbortSignal === "function" && prototype === NativeAbortSignal.prototype) {
    const abortedDescriptor = Object.getOwnPropertyDescriptor(NativeAbortSignal.prototype, "aborted");
    if (!abortedDescriptor || typeof abortedDescriptor.get !== "function") {
      throw new TypeError("Native AbortSignal.aborted accessor is unavailable");
    }
    const NativeEventTarget = globalThis.EventTarget;
    if (typeof NativeEventTarget !== "function") throw new TypeError("Native EventTarget is unavailable");
    const addDescriptor = Object.getOwnPropertyDescriptor(NativeEventTarget.prototype, "addEventListener");
    const removeDescriptor = Object.getOwnPropertyDescriptor(NativeEventTarget.prototype, "removeEventListener");
    if (!addDescriptor || !("value" in addDescriptor) || typeof addDescriptor.value !== "function"
      || !removeDescriptor || !("value" in removeDescriptor) || typeof removeDescriptor.value !== "function") {
      throw new TypeError("Native AbortSignal event collaborators are unavailable");
    }
    const getAborted = () => {
      let value;
      try { value = Reflect.apply(abortedDescriptor.get, signal, []); }
      catch { throw new TypeError("Native AbortSignal aborted state is invalid"); }
      if (typeof value !== "boolean") throw new TypeError("Native AbortSignal aborted state must be boolean");
      return value;
    };
    return Object.freeze({
      getAborted,
      addAbortListener: capturedReceiverCall(addDescriptor.value, signal),
      removeAbortListener: capturedReceiverCall(removeDescriptor.value, signal)
    });
  }

  const abortedField = readPlainDataField(signal, "aborted");
  const addField = readPlainDataField(signal, "addEventListener");
  const removeField = readPlainDataField(signal, "removeEventListener");
  if (!abortedField.safe || !abortedField.present || typeof abortedField.value !== "boolean") {
    throw new TypeError("Synthetic abort signal aborted must be an own enumerable boolean data field");
  }
  if (!addField.safe || (addField.present && typeof addField.value !== "function")) {
    throw new TypeError("Synthetic abort signal addEventListener must be an own enumerable data function when present");
  }
  if (!removeField.safe || (removeField.present && typeof removeField.value !== "function")) {
    throw new TypeError("Synthetic abort signal removeEventListener must be an own enumerable data function when present");
  }
  const getAborted = () => {
    const current = readPlainDataField(signal, "aborted");
    if (!current.safe || !current.present || typeof current.value !== "boolean") return true;
    return current.value;
  };
  return Object.freeze({
    getAborted,
    addAbortListener: addField.present ? capturedReceiverCall(addField.value, signal) : null,
    removeAbortListener: removeField.present ? capturedReceiverCall(removeField.value, signal) : null
  });
}

function captureHeadersGet(headers) {
  if (headers == null) return null;
  let prototype;
  try { prototype = Object.getPrototypeOf(headers); }
  catch { throw new TypeError("Remote list response headers are invalid"); }

  const NativeHeaders = globalThis.Headers;
  if (typeof NativeHeaders === "function" && prototype === NativeHeaders.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(NativeHeaders.prototype, "get");
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "function") {
      throw new TypeError("Native Headers.get is unavailable");
    }
    return capturedReceiverCall(descriptor.value, headers);
  }

  const getField = readPlainDataField(headers, "get");
  if (!getField.safe || !getField.present || typeof getField.value !== "function") {
    throw new TypeError("Remote list response headers must provide get()");
  }
  return capturedReceiverCall(getField.value, headers);
}

function captureResponseHeadersGet(response) {
  const headersField = nativeResponseField(response, "headers");
  if (!headersField.present) return null;
  return captureHeadersGet(headersField.value);
}

function responseMetadataSnapshot(response) {
  if (!response || typeof response !== "object") throw new TypeError("Remote list response must be an object");
  const okField = nativeResponseField(response, "ok");
  const redirectedField = nativeResponseField(response, "redirected");
  const statusField = nativeResponseField(response, "status");
  const headersGet = captureResponseHeadersGet(response);

  if (!okField.present || typeof okField.value !== "boolean") throw new TypeError("Remote list response ok must be boolean");
  const redirected = redirectedField.present ? redirectedField.value : false;
  if (typeof redirected !== "boolean") throw new TypeError("Remote list response redirected must be boolean");
  const status = statusField.present ? statusField.value : null;
  if (status != null && (!Number.isInteger(status) || status < 100 || status > 599)) {
    throw new TypeError("Remote list response status must be an HTTP status integer from 100 through 599");
  }
  return Object.freeze({ ok: okField.value, redirected, status, headersGet });
}

function headerValue(headersGet, name) {
  if (headersGet == null) return null;
  let value;
  try { value = headersGet(name); }
  catch { throw new TypeError(`Remote list response header ${name} is invalid`); }
  if (value == null) return null;
  if (typeof value !== "string") throw new TypeError(`Remote list response header ${name} must be a string`);
  if (value.length > MAX_REMOTE_RESPONSE_HEADER_CHARS) {
    throw new Error(`Remote list response header ${name} exceeds ${MAX_REMOTE_RESPONSE_HEADER_CHARS} characters`);
  }
  return value;
}

function responseMediaType(headersGet) {
  const raw = headerValue(headersGet, "content-type");
  if (raw == null) return "";
  return raw.split(";", 1)[0].trim().toLowerCase();
}

function assertListMediaType(headersGet) {
  const mediaType = responseMediaType(headersGet);
  if (!mediaType) return;
  if (REJECTED_DOCUMENT_MEDIA_TYPES.has(mediaType)
    || mediaType.endsWith("+json")
    || mediaType.endsWith("+xml")) {
    throw new Error(`List download returned non-list content type ${mediaType}`);
  }
}

function looksLikeDocumentPayload(text) {
  if (typeof text !== "string") throw new TypeError("Remote list body must be text");
  let sample = text.slice(0, 4096).replace(/^\uFEFF/, "").trimStart();
  sample = sample.replace(/^(?:<!--[\s\S]*?-->\s*)+/, "").trimStart().toLowerCase();
  return /^<!doctype\s+html\b/.test(sample)
    || /^<html(?:\s|>)/.test(sample)
    || /^<head(?:\s|>)/.test(sample)
    || /^<body(?:\s|>)/.test(sample)
    || /^<\?xml\b/.test(sample);
}

function declaredContentLength(headersGet) {
  const raw = headerValue(headersGet, "content-length");
  if (raw == null) return null;
  const text = raw.trim();
  if (!/^\d+$/.test(text)) throw new Error("Remote list Content-Length is invalid");
  const length = Number.parseInt(text, 10);
  if (!Number.isSafeInteger(length) || length < 0) throw new Error("Remote list Content-Length is invalid");
  return length;
}

function assertResponseByteLimit(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_REMOTE_LIST_BYTES) {
    throw new Error(`Remote list byte limit must be a positive safe integer no greater than ${MAX_REMOTE_LIST_BYTES}`);
  }
  return value;
}

function isReadableUint8ArrayChunk(value) {
  // ArrayBuffer.isView() is non-coercive and returns false for Proxy wrappers,
  // including revoked Proxies. Only after that gate is it safe to preserve the
  // existing Uint8Array/subclass instanceof semantics.
  return ArrayBuffer.isView(value) && value instanceof Uint8Array;
}

function intrinsicUint8ArrayByteLength(value) {
  let typedArrayPrototype;
  let descriptor;
  let byteLength;
  try {
    typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
    descriptor = Object.getOwnPropertyDescriptor(typedArrayPrototype, "byteLength");
    if (!descriptor || typeof descriptor.get !== "function") throw new TypeError("Typed-array byteLength accessor is unavailable");
    byteLength = Reflect.apply(descriptor.get, value, []);
  } catch {
    throw new TypeError("Remote list byte chunk length is invalid");
  }
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) throw new TypeError("Remote list byte chunk length is invalid");
  return byteLength;
}

function streamedReaderResultSnapshot(result) {
  assertPlainExactObject(result, "Remote list reader result", READER_RESULT_KEYS);
  const doneField = readPlainDataField(result, "done");
  const valueField = readPlainDataField(result, "value");
  if (!doneField.safe || !doneField.present || typeof doneField.value !== "boolean") {
    throw new Error("Remote list reader result requires a boolean done field");
  }
  if (!valueField.safe) throw new Error("Remote list reader value must be an own enumerable data field when present");
  if (doneField.value) {
    if (valueField.present && valueField.value !== undefined) throw new Error("Remote list terminal reader result must not contain byte data");
    return { done: true, value: undefined };
  }
  if (!valueField.present || !isReadableUint8ArrayChunk(valueField.value)) {
    throw new Error("Remote list body returned an invalid byte chunk");
  }
  return { done: false, value: valueField.value };
}

export async function readResponseTextBounded(response, maxBytes = MAX_REMOTE_LIST_BYTES, options = {}) {
  const byteLimit = assertResponseByteLimit(maxBytes);
  assertPlainExactObject(options, "Response body read options", RESPONSE_READ_OPTION_KEYS);
  const signalField = readPlainDataField(options, "signal");
  const headersGetField = readPlainDataField(options, "headersGet");
  if (!signalField.safe) throw new Error("Response body read signal must be an own enumerable data field when present");
  if (!headersGetField.safe) throw new Error("Response body read headersGet must be an own enumerable data field when present");
  const signal = signalField.present ? signalField.value : undefined;
  const headersGet = headersGetField.present ? headersGetField.value : captureResponseHeadersGet(response);
  if (headersGet != null && typeof headersGet !== "function") throw new TypeError("Response body read headersGet must be a function when present");
  const signalCollaborators = captureAbortSignalCollaborators(signal);
  const bodyCollaborators = captureResponseBodyCollaborators(response);

  const declaredLength = declaredContentLength(headersGet);
  if (declaredLength != null && declaredLength > byteLimit) throw new Error("Remote list is too large");

  const reader = bodyCollaborators.getReader ? bodyCollaborators.getReader() : null;
  if (!reader) {
    if (!bodyCollaborators.text) throw new TypeError("Remote list response does not provide a readable body or text()");
    const text = await bodyCollaborators.text();
    if (typeof text !== "string") throw new Error("Remote list body must be text");
    if (text.length > byteLimit) throw new Error("Remote list is too large");
    if (new TextEncoder().encode(text).byteLength > byteLimit) throw new Error("Remote list is too large");
    return text;
  }
  const readerOperations = captureReaderOperations(reader);

  const onAbort = () => { void cancelQuietly(readerOperations.cancel); };
  let abortListenerInstalled = false;
  try {
    if (signalCollaborators.addAbortListener) {
      try {
        signalCollaborators.addAbortListener("abort", onAbort, { once: true });
        abortListenerInstalled = true;
      } catch (error) {
        if (signalCollaborators.removeAbortListener) {
          try { signalCollaborators.removeAbortListener("abort", onAbort); } catch { /* partial registration cleanup is best effort */ }
        }
        await cancelQuietly(readerOperations.cancel);
        throw error;
      }
    }
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let byteLength = 0;
    let chunkCount = 0;
    let text = "";
    while (true) {
      if (signalCollaborators.getAborted()) throw new Error("List download timed out");
      let result;
      try {
        result = streamedReaderResultSnapshot(await readerOperations.read());
      } catch (error) {
        await cancelQuietly(readerOperations.cancel);
        throw error;
      }
      const { done, value } = result;
      if (done) break;
      chunkCount += 1;
      if (chunkCount > MAX_REMOTE_LIST_CHUNKS) {
        await cancelQuietly(readerOperations.cancel);
        throw new Error("Remote list body contains too many chunks");
      }
      const chunk = value;
      byteLength += intrinsicUint8ArrayByteLength(chunk);
      if (byteLength > byteLimit) {
        await cancelQuietly(readerOperations.cancel);
        throw new Error("Remote list is too large");
      }
      try {
        text += decodeUtf8Chunk(decoder, chunk, { stream: true });
      } catch (error) {
        await cancelQuietly(readerOperations.cancel);
        throw error;
      }
    }
    try {
      text += decodeUtf8Chunk(decoder);
    } catch (error) {
      await cancelQuietly(readerOperations.cancel);
      throw error;
    }
    return text;
  } finally {
    if (abortListenerInstalled && signalCollaborators.removeAbortListener) {
      try { signalCollaborators.removeAbortListener("abort", onAbort); }
      catch { /* listener cleanup is best effort and must not replace the read outcome */ }
    }
    releaseReaderLockBestEffort(readerOperations.releaseLock);
  }
}

export async function downloadAndParseSubscription(subscription, fetchImpl = fetch, timeoutOptions = {}) {
  const source = normalizeSubscription(subscription);
  return withListDownloadTimeout(async (signal) => {
    const response = await fetchImpl(source.sourceUrl, {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
      ...(signal ? { signal } : {})
    });

    const metadata = responseMetadataSnapshot(response);
    if (metadata.redirected) throw new Error("List download redirect was rejected");
    if (!metadata.ok) throw new Error(`List download failed with HTTP ${metadata.status ?? "unknown"}`);
    assertListMediaType(metadata.headersGet);

    const text = await readResponseTextBounded(response, MAX_REMOTE_LIST_BYTES, {
      signal,
      ...(metadata.headersGet ? { headersGet: metadata.headersGet } : {})
    });
    if (looksLikeDocumentPayload(text)) throw new Error("List download returned an HTML/XML document instead of filter data");
    assertRemoteListTextStructure(text);

    const parsed = parseList(text, source.format);
    const cosmetic = source.format === "third-party"
      ? parseThirdPartyCosmetics(text)
      : {
          hide: parsed.cosmeticHide ?? [],
          allow: parsed.cosmeticAllow ?? [],
          unsupportedCount: 0
        };
    const network = {
      block: parsed.block,
      allow: parsed.allow,
      ...(Object.hasOwn(parsed, "unsupportedCount") ? { unsupportedCount: parsed.unsupportedCount } : {})
    };
    const supportedCount = assertRemoteSupportedRuleCount(network, cosmetic);
    if (supportedCount === 0) throw new Error("Remote list contains no supported network or cosmetic rules");
    return {
      block: parsed.block,
      allow: parsed.allow,
      cosmeticHide: cosmetic.hide,
      cosmeticAllow: cosmetic.allow,
      sourceKey: subscriptionSourceKey(source)
    };
  }, timeoutOptions);
}

function assertCacheScheduleNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${label} must be a finite non-negative number within the safe integer range`);
  }
  return value;
}

function snapshotCacheCreationPolicy(parsed) {
  assertPlainExactObject(parsed, "Parsed cache policy", CACHE_CREATION_KEYS);
  const fields = Object.create(null);
  for (const key of CACHE_CREATION_KEYS) {
    const field = readPlainDataField(parsed, key);
    if (!field.safe) throw new Error(`Parsed cache policy.${key} must be an own enumerable data field when present`);
    if (field.present) fields[key] = field.value;
  }
  if (!Object.hasOwn(fields, "block") || !Object.hasOwn(fields, "allow")) {
    throw new Error("Parsed cache policy requires block and allow arrays");
  }

  const block = snapshotDenseDataArray(fields.block, "Parsed cache policy.block", MAX_RAW_CACHE_POLICY_ITEMS);
  const allow = snapshotDenseDataArray(fields.allow, "Parsed cache policy.allow", MAX_RAW_CACHE_POLICY_ITEMS);
  const cosmeticHide = Object.hasOwn(fields, "cosmeticHide")
    ? snapshotDenseDataArray(fields.cosmeticHide, "Parsed cache policy.cosmeticHide", MAX_RAW_CACHE_POLICY_ITEMS)
    : [];
  const cosmeticAllow = Object.hasOwn(fields, "cosmeticAllow")
    ? snapshotDenseDataArray(fields.cosmeticAllow, "Parsed cache policy.cosmeticAllow", MAX_RAW_CACHE_POLICY_ITEMS)
    : [];
  const total = block.length + allow.length + cosmeticHide.length + cosmeticAllow.length;
  if (total > MAX_RAW_CACHE_POLICY_ITEMS) {
    throw new Error(`Parsed cache policy contains ${total} raw policy items; cache limit is ${MAX_RAW_CACHE_POLICY_ITEMS}`);
  }

  return {
    block,
    allow,
    cosmeticHide,
    cosmeticAllow,
    ...(Object.hasOwn(fields, "sourceKey") ? { sourceKey: fields.sourceKey } : {})
  };
}

export function makeCacheEntry(parsed, now = Date.now(), refreshMs = DEFAULT_REFRESH_MS) {
  const candidate = snapshotCacheCreationPolicy(parsed);
  const currentTime = assertCacheScheduleNumber(now, "Cache current time");
  const refreshDelay = assertCacheScheduleNumber(refreshMs, "Cache refresh delay");
  const nextRefreshAt = currentTime + refreshDelay;
  if (!Number.isFinite(nextRefreshAt) || nextRefreshAt > Number.MAX_SAFE_INTEGER) {
    throw new Error("Cache refresh deadline exceeds the safe numeric range");
  }
  return encodeCacheEntry(candidate, nextRefreshAt);
}

export function isRefreshDue(entry, now = Date.now()) {
  const currentTime = typeof now === "number" && Number.isFinite(now) && now >= 0 && now <= Number.MAX_SAFE_INTEGER
    ? now
    : Number.NaN;
  const nextRefreshAt = cacheNextRefreshAt(entry);
  if (!Number.isFinite(currentTime)) return true;
  if (!Number.isFinite(nextRefreshAt) || nextRefreshAt < 0) return true;
  if (nextRefreshAt > currentTime + MAX_REFRESH_DEFERRAL_MS) return true;
  return currentTime >= nextRefreshAt;
}

