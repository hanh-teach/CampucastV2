import React, { useState, useEffect } from "react";
import { 
  Battery, 
  BatteryCharging, 
  BatteryLow, 
  BatteryMedium, 
  Zap 
} from "lucide-react";
import { cn } from "../lib/utils";
import { colors } from "../foundation/tokens/colors";

interface BatteryIndicatorProps {
  uiLanguage?: "vi" | "en";
  variant?: "header" | "hud";
  isHighContrast?: boolean;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  uiLanguage = "vi",
  variant = "header",
  isHighContrast = false,
}) => {
  const [level, setLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    let batteryObj: any = null;
    let isMounted = true;

    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          if (!isMounted) return;
          batteryObj = battery;
          setLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
          setIsSupported(true);

          const handleChargingChange = () => {
            if (isMounted) setIsCharging(battery.charging);
          };
          const handleLevelChange = () => {
            if (isMounted) setLevel(Math.round(battery.level * 100));
          };

          battery.addEventListener("chargingchange", handleChargingChange);
          battery.addEventListener("levelchange", handleLevelChange);

          return () => {
            battery.removeEventListener("chargingchange", handleChargingChange);
            battery.removeEventListener("levelchange", handleLevelChange);
          };
        })
        .catch(() => {
          if (isMounted) {
            setIsSupported(false);
            setLevel(82);
            setIsCharging(false);
          }
        });
    } else {
      setIsSupported(false);
      setLevel(82);
      setIsCharging(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const displayLevel = level !== null ? level : 85;
  const isLow = displayLevel <= 20;
  const isCritical = displayLevel <= 10;

  const renderIcon = () => {
    if (isCharging) {
      return <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />;
    }
    if (isCritical || isLow) {
      return <BatteryLow className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />;
    }
    if (displayLevel > 60) {
      return <Battery className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    return <BatteryMedium className="w-4 h-4 text-yellow-500 shrink-0" />;
  };

  const getTooltip = () => {
    if (isCharging) {
      return uiLanguage === "vi" 
        ? "Đang sạc pin (Sẵn sàng lái xe)" 
        : "Charging (Ready for commute)";
    }
    if (isLow) {
      return uiLanguage === "vi" 
        ? `⚠️ Mức pin thấp (${displayLevel}%)! Vui lòng cắm sạc trong chuyến đi` 
        : `⚠️ Low battery (${displayLevel}%)! Please plug in your device`;
    }
    return uiLanguage === "vi" 
      ? `Mức pin thiết bị: ${displayLevel}%` 
      : `Device battery level: ${displayLevel}%`;
  };

  if (variant === "hud") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-2xl border font-mono shadow-md shrink-0 transition-all",
          isHighContrast
            ? "bg-black text-yellow-400 border-black"
            : isLow && !isCharging
            ? "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse ring-2 ring-red-500/30"
            : isCharging
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            : "bg-zinc-900/90 text-zinc-300 border-zinc-700/60"
        )}
        title={getTooltip()}
      >
        {renderIcon()}
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={cn("text-xs md:text-sm font-black", isLow && !isCharging && "text-red-400")}>
              {displayLevel}%
            </span>
            {isCharging && <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
          </div>
          <span className="text-[7px] md:text-[8px] uppercase font-sans font-bold opacity-75">
            {isCharging
              ? uiLanguage === "vi" ? "Đang sạc" : "Charging"
              : isLow
              ? uiLanguage === "vi" ? "Cần sạc!" : "Plug in!"
              : uiLanguage === "vi" ? "Mức pin" : "Battery"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-extrabold transition-all shrink-0 cursor-default",
        isLow && !isCharging
          ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse"
          : isCharging
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          : "bg-surface-subtle text-text-muted border-border-subtle hover:border-border-primary"
      )}
      style={{
        backgroundColor: isLow && !isCharging ? undefined : isCharging ? undefined : colors.surfaceRaised,
        borderColor: isLow && !isCharging ? undefined : isCharging ? undefined : colors.border,
      }}
      title={getTooltip()}
    >
      {renderIcon()}
      <span className="font-mono">{displayLevel}%</span>
      {isCharging && <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500 shrink-0" />}
      {isLow && !isCharging && (
        <span className="hidden xl:inline text-[9px] uppercase font-extrabold text-red-500 tracking-tight">
          {uiLanguage === "vi" ? "• Cần sạc!" : "• Plug in"}
        </span>
      )}
    </div>
  );
};
