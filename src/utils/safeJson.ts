/**
 * Safe JSON Parsing Utility with Prototype Pollution Protection
 */

export function safeJsonParse<T>(jsonStr: string | null | undefined, fallback: T): T {
  if (!jsonStr || typeof jsonStr !== "string") return fallback;
  try {
    const parsed = JSON.parse(jsonStr, (key, value) => {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return undefined; // Strips forbidden prototype keys
      }
      return value;
    });
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}
