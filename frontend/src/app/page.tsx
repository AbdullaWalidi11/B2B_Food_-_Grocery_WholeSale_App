// frontend/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';
import {
  Store,
  UtensilsCrossed,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  Truck,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    initialize();
    setIsMounted(true);
  }, [initialize]);

  const portalHref =
    user?.role?.startsWith('VENDOR')
      ? '/vendor/dashboard'
      : '/buyer/suppliers';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm">
              <Store className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 leading-tight block">
                B2B Toptan Gıda
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Pazaryeri & Cari Hesap
              </span>
            </div>
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            {isMounted && isAuthenticated && user ? (
              <Link
                href={portalHref}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                <span>Paneline Git ({user.firstName})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Kayıt Ol
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Türkiye'nin Yeni Nesil Gıda Toptan Ticaret Ağı
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Restoranlar ve Toptancılar İçin{' '}
            <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy underline-offset-8">
              Cari Hesaplı
            </span>{' '}
            Gıda Tedariği
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Un, bakliyat, yağ, süt ve şarküteri ürünlerinde doğrudan distribütör fiyatları,
            firmaya özel sözleşmeli iskontolar ve 15-60 gün vadeli kredi yönetimi tek bir ekranda.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              Hemen Başlayın
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl border border-slate-200 shadow-xs transition-all"
            >
              Mevcut Hesaba Giriş
            </Link>
          </div>
        </div>
      </section>

      {/* Core Pillars Grid */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Neden B2B Toptan Gıda?
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Geleneksel Toptan Ticaretin Dijital Gücü
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Cari Hesap & Kredi Limiti
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Her siparişte kredi kartı gerekmez. Toptancınızın firmanıza tanımladığı 
                Cari Kredi Limiti üzerinden 15, 30 veya 45 gün vadeli sipariş verin.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Dinamik Sözleşmeli Fiyatlar
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Her restoran aynı fiyattan almaz. Distribütörlerin müşteri gruplarına özel
                tanımladığı iskonto matrisleri ve sözleşmeli fiyatlar sepette anında uygulanır.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Canlı Sevkiyat & Takip
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sipariş iletiminden depo hazırlığına, kamyon sevkiyatından mutfak teslimatına kadar 
                4 aşamalı canlı durum takibi ile operasyonel aksama yaşanmaz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Portals Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendor Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                <Store className="w-3.5 h-3.5" />
                Distribütör Portalı
              </div>
              <h3 className="text-2xl font-bold mb-3">Toptan Gıda Distribütörleri İçin</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Ürün kataloğunuzu Koli/Çuval/Kg birimleriyle yayınlayın, restoran müşterilerinize özel
                iskonto listeleri atayın ve Cari Hesap borç-alacak dengesini tek ekrandan kontrol edin.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Koli / Çuval bazlı asgari sipariş (MOQ) kuralları
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Restoran bazlı Cari Hesap kredi tavanı ve vade yönetimi
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sipariş onaylama, paketleme ve sevkiyat durumu güncelleme
                </li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              Distribütör Olarak Kaydolun
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Buyer Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Restoran & Lokanta Portalı
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Restoran ve Mutfak Yöneticileri İçin
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Anlaşmalı toptancılarınızın güncel stoklarını inceleyin, mutfağınızın toptan ihtiyaçlarını
                sözleşmeli özel fiyatlarla sepetinize ekleyin ve Cari Hesabınızdan anında sipariş verin.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Toptancınızla anlaştığınız özel iskonto etiketleri
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Sepet aşamasında canlı Cari Kredi Limiti kontrolü
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Geçmiş siparişler ve dijital fatura dökümleri
                </li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Restoran Hesabı Oluşturun
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 B2B Food & Wholesale Platform. Tüm hakları saklıdır.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Enterprise NestJS 11 + Next.js 16 + Prisma 7 Multi-Tenant Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}