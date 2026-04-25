import { Pencil, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Product } from '../../lib/types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

export function ProductCard({ product, onEdit, onDelete, onToggleStatus }: ProductCardProps) {
  const isActive = product.status === 'active';

  return (
    <div className={`bg-white rounded-xl border transition-all hover:shadow-md ${isActive ? 'border-slate-100' : 'border-slate-100 opacity-75'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-slate-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">{product.name}</h3>
              <p className="text-xs text-slate-500">{product.category}</p>
            </div>
          </div>
          <span className="text-base font-bold text-slate-900 shrink-0">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>

        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{product.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {product.sku && (
            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-mono text-slate-500">
              {product.sku}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-[10px] text-slate-400">
            Stock: {product.stock}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <button
            onClick={() => onToggleStatus(product)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'text-emerald-700 hover:bg-emerald-50'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {isActive ? 'Active' : 'Inactive'}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(product)}
              className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(product)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
