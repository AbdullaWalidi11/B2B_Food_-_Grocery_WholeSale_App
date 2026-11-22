// frontend/src/app/buyer/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";
import { useAuthStore } from "@/store/use-auth-store";
import { BuyerVendorAccount } from "@/types";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Store,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  MapPin,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function BuyerCartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    items,
    vendorId,
    vendorName,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalAmount,
    getTotalItems,
  } = useCartStore();

  const [account, setAccount] = useState<BuyerVendorAccount | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [shippingAddressType, setShippingAddressType] = useState<
    "SHIPPING" | "BILLING"
  >("SHIPPING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch distributor Cari Account info
  useEffect(() => {
    if (!vendorId) {
      setIsLoadingAccount(false);
      return;
    }

    const fetchAccount = async () => {
      try {
        const res = await api.get<BuyerVendorAccount[]>(
          "/company/my-vendor-accounts",
        );
        const match = res.data?.find((a) => a.vendor.id === vendorId);
        setAccount(match || null);
      } catch {
        toast.error("Cari hesap limiti bilgisi alınamadı.");
      } finally {
        setIsLoadingAccount(false);
      }
    };

    fetchAccount();
  }, [vendorId]);

  const totalAmount = getTotalAmount();
  const totalItemsCount = getTotalItems();

  // Credit Line Calculations
  const availableCredit = Number(account?.availableCredit ?? 0);
  const isCreditSufficient = !account || totalAmount <= availableCredit;
  const creditDeficit = totalAmount - availableCredit;
  const projectedRemainingCredit = Math.max(0, availableCredit - totalAmount);

  // Handle Order Submission
  const handlePlaceOrder = async () => {
    if (!vendorId || items.length === 0) return;

    if (account && !isCreditSufficient) {
      toast.error(
        "Sipariş tutarı kullanılabilir cari kredi limitinizi aşıyor.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/orders", {
        vendorId,
        shippingAddress: shippingAddressType,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });

      toast.success("Siparişiniz başarıyla alındı ve toptancınıza iletildi!");
      clearCart();
      setIsSubmitting(false);
      window.location.href = "/buyer/orders";
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Sipariş oluşturulamadı. Bilgileri kontrol edin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty State
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Alışveriş Sepetiniz Boş
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Toptancılarınızın ürün kataloglarını inceleyerek mutfağınız için
          gerekli toptan gıda ürünlerini sepetinize ekleyin.
        </p>
        <Link
          href="/buyer/suppliers"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
        >
          <Store className="w-4 h-4" />
          Anlaşmalı Tedarikçilere Göz At
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={vendorId ? `/buyer/catalog/${vendorId}` : "/buyer/suppliers"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kataloğa Geri Dön
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Toptan Sipariş Özeti & Onay
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Sepeti Temizle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Vendor Banner */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
                <Store className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                  Sipariş Verilen Tedarikçi
                </span>
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {vendorName || "Distribütör"}
                </p>
              </div>
            </div>

            {account && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3 h-3" />
                {account.netTermsDays} Gün Vade
              </span>
            )}
          </div>

          {/* Itemized Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Sipariş Kalemleri ({items.length} Kalem, {totalItemsCount}{" "}
                Birim)
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const lineTotal = item.effectivePrice * item.quantity;
                const isMOQ = item.quantity <= item.product.moq;

                return (
                  <div
                    key={item.product.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.product.sku}
                        </span>
                        <span className="text-xs text-slate-400">
                          • {item.product.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(item.effectivePrice)}
                        </span>
                        <span>/ {item.product.uom}</span>
                        {item.product.hasDiscount && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            İndirimli Fiyat
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper + Delete + Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      {/* Stepper */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                        <button
                          type="button"
                          disabled={isMOQ}
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 min-w-[40px] text-center">
                          {item.quantity} {item.product.uom}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[80px]">
                        <span className="font-bold text-sm text-slate-900 block">
                          {formatCurrency(lineTotal)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          KDV Dahil
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Kalemi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address Selector Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Teslimat & Fatura Adresi Seçimi
            </h3>
            <p className="text-xs text-slate-400">
              Distribütör kamyonunun teslimat yapacağı işletme adresinizi teyit
              edin.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  shippingAddressType === "SHIPPING"
                    ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="addressType"
                  checked={shippingAddressType === "SHIPPING"}
                  onChange={() => setShippingAddressType("SHIPPING")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Kayıtlı Sevkiyat Adresi (Mutfak / Depo)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Sistemde kayıtlı restoran teslimat noktanız
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  shippingAddressType === "BILLING"
                    ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="addressType"
                  checked={shippingAddressType === "BILLING"}
                  onChange={() => setShippingAddressType("BILLING")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Kayıtlı Fatura Adresi (Muhasebe)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Vergi levhanızdaki merkez adresiniz
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Cari Hesaba Mahsup & Checkout (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900">
              Cari Hesap & Ödeme Özeti
            </h2>

            {/* Live Cari Hesap Validation Box */}
            {isLoadingAccount ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Kredi limiti kontrol ediliyor...
              </div>
            ) : account ? (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                  isCreditSufficient
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                    : "bg-rose-50 border-rose-200 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCreditSufficient ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold">
                    {isCreditSufficient
                      ? "Cari Kredi Limiti Onaylandı"
                      : "Yetersiz Cari Kredi Limiti!"}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mevcut Kalan Kredi:</span>
                    <span className="font-bold">
                      {formatCurrency(availableCredit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bu Sipariş Tutarı:</span>
                    <span className="font-bold">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-600">
                      Sipariş Sonrası Kalan:
                    </span>
                    <span
                      className={`font-bold ${isCreditSufficient ? "text-emerald-700" : "text-rose-700"}`}
                    >
                      {isCreditSufficient
                        ? formatCurrency(projectedRemainingCredit)
                        : `-${formatCurrency(creditDeficit)}`}
                    </span>
                  </div>
                </div>

                {!isCreditSufficient && (
                  <p className="text-[10px] text-rose-600 font-medium pt-1">
                    Bu sipariş, toptancınızın size tahsis ettiği limiti{" "}
                    {formatCurrency(creditDeficit)} tutarında aşmaktadır.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Bu tedarikçiyle tanımlı bir Cari Hesap bulunamadı.
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Ara Toplam</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sevkiyat & Nakliye</span>
                <span className="font-semibold text-emerald-600">
                  Ücretsiz (Distribütör Sevkiyatı)
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Ödeme Koşulu</span>
                <span className="font-semibold text-slate-900">
                  {account?.netTermsDays || 30} Gün Vadeli Cari
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-100">
                <span>Fatura Toplamı</span>
                <span className="text-emerald-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              disabled={
                isSubmitting || !isCreditSufficient || items.length === 0
              }
              onClick={handlePlaceOrder}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sipariş İletiliyor...
                </>
              ) : (
                <>
                  Cari Hesap ile Sipariş Ver
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-tight">
              Siparişi onayladığınızda, tutar toptancınızdaki Cari Hesap
              borcunuza kaydedilir ve fatura düzenlenir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
