"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth-context";
import {
  OverviewIcon,
  CatalogIcon,
  OrdersIcon,
  DealersIcon,
  ServicesIcon,
  CustomersIcon,
  WaterDropIcon,
  LogoutIcon,
} from "./icons";

const navigation = [
  { name: "Overview", href: "/", Icon: OverviewIcon },
  { name: "Catalog (65 Items)", href: "/purifiers", Icon: CatalogIcon },
  { name: "Orders & Fulfillment", href: "/orders", Icon: OrdersIcon },
  { name: "Dealer Approvals", href: "/dealers", Icon: DealersIcon },
  { name: "Service Desk", href: "/services", Icon: ServicesIcon },
  { name: "Customers & AMC", href: "/customers", Icon: CustomersIcon },
  { name: "Integration Diagnostics", href: "/test-integrations", Icon: WaterDropIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If viewing the login page, render child directly without sidebar
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !isAdmin && !isLoginPage) {
      router.push("/login");
    }
  }, [loading, isAdmin, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading barrier
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 animate-spin flex items-center justify-center text-white mb-4 shadow-xl shadow-cyan-500/20">
          <WaterDropIcon className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm font-bold text-slate-200">Loading Operations Command...</p>
        <p className="text-xs text-slate-500 mt-1">Verifying Administrator Privileges</p>
      </div>
    );
  }

  // Auth Guard: If not admin and not loading, don't flash dashboard
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity cursor-pointer"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: Desktop + Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800/80 bg-slate-900/95 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Close on Mobile */}
          <div className="flex items-center justify-between px-2 py-3 border-b border-slate-800/80 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                <WaterDropIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-base text-white tracking-wider flex items-center gap-1.5">
                  CALINFCO
                </h1>
                <p className="text-[11px] font-bold text-cyan-400">Pure Water Admin</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.Icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/25 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Sign Out */}
        <div className="border-t border-slate-800/80 pt-4 px-2 space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Signed In As</p>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Admin
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate">{user?.name || "Administrator"}</p>
            <p className="text-[11px] text-cyan-400 font-mono truncate">{user?.email}</p>
          </div>

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/70 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/50 border border-slate-700/60 text-slate-300 text-xs font-bold cursor-pointer transition-all"
          >
            <LogoutIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              ☰
            </button>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold hidden sm:inline">
              Operations Control Center
            </span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[11px] text-cyan-300 font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Live Sync: Active
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white">{user?.name}</span>
              <span className="block text-[10px] text-cyan-400 font-mono">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700/60 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
