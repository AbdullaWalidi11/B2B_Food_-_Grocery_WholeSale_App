// frontend/src/app/vendor/orders/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Truck,
  Box,
  Ban,
  Clock,
  MapPin,
  FileText,
  X,
  Loader2,
  RefreshCw,
  Building2,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  PENDING_APPROVAL: {
    label: 'Onay Bekliyor',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Clock,
  },
  SUBMITTED: {
    label: 'Yeni Sipariş',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Hazırlanıyor',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: Box,
  },
  SHIPPED: {
    label: 'Sevkiyatta',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Teslim Edildi',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'İptal Edildi',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: Ban,
  },
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Fetch Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Order[]>('/orders/vendor-orders');
      setOrders(res.data || []);
    } catch {
      toast.error('Sipariş listesi alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update Status Handler
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'CANCELLED') {
      const confirmed = window.confirm(
        'Bu siparişi iptal etmek istediğinize emin misiniz? Ürün stokları otomatik olarak iade edilecek ve restoranın cari borcu düşülecektir.',
      );
      if (!confirmed) return;
    }

    setIsUpdatingStatus(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(
        `Sipariş durumu "${STATUS_CONFIG[newStatus].label}" olarak güncellendi.`,
      );

      // Local update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Sipariş durumu güncellenemedi.',
      );
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        selectedStatusTab === 'ALL' || order.status === selectedStatusTab;

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, selectedStatusTab]);

  // Counts for Tabs
  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length,
      SUBMITTED: orders.filter((o) => o.status === 'SUBMITTED').length,
      PROCESSING: orders.filter((o) => o.status === 'PROCESSING').length,
      SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length,
      DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gelen Siparişler & Sevkiyat
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Restoranlardan gelen cari hesaplı toptan siparişleri hazırlayın ve sevkiyat durumunu güncelleyin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {[
          { key: 'ALL', label: 'Tüm Siparişler' },
          { key: 'SUBMITTED', label: 'Yeni Gelenler' },
          { key: 'PROCESSING', label: 'Hazırlanıyor' },
          { key: 'SHIPPED', label: 'Sevkiyatta' },
          { key: 'DELIVERED', label: 'Tamamlandı' },
          { key: 'CANCELLED', label: 'İptal Edilenler' },
        ].map((tab) => {
          const count = statusCounts[tab.key as keyof typeof statusCounts] || 0;
          const isActive = selectedStatusTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedStatusTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Sipariş ID (#...) veya restoran adı ile ara..."
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
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-800">
              {searchQuery || selectedStatusTab !== 'ALL'
                ? 'Arama kriterine uygun sipariş bulunamadı'
                : 'Henüz gelen sipariş bulunmuyor'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Bağlı restoranlarınız cari limitleri üzerinden sipariş verdiğinde anında burada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Sipariş ID</th>
                  <th className="py-3 px-6">Restoran (Müşteri)</th>
                  <th className="py-3 px-6">Tarih</th>
                  <th className="py-3 px-6">İçerik (Kalem)</th>
                  <th className="py-3 px-6">Toplam Tutar</th>
                  <th className="py-3 px-6">Durum</th>
                  <th className="py-3 px-6 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.SUBMITTED;
                  const StatusIcon = statusInfo.icon;
                  const isBusy = isUpdatingStatus === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Order ID */}
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">
                          {order.company?.name || 'Restoran'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[200px]">
                            {order.company?.shippingAddress || 'Adres belirtilmemiş'}
                          </span>
                        </div>
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Quick Lifecycle Buttons */}
                          {order.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <Box className="w-3.5 h-3.5" />
                              İşleme Al
                            </button>
                          )}

                          {order.status === 'PROCESSING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Sevkiyata Çıkar
                            </button>
                          )}

                          {order.status === 'SHIPPED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Teslim Edildi
                            </button>
                          )}

                          {/* Details Button */}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            title="Sipariş Detayı"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border border-slate-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Cancel Button (Only if not already delivered or cancelled) */}
                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                              disabled={isBusy}
                              title="Siparişi İptal Et (Stok & Borç İadesi)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-slate-200 hover:border-rose-200"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sipariş #{selectedOrder.id.slice(0, 8)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
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
              {/* Customer & Delivery Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                    Restoran / Müşteri
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {selectedOrder.company?.name || 'Müşteri'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    VKN: {selectedOrder.company?.taxNumber || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                    Teslimat Adresi
                  </span>
                  <p className="text-xs text-slate-700 mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedOrder.company?.shippingAddress || 'Adres kaydı yok'}</span>
                  </p>
                </div>
              </div>

              {/* Status Timeline Bar */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-3">
                  Sipariş Yaşam Döngüsü:
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
                            ? 'bg-slate-50 text-slate-400 border-slate-200'
                            : isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {STATUS_CONFIG[step as OrderStatus].label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Sipariş Kalemleri & Fiyatlandırma:
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
                    Cari Hesaba Yansıtılan Tutar
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    KDV dahil toplam fatura bedeli
                  </p>
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(Number(selectedOrder.totalAmount))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'SUBMITTED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5" />
                    Hazırlığa Başla
                  </button>
                )}
                {selectedOrder.status === 'PROCESSING' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Sevkiyata Ver
                  </button>
                )}
                {selectedOrder.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Teslimatı Onayla
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}