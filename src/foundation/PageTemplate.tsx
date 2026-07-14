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
        "flex flex-col min-h-screen bg-surface-bg w-full relative",
        isMobile ? "pb-24" : "pb-0",
        className
      )}
    >
      {header && (
        <header className="sticky top-0 z-30 bg-surface-bg/85 backdrop-blur-md border-b border-border-subtle/50 px-4 md:px-8 py-4">
          {header}
        </header>
      )}

      {toolbar && (
        <section className="bg-surface-subtle border-b border-border-subtle/30 px-4 md:px-8 py-3">
          {toolbar}
        </section>
      )}

      <main className="flex-1 w-full relative overflow-y-auto">
        {children}
      </main>

      {footer && (
        <footer className="mt-auto px-4 md:px-8 py-6 border-t border-border-subtle/40 bg-surface-subtle">
          {footer}
        </footer>
      )}
    </div>
  );
};
