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
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-white">CMS KONTEN PUBLIC</h2>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
            Kelola Promo, Berita, Pengumuman & Fasilitas Member Client
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary hover:shadow-glow-red transition-all duration-300"
        >
          + BUAT POSTINGAN BARU
        </button>
      </div>

      {/* Contents table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Loading data CMS...
        </div>
      ) : (
        <div className="bg-black-card border border-gray-800 p-8 angular-cut">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Judul Konten</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Deskripsi Singkat</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {contents.length > 0 ? (
                  contents.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{c.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-accent uppercase tracking-widest font-semibold border border-red-primary/20 px-2 py-0.5 text-red-primary">
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs truncate max-w-[200px]">
                        {c.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-white">{c.sort_order}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold ${
                            c.is_active
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {c.is_active ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-accent text-[10px] uppercase tracking-wider transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="px-3 py-1.5 bg-red-primary/10 hover:bg-red-primary/20 text-red-primary font-accent text-[10px] uppercase tracking-wider transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Belum ada konten diterbitkan di cabang ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800 text-xs">
              <span className="text-gray-500">Total {total} Konten</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-accent uppercase tracking-widest"
                >
                  Prev
                </button>
                <button
                  disabled={page * 50 >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-accent uppercase tracking-widest"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-black-card border border-gray-800 p-8 angular-cut relative animate-fade-in">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="font-heading text-2xl text-white mb-6">
              {editingID ? 'EDIT KONTEN CMS' : 'BUAT POSTINGAN CMS'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-[2fr_1fr] gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Judul Konten
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Kategori CMS
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
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
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Image URL (Link Asset Gambar)
                  </label>
                  <input
                    type="text"
                    value={imageURL}
                    onChange={(e) => setImageURL(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    placeholder="https://imgur.com/example.png"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Urutan Tampil (Sort)
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    min={0}
                    required
                  />
                </div>
              </div>

              {editingID && (
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Status Publish
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft (Sembunyikan)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Isi Pengumuman / Deskripsi Detail
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all h-28 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary transition-all duration-300 disabled:opacity-50"
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
