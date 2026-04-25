import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import type { Filters, UserRole, UserStatus } from '../lib/types';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const roles: (UserRole | 'all')[] = ['all', 'admin', 'editor', 'viewer'];
const statuses: (UserStatus | 'all')[] = ['all', 'active', 'inactive', 'suspended'];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = filters.role !== 'all' || filters.status !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by name or email..."
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
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            hasActiveFilters
              ? 'border-sky-200 bg-sky-50 text-sky-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">
              {(filters.role !== 'all' ? 1 : 0) + (filters.status !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fade-in">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
            <select
              value={filters.role}
              onChange={(e) => onChange({ ...filters, role: e.target.value as UserRole | 'all' })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value as UserStatus | 'all' })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => onChange({ ...filters, role: 'all', status: 'all' })}
              className="self-end px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
