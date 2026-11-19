// frontend/src/app/buyer/orders/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import {
  Clock,
  CheckCircle2,
  Truck,
  Box,
  Ban,
  Search,
  FileText,
  X,
  Store,
  ShoppingBag,
  ArrowRight,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any; stepIndex: number }
> = {
  PENDING_APPROVAL: {
    label: 'Onay Bekliyor',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Clock,
    stepIndex: 0,
  },
  SUBMITTED: {
    label: 'Sipariş İletildi',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
    stepIndex: 0,
  },
  PROCESSING: {
    label: 'Depoda Hazırlanıyor',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: Box,
    stepIndex: 1,
  },
  SHIPPED: {
    label: 'Sevkiyatta (Yolda)',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: Truck,
    stepIndex: 2,
  },
  DELIVERED: {
    label: 'Teslim Edildi',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
    stepIndex: 3,
  },
  CANCELLED: {
    label: 'İptal Edildi',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: Ban,
    stepIndex: -1,
  },
};

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch Buyer Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Order[]>('/orders/my-orders');
      setOrders(res.data || []);
    } catch {
      toast.error('Sipariş geçmişi yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.vendor?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedStatusTab === 'ALL') return matchesSearch;
      if (selectedStatusTab === 'ACTIVE') {
        return (
          matchesSearch &&
          (order.status === 'SUBMITTED' ||
            order.status === 'PROCESSING' ||
            order.status === 'SHIPPED')
        );
      }
      return matchesSearch && order.status === selectedStatusTab;
    });
  }, [orders, searchQuery, selectedStatusTab]);

  // Aggregate Numbers
  const totalSpent = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const activeOrdersCount = orders.filter(
    (o) =>
      o.status === 'SUBMITTED' ||
      o.status === 'PROCESSING' ||
      o.status === 'SHIPPED',
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sipariş Geçmişim & Sevkiyat Takibi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Toptancılarınıza verdiğiniz tüm siparişleri, sevkiyat durumunu ve cari faturaları inceleyin.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Yoldaki & Hazırlanan
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{activeOrdersCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Teslimatı beklenen sevkiyat</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Sipariş Sayısı
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{orders.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Verilen tüm toptan alımlar</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Toptan Alım Tutarı
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</h3>
            <p className="text-xs text-slate-400 mt-1">Cari hesaba yansıyan toplam tutar</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {[
          { key: 'ALL', label: 'Tüm Siparişler' },
          { key: 'ACTIVE', label: 'Yoldaki & Hazırlananlar' },
          { key: 'DELIVERED', label: 'Teslim Edilenler' },
          { key: 'CANCELLED', label: 'İptal Edilenler' },
        ].map((tab) => {
          const isActive = selectedStatusTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedStatusTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Sipariş ID (#...) veya toptancı adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Siparişler yükleniyor...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-800">
              {searchQuery || selectedStatusTab !== 'ALL'
                ? 'Aramanıza uygun sipariş bulunamadı'
                : 'Henüz verilmiş bir siparişiniz bulunmuyor'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedStatusTab !== 'ALL'
                ? 'Filtreleri sıfırlayarak tekrar deneyebilirsiniz.'
                : 'Tedarikçilerinizin ürün kataloğunu inceleyerek mutfağınız için ilk siparişinizi verin.'}
            </p>
            {!searchQuery && selectedStatusTab === 'ALL' && (
              <Link
                href="/buyer/suppliers"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
              >
                <Store className="w-4 h-4" />
                Tedarikçilere Git
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Sipariş ID</th>
                  <th className="py-3 px-6">Toptancı (Tedarikçi)</th>
                  <th className="py-3 px-6">Tarih</th>
                  <th className="py-3 px-6">Kalem Sayısı</th>
                  <th className="py-3 px-6">Fatura Tutarı</th>
                  <th className="py-3 px-6">Sevkiyat Durumu</th>
                  <th className="py-3 px-6 text-right">Detaylar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.SUBMITTED;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Order ID */}
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Vendor Info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">
                          {order.vendor?.name || 'Toptancı'}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Cari Hesaba Mahsup
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Items Preview */}
                      <td className="py-4 px-6 text-xs">
                        <span className="font-semibold text-slate-800">
                          {order.items?.length || 0} Kalem Ürün
                        </span>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {order.items?.map((i) => i.product?.name).join(', ')}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Detail Button */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer border border-slate-200 hover:border-emerald-200"
                        >
                          İncele
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER DETAIL & TRACKER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Sipariş Detayı #{selectedOrder.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tedarikçi: {selectedOrder.vendor?.name} • {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Live Stepper Tracker */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-4">
                  Canlı Sevkiyat Durumu
                </span>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                  {['SUBMITTED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((step, idx) => {
                    const orderStatusIndex = [
                      'SUBMITTED',
                      'PROCESSING',
                      'SHIPPED',
                      'DELIVERED',
                    ].indexOf(selectedOrder.status);
                    const isPassed = orderStatusIndex >= idx;
                    const isCurrent = orderStatusIndex === idx;

                    return (
                      <div
                        key={step}
                        className={`py-2 px-2 rounded-xl border text-[11px] transition-all ${
                          selectedOrder.status === 'CANCELLED'
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {STATUS_CONFIG[step as OrderStatus].label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Itemized Invoice Table */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Sipariş Edilen Ürünler
                </span>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Ürün Adı</th>
                        <th className="py-2.5 px-4">Birim Fiyat</th>
                        <th className="py-2.5 px-4">Adet</th>
                        <th className="py-2.5 px-4 text-right">Ara Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item) => {
                        const lineTotal =
                          Number(item.priceAtPurchase) * Number(item.quantity);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">
                                {item.product?.name}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400">
                                {item.product?.sku} • {item.product?.uom}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {formatCurrency(Number(item.priceAtPurchase))}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 text-right">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Cari Hesaba Yansıtılan Toplam
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    KDV Dahil • Vadeli Cari Fatura
                  </p>
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(Number(selectedOrder.totalAmount))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}