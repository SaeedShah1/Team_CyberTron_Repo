import { Calendar } from 'lucide-react';
import type { DateRange } from '../lib/types';

interface DashboardFilterBarProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

export function DashboardFilterBar({ dateRange, onChange }: DashboardFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
      <div className="flex items-center bg-slate-100 rounded-xl p-1">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              dateRange === r.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
