import { Users } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        {hasFilters ? 'No users found' : 'No users yet'}
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        {hasFilters
          ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
          : 'Get started by creating your first user. Click the button above to add one.'}
      </p>
    </div>
  );
}
