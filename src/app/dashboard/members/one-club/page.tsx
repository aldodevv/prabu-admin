'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Search, Eye, Edit, ArrowLeft, Save, Printer, FileText } from 'lucide-react';

interface Member {
  id: string;
  branch_id: string;
  branch_name: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  membership_type: string;
  membership_start: string;
  membership_end: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  transaction_number: string;
  member_id?: string;
  member_name?: string;
  admin_name: string;
  transaction_date: string;
  total_amount: number;
  notes?: string;
}

export default function OneClubMembersPanel() {
  const { activeBranchID, user } = useAuth();
  
  // Navigation states: 'list' | 'detail' | 'edit'
  const [step, setStep] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Members List states
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filters matching Search Box
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Edit states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [address, setAddress] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Details Sub-tabs: 'anggota' | 'latihan'
  const [detailTab, setDetailTab] = useState<'anggota' | 'latihan'>('anggota');
  const [memberTransactions, setMemberTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (activeBranchID) {
      fetchMembers();
    }
  }, [activeBranchID, page]);

  const fetchMembers = async (forceSearch = '') => {
    setLoading(true);
    try {
      const qSearch = forceSearch !== undefined ? forceSearch : search;
      const res = await api.get<any>(
        `/admin/members?branch_id=${activeBranchID}&page=${page}&search=${qSearch}`
      );
      if (res.success && res.data) {
        let list = res.data;
        // Filter status client-side if statusFilter is not 'Semua'
        if (statusFilter === 'Aktif') {
          list = list.filter((m: Member) => m.is_active && new Date(m.membership_end) >= new Date());
        } else if (statusFilter === 'Expired') {
          list = list.filter((m: Member) => m.is_active && new Date(m.membership_end) < new Date());
        } else if (statusFilter === 'Nonaktif') {
          list = list.filter((m: Member) => !m.is_active);
        }
        setMembers(list);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleResetSearch = () => {
    setSearch('');
    setStatusFilter('Semua');
    setPage(1);
    fetchMembers('');
  };

  const handleOpenDetail = async (m: Member) => {
    setSelectedMember(m);
    setDetailTab('anggota');
    setStep('detail');
    setLoadingTransactions(true);
    try {
      // Query branch transactions and filter client-side for member payments
      const res = await api.get<any>(`/admin/transactions?branch_id=${activeBranchID}&per_page=100`);
      if (res.success && res.data) {
        const filtered = res.data.filter(
          (tx: Transaction) =>
            tx.member_id === m.id ||
            (tx.notes && tx.notes.toLowerCase().includes(m.full_name.toLowerCase()))
        );
        setMemberTransactions(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleOpenEdit = (m: Member) => {
    setSelectedMember(m);
    setFullName(m.full_name);
    setGender(m.gender || 'Laki-laki');
    setDob(m.date_of_birth || '');
    setPhone(m.phone || '');
    setEmail(m.email || '');
    setSocialMedia(''); // extracted from notes if needed
    setAddress(m.address || '');
    setPhotoBase64(m.photo_url || '');
    setEditError('');
    setEditSuccess('');
    setStep('edit');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setLoading(true);
    setEditError('');
    setEditSuccess('');

    const body = {
      full_name: fullName,
      email,
      phone,
      address,
      date_of_birth: dob,
      gender,
      membership_type: selectedMember.membership_type,
      membership_start: selectedMember.membership_start,
      membership_end: selectedMember.membership_end,
      is_active: selectedMember.is_active,
      photo_url: photoBase64,
    };

    try {
      const res = await api.put<any>(`/admin/members/${selectedMember.id}`, body);
      if (res.success) {
        setEditSuccess('Data anggota berhasil disimpan.');
        // Refresh the member data list
        fetchMembers();
        setTimeout(() => {
          setStep('list');
        }, 1200);
      } else {
        setEditError(res.error || 'Gagal mengubah data anggota.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const getMembershipTypeFromNotes = (notes: string = '') => {
    const match = notes.match(/Paket:\s*([^\-,.]+)/i);
    if (match && match[1]) return match[1].trim();
    return selectedMember?.membership_type || '1 bulan';
  };

  const getPaymentMethod = (notes: string = '') => {
    const n = notes.toLowerCase();
    if (n.includes('tunai') || n.includes('cash')) return 'Tunai';
    if (n.includes('bca') || n.includes('transfer')) return 'BCA Transfer';
    if (n.includes('qris')) return 'QRIS';
    return 'Tunai';
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Stylesheet specifically for printing the Official Receipt popup */}
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #print-receipt-overlay {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #print-receipt-overlay {
            width: 100% !important;
            position: absolute;
            left: 0;
            top: 0;
            display: block !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 6px 8px !important;
            color: black !important;
          }
        }
      `}</style>

      <div className="no-print space-y-6">
        {/* Main List Step (Image 1 Layout) */}
      {step === 'list' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-heading text-slate-800">DATA ANGGOTA</h2>
            <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
              Cabang Grogol — Daftar Anggota & Riwayat Keuangan Aktif
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Search One Club</span>
            </div>
            <div className="p-6">
              <form onSubmit={handleSearchSubmit} className="flex gap-4 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Cari nama, nomor HP, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded min-w-[200px]"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded"
                >
                  <option value="Semua">-Pilih-</option>
                  <option value="Aktif">Status: Aktif</option>
                  <option value="Expired">Status: Expired</option>
                  <option value="Nonaktif">Status: Nonaktif</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Pencarian</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Tampilkan Semua</span>
                </button>
              </form>
            </div>
          </div>

          {/* Members Table */}
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
              Loading data anggota...
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
                <span className="text-sm uppercase tracking-wider">Daftar Anggota One Club</span>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-650 border border-slate-200">
                    <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-350/40 w-12 text-center">No</th>
                        <th className="py-3 px-4 border-r border-slate-350/40 w-28 text-center">Foto</th>
                        <th className="py-3 px-4 border-r border-slate-350/40">Nomor Anggota</th>
                        <th className="py-3 px-4 border-r border-slate-350/40">Nama Anggota</th>
                        <th className="py-3 px-4 border-r border-slate-350/40">Paket Anggota</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {members.length > 0 ? (
                        members.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 border-r border-slate-100 text-center">{idx + 1}</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-center flex justify-center">
                              <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded overflow-hidden flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold select-none">
                                {m.photo_url ? (
                                  <img src={m.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                  'No Photo'
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-800">@{m.username}</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-slate-800 font-bold">{m.full_name}</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-slate-700 uppercase text-xs">{m.membership_type}</td>
                            <td className="py-4 px-4 text-center select-none">
                              <div className="flex gap-2 justify-center flex-wrap">
                                <button
                                  onClick={() => handleOpenDetail(m)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#28A745] hover:bg-[#218838] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Detail
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(m)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#007BFF] hover:bg-[#0069d9] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit Personal
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold select-none">
                            Tidak ada data anggota ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Member Details Step (Image 2 Layout) */}
      {step === 'detail' && selectedMember && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header cyan bar */}
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center justify-between no-print">
            <span className="text-sm uppercase tracking-wider font-heading">Daftar Anggota</span>
          </div>

          <button
            onClick={() => setStep('list')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm no-print"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          {/* Data Personal Table */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">Data Personal</h3>
            <div className="border border-slate-200 overflow-hidden rounded-xs">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200 w-[25%]">Nomor Anggota</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800">@{selectedMember.username}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Nama Anggota</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{selectedMember.full_name}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Jenis Kelamin</td>
                    <td className="py-2.5 px-4 text-slate-800">{selectedMember.gender || 'Laki-Laki'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Tanggal Lahir</td>
                    <td className="py-2.5 px-4 text-slate-700">{selectedMember.date_of_birth || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Nomor HP</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800">{selectedMember.phone || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Email</td>
                    <td className="py-2.5 px-4 text-slate-800">{selectedMember.email || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Sosial Media</td>
                    <td className="py-2.5 px-4 text-slate-650">-</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Alamat</td>
                    <td className="py-2.5 px-4 text-slate-700 font-body">{selectedMember.address || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Tanggal Bergabung</td>
                    <td className="py-2.5 px-4 text-slate-600">{new Date(selectedMember.created_at).toLocaleDateString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaksi Pembayaran Section */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">Transaksi Pembayaran</h3>
            
            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 text-xs no-print select-none">
              <button
                onClick={() => setDetailTab('anggota')}
                className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  detailTab === 'anggota'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Transaksi Pembayaran Anggota
              </button>
              <button
                onClick={() => setDetailTab('latihan')}
                className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  detailTab === 'latihan'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Transaksi Pembayaran Latihan
              </button>
            </div>

            {loadingTransactions ? (
              <div className="text-center py-8 text-slate-500 font-semibold text-xs">
                Loading history transaksi...
              </div>
            ) : detailTab === 'anggota' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                  <thead className="bg-[#6C7A89] text-white text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Tanggal Pembayaran</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Nomor Transaksi</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Paket Anggota</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Masa Aktif</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">Total Pembayaran</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Keterangan</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Nama CS</th>
                      <th className="py-2.5 px-3 text-center no-print">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-semibold">
                    {memberTransactions.length > 0 ? (
                      memberTransactions.map((tx, idx) => {
                        const method = getPaymentMethod(tx.notes || '');
                        const pkg = getMembershipTypeFromNotes(tx.notes || '');
                        return (
                          <tr key={tx.id}>
                            <td className="py-2.5 px-3 border-r border-slate-100 text-center">{idx + 1}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{formatDateLabel(tx.transaction_date)}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-800">{tx.transaction_number}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100 uppercase text-[10px]">{pkg}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-[10px]">
                              {formatDateLabel(selectedMember.membership_start)} s/d {formatDateLabel(selectedMember.membership_end)}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 text-right text-slate-800 font-black">Rp. {tx.total_amount.toLocaleString('id-ID')}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500 font-normal leading-relaxed">{tx.notes || '-'}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">{tx.admin_name}</td>
                            <td className="py-2.5 px-3 text-center select-none no-print">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => {
                                    setReceiptTx(tx);
                                    setTimeout(() => {
                                      window.print();
                                    }, 100);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#17A2B8] hover:bg-[#138496] border border-[#17A2B8] text-white text-[9px] font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Cetak
                                </button>
                                <button
                                  onClick={() => setReceiptTx(tx)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-[9px] font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  Document
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-wider">
                          Belum ada transaksi pembayaran untuk anggota ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 font-bold select-none text-xs uppercase tracking-wider">
                Belum ada transaksi pembayaran latihan harian untuk anggota ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* UBah Data Anggota Step (Image 3 Layout) */}
      {step === 'edit' && selectedMember && (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
          {/* Header cyan bar */}
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
            <Edit className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">Ubah Data Anggota</span>
          </div>

          {editError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
              ⚠️ {editError}
            </div>
          )}

          {editSuccess && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              ✓ {editSuccess}
            </div>
          )}

          <div className="bg-white border border-slate-200 p-8 rounded shadow-sm">
            <form onSubmit={handleUpdateMember} className="space-y-6 text-sm text-slate-700">
              
              {/* Nomor Anggota */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nomor Anggota</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`@${selectedMember.username}`}
                  className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono font-bold"
                />
              </div>

              {/* Foto Anggota */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Foto Anggota</label>
                <div className="flex gap-4 items-center">
                  <div className="w-28 h-28 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-400 text-xs select-none">
                    {photoBase64 ? (
                      <img src={photoBase64} alt="Member" className="w-full h-full object-cover rounded" />
                    ) : (
                      'No Photo'
                    )}
                  </div>
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200 cursor-pointer transition-colors shadow-xs">
                    Pilih Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Nama Anggota */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Anggota *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan Nama Anggota"
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                />
              </div>

              {/* Jenis Kelamin */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Jenis Kelamin *</label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                >
                  <option value="Laki-Laki">Laki-Laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* Tanggal Lahir */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Tanggal Lahir</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                />
              </div>

              {/* Nomor HP */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nomor HP</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan Nomor HP"
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono"
                />
              </div>

              {/* Email */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan Email"
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                />
              </div>

              {/* Sosial Media */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Sosial Media</label>
                <input
                  type="text"
                  value={socialMedia}
                  onChange={(e) => setSocialMedia(e.target.value)}
                  placeholder="Instagram / Facebook / Tiktok"
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-body"
                />
              </div>

              {/* Alamat */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Alamat</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan Alamat Lengkap"
                  rows={3}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full resize-none h-[80px]"
                />
              </div>

              {/* Form Action */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1 pt-4 border-t border-slate-100">
                <div />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('list')}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors shadow-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
      </div>

      {/* Official Receipt Modal Popup (Triggered when receiptTx is not null, hidden during screen view unless selected) */}
      {receiptTx && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-slate-200 p-8 rounded shadow-2xl relative text-black">
            <button
              onClick={() => setReceiptTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            {/* Official Receipt Container */}
            <div id="print-receipt-overlay" className="space-y-6">
              
              {/* Header Box */}
              <div className="border border-black p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-12 h-12 text-[#DC3545]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 4l3 5 7-7 7 7 3-5v13H2V4zm0 15h20v2H2v-2z" />
                  </svg>
                  <div className="text-left leading-none">
                    <h1 className="text-2xl font-black tracking-widest">PRABU</h1>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Gym & Fitness Center</span>
                  </div>
                </div>
                <div className="text-right border-l border-black pl-8 pr-4">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">OFFICIAL RECEIPT</h2>
                </div>
              </div>

              {/* Metadata Summary Row */}
              <div className="border-t border-b border-black py-2.5 px-4 flex justify-between text-xs font-semibold">
                <span>Tanggal : {formatDateLabel(receiptTx.transaction_date)}</span>
                <span>Kategori : Pendaftaran</span>
                <span>No Invoice : {receiptTx.transaction_number}</span>
              </div>

              {/* Details Table */}
              <div className="border border-black overflow-hidden rounded-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black font-extrabold uppercase text-[10px] text-slate-700">
                      <th className="py-2.5 px-3 border-r border-black">Nomor Anggota</th>
                      <th className="py-2.5 px-3 border-r border-black">Nama Anggota</th>
                      <th className="py-2.5 px-3 border-r border-black">Paket Anggota</th>
                      <th className="py-2.5 px-3 border-r border-black">Masa Aktif</th>
                      <th className="py-2.5 px-3 border-r border-black">Jenis Pembayaran</th>
                      <th className="py-2.5 px-3">Harga Paket</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-semibold text-slate-800">
                      <td className="py-3 px-3 border-r border-black font-mono">@{selectedMember.username}</td>
                      <td className="py-3 px-3 border-r border-black font-bold">{selectedMember.full_name}</td>
                      <td className="py-3 px-3 border-r border-black uppercase text-[10px]">{getMembershipTypeFromNotes(receiptTx.notes || '')}</td>
                      <td className="py-3 px-3 border-r border-black font-mono text-[10px]">
                        {formatDateLabel(selectedMember.membership_start)} s/d {formatDateLabel(selectedMember.membership_end)}
                      </td>
                      <td className="py-3 px-3 border-r border-black uppercase">{getPaymentMethod(receiptTx.notes || '')}</td>
                      <td className="py-3 px-3 font-bold">Rp. {receiptTx.total_amount.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Box */}
              <div className="grid grid-cols-2 border border-black text-center text-xs font-bold divide-x divide-black">
                <div>
                  <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Member</div>
                  <div className="h-28" />
                  <div className="py-2 border-t border-black uppercase font-extrabold">{selectedMember.full_name}</div>
                </div>
                <div>
                  <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Customer Service</div>
                  <div className="h-28" />
                  <div className="py-2 border-t border-black uppercase font-extrabold">{user?.full_name || 'Kasir Prabu GYM'}</div>
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-4 no-print">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Receipt
              </button>
              <button
                onClick={() => setReceiptTx(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
