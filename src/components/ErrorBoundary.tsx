import React, { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/Button";
import { colors } from "../foundation/tokens/colors";

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  const isChunkError = 
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("ChunkLoadError") ||
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("dynamically imported");

  React.useEffect(() => {
    if (isChunkError) {
      console.warn("Chunk loading failed. System reload triggered to fetch the latest assets.");
      
      const lastReload = sessionStorage.getItem("last-chunk-error-reload");
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("last-chunk-error-reload", now.toString());
        const timer = setTimeout(() => {
          window.location.reload();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isChunkError]);

  if (isChunkError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border transition-colors"
           style={{ backgroundColor: `${colors.interactive}0d`, borderColor: `${colors.interactive}33` }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 animate-spin"
             style={{ backgroundColor: `${colors.interactive}1a` }}>
          <RefreshCcw className="w-8 h-8" style={{ color: colors.interactive }} />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2" style={{ color: colors.textPrimary }}>
          Updating CommuteCast...
        </h3>
        <p className="max-w-md mx-auto mb-8 font-medium" style={{ color: colors.textSecondary }}>
          A new version of the platform was detected. We are fetching the latest assets and refreshing your workspace.
        </p>
        <Button 
          variant="secondary"
          className="gap-2"
          onClick={() => {
            sessionStorage.removeItem("last-chunk-error-reload");
            window.location.reload();
          }}
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh Now
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border transition-colors"
         style={{ backgroundColor: `${colors.critical}0d`, borderColor: `${colors.critical}33` }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
           style={{ backgroundColor: `${colors.critical}1a` }}>
        <AlertTriangle className="w-8 h-8" style={{ color: colors.critical }} />
      </div>
      <h3 className="text-xl font-black tracking-tight mb-2" style={{ color: colors.textPrimary }}>
        Module Crashed
      </h3>
      <p className="max-w-md mx-auto mb-8 font-medium" style={{ color: colors.textSecondary }}>
        An unexpected error occurred in this workspace. The rest of the platform remains active.
        <br />
        <span className="text-xs opacity-50 block mt-2 font-mono break-words" style={{ color: colors.textMuted }}>{error?.message}</span>
      </p>
      <Button 
        variant="secondary"
        className="gap-2"
        onClick={resetErrorBoundary}
      >
        <RefreshCcw className="w-4 h-4" />
        Reload Workspace
      </Button>
    </div>
  );
}

export function ErrorBoundary({ children, onReset }: Props) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onReset={onReset}>
      {children}
    </ReactErrorBoundary>
  );
}
