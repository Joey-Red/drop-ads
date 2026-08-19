export const QUALIFICATION_REQUEST_URL_MAX_CHARS = 2_048;

const SECURITY_HEADERS = Object.freeze({
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "cross-origin-resource-policy": "cross-origin"
});

export function qualificationRequestAdmission({ method, url, hostHeader, listenerHost, port }) {
  if (method !== "GET" && method !== "HEAD") return Object.freeze({ ok: false, status: 405, message: "method not allowed\n" });
  if (typeof url !== "string" || url.length === 0 || url.length > QUALIFICATION_REQUEST_URL_MAX_CHARS || !url.startsWith("/") || url.startsWith("//")) {
    return Object.freeze({ ok: false, status: 400, message: "bad request target\n" });
  }
  const expectedHost = `${listenerHost}:${port}`;
  if (hostHeader !== expectedHost) return Object.freeze({ ok: false, status: 421, message: "misdirected request\n" });
  return Object.freeze({ ok: true, status: 200, message: "" });
}

function rejectRequest(request, response, decision) {
  response.writeHead(decision.status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(decision.message),
    ...SECURITY_HEADERS
  });
  response.end(request.method === "HEAD" ? "" : decision.message);
}

export function wrapQualificationRequestHandler(handler, listenerHost, port) {
  if (typeof handler !== "function") throw new TypeError("qualification fixture request handler is required");
  return function guardedQualificationRequest(request, response) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.setHeader(name, value);
    const decision = qualificationRequestAdmission({
      method: request.method,
      url: request.url,
      hostHeader: request.headers?.host,
      listenerHost,
      port
    });
    if (!decision.ok) return rejectRequest(request, response, decision);
    return handler(request, response);
  };
}

export function installQualificationRequestGuards(fixture) {
  if (!fixture || typeof fixture !== "object" || !Array.isArray(fixture.servers)) {
    throw new TypeError("qualification fixture server collection is invalid");
  }
  for (const server of fixture.servers) {
    const address = server.address();
    if (!address || typeof address !== "object" || typeof address.address !== "string" || !Number.isSafeInteger(address.port)) {
      throw new TypeError("qualification fixture listener address is invalid");
    }
    const listeners = server.listeners("request");
    if (!Array.isArray(listeners) || listeners.length !== 1 || typeof listeners[0] !== "function") {
      throw new Error("qualification fixture listener must have exactly one request handler before guard installation");
    }
    const original = listeners[0];
    server.removeListener("request", original);
    server.on("request", wrapQualificationRequestHandler(original, address.address, address.port));
  }
  return fixture;
}
