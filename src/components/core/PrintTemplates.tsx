import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatDateLabel, formatIDR } from '@/core/constants';

interface PrintContainerProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const PrintContainer: React.FC<PrintContainerProps> = ({ onClose, title, children }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0 overflow-y-auto">
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #print-receipt-overlay, #print-session-receipt, #print-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .fixed {
            position: absolute !important;
            background: white !important;
            inset: 0 !important;
            padding: 0 !important;
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
          thead th {
            background-color: #f2f2f2 !important;
            color: black !important;
          }
        }
      `}</style>
      <div className="w-full max-w-4xl bg-white border border-slate-200 p-8 rounded shadow-2xl relative text-black print:border-0 print:p-0 print:shadow-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer no-print"
        >
          ✕
        </button>

        {children}

        <div className="mt-6 flex justify-end gap-4 no-print border-t border-slate-100 pt-4">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak {title}
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Official Prabu Gym transparent logo image
const LogoIcon = () => (
  <img
    src="/logo-transparent.png"
    alt="Prabu Gym Logo"
    className="h-12 w-auto object-contain"
  />
);

// 1. Official Receipt Template
interface OfficialReceiptProps {
  onClose: () => void;
  data: {
    transactionNumber: string;
    transactionDate: string;
    memberUsername: string;
    memberName: string;
    packageName: string;
    membershipStart: string;
    membershipEnd: string;
    paymentMethod: string;
    price: number;
    cashierName: string;
  };
}

export const OfficialReceiptTemplate: React.FC<OfficialReceiptProps> = ({ onClose, data }) => {
  return (
    <PrintContainer onClose={onClose} title="Receipt">
      <div id="print-receipt-overlay" className="space-y-6">
        {/* Header Box */}
        <div className="border border-black p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoIcon />
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
          <span>Tanggal : {formatDateLabel(data.transactionDate)}</span>
          <span>Kategori : Pendaftaran</span>
          <span>No Invoice : {data.transactionNumber}</span>
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
                <td className="py-3 px-3 border-r border-black font-mono">{data.memberUsername}</td>
                <td className="py-3 px-3 border-r border-black font-bold">{data.memberName}</td>
                <td className="py-3 px-3 border-r border-black uppercase text-[10px]">{data.packageName}</td>
                <td className="py-3 px-3 border-r border-black font-mono text-[10px]">
                  {formatDateLabel(data.membershipStart)} s/d {formatDateLabel(data.membershipEnd)}
                </td>
                <td className="py-3 px-3 border-r border-black uppercase">{data.paymentMethod}</td>
                <td className="py-3 px-3 font-bold">{formatIDR(data.price)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Box */}
        <div className="grid grid-cols-2 border border-black text-center text-xs font-bold divide-x divide-black">
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Member</div>
            <div className="h-28" />
            <div className="py-2 border-t border-black uppercase font-extrabold">{data.memberName}</div>
          </div>
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Customer Service</div>
            <div className="h-28" />
            <div className="py-2 border-t border-black uppercase font-extrabold">{data.cashierName}</div>
          </div>
        </div>
      </div>
    </PrintContainer>
  );
};

// 2. PT Session Receipt Template
interface SessionReceiptProps {
  onClose: () => void;
  data: {
    memberName: string;
    packageName: string;
    expiryDate: string;
    totalSessions: number;
    remainingSessions: number;
    trainerName: string;
    logs: {
      date: string;
      time: string;
      trainer_name: string;
      used_sessions: number;
      admin_name: string;
      notes?: string;
    }[];
  };
}

export const SessionReceiptTemplate: React.FC<SessionReceiptProps> = ({ onClose, data }) => {
  return (
    <PrintContainer onClose={onClose} title="Sesi Member">
      <div id="print-session-receipt" className="space-y-6">
        {/* Header Box */}
        <div className="grid grid-cols-[1.2fr_2fr] border border-black divide-x divide-black">
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <img
              src="/logo-transparent.png"
              alt="Prabu Gym Logo"
              className="h-14 w-auto object-contain"
            />
            <div className="text-center leading-none mt-2">
              <h1 className="text-xl font-black tracking-widest">PRABU</h1>
              <span className="text-[8px] uppercase font-bold text-slate-500">Gym & Fitness Center</span>
            </div>
          </div>
          
          <div className="p-4 flex items-center justify-center text-center">
            <h2 className="text-3xl font-black uppercase tracking-widest text-slate-800">
              PRABU SESSION MEMBER
            </h2>
          </div>
        </div>

        {/* Details Table */}
        <div className="border border-black overflow-hidden rounded-xs text-xs font-semibold">
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black w-[30%]">Nama Anggota</td>
                <td className="py-2.5 px-4 font-bold text-slate-800">{data.memberName}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Paket Latihan</td>
                <td className="py-2.5 px-4 uppercase text-slate-800">{data.packageName}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Masa Aktif</td>
                <td className="py-2.5 px-4 font-mono text-slate-700">{formatDateLabel(data.expiryDate)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Jumlah Sesi</td>
                <td className="py-2.5 px-4 text-slate-800">{data.totalSessions}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Sisa Sesi</td>
                <td className="py-2.5 px-4 font-bold text-slate-850">{data.remainingSessions}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Pelatih</td>
                <td className="py-2.5 px-4 text-slate-700">{data.trainerName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Log History */}
        <div className="space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-700">Riwayat Penggunaan Sesi:</div>
          <div className="border border-black overflow-hidden rounded-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-black font-extrabold uppercase text-[9px] text-slate-700">
                  <th className="py-2 px-3 border-r border-black w-8 text-center">No</th>
                  <th className="py-2 px-3 border-r border-black">Tanggal</th>
                  <th className="py-2 px-3 border-r border-black">Waktu</th>
                  <th className="py-2 px-3 border-r border-black">Pelatih</th>
                  <th className="py-2 px-3 border-r border-black text-center">Sesi Terpakai</th>
                  <th className="py-2 px-3 border-r border-black">Staff / CS</th>
                  <th className="py-2 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.length > 0 ? (
                  data.logs.map((log, index) => (
                    <tr key={index} className="border-b border-black last:border-0 font-semibold text-slate-850">
                      <td className="py-2 px-3 border-r border-black text-center">{index + 1}</td>
                      <td className="py-2 px-3 border-r border-black font-mono">{formatDateLabel(log.date)}</td>
                      <td className="py-2 px-3 border-r border-black font-mono">{log.time}</td>
                      <td className="py-2 px-3 border-r border-black">{log.trainer_name}</td>
                      <td className="py-2 px-3 border-r border-black text-center">{log.used_sessions} Sesi</td>
                      <td className="py-2 px-3 border-r border-black text-slate-700">{log.admin_name}</td>
                      <td className="py-2 px-3 text-slate-700 text-[10px] normal-case">{log.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-bold select-none uppercase tracking-widest text-[10px]">
                      Belum ada riwayat sesi yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PrintContainer>
  );
};

// 3. Report Template
interface ReportProps {
  onClose: () => void;
  title: string;
  data: {
    startDate: string;
    endDate: string;
    transactionType: string;
    totalRevenue: number;
    totalPpn: number;
    grandTotal: number;
    cashierName: string;
    transactions: {
      id: string;
      transactionDate: string;
      transactionNumber: string;
      memberId?: string;
      memberName?: string;
      packageName: string;
      paymentMethod: string;
      totalAmount: number;
      ppn: number;
      subtotal: number;
      adminName: string;
    }[];
  };
}

export const ReportTemplate: React.FC<ReportProps> = ({ onClose, title, data }) => {
  return (
    <PrintContainer onClose={onClose} title={title}>
      <div id="print-area" className="space-y-6">
        {/* Header Box */}
        <div className="border border-black p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div className="text-left leading-none">
              <h1 className="text-2xl font-black tracking-widest">PRABU</h1>
              <span className="text-[9px] uppercase font-bold text-slate-400">Gym & Fitness Center</span>
            </div>
          </div>
          <div className="text-right border-l border-black pl-8 pr-4">
            <h2 className="text-xl font-extrabold uppercase tracking-widest text-slate-800">{title}</h2>
          </div>
        </div>

        {/* Summary Table */}
        <div className="border border-black overflow-hidden rounded-xs">
          <table className="w-full text-left text-xs border-collapse">
            <tbody>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black w-[35%]">Tanggal Transaksi</td>
                <td className="py-2.5 px-4 font-mono">{formatDateLabel(data.startDate)} s/d {formatDateLabel(data.endDate)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Jenis Transaksi</td>
                <td className="py-2.5 px-4 uppercase">{data.transactionType}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Total Pemasukan Transaksi</td>
                <td className="py-2.5 px-4 font-extrabold">{formatIDR(data.totalRevenue)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Total PPN</td>
                <td className="py-2.5 px-4 font-extrabold">{formatIDR(data.totalPpn)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Grand Total</td>
                <td className="py-2.5 px-4 font-black text-[#DC3545]">{formatIDR(data.grandTotal)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Nama Staff</td>
                <td className="py-2.5 px-4 font-semibold">{data.cashierName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Records Title */}
        <div className="pt-4">
          <h3 className="font-heading text-lg font-bold border-b border-black pb-2 text-slate-800">Transaksi Anggota</h3>
        </div>

        {/* Main Table */}
        <div className="border border-black overflow-hidden rounded-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-extrabold uppercase text-[9px] tracking-wider text-slate-700">
                <th className="py-2.5 px-3 border-r border-black w-10 text-center">No</th>
                <th className="py-2.5 px-3 border-r border-black">Tanggal Transaksi</th>
                <th className="py-2.5 px-3 border-r border-black">Nomor Transaksi</th>
                <th className="py-2.5 px-3 border-r border-black">Nomor Anggota</th>
                <th className="py-2.5 px-3 border-r border-black">Nama Anggota</th>
                <th className="py-2.5 px-3 border-r border-black">Paket Anggota</th>
                <th className="py-2.5 px-3 border-r border-black">Jenis Pembayaran</th>
                <th className="py-2.5 px-3 border-r border-black text-right">Total Pembayaran</th>
                <th className="py-2.5 px-3 border-r border-black text-right">PPN</th>
                <th className="py-2.5 px-3 border-r border-black text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-center">Nama CS</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.length > 0 ? (
                data.transactions.map((tx, idx) => (
                  <tr key={tx.id} className="border-b border-black last:border-0">
                    <td className="py-2 px-3 border-r border-black text-center">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-black font-mono">{formatDateLabel(tx.transactionDate)}</td>
                    <td className="py-2 px-3 border-r border-black font-mono font-bold">{tx.transactionNumber}</td>
                    <td className="py-2 px-3 border-r border-black font-mono">{tx.memberId || '-'}</td>
                    <td className="py-2 px-3 border-r border-black font-bold">{tx.memberName || '-'}</td>
                    <td className="py-2 px-3 border-r border-black uppercase text-[10px]">{tx.packageName}</td>
                    <td className="py-2 px-3 border-r border-black uppercase">{tx.paymentMethod}</td>
                    <td className="py-2 px-3 border-r border-black text-right font-semibold">{tx.totalAmount.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 border-r border-black text-right text-slate-500">{tx.ppn.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 border-r border-black text-right font-extrabold">{tx.subtotal.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-center text-slate-600 text-[10px]">{tx.adminName}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-black">
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-bold select-none uppercase tracking-widest">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              )}

              {/* Grand Total Row */}
              <tr className="bg-slate-50 font-black text-slate-800">
                <td colSpan={7} className="py-3 px-4 border-r border-black text-center uppercase tracking-widest font-extrabold">Grand Total</td>
                <td className="py-3 px-3 border-r border-black text-right font-black">{data.totalRevenue.toLocaleString('id-ID')}</td>
                <td className="py-3 px-3 border-r border-black text-right font-bold text-slate-500">{data.totalPpn.toLocaleString('id-ID')}</td>
                <td className="py-3 px-3 border-r border-black text-right font-black">{data.grandTotal.toLocaleString('id-ID')}</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PrintContainer>
  );
};

export type PrintTemplateType = 'official-receipt' | 'session-receipt' | 'report';

interface DynamicPrintTemplateProps {
  template: PrintTemplateType;
  title?: string;
  data: any;
  onClose: () => void;
}

export function DynamicPrintTemplate({ template, title, data, onClose }: DynamicPrintTemplateProps) {
  switch (template) {
    case 'official-receipt':
      return <OfficialReceiptTemplate data={data} onClose={onClose} />;
    case 'session-receipt':
      return <SessionReceiptTemplate data={data} onClose={onClose} />;
    case 'report':
      return <ReportTemplate title={title || 'PRABU MEMBER REPORT'} data={data} onClose={onClose} />;
    default:
      return null;
  }
}

