import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutVariant, Orientation, DeviceType, PointerType, DensityType, SafeArea } from '../types';

interface AdaptiveContextType {
  variant: LayoutVariant;
  device: DeviceType;
  orientation: Orientation;
  pointer: PointerType;
  density: DensityType;
  reducedMotion: boolean;
  highContrast: boolean;
  safeArea: SafeArea;
}

const AdaptiveContext = createContext<AdaptiveContextType | undefined>(undefined);

export const AdaptiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AdaptiveContextType>({
    variant: LayoutVariant.Expanded,
    device: DeviceType.Desktop,
    orientation: Orientation.Portrait,
    pointer: PointerType.Fine,
    density: DensityType.Default,
    reducedMotion: false,
    highContrast: false,
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let device = DeviceType.Desktop;
      let variant = LayoutVariant.Expanded;

      if (width < 768) {
        device = DeviceType.Mobile;
        variant = LayoutVariant.Compact;
      } else if (width < 1200) {
        device = DeviceType.Tablet;
        variant = LayoutVariant.Regular;
      }

      // Detect Pointer
      let pointer = PointerType.Fine;
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        pointer = PointerType.Coarse;
      } else if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        pointer = PointerType.Touch;
      }

      // Detect Density
      let density = DensityType.Default;
      if (window.devicePixelRatio > 1.5) {
        density = DensityType.High;
      } else if (width < 360) {
        density = DensityType.Low;
      }

      // Accessibility Toggles
      const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
      const highContrast = window.matchMedia ? window.matchMedia('(prefers-contrast: more)').matches : false;

      // Safe Area Simulation based on device type
      let safeArea: SafeArea = { top: 0, bottom: 0, left: 0, right: 0 };
      if (device === DeviceType.Mobile) {
        // Approximate standard safe areas for mobile screens
        safeArea = {
          top: 44, // Dynamic Island / Notch
          bottom: 34, // Home Indicator bar
          left: 0,
          right: 0
        };
      } else if (device === DeviceType.Tablet) {
        safeArea = {
          top: 24,
          bottom: 20,
          left: 0,
          right: 0
        };
      }

      setState({
        variant,
        device,
        orientation: width > height ? Orientation.Landscape : Orientation.Portrait,
        pointer,
        density,
        reducedMotion,
        highContrast,
        safeArea,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <AdaptiveContext.Provider value={state}>{children}</AdaptiveContext.Provider>;
};

export const useAdaptive = () => {
  const context = useContext(AdaptiveContext);
  if (!context) {
    throw new Error('useAdaptive must be used within an AdaptiveProvider');
  }
  return context;
};
