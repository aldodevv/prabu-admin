'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Content {
  id: string;
  type: string;
  title: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export default function ContentCMSPage() {
  const { activeBranchID } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Form states (Create/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('news');
  const [description, setDescription] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (activeBranchID) {
      fetchContents();
    }
  }, [activeBranchID, page]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/admin/contents?branch_id=${activeBranchID}&page=${page}&active_only=false`
      );
      if (res.success && res.data) {
        setContents(res.data);
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
    setTitle('');
    setType('news');
    setDescription('');
    setImageURL('');
    setSortOrder(0);
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Content) => {
    setEditingID(c.id);
    setTitle(c.title);
    setType(c.type);
    setDescription(c.description || '');
    setImageURL(c.image_url || '');
    setSortOrder(c.sort_order);
    setIsActive(c.is_active);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      title,
      type,
      description,
      image_url: imageURL,
      sort_order: Number(sortOrder),
    };

    try {
      if (editingID) {
        const res = await api.put(`/admin/contents/${editingID}`, {
          ...body,
          is_active: isActive,
        });
        if (res.success) {
          setIsFormOpen(false);
          fetchContents();
        }
      } else {
        const res = await api.post('/admin/contents', {
          ...body,
          branch_id: activeBranchID,
        });
        if (res.success) {
          setIsFormOpen(false);
          fetchContents();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus konten ini secara permanen?')) return;
    try {
      const res = await api.delete(`/admin/contents/${id}`);
      if (res.success) {
        fetchContents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">CMS KONTEN PUBLIC</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Kelola Promo, Berita, Pengumuman & Fasilitas Member Client
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm cursor-pointer"
        >
          + BUAT POSTINGAN BARU
        </button>
      </div>

      {/* Contents table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading data CMS...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">CMS Konten Public</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Judul Konten</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tipe</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Deskripsi Singkat</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Order</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {contents.length > 0 ? (
                    contents.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{c.title}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <span className="text-[10px] font-accent uppercase tracking-widest font-semibold border border-[#17A2B8]/20 px-2 py-0.5 text-[#17A2B8] rounded">
                            {c.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs truncate max-w-[200px] border-r border-slate-100">
                          {c.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-800 border-r border-slate-100">{c.sort_order}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${
                              c.is_active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {c.is_active ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="px-3 py-1.5 border border-[#17A2B8] hover:bg-[#17A2B8] text-[#17A2B8] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="px-3 py-1.5 border border-[#DC3545] hover:bg-[#DC3545] text-[#DC3545] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold select-none">
                        Belum ada konten diterbitkan di cabang ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 50 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Total {total} Konten</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-accent uppercase tracking-widest rounded cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * 50 >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-accent uppercase tracking-widest rounded cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-heading text-2xl text-slate-800 mb-6 border-b border-slate-100 pb-3">
              {editingID ? 'EDIT KONTEN CMS' : 'BUAT POSTINGAN CMS'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-[2fr_1fr] gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Judul Konten
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Kategori CMS
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="news">Berita / Event</option>
                    <option value="promo">Promo Banner</option>
                    <option value="facilities">Fasilitas Baru</option>
                    <option value="tips">Tips Latihan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-[2fr_1fr] gap-4">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Image URL (Link Asset Gambar)
                  </label>
                  <input
                    type="text"
                    value={imageURL}
                    onChange={(e) => setImageURL(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    placeholder="https://imgur.com/example.png"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Urutan Tampil (Sort)
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono"
                    min={0}
                    required
                  />
                </div>
              </div>

              {editingID && (
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Status Publish
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft (Sembunyikan)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Isi Pengumuman / Deskripsi Detail
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all h-28 resize-none rounded"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'MENYIMPAN...' : 'SIMPAN POSTINGAN KONTEN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
