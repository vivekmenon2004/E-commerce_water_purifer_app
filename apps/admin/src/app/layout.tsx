import type { Metadata } from "next";
import "./globals.css";
import { AdminAuthProvider } from "@/lib/auth-context";
import { AdminShell } from "@/components/admin-shell";

export const metadata: Metadata = {
  title: "Calinfco Admin | Water Purifier Operations",
  description: "Operations, Order Management, AMC Contracts, and Technician Dispatch for Calinfco Water Purifiers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className="min-h-screen bg-slate-950 antialiased font-sans">
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
