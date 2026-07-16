'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Distributor {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  address: string;
}

export default function DistributorsPage() {
  const { activeBranchID } = useAuth();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (activeBranchID) {
      fetchDistributors();
    }
  }, [activeBranchID]);

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setDistributors([
          {
            id: 'd1',
            name: 'PT Suplemen Bugar Jaya',
            contact_name: 'Budi Santoso',
            phone: '081234567890',
            address: 'Ruko Grogol Indah Blok B No. 4, Jakarta Barat'
          },
          {
            id: 'd2',
            name: 'CV Agung Sports & Wear',
            contact_name: 'Jessica Tan',
            phone: '081987654321',
            address: 'Kawasan Industri Cikarang Blok C12, Bekasi'
          },
          {
            id: 'd3',
            name: 'UD Maju Alat Fitnes',
            contact_name: 'Heri Wijaya',
            phone: '085711223344',
            address: 'Jl. Merdeka Raya No. 45, Jakarta Pusat'
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactName || !phone) return;
    setSubmitting(true);

    const newDistributor: Distributor = {
      id: `d-${Date.now()}`,
      name,
      contact_name: contactName,
      phone,
      address
    };

    setTimeout(() => {
      setDistributors([...distributors, newDistributor]);
      setIsFormOpen(false);
      setName('');
      setContactName('');
      setPhone('');
      setAddress('');
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">DATA DISTRIBUTOR / SUPPLIER</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Daftar distributor pemasok suplemen, minuman, handuk, aksesoris, & alat gym
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm cursor-pointer"
        >
          + TAMBAH SUPPLIER BARU
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading data distributor...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Database Pihak Ketiga / Supplier</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Perusahaan</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Contact Person</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nomor Telepon</th>
                    <th className="py-3 px-4">Alamat Kantor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {distributors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{d.name}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700 font-semibold">{d.contact_name}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 font-mono text-slate-800">{d.phone}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{d.address || '-'}</td>
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
              TAMBAH SUPPLIER BARU
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: PT Suplemen Bugar Jaya"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contoh: Budi"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Nomor Telepon *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Alamat Kantor
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'MEMPROSES...' : 'DAFTARKAN SUPPLIER'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
