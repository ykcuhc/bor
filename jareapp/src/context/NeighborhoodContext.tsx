'use client';

import { createContext, useContext, useState } from 'react';
import type { GovernorateData, NeighborhoodData } from '@/lib/data/kuwait-regions';
import { KUWAIT_REGIONS } from '@/lib/data/kuwait-regions';

interface NeighborhoodContextValue {
  selectedGovernorate: GovernorateData | null;
  selectedNeighborhood: NeighborhoodData | null;
  setLocation: (gov: GovernorateData, nh: NeighborhoodData) => void;
  reset: () => void;
}

const NeighborhoodContext = createContext<NeighborhoodContextValue | undefined>(undefined);

// Default to Salmiya / Hawalli for demo purposes
const DEFAULT_GOV = KUWAIT_REGIONS.find(g => g.code === 'hawalli')!;
const DEFAULT_NH  = DEFAULT_GOV.neighborhoods[0];

export function NeighborhoodProvider({ children }: { children: React.ReactNode }) {
  const [selectedGovernorate, setGov] = useState<GovernorateData | null>(DEFAULT_GOV);
  const [selectedNeighborhood, setNH]  = useState<NeighborhoodData | null>(DEFAULT_NH);

  function setLocation(gov: GovernorateData, nh: NeighborhoodData) {
    setGov(gov);
    setNH(nh);
  }

  function reset() {
    setGov(null);
    setNH(null);
  }

  return (
    <NeighborhoodContext.Provider value={{ selectedGovernorate, selectedNeighborhood, setLocation, reset }}>
      {children}
    </NeighborhoodContext.Provider>
  );
}

export function useNeighborhood() {
  const ctx = useContext(NeighborhoodContext);
  if (!ctx) throw new Error('useNeighborhood must be used within NeighborhoodProvider');
  return ctx;
}
