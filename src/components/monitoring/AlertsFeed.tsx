import { AlertTriangle, AlertCircle, Info, CheckCircle, ArrowUpRight } from 'lucide-react';
import type { SystemAlert, AlertSeverity } from '../../lib/types';

interface AlertsFeedProps {
  alerts: SystemAlert[];
  onResolve: (id: string) => void;
}

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  info: { icon: Info, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AlertsFeed({ alerts, onResolve }: AlertsFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
        <p className="text-sm text-slate-500">All clear -- no active alerts</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity];
        const Icon = config.icon;
        return (
          <div key={alert.id} className="p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alert.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                    {timeAgo(alert.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border ${config.bg} ${config.color} ${config.border}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-slate-400">{alert.source}</span>
                  {alert.resolved ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle className="w-3 h-3" /> Resolved
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => onResolve(alert.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Resolve
                      </button>
                      <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-amber-600 hover:bg-amber-50 transition-colors">
                        <ArrowUpRight className="w-3 h-3" /> Escalate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
