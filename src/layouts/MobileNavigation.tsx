import React from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { TabType } from '../types';

interface MobileNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />;
};
