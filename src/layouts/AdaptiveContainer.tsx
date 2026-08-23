import React from 'react';
import { cn } from '../lib/utils';
import { LayoutVariant } from '../types';

interface AdaptiveContainerProps {
  children: React.ReactNode;
  className?: string;
  variant: LayoutVariant;
}

export const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({ children, className, variant }) => {
  return (
    <div className={cn(
      "max-w-7xl mx-auto w-full transition-all duration-300",
      variant === 'compact' ? "p-4" : variant === 'regular' ? "p-8" : "p-12",
      className
    )}>
      {children}
    </div>
  );
};
