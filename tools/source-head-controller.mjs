function plainInjectedController(controller) {
  let prototype;
  try { prototype = Object.getPrototypeOf(controller); }
  catch { throw new TypeError("Source HEAD AbortController result is not safely inspectable"); }
  if (!controller || typeof controller !== "object" || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError("Injected Source HEAD AbortController result must be a plain object");
  }

  let keys;
  try { keys = Reflect.ownKeys(controller); }
  catch { throw new TypeError("Source HEAD AbortController result is not safely inspectable"); }
  if (keys.some((key) => typeof key !== "string" || !["signal", "abort"].includes(key))) {
    throw new TypeError("Source HEAD AbortController result fields are invalid");
  }

  const signalDescriptor = Object.getOwnPropertyDescriptor(controller, "signal");
  const abortDescriptor = Object.getOwnPropertyDescriptor(controller, "abort");
  if (!signalDescriptor || !("value" in signalDescriptor) || !signalDescriptor.enumerable) {
    throw new TypeError("Injected Source HEAD AbortController signal must be an enumerable data field");
  }
  if (!abortDescriptor || !("value" in abortDescriptor) || !abortDescriptor.enumerable || typeof abortDescriptor.value !== "function") {
    throw new TypeError("Injected Source HEAD AbortController abort must be an enumerable data function");
  }
  return Object.freeze({
    signal: signalDescriptor.value,
    abort: () => Reflect.apply(abortDescriptor.value, controller, [])
  });
}

export function captureSourceHeadController(controller) {
  if (!controller || typeof controller !== "object") throw new TypeError("Source HEAD AbortController result is invalid");
  let prototype;
  try { prototype = Object.getPrototypeOf(controller); }
  catch { throw new TypeError("Source HEAD AbortController result is not safely inspectable"); }

  const NativeAbortController = globalThis.AbortController;
  if (typeof NativeAbortController === "function" && prototype === NativeAbortController.prototype) {
    const signalDescriptor = Object.getOwnPropertyDescriptor(NativeAbortController.prototype, "signal");
    const abortDescriptor = Object.getOwnPropertyDescriptor(NativeAbortController.prototype, "abort");
    if (!signalDescriptor || typeof signalDescriptor.get !== "function"
      || !abortDescriptor || !("value" in abortDescriptor) || typeof abortDescriptor.value !== "function") {
      throw new TypeError("Native Source HEAD AbortController collaborators are unavailable");
    }
    let signal;
    try { signal = Reflect.apply(signalDescriptor.get, controller, []); }
    catch { throw new TypeError("Source HEAD AbortController signal is invalid"); }
    return Object.freeze({
      signal,
      abort: () => Reflect.apply(abortDescriptor.value, controller, [])
    });
  }

  return plainInjectedController(controller);
}
