// Only public configuration belongs here. Never add server credentials.
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';
const siteUrl = 'https://ozgurbayram.github.io/OCPPSimulator/';
const debugMode = import.meta.env.DEV && import.meta.env.VITE_GA_DEBUG === 'true';
const cookiePrefix = 'ocppsim';
type Protocol = 'ocpp1.6' | 'ocpp2.0.1' | 'unknown';
type ConnectionState = 'attempted' | 'connected' | 'disconnected' | 'error';
type OcppAction = 'BootNotification' | 'Heartbeat' | 'Authorize' | 'StatusNotification' | 'UnlockConnector';
type ActionResult = 'success' | 'failure';
type EventValue = string | number | boolean;

const ocppActionEvents: Record<OcppAction, string> = {
  BootNotification: 'ocpp_boot_notification',
  Heartbeat: 'ocpp_heartbeat',
  Authorize: 'ocpp_authorize',
  StatusNotification: 'ocpp_status_notification',
  UnlockConnector: 'ocpp_unlock_connector',
};

const chargingSessions = new Map<string, { startedAt: number; meterStartWh: number }>();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
let lastPage: string | undefined;

function debugLog(message: string) {
  if (debugMode) console.info(`[analytics] ${message}`);
}

export function analyticsAvailable() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const officialSite = import.meta.env.PROD &&
    window.location.origin === 'https://ozgurbayram.github.io' &&
    window.location.pathname.startsWith('/OCPPSimulator/');

  return /^G-[A-Z0-9]+$/.test(measurementId) && (officialSite || debugMode);
}

function startAnalytics() {
  if (!analyticsAvailable()) return false;
  if (initialized) return true;
  Object.assign(window, { [`ga-disable-${measurementId}`]: false });
  window.dataLayer = window.dataLayer || [];
  // Google explicitly requires the function's Arguments object in its command queue.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    debug_mode: debugMode,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: debugMode ? `${window.location.origin}/` : siteUrl,
    page_referrer: '',
    page_title: 'OCPP Simulator',
    cookie_prefix: cookiePrefix,
    cookie_domain: 'none',
    cookie_path: debugMode ? '/' : '/OCPPSimulator/',
    cookie_expires: 60 * 60 * 24 * 180,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.addEventListener('load', () => {
    debugLog('Google tag loaded');
    if (debugMode) {
      window.gtag?.('get', measurementId, 'client_id', (clientId: unknown) => {
        debugLog(typeof clientId === 'string' ? 'client ID ready' : 'client ID missing');
      });
    }
  });
  script.addEventListener('error', () => console.warn('[analytics] Google tag blocked or unavailable'));
  document.head.appendChild(script);
  initialized = true;
  debugLog('initialized in local DebugView mode');
  return true;
}

export function trackPage(pathname: string) {
  if (!startAnalytics()) return;
  // Never forward route IDs, hashes, queries, referrers or dynamic page titles.
  const page = pathname === '/' ? 'dashboard' : pathname.startsWith('/cp/') ? 'charge-point' : 'other';
  if (lastPage === page) return;
  lastPage = page;
  const pageBase = debugMode ? `${window.location.origin}/` : siteUrl;
  const fields = {
    page_location: `${pageBase}#/${page === 'dashboard' ? '' : page}`,
    page_referrer: '',
    page_title: page === 'charge-point' ? 'Charge Point — OCPP Simulator' : 'OCPP Simulator',
  };
  window.gtag?.('set', fields);
  window.gtag?.('event', 'page_view', { ...fields, debug_mode: debugMode, send_to: measurementId });
  debugLog(`queued page_view: ${page}`);
}

function sendEvent(event: string, params: Record<string, EventValue> = {}) {
  if (!startAnalytics()) return;
  window.gtag?.('event', event, { ...params, debug_mode: debugMode, send_to: measurementId });
  debugLog(`queued event: ${event}`);
}

function safeProtocol(protocol: string): Protocol {
  return protocol === 'ocpp1.6' || protocol === 'ocpp2.0.1' ? protocol : 'unknown';
}

function safeConnector(connectorId: number) {
  return Math.max(0, Math.min(100, Math.round(connectorId) || 0));
}

function safeCloseCode(closeCode: number) {
  return Math.max(0, Math.min(4999, Math.round(closeCode) || 0));
}

function rounded(value: number, digits: number) {
  return Number.isFinite(value) ? Number(Math.max(0, value).toFixed(digits)) : 0;
}

export function trackConnectionState(state: ConnectionState, protocol: string, closeCode?: number) {
  sendEvent(`connection_${state}`, {
    protocol: safeProtocol(protocol),
    ...(typeof closeCode === 'number' ? { close_code: safeCloseCode(closeCode) } : {}),
  });
}

export function trackOcppAction(
  action: OcppAction,
  result: ActionResult,
  connectorId?: number
) {
  sendEvent(ocppActionEvents[action], {
    result,
    source: 'manual',
    ...(typeof connectorId === 'number' ? { connector_number: safeConnector(connectorId) } : {}),
  });
}

export function trackChargePointCreated(protocol: string, connectorCount: number) {
  sendEvent('charge_point_created', {
    protocol: safeProtocol(protocol),
    connector_count: safeConnector(connectorCount),
  });
}

export function trackChargingStarted(input: {
  sessionKey: string;
  protocol: string;
  connectorId: number;
  meterStartWh: number;
  startSocPercent?: number;
}) {
  chargingSessions.set(input.sessionKey, {
    startedAt: Date.now(),
    meterStartWh: Math.max(0, input.meterStartWh),
  });
  sendEvent('charging_started', {
    protocol: safeProtocol(input.protocol),
    connector_number: safeConnector(input.connectorId),
    ...(typeof input.startSocPercent === 'number'
      ? { start_soc_percent: rounded(input.startSocPercent, 1) }
      : {}),
  });
}

export function trackChargingStopped(input: {
  sessionKey: string;
  protocol: string;
  connectorId: number;
  meterStopWh: number;
  endSocPercent?: number;
  reason: 'local' | 'remote' | 'completed';
}) {
  const session = chargingSessions.get(input.sessionKey);
  chargingSessions.delete(input.sessionKey);
  const energyWh = session ? Math.max(0, input.meterStopWh - session.meterStartWh) : 0;
  const durationSeconds = session ? Math.max(0, (Date.now() - session.startedAt) / 1000) : 0;

  sendEvent('charging_stopped', {
    protocol: safeProtocol(input.protocol),
    connector_number: safeConnector(input.connectorId),
    energy_kwh: rounded(energyWh / 1000, 3),
    duration_seconds: rounded(durationSeconds, 0),
    reason: input.reason,
    ...(typeof input.endSocPercent === 'number'
      ? { end_soc_percent: rounded(input.endSocPercent, 1) }
      : {}),
  });
}

export function trackFault(
  state: 'simulated' | 'cleared',
  connectorId: number,
  faultCode?: string,
  category?: string
) {
  sendEvent(`fault_${state}`, {
    connector_number: safeConnector(connectorId),
    ...(faultCode && /^[A-Za-z0-9]+$/.test(faultCode) ? { fault_code: faultCode } : {}),
    ...(category && /^[a-z]+$/.test(category) ? { fault_category: category } : {}),
  });
}
