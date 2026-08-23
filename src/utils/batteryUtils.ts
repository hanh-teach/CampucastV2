/**
 * Battery & Low Power Mode Utility
 */

let cachedBatteryLevel: number | null = null;
let cachedIsCharging: boolean = false;
let isBatteryListenerInitialized = false;

export async function getDeviceBatteryInfo(): Promise<{ level: number | null; isCharging: boolean }> {
  if (typeof navigator !== "undefined" && "getBattery" in navigator) {
    try {
      const battery: any = await (navigator as any).getBattery();
      cachedBatteryLevel = Math.round(battery.level * 100);
      cachedIsCharging = Boolean(battery.charging);

      if (!isBatteryListenerInitialized) {
        isBatteryListenerInitialized = true;
        battery.addEventListener("levelchange", () => {
          cachedBatteryLevel = Math.round(battery.level * 100);
        });
        battery.addEventListener("chargingchange", () => {
          cachedIsCharging = Boolean(battery.charging);
        });
      }

      return { level: cachedBatteryLevel, isCharging: cachedIsCharging };
    } catch {
      // Fallback
    }
  }
  return { level: cachedBatteryLevel, isCharging: cachedIsCharging };
}

/**
 * Checks whether Low Power Mode is currently active based on:
 * 1. User preferences (manual isLowPowerModeEnabled)
 * 2. Device battery status (battery level <= threshold, e.g. 20%, and not charging)
 */
export async function checkLowPowerModeActive(): Promise<{ isActive: boolean; reason: "manual" | "battery_low" | "none"; level: number | null }> {
  let isManual = false;
  let threshold = 20;

  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("commutecast_user_preferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLowPowerModeEnabled) {
          isManual = true;
        }
        if (parsed.autoLowPowerThreshold !== undefined) {
          threshold = parsed.autoLowPowerThreshold;
        }
      }
    }
  } catch {
    // ignore
  }

  const { level, isCharging } = await getDeviceBatteryInfo();

  if (isManual) {
    return { isActive: true, reason: "manual", level };
  }

  if (level !== null && level <= threshold && !isCharging) {
    return { isActive: true, reason: "battery_low", level };
  }

  return { isActive: false, reason: "none", level };
}

/**
 * Synchronous quick check for low power active state (using cached battery level or localStorage preference)
 */
export function isLowPowerModeActiveSync(): boolean {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("commutecast_user_preferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLowPowerModeEnabled) return true;
      }
    }
  } catch {
    // ignore
  }

  if (cachedBatteryLevel !== null && cachedBatteryLevel <= 20 && !cachedIsCharging) {
    return true;
  }

  return false;
}
