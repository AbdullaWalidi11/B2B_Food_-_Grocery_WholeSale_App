// frontend/src/app/buyer/suppliers/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BuyerVendorAccount } from '@/types';
import {
  Store,
  Search,
  CreditCard,
  ArrowRight,
  Clock,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BuyerSuppliersPage() {
  const [accounts, setAccounts] = useState<BuyerVendorAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch connected distributors & credit limits
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<BuyerVendorAccount[]>('/company/my-vendor-accounts');
      setAccounts(res.data || []);
    } catch {
      toast.error('Tedarikçi bilgileri alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filtered Suppliers
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.toLowerCase();
      return (
        acc.vendor.name.toLowerCase().includes(q) ||
        acc.vendor.taxNumber.includes(q) ||
        acc.priceSheetName.toLowerCase().includes(q)
      );
    });
  }, [accounts, searchQuery]);

  // Totals
  const totalCreditLimit = accounts.reduce(
    (sum, a) => sum + Number(a.creditLimit || 0),
    0,
  );
  const totalCurrentDebt = accounts.reduce(
    (sum, a) => sum + Number(a.currentBalance || 0),
    0,
  );
  const totalAvailableCredit = accounts.reduce(
    (sum, a) => sum + Number(a.availableCredit || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Anlaşmalı Toptancılar & Tedarikçiler
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cari hesap tanımlı distribütörleriniz, açık kredi limitleriniz ve özel iskonto listeleriniz.
          </p>
        </div>
        <button
          onClick={fetchAccounts}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Aggregate Credit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Kullanılabilir Kredi
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalAvailableCredit)}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Hemen sipariş verebileceğiniz bakiye
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Güncel Açık Cari Borç
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalCurrentDebt)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Vadeli ödeme bekleyen faturalar
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Kredi Tavanı
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalCreditLimit)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {accounts.length} toptancı tarafından tanımlanan tavan
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Toptancı adı, vergi numarası veya fiyat listesi ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
          Tedarikçiler yükleniyor...
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-800">
            {searchQuery
              ? 'Aramanıza uygun toptancı bulunamadı'
              : 'Henüz anlaşmalı toptancınız bulunmuyor'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'Arama terimini değiştirerek tekrar deneyebilirsiniz.'
              : 'Gıda distribütörünüz işletmeniz için Cari Hesap ve Kredi Limiti tanımladığında burada listelenecektir.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((acc) => {
            const utilization =
              acc.creditLimit > 0
                ? Math.min(
                    100,
                    Math.round((acc.currentBalance / acc.creditLimit) * 100),
                  )
                : 0;
            const isNearLimit = utilization >= 85;
            const isLimitReached = acc.availableCredit <= 0;

            return (
              <div
                key={acc.relationshipId}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Vendor Name & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-bold shrink-0">
                        <Store className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-tight">
                          {acc.vendor.name}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          VKN: {acc.vendor.taxNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contract Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="w-3 h-3" />
                      {acc.netTermsDays} Gün Vade
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileSpreadsheet className="w-3 h-3" />
                      {acc.priceSheetName}
                    </span>
                  </div>

                  {/* Cari Credit Utilization Bar */}
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Kalan Kredi Limiti:
                      </span>
                      <span
                        className={`font-bold ${
                          isLimitReached ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(acc.availableCredit)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLimitReached
                            ? 'bg-rose-500'
                            : isNearLimit
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${utilization}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Borç: {formatCurrency(acc.currentBalance)}</span>
                      <span>Limit: {formatCurrency(acc.creditLimit)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={`/buyer/catalog/${acc.vendor.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    Kataloğu Aç & Sipariş Ver
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}