'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { membersApi, transactionsApi, packagesApi } from '@/core/api';
import { formatDateLabel, formatIDR, getMembershipTypeFromNotes, getPaymentMethodFromNotes, getPTDetailsFromNotes } from '@/core/constants';
import { Member, Transaction, MembershipPackage, PTPackage } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { DataTable, Column } from '@/components/core/DataTable';
import { Search, Eye, Edit, Trash2, ArrowLeft, Save, Printer, FileText, FileSpreadsheet, RotateCcw, Download, CreditCard, X, AlertTriangle, UserX, Info } from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';
import { compressImage } from '@/utils/imageCompressor';
import { uploadToCloudflare } from '@/lib/cloudflare';
import { formatPhotoUrl } from '@/lib/api';
import { permissions } from '@/lib/permissions';
import { FetchErrorAlert } from '@/components/core/FetchErrorAlert';
import { OfficialReceiptTemplate, OfficialPTReceiptTemplate, ThermalReceiptTemplate } from '@/components/core/PrintTemplates';
import { DatePicker } from '@/components/core/DatePicker';

const DigitalMemberCard = dynamic(
  () => import('@/components/core/DigitalMemberCard').then((mod) => mod.DigitalMemberCard),
  { ssr: false }
);

const isPtTransaction = (tx: Transaction) => {
  const n = (tx.notes || '').toLowerCase();
  return (
    n.includes('personal trainer') ||
    n.includes('pt ') ||
    n.includes('pt:') ||
    n.includes('pt -') ||
    n.includes('latihan') ||
    n.includes('workout') ||
    n.includes('sesi')
  );
};

function calculateEndDateFromPackage(startDateStr: string, pkgName: string, packagesList: MembershipPackage[]): string {
  if (!startDateStr || !pkgName) return '';
  const d = new Date(startDateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';

  const matched = packagesList.find(p => p.name.toLowerCase().trim() === pkgName.toLowerCase().trim());
  const nameLower = pkgName.toLowerCase();

  if (nameLower.includes('12 bulan') || nameLower.includes('1 tahun') || (matched && matched.duration_days >= 360)) {
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
  } else if (nameLower.includes('6 bulan') || (matched && matched.duration_days >= 170 && matched.duration_days <= 190)) {
    d.setMonth(d.getMonth() + 6);
    d.setDate(d.getDate() - 1);
  } else if (nameLower.includes('3 bulan') || (matched && matched.duration_days >= 80 && matched.duration_days <= 100)) {
    d.setMonth(d.getMonth() + 3);
    d.setDate(d.getDate() - 1);
  } else if (nameLower.includes('1 bulan') || (matched && matched.duration_days >= 25 && matched.duration_days <= 35)) {
    d.setMonth(d.getMonth() + 1);
    d.setDate(d.getDate() - 1);
  } else if (matched && matched.duration_days > 0) {
    d.setDate(d.getDate() + matched.duration_days - 1);
  } else {
    d.setMonth(d.getMonth() + 1);
    d.setDate(d.getDate() - 1);
  }

  return d.toISOString().split('T')[0];
}

export default function OneClubMembersPanel() {
  const { activeBranchID, user, branches, loading: authLoading } = useAuth();

  // Navigation states: 'list' | 'detail' | 'edit'
  const [step, setStep] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDigitalCard, setShowDigitalCard] = useState(false);

  // Members List states
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterColumn, setFilterColumn] = useState('username');

  // Filters matching Search Box
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Edit states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Delete & Status action states
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [actionLoading, setActionLoading] = useState<'deactivate' | 'delete' | null>(null);

  const handleToggleMemberStatus = async () => {
    if (!memberToDelete) return;
    setActionLoading('deactivate');
    try {
      const newStatus = !memberToDelete.is_active;
      const res = await membersApi.update(memberToDelete.id, {
        is_active: newStatus,
      });
      if (res.success) {
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberToDelete.id ? { 
              ...m, 
              is_active: newStatus,
              membership_end: newStatus ? m.membership_end : yesterdayStr
            } : m
          )
        );
        setMemberToDelete(null);
      } else {
        alert(res.error || 'Gagal mengubah status anggota');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengubah status anggota');
    } finally {
      setActionLoading(null);
    }
  };

  // Details Sub-tabs: 'anggota' | 'latihan'
  const [detailTab, setDetailTab] = useState<'anggota' | 'latihan'>('anggota');
  const [memberTransactions, setMemberTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [thermalStrukTx, setThermalStrukTx] = useState<Transaction | null>(null);

  // RBAC Permission for editing & deleting transactions on this table: developer, owner, admin
  const canEditOrDeleteTx = user?.role === 'developer' || user?.role === 'owner' || user?.role === 'admin';

  // Package options for edit dropdown
  const [membershipPackages, setMembershipPackages] = useState<MembershipPackage[]>([]);
  const [ptPackages, setPtPackages] = useState<PTPackage[]>([]);

  // Edit Transaction Modal states
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingTxType, setEditingTxType] = useState<'anggota' | 'latihan'>('anggota');
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxPackage, setEditTxPackage] = useState('');
  const [editTxStartDate, setEditTxStartDate] = useState('');
  const [editTxEndDate, setEditTxEndDate] = useState('');
  const [editTxTotalAmount, setEditTxTotalAmount] = useState<number>(0);
  const [editTxNotes, setEditTxNotes] = useState('');
  const [savingTx, setSavingTx] = useState(false);
  const [editTxError, setEditTxError] = useState('');
  const [editTxSuccess, setEditTxSuccess] = useState('');

  // Delete Transaction Modal states
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState(false);
  const [deleteTxError, setDeleteTxError] = useState('');

  const initialSearchHandledRef = useRef(false);

  // Fetch package lists for dropdown options from global settings
  useEffect(() => {
    packagesApi.listMembershipPackages().then(res => {
      if (res.success && res.data) setMembershipPackages(res.data);
    }).catch(() => { });
    packagesApi.listPTPackages().then(res => {
      if (res.success && res.data) setPtPackages(res.data);
    }).catch(() => { });
  }, [activeBranchID]);

  useEffect(() => {
    if (!initialSearchHandledRef.current && typeof window !== 'undefined') {
      initialSearchHandledRef.current = true;
      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get('search') || params.get('no-anggota') || params.get('one-club');
      if (urlSearch) {
        setSearch(urlSearch);
        fetchMembers(urlSearch, 'username', 1, perPage);
        return;
      }
    }
  }, []);

  // Fetch members whenever branch, page, perPage, or statusFilter changes
  useEffect(() => {
    if (!authLoading && activeBranchID) {
      fetchMembers(search, filterColumn, page, perPage, statusFilter);
    }
  }, [activeBranchID, page, perPage, statusFilter, authLoading]);

  const fetchMembers = async (searchQuery = search, col = filterColumn, pageNum = page, perPageNum = perPage, status = statusFilter) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await membersApi.list({
        branch_id: activeBranchID || undefined,
        search: searchQuery || undefined,
        search_by: searchQuery ? col : undefined,
        status: status !== 'Semua' ? status : undefined,
        page: pageNum,
        per_page: perPageNum
      });
      if (res.success && res.data) {
        setMembers(res.data);
        setTotal(res.meta?.total || 0);
      } else {
        if (res.error) setFetchError(res.error);
        setMembers([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || 'Gagal mengambil data anggota One Club');
      setMembers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers(search, filterColumn, 1, perPage, statusFilter);
  };

  const handleResetSearch = () => {
    setSearch('');
    setFilterColumn('username');
    setStatusFilter('Semua');
    setPage(1);
    fetchMembers('', 'username', 1, perPage, 'Semua');
  };

  const getSearchPlaceholder = () => {
    switch (filterColumn) {
      case 'username':
        return 'Ketik nomor anggota...';
      case 'full_name':
        return 'Ketik nama anggota...';
      case 'phone':
        return 'Ketik nomor HP...';
      case 'email':
        return 'Ketik email...';
      case 'membership_type':
        return 'Ketik paket anggota...';
      default:
        return 'Ketik nomor anggota...';
    }
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Nomor Anggota', 'Nama Anggota', 'Jenis Kelamin', 'Tanggal Lahir', 'Nomor HP', 'Email', 'Paket Anggota', 'Status'];
    const data = members.map((m, index) => [
      index + 1,
      m.username,
      m.full_name,
      m.gender || 'Laki-laki',
      m.date_of_birth || '-',
      m.phone || '-',
      m.email || '-',
      m.membership_type || '-',
      m.is_active ? 'Aktif' : 'Tidak Aktif',
    ]);

    exportToExcel({
      filename: `Data_Anggota_One_Club_${new Date().toISOString().split('T')[0]}`,
      title: 'DATA ANGGOTA ONE CLUB - PRABU GYM',
      headers,
      data,
    });
  };

  const handleOpenDetail = async (m: Member) => {
    setSelectedMember(m);
    setDetailTab('anggota');
    setStep('detail');
    setLoadingTransactions(true);
    try {
      const res = await transactionsApi.list({
        branch_id: activeBranchID || undefined,
        member_id: m.id,
        per_page: 200
      });
      if (res.success && res.data) {
        const filtered = res.data.filter(
          (tx: Transaction) =>
            tx.member_id === m.id ||
            (tx.notes && (tx.notes.toLowerCase().includes(m.full_name.toLowerCase()) || tx.notes.includes(m.username)))
        );
        setMemberTransactions(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleOpenEditTx = (tx: Transaction, type: 'anggota' | 'latihan') => {
    setEditingTx(tx);
    setEditingTxType(type);
    const txDate = tx.transaction_date ? tx.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0];
    setEditTxDate(txDate);
    setEditTxTotalAmount(Number(tx.total_amount) || 0);

    if (type === 'anggota') {
      const parsedPkg = getMembershipTypeFromNotes(tx.notes || '');
      const matchedPkg = membershipPackages.find(
        p => p.name.toLowerCase().trim() === parsedPkg.toLowerCase().trim() ||
          p.name.toLowerCase().trim() === (selectedMember?.membership_type || '').toLowerCase().trim()
      );
      const pkgName = matchedPkg ? matchedPkg.name : (parsedPkg || selectedMember?.membership_type || '');
      setEditTxPackage(pkgName);

      const start = selectedMember?.membership_start ? selectedMember.membership_start.split('T')[0] : txDate;
      setEditTxStartDate(start);

      const end = selectedMember?.membership_end
        ? selectedMember.membership_end.split('T')[0]
        : calculateEndDateFromPackage(start, pkgName, membershipPackages);
      setEditTxEndDate(end);

      if (matchedPkg && Number(tx.total_amount) === 0) {
        setEditTxTotalAmount(Number(matchedPkg.price) || 0);
      }
    } else {
      const ptInfo = getPTDetailsFromNotes(tx.notes || '');
      const matchedPt = ptPackages.find(
        p => p.name.toLowerCase().trim() === (ptInfo?.packageName || '').toLowerCase().trim()
      );
      setEditTxPackage(matchedPt ? matchedPt.name : (ptInfo?.packageName || ''));
      setEditTxStartDate('');
      setEditTxEndDate('');
      if (matchedPt && Number(tx.total_amount) === 0) {
        setEditTxTotalAmount(Number(matchedPt.price) || 0);
      }
    }
    setEditTxNotes(tx.notes || '');
    setEditTxError('');
    setEditTxSuccess('');
  };

  const handlePackageChange = (newPkgName: string) => {
    setEditTxPackage(newPkgName);

    if (editingTxType === 'anggota') {
      const matched = membershipPackages.find(p => p.name.toLowerCase().trim() === newPkgName.toLowerCase().trim());
      if (matched) {
        setEditTxTotalAmount(Number(matched.price) || 0);
        const start = editTxStartDate || editTxDate || new Date().toISOString().split('T')[0];
        const newEnd = calculateEndDateFromPackage(start, newPkgName, membershipPackages);
        if (newEnd) {
          setEditTxEndDate(newEnd);
        }
      }

      // Update notes with new package name if notes has "Paket: ..."
      if (editTxNotes && editTxNotes.includes('Paket:')) {
        const updatedNotes = editTxNotes.replace(/Paket:\s*([^\-,.\n]+(?:\([^)]*\))?)/i, `Paket: ${newPkgName}`);
        setEditTxNotes(updatedNotes);
      }
    } else {
      const matched = ptPackages.find(p => p.name.toLowerCase().trim() === newPkgName.toLowerCase().trim());
      if (matched) {
        setEditTxTotalAmount(Number(matched.price) || 0);
      }
      if (editTxNotes && editTxNotes.includes('Pendaftaran Personal Trainer:')) {
        const updatedNotes = editTxNotes.replace(/Pendaftaran Personal Trainer:\s*([^\-]+)/i, `Pendaftaran Personal Trainer: ${newPkgName} `);
        setEditTxNotes(updatedNotes);
      }
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    setEditTxStartDate(newStartDate);
    if (editingTxType === 'anggota' && editTxPackage && newStartDate) {
      const newEnd = calculateEndDateFromPackage(newStartDate, editTxPackage, membershipPackages);
      if (newEnd) {
        setEditTxEndDate(newEnd);
      }
    }
  };

  const handleSaveEditTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setSavingTx(true);
    setEditTxError('');
    setEditTxSuccess('');

    try {
      const payload: {
        transaction_date?: string;
        package_name?: string;
        membership_start?: string;
        membership_end?: string;
        total_amount?: number;
        notes?: string;
      } = {
        transaction_date: editTxDate,
        total_amount: editTxTotalAmount,
        notes: editTxNotes,
      };

      if (editingTxType === 'anggota') {
        payload.package_name = editTxPackage;
        payload.membership_start = editTxStartDate;
        payload.membership_end = editTxEndDate;
      } else {
        payload.package_name = editTxPackage;
      }

      const res = await transactionsApi.update(editingTx.id, payload);
      if (res.success) {
        setEditTxSuccess('Transaksi pembayaran berhasil diperbarui.');

        // Update local transaction state
        setMemberTransactions(prev => prev.map(item => {
          if (item.id === editingTx.id) {
            return {
              ...item,
              transaction_date: editTxDate,
              total_amount: editTxTotalAmount,
              payment_amount: editTxTotalAmount,
              notes: editTxNotes,
            };
          }
          return item;
        }));

        // If editing anggota, update selected member
        if (selectedMember && editingTxType === 'anggota') {
          setSelectedMember(prev => prev ? {
            ...prev,
            membership_type: editTxPackage || prev.membership_type,
            membership_start: editTxStartDate || prev.membership_start,
            membership_end: editTxEndDate || prev.membership_end,
          } : null);

          setMembers(prev => prev.map(m => {
            if (m.id === selectedMember.id) {
              return {
                ...m,
                membership_type: editTxPackage || m.membership_type,
                membership_start: editTxStartDate || m.membership_start,
                membership_end: editTxEndDate || m.membership_end,
              };
            }
            return m;
          }));
        }

        setTimeout(() => {
          setEditingTx(null);
          setEditTxSuccess('');
        }, 800);
      } else {
        setEditTxError(res.error || 'Gagal memperbarui data transaksi pembayaran.');
      }
    } catch (err: any) {
      setEditTxError(err.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setSavingTx(false);
    }
  };

  const handleConfirmDeleteTx = async () => {
    if (!txToDelete || !selectedMember) return;
    setDeletingTx(true);
    setDeleteTxError('');

    const isOnlyTx = memberTransactions.length <= 1;

    try {
      const res = await transactionsApi.delete(txToDelete.id);
      if (res.success) {
        if (isOnlyTx) {
          // Hanya ada 1 transaksi dan dihapus oleh admin -> akun anggota ikut dibersihkan
          setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
          setTxToDelete(null);
          setStep('list');
          setSelectedMember(null);
          alert('Transaksi pembayaran berhasil dihapus. Karena tidak ada transaksi lain, akun anggota terkait telah dibersihkan dari sistem.');
        } else {
          // Masih ada transaksi pembayaran lain:
          // HANYA hapus transaksi ini, dan perbarui masa aktif ke transaksi pembayaran paling akhir yang tersisa
          const remainingTxs = memberTransactions.filter(item => item.id !== txToDelete.id);
          setMemberTransactions(remainingTxs);

          // Cari transaksi yang paling akhir berdasarkan transaction_date
          const sortedRemaining = [...remainingTxs].sort((a, b) => {
            const dateA = new Date(a.transaction_date || 0).getTime();
            const dateB = new Date(b.transaction_date || 0).getTime();
            return dateB - dateA;
          });

          if (sortedRemaining.length > 0) {
            const latestTx = sortedRemaining[0];
            const pkgName = getMembershipTypeFromNotes(latestTx.notes || '') || selectedMember.membership_type;
            const txStartDate = latestTx.transaction_date ? latestTx.transaction_date.split('T')[0] : (selectedMember.membership_start ? selectedMember.membership_start.split('T')[0] : '');
            const newEndDate = calculateEndDateFromPackage(txStartDate, pkgName, membershipPackages) || selectedMember.membership_end;

            if (newEndDate) {
              const today = new Date().toISOString().split('T')[0];
              const isActive = newEndDate >= today;
              try {
                await membersApi.update(selectedMember.id, {
                  membership_end: newEndDate,
                  membership_type: pkgName,
                  is_active: isActive
                });
              } catch (e) {
                console.error('Error updating member active dates:', e);
              }

              setSelectedMember(prev => prev ? {
                ...prev,
                membership_end: newEndDate,
                membership_type: pkgName,
                is_active: isActive
              } : null);
            }
          }

          setTxToDelete(null);
          fetchMembers();
        }
      } else {
        setDeleteTxError(res.error || 'Gagal menghapus transaksi pembayaran.');
      }
    } catch (err: any) {
      setDeleteTxError(err.message || 'Terjadi kesalahan saat menghapus transaksi.');
    } finally {
      setDeletingTx(false);
    }
  };

  const handleOpenEdit = (m: Member) => {
    setSelectedMember(m);
    setFullName(m.full_name || '');
    setGender(m.gender || '');
    setDob(m.date_of_birth || '');
    setPhone(m.phone || '');
    setEmail(m.email || '');
    setAddress(m.address || '');
    setPhotoBase64(m.photo_url || '');
    setPhotoUrl(m.photo_url || '');
    setEditError('');
    setEditSuccess('');
    setStep('edit');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPhotoBase64(compressed);
      } catch (err: any) {
        console.error('Gagal mengompres gambar:', err);
      }
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setLoading(true);
    setEditError('');
    setEditSuccess('');

    let finalPhotoUrl = photoUrl;
    if (photoBase64 && photoBase64.startsWith('data:')) {
      try {
        finalPhotoUrl = await uploadToCloudflare(photoBase64, 'anggota');
      } catch (err: any) {
        console.error('Cloudflare upload error:', err);
        setEditError('Gagal mengunggah foto ke Cloudflare R2: ' + (err.message || 'Error'));
        setLoading(false);
        return;
      }
    }

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
      photo_url: finalPhotoUrl,
    };

    try {
      const res = await membersApi.update(selectedMember.id, body);
      if (res.success) {
        setEditSuccess('Data anggota berhasil disimpan.');
        // Update local selectedMember state immediately
        setSelectedMember(prev => prev ? {
          ...prev,
          full_name: fullName,
          email,
          phone,
          address,
          date_of_birth: dob,
          gender,
          photo_url: finalPhotoUrl,
        } : null);

        // Update local members array immediately
        setMembers(prev => prev.map(m => m.id === selectedMember.id ? {
          ...m,
          full_name: fullName,
          email,
          phone,
          address,
          date_of_birth: dob,
          gender,
          photo_url: finalPhotoUrl,
        } : m));

        // Refresh the member data list from server
        fetchMembers(search, filterColumn, page, perPage, statusFilter);
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

  const columnOptions = [
    { label: 'Nomor Anggota', value: 'username' },
    { label: 'Nama Anggota', value: 'full_name' },
    { label: 'Nomor HP', value: 'phone' },
    { label: 'Email', value: 'email' },
    { label: 'Paket Anggota', value: 'membership_type' },
  ];

  // Columns definition for DataTable
  const columns: Column<Member>[] = [
    {
      key: 'no',
      header: 'No',
      align: 'center',
      className: 'w-12',
      render: (_, idx) => (page - 1) * perPage + idx + 1
    },
    {
      key: 'photo',
      header: 'Foto',
      align: 'center',
      className: 'w-24',
      render: (m) => (
        <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-200 rounded overflow-hidden flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold select-none">
          {m.photo_url ? (
            <img src={formatPhotoUrl(m.photo_url)} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            'No Photo'
          )}
        </div>
      )
    },
    {
      key: 'username',
      header: 'Nomor Anggota',
      className: 'font-mono text-slate-800',
      render: (m) => m.username
    },
    {
      key: 'full_name',
      header: 'Nama Anggota',
      className: 'text-slate-800 font-bold'
    },
    {
      key: 'membership_type',
      header: 'Paket Anggota',
      className: 'text-slate-700 uppercase text-xs'
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      className: 'w-28 text-center',
      render: (m) => {
        if (!m.is_active) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Nonaktif
            </span>
          );
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = m.membership_end ? new Date(m.membership_end) : null;
        if (end) end.setHours(0, 0, 0, 0);

        if (!end || end >= today) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Aktif
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Expired
          </span>
        );
      }
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      className: 'w-28',
      render: (m) => (
        <div className="flex gap-1.5 justify-center">
          <button
            onClick={() => handleOpenDetail(m)}
            title="Lihat Detail Anggota"
            className="p-2 bg-[#6C7A89] hover:bg-[#5a6673] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {!permissions.isReadOnly(user?.role) && (
            <button
              onClick={() => handleOpenEdit(m)}
              title="Ubah Data Anggota"
              className="p-2 bg-brand-cyan hover:bg-[#138496] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {permissions.canDeleteMember(user?.role) && (
            <button
              onClick={() => setMemberToDelete(m)}
              title="Hapus Anggota"
              className="p-2 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="no-print space-y-6">

        {/* Main List Step */}
        {step === 'list' && (
          <div className="space-y-6">
            <PageHeader
              title="Data Anggota"
              description="Daftar Anggota & Riwayat Keuangan Aktif"
            />

            <FetchErrorAlert error={fetchError} featureName="Data Anggota" onRetry={fetchMembers} />

            {/* Search Box */}
            <SearchFilterBar
              searchQuery={search}
              onSearchChange={setSearch}
              onSearchSubmit={handleSearchSubmit}
              searchPlaceholder={getSearchPlaceholder()}
              columnOptions={columnOptions}
              selectedColumn={filterColumn}
              onColumnChange={setFilterColumn}
              hideAllColumnOption={true}
              onExportExcel={handleExportExcel}
              onReset={handleResetSearch}
              loading={loading}
            >
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded font-medium"
              >
                <option value="Semua">Status: Semua</option>
                <option value="Aktif">Status: Aktif</option>
                <option value="Expired">Status: Expired</option>
                <option value="Nonaktif">Status: Nonaktif</option>
              </select>
            </SearchFilterBar>

            {/* Members Table */}
            <DataTable
              title="Daftar Anggota One Club"
              columns={columns}
              data={members}
              loading={loading}
              loadingMessage="Loading data anggota..."
              emptyMessage="Tidak ada data anggota ditemukan."
              currentPage={page}
              totalItems={total}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={(val) => {
                setPerPage(val);
                setPage(1);
              }}
              minWidth="min-w-[850px]"
            />
          </div>
        )}

        {/* Member Details Step */}
        {step === 'detail' && selectedMember && (
          <div className="space-y-6 animate-fadeIn">
            <PageHeader
              title="Daftar Anggota"
              action={
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep('list')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                </div>
              }
            />

            {/* Digital Card Modal */}
            {showDigitalCard && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-heading font-bold text-slate-800 text-base">Kartu Anggota Digital</h3>
                    <button
                      onClick={() => setShowDigitalCard(false)}
                      className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-1 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <DigitalMemberCard
                    member={{
                      username: selectedMember.username,
                      full_name: selectedMember.full_name,
                      email: selectedMember.email,
                      phone: selectedMember.phone,
                      membership_type: selectedMember.membership_type,
                      membership_start: selectedMember.membership_start,
                      membership_end: selectedMember.membership_end,
                    }}
                    branchName={selectedMember.branch_name}
                  />
                </div>
              </div>
            )}

            {/* Data Personal Table */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-heading text-lg font-bold text-slate-800">Data Personal</h3>
                <button
                  onClick={() => setShowDigitalCard(true)}
                  className="text-xs font-bold text-[#17A2B8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  🪪 Lihat Kartu Member Digital
                </button>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-6 items-start max-md:grid-cols-1">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-32 h-32 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 font-bold text-xs shadow-xs">
                    {selectedMember.photo_url ? (
                      <img
                        src={formatPhotoUrl(selectedMember.photo_url)}
                        alt={selectedMember.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      'No Photo'
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto Anggota</span>
                </div>

                {/* Member Info Table */}
                <div className="border border-slate-200 overflow-hidden rounded-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200 w-[25%]">Nomor Anggota</td>
                        <td className="py-2.5 px-4 font-mono text-slate-800">{selectedMember.username}</td>
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
                        <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Alamat</td>
                        <td className="py-2.5 px-4 text-slate-700 font-body">{selectedMember.address || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Tanggal Bergabung</td>
                        <td className="py-2.5 px-4 text-slate-600">{new Date(selectedMember.created_at || '').toLocaleDateString('id-ID')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Transaksi Pembayaran Section */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">Transaksi Pembayaran</h3>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200 text-xs no-print select-none">
                <button
                  onClick={() => setDetailTab('anggota')}
                  className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${detailTab === 'anggota'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Transaksi Pembayaran Anggota
                </button>
                <button
                  onClick={() => setDetailTab('latihan')}
                  className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${detailTab === 'latihan'
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
              ) : (() => {
                const anggotaTxs = memberTransactions.filter(tx => !isPtTransaction(tx));
                const latihanTxs = memberTransactions.filter(tx => isPtTransaction(tx));

                if (detailTab === 'anggota') {
                  return (
                    <div className="overflow-x-auto custom-scrollbar pb-1">
                      <table className="w-full text-left text-xs border border-slate-200 border-collapse min-w-[850px]">
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
                          {anggotaTxs.length > 0 ? (
                            anggotaTxs.map((tx, idx) => {
                              const pkg = getMembershipTypeFromNotes(tx.notes || '');
                              return (
                                <tr key={tx.id}>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center">{idx + 1}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{formatDateLabel(tx.transaction_date)}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-800">{tx.transaction_number}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 uppercase text-[10px]">{pkg}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-[10px]">
                                    <div className="flex flex-col items-center justify-center leading-tight">
                                      <span>{formatDateLabel(tx.transaction_date ? tx.transaction_date.split('T')[0] : selectedMember.membership_start)}</span>
                                      <span className="text-[8px] font-sans opacity-70">s/d</span>
                                      <span>
                                        {formatDateLabel(
                                          calculateEndDateFromPackage(
                                            tx.transaction_date ? tx.transaction_date.split('T')[0] : (selectedMember.membership_start ? selectedMember.membership_start.split('T')[0] : ''),
                                            pkg,
                                            membershipPackages
                                          ) || selectedMember.membership_end
                                        )}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-right text-slate-800 font-black">{formatIDR(tx.total_amount)}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500 font-normal leading-relaxed">{tx.notes || '-'}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">{tx.admin_name}</td>
                                  <td className="py-2.5 px-3 text-center select-none no-print">
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                      <button
                                        onClick={() => setThermalStrukTx(tx)}
                                        title="Cetak Struk Thermal (POS)"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#007BFF] hover:bg-[#0069D9] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Struk</span>
                                      </button>
                                      <button
                                        onClick={() => setReceiptTx(tx)}
                                        title="Lihat Kwitansi Resmi (Official Receipt)"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#6C7A89] hover:bg-[#5a6673] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Receipt</span>
                                      </button>
                                      {canEditOrDeleteTx && (
                                        <>
                                          <button
                                            onClick={() => handleOpenEditTx(tx, 'anggota')}
                                            title="Ubah Data Transaksi Pembayaran"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                            <span>Edit</span>
                                          </button>
                                          <button
                                            onClick={() => { setTxToDelete(tx); setDeleteTxError(''); }}
                                            title="Hapus Transaksi Pembayaran"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Hapus</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={9} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-wider">
                                Belum ada transaksi pembayaran keanggotaan untuk anggota ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                } else {
                  return (
                    <div className="overflow-x-auto custom-scrollbar pb-1">
                      <table className="w-full text-left text-xs border border-slate-200 border-collapse min-w-[850px]">
                        <thead className="bg-brand-cyan text-white text-[10px] font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">No</th>
                            <th className="py-2.5 px-3 border-r border-slate-200">Tanggal Pembayaran</th>
                            <th className="py-2.5 px-3 border-r border-slate-200">Nomor Transaksi</th>
                            <th className="py-2.5 px-3 border-r border-slate-200">Keterangan Latihan</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-right">Total Pembayaran</th>
                            <th className="py-2.5 px-3 border-r border-slate-200">Nama CS</th>
                            <th className="py-2.5 px-3 text-center no-print">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 font-semibold">
                          {latihanTxs.length > 0 ? (
                            latihanTxs.map((tx, idx) => (
                              <tr key={tx.id}>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center">{idx + 1}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{formatDateLabel(tx.transaction_date)}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-800">{tx.transaction_number}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 font-normal leading-relaxed">{tx.notes || '-'}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-right text-slate-800 font-black">{formatIDR(tx.total_amount)}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">{tx.admin_name}</td>
                                <td className="py-2.5 px-3 text-center select-none no-print">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    <button
                                      onClick={() => setThermalStrukTx(tx)}
                                      title="Cetak Struk Thermal (POS)"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#007BFF] hover:bg-[#0069D9] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Struk</span>
                                    </button>
                                    <button
                                      onClick={() => setReceiptTx(tx)}
                                      title="Lihat Kwitansi Resmi (Official Receipt)"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#6C7A89] hover:bg-[#5a6673] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Receipt</span>
                                    </button>
                                    {canEditOrDeleteTx && (
                                      <>
                                        <button
                                          onClick={() => handleOpenEditTx(tx, 'latihan')}
                                          title="Ubah Data Transaksi Pembayaran"
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          onClick={() => { setTxToDelete(tx); setDeleteTxError(''); }}
                                          title="Hapus Transaksi Pembayaran"
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Hapus</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-wider">
                                Belum ada transaksi pembayaran latihan harian untuk anggota ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Re-download Section: Kartu Member Digital */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#17A2B8]" />
                  <h3 className="font-heading text-lg font-bold text-slate-800">
                    Unduh Kartu Anggota Digital
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Format PNG resolusi tinggi untuk kartu fisik atau digital member
                </span>
              </div>

              <div className="flex justify-center items-center py-2">
                <div className="w-full max-w-xl flex flex-col items-center bg-slate-50 p-6 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#17A2B8]" />
                      Kartu Member Digital
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Format PNG
                    </span>
                  </div>

                  <DigitalMemberCard
                    member={{
                      username: selectedMember.username,
                      full_name: selectedMember.full_name,
                      email: selectedMember.email,
                      phone: selectedMember.phone,
                      membership_type: selectedMember.membership_type,
                      membership_start: selectedMember.membership_start,
                      membership_end: selectedMember.membership_end,
                    }}
                    branchName={selectedMember.branch_name}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ubah Data Anggota Step */}
        {step === 'edit' && selectedMember && (
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden w-full animate-fadeIn">
            <div className="bg-brand-cyan px-5 py-3 text-white font-bold select-none flex items-center gap-2">
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

            <div className="p-6 md:p-8 w-full">
              <form onSubmit={handleUpdateMember} className="space-y-6 text-sm text-slate-700 w-full">
                <div className="space-y-5">
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left">Nomor Anggota</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={selectedMember.username}
                      className="bg-slate-100 border border-slate-300 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left">Nama Anggota</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left">Jenis Kelamin</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-mono cursor-pointer"
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch { } }}
                    />
                  </div>

                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left">Nomor HP</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full"
                    />
                  </div>

                  <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left mt-2">Alamat</label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-body resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left">Foto Profil</label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
                      />
                      {photoBase64 && (
                        <div className="w-24 h-24 border border-slate-300 rounded overflow-hidden">
                          <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end pt-6 border-t border-slate-200/60">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('list')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Print Official Receipt Overlay */}
      {receiptTx && selectedMember && (
        isPtTransaction(receiptTx) ? (
          <OfficialPTReceiptTemplate
            onClose={() => setReceiptTx(null)}
            data={{
              transactionNumber: receiptTx.transaction_number || '-',
              transactionDate: receiptTx.transaction_date,
              memberUsername: selectedMember.username,
              memberName: selectedMember.full_name,
              packageName: getPTDetailsFromNotes(receiptTx.notes || '').packageName || getMembershipTypeFromNotes(receiptTx.notes || '') || 'Personal Trainer',
              sessionCount: getPTDetailsFromNotes(receiptTx.notes || '').sessionCount,
              membershipEnd: selectedMember.membership_end,
              paymentMethod: getPaymentMethodFromNotes(receiptTx.notes || ''),
              price: receiptTx.total_amount,
              trainerName: getPTDetailsFromNotes(receiptTx.notes || '').trainerName,
              cashierName: receiptTx.admin_name || user?.full_name || 'Kasir PRABU GYM',
            }}
          />
        ) : (
          <OfficialReceiptTemplate
            onClose={() => setReceiptTx(null)}
            data={{
              transactionNumber: receiptTx.transaction_number,
              transactionDate: receiptTx.transaction_date,
              memberUsername: selectedMember.username,
              memberName: selectedMember.full_name,
              packageName: getMembershipTypeFromNotes(receiptTx.notes || ''),
              membershipStart: selectedMember.membership_start,
              membershipEnd: selectedMember.membership_end,
              paymentMethod: getPaymentMethodFromNotes(receiptTx.notes || ''),
              price: receiptTx.total_amount,
              cashierName: receiptTx.admin_name || user?.full_name || 'Kasir PRABU GYM'
            }}
          />
        )
      )}

      {/* Reusable Print Thermal POS Struk Overlay */}
      {thermalStrukTx && selectedMember && (
        <ThermalReceiptTemplate
          onClose={() => setThermalStrukTx(null)}
          data={{
            transactionNumber: thermalStrukTx.transaction_number || '-',
            transactionDate: thermalStrukTx.transaction_date,
            memberUsername: selectedMember.username,
            memberName: selectedMember.full_name,
            packageName: getMembershipTypeFromNotes(thermalStrukTx.notes || '') || 'Paket Keanggotaan',
            paymentMethod: getPaymentMethodFromNotes(thermalStrukTx.notes || '') || thermalStrukTx.payment_method || 'Tunai',
            totalAmount: thermalStrukTx.total_amount,
            cashierName: thermalStrukTx.admin_name || user?.full_name || 'Kasir PRABU GYM',
            branchName: branches.find(b => b.id === activeBranchID)?.name || 'PRABU GYM & Fitness Center',
            branchAddress: (branches.find(b => b.id === activeBranchID) as any)?.address || '',
            notes: thermalStrukTx.notes || ''
          }}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-visible border border-slate-200">
            <div className="bg-[#17A2B8] px-5 py-3.5 text-white flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2 font-heading font-extrabold text-sm uppercase tracking-wider">
                <Edit className="w-4 h-4" />
                <span>
                  {editingTxType === 'anggota'
                    ? 'Ubah Transaksi Pembayaran Anggota'
                    : 'Ubah Transaksi Pembayaran Latihan'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editTxError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
                {editTxError}
              </div>
            )}

            {editTxSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                {editTxSuccess}
              </div>
            )}

            <form onSubmit={handleSaveEditTx} className="p-6 space-y-4 text-xs text-slate-700">
              {/* Nomor Transaksi (Read-only) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Nomor Transaksi
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={editingTx.transaction_number || '-'}
                  className="bg-slate-100 border border-slate-300 text-slate-500 px-3 py-2 text-xs rounded w-full font-mono font-bold"
                />
              </div>

              {/* Total Pembayaran (Read-only / Auto-updated) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Total Pembayaran
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={formatIDR(editTxTotalAmount)}
                  className="bg-slate-100 border border-slate-300 text-slate-800 px-3 py-2 text-xs rounded w-full font-black font-mono"
                />
              </div>

              {/* Tanggal Pembayaran (Editable) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Tanggal Pembayaran
                </label>
                <DatePicker
                  value={editTxDate}
                  onChange={setEditTxDate}
                />
              </div>

              {/* Paket Anggota / Latihan (Editable) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  {editingTxType === 'anggota' ? 'Paket Anggota' : 'Paket Latihan'}
                </label>
                {editingTxType === 'anggota' ? (
                  <select
                    value={editTxPackage}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-bold uppercase cursor-pointer"
                  >
                    <option value="">-- Pilih Paket Anggota --</option>
                    {membershipPackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name}
                      </option>
                    ))}
                    {editTxPackage && !membershipPackages.some(p => p.name.toLowerCase() === editTxPackage.toLowerCase()) && (
                      <option value={editTxPackage}>{editTxPackage}</option>
                    )}
                  </select>
                ) : (
                  <select
                    value={editTxPackage}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-bold uppercase cursor-pointer"
                  >
                    <option value="">-- Pilih Paket Latihan --</option>
                    {ptPackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name}
                      </option>
                    ))}
                    {editTxPackage && !ptPackages.some(p => p.name.toLowerCase() === editTxPackage.toLowerCase()) && (
                      <option value={editTxPackage}>{editTxPackage}</option>
                    )}
                  </select>
                )}
              </div>

              {/* Masa Aktif (Only for anggota) */}
              {editingTxType === 'anggota' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Masa Aktif Mulai
                    </label>
                    <DatePicker
                      value={editTxStartDate}
                      onChange={handleStartDateChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Masa Aktif Selesai
                    </label>
                    <DatePicker
                      value={editTxEndDate}
                      onChange={setEditTxEndDate}
                      align="right"
                    />
                  </div>
                </div>
              )}

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Keterangan
                </label>
                <textarea
                  rows={3}
                  value={editTxNotes}
                  onChange={(e) => setEditTxNotes(e.target.value)}
                  placeholder="Catatan / keterangan transaksi..."
                  className="bg-slate-50 border border-slate-300 text-slate-800 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  disabled={savingTx}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTx}
                  className="px-4 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white rounded-lg text-xs font-bold uppercase shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  {savingTx ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base uppercase tracking-wider text-slate-900">
                  Hapus Transaksi Pembayaran
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tindakan ini akan menghapus catatan transaksi pembayaran.
                </p>
              </div>
            </div>

            {deleteTxError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
                {deleteTxError}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Transaksi:</span>
                <span className="font-mono font-bold text-slate-900">{txToDelete.transaction_number || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-mono font-bold text-slate-900">{formatDateLabel(txToDelete.transaction_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Pembayaran:</span>
                <span className="font-black text-red-600">{formatIDR(txToDelete.total_amount)}</span>
              </div>
              {txToDelete.notes && (
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Keterangan:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{txToDelete.notes}</span>
                </div>
              )}
            </div>

            {memberTransactions.length <= 1 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Perhatian: Satu-satunya Transaksi Pembayaran</span>
                </div>
                <p>
                  Ini adalah satu-satunya data transaksi pembayaran anggota ini. Menghapus transaksi ini akan membatalkan pendaftaran dan membersihkan akun anggota ini dari sistem.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-800 font-semibold space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sky-900">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>Informasi: Penyesuaian Masa Aktif</span>
                </div>
                <p>
                  Anggota masih memiliki {memberTransactions.length - 1} transaksi pembayaran lainnya. Menghapus transaksi ini hanya akan membatalkan pembayaran ini, dan masa aktif anggota akan otomatis disesuaikan ke transaksi pembayaran terakhir yang tersisa.
                </p>
              </div>
            )}

            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus transaksi pembayaran ini? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                disabled={deletingTx}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTx}
                disabled={deletingTx}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                {deletingTx ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{memberTransactions.length <= 1 ? 'Hapus Transaksi & Anggota' : 'Hapus Pembayaran Ini'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal (Batal & Nonaktifkan saja) */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900">
                    Kelola Status Anggota
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Ubah status aktif anggota <span className="font-bold text-slate-800">"{memberToDelete.full_name}"</span> ({memberToDelete.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={actionLoading !== null}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Box */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {memberToDelete.is_active ? 'Nonaktifkan Status' : 'Aktifkan Kembali Status'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-4">
                {memberToDelete.is_active
                  ? 'Status keanggotaan diubah menjadi Nonaktif dan masa aktif dihentikan. Riwayat transaksi keuangan tetap tersimpan utuh di sistem untuk pembukuan.'
                  : 'Mengaktifkan kembali status keanggotaan anggota.'}
              </p>
            </div>

            {/* Actions Buttons */}
            <div className="flex items-center gap-2.5 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={actionLoading !== null}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleToggleMemberStatus}
                disabled={actionLoading !== null}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading === 'deactivate' ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>{memberToDelete.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
