import { Shield, CreditCard as Edit3, Eye } from 'lucide-react';
import type { UserRole } from '../lib/types';

const roleConfig: Record<UserRole, { bg: string; text: string; icon: typeof Shield }> = {
  admin: { bg: 'bg-rose-50', text: 'text-rose-700', icon: Shield },
  editor: { bg: 'bg-sky-50', text: 'text-sky-700', icon: Edit3 },
  viewer: { bg: 'bg-slate-50', text: 'text-slate-600', icon: Eye },
};

export function RoleBadge({ role }: { role: UserRole }) {
  const config = roleConfig[role];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}
