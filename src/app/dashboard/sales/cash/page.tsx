'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ShoppingBag, CreditCard, Trash2, Check, Plus, Printer, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
  code: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number;
  subtotal: number;
}

const BRANCH_ADDRESSES: Record<string, string> = {
  'LIMO': 'Jl. Naman Iskandar No.95\nLimo, Kec. Limo, Kota Depok, Jawa Barat 16515',
  'GROGOL': 'Jl. Raya Grogol No.12\nGrogol, Jakarta Barat, DKI Jakarta 11440',
  'PANCORAN_MAS': 'Jl. Raya Sawangan No.45\nPancoran Mas, Kota Depok, Jawa Barat 16436',
};

export default function TransaksiTunaiPage() {
  const { activeBranchID, branches, user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form input states
  const [selectedProductID, setSelectedProductID] = useState('');
  const [unit, setUnit] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Printable receipt state
  const [completedTx, setCompletedTx] = useState<any | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    if (activeBranchID) {
      fetchProducts();
    }
  }, [activeBranchID]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<any>(`/admin/products?branch_id=${activeBranchID}&per_page=100`);
      if (res.success && res.data) {
        setProducts(res.data.filter((p: any) => p.is_active));
      } else {
        setError(res.error || 'Gagal mengambil data barang');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat produk dari server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductID) {
      alert('Silakan pilih barang terlebih dahulu.');
      return;
    }
    if (!unit || unit <= 0) {
      alert('Silakan masukkan jumlah unit yang valid.');
      return;
    }

    const product = products.find((p) => p.id === selectedProductID);
    if (!product) return;

    if (product.stock < unit) {
      alert(`Stok tidak mencukupi. Sisa stok ${product.name}: ${product.stock} ${product.unit}`);
      return;
    }

    // Check if product already in cart
    const existingIndex = cart.findIndex((item) => item.product.id === product.id && item.discountPercent === discountPercent);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + unit;
      if (product.stock < newQty) {
        alert(`Total unit di keranjang (${newQty}) melebihi stok yang ada (${product.stock}).`);
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
      
      const price = product.price;
      const unitDiscount = price * (discountPercent / 100);
      updatedCart[existingIndex].subtotal = (price - unitDiscount) * newQty;
      setCart(updatedCart);
    } else {
      const price = product.price;
      const unitDiscount = price * (discountPercent / 100);
      const subtotal = (price - unitDiscount) * unit;
      setCart([...cart, { product, quantity: unit, discountPercent, subtotal }]);
    }

    // Reset inputs
    setSelectedProductID('');
    setUnit('');
    setDiscountPercent(0);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Set default payment amount when grand total changes or payment method changes
  useEffect(() => {
    if (paymentMethod && paymentMethod !== 'Tunai') {
      setPaymentAmount(grandTotal);
    } else if (paymentMethod === 'Tunai' && (paymentAmount === '' || paymentAmount < grandTotal)) {
      setPaymentAmount(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  const handleFinishTransaction = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja kosong.');
      return;
    }
    if (!paymentMethod) {
      alert('Silakan pilih jenis pembayaran.');
      return;
    }
    if (paymentAmount === '' || paymentAmount < grandTotal) {
      alert('Jumlah bayar tidak boleh kurang dari total belanja.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const body = {
      member_id: null,
      notes: `POS Retail - Pembayaran: ${paymentMethod}`,
      total_amount: grandTotal,
      payment_method: paymentMethod,
      payment_amount: Number(paymentAmount),
      change_amount: paymentMethod === 'Tunai' ? Number(paymentAmount) - grandTotal : 0,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        discount_percent: item.discountPercent,
      })),
    };

    try {
      const res = await api.post<any>('/admin/transactions', body);
      if (res.success && res.data) {
        setCompletedTx(res.data);
        setIsPrintOpen(true);
        // Clear cart and states
        setCart([]);
        setPaymentMethod('');
        setPaymentAmount('');
        // Refresh products stock
        fetchProducts();
      } else {
        setError(res.error || 'Gagal menyimpan transaksi');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghubungi server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBranch = branches.find((b) => b.id === activeBranchID);
  const activeBranchName = activeBranch ? activeBranch.name : 'Prabu Gym';
  const activeBranchCode = activeBranch ? activeBranch.code : 'LIMO';
  const branchAddress = BRANCH_ADDRESSES[activeBranchCode.toUpperCase()] || 'Limo, Depok';

  const formatInvoiceNumber = (tx: any) => {
    if (!tx) return '';
    // Custom format: PRABU.LMO.YYMMDD.NNN or use real tx number
    const codeMap: Record<string, string> = {
      'LIMO': 'LMO',
      'GROGOL': 'GGL',
      'PANCORAN_MAS': 'PMS'
    };
    const bCode = codeMap[activeBranchCode.toUpperCase()] || 'LMO';
    
    // Parse date for invoice
    const date = new Date(tx.transaction_date || tx.created_at);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // Get sequence number from transaction number if format matches TRX-BRANCH-YYYYMMDD-SEQ
    const txNum = tx.transaction_number || '';
    const seq = txNum.split('-').pop() || '001';
    
    return `PRABU.${bCode}.${yy}${mm}${dd}.${seq}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #receipt-print-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            display: block !important;
            width: 80mm !important;
            margin: 0 auto !important;
            font-family: monospace !important;
          }
        }
      `}</style>

      {/* Header Breadcrumbs */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg flex items-center justify-between no-print">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span>Transaksi Penjualan</span>
          <span>&gt;</span>
          <span className="text-[#DC3545]">Transaksi Tunai</span>
        </div>
        
        {/* Dynamic Branch Tag */}
        {activeBranch && (
          <div className="px-3.5 py-1.5 border border-red-500 text-red-500 font-extrabold text-xs rounded-full uppercase tracking-wider bg-red-50/50 select-none">
            Club {activeBranchName.replace('Prabu Gym ', '')}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded shadow-sm no-print">
          ⚠️ {error}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden no-print">
        <div className="bg-[#17A2B8] px-6 py-4 text-white font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          <span className="text-sm uppercase tracking-wider">Transaksi Tunai</span>
        </div>

        <div className="p-6 space-y-8">
          {/* Section 1: Transaksi */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Transaksi</h3>
            
            <form onSubmit={handleAddItem} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 max-md:grid-cols-1 items-end">
              <div>
                <label className="block text-slate-500 text-[10px] uppercase tracking-widest font-accent mb-1.5">
                  Nama Barang
                </label>
                <select
                  value={selectedProductID}
                  onChange={(e) => setSelectedProductID(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#17A2B8] rounded h-10 cursor-pointer"
                >
                  <option value="">-Pilih-</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase tracking-widest font-accent mb-1.5">
                  Unit
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Masukan Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#17A2B8] rounded h-10"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase tracking-widest font-accent mb-1.5">
                  Discount
                </label>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#17A2B8] rounded h-10 cursor-pointer"
                >
                  <option value="0">-Pilih-</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                  <option value="40">40%</option>
                  <option value="50">50%</option>
                  <option value="60">60%</option>
                  <option value="70">70%</option>
                  <option value="80">80%</option>
                  <option value="90">90%</option>
                </select>
              </div>

              <button
                type="submit"
                className="h-10 px-5 bg-[#1abc9c] hover:bg-[#16a085] text-white font-accent font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer max-md:w-full"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </form>

            {/* Cart Table */}
            <div className="border border-slate-200 rounded overflow-hidden mt-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                    <th className="py-2.5 px-4 border-r border-slate-350 w-12 text-center">No</th>
                    <th className="py-2.5 px-4 border-r border-slate-350">Nama Barang</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 w-32 text-right">Harga</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 w-24 text-center">Diskon</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 w-36 text-right">Subtotal</th>
                    <th className="py-2.5 px-4 w-20 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {cart.length > 0 ? (
                    cart.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 text-center border-r border-slate-100 font-mono">{index + 1}</td>
                        <td className="py-2.5 px-4 border-r border-slate-100 font-semibold">{item.product.name}</td>
                        <td className="py-2.5 px-4 text-center border-r border-slate-100 font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-4 border-r border-slate-100">
                          <div className="flex justify-between font-mono">
                            <span>Rp</span>
                            <span>{item.product.price.toLocaleString('id-ID')}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center border-r border-slate-100 font-semibold text-slate-500">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-100">
                          <div className="flex justify-between font-mono font-bold text-slate-900">
                            <span>Rp</span>
                            <span>{item.subtotal.toLocaleString('id-ID')}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 border border-red-200 hover:border-red-500 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Hapus item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold select-none italic text-sm">
                        "Transaksi Kosong"
                      </td>
                    </tr>
                  )}
                  {/* Grand Total Row */}
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td colSpan={5} className="py-3 px-4 text-slate-800 text-right uppercase tracking-wider text-[10px] select-none border-r border-slate-200">
                      Grand Total
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200">
                      <div className="flex justify-between font-mono text-[#DC3545] font-extrabold text-sm">
                        <span>Rp</span>
                        <span>{grandTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Pembayaran Transaksi */}
          {cart.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h3 className="font-heading text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
                Pembayaran Transaksi
              </h3>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase tracking-widest font-accent mb-1.5">
                    Jenis Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#17A2B8] rounded h-10 cursor-pointer"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                {paymentMethod && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-slate-500 text-[10px] uppercase tracking-widest font-accent mb-1.5">
                        Jumlah Bayar
                      </label>
                      <input
                        type="number"
                        placeholder="Masukkan Jumlah Bayar"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#17A2B8] rounded h-10 font-mono text-sm"
                      />
                    </div>

                    {paymentMethod === 'Tunai' && paymentAmount !== '' && paymentAmount >= grandTotal && (
                      <div className="flex justify-between items-center bg-slate-50 p-3.5 border border-slate-200 rounded font-mono text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wider">Kembalian:</span>
                        <span className="text-emerald-600 font-extrabold text-sm">
                          Rp {(paymentAmount - grandTotal).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleFinishTransaction}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#1abc9c] hover:bg-[#16a085] text-white font-accent font-bold text-xs uppercase tracking-widest rounded transition-colors shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        'Menyimpan Transaksi...'
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Transaksi Selesai
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable thermal receipt modal container */}
      {isPrintOpen && completedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 p-8 rounded shadow-2xl relative max-w-sm w-full">
            <button
              onClick={() => setIsPrintOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Preview Label */}
            <div className="text-center mb-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b pb-2">
              Preview Struk Belanja
            </div>

            {/* Thermal Print Area */}
            <div id="receipt-print-area" className="text-black font-mono text-xs leading-relaxed mx-auto w-[280px]">
              {/* Logo section */}
              <div className="flex flex-col items-center justify-center text-center space-y-1 mb-3">
                <svg className="w-16 h-auto text-red-650" viewBox="0 0 500 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M170 55 L200 85 L250 45 L300 85 L330 55 L320 100 L180 100 Z" fill="#DC3545" />
                  <rect x="70" y="110" width="15" height="50" rx="4" fill="#1E293B" />
                  <rect x="90" y="100" width="15" height="70" rx="4" fill="#1E293B" />
                  <rect x="110" y="90" width="18" height="90" rx="6" fill="#1E293B" />
                  <rect x="128" y="130" width="244" height="10" fill="#1E293B" />
                  <rect x="372" y="90" width="18" height="90" rx="6" fill="#1E293B" />
                  <rect x="395" y="100" width="15" height="70" rx="4" fill="#1E293B" />
                  <rect x="415" y="110" width="15" height="50" rx="4" fill="#1E293B" />
                  <path d="M210 145 C210 120, 290 120, 290 145 C290 160, 210 160, 210 145 Z" fill="#DC3545" />
                  <path d="M215 140 C215 130, 230 130, 230 140 M230 140 C230 130, 245 130, 245 140 M245 140 C245 130, 260 130, 260 140 M260 140 C260 130, 275 130, 275 140" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                  <text x="250" y="205" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="48" fill="#1E293B" letterSpacing="2">PRABU</text>
                  <text x="250" y="235" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="22" fill="#DC3545" letterSpacing="4">GYM</text>
                </svg>
                <div className="text-[10px] text-center font-bold whitespace-pre-line leading-tight">
                  {branchAddress}
                </div>
              </div>

              {/* Invoice details header */}
              <div className="text-[10px] space-y-0.5 border-t border-dashed border-black pt-2 mb-2">
                <div className="flex justify-between">
                  <span>No Struk :</span>
                  <span className="font-bold">{formatInvoiceNumber(completedTx)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal  :</span>
                  <span>{new Date(completedTx.transaction_date || completedTx.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir    :</span>
                  <span className="uppercase">{user?.full_name || 'Kasir'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-dashed border-black py-2 space-y-2">
                {completedTx.items?.map((item: any, idx: number) => {
                  const itemPrice = item.unit_price || 0;
                  const itemDiscount = item.discount_percent || 0;
                  return (
                    <div key={idx} className="space-y-0.5 text-[11px]">
                      <div className="font-bold">{item.product_name}</div>
                      <div className="flex justify-between text-[10px] pl-2">
                        <span>
                          {item.quantity} x {itemPrice.toLocaleString('id-ID')}
                          {itemDiscount > 0 ? ` (Disc ${itemDiscount}%)` : ''}
                        </span>
                        <span>{item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary totals */}
              <div className="border-t border-dashed border-black py-2 text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span>{completedTx.total_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({completedTx.payment_method})</span>
                  <span>{completedTx.payment_amount.toLocaleString('id-ID')}</span>
                </div>
                {completedTx.payment_method === 'Tunai' && (
                  <div className="flex justify-between">
                    <span>Kembalian</span>
                    <span>{completedTx.change_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Thank you note */}
              <div className="border-t border-dashed border-black pt-3 text-center text-[10px] uppercase font-bold tracking-wider">
                Thank you for your visit
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white text-[11px] font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
              <button
                onClick={() => setIsPrintOpen(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-[11px] font-accent font-bold uppercase rounded cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print container containing ONLY the receipt */}
      {completedTx && (
        <div className="hidden print:block print-container">
          <div className="text-black font-mono text-[10px] leading-relaxed mx-auto w-full">
            {/* Logo section */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 mb-2">
              <div className="text-center font-extrabold text-sm tracking-widest uppercase">
                PRABU GYM
              </div>
              <div className="text-[8px] text-center font-bold whitespace-pre-line leading-tight">
                {branchAddress}
              </div>
            </div>

            {/* Invoice details */}
            <div className="space-y-0.5 border-t border-dashed border-black pt-1 mb-1.5 text-[9px]">
              <div className="flex justify-between">
                <span>Struk: {formatInvoiceNumber(completedTx)}</span>
                <span>{new Date(completedTx.transaction_date || completedTx.created_at).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir: {user?.full_name || 'Kasir'}</span>
                <span>Pembayaran: {completedTx.payment_method}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-black my-1" />

            {/* Items */}
            <div className="space-y-1.5 text-[9px]">
              {completedTx.items?.map((item: any, idx: number) => {
                const itemPrice = item.unit_price || 0;
                const itemDiscount = item.discount_percent || 0;
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold">{item.product_name}</div>
                    <div className="flex justify-between pl-2">
                      <span>
                        {item.quantity} x {itemPrice.toLocaleString('id-ID')}
                        {itemDiscount > 0 ? ` (Disc ${itemDiscount}%)` : ''}
                      </span>
                      <span>{item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-black my-1.5" />

            {/* Summary */}
            <div className="text-[9px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>Grand Total</span>
                <span>{completedTx.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar</span>
                <span>{completedTx.payment_amount.toLocaleString('id-ID')}</span>
              </div>
              {completedTx.payment_method === 'Tunai' && (
                <div className="flex justify-between font-bold">
                  <span>Kembalian</span>
                  <span>{completedTx.change_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-black my-1.5" />

            {/* Footer */}
            <div className="text-center text-[8px] font-bold uppercase tracking-wider">
              Thank you for your visit
            </div>
            <div className="border-t border-dashed border-black my-1" />
          </div>
        </div>
      )}
    </div>
  );
}
