import { useState } from 'react';

interface GaugeCardProps {
  label: string;
  value: number;
  unit: string;
  maxValue?: number;
  icon: React.ReactNode;
  color: string;
  detail?: string;
}

function getStatusColor(value: number, max: number): string {
  const pct = (value / max) * 100;
  if (pct >= 90) return '#ef4444';
  if (pct >= 75) return '#f59e0b';
  return '#10b981';
}

export function GaugeCard({ label, value, unit, maxValue = 100, icon, color, detail }: GaugeCardProps) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.min((value / maxValue) * 100, 100);
  const statusColor = unit === '%' ? getStatusColor(value, maxValue) : color;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all duration-200 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-50 group-hover:scale-105 transition-transform" style={{ color }}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: statusColor }}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50" cy="50" r={radius}
              fill="none" stroke="#f1f5f9" strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={statusColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-900">{value}</span>
            <span className="text-[10px] text-slate-400">{unit}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Usage</span>
                <span className="text-xs font-medium text-slate-700">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: statusColor }}
                />
              </div>
            </div>
            {detail && (
              <p className={`text-xs text-slate-500 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-70'}`}>
                {detail}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
