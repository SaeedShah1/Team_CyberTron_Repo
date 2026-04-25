import { useState } from 'react';

interface Bar {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  bars: Bar[];
  height?: number;
}

export function BarChart({ bars, height = 200 }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxValue = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {bars.map((bar, i) => {
          const barHeight = (bar.value / maxValue) * (height - 32);
          const isHovered = hovered === i;
          return (
            <div
              key={bar.label}
              className="flex-1 flex flex-col items-center gap-1 cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className={`text-xs font-medium transition-opacity duration-150 ${
                  isHovered ? 'opacity-100 text-slate-900' : 'opacity-0'
                }`}
              >
                {bar.value}
              </span>
              <div
                className="w-full rounded-t-lg transition-all duration-200"
                style={{
                  height: barHeight,
                  backgroundColor: bar.color,
                  opacity: hovered !== null && !isHovered ? 0.4 : 1,
                  transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 sm:gap-3 mt-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 text-center">
            <span className="text-[10px] sm:text-xs text-slate-500 truncate block">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
