import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { ManagedUser, UserFormData, Filters } from '../lib/types';

const PAGE_SIZE = 10;

interface UsersResponse {
  data: ManagedUser[];
  total: number;
  page: number;
  limit: number;
}

export function useUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    role: 'all',
    status: 'all',
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));
    if (filters.search) params.set('search', filters.search);
    if (filters.role !== 'all') params.set('role', filters.role);
    if (filters.status !== 'all') params.set('status', filters.status);

    try {
      const res = await api.get<UsersResponse>(`/users?${params}`);
      setUsers(res.data);
      setTotalCount(res.total ?? 0);
    } catch {
      setUsers([]);
      setTotalCount(0);
    }

    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const createUser = async (formData: UserFormData) => {
    await api.post('/users', formData);
    await fetchUsers();
  };

  const updateUser = async (id: string, formData: UserFormData) => {
    await api.put(`/users/${id}`, formData);
    await fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/users/${id}`);
    await fetchUsers();
  };

  return {
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
    refetch: fetchUsers,
  };
}
