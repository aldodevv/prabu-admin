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
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-white">MANAJEMEN STOK RETAIL</h2>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
            Inventori Minuman, Aksesoris & Suplemen Cabang Gym
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary hover:shadow-glow-red transition-all duration-300"
        >
          + TAMBAH PRODUK INVENTORI
        </button>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Loading data produk...
        </div>
      ) : (
        <div className="bg-black-card border border-gray-800 p-8 angular-cut">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Satuan</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4">Satuan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {products.length > 0 ? (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">{p.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-accent uppercase tracking-widest font-semibold border border-red-primary/20 px-2 py-0.5 text-red-primary">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                      <td className={`py-3.5 px-4 font-bold ${p.stock <= 5 ? 'text-red-primary' : 'text-white'}`}>
                        {p.stock}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">{p.unit}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold ${
                            p.is_active
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {p.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-accent text-[10px] uppercase tracking-wider transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="px-3 py-1.5 bg-red-primary/10 hover:bg-red-primary/20 text-red-primary font-accent text-[10px] uppercase tracking-wider transition-all"
                          >
                            Disable
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Belum ada data produk di cabang ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800 text-xs">
              <span className="text-gray-500">Total {total} Produk</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-accent uppercase tracking-widest"
                >
                  Prev
                </button>
                <button
                  disabled={page * 50 >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-accent uppercase tracking-widest"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-black-card border border-gray-800 p-8 angular-cut relative animate-fade-in">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="font-heading text-2xl text-white mb-6">
              {editingID ? 'UBAH DATA PRODUK' : 'TAMBAH PRODUK BARU'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                  >
                    <option value="minuman">Minuman</option>
                    <option value="suplemen">Suplemen</option>
                    <option value="aksesoris">Aksesoris</option>
                    <option value="alat_fitness">Alat Fitness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    placeholder="pcs, botol, pack..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Harga Satuan (IDR)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    min={0}
                    required
                  />
                </div>
              </div>

              {editingID && (
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Status
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary transition-all duration-300 disabled:opacity-50"
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
