import React from "react";
import { Sparkles, Construction } from "lucide-react";
import { Card } from "./ui/Card";
import { colors } from "../foundation/tokens/colors";

interface ComingSoonPlaceholderProps {
  featureName: string;
  description: string;
  uiLanguage: "vi" | "en";
}

export default function ComingSoonPlaceholder({
  featureName,
  description,
  uiLanguage
}: ComingSoonPlaceholderProps) {
  return (
    <Card className="p-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-10 h-10 text-brand-accent" />
      </div>
      <div className="space-y-3 max-w-md">
        <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center justify-center gap-2">
          <Construction className="w-4 h-4 text-brand-accent" />
          {featureName} {uiLanguage === "vi" ? "- Sắp ra mắt" : "- Coming Soon"}
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-4 px-6 py-2 rounded-full border border-border-subtle bg-surface-subtle/50 text-[10px] font-black uppercase tracking-widest text-text-muted">
        {uiLanguage === "vi" ? "Đang trong quá trình phát triển" : "Under active development"}
      </div>
    </Card>
  );
}
