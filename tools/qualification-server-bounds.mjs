export const QUALIFICATION_SERVER_LIMITS = Object.freeze({
  maxHeadersCount: 64,
  headersTimeout: 5_000,
  requestTimeout: 5_000,
  timeout: 5_000,
  keepAliveTimeout: 1_000,
  maxRequestsPerSocket: 64
});

export function applyQualificationServerBounds(server) {
  if (!server || typeof server !== "object") throw new TypeError("qualification fixture server is required");
  server.maxHeadersCount = QUALIFICATION_SERVER_LIMITS.maxHeadersCount;
  server.headersTimeout = QUALIFICATION_SERVER_LIMITS.headersTimeout;
  server.requestTimeout = QUALIFICATION_SERVER_LIMITS.requestTimeout;
  server.timeout = QUALIFICATION_SERVER_LIMITS.timeout;
  server.keepAliveTimeout = QUALIFICATION_SERVER_LIMITS.keepAliveTimeout;
  server.maxRequestsPerSocket = QUALIFICATION_SERVER_LIMITS.maxRequestsPerSocket;
  return server;
}

export function applyQualificationFixtureBounds(fixture) {
  if (!fixture || typeof fixture !== "object" || !Array.isArray(fixture.servers)) {
    throw new TypeError("qualification fixture server collection is invalid");
  }
  for (const server of fixture.servers) applyQualificationServerBounds(server);
  return fixture;
}
