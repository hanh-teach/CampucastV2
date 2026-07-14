import React from "react";
import { 
  Settings2, 
  Languages, 
  Brain, 
  Sparkles, 
  ShieldAlert, 
  Compass, 
  Podcast, 
  Flame, 
  Clock, 
  BookOpen, 
  Info 
} from "lucide-react";
import { cn } from "../lib/utils";
import { colors } from "../foundation/tokens/colors";

interface PreferencesFormProps {
  preferences: any;
  updatePreferences: (prefs: any) => void;
  uiLanguage: "vi" | "en";
  t: any;
  userPref: any;
  updateSpeed: (speed: number) => void;
  step: string;
  setIsRssBasedGeneration: (val: boolean) => void;
  handleGenerateBriefing: () => void;
}

export default function PreferencesForm({
  preferences,
  updatePreferences,
  uiLanguage,
  t,
  userPref,
  updateSpeed,
  step,
  setIsRssBasedGeneration,
  handleGenerateBriefing,
}: PreferencesFormProps) {
  return (
    <div className="p-6 rounded-2xl border shadow-sm relative overflow-hidden" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: colors.warning }} />
      
      <h2 className="text-base font-bold inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border mb-6 shadow-sm" style={{ color: colors.onAccent, backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
        <Settings2 className="w-4 h-4" style={{ color: colors.warning }} />
        <span>{t.step2Title}</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        
        {/* Broadcast output language selector - CRITICAL FOR BILINGUAL ASSIGNMENT */}
        <div className="md:col-span-2 p-4 border rounded-xl relative overflow-hidden" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <div className="absolute top-2 right-2 opacity-10">
             <Languages className="w-16 h-16" style={{ color: colors.textMuted }} />
          </div>
          <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: colors.textPrimary }}>
            {t.labelLanguage}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                updatePreferences({ languageMode: "BILINGUAL" });
              }}
              className={cn(
                "py-3 px-3.5 text-xs font-bold rounded-lg border transition-all text-center flex flex-col justify-center items-center gap-1 cursor-pointer",
                preferences.languageMode === "BILINGUAL"
                  ? "shadow-md transform scale-[1.01]"
                  : "hover:border-interactive"
              )}
              style={preferences.languageMode === "BILINGUAL" 
                ? { backgroundColor: colors.warning, color: colors.onWarning, borderColor: colors.warning }
                : { backgroundColor: colors.surface, color: colors.textSecondary, borderColor: colors.border }}
            >
              <span className="text-sm">🗣️ EN ⇄ VI</span>
              <span>{t.langBilingual}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updatePreferences({ languageMode: "VN_ONLY" });
              }}
              className={cn(
                "py-3 px-3.5 text-xs font-bold rounded-lg border transition-all text-center flex flex-col justify-center items-center gap-1 cursor-pointer",
                preferences.languageMode === "VN_ONLY"
                  ? "shadow-md transform scale-[1.01]"
                  : "hover:border-interactive"
              )}
              style={preferences.languageMode === "VN_ONLY" 
                ? { backgroundColor: colors.interactive, color: colors.onAccent, borderColor: colors.interactive }
                : { backgroundColor: colors.surface, color: colors.textSecondary, borderColor: colors.border }}
            >
              <span className="text-sm">🇻🇳 VI</span>
              <span>{t.langVi}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updatePreferences({ languageMode: "EN_ONLY" });
              }}
              className={cn(
                "py-3 px-3.5 text-xs font-bold rounded-lg border transition-all text-center flex flex-col justify-center items-center gap-1 cursor-pointer",
                preferences.languageMode === "EN_ONLY"
                  ? "shadow-md transform scale-[1.01]"
                  : "hover:border-interactive"
              )}
              style={preferences.languageMode === "EN_ONLY" 
                ? { backgroundColor: colors.interactive, color: colors.onAccent, borderColor: colors.interactive }
                : { backgroundColor: colors.surfaceOverlay, color: colors.textPrimary, borderColor: colors.border }}
            >
              <span className="text-sm">🇺🇸 EN</span>
              <span>{t.langEn}</span>
            </button>
          </div>
          <p className="text-[11px] mt-2.5 font-medium leading-relaxed" style={{ color: colors.textSecondary }}>
            {preferences.languageMode === "BILINGUAL" && t.langDescBilingual}
            {preferences.languageMode === "VN_ONLY" && t.langDescVi}
            {preferences.languageMode === "EN_ONLY" && t.langDescEn}
          </p>
        </div>

        {/* AI Studio Transformation Mode Selector */}
        <div className="md:col-span-2 p-5 border rounded-2xl relative overflow-hidden" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-5" 
            style={{ backgroundColor: colors.interactive }}
          />
          
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.textPrimary }}>
                {uiLanguage === "vi" ? "🧠 AI Studio - Chế Độ Biên Tập & Biến Đổi" : "🧠 AI Studio - Editing & Transformation Modes"}
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                {uiLanguage === "vi" ? "Chọn chế độ xử lý để Gemini biến đổi nguồn tin thô thành kịch bản chuyên biệt" : "Choose a transformation engine for Gemini to customize your spoken script"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                key: "rewrite",
                icon: <Sparkles className="w-4 h-4" style={{ color: colors.interactive }} />,
                labelVi: "Fluent Rewrite",
                descVi: "Viết lại tin tức mạch lạc, trôi chảy, tối ưu giọng đọc.",
                labelEn: "Fluent Rewrite",
                descEn: "Rewrite raw material to be highly cohesive and readable."
              },
              {
                key: "fact_check",
                icon: <ShieldAlert className="w-4 h-4" style={{ color: colors.critical }} />,
                labelVi: "Fact Checker",
                descVi: "Đối soát sự thật, kiểm chứng thông tin phóng đại.",
                labelEn: "Fact Checker",
                descEn: "Verify unverified claims and add objective context."
              },
              {
                key: "detect_duplicate",
                icon: <Compass className="w-4 h-4" style={{ color: colors.success }} />,
                labelVi: "Deduplication",
                descVi: "Gom nhóm tin, khử chi tiết trùng lặp thừa thãi.",
                labelEn: "Deduplication",
                descEn: "Group similar feeds and eliminate redundant info."
              },
              {
                key: "podcast_style",
                icon: <Podcast className="w-4 h-4" style={{ color: colors.interactive }} />,
                labelVi: "Podcast Style",
                descVi: "Kịch bản đồng dẫn 2 MC đối thoại chia sẻ hóm hỉnh.",
                labelEn: "Podcast Style",
                descEn: "Two lively co-hosts conversing with witty banter."
              },
              {
                key: "morning_style",
                icon: <Flame className="w-4 h-4 animate-pulse" style={{ color: colors.warning }} />,
                labelVi: "Morning Vibes",
                descVi: "Năng lượng vui tươi chào buổi sáng & thời tiết nhẹ nhàng.",
                labelEn: "Morning Vibes",
                descEn: "Upbeat DJ show tone with warm greetings & weather."
              },
              {
                key: "driving_style",
                icon: <Clock className="w-4 h-4" style={{ color: colors.interactive }} />,
                labelVi: "Safe Commuter",
                descVi: "Súc tích dễ nghe, cảnh báo an toàn & giữ tập trung.",
                labelEn: "Safe Commuter",
                descEn: "Concise spoken pacing with road safety reminders."
              },
              {
                key: "student_mode",
                icon: <BookOpen className="w-4 h-4" style={{ color: colors.interactive }} />,
                labelVi: "Educator Mode",
                descVi: "Giải nghĩa từ vựng chuyên ngành, khái niệm phức tạp.",
                labelEn: "Educator Mode",
                descEn: "Act as a mentor, unpacking scientific/academic terms."
              },
              {
                key: "executive_mode",
                icon: <Info className="w-4 h-4" style={{ color: colors.textSecondary }} />,
                labelVi: "Macro Executive",
                descVi: "Cô đọng số liệu chính, tác động tài chính vĩ mô.",
                labelEn: "Macro Executive",
                descEn: "Highlight key metrics, market outcomes, and strategy."
              },
              {
                key: "english_learning_mode",
                icon: <Languages className="w-4 h-4" style={{ color: colors.interactive }} />,
                labelVi: "English Corner",
                descVi: "Đính kèm phân tích 2-3 từ vựng học thuật sau mỗi tin.",
                labelEn: "Language Learner",
                descEn: "Pick 2-3 advanced vocabulary words to explain with examples."
              }
            ].map((mode) => {
              const isSelected = (preferences.aiMode || "rewrite") === mode.key;
              return (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => updatePreferences({ aiMode: mode.key })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all hover:shadow-xs active:scale-[0.98] flex flex-col justify-between gap-1.5 h-full cursor-pointer relative",
                    isSelected ? "ring-2" : "bg-opacity-60"
                  )}
                  style={{
                    backgroundColor: isSelected ? colors.surface : colors.surfaceOverlay,
                    borderColor: isSelected ? colors.interactive : colors.border,
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    ...(isSelected && { ringColor: `color-mix(in srgb, ${colors.interactive}, transparent 90%)` })
                  }}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: colors.interactive }}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: colors.interactive }}></span>
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {mode.icon}
                    <span className="text-xs font-black tracking-wide">
                      {uiLanguage === "vi" ? mode.labelVi : mode.labelEn}
                    </span>
                  </div>
                  <span className="text-[10px] font-normal leading-relaxed" style={{ color: colors.textMuted }}>
                    {uiLanguage === "vi" ? mode.descVi : mode.descEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Duration slider */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelDuration}
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ backgroundColor: colors.surfaceOverlay }}>
            {[
              { key: "short", label: t.durShort },
              { key: "medium", label: t.durMedium },
              { key: "long", label: t.durLong }
            ].map((dur) => (
              <button
                key={dur.key}
                type="button"
                onClick={() => updatePreferences({ targetDuration: dur.key as any })}
                className={cn(
                  "py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  preferences.targetDuration === dur.key 
                    ? "shadow-sm" 
                    : "hover:opacity-80"
                )}
                style={{
                  backgroundColor: preferences.targetDuration === dur.key ? colors.surface : "transparent",
                  color: preferences.targetDuration === dur.key ? colors.textPrimary : colors.textMuted
                }}
              >
                {dur.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] block mt-1" style={{ color: colors.textMuted }}>
            {preferences.targetDuration === "short" && t.durDescShort}
            {preferences.targetDuration === "medium" && t.durDescMedium}
            {preferences.targetDuration === "long" && t.durDescLong}
          </span>
        </div>

        {/* Transit commute type */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelCommute}
          </label>
          <select
            value={preferences.commuteType}
            onChange={(e) => updatePreferences({ commuteType: e.target.value as any })}
            className="w-full text-xs px-3 py-2 rounded-xl outline-none border transition-all"
            style={{ 
              backgroundColor: colors.surfaceOverlay, 
              borderColor: colors.border,
              color: colors.textPrimary
            }}
          >
            <option value="driving">{t.commuteDriving}</option>
            <option value="transit">{t.commuteTransit}</option>
            <option value="walking">{t.commuteWalking}</option>
            <option value="cycling">{t.commuteCycling}</option>
          </select>
          <span className="text-[10px] block mt-1" style={{ color: colors.textMuted }}>
            {t.commuteDesc}
          </span>
        </div>

        {/* Spoken Tone style */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelTone}
          </label>
          <select
            value={preferences.tone}
            onChange={(e) => updatePreferences({ tone: e.target.value as any })}
            className="w-full text-xs px-3 py-2 rounded-xl outline-none border transition-all"
            style={{ 
              backgroundColor: colors.surfaceOverlay, 
              borderColor: colors.border,
              color: colors.textPrimary
            }}
          >
            <option value="conversational">{t.toneConversational}</option>
            <option value="informative">{t.toneInformative}</option>
            <option value="upbeat">{t.toneUpbeat}</option>
            <option value="analytical">{t.toneAnalytical}</option>
            <option value="witty">{t.toneWitty}</option>
          </select>
        </div>

        {/* TTS Vocoder voice */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelVoice}
          </label>
          <select
            value={preferences.voice}
            onChange={(e) => {
              const nextVoice = e.target.value as any;
              updatePreferences({ voice: nextVoice });
            }}
            className="w-full text-xs px-3 py-2 rounded-xl outline-none font-medium cursor-pointer border transition-all"
            style={{ 
              backgroundColor: colors.surfaceOverlay, 
              borderColor: colors.border,
              color: colors.textPrimary
            }}
          >
            <option value="vi-HN">🇻🇳 {uiLanguage === "vi" ? "Việt Nam (Giọng Hà Nội - Nữ)" : "Vietnam (Hanoi Accent - Female)"}</option>
            <option value="vi-HCM">🇻🇳 {uiLanguage === "vi" ? "Việt Nam (Giọng TP. HCM - Nữ/Nam)" : "Vietnam (HCM Accent - Friendly)"}</option>
            <option value="en-UK">🇬🇧 {uiLanguage === "vi" ? "UK (United Kingdom): Giọng Anh - Anh (chuẩn RP)" : "UK (United Kingdom): British Accent (RP Standard)"}</option>
            <option value="en-US">🇺🇸 {uiLanguage === "vi" ? "US (United States): Giọng Anh - Mỹ (chuẩn GA)" : "US (United States): American Accent (GA Standard)"}</option>
            <option value="Kore">Kore {uiLanguage === "vi" ? "(Giọng Nữ Anh chuẩn)" : "(Clear, Professional Female)"}</option>
            <option value="Puck">Puck {uiLanguage === "vi" ? "(Giọng Nam Anh ấm áp)" : "(Aesthetic, Warm Narrative Male)"}</option>
            <option value="Charon">Charon {uiLanguage === "vi" ? "(Giọng Nam trầm trang trọng)" : "(Declaimed deep baritone)"}</option>
            <option value="Fenrir">Fenrir {uiLanguage === "vi" ? "(Giọng trung tính tiêu chuẩn)" : "(Steady Standard Neutral)"}</option>
            <option value="Zephyr">Zephyr {uiLanguage === "vi" ? "(Giọng dẫn chương trình sôi động)" : "(Bright, Engaging Host)"}</option>
          </select>
          <span className="text-[10px] block mt-1" style={{ color: colors.textMuted }}>
            {t.voiceSub}
          </span>
        </div>

        {/* Default Reading Speed */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            ⚡ {uiLanguage === "vi" ? "Tốc Độ Đọc Mặc Định" : "Default Read Speed"}
          </label>
          <div className="grid grid-cols-6 gap-1 p-1 rounded-xl" style={{ backgroundColor: colors.surfaceOverlay }}>
            {([0.8, 0.9, 1.0, 1.1, 1.2, 1.3] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => updateSpeed(spd)}
                className={cn(
                  "py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border",
                  userPref.speed === spd
                    ? "shadow-xs"
                    : "border-transparent"
                )}
                style={{
                  backgroundColor: userPref.speed === spd ? colors.surface : "transparent",
                  color: userPref.speed === spd ? colors.textPrimary : colors.textMuted,
                  borderColor: userPref.speed === spd ? colors.border : "transparent"
                }}
              >
                {spd}
              </button>
            ))}
          </div>
          <span className="text-[10px] block mt-1" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" 
              ? "Tốc độ đọc ưa thích của bạn được lưu và áp dụng tự động" 
              : "Your preferred speed is persisted and set automatically"}
          </span>
        </div>

        {/* Weather Location input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelLocationName}
          </label>
          <input
            type="text"
            value={preferences.locationName || ""}
            onChange={(e) => updatePreferences({ locationName: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-xl outline-none placeholder:text-text-dim border transition-all"
            style={{ 
              backgroundColor: colors.surfaceOverlay, 
              borderColor: colors.border,
              color: colors.textPrimary
            }}
            placeholder={t.placeholderLocationName}
          />
        </div>

        {/* Commute Route input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelCommuteRoute}
          </label>
          <input
            type="text"
            value={preferences.commuteRoute || ""}
            onChange={(e) => updatePreferences({ commuteRoute: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-xl outline-none placeholder:text-text-dim border transition-all"
            style={{ 
              backgroundColor: colors.surfaceOverlay, 
              borderColor: colors.border,
              color: colors.textPrimary
            }}
            placeholder={t.placeholderCommuteRoute}
          />
        </div>

        {/* Special focus area */}
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelFocus}
          </label>
          <input
            type="text"
            value={preferences.focus}
            onChange={(e) => updatePreferences({ focus: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-xl outline-none placeholder:text-text-dim border transition-all"
            style={{ 
              backgroundColor: colors.surfaceOverlay, 
              borderColor: colors.border,
              color: colors.textPrimary
            }}
            placeholder={t.placeholderFocus}
          />
        </div>

        {/* Custom special directives */}
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
            {t.labelSpecial}
          </label>
          <input
            type="text"
            value={preferences.customInstructions}
            onChange={(e) => updatePreferences({ customInstructions: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-xl outline-none placeholder:text-text-dim border transition-all"
            style={{ 
              backgroundColor: colors.surfaceOverlay, 
              borderColor: colors.border,
              color: colors.textPrimary
            }}
            placeholder={t.placeholderSpecial}
          />
        </div>

      </div>

      {/* Main Action launch button */}
      <div className="mt-6 pt-5 border-t" style={{ borderColor: colors.border }}>
        <button
          onClick={() => {
            setIsRssBasedGeneration(false);
            handleGenerateBriefing();
          }}
          disabled={step === "summarizing" || step === "synthesizing"}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-xs tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-[0.99] cursor-pointer",
            (step === "summarizing" || step === "synthesizing")
              ? "cursor-not-allowed shadow-none opacity-50"
              : "hover:shadow-lg"
          )}
          style={{
            backgroundColor: (step === "summarizing" || step === "synthesizing") ? colors.surfaceOverlay : colors.interactive,
            color: (step === "summarizing" || step === "synthesizing") ? colors.textMuted : colors.onAccent
          }}
        >
          <Sparkles className={cn("w-5 h-5", (step === "summarizing" || step === "synthesizing") && "animate-spin")} style={{ color: (step === "summarizing" || step === "synthesizing") ? colors.textMuted : colors.warning }} />
          <span>{t.btnGenerate}</span>
        </button>
      </div>
    </div>
  );
}
