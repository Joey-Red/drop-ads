import { createServer } from "node:http";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 41734;
const MAX_REQUEST_URL_CHARS = 2048;
const MAX_CONNECTIONS = 16;

const GENERIC_CONSENT_SCENARIOS = Object.freeze([
  Object.freeze({ route: "/polish-generic-consent", action: "Odrzuć wszystkie", context: "Zgoda", language: "Polish", kind: "generic" }),
  Object.freeze({ route: "/swedish-generic-consent", action: "Avvisa alla", context: "Samtycke", language: "Swedish", kind: "generic" }),
  Object.freeze({ route: "/danish-generic-consent", action: "Afvis alle", context: "Samtykke", language: "Danish", kind: "generic" }),
  Object.freeze({ route: "/norwegian-generic-consent", action: "Avvis alle", context: "Samtykke", language: "Norwegian", kind: "generic" }),
  Object.freeze({ route: "/finnish-generic-consent", action: "Hylkää kaikki", context: "Suostumus", language: "Finnish", kind: "generic" }),
  Object.freeze({ route: "/czech-generic-consent", action: "Odmítnout vše", context: "Souhlas", language: "Czech", kind: "generic" })
]);

const EXACTNESS_SCENARIOS = Object.freeze([
  Object.freeze({ route: "/polish-exactness", action: "Odrzuć wszystkie teraz", context: "Ustawienia prywatności i pliki cookie", language: "Polish", kind: "exactness" }),
  Object.freeze({ route: "/swedish-exactness", action: "Avvisa alla nu", context: "Integritetsval för kakor", language: "Swedish", kind: "exactness" }),
  Object.freeze({ route: "/danish-exactness", action: "Afvis alle nu", context: "Privatlivsvalg og cookies", language: "Danish", kind: "exactness" }),
  Object.freeze({ route: "/norwegian-exactness", action: "Avvis alle nå", context: "Personvernvalg og informasjonskapsler", language: "Norwegian", kind: "exactness" }),
  Object.freeze({ route: "/finnish-exactness", action: "Hylkää kaikki nyt", context: "Tietosuojavalinnat ja evästeet", language: "Finnish", kind: "exactness" }),
  Object.freeze({ route: "/czech-exactness", action: "Odmítnout vše nyní", context: "Volby soukromí a soubory cookie", language: "Czech", kind: "exactness" })
]);

const NECESSARY_SCENARIOS = Object.freeze([
  Object.freeze({ route: "/polish-necessary", action: "Tylko niezbędne", context: "Ustawienia prywatności i pliki cookie", language: "Polish", kind: "necessary" }),
  Object.freeze({ route: "/swedish-necessary", action: "Endast nödvändiga", context: "Integritetsval för kakor", language: "Swedish", kind: "necessary" }),
  Object.freeze({ route: "/danish-necessary", action: "Kun nødvendige", context: "Privatlivsvalg og cookies", language: "Danish", kind: "necessary" }),
  Object.freeze({ route: "/norwegian-necessary", action: "Bare nødvendige", context: "Personvernvalg og informasjonskapsler", language: "Norwegian", kind: "necessary" }),
  Object.freeze({ route: "/finnish-necessary", action: "Vain välttämättömät", context: "Tietosuojavalinnat ja evästeet", language: "Finnish", kind: "necessary" }),
  Object.freeze({ route: "/czech-necessary", action: "Pouze nezbytné", context: "Volby soukromí a soubory cookie", language: "Czech", kind: "necessary" })
]);

const PRIORITY_SCENARIOS = Object.freeze([
  Object.freeze({ route: "/polish-priority", rejectAction: "Odrzuć wszystkie", necessaryAction: "Tylko niezbędne", context: "Ustawienia prywatności i pliki cookie", language: "Polish", kind: "priority" }),
  Object.freeze({ route: "/swedish-priority", rejectAction: "Avvisa alla", necessaryAction: "Endast nödvändiga", context: "Integritetsval för kakor", language: "Swedish", kind: "priority" }),
  Object.freeze({ route: "/danish-priority", rejectAction: "Afvis alle", necessaryAction: "Kun nødvendige", context: "Privatlivsvalg og cookies", language: "Danish", kind: "priority" }),
  Object.freeze({ route: "/norwegian-priority", rejectAction: "Avvis alle", necessaryAction: "Bare nødvendige", context: "Personvernvalg og informasjonskapsler", language: "Norwegian", kind: "priority" }),
  Object.freeze({ route: "/finnish-priority", rejectAction: "Hylkää kaikki", necessaryAction: "Vain välttämättömät", context: "Tietosuojavalinnat ja evästeet", language: "Finnish", kind: "priority" }),
  Object.freeze({ route: "/czech-priority", rejectAction: "Odmítnout vše", necessaryAction: "Pouze nezbytné", context: "Volby soukromí a soubory cookie", language: "Czech", kind: "priority" })
]);

const AMBIGUITY_SCENARIOS = Object.freeze([
  Object.freeze({ route: "/polish-ambiguity", firstAction: "Odrzuć wszystkie", secondAction: "Odrzuć wszystko", context: "Ustawienia prywatności i pliki cookie", language: "Polish", kind: "ambiguity" }),
  Object.freeze({ route: "/swedish-ambiguity", firstAction: "Avvisa alla", secondAction: "Avvisa alla kakor", context: "Integritetsval för kakor", language: "Swedish", kind: "ambiguity" }),
  Object.freeze({ route: "/danish-ambiguity", firstAction: "Afvis alle", secondAction: "Afvis alle cookies", context: "Privatlivsvalg og cookies", language: "Danish", kind: "ambiguity" }),
  Object.freeze({ route: "/norwegian-ambiguity", firstAction: "Avvis alle", secondAction: "Avvis alle informasjonskapsler", context: "Personvernvalg og informasjonskapsler", language: "Norwegian", kind: "ambiguity" }),
  Object.freeze({ route: "/finnish-ambiguity", firstAction: "Hylkää kaikki", secondAction: "Hylkää kaikki evästeet", context: "Tietosuojavalinnat ja evästeet", language: "Finnish", kind: "ambiguity" }),
  Object.freeze({ route: "/czech-ambiguity", firstAction: "Odmítnout vše", secondAction: "Odmítnout všechny", context: "Volby soukromí a soubory cookie", language: "Czech", kind: "ambiguity" })
]);

const SCENARIOS = Object.freeze([
  ...GENERIC_CONSENT_SCENARIOS,
  ...EXACTNESS_SCENARIOS,
  ...NECESSARY_SCENARIOS,
  ...PRIORITY_SCENARIOS,
  ...AMBIGUITY_SCENARIOS
]);
const ROUTES = Object.freeze(SCENARIOS.map(({ route }) => route));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function scenarioFor(path) {
  return SCENARIOS.find(({ route }) => route === path) ?? null;
}

function fixtureBody(scenario) {
  const { context, language, kind } = scenario;

  if (kind === "ambiguity") {
    return `
      <div class="consent" aria-label="${escapeHtml(context)}">
        <p>${escapeHtml(context)}.</p>
        <button id="firstAction" type="button">${escapeHtml(scenario.firstAction)}</button>
        <button id="secondAction" type="button">${escapeHtml(scenario.secondAction)}</button>
      </div>
      <p id="status">PASS if equal-score ${escapeHtml(language)} rejection remains untouched.</p>
      <script>
        firstAction.addEventListener('click',()=>status.textContent='FAIL: ${escapeHtml(language)} first equal-score reject activated.');
        secondAction.addEventListener('click',()=>status.textContent='FAIL: ${escapeHtml(language)} second equal-score reject activated.');
      </script>`;
  }

  if (kind === "priority") {
    return `
      <div class="consent" aria-label="${escapeHtml(context)}">
        <p>${escapeHtml(context)}.</p>
        <button id="rejectAction" type="button">${escapeHtml(scenario.rejectAction)}</button>
        <button id="necessaryAction" type="button">${escapeHtml(scenario.necessaryAction)}</button>
      </div>
      <p id="status">Waiting for ${escapeHtml(language)} reject-over-necessary priority…</p>
      <script>
        rejectAction.addEventListener('click',()=>status.textContent='PASS: ${escapeHtml(language)} reject-all won priority.');
        necessaryAction.addEventListener('click',()=>status.textContent='FAIL: ${escapeHtml(language)} necessary-only won over reject-all.');
      </script>`;
  }

  const { action } = scenario;
  if (kind === "necessary") {
    return `
      <div class="consent" aria-label="${escapeHtml(context)}">
        <p>${escapeHtml(context)}.</p>
        <button id="action" type="button">${escapeHtml(action)}</button>
      </div>
      <p id="status">Waiting for ${escapeHtml(language)} necessary-only rejection…</p>
      <script>action.addEventListener('click',()=>status.textContent='PASS: ${escapeHtml(language)} necessary-only action activated.');</script>`;
  }

  const description = kind === "generic"
    ? `generic ${language} consent`
    : `${language} non-exact rejection label`;
  const failure = kind === "generic"
    ? `${language} generic-consent action activated.`
    : `${language} non-exact rejection action activated.`;
  return `
    <div class="consent" aria-label="${escapeHtml(context)}">
      <p>${escapeHtml(context)}.</p>
      <button id="action" type="button">${escapeHtml(action)}</button>
    </div>
    <p id="status">PASS if ${escapeHtml(description)} remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: ${escapeHtml(failure)}');</script>`;
}

function page(path, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Drop Ads localized cookie-banner qualification</title><style>:root{font:16px/1.45 system-ui,sans-serif}body{max-width:760px;margin:40px auto;padding:0 20px}.consent{border:1px solid;padding:16px;border-radius:10px}button{padding:8px 12px;min-width:80px;min-height:36px}code{overflow-wrap:anywhere}</style></head><body><h1>Localized cookie-banner qualification</h1><p><code>${escapeHtml(path)}</code> is loopback-only. Positive routes should activate only in reject mode; negative and ambiguity routes must remain untouched.</p>${body}</body></html>`;
}

export function createLocalizationQualificationHandler() {
  return (request, response) => {
    const rawUrl = request.url ?? "/";
    if (!request.method || !["GET", "HEAD"].includes(request.method) || rawUrl.length > MAX_REQUEST_URL_CHARS) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return response.end("bad request\n");
    }

    const path = new URL(rawUrl, `http://${HOST}`).pathname;
    if (path === "/") {
      const links = ROUTES.map((route) => `<li><a href="${route}">${route}</a></li>`).join("");
      const body = page(path, `<p>Run every isolated route with cookie-banner rejection enabled, then repeat with it off.</p><ul>${links}</ul>`);
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return response.end(request.method === "HEAD" ? "" : body);
    }

    const scenario = scenarioFor(path);
    if (!scenario) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return response.end("not found\n");
    }

    const body = page(path, fixtureBody(scenario));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.end(request.method === "HEAD" ? "" : body);
  };
}

export async function startLocalizationQualificationServer({ port = DEFAULT_PORT, quiet = false } = {}) {
  const server = createServer(createLocalizationQualificationHandler());
  server.maxConnections = MAX_CONNECTIONS;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  if (!quiet) console.log(`Drop Ads localization qualification: http://${HOST}:${actualPort}/`);
  return Object.freeze({ host: HOST, port: actualPort, close: () => new Promise((resolve) => server.close(resolve)) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startLocalizationQualificationServer().catch((error) => {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  });
}
