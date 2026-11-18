// frontend/src/app/vendor/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order, Product, CustomerRelationship } from '@/types';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  PackagePlus,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function VendorDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        api.get<Order[]>('/orders/vendor-orders'),
        api.get<Product[]>('/catalog/my-products'),
        api.get<CustomerRelationship[]>('/company/my-customers'),
      ]);

      setOrders(ordersRes.data || []);
      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch {
      toast.error('Kontrol paneli verileri alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Metric Computations
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'SUBMITTED' || o.status === 'PROCESSING',
  ).length;

  const lowStockCount = products.filter(
    (p) => p.stockQuantity !== undefined && p.stockQuantity <= 10,
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Distribütör Kontrol Paneli
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Toptan gıda satışları, cari hesap bakiyeleri ve sipariş durumu özeti.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            <PackagePlus className="w-4 h-4" />
            Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Ciro
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalRevenue)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Onaylanan ve teslim edilen tüm siparişler
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bekleyen Siparişler
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {pendingOrdersCount}
            </h3>
            <p className="text-xs text-slate-400 mt-1">İşlem ve sevkiyat bekliyor</p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cari Müşteriler
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {customers.length}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Kayıtlı restoran / işletme</p>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kritik Stok Uyarısı
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{lowStockCount}</h3>
            <p className="text-xs text-rose-500 mt-1 font-medium">10 adetin altındaki ürünler</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Son Gelen Siparişler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Restoranlardan gelen cari hesap üzerinden verilen son talepler
            </p>
          </div>
          <Link
            href="/vendor/orders"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            Tümünü Gör
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Veriler yükleniyor...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Henüz sipariş bulunmuyor
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Müşterileriniz sipariş verdiğinde burada listelenecektir.
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
                  <th className="py-3 px-6">Kalem Sayısı</th>
                  <th className="py-3 px-6">Tutar</th>
                  <th className="py-3 px-6">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6 text-slate-900 font-semibold">
                      {order.company?.name || 'Restoran'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {order.items?.length || 0} Kalem
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : order.status === 'PROCESSING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : order.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}