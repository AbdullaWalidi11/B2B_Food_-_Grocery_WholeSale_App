// frontend/src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/use-auth-store';
import { toast } from 'sonner';
import { Store, Utensils, Building2, User, Mail, Lock, MapPin, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [activeTab, setActiveTab] = useState<'buyer' | 'vendor'>('buyer');
  const [isLoading, setIsLoading] = useState(false);

  // Common User fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');

  // Buyer specific addresses
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === 'vendor') {
        const res = await api.post('/auth/register-vendor', {
          companyName,
          taxNumber,
          taxOffice,
          email,
          password,
          firstName,
          lastName,
        });
        const { user, accessToken } = res.data;
        setAuth(user, accessToken);
        toast.success('Distribütör hesabı başarıyla oluşturuldu!');
        router.push('/vendor/dashboard');
      } else {
        const res = await api.post('/auth/register-buyer', {
          companyName,
          taxNumber,
          taxOffice,
          shippingAddress,
          billingAddress,
          email,
          password,
          firstName,
          lastName,
        });
        const { user, accessToken } = res.data;
        setAuth(user, accessToken);
        toast.success('Restoran hesabı başarıyla oluşturuldu!');
        router.push('/buyer/suppliers');
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Kayıt işlemi başarısız oldu.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 py-12">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Yeni İşletme Hesabı Açın
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            İşletme türünüzü seçerek kayıt olun
          </p>
        </div>

        {/* Business Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('buyer')}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'buyer'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Restoran / Alıcı
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vendor')}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'vendor'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            Toptancı / Satıcı
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Details Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {activeTab === 'buyer' ? 'Restoran / İşletme Bilgileri' : 'Distribütör Firma Bilgileri'}
            </h2>
            <div>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={activeTab === 'buyer' ? 'Restoran Adı (Örn: Lezzet Lokantası)' : 'Firma Adı (Örn: Marmara Gıda Toptan A.Ş.)'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="Vergi Numarası"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <input
                type="text"
                required
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
                placeholder="Vergi Dairesi"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Restaurant Addresses */}
            {activeTab === 'buyer' && (
              <div className="space-y-3 pt-1">
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Teslimat Adresi (Depo / Mutfak)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Fatura Adresi"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Authorized Admin User Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Yetkili Yönetici Bilgileri
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ad"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Soyad"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Yönetici E-Posta"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (Min. 6 karakter)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Kayıt Ol ve Başla
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{' '}
          <Link
            href="/login"
            className="font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}