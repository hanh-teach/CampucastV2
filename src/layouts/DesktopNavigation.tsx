import React from 'react';
import Sidebar from '../components/Sidebar';
import { TabType } from '../types';

interface DesktopNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  uiLanguage: "vi" | "en";
  unreadQueueCount?: number;
  unreadRssCount?: number;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  activeTab,
  setActiveTab,
  uiLanguage,
  unreadQueueCount = 0,
  unreadRssCount = 0,
}) => {
  return (
    <Sidebar
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      uiLanguage={uiLanguage}
      unreadQueueCount={unreadQueueCount}
      unreadRssCount={unreadRssCount}
    />
  );
};
