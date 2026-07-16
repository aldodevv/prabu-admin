'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
}

interface Member {
  id: string;
  full_name: string;
  username: string;
}

interface TransactionItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  transaction_number: string;
  member_name?: string;
  admin_name: string;
  transaction_date: string;
  total_amount: number;
  notes?: string;
  items?: TransactionItem[];
}

export default function TransactionsPage() {
  const { activeBranchID } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // POS Cashier State
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [selectedMemberID, setSelectedMemberID] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [posError, setPosError] = useState('');
  
  // Transaction Details state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (activeBranchID) {
      fetchTransactions();
      fetchInventoryAndMembers();
    }
  }, [activeBranchID]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/admin/transactions?branch_id=${activeBranchID}`);
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryAndMembers = async () => {
    try {
      const [prodRes, memRes] = await Promise.all([
        api.get<any>(`/admin/products?branch_id=${activeBranchID}&per_page=100`),
        api.get<any>(`/admin/members?branch_id=${activeBranchID}&per_page=100`),
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.filter((p: any) => p.is_active));
      }
      if (memRes.success && memRes.data) {
        setMembers(memRes.data.filter((m: any) => m.is_active));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = (p: Product) => {
    setPosError('');
    if (p.stock <= 0) {
      setPosError(`Stok produk ${p.name} habis`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          setPosError(`Mencapai batas stok produk (${p.stock})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (pID: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== pID));
  };

  const handleQtyChange = (pID: string, delta: number, stock: number) => {
    setPosError('');
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === pID) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          if (newQty > stock) {
            setPosError(`Mencapai batas stok produk (${stock})`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setPosError('');

    const body = {
      member_id: selectedMemberID || null,
      notes,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await api.post('/admin/transactions', body);
      if (res.success) {
        setIsCashierOpen(false);
        setCart([]);
        setSelectedMemberID('');
        setNotes('');
        await Promise.all([fetchTransactions(), fetchInventoryAndMembers()]);
      } else {
        setPosError(res.error || 'Gagal menyimpan transaksi');
      }
    } catch (err: any) {
      setPosError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTx = async (txID: string) => {
    try {
      const res = await api.get<Transaction>(`/admin/transactions/${txID}`);
      if (res.success && res.data) {
        setSelectedTx(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTx = async (txID: string) => {
    if (!confirm('Hapus transaksi ini? Stok produk akan dikembalikan otomatis.')) return;
    try {
      const res = await api.delete(`/admin/transactions/${txID}`);
      if (res.success) {
        fetchTransactions();
        fetchInventoryAndMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">INTEGRATED CASHIER</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            POS Penjualan Retail & Riwayat Keuangan Cabang Gym
          </p>
        </div>
        <button
          onClick={() => setIsCashierOpen(true)}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm cursor-pointer"
        >
          + BUKA KASIR (POS RETAIL)
        </button>
      </div>

      {/* Main transactions history table */}
      {loading && !isCashierOpen ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Sinkronisasi log transaksi...
        </div>
      ) : (
        <div className="grid grid-cols-[2fr_1fr] gap-8 max-lg:grid-cols-1">
          {/* List */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
              <span className="text-sm uppercase tracking-wider">Riwayat Transaksi</span>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-650">
                  <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                    <tr>
                      <th className="py-3 px-4 border-r border-slate-300/40">No. Transaksi</th>
                      <th className="py-3 px-4 border-r border-slate-300/40">Tanggal</th>
                      <th className="py-3 px-4 border-r border-slate-300/40">Nama Member</th>
                      <th className="py-3 px-4 border-r border-slate-300/40">Kasir</th>
                      <th className="py-3 px-4 border-r border-slate-300/40">Total</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {transactions.length > 0 ? (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleViewTx(t.id)}>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-800 border-r border-slate-100">{t.transaction_number}</td>
                          <td className="py-3.5 px-4 text-xs border-r border-slate-100">
                            {new Date(t.transaction_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-bold border-r border-slate-100">{t.member_name || 'Walk-in Customer'}</td>
                          <td className="py-3.5 px-4 border-r border-slate-100">{t.admin_name}</td>
                          <td className="py-3.5 px-4 text-[#DC3545] font-bold border-r border-slate-100">
                            Rp {t.total_amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleViewTx(t.id)}
                                className="px-2.5 py-1.5 border border-[#17A2B8] hover:bg-[#17A2B8] text-[#17A2B8] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => handleDeleteTx(t.id)}
                                className="px-2.5 py-1.5 border border-[#DC3545] hover:bg-[#DC3545] text-[#DC3545] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                              >
                                Void
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold select-none">
                          Belum ada transaksi di cabang ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Details Sidebar panel */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden h-fit">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
              <span className="text-sm uppercase tracking-wider">Detail Struk</span>
            </div>
            <div className="p-6">
              {selectedTx ? (
                <div className="space-y-6 text-sm text-slate-600">
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span>Struk</span>
                      <span className="text-slate-800 font-bold">{selectedTx.transaction_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu</span>
                      <span className="text-slate-800">{new Date(selectedTx.transaction_date).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pelanggan</span>
                      <span className="text-slate-800 font-bold">{selectedTx.member_name || 'Walk-in Customer'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kasir</span>
                      <span className="text-slate-800">{selectedTx.admin_name}</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="space-y-3">
                    {selectedTx.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <div>
                          <div className="text-slate-800 font-bold">{item.product_name}</div>
                          <div className="text-slate-400">{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</div>
                        </div>
                        <span className="text-slate-800 font-mono font-bold">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="flex justify-between items-end font-mono">
                    <span className="text-xs uppercase tracking-wider text-slate-500">TOTAL BELANJA</span>
                    <span className="text-lg font-heading text-[#DC3545]">
                      Rp {selectedTx.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {selectedTx.notes && (
                    <div className="bg-slate-50 p-3 border border-slate-200 rounded text-xs leading-relaxed text-slate-700">
                      📝 <span className="text-slate-400 font-bold">Catatan:</span> {selectedTx.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 font-semibold text-xs select-none uppercase tracking-wider">
                  Pilih struk transaksi di tabel untuk meninjau rincian item belanja.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POS Cashier Overlay */}
      {isCashierOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white border border-slate-200 p-8 rounded shadow-2xl relative grid grid-cols-[1.5fr_1fr] gap-8 max-md:grid-cols-1">
            <button
              onClick={() => setIsCashierOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              ✕
            </button>

            {/* Left: Product POS Selection */}
            <div className="space-y-6">
              <h3 className="font-heading text-2xl text-slate-800 border-b border-slate-100 pb-3">POS KASIR RETAIL</h3>
              
              <div className="grid grid-cols-2 gap-4 max-h-[420px] overflow-y-auto p-1">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="bg-slate-50 border border-slate-200 hover:border-[#DC3545] p-4 rounded text-left transition-all relative group shadow-sm cursor-pointer"
                  >
                    <span className="text-[9px] uppercase tracking-wider font-accent text-[#DC3545] font-bold block mb-1">
                      {p.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 truncate">{p.name}</h4>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-xs font-mono font-bold text-slate-800">
                        Rp {p.price.toLocaleString('id-ID')}
                      </span>
                      <span className={`text-[10px] ${p.stock <= 5 ? 'text-[#DC3545] font-bold' : 'text-slate-400'}`}>
                        Stok: {p.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Cart & Checkout Info */}
            <div className="border-l border-slate-200 pl-8 max-md:border-l-0 max-md:pl-0 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <h3 className="font-heading text-2xl text-slate-800 border-b border-slate-100 pb-3">KERANJANG BELANJA</h3>

                {posError && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">
                    ⚠️ {posError}
                  </div>
                )}

                {/* Member selection */}
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Hubungkan Ke Member (Opsional)
                  </label>
                  <select
                    value={selectedMemberID}
                    onChange={(e) => setSelectedMemberID(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#DC3545] rounded"
                  >
                    <option value="">-- Pelanggan Umum --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} (@{m.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cart list */}
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {cart.length > 0 ? (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center bg-slate-50/50 p-2.5 border border-slate-200 rounded">
                        <div className="text-xs flex-1 truncate">
                          <div className="text-slate-800 font-bold truncate">{item.product.name}</div>
                          <div className="text-slate-400">Rp {item.product.price.toLocaleString('id-ID')}</div>
                        </div>
                        
                        {/* Qty controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQtyChange(item.product.id, -1, item.product.stock)}
                            className="w-6 h-6 bg-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-350 text-xs rounded-l cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs text-slate-800 w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyChange(item.product.id, 1, item.product.stock)}
                            className="w-6 h-6 bg-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-350 text-xs rounded-r cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-[#DC3545] ml-4 hover:text-red-700 font-bold text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs uppercase tracking-widest font-accent font-bold select-none">
                      Keranjang Kosong
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Catatan Transaksi
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#DC3545] resize-none h-14 rounded"
                    placeholder="Contoh: Pembayaran non-tunai QRIS"
                  />
                </div>
              </div>

              {/* Total & Checkout */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-widest font-accent text-slate-500">TOTAL BELANJA</span>
                  <span className="text-2xl font-heading text-[#DC3545]">
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full inline-flex items-center justify-center font-accent font-semibold text-sm uppercase tracking-widest py-4 bg-[#DC3545] hover:bg-[#c82333] text-white rounded transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'PROSES PEMBAYARAN...' : 'SELESAIKAN PEMBAYARAN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
