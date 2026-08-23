import React from 'react';
import { cn } from '../lib/utils';
import { useAdaptive } from './AdaptiveContext';
import { LayoutVariant } from '../types';

interface ThreePanelLayoutProps {
  leftPanel: React.ReactNode;
  mainPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
  leftPanelClassName?: string;
  mainPanelClassName?: string;
  rightPanelClassName?: string;
}

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({ 
  leftPanel, 
  mainPanel, 
  rightPanel, 
  className,
  leftPanelClassName,
  mainPanelClassName,
  rightPanelClassName
}) => {
  const { variant } = useAdaptive();
  const isCompact = variant === LayoutVariant.Compact;

  return (
    <div className={cn("flex-1 flex overflow-hidden w-full h-full", isCompact ? "flex-col" : "flex-row", className)}>
      <aside className={cn(leftPanelClassName, isCompact ? "hidden" : "")}>{leftPanel}</aside>
      <main className={cn("flex-1 bg-surface-bg overflow-y-auto custom-scrollbar min-w-0", mainPanelClassName)}>{mainPanel}</main>
      <aside className={cn(rightPanelClassName, isCompact ? "hidden" : "")}>{rightPanel}</aside>
    </div>
  );
};
