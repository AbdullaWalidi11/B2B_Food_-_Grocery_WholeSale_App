// frontend/src/app/vendor/products/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Product, UnitOfMeasure } from '@/types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Loader2,
  Boxes,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const UOM_OPTIONS: { value: UnitOfMeasure; label: string; desc: string }[] = [
  { value: 'BOX', label: 'Koli', desc: '12x1L, 24x vb. koli ambalaj' },
  { value: 'SACK', label: 'Çuval', desc: '25kg, 50kg un/şeker/bakliyat' },
  { value: 'CASE', label: 'Kasa', desc: 'Meyve, sebze kasaları' },
  { value: 'KILOGRAM', label: 'Kilogram (Kg)', desc: 'Gramaj / ağırlık bazlı' },
  { value: 'PIECE', label: 'Adet / Teneke', desc: 'Tekil ambalaj veya teneke' },
];

const CATEGORIES = [
  'Un & Bakliyat',
  'Sıvı Yağlar & Margarin',
  'Süt & Şarküteri',
  'Konserve & Salça',
  'Sebze & Meyve',
  'Et & Tavuk Ürünleri',
  'Baharat & Soslar',
  'Temizlik & Hijyen',
  'Diğer',
];

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [uom, setUom] = useState<UnitOfMeasure>('BOX');
  const [moq, setMoq] = useState(1);
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(0);

  // Fetch Products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Product[]>('/catalog/my-products');
      setProducts(res.data || []);
    } catch {
      toast.error('Ürün listesi yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setSku('');
    setName('');
    setCategory(CATEGORIES[0]);
    setUom('BOX');
    setMoq(1);
    setBasePrice('');
    setStockQuantity(0);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setName(product.name);
    setCategory(product.category);
    setUom(product.uom);
    setMoq(product.moq);
    setBasePrice(Number(product.basePrice));
    setStockQuantity(Number(product.stockQuantity));
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (basePrice === '' || Number(basePrice) <= 0) {
      toast.error('Lütfen geçerli bir toptan taban fiyatı giriniz.');
      return;
    }
    if (stockQuantity === '' || Number(stockQuantity) < 0) {
      toast.error('Lütfen geçerli bir stok adedi giriniz.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      uom,
      moq: Number(moq),
      basePrice: Number(basePrice),
      stockQuantity: Number(stockQuantity),
    };

    try {
      if (editingProduct) {
        // Update existing product
        await api.patch(`/catalog/products/${editingProduct.id}`, payload);
        toast.success(`"${payload.name}" başarıyla güncellendi.`);
      } else {
        // Create new product
        await api.post('/catalog/products', payload);
        toast.success(`"${payload.name}" kataloğa eklendi.`);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'İşlem başarısız oldu. Bilgileri kontrol edin.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `"${product.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
    );
    if (!confirmed) return;

    try {
      await api.delete(`/catalog/products/${product.id}`);
      toast.success('Ürün katalogdan silindi.');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Ürün silinemedi. Sipariş bağlantısı olabilir.',
      );
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ürün Kataloğu & Envanter
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Toptan satışa sunduğunuz ürünleri, koli/çuval birimlerini ve stokları yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Ürün adı veya Stok Kodu (SKU) ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-52 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          >
            <option value="ALL">Tüm Kategoriler ({products.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Katalog yükleniyor...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-800">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Arama kriterlerine uygun ürün bulunamadı'
                : 'Katalogda henüz ürün bulunmuyor'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Filtreleri sıfırlayarak tekrar deneyebilirsiniz.'
                : 'Restoranların sipariş verebilmesi için ilk toptan ürününüzü ekleyin.'}
            </p>
            {!searchQuery && selectedCategory === 'ALL' && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                İlk Ürünü Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">SKU / Kod</th>
                  <th className="py-3 px-6">Ürün & Kategori</th>
                  <th className="py-3 px-6">Birim (UOM)</th>
                  <th className="py-3 px-6">Min. Sipariş (MOQ)</th>
                  <th className="py-3 px-6">Toptan Taban Fiyat</th>
                  <th className="py-3 px-6">Mevcut Stok</th>
                  <th className="py-3 px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const uomInfo = UOM_OPTIONS.find((opt) => opt.value === p.uom);
                  const isLowStock = p.stockQuantity <= 10 && p.stockQuantity > 0;
                  const isOutOfStock = p.stockQuantity === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* SKU */}
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {p.sku}
                        </span>
                      </td>

                      {/* Name & Category */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <span className="text-[11px] text-slate-400">{p.category}</span>
                      </td>

                      {/* UOM */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {uomInfo?.label || p.uom}
                        </span>
                      </td>

                      {/* MOQ */}
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {p.moq} {uomInfo?.label || 'Birim'}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {formatCurrency(Number(p.basePrice))}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? (
                            <>Tükendi</>
                          ) : (
                            <>
                              {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              {p.stockQuantity} {uomInfo?.label || ''}
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Düzenle"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Sil"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Ürünü Düzenle' : 'Yeni Toptan Ürün Ekle'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ürünün toptan satış birimini, asgari sipariş miktarını ve fiyatını belirleyin.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* SKU & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Kodu (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="UN-BAK-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Baklavalık Böreklik Un (50 Kg)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category & UOM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satış Birimi (UOM) *
                  </label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value as UnitOfMeasure)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {UOM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price, MOQ & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taban Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="850.00"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Asgari Sipariş (MOQ) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="5"
                    value={moq}
                    onChange={(e) => setMoq(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Miktarı *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="100"
                    value={stockQuantity}
                    onChange={(e) =>
                      setStockQuantity(e.target.value === '' ? '' : parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingProduct ? (
                    'Güncelle'
                  ) : (
                    'Ürünü Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}