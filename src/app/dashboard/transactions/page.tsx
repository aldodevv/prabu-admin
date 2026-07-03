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
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-white">INTEGRATED CASHER</h2>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
            POS Penjualan Retail & Riwayat Keuangan Cabang Gym
          </p>
        </div>
        <button
          onClick={() => setIsCashierOpen(true)}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary hover:shadow-glow-red transition-all duration-300"
        >
          + BUKA KASIR (POS RETAIL)
        </button>
      </div>

      {/* Main transactions history table */}
      {loading && !isCashierOpen ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Sinkronisasi log transaksi...
        </div>
      ) : (
        <div className="grid grid-cols-[2fr_1fr] gap-8 max-lg:grid-cols-1">
          {/* List */}
          <div className="bg-black-card border border-gray-800 p-8 angular-cut">
            <h3 className="font-heading text-2xl text-white mb-6">RIWAYAT TRANSAKSI</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nama Member</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {transactions.length > 0 ? (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-800/10 transition-colors cursor-pointer" onClick={() => handleViewTx(t.id)}>
                        <td className="py-3.5 px-4 font-mono text-xs text-white">{t.transaction_number}</td>
                        <td className="py-3.5 px-4 text-xs">
                          {new Date(t.transaction_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB
                        </td>
                        <td className="py-3.5 px-4 text-white font-medium">{t.member_name || 'Walk-in Customer'}</td>
                        <td className="py-3.5 px-4">{t.admin_name}</td>
                        <td className="py-3.5 px-4 text-red-primary font-bold">
                          Rp {t.total_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleViewTx(t.id)}
                              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-accent text-[10px] uppercase tracking-wider"
                            >
                              Detail
                            </button>
                            <button
                              onClick={() => handleDeleteTx(t.id)}
                              className="px-2.5 py-1.5 bg-red-primary/10 hover:bg-red-primary/20 text-red-primary font-accent text-[10px] uppercase tracking-wider"
                            >
                              Void
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Belum ada transaksi di cabang ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Sidebar panel */}
          <div className="bg-black-card border border-gray-800 p-8 angular-cut h-fit">
            <h3 className="font-heading text-2xl text-white mb-6">DETAIL STRUK</h3>
            {selectedTx ? (
              <div className="space-y-6 text-sm text-gray-300">
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span>Struk</span>
                    <span className="text-white">{selectedTx.transaction_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu</span>
                    <span>{new Date(selectedTx.transaction_date).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan</span>
                    <span className="text-white font-medium">{selectedTx.member_name || 'Walk-in Customer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir</span>
                    <span className="text-white">{selectedTx.admin_name}</span>
                  </div>
                </div>

                <div className="h-px bg-gray-800" />

                <div className="space-y-3">
                  {selectedTx.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <div>
                        <div className="text-white font-medium">{item.product_name}</div>
                        <div className="text-gray-500">{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</div>
                      </div>
                      <span className="text-white font-mono font-medium">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gray-800" />

                <div className="flex justify-between items-end font-mono">
                  <span className="text-xs uppercase tracking-wider">TOTAL BELANJA</span>
                  <span className="text-lg font-heading text-red-primary">
                    Rp {selectedTx.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>

                {selectedTx.notes && (
                  <div className="bg-black-deep/60 p-3 border border-gray-800 rounded text-xs leading-relaxed">
                    📝 <span className="text-gray-400">Catatan:</span> {selectedTx.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500 text-sm">
                Pilih struk transaksi di tabel untuk meninjau rincian item belanja.
              </div>
            )}
          </div>
        </div>
      )}

      {/* POS Cashier Overlay */}
      {isCashierOpen && (
        <div className="fixed inset-0 bg-black-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-black-card border border-gray-800 p-8 angular-cut relative grid grid-cols-[1.5fr_1fr] gap-8 max-md:grid-cols-1">
            <button
              onClick={() => setIsCashierOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            {/* Left: Product POS Selection */}
            <div className="space-y-6">
              <h3 className="font-heading text-2xl text-white">POS KASIR RETAIL</h3>
              
              <div className="grid grid-cols-2 gap-4 max-h-[420px] overflow-y-auto p-1">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="bg-black-deep/60 border border-gray-800 hover:border-red-primary p-4 rounded text-left transition-all relative group"
                  >
                    <span className="text-[9px] uppercase tracking-wider font-accent text-red-primary block mb-1">
                      {p.category}
                    </span>
                    <h4 className="text-sm font-semibold text-white truncate">{p.name}</h4>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-xs font-mono font-medium text-white">
                        Rp {p.price.toLocaleString('id-ID')}
                      </span>
                      <span className={`text-[10px] ${p.stock <= 5 ? 'text-red-primary font-bold' : 'text-gray-500'}`}>
                        Stok: {p.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Cart & Checkout Info */}
            <div className="border-l border-gray-800 pl-8 max-md:border-l-0 max-md:pl-0 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <h3 className="font-heading text-2xl text-white">KERANJANG BELANJA</h3>

                {posError && (
                  <div className="p-3 bg-red-primary/10 border-l-4 border-red-primary text-red-primary text-xs">
                    ⚠️ {posError}
                  </div>
                )}

                {/* Member selection */}
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Hubungkan Ke Member (Opsional)
                  </label>
                  <select
                    value={selectedMemberID}
                    onChange={(e) => setSelectedMemberID(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 text-white px-3 py-2 text-xs focus:outline-none"
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
                      <div key={item.product.id} className="flex justify-between items-center bg-black-deep/40 p-2.5 border border-gray-850">
                        <div className="text-xs flex-1 truncate">
                          <div className="text-white font-medium truncate">{item.product.name}</div>
                          <div className="text-gray-500">Rp {item.product.price.toLocaleString('id-ID')}</div>
                        </div>
                        
                        {/* Qty controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQtyChange(item.product.id, -1, item.product.stock)}
                            className="w-6 h-6 bg-gray-800 text-white font-bold flex items-center justify-center hover:bg-gray-700 text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs text-white w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyChange(item.product.id, 1, item.product.stock)}
                            className="w-6 h-6 bg-gray-800 text-white font-bold flex items-center justify-center hover:bg-gray-700 text-xs"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-red-primary ml-4 hover:text-red-light font-bold text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-500 text-xs uppercase tracking-widest font-accent">
                      Keranjang Kosong
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Catatan Transaksi
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 text-white px-3 py-2 text-xs focus:outline-none resize-none h-14"
                    placeholder="Contoh: Pembayaran non-tunai QRIS"
                  />
                </div>
              </div>

              {/* Total & Checkout */}
              <div className="pt-6 border-t border-gray-800 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-widest font-accent text-gray-400">TOTAL BELANJA</span>
                  <span className="text-2xl font-heading text-red-primary">
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full inline-flex items-center justify-center font-accent font-semibold text-sm uppercase tracking-widest py-4 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary transition-all duration-300 disabled:opacity-50"
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
