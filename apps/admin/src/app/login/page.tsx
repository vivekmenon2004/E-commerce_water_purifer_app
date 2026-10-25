"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user } = useAdminAuth();

  const [email, setEmail] = useState("admin@calinfco.com");
  const [password, setPassword] = useState("Admin@2026!Calinfco");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect to dashboard
  if (user && user.role === "admin") {
    if (typeof window !== "undefined") {
      router.push("/");
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push("/");
    } else {
      setErrorMsg(res.error || "Authentication failed. Access denied.");
    }
  };

  const handleDemoAdminLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    const res = await login("admin@calinfco.com", "Admin@2026!Calinfco");
    setLoading(false);
    if (res.success) {
      router.push("/");
    } else {
      setErrorMsg(res.error || "Demo login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-xl shadow-cyan-500/25 text-3xl mb-4">
            💧
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">CALINFCO</h1>
          <p className="text-sm font-semibold text-cyan-400 mt-1">
            Pure Water Operations & Control Portal
          </p>
          <div className="inline-block mt-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            🔒 SECURE ADMIN CONSOLE
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-2">Administrative Sign In</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter authorized administrator credentials to manage products, orders, and technician dispatches.
          </p>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/50 text-red-200 text-xs flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@calinfco.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Operations Console →"}
            </button>
          </form>

          {/* Demo Admin Shortcut */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleDemoAdminLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>⚡ Quick Sign In as Verified Operations Head</span>
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
              <span>🛡️ Security Policy</span>
            </div>
            <p className="leading-relaxed">
              Public self-registration is permanently disabled. Only accounts verified with role <code className="text-slate-200">admin</code> in Cloud Firestore can access operations endpoints.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-8">
          Calinfco Pure Water Systems LLP • Security Compliance Tier-1
        </p>
      </div>
    </div>
  );
}
