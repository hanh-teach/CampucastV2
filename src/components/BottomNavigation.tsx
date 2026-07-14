import React from 'react';
import { cn } from '../lib/utils';
import { Home, Mic, Library, Settings, BrainCircuit, Zap } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { type: TabType; icon: React.ElementType; label: string }[] = [
    { type: 'workspace', icon: Home, label: 'Home' },
    { type: 'mission_studio', icon: Mic, label: 'Studio' },
    { type: 'library', icon: Library, label: 'Library' },
    { type: 'ai_center', icon: BrainCircuit, label: 'AI' },
    { type: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-card border-t border-border-subtle flex items-center justify-around py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.type;
        return (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-colors",
              isActive ? "text-brand-accent" : "text-text-muted"
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
