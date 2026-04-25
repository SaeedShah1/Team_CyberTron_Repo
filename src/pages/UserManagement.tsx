import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { FilterBar } from '../components/FilterBar';
import { UserTable } from '../components/UserTable';
import { UserCard } from '../components/UserCard';
import { Pagination } from '../components/Pagination';
import { UserModal } from '../components/UserModal';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { EmptyState } from '../components/EmptyState';
import type { ManagedUser, UserFormData } from '../lib/types';

export function UserManagement() {
  const {
    users,
    loading,
    totalCount,
    page,
    totalPages,
    filters,
    setPage,
    setFilters,
    createUser,
    updateUser,
    deleteUser,
    refetch,
  } = useUsers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const handleCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSave = async (data: UserFormData) => {
    if (editingUser) {
      await updateUser(editingUser.id, data);
    } else {
      await createUser(data);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteUser(deleteTarget.id);
    }
  };

  const hasFilters = filters.search !== '' || filters.role !== 'all' || filters.status !== 'all';

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage team members and their access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCreate}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total Users', value: totalCount, color: 'bg-slate-900' },
          { label: 'Active', value: users.filter((u) => u.status === 'active').length, color: 'bg-emerald-600' },
          { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: 'bg-rose-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${stat.color}`} />
              <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading users...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div className="hidden md:block">
              <UserTable users={users} onEdit={handleEdit} onDelete={setDeleteTarget} />
            </div>
            <div className="md:hidden p-4 space-y-3">
              {users.map((user) => (
                <UserCard key={user.id} user={user} onEdit={handleEdit} onDelete={setDeleteTarget} />
              ))}
            </div>
            <div className="border-t border-slate-100 px-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={handleCreate}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/25 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <UserModal
        open={modalOpen}
        user={editingUser}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        userName={deleteTarget?.username ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
