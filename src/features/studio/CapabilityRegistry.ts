import React from "react";

export type CapabilityId = 'rss' | 'script' | 'voice' | 'publish';

export interface Capability {
  id: CapabilityId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CapabilityRegistry: Record<CapabilityId, Capability> = {
  rss: { id: 'rss', name: 'RSS Source', icon: () => null }, // Replace with icons
  script: { id: 'script', name: 'Script Editor', icon: () => null },
  voice: { id: 'voice', name: 'Voice Calibration', icon: () => null },
  publish: { id: 'publish', name: 'Publish', icon: () => null },
};
