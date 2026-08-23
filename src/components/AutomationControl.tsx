import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { colors } from "../foundation/tokens/colors";
import { Zap, Clock, Bell, Brain, Trash2, CheckCircle2, Sun, Moon, Coffee } from "lucide-react";
import { cn } from "../lib/utils";
import { getCompanionMemory, clearCompanionMemory } from "../services/companionMemoryService";
import { getAmbientContext } from "../services/ambientContextService";
import { AmbientContext } from "../types";

interface AutomationControlProps {
  uiLanguage: "vi" | "en";
  isAutoPublish: boolean;
  setIsAutoPublish: (val: boolean) => void;
}

export default function AutomationControl({
  uiLanguage,
  isAutoPublish,
  setIsAutoPublish
}: AutomationControlProps) {
  const [memoryCount, setMemoryCount] = useState<number>(0);
  const [ambient, setAmbient] = useState<AmbientContext>(getAmbientContext(uiLanguage));
  const [showClearedToast, setShowClearedToast] = useState<boolean>(false);

  useEffect(() => {
    const mem = getCompanionMemory();
    setMemoryCount(mem.length);
    setAmbient(getAmbientContext(uiLanguage));
  }, [uiLanguage]);

  const handleClearMemory = () => {
    clearCompanionMemory();
    setMemoryCount(0);
    setShowClearedToast(true);
    setTimeout(() => setShowClearedToast(false), 3000);
  };

  const getAmbientIcon = () => {
    switch (ambient.timeSlot) {
      case "morning_rush":
        return <Sun className="w-4 h-4 text-amber-500" />;
      case "midday_brief":
        return <Coffee className="w-4 h-4 text-orange-500" />;
      case "evening_commute":
        return <Sun className="w-4 h-4 text-rose-500" />;
      default:
        return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <Card className="p-6 space-y-6 text-left rounded-3xl border border-border-subtle bg-surface-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-accent/10 text-brand-accent">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
              {uiLanguage === "vi" ? "Tự Động Hóa & Bộ Nhớ Hành Trình" : "Automation & Companion Memory"}
            </h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-0.5 opacity-70">
              {uiLanguage === "vi" ? "Sản xuất thông minh theo ngữ cảnh môi trường" : "Contextual Ambient Production"}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAutoPublish(!isAutoPublish)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-offset-surface-card ring-transparent focus:ring-brand-accent/50",
            isAutoPublish ? "bg-brand-accent" : "bg-surface-subtle border border-border-subtle"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
              isAutoPublish ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WIDGET 1: AMBIENT CONTEXT */}
        <div className="p-4 rounded-2xl bg-surface-bg border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
            {getAmbientIcon()}
            <span>{uiLanguage === "vi" ? "Ngữ Cảnh Giờ Hiện Tại" : "Active Time Slot"}</span>
          </div>
          <p className="text-xs font-bold text-text-main">
            {uiLanguage === "vi" ? ambient.timeSlotLabelVi : ambient.timeSlotLabelEn}
          </p>
          <p className="text-[10px] text-text-muted font-medium opacity-75 truncate">
            {uiLanguage === "vi" ? ambient.weatherNoticeVi : ambient.weatherNoticeEn}
          </p>
        </div>

        {/* WIDGET 2: SCHEDULE */}
        <div className="p-4 rounded-2xl bg-surface-bg border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <Clock className="w-3.5 h-3.5 text-brand-accent" />
            <span>{uiLanguage === "vi" ? "Khung Giờ Tự Động" : "Schedule Windows"}</span>
          </div>
          <p className="text-xs font-bold text-text-main">
            {uiLanguage === "vi" ? "06:30 Sáng & 17:30 Chiều" : "06:30 AM & 05:30 PM"}
          </p>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
            {isAutoPublish ? (uiLanguage === "vi" ? "Đã Kích Hoạt" : "Active") : (uiLanguage === "vi" ? "Tạm Dừng" : "Paused")}
          </p>
        </div>

        {/* WIDGET 3: COMPANION MEMORY 48H */}
        <div className="p-4 rounded-2xl bg-surface-bg border border-border-subtle space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>{uiLanguage === "vi" ? "Bộ Nhớ 48h (Khử Trùng Lặp)" : "48h Memory (Deduplication)"}</span>
            </div>
            <p className="text-xs font-bold text-text-main mt-1">
              {memoryCount} {uiLanguage === "vi" ? "tin tức đã ghi nhớ" : "listened stories"}
            </p>
          </div>
          {memoryCount > 0 && (
            <button
              onClick={handleClearMemory}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
            >
              <Trash2 className="w-3 h-3" />
              <span>{uiLanguage === "vi" ? "Xóa bộ nhớ" : "Clear memory"}</span>
            </button>
          )}
        </div>
      </div>

      {showClearedToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{uiLanguage === "vi" ? "Đã đặt lại bộ nhớ 48h thành công!" : "48h memory reset successfully!"}</span>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/10">
        <p className="text-[10px] text-brand-accent leading-relaxed italic font-medium">
          {uiLanguage === "vi" 
            ? "Động cơ Ngữ cảnh (Ambient Engine) tự động phân tích khung giờ, lọc trùng lặp giữa các báo trong 48h và tùy biến lời chào của 2 MC Minh & An phù hợp nhất với điều kiện lộ trình của bạn." 
            : "The Ambient Context Engine automatically detects current time slots, deduplicates cross-source news within 48h, and tailors the dual-MC dialogue to your commute route."}
        </p>
      </div>
    </Card>
  );
}
