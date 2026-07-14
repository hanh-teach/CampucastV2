import React from 'react';
import { cn } from '../lib/utils';
import { useAdaptive } from '../layouts/AdaptiveContext';
import { LayoutVariant } from '../types';

interface AdaptiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    compact?: number;
    regular?: number;
    expanded?: number;
  };
}

export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({
  children,
  className,
  cols = { compact: 1, regular: 2, expanded: 3 }
}) => {
  const { variant } = useAdaptive();

  const getColClass = () => {
    const activeCols = variant === LayoutVariant.Compact
      ? cols.compact
      : variant === LayoutVariant.Regular
        ? cols.regular
        : cols.expanded;

    switch (activeCols) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      default: return "grid-cols-1";
    }
  };

  return (
    <div className={cn("grid gap-6 w-full", getColClass(), className)}>
      {children}
    </div>
  );
};
