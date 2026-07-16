'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  is_active: boolean;
}

export default function ProductsPage() {
  const { activeBranchID } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Form states (Create/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('minuman');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [unit, setUnit] = useState('pcs');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (activeBranchID) {
      fetchProducts();
    }
  }, [activeBranchID, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/admin/products?branch_id=${activeBranchID}&page=${page}`
      );
      if (res.success && res.data) {
        setProducts(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingID(null);
    setName('');
    setCategory('minuman');
    setPrice(0);
    setStock(0);
    setUnit('pcs');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingID(p.id);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    setStock(p.stock);
    setUnit(p.unit);
    setIsActive(p.is_active);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body: any = {
      name,
      category,
      price: Number(price),
      stock: Number(stock),
      unit,
    };

    try {
      if (editingID) {
        body.is_active = isActive;
        const res = await api.put(`/admin/products/${editingID}`, body);
        if (res.success) {
          setIsFormOpen(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/admin/products', body);
        if (res.success) {
          setIsFormOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) return;
    try {
      const res = await api.delete(`/admin/products/${id}`);
      if (res.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">MANAJEMEN STOK RETAIL</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Inventori Minuman, Aksesoris & Suplemen Cabang Gym
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm cursor-pointer"
        >
          + TAMBAH PRODUK INVENTORI
        </button>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading data produk...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Daftar Inventori Gym</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Produk</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Kategori</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Harga Satuan</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Stok</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Satuan</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {products.length > 0 ? (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{p.name}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <span className="text-[10px] font-accent uppercase tracking-widest font-semibold border border-[#17A2B8]/20 px-2 py-0.5 text-[#17A2B8] rounded">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium border-r border-slate-100">
                          Rp {p.price.toLocaleString('id-ID')}
                        </td>
                        <td className={`py-3.5 px-4 font-bold border-r border-slate-100 ${p.stock <= 5 ? 'text-[#DC3545]' : 'text-slate-800'}`}>
                          {p.stock}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono border-r border-slate-100">{p.unit}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${
                              p.is_active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {p.is_active ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="px-3 py-1.5 border border-[#17A2B8] hover:bg-[#17A2B8] text-[#17A2B8] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="px-3 py-1.5 border border-[#DC3545] hover:bg-[#DC3545] text-[#DC3545] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                            >
                              Disable
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold select-none">
                        Belum ada data produk di cabang ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 50 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Total {total} Produk</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-accent uppercase tracking-widest rounded cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * 50 >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-accent uppercase tracking-widest rounded cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-heading text-2xl text-slate-800 mb-6 border-b border-slate-100 pb-3">
              {editingID ? 'UBAH DATA PRODUK' : 'TAMBAH PRODUK BARU'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="minuman">Minuman</option>
                    <option value="suplemen">Suplemen</option>
                    <option value="aksesoris">Aksesoris</option>
                    <option value="alat_fitness">Alat Fitness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    placeholder="pcs, botol, pack..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Harga Satuan (IDR)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    min={0}
                    required
                  />
                </div>
              </div>

              {editingID && (
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Status
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'MENYIMPAN...' : 'SIMPAN PRODUK INVENTORI'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
