/**
 * CommuteCast Security & Input Sanitization Utilities
 */

import { URL } from "url";

/**
 * Validates whether a URL is a safe, publicly reachable HTTP/HTTPS URL.
 * Prevents Server-Side Request Forgery (SSRF) attacks targeting local/internal resources.
 */
export function isValidPublicUrl(urlStr: string | undefined | null): boolean {
  if (!urlStr || typeof urlStr !== "string") {
    return false;
  }

  const trimmed = urlStr.trim();
  if (trimmed.length > 2048) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);

    // 1. Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject localhost & loopback domain patterns
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan")
    ) {
      return false;
    }

    // 3. Reject private IPv4 ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const p1 = parseInt(ipv4Match[1], 10);
      const p2 = parseInt(ipv4Match[2], 10);

      // 10.0.0.0/8 (Private network)
      if (p1 === 10) return false;

      // 172.16.0.0/12 (Private network)
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;

      // 192.168.0.0/16 (Private network)
      if (p1 === 192 && p2 === 168) return false;

      // 127.0.0.0/8 (Loopback)
      if (p1 === 127) return false;

      // 0.0.0.0/8 (Broadcast/Invalid)
      if (p1 === 0) return false;

      // 169.254.0.0/16 (Link-local / Cloud Instance Metadata Services)
      if (p1 === 169 && p2 === 254) return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Sanitizes input strings to strip potential script injection, HTML tags, and clamp max length.
 */
export function sanitizeStringInput(input: any, maxLength: number = 2000): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // remove script blocks
    .replace(/javascript:/gi, "") // remove JS protocol links
    .replace(/on\w+\s*=/gi, "") // remove inline handlers like onload=, onclick=
    .slice(0, maxLength)
    .trim();
}

/**
 * Safely parses a JSON string, stripping prototype pollution keys (__proto__, constructor, prototype).
 */
export function safeJsonParse<T>(jsonStr: string | null | undefined, fallback: T): T {
  if (!jsonStr || typeof jsonStr !== "string") return fallback;
  try {
    const parsed = JSON.parse(jsonStr, (key, value) => {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return undefined;
      }
      return value;
    });
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}
