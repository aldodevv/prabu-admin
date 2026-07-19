'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { distributorsApi } from '@/core/api';
import { Distributor } from '@/core/types';

interface PurchaseOrder {
  id: string;
  order_number: string;
  distributor_name: string;
  order_date: string;
  total_cost: number;
  payment_status: string;
}

export default function PurchaseTransactionsPage() {
  const { activeBranchID } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [status, setStatus] = useState('Lunas');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (activeBranchID) {
      fetchOrders();
      fetchDistributors();
    }
  }, [activeBranchID]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setOrders([
          {
            id: 'po1',
            order_number: 'PO-20260701-01',
            distributor_name: 'PT Suplemen Bugar Jaya',
            order_date: '2026-07-01',
            total_cost: 4500000,
            payment_status: 'Lunas'
          },
          {
            id: 'po2',
            order_number: 'PO-20260710-02',
            distributor_name: 'CV Agung Sports & Wear',
            order_date: '2026-07-10',
            total_cost: 2350000,
            payment_status: 'Sebagian'
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistributor || !orderNumber || !totalCost) return;
    setSubmitting(true);

    const distObj = distributors.find(d => d.id === selectedDistributor);
    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      order_number: orderNumber,
      distributor_name: distObj?.name || 'Distributor',
      order_date: new Date().toISOString().split('T')[0],
      total_cost: parseInt(totalCost),
      payment_status: status
    };

    setTimeout(() => {
      setOrders([newOrder, ...orders]);
      setIsFormOpen(false);
      setSelectedDistributor('');
      setOrderNumber('');
      setTotalCost('');
      setStatus('Lunas');
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">TRANSAKSI PEMBELIAN</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pencatatan pembelian barang stock / perlengkapan gym dari pihak supplier/distributor
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm cursor-pointer"
        >
          + CATAT PEMBELIAN BARU
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading transaksi pembelian...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Riwayat Invoice Transaksi Pembelian</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nomor PO / Surat</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Supplier / Distributor</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tanggal Order</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-right">Total Biaya (HPP)</th>
                    <th className="py-3 px-4 text-center">Status Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 border-r border-slate-100">{o.order_number}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-750">{o.distributor_name}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 font-mono text-slate-500">{o.order_date}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-right text-slate-800 font-extrabold">Rp {o.total_cost.toLocaleString('id-ID')}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${
                            o.payment_status === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-heading text-xl text-slate-800 mb-6 border-b border-slate-100 pb-3">
              CATAT PEMBELIAN SUPLAI BARU
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Nomor Order / PO *
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Contoh: PO-20260715-01"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Supplier / Distributor *
                </label>
                <select
                  value={selectedDistributor}
                  onChange={(e) => setSelectedDistributor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  required
                >
                  <option value="">-- PILIH DISTRIBUTOR --</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Total Pembelian (IDR) *
                  </label>
                  <input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Status Bayar *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Sebagian">Bayar Sebagian / DP</option>
                    <option value="Hutang">Belum Bayar</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'MEMPROSES...' : 'CATAT PEMBELIAN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
