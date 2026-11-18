"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/use-auth-store";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Store,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Kontrol Paneli",
    href: "/vendor/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Ürün Kataloğu",
    href: "/vendor/products",
    icon: Package,
  },
  {
    label: "Cari Hesaplar & Müşteriler",
    href: "/vendor/customers",
    icon: Users,
  },
  {
    label: "Gelen Siparişler",
    href: "/vendor/orders",
    icon: ShoppingCart,
  },
];

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, initialize } = useAuthStore();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initialize();
    setIsReady(true);
  }, [initialize]);

  useEffect(() => {
    if (isReady) {
      // If not logged in, or logged in as anything other than a VENDOR -> Kick to /login
      if (!isAuthenticated || !user || !user.role.startsWith("VENDOR")) {
        router.push("/login");
      }
    }
  }, [isReady, isAuthenticated, user, router]);

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white leading-tight">
                {user.vendorName || 'Toptan Gıda'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Distribütör Portalı
              </span>
            </div>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={ `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-200" />}
              </Link>
            );
          })}
        </nav>
        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 mb-2 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Güvenli Çıkış Yap
          </button>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
