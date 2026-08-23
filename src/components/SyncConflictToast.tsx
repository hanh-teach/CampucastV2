import React, { useState, useEffect, useRef } from "react";
import { GitCompare, X, ExternalLink, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSync } from "../hooks/useSync";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import ConflictResolveDialog from "./ConflictResolveDialog";
import ConflictLogModal from "./ConflictLogModal";

interface SyncConflictToastProps {
  uiLanguage?: "vi" | "en";
}

export const SyncConflictToast: React.FC<SyncConflictToastProps> = ({
  uiLanguage = "vi"
}) => {
  const { conflicts = [] } = useSync();
  const [activeToastConflict, setActiveToastConflict] = useState<any | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState<boolean>(false);
  const prevPendingCountRef = useRef<number>(0);

  const isVi = uiLanguage === "vi";

  // Filter pending unresolved conflicts
  const pendingConflicts = conflicts.filter((c) => c.status === "pending");

  useEffect(() => {
    const currentPendingCount = pendingConflicts.length;
    // If new pending conflicts appeared
    if (currentPendingCount > prevPendingCountRef.current && currentPendingCount > 0) {
      // Get the latest pending conflict
      const latest = pendingConflicts[0];
      setActiveToastConflict(latest);
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [pendingConflicts]);

  // Auto-dismiss toast after 8 seconds
  useEffect(() => {
    if (!activeToastConflict) return;
    const timer = setTimeout(() => {
      setActiveToastConflict(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeToastConflict]);

  if (!activeToastConflict) return null;

  return (
    <>
      <aside aria-label="Sync Conflict Notifications" className="fixed bottom-6 right-6 z-50 max-w-sm w-full px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-surface-bg/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-xl shadow-amber-500/10 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0 animate-pulse">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-tight text-text-primary">
                    {isVi ? "Xung đột Đồng bộ Mới!" : "New Sync Conflict Detected!"}
                  </h4>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {activeToastConflict.entityType}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted font-mono mt-0.5 truncate max-w-[220px]">
                  {activeToastConflict.fileName}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveToastConflict(null)}
              className="w-7 h-7 p-0 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle shrink-0"
              title={isVi ? "Đóng thông báo" : "Dismiss notification"}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="pt-1 flex items-center justify-end gap-2 border-t border-border-subtle">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveToastConflict(null);
                setIsResolveDialogOpen(true);
              }}
              className="w-full h-8 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              {isVi ? "Giải quyết Xung đột" : "Open Resolve Dialog"}
            </Button>
          </div>
        </motion.div>
      </aside>

      {/* Trigger Dialog from Toast */}
      <ConflictResolveDialog
        isOpen={isResolveDialogOpen}
        onClose={() => setIsResolveDialogOpen(false)}
        uiLanguage={uiLanguage}
      />
    </>
  );
};

export default SyncConflictToast;
