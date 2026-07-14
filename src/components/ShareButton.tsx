import React, { useEffect, useState } from "react";
import { Share2, Check } from "lucide-react";
import { getBriefing, incrementBriefingShares } from "../services/storageService";
import ShareModal from "./ShareModal";
import { colors } from "../foundation/tokens/colors";

interface ShareButtonProps {
  briefingId: string;
  onShareSuccess?: () => void;
  uiLanguage: "vi" | "en";
}

export default function ShareButton({
  briefingId,
  onShareSuccess,
  uiLanguage
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch initial shareCount on load
  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const brief = await getBriefing(briefingId);
        if (brief && active) {
          setShareCount(brief.shareCount || 0);
        }
      } catch (err) {
        console.error("Failed to load share counts in button:", err);
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, [briefingId, isModalOpen]);

  const handleOpenShare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection click
    setIsModalOpen(true);
  };

  const handleShareSuccess = () => {
    setShareCount(prev => prev + 1);
    if (onShareSuccess) {
      onShareSuccess();
    }
  };

  return (
    <>
      <button
        onClick={(e) => handleOpenShare(e)}
        className="p-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 shadow-3xs"
        style={copied 
          ? { backgroundColor: `${colors.success}1a`, color: colors.success, borderColor: `${colors.success}33` }
          : { backgroundColor: colors.surface, color: colors.textMuted, borderColor: colors.border }
        }
        title={uiLanguage === "vi" ? "Chia sẻ bản tin" : "Share briefing"}
      >
        <Share2 className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
        <span className="text-[10px] font-bold">
          {uiLanguage === "vi" ? "Chia sẻ" : "Share"}
        </span>
        {shareCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 border"
                style={{ backgroundColor: colors.surfaceRaised, color: colors.textMuted, borderColor: colors.border }}>
            {shareCount}
          </span>
        )}
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        briefingId={briefingId}
        uiLanguage={uiLanguage}
        onShareSuccess={handleShareSuccess}
      />
    </>
  );
}
