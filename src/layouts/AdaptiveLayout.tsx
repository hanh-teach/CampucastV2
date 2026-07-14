import React from 'react';
import { cn } from '../lib/utils';
import { LayoutVariant } from '../types';

interface AdaptiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant: LayoutVariant;
}

export const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({ children, className, variant }) => {
  return (
    <div className={cn(
      "w-full transition-all duration-300",
      variant === 'compact' ? "px-4" : variant === 'regular' ? "px-8" : "px-16",
      className
    )}>
      {children}
    </div>
  );
};
