import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, Clock, X } from "lucide-react";
import { telemetry } from "../services/telemetryService";
import { colors } from "../foundation/tokens/colors";

interface PerceptionSurveyProps {
  correlationId: string;
  uiLanguage?: "vi" | "en";
}

export const PerceptionSurvey: React.FC<PerceptionSurveyProps> = ({ 
  correlationId, 
  uiLanguage = "vi" 
}) => {
  const [visible, setVisible] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [perceptionValue, setPerceptionValue] = useState<string>("");

  const t = {
    vi: {
      question: "Lần tải vừa rồi có khiến bạn nghĩ ứng dụng bị treo không?",
      question2: "Điều gì khiến bạn nghĩ ứng dụng bị treo?",
      options: [
        { label: "Không", value: "no", icon: <CheckCircle2 size={14} style={{ color: colors.success }} /> },
        { label: "Hơi chậm", value: "slow", icon: <Clock size={14} style={{ color: colors.warning }} /> },
        { label: "Có", value: "yes", icon: <AlertCircle size={14} style={{ color: colors.critical }} /> }
      ],
      causes: [
        { label: "Không có chuyển động", value: "no_motion" },
        { label: "Không có âm thanh", value: "no_audio" },
        { label: "Mạng chậm", value: "slow_network" },
        { label: "Không rõ", value: "unknown" },
        { label: "Khác", value: "other" }
      ],
      thankYou: "Cảm ơn ý kiến của bạn!"
    },
    en: {
      question: "Did the last loading experience make you think the app was frozen?",
      question2: "What made you think the app was frozen?",
      options: [
        { label: "No", value: "no", icon: <CheckCircle2 size={14} style={{ color: colors.success }} /> },
        { label: "Slow", value: "slow", icon: <Clock size={14} style={{ color: colors.warning }} /> },
        { label: "Yes", value: "yes", icon: <AlertCircle size={14} style={{ color: colors.critical }} /> }
      ],
      causes: [
        { label: "No motion", value: "no_motion" },
        { label: "No audio", value: "no_audio" },
        { label: "Slow network", value: "slow_network" },
        { label: "Unknown", value: "unknown" },
        { label: "Other", value: "other" }
      ],
      thankYou: "Thank you for your feedback!"
    }
  }[uiLanguage];

  useEffect(() => {
    // Show after 7 seconds of playback start (as requested 5-10s)
    const timer = setTimeout(() => {
      setVisible(true);
    }, 7000);

    // Auto-dismiss after 15 seconds if not answered
    const dismissTimer = setTimeout(() => {
      if (!answered) setVisible(false);
    }, 22000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [answered]);

  const handleSelect = (value: string) => {
    setPerceptionValue(value);
    if (value === "yes") {
      setStep(2);
    } else {
      submitSurvey(value);
    }
  };

  const handleCauseSelect = (cause: string) => {
    submitSurvey(perceptionValue, cause);
  };

  const submitSurvey = (response: string, cause?: string) => {
    telemetry.track("perception_survey", {
      correlationId,
      response,
      cause,
      isPerceivedFrozen: response === "yes"
    });
    setAnswered(true);
    setTimeout(() => setVisible(false), 2000);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="backdrop-blur-md border rounded-2xl p-4 shadow-2xl overflow-hidden relative"
               style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            {!answered ? (
              <>
                <p className="text-xs font-medium mb-3 pr-6" style={{ color: colors.onAccent }}>
                  {step === 1 ? t.question : t.question2}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step === 1 ? (
                    t.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border transition-colors text-[10px] font-bold"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))
                  ) : (
                    t.causes.map((cause) => (
                      <button
                        key={cause.value}
                        onClick={() => handleCauseSelect(cause.value)}
                        className="flex-grow flex items-center justify-center py-2 px-2 rounded-lg border transition-colors text-[10px] font-bold min-w-[45%]"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      >
                        {cause.label}
                      </button>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setVisible(false)}
                  className="absolute top-2 right-2 p-1 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium" style={{ color: colors.success }}>
                <CheckCircle2 size={16} />
                {t.thankYou}
              </div>
            )}
            
            {/* Minimal progress bar for auto-dismiss */}
            {!answered && step === 1 && (
              <motion.div 
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 15, ease: "linear" }}
                className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
                style={{ backgroundColor: colors.interactive, opacity: 0.5 }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
