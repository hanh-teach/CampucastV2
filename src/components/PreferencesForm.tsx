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
                labelVi: "Podcast Đối Thoại 2 MC (Dual-Host)",
                descVi: "Đối thoại 2 MC (MC Minh - Nam Bắc & MC An - Nữ Nam) sinh động, hấp dẫn.",
                labelEn: "Dual-Host Podcast (2 MCs)",
                descEn: "Dynamic dialogue between MC Minh (Male North) & MC An (Female South)."
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

        {/* Target Duration & Adaptive Commute Time */}
        <div className="md:col-span-2 p-4 border rounded-xl" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{uiLanguage === "vi" ? "Thời Lượng Hành Trình & Nhịp Điệu (Adaptive Snapping)" : "Commute Duration & Pacing Snapping"}</span>
            </label>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.warning }}>
              {preferences.targetDurationMinutes || (preferences.targetDuration === "short" ? 3 : preferences.targetDuration === "long" ? 15 : 6)} {uiLanguage === "vi" ? "phút" : "mins"} 
              {" • ~"}{((preferences.targetDurationMinutes || (preferences.targetDuration === "short" ? 3 : preferences.targetDuration === "long" ? 15 : 6)) * (preferences.pacingProfile === "dense" ? 160 : preferences.pacingProfile === "relaxed" ? 120 : 140)).toLocaleString()} {uiLanguage === "vi" ? "từ" : "words"}
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { mins: 3, label: uiLanguage === "vi" ? "⚡ 3p (Ngắn)" : "⚡ 3m (Quick)", dur: "short" },
              { mins: 5, label: uiLanguage === "vi" ? "🚗 5p (Vừa)" : "🚗 5m (Commute)", dur: "medium" },
              { mins: 10, label: uiLanguage === "vi" ? "🚇 10p (Chuẩn)" : "🚇 10m (Standard)", dur: "medium" },
              { mins: 15, label: uiLanguage === "vi" ? "🎙️ 15p (Sâu)" : "🎙️ 15m (Deep)", dur: "long" },
              { mins: 20, label: uiLanguage === "vi" ? "🚌 20p (Dài)" : "🚌 20m (Long)", dur: "long" },
              { mins: 30, label: uiLanguage === "vi" ? "📻 30p (Podcast)" : "📻 30m (Full Cast)", dur: "long" },
            ].map((p) => {
              const active = (preferences.targetDurationMinutes === p.mins) || (!preferences.targetDurationMinutes && preferences.targetDuration === p.dur && p.mins === (p.dur === "short" ? 3 : p.dur === "long" ? 15 : 6));
              return (
                <button
                  key={p.mins}
                  type="button"
                  onClick={() => updatePreferences({ targetDurationMinutes: p.mins, targetDuration: p.dur as any })}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                    active ? "shadow-sm" : "hover:border-interactive"
                  )}
                  style={{
                    backgroundColor: active ? colors.surface : "transparent",
                    borderColor: active ? colors.warning : colors.border,
                    color: active ? colors.textPrimary : colors.textMuted
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: colors.border }}>
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium" style={{ color: colors.textSecondary }}>
                <span>{uiLanguage === "vi" ? "Tùy chỉnh thời gian:" : "Custom duration:"}</span>
                <span className="font-bold">{preferences.targetDurationMinutes || 5} {uiLanguage === "vi" ? "phút" : "min"}</span>
              </div>
              <input
                type="range"
                min="1"
                max="45"
                step="1"
                value={preferences.targetDurationMinutes || (preferences.targetDuration === "short" ? 3 : preferences.targetDuration === "long" ? 15 : 6)}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updatePreferences({
                    targetDurationMinutes: val,
                    targetDuration: val <= 3 ? "short" : val >= 15 ? "long" : "medium"
                  });
                }}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-neutral-200 dark:bg-neutral-700"
              />
            </div>

            {/* Pacing profile */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium" style={{ color: colors.textSecondary }}>
                <span>{uiLanguage === "vi" ? "Nhịp độ đọc (Pacing):" : "Pacing profile:"}</span>
                <span className="font-bold">
                  {preferences.pacingProfile === "dense" ? (uiLanguage === "vi" ? "Dồn dập (160 wpm)" : "Dense (160 wpm)")
                    : preferences.pacingProfile === "relaxed" ? (uiLanguage === "vi" ? "Thư thả (120 wpm)" : "Relaxed (120 wpm)")
                    : (uiLanguage === "vi" ? "Cân bằng (140 wpm)" : "Balanced (140 wpm)")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                {[
                  { key: "relaxed", label: uiLanguage === "vi" ? "Thong thả" : "Relaxed" },
                  { key: "balanced", label: uiLanguage === "vi" ? "Cân bằng" : "Balanced" },
                  { key: "dense", label: uiLanguage === "vi" ? "Dày đặc" : "Dense" }
                ].map((pac) => {
                  const active = (preferences.pacingProfile || "balanced") === pac.key;
                  return (
                    <button
                      key={pac.key}
                      type="button"
                      onClick={() => updatePreferences({ pacingProfile: pac.key as any })}
                      className="py-1 text-[10px] font-semibold rounded transition-all"
                      style={{
                        backgroundColor: active ? colors.surfaceOverlay : "transparent",
                        color: active ? colors.warning : colors.textMuted
                      }}
                    >
                      {pac.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Offline Pre-caching Zero-Lag Toggle */}
          <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
                {uiLanguage === "vi" ? "⚡ Bộ đệm ngoại tuyến Zero-Latency (Pre-caching)" : "⚡ Offline Zero-Latency Pre-caching"}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                Sprint 4.0
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.offlinePrecacheEnabled !== false}
                onChange={(e) => updatePreferences({ offlinePrecacheEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
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
