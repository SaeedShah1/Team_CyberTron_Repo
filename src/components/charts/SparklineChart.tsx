import { useState, useMemo } from 'react';

interface DataPoint {
  date: string;
  count: number;
}

interface SparklineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  fillColor?: string;
}

export function SparklineChart({
  data,
  height = 180,
  color = '#0ea5e9',
  fillColor = '#e0f2fe',
}: SparklineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { points, areaPath, linePath, maxVal } = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: '', linePath: '', maxVal: 0 };

    const padding = { top: 20, right: 16, bottom: 30, left: 16 };
    const w = 100;
    const h = 100;
    const innerW = w - padding.left - padding.right;
    const innerH = h - padding.top - padding.bottom;

    const maxV = Math.max(...data.map((d) => d.count), 1);
    const pts = data.map((d, i) => ({
      x: padding.left + (i / Math.max(data.length - 1, 1)) * innerW,
      y: padding.top + innerH - (d.count / maxV) * innerH,
      ...d,
    }));

    const lPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const aPath = `${lPath} L ${pts[pts.length - 1].x} ${padding.top + innerH} L ${pts[0].x} ${padding.top + innerH} Z`;

    return { points: pts, areaPath: aPath, linePath: lPath, maxVal: maxV };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No data available
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#sparkFill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="0.8" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - 100 / points.length / 2}
              y={0}
              width={100 / points.length}
              height={100}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              className="cursor-crosshair"
            />
            {hovered === i && (
              <>
                <line x1={p.x} y1={20} x2={p.x} y2={70} stroke={color} strokeWidth="0.3" strokeDasharray="1 1" />
                <circle cx={p.x} cy={p.y} r="1.5" fill="white" stroke={color} strokeWidth="0.6" />
              </>
            )}
          </g>
        ))}
      </svg>

      {hovered !== null && (
        <div className="flex items-center justify-center gap-2 -mt-4">
          <span className="text-xs text-slate-500">{formatDate(points[hovered].date)}</span>
          <span className="text-xs font-semibold text-slate-900">
            {points[hovered].count} user{points[hovered].count !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {hovered === null && (
        <div className="flex items-center justify-center -mt-4">
          <span className="text-xs text-slate-400">
            Hover to inspect {'\u00b7'} Peak: {maxVal}
          </span>
        </div>
      )}
    </div>
  );
}
