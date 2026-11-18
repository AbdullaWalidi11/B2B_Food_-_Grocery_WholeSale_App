// frontend/src/app/vendor/price-sheets/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Save,
  CheckCircle2,
  Percent,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw,
  Building2,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

interface PriceSheetSummary {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    items: number;
    relationships: number;
  };
}

interface PriceSheetDetail {
  id: string;
  name: string;
  items: {
    id: string;
    productId: string;
    contractedPrice: number;
    product: Product;
  }[];
  relationships: {
    company: {
      id: string;
      name: string;
      taxNumber: string;
    };
  }[];
}

export default function VendorPriceSheetsPage() {
  const [sheets, setSheets] = useState<PriceSheetSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [selectedSheetDetail, setSelectedSheetDetail] = useState<PriceSheetDetail | null>(null);

  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Sheet Modal / State
  const [newSheetName, setNewSheetName] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // In-Memory Contracted Price State: Map<productId, contractedPrice>
  const [priceMap, setPriceMap] = useState<Record<string, number | ''>>({});

  // Search & Bulk Discount
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkPercent, setBulkPercent] = useState<number | ''>('');

  // 1. Initial Load: Fetch Sheets and Vendor Products
  const fetchInitialData = async () => {
    setIsLoadingSheets(true);
    try {
      const [sheetsRes, productsRes] = await Promise.all([
        api.get<PriceSheetSummary[]>('/catalog/price-sheets'),
        api.get<Product[]>('/catalog/my-products'),
      ]);

      const fetchedSheets = sheetsRes.data || [];
      setSheets(fetchedSheets);
      setProducts(productsRes.data || []);

      if (fetchedSheets.length > 0 && !selectedSheetId) {
        setSelectedSheetId(fetchedSheets[0].id);
      }
    } catch {
      toast.error('Fiyat listeleri veya ürünler yüklenirken hata oluştu.');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 2. Fetch Detail when selected sheet changes
  const fetchSheetDetail = async (sheetId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await api.get<PriceSheetDetail>(`/catalog/price-sheets/${sheetId}`);
      setSelectedSheetDetail(res.data);

      // Pre-fill priceMap with existing contracted prices or base prices
      const initialMap: Record<string, number> = {};
      res.data.items?.forEach((item) => {
        initialMap[item.productId] = Number(item.contractedPrice);
      });
      setPriceMap(initialMap);
    } catch {
      toast.error('Fiyat listesi detayları alınamadı.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedSheetId) {
      fetchSheetDetail(selectedSheetId);
    }
  }, [selectedSheetId]);

  // Create New Price Sheet
  const handleCreateSheet = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;

    setIsCreatingSheet(true);
    try {
      const res = await api.post('/catalog/price-sheets', {
        name: newSheetName.trim(),
      });
      toast.success(`"${newSheetName}" fiyat listesi oluşturuldu.`);
      setNewSheetName('');
      await fetchInitialData();
      setSelectedSheetId(res.data.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Fiyat listesi oluşturulamadı.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Update a single product's custom price in state
  const handlePriceChange = (productId: string, val: string) => {
    if (val === '') {
      setPriceMap((prev) => ({ ...prev, [productId]: '' }));
    } else {
      const num = parseFloat(val);
      setPriceMap((prev) => ({ ...prev, [productId]: isNaN(num) ? '' : num }));
    }
  };

  // Bulk Apply % Discount across all products
  const handleApplyBulkDiscount = () => {
    if (bulkPercent === '' || Number(bulkPercent) <= 0 || Number(bulkPercent) >= 100) {
      toast.error('Lütfen %1 ile %99 arasında geçerli bir indirim yüzdesi girin.');
      return;
    }

    const ratio = (100 - Number(bulkPercent)) / 100;
    const newMap: Record<string, number> = {};

    products.forEach((p) => {
      const discounted = Math.round(Number(p.basePrice) * ratio * 100) / 100;
      newMap[p.id] = discounted;
    });

    setPriceMap(newMap);
    toast.success(`Tüm ürünlere %${bulkPercent} indirim uygulandı. Kaydetmeyi unutmayın!`);
    setBulkPercent('');
  };

  // Reset to Base Prices
  const handleResetToBase = () => {
    const newMap: Record<string, number> = {};
    products.forEach((p) => {
      newMap[p.id] = Number(p.basePrice);
    });
    setPriceMap(newMap);
    toast.info('Tüm fiyatlar standart toptan taban fiyatlara eşitlendi.');
  };

  // Save Contract Prices (PUT /catalog/price-sheets/:id/items)
  const handleSavePrices = async () => {
    if (!selectedSheetId) return;

    // Collect items that have a defined price > 0
    const items = Object.entries(priceMap)
      .filter(([_, price]) => price !== '' && Number(price) > 0)
      .map(([productId, contractedPrice]) => ({
        productId,
        contractedPrice: Number(contractedPrice),
      }));

    if (items.length === 0) {
      toast.error('Lütfen en az bir ürün için geçerli fiyat giriniz.');
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/catalog/price-sheets/${selectedSheetId}/items`, { items });
      toast.success('Özel sözleşmeli fiyatlar başarıyla kaydedildi!');
      fetchSheetDetail(selectedSheetId);
      // Refresh summaries
      const sheetsRes = await api.get<PriceSheetSummary[]>('/catalog/price-sheets');
      setSheets(sheetsRes.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Fiyatlar kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Products for Matrix
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Özel Fiyat Listeleri & İskonto Matrisi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Müşteri gruplarınıza özel sözleşmeli fiyatlar ve iskonto oranları tanımlayın.
          </p>
        </div>
        <button
          onClick={fetchInitialData}
          disabled={isLoadingSheets}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Price Sheets Master List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Fiyat Listesi Grupları
            </h2>

            {/* Create New Sheet Form */}
            <form onSubmit={handleCreateSheet} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Örn: Tier 1 VIP Lokantalar"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isCreatingSheet}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {isCreatingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Oluştur
                </button>
              </div>
            </form>

            {/* Sheets List */}
            {isLoadingSheets ? (
              <div className="p-8 text-center text-xs text-slate-400">Yükleniyor...</div>
            ) : sheets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Henüz bir fiyat listesi yok. Yukarıdan ilk listenizi oluşturun.
              </div>
            ) : (
              <div className="space-y-2 max-h-125 overflow-y-auto pr-1">
                {sheets.map((sheet) => {
                  const isSelected = selectedSheetId === sheet.id;
                  return (
                    <button
                      key={sheet.id}
                      onClick={() => setSelectedSheetId(sheet.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                          {sheet.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {sheet._count?.items || 0} Özel Fiyat
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {sheet._count?.relationships || 0} Müşteri
                          </span>
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned Restaurants Box */}
          {selectedSheetDetail && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Bu Listeyi Kullanan Restoranlar ({selectedSheetDetail.relationships?.length || 0})
              </h3>
              {selectedSheetDetail.relationships?.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Bu fiyat listesi henüz hiçbir restorana atanmamış. Cari Hesaplar sayfasından atayabilirsiniz.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedSheetDetail.relationships.map((rel) => (
                    <div key={rel.company.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <p className="font-semibold text-slate-800">{rel.company.name}</p>
                      <p className="text-[10px] text-slate-400">VKN: {rel.company.taxNumber}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Price Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            {/* Matrix Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase text-emerald-600 tracking-wider">
                  Aktif Liste
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedSheetDetail?.name || 'Fiyat Listesi Seçin'}
                </h2>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSavePrices}
                disabled={isSaving || !selectedSheetId || products.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Fiyatları Kaydet
              </button>
            </div>

            {/* Matrix Toolbar (Search & Bulk Discount) */}
            <div className="p-4 bg-slate-50/75 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ürün veya SKU ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Bulk Discount Tools */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="% İndirim"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-16 text-xs font-semibold outline-none py-0.5"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkDiscount}
                    className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Uygula
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetToBase}
                  title="Tüm fiyatları taban toptan fiyatlara eşitle"
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer font-medium"
                >
                  Sıfırla
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            {isLoadingDetail ? (
              <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                Fiyat matrisi yükleniyor...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Katalogda ürün bulunmuyor. Önce Ürün Kataloğu sayfasından ürün ekleyin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-5">Ürün & SKU</th>
                      <th className="py-3 px-5">Birim (UOM)</th>
                      <th className="py-3 px-5">Standart Taban Fiyat</th>
                      <th className="py-3 px-5 w-44">Özel Sözleşmeli Fiyat (₺)</th>
                      <th className="py-3 px-5 text-right">Fark / İndirim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProducts.map((product) => {
                      const base = Number(product.basePrice);
                      const customPriceVal = priceMap[product.id];
                      const customPriceNum = customPriceVal === '' ? base : Number(customPriceVal ?? base);

                      // Calculate diff
                      const diff = customPriceNum - base;
                      const percentDiff = base > 0 ? (diff / base) * 100 : 0;
                      const isDiscount = diff < -0.01;
                      const isMarkup = diff > 0.01;

                      return (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Product Info */}
                          <td className="py-3.5 px-5">
                            <p className="font-semibold text-slate-900">{product.name}</p>
                            <span className="font-mono text-[10px] text-slate-400">
                              {product.sku} • {product.category}
                            </span>
                          </td>

                          {/* UOM */}
                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {product.uom}
                            </span>
                          </td>

                          {/* Base Price */}
                          <td className="py-3.5 px-5 font-semibold text-slate-600">
                            {formatCurrency(base)}
                          </td>

                          {/* Contracted Price Input */}
                          <td className="py-3.5 px-5">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">₺</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={customPriceVal !== undefined ? customPriceVal : base}
                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                className={`w-full pl-6 pr-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                  isDiscount
                                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 focus:border-emerald-500'
                                    : isMarkup
                                    ? 'bg-amber-50/60 border-amber-300 text-amber-900 focus:border-amber-500'
                                    : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                                } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                              />
                            </div>
                          </td>

                          {/* Diff Badge */}
                          <td className="py-3.5 px-5 text-right">
                            {isDiscount ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                %{Math.abs(percentDiff).toFixed(1)} İndirim
                              </span>
                            ) : isMarkup ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                +%{percentDiff.toFixed(1)} Artış
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Standart Taban</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}