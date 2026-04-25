import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Product, ProductFormData, ProductFilters } from '../lib/types';

const PAGE_SIZE = 10;

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  categories: string[];
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    status: 'all',
    priceMin: '',
    priceMax: '',
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));
    if (filters.search) params.set('search', filters.search);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.priceMin) params.set('priceMin', filters.priceMin);
    if (filters.priceMax) params.set('priceMax', filters.priceMax);

    try {
      const res = await api.get<ProductsResponse>(`/products?${params}`);
      setProducts(res.data);
      setTotalCount(res.total ?? 0);
      setCategories(res.categories ?? []);
    } catch {
      setProducts([]);
      setTotalCount(0);
    }

    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const createProduct = async (formData: ProductFormData) => {
    await api.post('/products', formData);
    await fetchProducts();
  };

  const updateProduct = async (id: string, formData: ProductFormData) => {
    await api.put(`/products/${id}`, formData);
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/products/${id}`);
    await fetchProducts();
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await api.put(`/products/${id}`, { status: newStatus });
    await fetchProducts();
  };

  return {
    products,
    loading,
    totalCount,
    page,
    totalPages,
    categories,
    filters,
    setPage,
    setFilters,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
    refetch: fetchProducts,
  };
}
