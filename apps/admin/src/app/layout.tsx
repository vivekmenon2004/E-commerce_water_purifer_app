import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calinfco Admin | Water Purifier Operations",
  description: "Operations, Order Management, AMC Contracts, and Technician Dispatch for Calinfco Water Purifiers",
};

const navigation = [
  { name: "Overview", href: "/", icon: "📊" },
  { name: "Catalog (65 Products)", href: "/purifiers", icon: "🚰" },
  { name: "Orders & Installations", href: "/orders", icon: "📦" },
  { name: "Dealer Approvals", href: "/dealers", icon: "🏢" },
  { name: "Service & Maintenance", href: "/services", icon: "🔧" },
  { name: "Customers & AMC", href: "/customers", icon: "👥" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-900 text-slate-100">
      <body className="flex min-h-screen bg-slate-950">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between p-4 shrink-0">
          <div>
            <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
                💧
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-white tracking-wider">CALINFCO</h1>
                <p className="text-xs font-medium text-cyan-400">Pure Water Admin</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="border-t border-slate-800 pt-4 px-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Environment</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium">Local Dev</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Firestore</span>
              <span className="text-cyan-400 font-medium">Ready</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-x-hidden">
          {/* Top Bar */}
          <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Operations Command</span>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-xs text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                n8n Automation Dispatch: Active
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Signed in as</span>
              <span className="text-xs font-semibold px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-200">
                admin@calinfco.com
              </span>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
