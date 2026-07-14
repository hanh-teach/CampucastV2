import React from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { colors } from "../foundation/tokens/colors";
import { Zap, Clock, Bell, Check, X } from "lucide-react";
import { cn } from "../lib/utils";

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
  return (
    <Card className="p-6 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-accent/10 text-brand-accent">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
              {uiLanguage === "vi" ? "Tự động hóa xuất bản" : "Auto-Publishing"}
            </h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-0.5">
              {uiLanguage === "vi" ? "Phát sóng tự động theo lịch" : "Scheduled automatic broadcast"}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <Clock className="w-3 h-3 text-brand-accent" />
            <span>{uiLanguage === "vi" ? "Lịch trình" : "Schedule"}</span>
          </div>
          <p className="text-xs font-bold text-text-main">
            {uiLanguage === "vi" ? "Mỗi 6:00 sáng hàng ngày" : "Every day at 6:00 AM"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <Bell className="w-3 h-3 text-brand-accent" />
            <span>{uiLanguage === "vi" ? "Thông báo" : "Notifications"}</span>
          </div>
          <p className="text-xs font-bold text-text-main">
            {uiLanguage === "vi" ? "Gửi qua PWA & Email" : "PWA & Email enabled"}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/10">
        <p className="text-[10px] text-brand-accent leading-relaxed italic font-medium">
          {uiLanguage === "vi" 
            ? "Lưu ý: Tính năng tự động hóa yêu cầu bạn đã cấu hình nguồn RSS và Giọng đọc AI ổn định trong phần Cài đặt." 
            : "Note: Automation requires configured RSS sources and a stable AI Voice selection in Settings."}
        </p>
      </div>
    </Card>
  );
}
