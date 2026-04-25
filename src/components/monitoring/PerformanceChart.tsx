import { useState, useMemo } from 'react';
import type { SystemMetric } from '../../lib/types';

interface PerformanceChartProps {
  data: SystemMetric[];
  label: string;
  color: string;
  height?: number;
}

export function PerformanceChart({ data, label, color, height = 200 }: PerformanceChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { points, linePath, areaPath, yLines } = useMemo(() => {
    if (data.length === 0) return { points: [], linePath: '', areaPath: '', yLines: [] };

    const pad = { top: 16, right: 12, bottom: 28, left: 40 };
    const w = 400;
    const h = 160;
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;

    const values = data.map((d) => Number(d.value));
    const maxV = Math.max(...values) * 1.15;

    const pts = data.map((d, i) => ({
      x: pad.left + (i / Math.max(data.length - 1, 1)) * innerW,
      y: pad.top + innerH - (Number(d.value) / maxV) * innerH,
      value: Number(d.value),
      time: d.recorded_at,
      unit: d.unit,
    }));

    const lPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const aPath = `${lPath} L ${pts[pts.length - 1].x} ${pad.top + innerH} L ${pts[0].x} ${pad.top + innerH} Z`;

    const lines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
      y: pad.top + innerH - pct * innerH,
      label: Math.round(pct * maxV).toString(),
    }));

    return { points: pts, linePath: lPath, areaPath: aPath, yLines: lines };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No data available
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full" onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id={`perf-fill-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yLines.map((line, i) => (
          <g key={i}>
            <line x1="40" y1={line.y} x2="388" y2={line.y} stroke="#f1f5f9" strokeWidth="0.5" />
            <text x="36" y={line.y + 1.5} textAnchor="end" className="text-[5px] fill-slate-400">{line.label}</text>
          </g>
        ))}

        {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((p, i) => (
          <text key={i} x={p.x} y="155" textAnchor="middle" className="text-[4.5px] fill-slate-400">
            {formatTime(p.time)}
          </text>
        ))}

        <path d={areaPath} fill={`url(#perf-fill-${label})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - 400 / points.length / 2}
              y={0}
              width={400 / points.length}
              height={160}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              className="cursor-crosshair"
            />
            {hovered === i && (
              <>
                <line x1={p.x} y1={16} x2={p.x} y2={132} stroke={color} strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5" />
                <circle cx={p.x} cy={p.y} r="2.5" fill="white" stroke={color} strokeWidth="1" />
              </>
            )}
          </g>
        ))}
      </svg>

      <div className="h-5 flex items-center justify-center">
        {hovered !== null ? (
          <span className="text-xs text-slate-600">
            <span className="font-medium text-slate-900">{points[hovered].value.toFixed(1)}{points[hovered].unit}</span>
            {' '}at {formatTime(points[hovered].time)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Hover to inspect</span>
        )}
      </div>
    </div>
  );
}
