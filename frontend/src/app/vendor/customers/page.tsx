// frontend/src/app/vendor/customers/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CustomerRelationship } from '@/types';
import {
  Users,
  UserPlus,
  Search,
  Building2,
  CreditCard,
  Calendar,
  Edit2,
  Loader2,
  X,
  RefreshCw,
  FileSpreadsheet,
  Plus,
  Receipt,
  Banknote,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface BuyerCompany {
  id: string;
  name: string;
  taxNumber: string;
  taxOffice: string;
  shippingAddress: string;
  billingAddress: string;
}

interface PriceSheet {
  id: string;
  name: string;
}

const NET_TERM_OPTIONS = [
  { value: 15, label: '15 Gün Vade' },
  { value: 30, label: '30 Gün Vade (Standart)' },
  { value: 45, label: '45 Gün Vade' },
  { value: 60, label: '60 Gün Vade' },
  { value: 90, label: '90 Gün Vade (VIP)' },
];

export default function VendorCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRelationship[]>([]);
  const [allBuyers, setAllBuyers] = useState<BuyerCompany[]>([]);
  const [priceSheets, setPriceSheets] = useState<PriceSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<CustomerRelationship | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerRelationship | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // Create Form Fields
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [selectedPriceSheetId, setSelectedPriceSheetId] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | ''>(50000);
  const [netTermsDays, setNetTermsDays] = useState(30);

  // Edit Form Fields
  const [editCreditLimit, setEditCreditLimit] = useState<number | ''>(0);
  const [editNetTermsDays, setEditNetTermsDays] = useState(30);
  const [editPriceSheetId, setEditPriceSheetId] = useState('');

  // Payment Form Fields
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');

  // Fetch all required data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [customersRes, buyersRes, sheetsRes] = await Promise.all([
        api.get<CustomerRelationship[]>('/company/my-customers'),
        api.get<BuyerCompany[]>('/company/buyers'),
        api.get<PriceSheet[]>('/catalog/price-sheets'),
      ]);

      setCustomers(customersRes.data || []);
      setAllBuyers(buyersRes.data || []);
      setPriceSheets(sheetsRes.data || []);

      if (sheetsRes.data?.length > 0) {
        setSelectedPriceSheetId(sheetsRes.data[0].id);
      }
    } catch {
      toast.error('Müşteri ve cari veriler alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick-create a default Price Sheet if the vendor has none
  const handleCreateDefaultPriceSheet = async () => {
    setIsCreatingSheet(true);
    try {
      const res = await api.post('/catalog/price-sheets', {
        name: 'Standart Toptan Liste',
      });
      const newSheet = res.data;
      setPriceSheets((prev) => [...prev, newSheet]);
      setSelectedPriceSheetId(newSheet.id);
      toast.success('"Standart Toptan Liste" başarıyla oluşturuldu.');
    } catch {
      toast.error('Fiyat listesi oluşturulamadı.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Unconnected buyers eligible to be added
  const availableBuyers = useMemo(() => {
    const existingIds = new Set(customers.map((c) => c.company.id));
    return allBuyers.filter((b) => !existingIds.has(b.id));
  }, [allBuyers, customers]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (availableBuyers.length > 0) {
      setSelectedBuyerId(availableBuyers[0].id);
    } else {
      setSelectedBuyerId('');
    }
    if (priceSheets.length > 0) {
      setSelectedPriceSheetId(priceSheets[0].id);
    }
    setCreditLimit(50000);
    setNetTermsDays(30);
    setIsCreateModalOpen(true);
  };

  // Submit Create Relationship
  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyerId) {
      toast.error('Lütfen bir restoran / alıcı işletme seçiniz.');
      return;
    }
    if (!selectedPriceSheetId) {
      toast.error('Lütfen müşteriye atanacak bir fiyat listesi seçiniz.');
      return;
    }
    if (creditLimit === '' || Number(creditLimit) < 0) {
      toast.error('Lütfen geçerli bir cari kredi limiti giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/company/relationships', {
        companyId: selectedBuyerId,
        creditLimit: Number(creditLimit),
        netTermsDays: Number(netTermsDays),
        priceSheetId: selectedPriceSheetId,
      });

      toast.success('Restoran cari hesabınıza başarıyla bağlandı.');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cari ilişki oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (rel: CustomerRelationship) => {
    setEditingCustomer(rel);
    setEditCreditLimit(rel.creditLimit);
    setEditNetTermsDays(rel.netTermsDays);
    setEditPriceSheetId(rel.priceSheet.id);
    setIsEditModalOpen(true);
  };

  // Submit Edit Relationship
  const handleEditRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (editCreditLimit === '' || Number(editCreditLimit) < 0) {
      toast.error('Geçerli bir kredi limiti giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/company/relationship/${editingCustomer.id}`, {
        creditLimit: Number(editCreditLimit),
        netTermsDays: Number(editNetTermsDays),
        priceSheetId: editPriceSheetId,
      });

      toast.success('Cari hesap ve kredi limitleri güncellendi.');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız oldu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (rel: CustomerRelationship) => {
    setPaymentCustomer(rel);
    setPaymentAmount(rel.currentBalance > 0 ? rel.currentBalance : '');
    setPaymentNote('Garanti Bankası Havale / EFT');
    setIsPaymentModalOpen(true);
  };

  // Submit Payment / Tahsilat
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;

    if (paymentAmount === '' || Number(paymentAmount) <= 0) {
      toast.error('Lütfen geçerli bir tahsilat tutarı giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/company/relationship/${paymentCustomer.id}/payment`, {
        amount: Number(paymentAmount),
        note: paymentNote,
      });

      toast.success(
        `${formatCurrency(Number(paymentAmount))} tahsilat başarıyla işlendi ve cari borç düşüldü!`,
      );
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tahsilat işlenemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const totalAllocatedCredit = customers.reduce((sum, c) => sum + Number(c.creditLimit || 0), 0);
  const totalOutstandingDebt = customers.reduce((sum, c) => sum + Number(c.currentBalance || 0), 0);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.company.name.toLowerCase().includes(q) ||
        c.company.taxNumber.includes(q) ||
        c.priceSheet.name.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cari Hesaplar & Müşteri Portföyü
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Restoran müşterilerinizin kredi limitlerini, açık vadeli borçlarını ve tahsilatlarını yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
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
            <UserPlus className="w-4 h-4" />
            Yeni Cari Tanımla
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Cari Müşteri
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{customers.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Kredili çalışan restoran</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Açılan Kredi Hacmi
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalAllocatedCredit)}</h3>
            <p className="text-xs text-slate-400 mt-1">Tanımlanan toplam cari tavan</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Alacak (Açık Borç)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalOutstandingDebt)}</h3>
            <p className="text-xs text-slate-400 mt-1">Tahsilat bekleyen vadeli bakiye</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Restoran adı, vergi numarası veya fiyat listesi ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Cari hesaplar yükleniyor...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-800">
              {searchQuery ? 'Aramanıza uygun müşteri bulunamadı' : 'Henüz cari hesap tanımlanmamış'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Platforma kayıtlı restoranlara kredi limiti tanımlayarak sipariş vermelerini sağlayın.
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                İlk Müşteriyi Bağla
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Restoran / Alıcı</th>
                  <th className="py-3 px-6">Vade & Fiyat Listesi</th>
                  <th className="py-3 px-6">Cari Kredi Limiti</th>
                  <th className="py-3 px-6">Güncel Borç (Bakiye)</th>
                  <th className="py-3 px-6">Kalan Kullanılabilir</th>
                  <th className="py-3 px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((c) => {
                  const utilization =
                    c.creditLimit > 0
                      ? Math.min(100, Math.round((c.currentBalance / c.creditLimit) * 100))
                      : 0;
                  const isNearLimit = utilization >= 85;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Company Info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{c.company.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>VKN: {c.company.taxNumber}</span>
                          <span>•</span>
                          <span>{c.company.taxOffice} V.D.</span>
                        </div>
                      </td>

                      {/* Terms & Price Sheet */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {c.netTermsDays} Gün Vade
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                            {c.priceSheet.name}
                          </span>
                        </div>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {formatCurrency(c.creditLimit)}
                      </td>

                      {/* Current Balance / Utilization */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">
                          {formatCurrency(c.currentBalance)}
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isNearLimit ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          %{utilization} kullanım
                        </span>
                      </td>

                      {/* Available Credit */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.availableCredit <= 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isNearLimit
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {c.availableCredit <= 0 ? (
                            <>Limit Doldu</>
                          ) : (
                            formatCurrency(c.availableCredit)
                          )}
                        </span>
                      </td>

                      {/* Actions: Tahsilat Gir + Düzenle */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleOpenPaymentModal(c)}
                            title="Tahsilat / Ödeme Girişi"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Tahsilat Gir
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(c)}
                            title="Cari Limiti Düzenle"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border border-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Düzenle
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

      {/* TAHSİLAT & ÖDEME GİRİŞİ MODAL */}
      {isPaymentModalOpen && paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tahsilat / Ödeme Kaydı</h3>
                <p className="text-xs text-slate-400 mt-0.5">{paymentCustomer.company.name}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {/* Current Debt Card */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-amber-800 font-semibold block">Mevcut Açık Borç:</span>
                  <span className="text-[10px] text-amber-700">Tahsilat bekleyen cari bakiye</span>
                </div>
                <span className="text-base font-bold text-amber-950">
                  {formatCurrency(paymentCustomer.currentBalance)}
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Tahsil Edilen Tutar (₺) *
                  </label>
                  {paymentCustomer.currentBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(paymentCustomer.currentBalance)}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Tümünü Kapat ({formatCurrency(paymentCustomer.currentBalance)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="15000.00"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Note / Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Açıklama / Dekont No (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Garanti Bankası EFT Dekont #98432"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Projected Balance */}
              {paymentAmount !== '' && Number(paymentAmount) > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Tahsilat Sonrası Kalan Borç:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(Math.max(0, paymentCustomer.currentBalance - Number(paymentAmount)))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Yeni Kullanılabilir Limit:</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(paymentCustomer.creditLimit - Math.max(0, paymentCustomer.currentBalance - Number(paymentAmount)))}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || paymentAmount === ''}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Tahsilatı Onayla'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE RELATIONSHIP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Yeni Restoran Cari Hesabı Tanımla</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Restorana kredi limiti ve vadeli ödeme koşulu atayın.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRelationship} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restoran / Alıcı İşletme *
                </label>
                {availableBuyers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Sistemde henüz cari hesabı açılmamış yeni bir restoran bulunmuyor.
                  </div>
                ) : (
                  <select
                    value={selectedBuyerId}
                    onChange={(e) => setSelectedBuyerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {availableBuyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (VKN: {b.taxNumber} - {b.taxOffice})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Fiyat Listesi *</label>
                  {priceSheets.length === 0 && (
                    <button
                      type="button"
                      disabled={isCreatingSheet}
                      onClick={handleCreateDefaultPriceSheet}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Standart Liste Oluştur
                    </button>
                  )}
                </div>

                {priceSheets.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 flex items-center justify-between">
                    <span>Henüz fiyat listesi yok.</span>
                    <button
                      type="button"
                      onClick={handleCreateDefaultPriceSheet}
                      disabled={isCreatingSheet}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                    >
                      {isCreatingSheet ? 'Oluşturuluyor...' : 'Hemen Oluştur'}
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedPriceSheetId}
                    onChange={(e) => setSelectedPriceSheetId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {priceSheets.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cari Kredi Limiti (₺) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    required
                    placeholder="50000"
                    value={creditLimit}
                    onChange={(e) =>
                      setCreditLimit(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vade Süresi *
                  </label>
                  <select
                    value={netTermsDays}
                    onChange={(e) => setNetTermsDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {NET_TERM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableBuyers.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Cari Hesabı Başlat'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RELATIONSHIP MODAL */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cari Koşulları Güncelle</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingCustomer.company.name}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRelationship} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Kredi Limiti (₺) *
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  value={editCreditLimit}
                  onChange={(e) =>
                    setEditCreditLimit(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vade Süresi (Gün) *
                </label>
                <select
                  value={editNetTermsDays}
                  onChange={(e) => setEditNetTermsDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {NET_TERM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fiyat Listesi Ataması
                </label>
                <select
                  value={editPriceSheetId}
                  onChange={(e) => setEditPriceSheetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {priceSheets.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Değişiklikleri Kaydet'
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