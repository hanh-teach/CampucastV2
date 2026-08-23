import React from 'react';
import { cn } from '../lib/utils';
import { useAdaptive } from '../layouts/AdaptiveContext';
import { LayoutVariant } from '../types';

interface AdaptiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: LayoutVariant;
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  children,
  className,
  variant: customVariant,
  ...props
}) => {
  const { variant: contextVariant } = useAdaptive();
  const activeVariant = customVariant || contextVariant;

  return (
    <div
      className={cn(
        "bg-surface-card rounded-[24px] border border-border-subtle/40 shadow-sm transition-all duration-300",
        activeVariant === LayoutVariant.Compact ? "p-4 gap-3" : activeVariant === LayoutVariant.Regular ? "p-6 gap-4" : "p-8 gap-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
