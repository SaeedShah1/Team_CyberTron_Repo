import { Search, SlidersHorizontal, X, DollarSign } from 'lucide-react';
import { useState } from 'react';
import type { ProductFilters, ProductStatus } from '../../lib/types';

interface ProductFilterPanelProps {
  filters: ProductFilters;
  categories: string[];
  onChange: (filters: ProductFilters) => void;
}

const statuses: (ProductStatus | 'all')[] = ['all', 'active', 'inactive'];

export function ProductFilterPanel({ filters, categories, onChange }: ProductFilterPanelProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeFilterCount =
    (filters.category !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0);

  const clearFilters = () => {
    onChange({
      ...filters,
      category: 'all',
      status: 'all',
      priceMin: '',
      priceMax: '',
    });
  };

  return (
    <>
      {/* Search + filter toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            activeFilterCount > 0
              ? 'border-sky-200 bg-sky-50 text-sky-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile slide-in / desktop inline panel */}
      {panelOpen && (
        <>
          {/* Mobile overlay */}
          <div className="sm:hidden fixed inset-0 z-40" onClick={() => setPanelOpen(false)}>
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </div>
          <div className="sm:hidden fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <FilterFields
                filters={filters}
                categories={categories}
                onChange={onChange}
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Desktop inline */}
          <div className="hidden sm:block p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
              <FilterFields
                filters={filters}
                categories={categories}
                onChange={onChange}
                inline
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="self-end px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function FilterFields({
  filters,
  categories,
  onChange,
  inline,
}: {
  filters: ProductFilters;
  categories: string[];
  onChange: (f: ProductFilters) => void;
  inline?: boolean;
}) {
  const containerClass = inline ? 'flex-1 flex items-end gap-4' : 'space-y-4';

  return (
    <div className={containerClass}>
      <div className={inline ? 'flex-1' : ''}>
        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Category</label>
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className={inline ? 'flex-1' : ''}>
        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ProductStatus | 'all' })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className={inline ? 'flex-1' : ''}>
        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Price Range</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="0"
              step="1"
              value={filters.priceMin}
              onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
              placeholder="Min"
              className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
          <span className="text-slate-400 text-xs">to</span>
          <div className="relative flex-1">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="0"
              step="1"
              value={filters.priceMax}
              onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
              placeholder="Max"
              className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
