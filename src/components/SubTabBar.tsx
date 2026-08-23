import React from 'react';
import { cn } from '../lib/utils';

interface SubTabBarProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function SubTabBar({ tabs, activeTab, onTabChange }: SubTabBarProps) {
  return (
    <div className="w-full bg-surface-bg border-b border-border-subtle/60 px-4 sm:px-6 md:px-8 py-2.5 shrink-0 z-20" id="sub-tab-bar-container">
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 custom-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`subtab-btn-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "min-h-[38px] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center shrink-0 cursor-pointer select-none",
              activeTab === tab.id
                ? "bg-brand-accent text-white shadow-sm font-black ring-2 ring-brand-accent/20"
                : "bg-surface-subtle text-text-muted hover:text-text-main hover:bg-surface-card border border-border-subtle/80 active:scale-95"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

