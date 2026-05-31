'use client';

import { useState } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Category, Condition } from '@/types';
import { cn, formatKWD } from '@/lib/utils';

const CATEGORIES: Category[] = ['Women', 'Men', 'Kids', 'Home', 'Beauty', 'Electronics', 'Pets', 'Garden'];

const SUB_CATEGORIES: Record<string, string[]> = {
  Women:       ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Handbags', 'Jewelry', 'Abayas', 'Activewear'],
  Men:         ['Shirts', 'T-Shirts', 'Pants', 'Shorts', 'Outerwear', 'Sneakers', 'Formal Shoes', 'Accessories'],
  Kids:        ['Girls (0-12)', 'Boys (0-12)', 'Teens', 'Baby', 'Shoes', 'Pyjamas & Sleepwear'],
  Home:        ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Lighting', 'Storage'],
  Beauty:      ['Skincare', 'Makeup', 'Fragrance', 'Hair', 'Nails', 'Tools'],
  Electronics: ['Phones', 'Tablets', 'Laptops', 'Accessories', 'Cameras', 'Audio'],
  Pets:        ['Dogs', 'Cats', 'Small Animals', 'Accessories', 'Food & Treats'],
  Garden:      ['Plants', 'Pots', 'Tools', 'Outdoor Furniture', 'Seeds'],
};

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'NWT',       label: 'New With Tags' },
  { value: 'NWOT',      label: 'New Without Tags' },
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good',      label: 'Good' },
  { value: 'Fair',      label: 'Fair' },
];

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
const PRICE_PRESETS = [
  { label: 'Under 10 KWD',     min: 0,   max: 10  },
  { label: '10 – 50 KWD',      min: 10,  max: 50  },
  { label: '50 – 200 KWD',     min: 50,  max: 200 },
  { label: '200 – 500 KWD',    min: 200, max: 500 },
  { label: 'Over 500 KWD',     min: 500, max: undefined },
];

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterAccordion({ title, children, defaultOpen = true }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

interface FilterSidebarProps {
  className?: string;
}

export default function FilterSidebar({ className }: FilterSidebarProps) {
  const { filters, setFilters, resetFilters } = useStore();
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const activeFilterCount = [
    filters.category, filters.size, filters.condition,
    filters.minPrice, filters.maxPrice, filters.status,
  ].filter(Boolean).length;

  const subCats = filters.category ? SUB_CATEGORIES[filters.category] || [] : [];

  function applyCustomPrice() {
    setFilters({
      minPrice: customMin ? parseFloat(customMin) : undefined,
      maxPrice: customMax ? parseFloat(customMax) : undefined,
    });
  }

  const sidebar = (
    <div className="space-y-1">
      {/* Sort */}
      <FilterAccordion title="Sort By">
        {(['newest', 'price_asc', 'price_desc', 'most_liked'] as const).map(opt => {
          const labels: Record<string, string> = {
            newest:     'Just In',
            price_asc:  'Price: Low to High',
            price_desc: 'Price: High to Low',
            most_liked: 'Most Liked',
          };
          return (
            <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                checked={filters.sortBy === opt}
                onChange={() => setFilters({ sortBy: opt })}
                className="w-4 h-4 accent-brand-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">
                {labels[opt]}
              </span>
            </label>
          );
        })}
      </FilterAccordion>

      {/* Availability */}
      <FilterAccordion title="Availability">
        {(['available', 'sold'] as const).map(s => (
          <label key={s} className="flex items-center gap-2 py-1 cursor-pointer group">
            <input
              type="radio"
              name="status"
              checked={filters.status === s}
              onChange={() => setFilters({ status: s })}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors capitalize">
              {s === 'available' ? 'Available' : 'Sold'}
            </span>
          </label>
        ))}
        {filters.status && (
          <button
            onClick={() => setFilters({ status: undefined })}
            className="text-xs text-brand-600 hover:underline mt-1"
          >
            Clear
          </button>
        )}
      </FilterAccordion>

      {/* Category */}
      <FilterAccordion title="Department">
        <div className="space-y-0.5">
          {CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-2 py-1 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.category === cat}
                onChange={() => setFilters({ category: filters.category === cat ? undefined : cat, subCategory: undefined })}
                className="w-4 h-4 rounded accent-brand-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </FilterAccordion>

      {/* Sub-category (only shown when a category is selected) */}
      {subCats.length > 0 && (
        <FilterAccordion title="Category" defaultOpen={true}>
          <div className="space-y-0.5">
            {subCats.map(sub => (
              <label key={sub} className="flex items-center gap-2 py-1 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.subCategory === sub}
                  onChange={() => setFilters({ subCategory: filters.subCategory === sub ? undefined : sub })}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">{sub}</span>
              </label>
            ))}
          </div>
        </FilterAccordion>
      )}

      {/* Size */}
      <FilterAccordion title="Size">
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map(size => (
            <button
              key={size}
              onClick={() => setFilters({ size: filters.size === size ? undefined : size })}
              className={cn(
                'px-3 py-1 text-xs font-medium border rounded-full transition-all',
                filters.size === size
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-600'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterAccordion>

      {/* Condition */}
      <FilterAccordion title="Condition">
        <div className="space-y-0.5">
          {CONDITIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 py-1 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.condition === value}
                onChange={() => setFilters({ condition: filters.condition === value ? undefined : value })}
                className="w-4 h-4 rounded accent-brand-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </FilterAccordion>

      {/* Price */}
      <FilterAccordion title="Price (KWD)">
        <div className="space-y-1 mb-3">
          {PRICE_PRESETS.map(preset => {
            const active = filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => setFilters({ minPrice: preset.min, maxPrice: preset.max })}
                className={cn(
                  'w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors',
                  active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={customMin}
            onChange={e => setCustomMin(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={customMax}
            onChange={e => setCustomMax(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400"
          />
          <button
            onClick={applyCustomPrice}
            className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors"
          >
            Go
          </button>
        </div>
      </FilterAccordion>
    </div>
  );

  return (
    <>
      {/* ── Mobile trigger ─────────────────────────────────────────────── */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-sm text-brand-600 hover:underline">
                    Clear all
                  </button>
                )}
                <button onClick={() => setMobileOpen(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            {sidebar}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-6 w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
            >
              Show Results
            </button>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className={cn('hidden lg:block', className)}>
        <div className="sticky top-24">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all ({activeFilterCount})
              </button>
            )}
          </div>
          {sidebar}
        </div>
      </aside>
    </>
  );
}
