'use client';

import { useState } from 'react';
import { ChevronDown, MapPin, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { KUWAIT_REGIONS } from '@/lib/data/kuwait-regions';
import type { GovernorateData, NeighborhoodData } from '@/lib/data/kuwait-regions';

interface NeighborhoodSelectorProps {
  onSelect: (governorate: GovernorateData, neighborhood: NeighborhoodData) => void;
  selectedGovernorate?: GovernorateData | null;
  selectedNeighborhood?: NeighborhoodData | null;
}

// Two-step geographical selector:
// Step 1: Pick a governorate (محافظة)
// Step 2: Pick a neighborhood (منطقة) within that governorate.
//
// This two-step approach is critical for the geographical fencing logic:
// the user's neighborhood_id and governorate_id are stored on signup
// and used in every RLS policy to scope their feed.
export default function NeighborhoodSelector({
  onSelect,
  selectedGovernorate,
  selectedNeighborhood,
}: NeighborhoodSelectorProps) {
  const [step, setStep] = useState<1 | 2>(selectedGovernorate ? 2 : 1);
  const [activeGov, setActiveGov] = useState<GovernorateData | null>(selectedGovernorate ?? null);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');

  function handleGovernorateClick(gov: GovernorateData) {
    setActiveGov(gov);
    setNeighborhoodSearch('');
    setStep(2);
  }

  function handleNeighborhoodClick(nh: NeighborhoodData) {
    if (!activeGov) return;
    onSelect(activeGov, nh);
  }

  // Filter neighborhoods by search query (English or Arabic name)
  const filteredNeighborhoods = activeGov?.neighborhoods.filter(nh =>
    nh.name_en.toLowerCase().includes(neighborhoodSearch.toLowerCase()) ||
    nh.name_ar.includes(neighborhoodSearch)
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* ── Step indicator ──────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setStep(1)}
          className={clsx(
            'flex items-center gap-1.5 font-medium transition-colors',
            step === 1 ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <span className={clsx(
            'w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold',
            step === 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
          )}>1</span>
          Governorate
        </button>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 -rotate-90" />
        <span className={clsx(
          'flex items-center gap-1.5 font-medium',
          step === 2 ? 'text-brand-700' : 'text-gray-400'
        )}>
          <span className={clsx(
            'w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold',
            step === 2 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
          )}>2</span>
          Neighborhood
        </span>
      </div>

      {/* ── Step 1: Governorate grid ─────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-2">
          {KUWAIT_REGIONS.map(gov => (
            <button
              key={gov.code}
              onClick={() => handleGovernorateClick(gov)}
              className={clsx(
                'p-3 rounded-xl border-2 text-left transition-all hover:border-brand-400',
                activeGov?.code === gov.code
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              )}
            >
              <p className="font-semibold text-sm text-gray-900">{gov.name_en}</p>
              <p className="text-xs text-gray-500 mt-0.5">{gov.name_ar}</p>
              <p className="text-xs text-gray-400 mt-1">
                {gov.neighborhoods.length} neighborhoods
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2: Neighborhood list ────────────────────────── */}
      {step === 2 && activeGov && (
        <div>
          {/* Back button + governorate name */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              ← Back
            </button>
            <span className="text-sm font-semibold text-gray-700">{activeGov.name_en}</span>
          </div>

          {/* Search within governorate */}
          <input
            type="text"
            placeholder="Search neighborhoods…"
            value={neighborhoodSearch}
            onChange={e => setNeighborhoodSearch(e.target.value)}
            className="input mb-3"
          />

          {/* Neighborhood list */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {filteredNeighborhoods.map(nh => {
              const isSelected = selectedNeighborhood?.name_en === nh.name_en;
              return (
                <button
                  key={nh.name_en}
                  onClick={() => handleNeighborhoodClick(nh)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className={clsx('w-3.5 h-3.5 flex-shrink-0', isSelected ? 'text-brand-600' : 'text-gray-400')} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{nh.name_en}</p>
                      <p className="text-xs text-gray-500">{nh.name_ar}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Selection summary ────────────────────────────────── */}
      {selectedGovernorate && selectedNeighborhood && (
        <div className="flex items-center gap-2 text-sm bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
          <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <span>
            <span className="font-semibold text-brand-700">{selectedNeighborhood.name_en}</span>
            <span className="text-gray-500"> · {selectedGovernorate.name_en}</span>
          </span>
        </div>
      )}
    </div>
  );
}
