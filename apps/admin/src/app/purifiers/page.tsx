"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, isDemoMode } from "@/lib/firebase";
import { SEED_PRODUCTS, DEFAULT_CATEGORIES } from "@/lib/seed-data";
import { Product } from "@/lib/types";
import { CatalogIcon, WaterDropIcon } from "@/components/icons";

export default function PurifiersCatalogPage() {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit form state
  const [editStock, setEditStock] = useState<number>(0);
  const [editRetail, setEditRetail] = useState<number>(0);
  const [editDealer, setEditDealer] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  useEffect(() => {
    async function loadCatalog() {
      if (isDemoMode || !db) {
        setProducts(SEED_PRODUCTS);
        setLoading(false);
        return;
      }

      try {
        const prodRef = collection(db, "products");
        const snap = await getDocs(prodRef);
        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
          setProducts(list);
        } else {
          setProducts(SEED_PRODUCTS);
        }
      } catch (err) {
        console.warn("Using demo seed products in admin catalog:", err);
        setProducts(SEED_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditStock(p.stock);
    setEditRetail(p.retailPrice);
    setEditDealer(p.dealerPrice);
    setEditIsActive(p.isActive);
  };

  const handleToggleActive = async (p: Product) => {
    const updatedStatus = !p.isActive;
    const now = new Date().toISOString();

    if (isDemoMode || !db) {
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, isActive: updatedStatus, updatedAt: now } : item))
      );
      setFeedback(`Product "${p.name}" marked as ${updatedStatus ? "Active" : "Inactive"}`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, "products", p.id), {
        isActive: updatedStatus,
        updatedAt: now,
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, isActive: updatedStatus, updatedAt: now } : item))
      );
      setFeedback(`Product status updated in Firestore!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error updating product status: " + error.message);
    }
  };

  const handleSaveInventory = async () => {
    if (!editingProduct) return;

    if (editStock < 0) {
      alert("Stock cannot be negative.");
      return;
    }
    if (editDealer > editRetail) {
      alert("Wholesale dealer price cannot exceed retail price.");
      return;
    }

    const now = new Date().toISOString();
    const updatedProd: Product = {
      ...editingProduct,
      stock: editStock,
      retailPrice: editRetail,
      dealerPrice: editDealer,
      isActive: editIsActive,
      updatedAt: now,
    };

    if (isDemoMode || !db) {
      setProducts((prev) => prev.map((item) => (item.id === editingProduct.id ? updatedProd : item)));
      setEditingProduct(null);
      setFeedback(`Inventory & pricing updated for "${editingProduct.name}"`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, "products", editingProduct.id), {
        stock: editStock,
        retailPrice: editRetail,
        dealerPrice: editDealer,
        isActive: editIsActive,
        updatedAt: now,
      });
      setProducts((prev) => prev.map((item) => (item.id === editingProduct.id ? updatedProd : item)));
      setEditingProduct(null);
      setFeedback(`Product changes committed to Firestore!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error updating product: " + error.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower);
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <CatalogIcon className="w-6 h-6 text-cyan-400" />
            <span>Product Inventory & Wholesale Pricing Catalog</span>
            {loading && (
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Managing {products.length} catalog items across water purifiers, dispensers, pumps, filters, and spare parts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-800/40 text-cyan-300 font-medium">
            Protected Inventory Management
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>✓ {feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {DEFAULT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Active / Inactive filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs self-start">
            <span className="text-[11px] font-bold text-slate-400 px-2">Availability:</span>
            {(["all", "active", "inactive"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                  statusFilter === st ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="sm:w-80">
            <input
              type="text"
              placeholder="Search SKU or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
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
                <th className="py-3.5 px-4">Active Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No products match your search or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const marginPercent = Math.round(
                    ((item.retailPrice - item.dealerPrice) / item.retailPrice) * 100
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-slate-800 shrink-0 border border-slate-700/60 flex items-center justify-center overflow-hidden">
                            <WaterDropIcon className="w-5 h-5 text-cyan-400" />
                          </div>
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
                        <span
                          className={`font-semibold ${
                            item.stock === 0
                              ? "text-rose-400"
                              : item.stock < 15
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {item.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            item.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-400" : "bg-slate-500"}`}
                          ></span>
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          Edit Stock/Price →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
          <span>
            Showing {filtered.length} of {products.length} catalog items
          </span>
          <span>Role-protected: Only authenticated Administrators can edit inventory</span>
        </div>
      </div>

      {/* Edit Inventory & Price Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{editingProduct.name}</h3>
                <span className="font-mono text-cyan-400 text-xs">{editingProduct.sku}</span>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block font-semibold mb-1">Warehouse Stock (Units)</label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Customer Retail Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editRetail}
                    onChange={(e) => setEditRetail(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Dealer Wholesale Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editDealer}
                    onChange={(e) => setEditDealer(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block">Catalog Availability</span>
                  <span className="text-slate-400 text-[11px]">
                    {editIsActive ? "Visible in app for purchase" : "Hidden from checkout"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    editIsActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {editIsActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInventory}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md"
              >
                Save Permitted Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
