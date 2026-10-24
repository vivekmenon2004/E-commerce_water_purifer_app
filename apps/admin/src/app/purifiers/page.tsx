"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, isDemoMode } from "@/lib/firebase";
import { SEED_PRODUCTS, DEFAULT_CATEGORIES } from "@/lib/seed-data";
import { Product } from "@/lib/types";

export default function PurifiersCatalogPage() {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      if (isDemoMode || !db) {
        setProducts(SEED_PRODUCTS);
        return;
      }

      try {
        const prodRef = collection(db, "products");
        const snap = await getDocs(prodRef);
        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as Product));
          setProducts(list);
        } else {
          setProducts(SEED_PRODUCTS);
        }
      } catch (err) {
        console.warn("Using demo seed products in admin catalog:", err);
        setProducts(SEED_PRODUCTS);
      }
    }

    loadCatalog();
  }, []);

  const filtered = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchTerm === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            🚰 Product Inventory & Wholesale Pricing Catalog
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Managing {products.length} catalog items across water purifiers, dispensers, pumps, filters, and spare parts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/40 text-cyan-300 font-medium">
            Seed Script: <code>scripts/seed-firestore.mjs</code>
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="sm:w-80">
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Retail Price</th>
                <th className="py-3.5 px-4">Dealer Price</th>
                <th className="py-3.5 px-4">Margin %</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(item => {
                const marginPercent = Math.round(((item.retailPrice - item.dealerPrice) / item.retailPrice) * 100);

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-11 h-11 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                        />
                        <div>
                          <p className="font-bold text-slate-100">{item.name}</p>
                          <span className="font-mono text-[11px] text-cyan-400 font-semibold">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700/60">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      ₹{item.retailPrice.toLocaleString("en-IN")}
                      <span className="block text-[10px] text-slate-500 line-through">
                        MRP: ₹{item.mrp.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      ₹{item.dealerPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {marginPercent}% B2B
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${item.stock > 20 ? "text-emerald-400" : "text-amber-400"}`}>
                        {item.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center text-xs text-slate-400">
          <span>Showing {filtered.length} of {products.length} items</span>
          <span>Role-protected: Only Admin can modify pricing or catalog attributes</span>
        </div>
      </div>
    </div>
  );
}
