import React from 'react';
import { cn } from '../lib/utils';
import { useAdaptive } from '../layouts/AdaptiveContext';
import { DeviceType } from '../types';

interface PageTemplateProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  id?: string;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  children,
  header,
  toolbar,
  footer,
  className,
  id,
}) => {
  const { device } = useAdaptive();
  const isMobile = device === DeviceType.Mobile;

  return (
    <div 
      id={id}
      className={cn(
        "flex flex-col flex-1 w-full bg-surface-bg relative",
        isMobile ? "pb-24" : "pb-4",
        className
      )}
    >
      {header && (
        <header className="relative bg-surface-bg/85 backdrop-blur-md border-b border-border-subtle/50 px-4 md:px-8 py-4 shrink-0">
          {header}
        </header>
      )}

      {toolbar && (
        <section className="bg-surface-subtle border-b border-border-subtle/30 px-4 md:px-8 py-3 shrink-0">
          {toolbar}
        </section>
      )}

      <div className="flex-1 w-full relative">
        {children}
      </div>

      {footer && (
        <div className="mt-auto px-4 md:px-8 py-6 border-t border-border-subtle/40 bg-surface-subtle shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};
