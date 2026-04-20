// Zustand store for DC/DR layout state management
import { create } from 'zustand';
import { LAYOUTS, SiteLayout } from '../data/layout';

export type SiteKey = 'DC' | 'DR';

interface UIState {
  // Current site selection
  site: SiteKey;
  
  // Canvas controls
  zoom: number;
  panX: number;
  panY: number;
  
  // Animation toggles
  showAirflow: boolean;
  showCoolingGlow: boolean;
  showBlinkingLights: boolean;
  showFanRotation: boolean;
  
  // Selection state
  selectedRackId: string | null;
  
  // Current layout (computed from site)
  layout: SiteLayout;
  
  // Actions
  setSite: (s: SiteKey) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  toggleAirflow: () => void;
  toggleCoolingGlow: () => void;
  toggleBlinkingLights: () => void;
  toggleFanRotation: () => void;
  selectRack: (id: string | null) => void;
  resetView: () => void;
}

export const useLayoutStore = create<UIState>((set, get) => ({
  // Initial state
  site: 'DC',
  zoom: 1,
  panX: 0,
  panY: 0,
  showAirflow: false,
  showCoolingGlow: false,
  showBlinkingLights: false,
  showFanRotation: false,
  selectedRackId: null,
  layout: LAYOUTS.DC,
  
  // Actions
  setSite: (s: SiteKey) => {
    set({ 
      site: s, 
      layout: s === 'DC' ? LAYOUTS.DC : LAYOUTS.DR,
      selectedRackId: null // Clear selection when switching sites
    });
  },
  
  setZoom: (z: number) => {
    // Clamp zoom between 0.3 and 3.0
    const clampedZoom = Math.max(0.3, Math.min(3.0, z));
    set({ zoom: clampedZoom });
  },
  
  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },
  
  toggleAirflow: () => {
    set({ showAirflow: !get().showAirflow });
  },
  
  toggleCoolingGlow: () => {
    set({ showCoolingGlow: !get().showCoolingGlow });
  },
  
  toggleBlinkingLights: () => {
    set({ showBlinkingLights: !get().showBlinkingLights });
  },
  
  toggleFanRotation: () => {
    set({ showFanRotation: !get().showFanRotation });
  },
  
  selectRack: (id: string | null) => {
    set({ selectedRackId: id });
  },
  
  resetView: () => {
    set({ 
      zoom: 1, 
      panX: 0, 
      panY: 0, 
      selectedRackId: null 
    });
  },
}));

// Selector hooks for optimized re-renders
export const useCurrentSite = () => useLayoutStore(state => state.site);
export const useCurrentLayout = () => useLayoutStore(state => state.layout);
export const useZoom = () => useLayoutStore(state => state.zoom);
export const usePan = () => useLayoutStore(state => ({ x: state.panX, y: state.panY }));
export const useAnimationToggles = () => useLayoutStore(state => ({
  showAirflow: state.showAirflow,
  showCoolingGlow: state.showCoolingGlow,
  showBlinkingLights: state.showBlinkingLights,
  showFanRotation: state.showFanRotation,
}));
export const useSelectedRack = () => useLayoutStore(state => state.selectedRackId);