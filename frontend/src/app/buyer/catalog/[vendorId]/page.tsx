// frontend/src/app/buyer/catalog/[vendorId]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/use-cart-store';
import { Product, BuyerVendorAccount } from '@/types';
import {
  ArrowLeft,
  Store,
  CreditCard,
  Clock,
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Tag,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BuyerCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params?.vendorId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [account, setAccount] = useState<BuyerVendorAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Local Quantities state: Record<productId, quantity>
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Cart Store
  const { addItem, items: cartItems, getTotalAmount, getTotalItems } = useCartStore();

  // Fetch Catalog & Account
  useEffect(() => {
    if (!vendorId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, accountsRes] = await Promise.all([
          api.get<Product[]>(`/catalog/buyer/vendor/${vendorId}/products`),
          api.get<BuyerVendorAccount[]>('/company/my-vendor-accounts'),
        ]);

        const fetchedProducts = productsRes.data || [];
        setProducts(fetchedProducts);

        // Find this vendor's Cari Account
        const matchingAccount = accountsRes.data?.find(
          (a) => a.vendor.id === vendorId,
        );
        setAccount(matchingAccount || null);

        // Initialize quantities with product MOQ
        const initialQty: Record<string, number> = {};
        fetchedProducts.forEach((p) => {
          initialQty[p.id] = p.moq || 1;
        });
        setQuantities(initialQty);
      } catch {
        toast.error('Katalog ürünleri yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vendorId]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Adjust Quantity
  const handleQtyChange = (productId: string, moq: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || moq;
      const next = current + delta;
      return {
        ...prev,
        [productId]: next < moq ? moq : next,
      };
    });
  };

  // Add to Cart Handler
  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || product.moq || 1;
    const vendorName = account?.vendor.name || 'Toptancı';

    const success = addItem(product, qty, vendorId, vendorName);
    if (success) {
      toast.success(
        `${qty} adet "${product.name}" sepete eklendi!`,
      );
    }
  };

  // Check if items from this vendor are in cart
  const vendorCartCount = cartItems.filter(
    (i) => i.product.vendorId === vendorId,
  ).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Back Link */}
      <div>
        <Link
          href="/buyer/suppliers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tüm Tedarikçilere Dön
        </Link>
      </div>

      {/* Distributor Info & Contract Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {account?.vendor.name || 'Toptan Ürün Kataloğu'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                VKN: {account?.vendor.taxNumber || '-'} • Doğrudan Distribütör Fiyatları
              </p>
            </div>
          </div>

          {/* Cari & Price Sheet Badges */}
          {account ? (
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Kalan Cari Limit
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {formatCurrency(account.availableCredit)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Ödeme Vadesi
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {account.netTermsDays} Gün
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Uygulanan Liste
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {account.priceSheetName}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Standart toptan taban fiyatları görüntüleniyor.
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Ürün adı veya Stok Kodu (SKU) ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tümü ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          Ürünler yükleniyor...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-800">
            Katalogda ürün bulunamadı
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Filtreleri sıfırlayarak tekrar deneyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const currentQty = quantities[p.id] || p.moq || 1;
            const isOutOfStock = p.stockQuantity === 0;
            const price = p.effectivePrice ?? Number(p.basePrice);

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Discount Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {p.category}
                    </span>
                    {p.hasDiscount && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Tag className="w-3 h-3" />
                        %{p.discountPercentage} İndirimli
                      </span>
                    )}
                  </div>

                  {/* Product Name & SKU */}
                  <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="font-mono text-[10px] text-slate-400 mt-1">
                    SKU: {p.sku} • {p.uom}
                  </p>

                  {/* Pricing Display */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(price)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        / {p.uom}
                      </span>
                    </div>

                    {p.hasDiscount && (
                      <p className="text-xs text-slate-400 line-through mt-0.5">
                        Taban: {formatCurrency(Number(p.basePrice))}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>Asgari Sipariş (MOQ):</span>
                      <span className="font-semibold text-slate-700">
                        {p.moq} {p.uom}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Stepper + Add Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  {/* Stepper */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <button
                      type="button"
                      disabled={isOutOfStock || currentQty <= p.moq}
                      onClick={() => handleQtyChange(p.id, p.moq, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-800">
                      {currentQty} {p.uom}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleQtyChange(p.id, p.moq, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(p)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isOutOfStock ? (
                      'Tükendi'
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Sepete Ekle ({formatCurrency(price * currentQty)})
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {vendorCartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Sepetinizde {getTotalItems()} Ürün Var
                </p>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">
                  Toplam: {formatCurrency(getTotalAmount())}
                </p>
              </div>
            </div>

            <Link
              href="/buyer/cart"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              Sepete Git
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}