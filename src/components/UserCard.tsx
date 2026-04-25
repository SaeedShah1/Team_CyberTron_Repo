import { Pencil, Trash2, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';
import type { ManagedUser } from '../lib/types';

interface UserCardProps {
  user: ManagedUser;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{user.username}</h3>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <RoleBadge role={user.role} />
        <StatusBadge status={user.status} />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="w-3 h-3" />
        <span>Last login: {formatDate(user.last_login)}</span>
      </div>
    </div>
  );
}
