'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { productsApi, distributorsApi } from '@/core/api';
import { Product, Distributor, ProductStockLog } from '@/core/types';
import { Search, Plus, Eye, ArrowLeft, Save, Trash2, Edit2 } from 'lucide-react';

export default function ProductsPage() {
  const { activeBranchID, user } = useAuth();
  const isOwner = user?.role === 'owner';

  // view: 'list' | 'add' | 'edit' | 'detail'
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'detail'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [distributorId, setDistributorId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [jenisBarang, setJenisBarang] = useState('bukan Suplemen');
  const [buyPrice, setBuyPrice] = useState<number | string>(0);
  const [price, setPrice] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>(0);
  const [unit, setUnit] = useState('pcs');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchProducts();
      fetchDistributors();
    }
  }, [activeBranchID]);

  const fetchProducts = async () => {
    if (!activeBranchID) return;
    setLoading(true);
    try {
      const res = await productsApi.list(activeBranchID);
      if (res.success && res.data) {
        setProducts(res.data);
        setFilteredProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributors = async () => {
    try {
      const res = await distributorsApi.list();
      if (res.success && res.data) {
        setDistributors(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.jenis_barang.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleShowAll = () => {
    setSearchQuery('');
    setFilteredProducts(products);
  };

  const handleOpenAdd = async () => {
    setDistributorId('');
    setCode('');
    setName('');
    setJenisBarang('bukan Suplemen');
    setBuyPrice(0);
    setPrice(0);
    setStock(0);
    setUnit('pcs');
    setErrorMsg('');
    setSuccessMsg('');

    // Fetch auto generated code
    if (activeBranchID) {
      try {
        const res = await productsApi.getNextCode(activeBranchID);
        if (res.success && res.data) {
          setCode(res.data.next_code);
        }
      } catch (err) {
        console.error('Failed to get next code:', err);
      }
    }

    setView('add');
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setDistributorId(p.distributor_id || '');
    setCode(p.code);
    setName(p.name);
    setJenisBarang(p.jenis_barang || p.category || 'bukan Suplemen');
    setBuyPrice(p.buy_price || 0);
    setPrice(p.price || 0);
    setStock(p.stock || 0);
    setUnit(p.unit || 'pcs');
    setErrorMsg('');
    setSuccessMsg('');
    setView('edit');
  };

  const handleOpenDetail = async (productId: string) => {
    setLoading(true);
    try {
      const res = await productsApi.get(productId);
      if (res.success && res.data) {
        setSelectedProduct(res.data);
        setView('detail');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama barang wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const body: Partial<Product> = {
      distributor_id: distributorId,
      code,
      name,
      jenis_barang: jenisBarang,
      category: jenisBarang,
      buy_price: Number(buyPrice),
      price: Number(price),
      stock: Number(stock),
      unit,
    };

    try {
      if (view === 'add') {
        const res = await productsApi.create(body);
        if (res.success) {
          setSuccessMsg('Data barang berhasil ditambahkan!');
          fetchProducts();
          setTimeout(() => setView('list'), 1000);
        } else {
          setErrorMsg(res.error || 'Gagal menambahkan barang');
        }
      } else if (view === 'edit' && selectedProduct) {
        const res = await productsApi.update(selectedProduct.id, body);
        if (res.success) {
          setSuccessMsg('Data barang berhasil diperbarui!');
          fetchProducts();
          setTimeout(() => setView('list'), 1000);
        } else {
          setErrorMsg(res.error || 'Gagal memperbarui barang');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan koneksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan barang "${prodName}"?`)) {
      return;
    }
    try {
      const res = await productsApi.delete(id);
      if (res.success) {
        alert('Barang berhasil dinonaktifkan');
        fetchProducts();
      } else {
        alert(res.error || 'Gagal menonaktifkan barang');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menonaktifkan barang');
    }
  };

  const formatIDR = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Breadcrumb */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span>Transaction Cafe</span>
          <span>&gt;</span>
          <span className="text-[#DC3545]">Product</span>
          {view === 'add' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Tambah Data Barang</span>
            </>
          )}
          {view === 'edit' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Ubah Data Barang</span>
            </>
          )}
          {view === 'detail' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Lihat Detail</span>
            </>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mt-1 uppercase tracking-tight select-none">
          {view === 'list'
            ? 'Product'
            : view === 'add'
            ? 'Tambah Data Barang'
            : view === 'edit'
            ? 'Ubah Data Barang'
            : 'Detail Product'}
        </h2>
      </div>

      {view === 'list' && (
        <div className="space-y-6">
          {/* Card Search */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
              <Search className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Search</span>
            </div>
            <div className="p-5 flex flex-wrap items-center gap-3">
              <select
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-350 text-slate-700 text-xs px-3 py-2.5 rounded focus:outline-none min-w-[220px]"
              >
                <option value="">-Pilih-</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
              <button
                onClick={handleShowAll}
                className="px-4 py-2.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
              >
                View All
              </button>
            </div>
          </div>

          {/* Card Table Product */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex justify-between items-center select-none">
              <span className="text-sm uppercase tracking-wider">Product</span>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#007BFF] hover:bg-[#0069D9] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>

              {loading ? (
                <div className="text-center py-10 text-slate-500 font-accent uppercase tracking-widest text-xs">
                  Loading data product...
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-sm text-slate-650 border-collapse">
                    <thead className="bg-[#6C7A89] text-white text-[11px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-300 w-12 text-center">No</th>
                        <th className="py-3 px-4 border-r border-slate-300">Distributor</th>
                        <th className="py-3 px-4 border-r border-slate-300">Kode Barang</th>
                        <th className="py-3 px-4 border-r border-slate-300">Nama Barang</th>
                        <th className="py-3 px-4 border-r border-slate-300">Jenis Barang</th>
                        <th className="py-3 px-4 border-r border-slate-300 text-right">Harga Jual</th>
                        <th className="py-3 px-4 border-r border-slate-300 text-center w-24">Unit</th>
                        <th className="py-3 px-4 text-center w-36">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-accent uppercase tracking-wider text-xs">
                            Tidak ada data product
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p, index) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 border-r border-slate-100 text-center font-semibold text-slate-500">{index + 1}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-medium text-slate-700">{p.distributor_name || '-'}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-mono text-xs font-semibold text-slate-800">{p.code || '-'}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800">{p.name}</td>
                            <td className="py-3 px-4 border-r border-slate-100 text-xs text-slate-600 capitalize">{p.jenis_barang || p.category}</td>
                            <td className="py-3 px-4 border-r border-slate-100 text-right font-mono font-bold text-slate-800">{formatIDR(p.price)}</td>
                            <td className="py-3 px-4 border-r border-slate-100 text-center font-mono font-extrabold text-slate-800">
                              <span className={p.stock <= 5 ? 'text-red-600' : 'text-slate-800'}>{p.stock}</span>
                            </td>
                            <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenDetail(p.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#E0A800] hover:bg-[#c69500] text-white text-[11px] font-semibold rounded shadow-sm cursor-pointer transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Lihat Detail
                              </button>
                              {isOwner && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(p)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#28A745] hover:bg-[#218838] text-white text-[11px] font-semibold rounded shadow-sm cursor-pointer transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p.id, p.name)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-[11px] font-semibold rounded shadow-sm cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(view === 'add' || view === 'edit') && (
        /* Form Tambah / Ubah Data Barang */
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <Plus className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">
              {view === 'add' ? 'Tambah Data Barang' : 'Ubah Data Barang'}
            </span>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold px-4 py-3 border border-red-200 rounded">
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-3 border border-emerald-200 rounded">
                  ✓ {successMsg}
                </div>
              )}

              <div className="space-y-4">
                {/* Distributor */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">Distributor</label>
                  <select
                    value={distributorId}
                    onChange={(e) => setDistributorId(e.target.value)}
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="">-- PILIH DISTRIBUTOR --</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kode Barang */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">Kode Barang</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Auto-generate kode barang..."
                    className="w-2/3 bg-slate-50 border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono font-bold"
                  />
                </div>

                {/* Nama Barang */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">Nama Barang *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan Nama Barang"
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-semibold"
                    required
                  />
                </div>

                {/* Jenis Barang */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">Jenis Barang *</label>
                  <select
                    value={jenisBarang}
                    onChange={(e) => setJenisBarang(e.target.value)}
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-medium"
                    required
                  >
                    <option value="Suplemen">Suplemen</option>
                    <option value="bukan Suplemen">bukan Suplemen</option>
                    <option value="aksesoris">aksesoris</option>
                  </select>
                </div>

                {/* Harga Beli */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">Harga Beli (IDR) *</label>
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="0"
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono font-semibold"
                    required
                  />
                </div>

                {/* Harga Jual */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">Harga Jual (IDR) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono font-bold"
                    required
                  />
                </div>

                {/* Unit / Stock */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">Unit / Stock Awal</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view === 'detail' && selectedProduct && (
        /* Halaman Lihat Detail Data Barang & Riwayat Perubahan Unit */
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex justify-between items-center select-none">
            <span className="text-sm uppercase tracking-wider">Detail Product</span>
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-semibold rounded cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Header Data Grid */}
            <div className="border border-slate-200 rounded overflow-hidden divide-y divide-slate-200 text-sm">
              <div className="flex bg-slate-50 p-3">
                <div className="w-48 font-bold text-slate-700">Distributor</div>
                <div className="w-6 text-center font-bold text-slate-500">=</div>
                <div className="font-semibold text-slate-800">{selectedProduct.distributor_name || '-'}</div>
              </div>
              <div className="flex p-3">
                <div className="w-48 font-bold text-slate-700">Kode Barang</div>
                <div className="w-6 text-center font-bold text-slate-500">=</div>
                <div className="font-mono font-bold text-slate-800">{selectedProduct.code || '-'}</div>
              </div>
              <div className="flex bg-slate-50 p-3">
                <div className="w-48 font-bold text-slate-700">Nama Barang</div>
                <div className="w-6 text-center font-bold text-slate-500">=</div>
                <div className="font-bold text-slate-900">{selectedProduct.name}</div>
              </div>
              <div className="flex p-3">
                <div className="w-48 font-bold text-slate-700">Jenis Barang</div>
                <div className="w-6 text-center font-bold text-slate-500">=</div>
                <div className="capitalize text-slate-800 font-semibold">{selectedProduct.jenis_barang || selectedProduct.category}</div>
              </div>
              <div className="flex bg-slate-50 p-3">
                <div className="w-48 font-bold text-slate-700">Harga Jual</div>
                <div className="w-6 text-center font-bold text-slate-500">=</div>
                <div className="font-mono font-bold text-emerald-800">{formatIDR(selectedProduct.price)}</div>
              </div>
              <div className="flex p-3">
                <div className="w-48 font-bold text-slate-700">Unit Tersedia</div>
                <div className="w-6 text-center font-bold text-slate-500">=</div>
                <div className="font-mono font-extrabold text-blue-700 text-base">{selectedProduct.stock} {selectedProduct.unit || 'pcs'}</div>
              </div>
            </div>

            {/* Riwayat Perubahan Unit Table */}
            <div className="space-y-3">
              <h3 className="font-heading text-lg text-slate-800 uppercase tracking-tight">
                Riwayat Perubahan Unit
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-sm text-slate-650 border-collapse">
                  <thead className="bg-[#6C7A89] text-white text-[11px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                    <tr>
                      <th className="py-3 px-4 border-r border-slate-300 w-12 text-center">No</th>
                      <th className="py-3 px-4 border-r border-slate-300">Tanggal</th>
                      <th className="py-3 px-4 border-r border-slate-300">Nama Barang</th>
                      <th className="py-3 px-4 border-r border-slate-300">Alasan</th>
                      <th className="py-3 px-4 border-r border-slate-300 text-center">Jumlah Unit Sebelum Terubah</th>
                      <th className="py-3 px-4 text-center">Jumlah Unit Sesudah Terubah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {!selectedProduct.stock_logs || selectedProduct.stock_logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 font-accent uppercase tracking-wider text-xs">
                          Belum ada riwayat perubahan unit
                        </td>
                      </tr>
                    ) : (
                      selectedProduct.stock_logs.map((log, idx) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 border-r border-slate-100 text-center font-semibold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono text-xs text-slate-600">
                            {new Date(log.created_at).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800">{selectedProduct.name}</td>
                          <td className="py-3 px-4 border-r border-slate-100 text-slate-700 font-semibold">{log.reason}</td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center font-mono font-bold text-slate-600">{log.unit_before}</td>
                          <td className="py-3 px-4 text-center font-mono font-extrabold text-blue-700">{log.unit_after}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
