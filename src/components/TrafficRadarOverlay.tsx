import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Radio, 
  MapPin, 
  AlertTriangle, 
  Navigation, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Gauge, 
  Compass, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  LocateFixed
} from "lucide-react";
import { TrafficAlertItem, BroadcastConfiguration } from "../types";
import { cn } from "../lib/utils";

interface TrafficRadarOverlayProps {
  uiLanguage?: "vi" | "en";
  preferences: BroadcastConfiguration;
  userCoords?: { lat: number; lng: number } | null;
  nearbyAlerts?: TrafficAlertItem[];
  activeAlert?: TrafficAlertItem | null;
  isAlertAudioPlaying?: boolean;
  isGeoFenceActive?: boolean;
  onTriggerAlertAudio?: (script: string) => void;
  onRefreshTraffic?: () => void;
  onDismissAlert?: () => void;
  onBackToBriefing?: () => void;
}

export function TrafficRadarOverlay({
  uiLanguage = "vi",
  preferences,
  userCoords,
  nearbyAlerts = [],
  activeAlert,
  isAlertAudioPlaying = false,
  isGeoFenceActive = false,
  onTriggerAlertAudio,
  onRefreshTraffic,
  onDismissAlert,
  onBackToBriefing
}: TrafficRadarOverlayProps) {
  const [selectedRadius, setSelectedRadius] = useState<number>(preferences.geofenceRadiusKm || 8.0);
  const [simulatedSpeed, setSimulatedSpeed] = useState<number>(38);
  const [isSimulatingMovement, setIsSimulatingMovement] = useState<boolean>(true);
  const [heading, setHeading] = useState<number>(45);
  const [selectedIncident, setSelectedIncident] = useState<TrafficAlertItem | null>(null);

  // Speed simulation jitter for driving feel
  useEffect(() => {
    if (!isSimulatingMovement) return;
    const interval = setInterval(() => {
      setSimulatedSpeed((prev) => {
        const delta = (Math.random() - 0.5) * 6;
        return Math.max(12, Math.min(85, Math.round(prev + delta)));
      });
      setHeading((prev) => (prev + (Math.random() - 0.5) * 4 + 360) % 360);
    }, 2000);
    return () => clearInterval(interval);
  }, [isSimulatingMovement]);

  // Set default selected incident
  useEffect(() => {
    if (activeAlert) {
      setSelectedIncident(activeAlert);
    } else if (nearbyAlerts.length > 0 && !selectedIncident) {
      setSelectedIncident(nearbyAlerts[0]);
    }
  }, [activeAlert, nearbyAlerts, selectedIncident]);

  const defaultCoords = userCoords || { lat: 21.0285, lng: 105.8542 }; // Hanoi default
  const criticalCount = nearbyAlerts.filter(a => a.severity === "critical").length;
  const warningCount = nearbyAlerts.filter(a => a.severity === "warning").length;

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 p-2 text-white overflow-hidden">
      {/* 1. LEFT COLUMN: INTERACTIVE GEO-SPATIAL RADAR & TELEMETRY */}
      <div className="flex-[3] flex flex-col bg-zinc-950/80 border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md shadow-2xl">
        {/* Header telemetry info */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute" />
              <Radio className="w-5 h-5 text-cyan-400 relative z-10" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black tracking-wider text-cyan-300 uppercase flex items-center gap-2">
                <span>{uiLanguage === "vi" ? "RÁ-ĐA GIAO THÔNG KHÔNG GIAN" : "GEO-SPATIAL TRAFFIC RADAR"}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  SPRINT 5.0
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                GPS: {defaultCoords.lat.toFixed(4)}°N, {defaultCoords.lng.toFixed(4)}°E • {isGeoFenceActive ? "LIVE GPS LOCK" : "SIMULATED SENSOR"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshTraffic}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all active:scale-95"
              title={uiLanguage === "vi" ? "Quét lại rada" : "Rescan Radar"}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {onBackToBriefing && (
              <button
                onClick={onBackToBriefing}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                {uiLanguage === "vi" ? "VỀ BẢN TIN" : "BACK"}
              </button>
            )}
          </div>
        </div>

        {/* RADAR CANVAS & SENSOR VIEW */}
        <div className="flex-1 relative flex items-center justify-center my-2 min-h-[220px]">
          {/* Circular Radar Grid */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20">
            {/* Concentric rings */}
            <div className="absolute inset-4 rounded-full border border-cyan-500/20 border-dashed" />
            <div className="absolute inset-12 rounded-full border border-cyan-500/30" />
            <div className="absolute inset-20 rounded-full border border-cyan-500/40" />
            
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/30" />
            <div className="absolute h-full w-[1px] bg-cyan-500/30" />

            {/* Rotating Radar Sweep Beam */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 rounded-full origin-center pointer-events-none"
              style={{
                background: "conic-gradient(from 0deg, rgba(6,182,212,0.3) 0deg, rgba(6,182,212,0) 60deg, transparent 360deg)"
              }}
            />

            {/* Center Vehicle Blip */}
            <div className="relative z-20 flex flex-col items-center justify-center">
              <motion.div 
                animate={{ rotate: heading }}
                className="w-8 h-8 rounded-full bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
              >
                <Navigation className="w-4 h-4 fill-cyan-300 transform -rotate-45" />
              </motion.div>
              <span className="text-[9px] font-black text-cyan-300 mt-1 bg-black/60 px-1.5 py-0.5 rounded font-mono">
                {simulatedSpeed} km/h
              </span>
            </div>

            {/* Nearby Incident Blips */}
            {nearbyAlerts.map((incident, idx) => {
              const angle = (idx * 90 + 35) * (Math.PI / 180);
              const distNorm = Math.min(1, (incident.distanceKm || 2.5) / selectedRadius);
              const radiusPx = distNorm * 110;
              const x = Math.cos(angle) * radiusPx;
              const y = Math.sin(angle) * radiusPx;
              const isSelected = selectedIncident?.id === incident.id;
              const isCritical = incident.severity === "critical";

              return (
                <motion.button
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  animate={{ scale: isSelected ? [1, 1.25, 1] : 1 }}
                  transition={{ repeat: isSelected ? Infinity : 0, duration: 1.5 }}
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                  className={cn(
                    "absolute z-30 p-1.5 rounded-full border shadow-lg transition-transform cursor-pointer",
                    isCritical
                      ? "bg-red-600/80 border-red-400 text-white shadow-red-500/50"
                      : "bg-amber-600/80 border-amber-400 text-white shadow-amber-500/50",
                    isSelected && "ring-4 ring-white"
                  )}
                  title={incident.title}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </motion.button>
              );
            })}
          </div>

          {/* Radar Telemetry Overlays */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 bg-black/60 border border-white/10 p-2 rounded-xl text-[10px] font-mono">
            <div className="flex items-center gap-1 text-zinc-300">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>HEADING: {Math.round(heading)}° ({heading < 90 ? "NE" : heading < 180 ? "SE" : heading < 270 ? "SW" : "NW"})</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-300">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>FLOW: {simulatedSpeed > 30 ? "OPTIMAL" : simulatedSpeed > 15 ? "MODERATE" : "CONGESTED"}</span>
            </div>
          </div>

          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-1 rounded-xl text-[10px] font-mono text-zinc-300">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>GEO-FENCE: {selectedRadius} KM</span>
          </div>
        </div>

        {/* Radius selector buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 shrink-0">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">
            {uiLanguage === "vi" ? "Bán kính Rá-đa:" : "Radar Radius:"}
          </span>
          <div className="flex gap-1.5">
            {[1, 3, 8, 15].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRadius(r)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border",
                  selectedRadius === r
                    ? "bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-sm"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                )}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: INCIDENT DETAILS & AUDIO SPLICING ACTION */}
      <div className="flex-[2] flex flex-col bg-zinc-950/80 border border-white/15 rounded-2xl p-4 overflow-y-auto shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              {uiLanguage === "vi" ? "DANH SÁCH ĐIỂM NÓNG" : "INCIDENT FEED"} ({nearbyAlerts.length})
            </h3>
          </div>
          <div className="flex gap-1.5 text-[10px] font-bold">
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              {criticalCount} {uiLanguage === "vi" ? "Khẩn cấp" : "Critical"}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {warningCount} {uiLanguage === "vi" ? "Ùn ứ" : "Warning"}
            </span>
          </div>
        </div>

        {/* Selected Incident Spotlight */}
        {selectedIncident ? (
          <div className={cn(
            "p-3.5 rounded-xl border space-y-2.5 transition-all",
            selectedIncident.severity === "critical"
              ? "bg-red-950/40 border-red-500/40"
              : "bg-amber-950/30 border-amber-500/30"
          )}>
            <div className="flex items-start justify-between gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                selectedIncident.severity === "critical" ? "bg-red-500 text-white" : "bg-amber-500 text-neutral-900"
              )}>
                {selectedIncident.severity === "critical" 
                  ? (uiLanguage === "vi" ? "🚨 KHẨN CẤP" : "🚨 CRITICAL")
                  : (uiLanguage === "vi" ? "⚠️ ÙN TẮC" : "⚠️ CONGESTION")}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                ~{selectedIncident.distanceKm ? selectedIncident.distanceKm.toFixed(1) : 2.0} km {uiLanguage === "vi" ? "phía trước" : "ahead"}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white leading-snug">
              {selectedIncident.title}
            </h4>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {selectedIncident.description}
            </p>

            {/* Impact Metric Chips */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-zinc-400 block uppercase">{uiLanguage === "vi" ? "Chậm trễ" : "Delay"}</span>
                <span className="text-xs font-black text-amber-400">+{selectedIncident.delayMinutes || 15} {uiLanguage === "vi" ? "phút" : "mins"}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-zinc-400 block uppercase">{uiLanguage === "vi" ? "Tốc độ còn" : "Speed"}</span>
                <span className="text-xs font-black text-red-400">~{selectedIncident.speedImpactKmh || 12} km/h</span>
              </div>
            </div>

            {/* Alternative Route Recommendation */}
            {selectedIncident.alternativeRoute && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{uiLanguage === "vi" ? "Lộ trình thay thế khuyến nghị" : "Recommended Detour"}</span>
                </div>
                <p className="text-[11px] text-emerald-200">
                  {selectedIncident.alternativeRoute}
                </p>
              </div>
            )}

            {/* Dynamic Audio Break-in Button */}
            <button
              onClick={() => onTriggerAlertAudio?.(selectedIncident.audioScript)}
              className={cn(
                "w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg",
                isAlertAudioPlaying
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white"
              )}
            >
              <Volume2 className="w-4 h-4" />
              <span>
                {isAlertAudioPlaying 
                  ? (uiLanguage === "vi" ? "ĐANG CẮT NGANG PHÁT THANH..." : "SPLICING AUDIO OVERLAY...")
                  : (uiLanguage === "vi" ? "PHÁT BẢN TIN CẮT NGANG (AUDIO BREAK-IN)" : "TRIGGER AUDIO BREAK-IN")}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-500 text-xs">
            {uiLanguage === "vi" ? "Không có sự cố nào trong phạm vi quét" : "No active incidents in scanned radius"}
          </div>
        )}

        {/* Other Incidents Mini List */}
        <div className="space-y-1.5 pt-1">
          {nearbyAlerts.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            return (
              <button
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className={cn(
                  "w-full p-2 rounded-xl text-left border flex items-center justify-between transition-all text-xs",
                  isSelected
                    ? "bg-white/10 border-cyan-400 text-white"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    incident.severity === "critical" ? "bg-red-400" : "bg-amber-400"
                  )} />
                  <span className="truncate font-medium">{incident.title}</span>
                </div>
                <span className="text-[10px] font-mono shrink-0 text-zinc-400">
                  {incident.distanceKm ? incident.distanceKm.toFixed(1) : 2}km
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
