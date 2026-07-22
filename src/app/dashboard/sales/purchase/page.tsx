'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { purchaseTransactionsApi, distributorsApi, productsApi } from '@/core/api';
import { PurchaseTransaction, Distributor, Product } from '@/core/types';
import { Search, Plus, Eye, ArrowLeft, Printer, Trash2, Check, Edit2, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToExcel } from '@/lib/excelExport';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';

interface PurchaseItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function PurchaseTransactionsPage() {
  const { activeBranchID, user } = useAuth();
  const isOwner = user?.role === 'owner';

  // step: 'list' | 'create_meta' | 'add_items' | 'detail'
  const [step, setStep] = useState<'list' | 'create_meta' | 'add_items' | 'detail'>('list');
  const [orders, setOrders] = useState<PurchaseTransaction[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseTransaction[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseTransaction | null>(null);

  // Search, Debounce & Column Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [isTyping, setIsTyping] = useState(false);

  // Step 1 Meta Form states
  const [transactionDate, setTransactionDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [distributorName, setDistributorName] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2 Add Items states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputUnit, setInputUnit] = useState<number | string>(1);
  const [itemsList, setItemsList] = useState<PurchaseItemInput[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchOrders();
      fetchDistributors();
      fetchProducts();
    }
  }, [activeBranchID]);

  // Handle typing state
  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [searchQuery, debouncedSearch]);

  // Apply filtering when debouncedSearch or filterColumn changes
  useEffect(() => {
    applyFilter();
  }, [debouncedSearch, filterColumn, orders]);

  const fetchOrders = async () => {
    if (!activeBranchID) return;
    setLoading(true);
    try {
      const res = await purchaseTransactionsApi.list(activeBranchID);
      if (res.success && res.data) {
        setOrders(res.data);
        setFilteredOrders(res.data);
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

  const fetchProducts = async () => {
    if (!activeBranchID) return;
    try {
      const res = await productsApi.list(activeBranchID);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilter = () => {
    if (!debouncedSearch.trim() && !filterColumn) {
      setFilteredOrders(orders);
      return;
    }

    const q = debouncedSearch.toLowerCase().trim();
    const filtered = orders.filter((o) => {
      if (filterColumn === 'transaction_number') return o.transaction_number.toLowerCase().includes(q);
      if (filterColumn === 'invoice_number') return o.invoice_number.toLowerCase().includes(q);
      if (filterColumn === 'distributor_name') return o.distributor_name.toLowerCase().includes(q);
      if (filterColumn === 'admin_name') return (o.admin_name || '').toLowerCase().includes(q);

      return (
        o.transaction_number.toLowerCase().includes(q) ||
        o.invoice_number.toLowerCase().includes(q) ||
        o.distributor_name.toLowerCase().includes(q) ||
        (o.admin_name || '').toLowerCase().includes(q) ||
        (o.notes || '').toLowerCase().includes(q)
      );
    });

    setFilteredOrders(filtered);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setFilterColumn('');
    setFilteredOrders(orders);
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Tanggal', 'No. Transaksi', 'No. Faktur / Invoice', 'Distributor', 'Total Harga (IDR)', 'Petugas CS'];
    const data = filteredOrders.map((o, index) => [
      index + 1,
      formatDateLabel(o.transaction_date),
      o.transaction_number,
      o.invoice_number,
      o.distributor_name,
      o.total_amount || 0,
      o.admin_name || '-',
    ]);

    exportToExcel({
      filename: `Transaksi_Pembelian_Prabu_Gym_${new Date().toISOString().split('T')[0]}`,
      title: 'TRANSAKSI PEMBELIAN BARANG - PRABU GYM',
      headers,
      data,
    });
  };

  const columnOptions = [
    { label: 'No. Transaksi', value: 'transaction_number' },
    { label: 'No. Faktur / Invoice', value: 'invoice_number' },
    { label: 'Distributor', value: 'distributor_name' },
    { label: 'Petugas CS', value: 'admin_name' },
  ];

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const handleOpenCreateMeta = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTransactionDate(todayStr);
    setInvoiceNumber('');
    setTransactionNumber('');
    setDistributorId('');
    setDistributorName('');
    setNotes('');
    setItemsList([]);
    setErrorMsg('');
    setSuccessMsg('');

    if (activeBranchID) {
      try {
        const res = await purchaseTransactionsApi.getNextNumbers(activeBranchID);
        if (res.success && res.data) {
          setTransactionNumber(res.data.transaction_number);
          setInvoiceNumber(res.data.next_invoice);
        }
      } catch (err) {
        console.error(err);
      }
    }

    setStep('create_meta');
  };

  const handleProceedToAddItems = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorId) {
      setErrorMsg('Silakan pilih distributor terlebih dahulu');
      return;
    }

    const distObj = distributors.find((d) => d.id === distributorId);
    setDistributorName(distObj ? distObj.name : 'Distributor');
    setErrorMsg('');
    setStep('add_items');
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      setErrorMsg('Pilih barang terlebih dahulu!');
      return;
    }
    const qty = Number(inputUnit);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Jumlah unit harus lebih dari 0');
      return;
    }

    const prodObj = products.find((p) => p.id === selectedProductId);
    if (!prodObj) return;

    const unitPrice = prodObj.buy_price || prodObj.price || 0;
    const subtotal = qty * unitPrice;

    // Check if already in list
    const existingIndex = itemsList.findIndex((it) => it.product_id === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...itemsList];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * unitPrice;
      setItemsList(updated);
    } else {
      setItemsList([
        ...itemsList,
        {
          product_id: prodObj.id,
          product_name: prodObj.name,
          quantity: qty,
          unit_price: unitPrice,
          subtotal,
        },
      ]);
    }

    setSelectedProductId('');
    setInputUnit(1);
    setErrorMsg('');
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...itemsList];
    updated.splice(index, 1);
    setItemsList(updated);
  };

  const calculateGrandTotal = () => {
    return itemsList.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCompleteTransaction = async () => {
    if (itemsList.length === 0) {
      setErrorMsg('Data Barang Tidak Boleh Kosong');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const body = {
        transaction_date: transactionDate,
        invoice_number: invoiceNumber,
        distributor_id: distributorId,
        notes,
        items: itemsList.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      };

      const res = await purchaseTransactionsApi.create(body);
      if (res.success && res.data) {
        setSuccessMsg('Transaksi Pembelian berhasil disimpan!');
        fetchOrders();
        fetchProducts(); // refresh product stock
        setTimeout(() => setStep('list'), 1000);
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan transaksi pembelian');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan koneksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await purchaseTransactionsApi.get(id);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
        setStep('detail');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string, txNum: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus transaksi pembelian "${txNum}"? Stok akan dikembalikan.`)) {
      return;
    }
    try {
      const res = await purchaseTransactionsApi.delete(id);
      if (res.success) {
        alert('Transaksi berhasil dihapus');
        fetchOrders();
        fetchProducts();
      } else {
        alert(res.error || 'Gagal menghapus transaksi');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi');
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const itemsRows = (selectedOrder.items || [])
      .map(
        (it, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${it.product_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${it.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rp ${it.unit_price.toLocaleString('id-ID')}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Rp ${it.subtotal.toLocaleString('id-ID')}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice Pembelian - ${selectedOrder.transaction_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #17A2B8; padding-bottom: 15px; margin-bottom: 20px; }
            .header h2 { margin: 0; color: #17A2B8; font-size: 24px; text-transform: uppercase; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #666; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            .meta-table td { padding: 6px; }
            .meta-table tr td:first-child { font-weight: bold; width: 150px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            .items-table th { background: #6C7A89; color: white; padding: 10px; text-align: left; text-transform: uppercase; font-size: 11px; }
            .grand-total { font-weight: bold; font-size: 14px; background: #f8f9fa; }
            .footer { margin-top: 40px; text-align: right; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PRABU GYM SYSTEM</h2>
            <p>Bukti Invoice Transaksi Pembelian Stok</p>
          </div>

          <table class="meta-table">
            <tr><td>Nomor Transaksi</td><td>: ${selectedOrder.transaction_number}</td></tr>
            <tr><td>Nomor Invoice</td><td>: ${selectedOrder.invoice_number}</td></tr>
            <tr><td>Tanggal Transaksi</td><td>: ${selectedOrder.transaction_date}</td></tr>
            <tr><td>Nama Distributor</td><td>: ${selectedOrder.distributor_name}</td></tr>
            <tr><td>Keterangan</td><td>: ${selectedOrder.notes || '-'}</td></tr>
            <tr><td>Nama CS</td><td>: ${selectedOrder.admin_name}</td></tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Nama Barang</th>
                <th style="width: 80px; text-align: center;">Unit</th>
                <th style="width: 120px; text-align: right;">Harga Barang</th>
                <th style="width: 120px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr class="grand-total">
                <td colspan="4" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Grand Total:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 15px; color: #17A2B8;">Rp ${selectedOrder.total_amount.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Printed on: ${new Date().toLocaleString('id-ID')}</p>
            <p>Petugas CS: ${selectedOrder.admin_name}</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatIDR = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Breadcrumbs */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span>Transaksi Penjualan</span>
          <span>&gt;</span>
          <span className="text-[#DC3545]">Transaksi Pembelian</span>
          {step === 'create_meta' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Tambah Pembelian</span>
            </>
          )}
          {step === 'add_items' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Add Purchase</span>
            </>
          )}
          {step === 'detail' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Lihat Detail</span>
            </>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mt-1 uppercase tracking-tight select-none">
          {step === 'list'
            ? 'Transaksi Pembelian'
            : step === 'create_meta'
            ? 'Tambah Pembelian'
            : step === 'add_items'
            ? 'Add Purchase'
            : 'Lihat Detail'}
        </h2>
      </div>

      {step === 'list' && (
        <div className="space-y-6">
          {/* Reusable Search & Filter Bar */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Ketik no. transaksi, no. faktur, distributor..."
            columnOptions={columnOptions}
            selectedColumn={filterColumn}
            onColumnChange={setFilterColumn}
            isTyping={isTyping}
            onExportExcel={handleExportExcel}
            onReset={handleResetSearch}
          />

          {/* Card Table Transaksi Pembelian */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex justify-between items-center select-none">
              <span className="text-sm uppercase tracking-wider">Transaksi Pembelian</span>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={handleOpenCreateMeta}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Pembelian
              </button>

              {loading ? (
                <div className="text-center py-10 text-slate-500 font-accent uppercase tracking-widest text-xs">
                  Loading data transaksi pembelian...
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-sm text-slate-650 border-collapse">
                    <thead className="bg-[#6C7A89] text-white text-[11px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-300 w-12 text-center">No</th>
                        <th className="py-3 px-4 border-r border-slate-300">Tanggal</th>
                        <th className="py-3 px-4 border-r border-slate-300">No. Transaksi</th>
                        <th className="py-3 px-4 border-r border-slate-300">No. Faktur</th>
                        <th className="py-3 px-4 border-r border-slate-300">Distributor</th>
                        <th className="py-3 px-4 border-r border-slate-300">Catatan</th>
                        <th className="py-3 px-4 border-r border-slate-300">Petugas</th>
                        <th className="py-3 px-4 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-accent uppercase tracking-wider text-xs">
                            Tidak ada data transaksi pembelian
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o, index) => (
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 border-r border-slate-100 text-center font-semibold text-slate-500">{index + 1}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-mono text-xs text-slate-600">{o.transaction_date}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-mono text-xs font-bold text-slate-800">{o.transaction_number}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-mono text-xs text-slate-700 font-semibold">{o.invoice_number}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800">{o.distributor_name}</td>
                            <td className="py-3 px-4 border-r border-slate-100 text-xs text-slate-600">{o.notes || '-'}</td>
                            <td className="py-3 px-4 border-r border-slate-100 text-xs font-semibold text-slate-700">{o.admin_name}</td>
                            <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                              {/* Icon-Only Action Buttons with Hover Tooltips */}
                              <button
                                onClick={() => handleOpenDetail(o.id)}
                                title="Lihat Detail Pembelian"
                                className="p-2 bg-[#6C7A89] hover:bg-[#5a6673] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isOwner && (
                                <button
                                  onClick={() => handleDeleteOrder(o.id, o.transaction_number)}
                                  title="Hapus Transaksi Pembelian"
                                  className="p-2 bg-[#DC3545] hover:bg-[#C82333] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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

      {step === 'create_meta' && (
        /* Form Step 1: Tambah Pembelian (Metadata) */
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden w-full">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <Plus className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">Tambah Pembelian</span>
          </div>
          <div className="p-6 md:p-8">
            <form onSubmit={handleProceedToAddItems} className="space-y-6 w-full">
              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold px-4 py-3 border border-red-200 rounded">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="space-y-5">
                {/* Tanggal Transaksi */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded font-mono"
                    required
                  />
                </div>

                {/* Nomor Invoice */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">Nomor Invoice</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Masukkan Nomor Invoice"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded font-mono font-semibold"
                    required
                  />
                </div>

                {/* Nama Distributor */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">Nama Distributor</label>
                  <select
                    value={distributorId}
                    onChange={(e) => setDistributorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded font-medium"
                    required
                  >
                    <option value="">-Pilih-</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keterangan */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left mt-2">Keterangan</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukkan Keterangan (contoh: L Mineral Besar 2 dus 24 Botol)"
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 justify-end pt-6 border-t border-slate-200/60">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Simpan & Lanjut Add Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setStep('list')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {step === 'add_items' && (
        /* Form Step 2: Add Purchase Items */
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <Plus className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">Add Purchase</span>
          </div>

          <div className="p-6 space-y-6">
            {/* Header Data Table */}
            <div className="border border-slate-200 rounded overflow-hidden divide-y divide-slate-200 text-sm">
              <div className="flex bg-slate-50 p-3">
                <div className="w-44 font-bold text-slate-700">No Transaction</div>
                <div className="font-mono font-bold text-slate-800">{transactionNumber}</div>
              </div>
              <div className="flex p-3">
                <div className="w-44 font-bold text-slate-700">No Invoice</div>
                <div className="font-mono font-bold text-slate-800">{invoiceNumber}</div>
              </div>
              <div className="flex bg-slate-50 p-3">
                <div className="w-44 font-bold text-slate-700">Distributor Name</div>
                <div className="font-bold text-slate-800">{distributorName}</div>
              </div>
              <div className="flex p-3">
                <div className="w-44 font-bold text-slate-700">Description</div>
                <div className="text-slate-800">{notes || '-'}</div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs font-semibold px-4 py-3 border border-red-200 rounded flex justify-between items-center">
                <span>⚠️ {errorMsg}</span>
                <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold hover:text-red-700">
                  ✕
                </button>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-3 border border-emerald-200 rounded">
                ✓ {successMsg}
              </div>
            )}

            {/* Input Add Item Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-white border border-slate-350 text-slate-700 text-xs px-3 py-2.5 rounded focus:outline-none min-w-[260px]"
              >
                <option value="">-Pilih Barang-</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Harga Beli: {formatIDR(p.buy_price || p.price)})
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={inputUnit}
                onChange={(e) => setInputUnit(e.target.value)}
                placeholder="Masukkan Unit"
                className="bg-white border border-slate-350 text-slate-700 text-xs px-3 py-2.5 rounded focus:outline-none w-36 font-mono"
              />

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center justify-center p-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold rounded shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Purchase Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-sm text-slate-650 border-collapse">
                <thead className="bg-[#6C7A89] text-white text-[11px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300 w-12 text-center">No</th>
                    <th className="py-3 px-4 border-r border-slate-300">Product Name</th>
                    <th className="py-3 px-4 border-r border-slate-300 text-center w-24">Qty</th>
                    <th className="py-3 px-4 border-r border-slate-300 text-right">Purchase Price</th>
                    <th className="py-3 px-4 border-r border-slate-300 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {itemsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-accent uppercase tracking-wider text-xs">
                        Belum ada barang dipilih
                      </td>
                    </tr>
                  ) : (
                    itemsList.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-semibold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800">{it.product_name}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-mono font-extrabold text-slate-800">{it.quantity}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-right font-mono font-semibold text-slate-700">{formatIDR(it.unit_price)}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-right font-mono font-bold text-slate-800">{formatIDR(it.subtotal)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-[#6C7A89]/10 font-bold">
                    <td colSpan={4} className="py-3 px-4 border-r border-slate-300 text-right uppercase text-slate-800">
                      Grand Total
                    </td>
                    <td className="py-3 px-4 border-r border-slate-300 text-right font-mono text-base text-[#17A2B8] font-extrabold">
                      {formatIDR(calculateGrandTotal())}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Complete Transaction Button Bar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCompleteTransaction}
                disabled={submitting || itemsList.length === 0}
                className="w-full py-3 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {submitting ? 'MEMPROSES TRANSAKSI...' : '✔ Transaction is complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'detail' && selectedOrder && (
        /* Halaman Lihat Detail & Print Invoice Transaksi Pembelian */
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex justify-between items-center select-none">
            <span className="text-sm uppercase tracking-wider">Lihat Detail</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007BFF] hover:bg-[#0069D9] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Transaksi
              </button>
              <button
                onClick={() => setStep('list')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-semibold rounded cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Metadata Table */}
            <div className="border border-slate-200 rounded overflow-hidden divide-y divide-slate-200 text-sm">
              <div className="flex bg-slate-50 p-3">
                <div className="w-44 font-bold text-slate-700">Nomor Transaksi</div>
                <div className="font-mono font-bold text-slate-800">{selectedOrder.transaction_number}</div>
              </div>
              <div className="flex p-3">
                <div className="w-44 font-bold text-slate-700">Nomor Invoice</div>
                <div className="font-mono font-bold text-slate-800">{selectedOrder.invoice_number}</div>
              </div>
              <div className="flex bg-slate-50 p-3">
                <div className="w-44 font-bold text-slate-700">Nama Distributor</div>
                <div className="font-bold text-slate-800">{selectedOrder.distributor_name}</div>
              </div>
              <div className="flex p-3">
                <div className="w-44 font-bold text-slate-700">Keterangan</div>
                <div className="text-slate-800">{selectedOrder.notes || '-'}</div>
              </div>
              <div className="flex bg-slate-50 p-3">
                <div className="w-44 font-bold text-slate-700">Nama CS</div>
                <div className="font-semibold text-slate-800">{selectedOrder.admin_name}</div>
              </div>
            </div>

            {/* Item Table */}
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-sm text-slate-650 border-collapse">
                <thead className="bg-[#6C7A89] text-white text-[11px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300 w-12 text-center">No</th>
                    <th className="py-3 px-4 border-r border-slate-300">Nama Barang</th>
                    <th className="py-3 px-4 border-r border-slate-300 text-center w-24">Unit</th>
                    <th className="py-3 px-4 border-r border-slate-300 text-right">Harga Barang</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-accent uppercase tracking-wider text-xs">
                        Tidak ada detail barang
                      </td>
                    </tr>
                  ) : (
                    selectedOrder.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-semibold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800">{it.product_name}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-mono font-extrabold text-slate-800">{it.quantity}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-right font-mono text-slate-700">{formatIDR(it.unit_price)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{formatIDR(it.subtotal)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-[#6C7A89]/10 font-bold">
                    <td colSpan={4} className="py-3 px-4 border-r border-slate-300 text-right uppercase text-slate-800">
                      Grand Total
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-base text-[#17A2B8] font-extrabold">
                      {formatIDR(selectedOrder.total_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
