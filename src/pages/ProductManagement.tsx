import { useState } from 'react';
import { Plus, RefreshCw, Package, DollarSign, BarChart3, Layers } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { ProductFilterPanel } from '../components/products/ProductFilterPanel';
import { ProductTable } from '../components/products/ProductTable';
import { ProductCard } from '../components/products/ProductCard';
import { ProductModal } from '../components/products/ProductModal';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { Pagination } from '../components/Pagination';
import type { Product, ProductFormData } from '../lib/types';

export function ProductManagement() {
  const {
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
    refetch,
  } = useProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSave = async (data: ProductFormData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    await toggleStatus(product.id, product.status);
  };

  const activeCount = products.filter((p) => p.status === 'active').length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const hasFilters = filters.search !== '' || filters.category !== 'all' || filters.status !== 'all' || filters.priceMin !== '' || filters.priceMax !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Listing</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your product catalog</p>
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
            Create Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <Package className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
            <p className="text-xs text-slate-500">Total Products</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{activeCount}</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-50">
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{categories.length}</p>
            <p className="text-xs text-slate-500">Categories</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50">
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalValue)}
            </p>
            <p className="text-xs text-slate-500">Inventory Value</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ProductFilterPanel filters={filters} categories={categories} onChange={setFilters} />

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading products...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {hasFilters ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              {hasFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first product.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <ProductTable
                products={products}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggleStatus={handleToggleStatus}
              />
            </div>

            {/* Mobile/Tablet cards */}
            <div className="md:hidden p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
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
      <ProductModal
        open={modalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        userName={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
