import { useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import type { ErrorLog, LogLevel } from '../../lib/types';

interface ErrorLogFeedProps {
  logs: ErrorLog[];
}

const levelConfig: Record<LogLevel, { icon: typeof AlertOctagon; color: string; bg: string; label: string }> = {
  error: { icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50', label: 'ERR' },
  warn: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'WRN' },
  info: { icon: Info, color: 'text-sky-600', bg: 'bg-sky-50', label: 'INF' },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function LogEntry({ log }: { log: ErrorLog }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = levelConfig[log.level] ?? levelConfig.info;
  const Icon = config.icon;

  const handleCopy = () => {
    const text = log.stack_trace || log.message;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group hover:bg-slate-50/50 transition-colors">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-1.5 rounded-lg ${config.bg} shrink-0 mt-0.5`}>
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="text-sm text-slate-800 font-mono leading-snug flex-1 min-w-0 truncate">
              {log.message}
            </p>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-slate-400">{log.service}</span>
            <span className="text-[10px] text-slate-400">{formatDate(log.created_at)} {formatTime(log.created_at)}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 ml-[44px] animate-fade-in">
          {log.stack_trace && (
            <div className="relative">
              <pre className="text-xs font-mono text-slate-600 bg-slate-900 text-slate-300 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {log.stack_trace}
              </pre>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
          {Object.keys(log.metadata).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(log.metadata).map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600"
                >
                  {key}: {String(val)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorLogFeed({ logs }: ErrorLogFeedProps) {
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');

  const filtered = filterLevel === 'all' ? logs : logs.filter((l) => l.level === filterLevel);

  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100">
        {(['all', 'error', 'warn', 'info'] as const).map((lvl) => {
          const count = lvl === 'all' ? logs.length : logs.filter((l) => l.level === lvl).length;
          return (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                filterLevel === lvl
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {lvl === 'all' ? 'All' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No logs matching filter</div>
        ) : (
          filtered.map((log) => <LogEntry key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
