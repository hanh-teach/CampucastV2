import React from 'react';
import { cn } from '../lib/utils';
import { useAdaptive } from '../layouts/AdaptiveContext';
import { DeviceType } from '../types';

interface AdaptiveWorkspaceProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  inspector?: React.ReactNode;
  className?: string;
  showSidebarOnMobile?: boolean;
  showInspectorOnMobile?: boolean;
}

export const AdaptiveWorkspace: React.FC<AdaptiveWorkspaceProps> = ({
  children,
  sidebar,
  inspector,
  className,
  showSidebarOnMobile = false,
  showInspectorOnMobile = false,
}) => {
  const { device } = useAdaptive();
  const isMobile = device === DeviceType.Mobile;

  return (
    <div className={cn("flex w-full h-full relative overflow-hidden", className)}>
      {sidebar && (!isMobile || showSidebarOnMobile) && (
        <aside className={cn(
          "shrink-0 border-r border-border-subtle bg-surface-subtle",
          isMobile ? "w-full absolute inset-0 z-10" : "w-64"
        )}>
          {sidebar}
        </aside>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto relative h-full">
        {children}
      </main>

      {inspector && (!isMobile || showInspectorOnMobile) && (
        <aside className={cn(
          "shrink-0 border-l border-border-subtle bg-surface-subtle",
          isMobile ? "w-full absolute inset-0 z-10" : "w-80"
        )}>
          {inspector}
        </aside>
      )}
    </div>
  );
};
