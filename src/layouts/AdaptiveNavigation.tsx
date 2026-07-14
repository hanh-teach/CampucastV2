import React from 'react';
import { useAdaptive } from './AdaptiveContext';
import { DeviceType, TabType } from '../types';
import Sidebar from '../components/Sidebar';
import { BottomNavigation } from '../components/BottomNavigation';

interface AdaptiveNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  uiLanguage: "vi" | "en";
  unreadQueueCount?: number;
  unreadRssCount?: number;
}

export const AdaptiveNavigation: React.FC<AdaptiveNavigationProps> = ({
  activeTab,
  setActiveTab,
  uiLanguage,
  unreadQueueCount = 0,
  unreadRssCount = 0
}) => {
  const { device } = useAdaptive();

  if (device === DeviceType.Mobile) {
    return <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

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
