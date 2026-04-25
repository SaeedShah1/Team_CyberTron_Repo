import { LogIn, UserPlus, Pencil, Trash2, Shield, ToggleRight } from 'lucide-react';
import type { ActivityLog, ActivityAction } from '../lib/types';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

const actionConfig: Record<ActivityAction, { icon: typeof LogIn; color: string; bg: string }> = {
  login: { icon: LogIn, color: 'text-sky-600', bg: 'bg-sky-50' },
  created: { icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  updated: { icon: Pencil, color: 'text-amber-600', bg: 'bg-amber-50' },
  deleted: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  role_changed: { icon: Shield, color: 'text-sky-600', bg: 'bg-sky-50' },
  status_changed: { icon: ToggleRight, color: 'text-slate-600', bg: 'bg-slate-100' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-slate-400">
        No recent activity
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {activities.map((activity, i) => {
        const config = actionConfig[activity.action] ?? actionConfig.updated;
        const Icon = config.icon;
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-4 hover:bg-slate-50/50 transition-colors"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-snug">{activity.description}</p>
              <p className="text-xs text-slate-400 mt-0.5">{timeAgo(activity.created_at)}</p>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 shrink-0 mt-0.5">
              {activity.action.replace('_', ' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
