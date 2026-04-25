import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Product } from '../../lib/types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
}

export function ProductTable({ products, onEdit, onDelete, onToggleStatus }: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Stock</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">SKU</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((product) => {
            const isActive = product.status === 'active';
            return (
              <tr key={product.id} className={`group hover:bg-slate-50/50 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                <td className="py-3 px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[240px]">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-slate-500 truncate max-w-[240px]">{product.description}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600">
                    {product.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(product.price, product.currency)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  <span className={`text-sm ${product.stock === 0 ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-3 px-4 text-center hidden xl:table-cell">
                  <span className="text-xs font-mono text-slate-500">
                    {product.sku || '--'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onToggleStatus(product)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {isActive ? (
                      <ToggleRight className="w-3.5 h-3.5" />
                    ) : (
                      <ToggleLeft className="w-3.5 h-3.5" />
                    )}
                    {isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
