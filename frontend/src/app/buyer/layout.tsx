// frontend/src/app/buyer/layout.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/use-auth-store';
import { useCartStore } from '../../store/use-cart-store';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BuyerVendorAccount } from '@/types';
import {
  UtensilsCrossed,
  Store,
  ShoppingCart,
  Clock,
  LogOut,
  CreditCard,
  Building2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

function BuyerLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  const [isReady, setIsReady] = useState(false);
  const [vendorAccounts, setVendorAccounts] = useState<BuyerVendorAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Initialize auth
  useEffect(() => {
    initialize();
    setIsReady(true);
  }, [initialize]);

  // Role Protection: Only BUYER accounts allowed
  useEffect(() => {
    if (isReady) {
      if (!isAuthenticated || !user) {
        router.push('/login');
      } else if (!user.role.startsWith('BUYER')) {
        // Not a restaurant buyer
        router.push('/login');
      }
    }
  }, [isReady, isAuthenticated, user, router]);

  // Fetch live Cari credit limits across distributors
  const fetchAccounts = async () => {
    try {
      const res = await api.get<BuyerVendorAccount[]>('/company/my-vendor-accounts');
      setVendorAccounts(res.data || []);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role.startsWith('BUYER')) {
      fetchAccounts();
    }
  }, [isAuthenticated, user]);

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Aggregate credit numbers
  const totalAvailableCredit = vendorAccounts.reduce(
    (sum, acc) => sum + Number(acc.availableCredit || 0),
    0,
  );
  const totalDebt = vendorAccounts.reduce(
    (sum, acc) => sum + Number(acc.currentBalance || 0),
    0,
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Portal Badge */}
          <div className="flex items-center gap-6">
            <Link href="/buyer/suppliers" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                  {user.companyName || 'Restoran Portalı'}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                  B2B Toptan Sipariş
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
              <Link
                href="/buyer/suppliers"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  pathname.startsWith('/buyer/suppliers') || pathname.startsWith('/buyer/catalog')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Toptancılar & Tedarikçiler
                </span>
              </Link>

              <Link
                href="/buyer/orders"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  pathname.startsWith('/buyer/orders')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Sipariş Geçmişim
                </span>
              </Link>
            </nav>
          </div>

          {/* Right Section: Cari Credit Badge + Cart + User Menu */}
          <div className="flex items-center gap-3">
            {/* Cari Limit Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="text-[10px] font-semibold uppercase text-emerald-800 tracking-wider block leading-none">
                  Kullanılabilir Cari Kredi
                </span>
                <span className="text-xs font-bold text-emerald-950 block mt-0.5">
                  {isLoadingAccounts ? '...' : formatCurrency(totalAvailableCredit)}
                </span>
              </div>
            </div>

            {/* Shopping Cart Button */}
            <Link
              href="/buyer/cart"
              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                pathname === '/buyer/cart'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Alışveriş Sepeti"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {/* User Profile Chip & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right pr-1">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {user.role === 'BUYER_ADMIN' ? 'Restoran Sahibi' : 'Mutfak / Satınalma'}
                </p>
              </div>

              <button
                onClick={logout}
                title="Çıkış Yap"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BuyerLayoutContent>{children}</BuyerLayoutContent>
    </Suspense>
  );
}
