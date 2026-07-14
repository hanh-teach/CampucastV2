import React from 'react';
import { cn } from '../lib/utils';

interface SubTabBarProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function SubTabBar({ tabs, activeTab, onTabChange }: SubTabBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
            activeTab === tab.id
              ? "bg-brand-accent text-white shadow-sm"
              : "bg-surface-bg text-text-muted hover:text-text-main border border-border-subtle"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
