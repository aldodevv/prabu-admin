'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

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

export default function TransactionHistoryPage() {
  const { activeBranchID } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (activeBranchID) {
      fetchTransactions();
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

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">RIWAYAT TRANSAKSI</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Daftar lengkap seluruh transaksi penjualan kasir (POS Retail) di cabang ini
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading riwayat transaksi...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden animate-fadeIn">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Laporan Transaksi Kasir</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">No. Transaksi</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tanggal</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Member</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-right">Total Transaksi</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Kasir (Admin)</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 border-r border-slate-100">{tx.transaction_number}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 font-mono text-slate-500">{new Date(tx.transaction_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 text-slate-800">{tx.member_name || 'Bukan Member (Umum)'}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 text-right text-slate-800 font-extrabold">Rp {tx.total_amount.toLocaleString('id-ID')}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 text-slate-600">{tx.admin_name}</td>
                        <td className="py-3.5 px-4 text-center select-none">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded transition-all cursor-pointer shadow-sm"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold select-none">
                        Belum ada riwayat transaksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded shadow-2xl relative">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-heading text-xl text-slate-800 mb-6 border-b border-slate-100 pb-3">
              RINCIAN TRANSAKSI: {selectedTx.transaction_number}
            </h3>

            <div className="space-y-4 text-xs text-slate-650 font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Tanggal Transaksi</span>
                  <span className="text-slate-850 font-mono">{new Date(selectedTx.transaction_date).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Kasir Operator</span>
                  <span className="text-slate-850">{selectedTx.admin_name}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Nama Member</span>
                <span className="text-slate-850">{selectedTx.member_name || 'Bukan Member (Umum)'}</span>
              </div>

              {selectedTx.notes && (
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Keterangan / Notes</span>
                  <p className="bg-slate-50 border border-slate-100 p-2.5 rounded text-slate-650 leading-relaxed font-body mt-1 text-[11px]">{selectedTx.notes}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <span className="text-[10px] text-slate-400 block uppercase mb-2">Daftar Barang Penjualan</span>
                <div className="bg-slate-50 border border-slate-150 rounded overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#6C7A89] text-white text-[9px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-2 px-3">Nama Produk</th>
                        <th className="py-2 px-3 text-center">Jumlah</th>
                        <th className="py-2 px-3 text-right">Harga Satuan</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[10px]">
                      {selectedTx.items && selectedTx.items.length > 0 ? (
                        selectedTx.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 text-slate-800 font-bold">{item.product_name}</td>
                            <td className="py-2 px-3 text-center">{item.quantity}</td>
                            <td className="py-2 px-3 text-right">Rp {item.unit_price.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right font-extrabold text-slate-800">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400 font-bold uppercase tracking-wider">
                            Pendaftaran / Pembayaran Membership Langsung (Tidak Ada Item Retail)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-sm font-black text-slate-800">
                <span>TOTAL TRANSAKSI</span>
                <span className="text-[#DC3545]">Rp {selectedTx.total_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
