/**
 * Zapp Smart Server Configuration Resolver
 * Seamlessly resolves and formats HTTP/HTTPS and WS/WSS endpoints
 * for both Local LAN servers and Online Cloud Deployments (Railway, Render, AWS, etc.)
 */

export interface ParsedServerConfig {
  originalInput: string;
  hostDisplay: string;
  httpBaseUrl: string;
  wsUrl: string;
  healthUrl: string;
  isCloud: boolean;
  isSecure: boolean;
}

const DEFAULT_LOCAL_PORT = 3000;

export function parseServerConfig(input: string): ParsedServerConfig {
  const trimmed = (input || 'localhost').trim().replace(/\/+$/, '');

  // 1. Check if an explicit protocol is present
  const hasHttps = /^https:\/\//i.test(trimmed);
  const hasHttp = /^http:\/\//i.test(trimmed);
  const hasWss = /^wss:\/\//i.test(trimmed);
  const hasWs = /^ws:\/\//i.test(trimmed);

  // Strip protocol and path suffixes to isolate host:port
  let hostPort = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^wss?:\/\//i, '')
    .replace(/\/api\/tv$/i, '')
    .replace(/\/ws$/i, '')
    .replace(/\/health$/i, '')
    .replace(/\/+$/, '');

  // 2. Identify if target is an IP, localhost, or a domain name
  const isIpv4 = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?::\d+)?$/.test(hostPort);
  const isLocalhost = /^localhost(?::\d+)?$/i.test(hostPort) || /^127\.0\.0\.1(?::\d+)?$/.test(hostPort);
  const isAndroidEmulator = /^10\.0\.2\.2(?::\d+)?$/.test(hostPort);

  const isLocalAddress = isIpv4 || isLocalhost || isAndroidEmulator;

  // If explicit https or wss, it's secure
  // If no scheme and it's a domain name (contains a dot and not an IP), default to secure cloud (https/wss)
  let isSecure = hasHttps || hasWss;
  let isCloud = false;

  if (!hasHttp && !hasHttps && !hasWs && !hasWss) {
    if (!isLocalAddress && hostPort.includes('.')) {
      // e.g. "zapp.up.railway.app" or "api.zapp.net"
      isSecure = true;
      isCloud = true;
    } else {
      isSecure = false;
      isCloud = false;
    }
  } else {
    isCloud = !isLocalAddress || hasHttps || hasWss;
  }

  // 3. Handle default port for local addresses if not supplied
  if (isLocalAddress && !hostPort.includes(':')) {
    hostPort = `${hostPort}:${DEFAULT_LOCAL_PORT}`;
  }

  const httpScheme = isSecure ? 'https' : 'http';
  const wsScheme = isSecure ? 'wss' : 'ws';

  const httpBaseUrl = `${httpScheme}://${hostPort}/api/tv`;
  const wsUrl = `${wsScheme}://${hostPort}/ws`;
  const healthUrl = `${httpScheme}://${hostPort}/health`;

  return {
    originalInput: input,
    hostDisplay: hostPort,
    httpBaseUrl,
    wsUrl,
    healthUrl,
    isCloud,
    isSecure,
  };
}

