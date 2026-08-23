import React from 'react';
import { cn } from '../lib/utils';

interface CoHostBubbleProps {
  speakerId: string;
  text: string;
  isHostB: boolean;
  className?: string;
}

export const CoHostBubble: React.FC<CoHostBubbleProps> = ({ speakerId, text, isHostB, className }) => {
  return (
    <div className={cn(
      "flex flex-col max-w-[85%] rounded-2xl p-4 space-y-1 text-sm border",
      isHostB 
        ? "ml-auto bg-surface-subtle border-border-subtle text-text-main" 
        : "mr-auto bg-surface-bg border-[var(--color-accent)]/20 text-text-main",
      className
    )}>
      <div className="text-[9px] font-black uppercase tracking-wider text-text-muted">
        {isHostB ? "Host B / Co-Host" : "Host A / Anchor"}
      </div>
      <p className="leading-relaxed text-text-main font-medium">{text}</p>
    </div>
  );
};
