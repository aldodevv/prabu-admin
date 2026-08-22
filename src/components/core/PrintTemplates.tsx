import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatDateLabel, formatIDR } from '@/core/constants';

interface PrintContainerProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

const PrintContainer: React.FC<PrintContainerProps> = ({ onClose, title, children, maxWidthClass = 'max-w-4xl' }) => {
  return (
    <div className="print-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block overflow-y-auto">
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 5mm;
          }

          /* Hide UI navigation, sidebar, background pages, and all non-printable elements */
          header, aside, nav, button, .no-print, [data-no-print] {
            display: none !important;
          }

          html, body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-modal-overlay {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          #print-modal-root {
            position: static !important;
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #print-area, #print-receipt-overlay, #print-session-receipt, #print-leave-receipt, #receipt-print-area {
            display: block !important;
            visibility: visible !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-weight: 700 !important;
          }
        }
      `}</style>
      <div id="print-modal-root" className={`w-full ${maxWidthClass} bg-white border border-slate-200 p-5 md:p-6 rounded-lg shadow-2xl relative text-black print:border-0 print:p-0 print:shadow-none print:max-w-none print:w-full print:bg-white`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer no-print z-10"
        >
          ✕
        </button>

        {children}

        <div className="mt-6 flex justify-end gap-4 no-print border-t border-slate-100 pt-4">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
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
        <div className="grid grid-cols-[1.2fr_2fr] border border-black divide-x divide-black">
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <LogoIcon />
            <div className="text-center leading-none mt-2">
              <h1 className="text-xl font-bold tracking-widest font-heading text-black">PRABU GYM</h1>
              <span className="text-[9px] uppercase font-bold text-black tracking-wider">Gym & Fitness Center</span>
            </div>
          </div>
          <div className="p-4 flex items-center justify-center text-center">
            <h2 className="text-2xl print:text-3xl font-bold uppercase tracking-wider text-black">
              PRABU OFFICIAL RECEIPT
            </h2>
          </div>
        </div>

        {/* Metadata Summary Row - Bold & Prominent */}
        <div className="border-t border-b border-black py-2.5 px-4 flex justify-between text-xs font-bold text-black uppercase tracking-wide">
          <span>Tanggal : {formatDateLabel(data.transactionDate)}</span>
          <span>Kategori : Pendaftaran</span>
          <span>No Invoice : {data.transactionNumber}</span>
        </div>

        {/* Details Table - Bold Header & Body */}
        <div className="border border-black overflow-hidden rounded-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-black font-bold uppercase text-xs text-black">
                <th className="py-2.5 px-3 border-r border-black font-bold">NOMOR ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-bold">NAMA ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-bold">PAKET ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-bold">MASA AKTIF</th>
                <th className="py-2.5 px-3 border-r border-black font-bold">JENIS PEMBAYARAN</th>
                <th className="py-2.5 px-3 font-bold">HARGA PAKET</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-black text-xs">
                <td className="py-3 px-3 border-r border-black font-bold">{data.memberUsername}</td>
                <td className="py-3 px-3 border-r border-black font-bold">{data.memberName}</td>
                <td className="py-3 px-3 border-r border-black uppercase font-bold">{data.packageName}</td>
                <td className="py-3 px-3 border-r border-black font-bold">
                  {formatDateLabel(data.membershipStart)} s/d {formatDateLabel(data.membershipEnd)}
                </td>
                <td className="py-3 px-3 border-r border-black uppercase font-bold">{data.paymentMethod}</td>
                <td className="py-3 px-3 font-bold">{formatIDR(data.price)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Box */}
        <div className="grid grid-cols-2 border border-black text-center text-xs font-bold divide-x divide-black">
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-xs font-bold text-black">MEMBER</div>
            <div className="h-28" />
            <div className="py-2 border-t border-black uppercase font-bold text-black">{data.memberName}</div>
          </div>
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-xs font-bold text-black">CUSTOMER SERVICE</div>
            <div className="h-28" />
            <div className="py-2 border-t border-black uppercase font-bold text-black">{data.cashierName}</div>
          </div>
        </div>
      </div>
    </PrintContainer>
  );
};

// 1b. Official PT Registration Receipt Template
interface OfficialPTReceiptProps {
  onClose: () => void;
  data: {
    transactionNumber: string;
    transactionDate: string;
    memberUsername: string;
    memberName: string;
    packageName: string;
    sessionCount: number;
    membershipEnd: string;
    paymentMethod: string;
    price: number;
    trainerName: string;
    cashierName: string;
  };
}

export const OfficialPTReceiptTemplate: React.FC<OfficialPTReceiptProps> = ({ onClose, data }) => {
  return (
    <PrintContainer onClose={onClose} title="Receipt Personal Trainer">
      <div id="print-receipt-overlay" className="space-y-6">
        {/* Header Box */}
        <div className="grid grid-cols-[1.2fr_2fr] border border-black divide-x divide-black">
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <LogoIcon />
            <div className="text-center leading-none mt-2">
              <h1 className="text-xl font-bold tracking-widest font-heading text-black">PRABU GYM</h1>
              <span className="text-[9px] uppercase font-bold text-black tracking-wider">Gym & Fitness Center</span>
            </div>
          </div>
          <div className="p-4 flex items-center justify-center text-center">
            <h2 className="text-2xl print:text-3xl font-bold uppercase tracking-wider text-black">
              PRABU OFFICIAL RECEIPT
            </h2>
          </div>
        </div>

        {/* Metadata Summary Row - Bold & Prominent */}
        <div className="border-t border-b border-black py-2.5 px-4 flex justify-between text-xs font-bold text-black uppercase tracking-wide">
          <span>Tanggal : {formatDateLabel(data.transactionDate)}</span>
          <span>Kategori : Personal Trainer</span>
          <span>No Invoice : {data.transactionNumber}</span>
        </div>

        {/* Details Table - All Bold & Uniform Font */}
        <div className="border border-black overflow-hidden rounded-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-black font-bold uppercase text-xs text-black">
                <th className="py-2.5 px-3 border-r border-black font-bold">NOMOR ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-bold">NAMA ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-bold">PAKET ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-bold text-center">JUMLAH SESI</th>
                <th className="py-2.5 px-3 border-r border-black font-bold">MASA AKTIF</th>
                <th className="py-2.5 px-3 font-bold">HARGA PAKET</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-black text-xs">
                <td className="py-3 px-3 border-r border-black font-bold">{data.memberUsername}</td>
                <td className="py-3 px-3 border-r border-black font-bold">{data.memberName}</td>
                <td className="py-3 px-3 border-r border-black uppercase font-bold">{data.packageName}</td>
                <td className="py-3 px-3 border-r border-black text-center font-bold">{data.sessionCount}</td>
                <td className="py-3 px-3 border-r border-black font-bold">{formatDateLabel(data.membershipEnd)}</td>
                <td className="py-3 px-3 font-bold">{formatIDR(data.price)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Box (Three signature columns: Member, PT, CS) */}
        <div className="grid grid-cols-3 border border-black text-center text-xs font-bold divide-x divide-black">
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-xs font-bold text-black">MEMBER</div>
            <div className="h-28" />
            <div className="py-2 border-t border-black uppercase font-bold text-black">{data.memberName}</div>
          </div>
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-xs font-bold text-black">PERSONAL TRAINER</div>
            <div className="h-28" />
            <div className="py-2 border-t border-black uppercase font-bold text-black">{data.trainerName}</div>
          </div>
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-xs font-bold text-black">CUSTOMER SERVICE</div>
            <div className="h-28" />
            <div className="py-2 border-t border-black uppercase font-bold text-black">{data.cashierName}</div>
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
              <h1 className="text-xl font-black tracking-widest font-heading">PRABU GYM</h1>
              <span className="text-[8px] uppercase font-bold text-slate-600 tracking-wider">Gym & Fitness Center</span>
            </div>
          </div>

          <div className="p-4 flex items-center justify-center text-center">
            <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900">
              PRABU SESSION MEMBER
            </h2>
          </div>
        </div>

        {/* Details Table */}
        <div className="border border-black overflow-hidden rounded-xs text-xs font-semibold">
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-black bg-slate-100 border-r border-black w-[30%] text-black uppercase">Nama Anggota</td>
                <td className="py-2.5 px-4 font-extrabold text-slate-900">{data.memberName}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-black bg-slate-100 border-r border-black text-black uppercase">Paket Latihan</td>
                <td className="py-2.5 px-4 uppercase text-slate-900 font-bold">{data.packageName}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-black bg-slate-100 border-r border-black text-black uppercase">Masa Aktif</td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{formatDateLabel(data.expiryDate)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-black bg-slate-100 border-r border-black text-black uppercase">Jumlah Sesi</td>
                <td className="py-2.5 px-4 font-extrabold text-slate-900">{data.totalSessions}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2.5 px-4 font-black bg-slate-100 border-r border-black text-black uppercase">Sisa Sesi</td>
                <td className="py-2.5 px-4 font-black text-slate-900">{data.remainingSessions}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-black bg-slate-100 border-r border-black text-black uppercase">Pelatih</td>
                <td className="py-2.5 px-4 font-bold text-slate-900">{data.trainerName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Log History */}
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-wide text-black">Riwayat Penggunaan Sesi:</div>
          <div className="border border-black overflow-hidden rounded-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-black uppercase text-[10px] text-black">
                  <th className="py-2 px-3 border-r border-black w-8 text-center font-black">NO</th>
                  <th className="py-2 px-3 border-r border-black font-black">TANGGAL</th>
                  <th className="py-2 px-3 border-r border-black font-black">WAKTU</th>
                  <th className="py-2 px-3 border-r border-black font-black">PELATIH</th>
                  <th className="py-2 px-3 border-r border-black text-center font-black">SESI TERPAKAI</th>
                  <th className="py-2 px-3 border-r border-black font-black">STAFF / CS</th>
                  <th className="py-2 px-3 font-black">KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.length > 0 ? (
                  data.logs.map((log, index) => (
                    <tr key={index} className="border-b border-black last:border-0 font-bold text-slate-900">
                      <td className="py-2 px-3 border-r border-black text-center font-bold">{index + 1}</td>
                      <td className="py-2 px-3 border-r border-black font-mono font-bold">{formatDateLabel(log.date)}</td>
                      <td className="py-2 px-3 border-r border-black font-mono font-bold">{log.time}</td>
                      <td className="py-2 px-3 border-r border-black font-bold">{log.trainer_name}</td>
                      <td className="py-2 px-3 border-r border-black text-center font-extrabold">{log.used_sessions} Sesi</td>
                      <td className="py-2 px-3 border-r border-black text-slate-900 font-bold">{log.admin_name}</td>
                      <td className="py-2 px-3 text-slate-900 text-[10px] normal-case font-bold">{log.notes || '-'}</td>
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
      memberUsername?: string;
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
    <PrintContainer onClose={onClose} title={title} maxWidthClass="max-w-6xl">
      <div id="print-area" className="space-y-3.5 print:space-y-2.5 font-sans font-bold">
        {/* Header Box with Thin Border */}
        <div className="border border-slate-300 p-3 print:p-2.5 rounded-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div className="text-left leading-none">
              <h1 className="text-xl print:text-lg font-black tracking-widest font-heading text-slate-900">PRABU GYM</h1>
              <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 tracking-wider">Gym & Fitness Center</span>
            </div>
          </div>
          <div className="text-right border-l border-slate-300 pl-6 pr-3">
            <h2 className="text-lg print:text-base font-black uppercase tracking-widest text-slate-900">{title}</h2>
          </div>
        </div>

        {/* Summary Table with Thin Border */}
        <div className="border border-slate-300 rounded-md overflow-hidden">
          <table className="w-full text-left text-xs print:text-[11px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 w-[35%] text-slate-800">Tanggal Transaksi</td>
                <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{formatDateLabel(data.startDate)} s/d {formatDateLabel(data.endDate)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Jenis Transaksi</td>
                <td className="py-1.5 px-3 uppercase font-bold text-slate-900">{data.transactionType}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Total Pemasukan Transaksi</td>
                <td className="py-1.5 px-3 font-extrabold text-slate-900">{formatIDR(data.totalRevenue)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Total PPN</td>
                <td className="py-1.5 px-3 font-extrabold text-slate-900">{formatIDR(data.totalPpn)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Grand Total</td>
                <td className="py-1.5 px-3 font-black text-[#DC3545]">{formatIDR(data.grandTotal)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Nama Staff</td>
                <td className="py-1.5 px-3 font-bold text-slate-900">{data.cashierName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Records Title */}
        <h3 className="font-heading text-sm print:text-xs font-bold border-b border-slate-300 pb-1 text-slate-900 uppercase tracking-wider">
          TRANSAKSI ANGGOTA
        </h3>

        {/* Main Table with Thin Borders, Text Wrapping & Padded Cells */}
        <div className="border border-slate-300 rounded-md overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs print:text-[10px] border-collapse table-auto print:table-fixed">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-extrabold uppercase text-[10px] print:text-[9px] tracking-wider text-slate-800">
                <th className="py-1.5 px-1 border-r border-slate-300 text-center font-bold print:w-[5%]">No</th>
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold print:w-[10%]">Tanggal</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300 text-center font-bold print:w-[15%] leading-tight">NOMOR<br />TRANSAKSI</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300 text-center font-bold print:w-[14%] leading-tight">NOMOR<br />ANGGOTA</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300 text-left font-bold print:w-[14%]">Nama Anggota</th>
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold print:w-[9%]">Metode</th>
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold print:w-[12%] leading-tight">TOTAL<br />BAYAR</th>
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold print:w-[9%]">PPN</th>
                <th className="py-1.5 px-2 text-center font-bold print:w-[13%] leading-tight">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.length > 0 ? (
                data.transactions.map((tx, idx) => (
                  <tr key={tx.id} className="border-b border-slate-200 last:border-0 text-[10px] print:text-[9px] text-slate-900 font-bold hover:bg-slate-50/50">
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{idx + 1}</td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono font-bold break-words">{formatDateLabel(tx.transactionDate)}</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono font-bold text-[9px] print:text-[8.5px] break-all leading-snug">{tx.transactionNumber}</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono font-bold text-[9px] print:text-[8.5px] break-all leading-snug">{tx.memberUsername || tx.memberId || '-'}</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold break-words leading-snug text-[9.5px] print:text-[9px]">{tx.memberName || '-'}</td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center uppercase text-[9px] font-bold break-words">{tx.paymentMethod}</td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-right font-bold text-[9px] font-mono whitespace-nowrap">{tx.totalAmount.toLocaleString('id-ID')}</td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-right text-slate-700 font-bold text-[9px] font-mono whitespace-nowrap">{tx.ppn.toLocaleString('id-ID')}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-[9px] font-mono whitespace-nowrap">{tx.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-slate-200">
                  <td colSpan={9} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-widest">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              )}

              {/* Grand Total Row */}
              <tr className="bg-slate-50 font-black text-slate-900 text-[10px] print:text-[9px] border-t border-slate-300">
                <td colSpan={6} className="py-2 px-2.5 border-r border-slate-300 text-center uppercase tracking-widest font-black">Grand Total</td>
                <td className="py-2 px-2 border-r border-slate-300 text-right font-black font-mono text-[9px] whitespace-nowrap">{data.totalRevenue.toLocaleString('id-ID')}</td>
                <td className="py-2 px-2 border-r border-slate-300 text-right font-black font-mono text-[9px] whitespace-nowrap">{data.totalPpn.toLocaleString('id-ID')}</td>
                <td className="py-2 px-2 text-right font-black font-mono text-[9px] whitespace-nowrap">{data.grandTotal.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Staff / Admin Info Footer Below Table */}
        <div className="flex justify-between items-center pt-2 text-xs text-slate-700 font-sans border-t border-slate-200">
          <div className="text-slate-400 text-[9px] italic font-bold">
            * Laporan dibuat otomatis oleh sistem Prabu Gym.
          </div>
          <div className="flex items-center text-right gap-1.5">
            <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Petugas / CS Kasir:</span>
            <span className="font-extrabold text-slate-900 text-[10px]">{data.cashierName || 'Staff Prabu Gym'}</span>
          </div>
        </div>
      </div>
    </PrintContainer>
  );
};

// 4. Member Leave Receipt Template
interface MemberLeaveReceiptProps {
  onClose: () => void;
  data: {
    transactionNumber?: string;
    transactionDate: string;
    memberCode: string;
    memberName: string;
    branchName?: string;
    startDate: string;
    endDate: string;
    status: string;
    paymentMethod: string;
    feeAmount: number;
    notes?: string;
    cashierName: string;
  };
}

export const MemberLeaveReceiptTemplate: React.FC<MemberLeaveReceiptProps> = ({ onClose, data }) => {
  return (
    <PrintContainer onClose={onClose} title="Receipt Cuti Anggota">
      <div id="print-leave-receipt" className="space-y-6">
        {/* Header Box */}
        <div className="border border-black p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div className="text-left leading-none">
              <h1 className="text-2xl font-black tracking-widest font-heading">PRABU GYM</h1>
              <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">
                {data.branchName || 'Gym & Fitness Center'}
              </span>
            </div>
          </div>
          <div className="text-right border-l border-black pl-8 pr-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
              KWITANSI CUTI ANGGOTA
            </h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
              BUKTI PEMBAYARAN & FREEZE CUTI
            </span>
          </div>
        </div>

        {/* Metadata Summary Row */}
        <div className="border-t border-b border-black py-2.5 px-4 flex justify-between text-xs font-extrabold text-black uppercase tracking-wide">
          <span>Tanggal : {formatDateLabel(data.transactionDate)}</span>
          <span>Kategori : Cuti Anggota</span>
          <span>No Struk : {data.transactionNumber || 'TRX-CUTI'}</span>
        </div>

        {/* Details Table */}
        <div className="border border-black overflow-hidden rounded-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-black uppercase text-[11px] text-black">
                <th className="py-2.5 px-3 border-r border-black font-black">NOMOR ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-black">NAMA ANGGOTA</th>
                <th className="py-2.5 px-3 border-r border-black font-black">PERIODE CUTI</th>
                <th className="py-2.5 px-3 border-r border-black font-black">STATUS</th>
                <th className="py-2.5 px-3 border-r border-black font-black">METODE BAYAR</th>
                <th className="py-2.5 px-3 font-black text-right">BIAYA CUTI</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-slate-900">
                <td className="py-3 px-3 border-r border-black font-mono font-bold">{data.memberCode}</td>
                <td className="py-3 px-3 border-r border-black font-extrabold">{data.memberName}</td>
                <td className="py-3 px-3 border-r border-black font-mono text-[11px] font-bold text-cyan-800">
                  {data.startDate} s/d {data.endDate}
                </td>
                <td className="py-3 px-3 border-r border-black uppercase font-bold text-cyan-700">{data.status}</td>
                <td className="py-3 px-3 border-r border-black uppercase font-bold">{data.paymentMethod}</td>
                <td className="py-3 px-3 font-extrabold text-right font-mono text-sm">{formatIDR(data.feeAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {data.notes && (
          <div className="p-3 border border-dashed border-slate-400 bg-slate-50 text-xs italic text-slate-700">
            * Keterangan: {data.notes}
          </div>
        )}

        {/* Signature Box */}
        <div className="grid grid-cols-2 border border-black text-center text-xs font-bold divide-x divide-black">
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-100 text-[10px] font-black text-black">Anggota</div>
            <div className="h-24 flex items-center justify-center text-slate-300 italic text-[10px]">Tanda Tangan</div>
            <div className="py-2 border-t border-black uppercase font-black text-black">{data.memberName}</div>
          </div>
          <div>
            <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-100 text-[10px] font-black text-black">Petugas / CS</div>
            <div className="h-24 flex items-center justify-center text-slate-300 italic text-[10px]">Tanda Tangan</div>
            <div className="py-2 border-t border-black uppercase font-black text-black">{data.cashierName}</div>
          </div>
        </div>
      </div>
    </PrintContainer>
  );
};

// 5. Class Commission Report Template
interface ClassCommissionReportProps {
  onClose: () => void;
  title: string;
  data: {
    startDate: string;
    endDate: string;
    totalInstructors: number;
    grandTotalClasses: number;
    grandTotalCommission: number;
    cashierName: string;
    reports: {
      instructor_name: string;
      total_classes: number;
      rate_per_class: number;
      total_commission: number;
    }[];
  };
}

export const ClassCommissionReportTemplate: React.FC<ClassCommissionReportProps> = ({ onClose, title, data }) => {
  return (
    <PrintContainer onClose={onClose} title={title} maxWidthClass="max-w-5xl">
      <div id="print-area" className="space-y-3.5 print:space-y-2.5 font-sans">
        {/* Header Box with Thin Border */}
        <div className="border border-slate-300 p-3 print:p-2.5 rounded-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div className="text-left leading-none">
              <h1 className="text-xl print:text-lg font-black tracking-widest font-heading text-slate-900">PRABU GYM</h1>
              <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-500 tracking-wider">Gym & Fitness Center</span>
            </div>
          </div>
          <div className="text-right border-l border-slate-300 pl-6 pr-3">
            <h2 className="text-lg print:text-base font-black uppercase tracking-widest text-slate-900">{title}</h2>
          </div>
        </div>

        {/* Summary Table with Thin Border */}
        <div className="border border-slate-300 rounded-md overflow-hidden">
          <table className="w-full text-left text-xs print:text-[11px] border-collapse font-bold">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 w-[35%] text-slate-800">Periode Transaksi / Tanggal</td>
                <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                  {data.startDate ? formatDateLabel(data.startDate) : 'Awal'} s/d {data.endDate ? formatDateLabel(data.endDate) : 'Sekarang'}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Total Instruktur</td>
                <td className="py-1.5 px-3 uppercase font-bold text-slate-900">{data.totalInstructors} Instruktur</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Total Sesi Kelas</td>
                <td className="py-1.5 px-3 font-bold text-slate-900">{data.grandTotalClasses} Sesi Kelas</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Grand Total Komisi</td>
                <td className="py-1.5 px-3 font-black text-[#DC3545]">{formatIDR(data.grandTotalCommission)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Nama Petugas / CS Kasir</td>
                <td className="py-1.5 px-3 font-bold text-slate-900">{data.cashierName || 'Staff Prabu Gym'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Records Title */}
        <h3 className="font-heading text-sm print:text-xs font-bold border-b border-slate-300 pb-1 text-slate-900 uppercase tracking-wider">
          REKAPITULASI INSENTIF MENGAJAR INSTRUKTUR
        </h3>

        {/* Main Table with Thin Borders */}
        <div className="border border-slate-300 rounded-md overflow-x-auto print:overflow-visible font-bold">
          <table className="w-full text-left text-xs print:text-[10px] border-collapse table-auto print:table-fixed">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-extrabold uppercase text-[10px] print:text-[9px] tracking-wider text-slate-800">
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold print:w-[8%]">No</th>
                <th className="py-1.5 px-3 border-r border-slate-300 text-left font-bold print:w-[35%]">NAMA INSTRUKTUR</th>
                <th className="py-1.5 px-3 border-r border-slate-300 text-center font-bold print:w-[18%]">JUMLAH SESI KELAS</th>
                <th className="py-1.5 px-3 border-r border-slate-300 text-right font-bold print:w-[19%]">RATE FEE PER KELAS</th>
                <th className="py-1.5 px-3 text-right font-bold print:w-[20%]">TOTAL KOMISI DITERIMA</th>
              </tr>
            </thead>
            <tbody>
              {data.reports.length > 0 ? (
                data.reports.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-200 last:border-0 text-[10px] print:text-[9px] text-slate-900 font-bold hover:bg-slate-50/50">
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono text-slate-700 font-bold">{idx + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">{r.instructor_name}</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-center font-bold text-slate-900">{r.total_classes} Sesi Kelas</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">{formatIDR(r.rate_per_class)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">{formatIDR(r.total_commission)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-slate-200">
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-widest">
                    Tidak ada data komisi ditemukan.
                  </td>
                </tr>
              )}

              {/* Grand Total Row */}
              <tr className="bg-slate-50 font-black text-slate-900 text-[10px] print:text-[9px] border-t border-slate-300">
                <td colSpan={2} className="py-2 px-3 border-r border-slate-300 text-right uppercase tracking-widest font-black">Grand Total Komisi</td>
                <td className="py-2 px-3 border-r border-slate-300 text-center font-black font-mono">{data.grandTotalClasses} Sesi Kelas</td>
                <td className="py-2 px-3 border-r border-slate-300"></td>
                <td className="py-2 px-3 text-right font-black font-mono text-[11px] text-[#DC3545]">{formatIDR(data.grandTotalCommission)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Admin Signature Info */}
        <div className="pt-2 flex justify-between items-center text-[10px] text-slate-600 border-t border-slate-200 print:pt-2 font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Petugas / CS Kasir:</span>
            <span className="font-extrabold text-slate-900 text-[10px]">{data.cashierName || 'Staff Prabu Gym'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-mono text-[9px] font-bold">Prabu Gym Integrated System</span>
          </div>
        </div>
      </div>
    </PrintContainer>
  );
};

// 6. Workout / PT Registration Report Template
interface WorkoutReportProps {
  onClose: () => void;
  title: string;
  data: {
    startDate: string;
    endDate: string;
    totalTransactions: number;
    grandTotal: number;
    cashierName: string;
    registrations: {
      id: string;
      created_at: string;
      transaction_number?: string;
      member_name: string;
      member_username?: string;
      package_name: string;
      trainer_name: string;
      payment_method: string;
      total_amount: number;
    }[];
  };
}

export const WorkoutReportTemplate: React.FC<WorkoutReportProps> = ({ onClose, title, data }) => {
  return (
    <PrintContainer onClose={onClose} title={title} maxWidthClass="max-w-5xl">
      <div id="print-area" className="space-y-3.5 print:space-y-2.5 font-sans font-bold">
        {/* Header Box with Thin Border */}
        <div className="border border-slate-300 p-3 print:p-2.5 rounded-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div className="text-left leading-none">
              <h1 className="text-xl print:text-lg font-black tracking-widest font-heading text-slate-900">PRABU GYM</h1>
              <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 tracking-wider">Gym & Fitness Center</span>
            </div>
          </div>
          <div className="text-right border-l border-slate-300 pl-6 pr-3">
            <h2 className="text-lg print:text-base font-black uppercase tracking-widest text-slate-900">{title}</h2>
          </div>
        </div>

        {/* Summary Table with Thin Border */}
        <div className="border border-slate-300 rounded-md overflow-hidden font-bold">
          <table className="w-full text-left text-xs print:text-[11px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 w-[35%] text-slate-800">Periode Transaksi / Tanggal</td>
                <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                  {data.startDate ? formatDateLabel(data.startDate) : 'Awal'} s/d {data.endDate ? formatDateLabel(data.endDate) : 'Sekarang'}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Total Transaksi</td>
                <td className="py-1.5 px-3 uppercase font-bold text-slate-900">{data.totalTransactions} Transaksi</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Grand Total Pendapatan</td>
                <td className="py-1.5 px-3 font-black text-[#DC3545]">{formatIDR(data.grandTotal)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 text-slate-800">Nama Petugas / CS Kasir</td>
                <td className="py-1.5 px-3 font-bold text-slate-900">{data.cashierName || 'Staff Prabu Gym'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sub Header Title Banner */}
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t font-bold text-xs uppercase tracking-wider select-none flex justify-between items-center print:bg-slate-800 print:text-white">
          <span>RANGKUMAN PENDAFTARAN LATIHAN PERSONAL TRAINER</span>
          <span className="font-mono text-[10px] font-bold">TOTAL: {data.totalTransactions} TRANSAKSI</span>
        </div>

        {/* Main Table with Thin Borders */}
        <div className="border border-slate-300 rounded-md overflow-x-auto print:overflow-visible font-bold">
          <table className="w-full text-left text-xs print:text-[10px] border-collapse table-auto print:table-fixed">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-extrabold uppercase text-[10px] print:text-[9px] tracking-wider text-slate-800">
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold w-10">No</th>
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold">Tanggal</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300 text-left font-bold">No Transaksi</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300 text-left font-bold">Nama Anggota</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300 text-left font-bold">Paket Latihan</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300 text-left font-bold">Pelatih (PT)</th>
                <th className="py-1.5 px-2 border-r border-slate-300 text-center font-bold">Metode</th>
                <th className="py-1.5 px-2.5 text-right font-bold">Total Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900 font-bold">
              {data.registrations.length > 0 ? (
                data.registrations.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-mono text-slate-700 font-bold">{idx + 1}</td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono font-bold">{formatDateLabel(r.created_at)}</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono font-bold text-slate-900">
                      {r.transaction_number || `PRABU-PT-${r.id.substring(0, 7).toUpperCase()}`}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold text-slate-900">
                      {r.member_name} {r.member_username ? <span className="font-mono text-slate-600 font-bold">(@{r.member_username})</span> : ''}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold uppercase">{r.package_name}</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold text-slate-900">{r.trainer_name}</td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center uppercase font-bold">{r.payment_method}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                      Rp. {r.total_amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                    Tidak ada transaksi pendaftaran latihan.
                  </td>
                </tr>
              )}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td colSpan={7} className="py-2 px-3 text-right uppercase tracking-wider text-xs text-slate-800 font-bold">
                  Grand Total
                </td>
                <td className="py-2 px-3 text-right font-mono font-black text-sm text-[#DC3545]">
                  Rp. {data.grandTotal.toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Staff Footer */}
        <div className="flex justify-between items-center pt-2 text-xs text-slate-700 font-sans border-t border-slate-200 font-bold">
          <div className="text-slate-400 text-[9px] italic font-bold">
            * Laporan dibuat otomatis oleh sistem Prabu Gym.
          </div>
          <div className="flex items-center text-right gap-1.5">
            <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Petugas / CS Kasir:</span>
            <span className="font-extrabold text-slate-900 text-[10px]">{data.cashierName || 'Staff Prabu Gym'}</span>
          </div>
        </div>
      </div>
    </PrintContainer>
  );
};

// 7. Thermal POS Receipt Template (Struk Kasir Thermal Panjang)
export interface ThermalReceiptProps {
  onClose: () => void;
  data: {
    transactionNumber: string;
    transactionDate: string;
    memberUsername?: string;
    memberName?: string;
    packageName: string;
    paymentMethod: string;
    totalAmount: number;
    cashierName: string;
    branchName?: string;
    branchAddress?: string;
    notes?: string;
    items?: {
      name: string;
      qty: number;
      price: number;
      subtotal: number;
    }[];
  };
}

export const ThermalReceiptTemplate: React.FC<ThermalReceiptProps> = ({ onClose, data }) => {
  return (
    <PrintContainer onClose={onClose} title="Struk Pembayaran" maxWidthClass="max-w-sm">
      <div id="receipt-print-area" className="text-black font-mono text-xs leading-relaxed mx-auto w-[280px] sm:w-[300px] p-2 bg-white font-bold">
        {/* Logo & Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-1 mb-2">
          <img
            src="/logo-transparent.png"
            alt="Prabu Gym Logo"
            className="h-12 w-auto object-contain mb-1"
          />
          <h2 className="text-sm font-black tracking-widest font-heading text-black uppercase">
            PRABU GYM
          </h2>
          <div className="text-[10px] text-center font-bold text-slate-700 whitespace-pre-line leading-tight uppercase">
            {data.branchName || 'Gym & Fitness Center'}
          </div>
          {data.branchAddress && (
            <div className="text-[9px] text-center text-slate-600 leading-tight">
              {data.branchAddress}
            </div>
          )}
        </div>

        {/* Invoice details */}
        <div className="text-[10px] space-y-0.5 border-t border-dashed border-black pt-2 mb-2 font-bold">
          <div className="flex justify-between">
            <span className="text-slate-700">No Struk :</span>
            <span className="font-mono font-black">{data.transactionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Tanggal  :</span>
            <span>{formatDateLabel(data.transactionDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Kasir    :</span>
            <span className="uppercase">{data.cashierName || 'Staff CS'}</span>
          </div>
          {data.memberName && (
            <div className="flex justify-between border-t border-dotted border-slate-300 pt-1 mt-1">
              <span className="text-slate-700">Member   :</span>
              <span className="font-bold truncate max-w-[170px]">{data.memberName}</span>
            </div>
          )}
          {data.memberUsername && (
            <div className="flex justify-between">
              <span className="text-slate-700">No Anggota:</span>
              <span className="font-mono">{data.memberUsername}</span>
            </div>
          )}
        </div>

        {/* Itemized List */}
        <div className="border-t border-dashed border-black py-2 space-y-2 font-bold">
          {data.items && data.items.length > 0 ? (
            data.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5 text-[10px]">
                <div className="font-bold text-black uppercase">{item.name}</div>
                <div className="flex justify-between pl-2 font-mono">
                  <span className="text-slate-700">{item.qty} x {formatIDR(item.price)}</span>
                  <span className="font-bold">{formatIDR(item.subtotal)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-0.5 text-[10px]">
              <div className="font-bold text-black uppercase">{data.packageName}</div>
              <div className="flex justify-between pl-2 font-mono">
                <span className="text-slate-700">1 x {formatIDR(data.totalAmount)}</span>
                <span className="font-bold">{formatIDR(data.totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Summary Totals */}
        <div className="border-t border-dashed border-black py-2 text-[10px] space-y-1 font-bold">
          <div className="flex justify-between text-xs font-black">
            <span>TOTAL TAGIHAN</span>
            <span className="font-mono text-[#DC3545]">{formatIDR(data.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-700">Metode Bayar</span>
            <span className="uppercase">{data.paymentMethod || 'Tunai'}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-700">Status</span>
            <span className="uppercase text-emerald-700 font-black">LUNAS</span>
          </div>
        </div>

        {data.notes && (
          <div className="border-t border-dotted border-slate-300 py-1.5 text-[9px] text-slate-600 italic">
            * {data.notes}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-dashed border-black pt-2 text-center text-[9px] uppercase font-bold tracking-wider space-y-0.5">
          <div>TERIMA KASIH ATAS KUNJUNGAN ANDA</div>
          <div className="text-[8px] text-slate-500 font-normal">SIMPAN STRUK INI SEBAGAI BUKTI PEMBAYARAN</div>
          <div className="text-[8px] text-slate-400 font-mono pt-1">Prabu Gym Integrated System</div>
        </div>
      </div>
    </PrintContainer>
  );
};

export type PrintTemplateType = 'official-receipt' | 'session-receipt' | 'report' | 'leave-receipt' | 'class-commission' | 'workout-report' | 'thermal-receipt';

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
    case 'leave-receipt':
      return <MemberLeaveReceiptTemplate data={data} onClose={onClose} />;
    case 'class-commission':
      return <ClassCommissionReportTemplate title={title || 'LAPORAN KOMISI KELAS INSTRUKTUR'} data={data} onClose={onClose} />;
    case 'workout-report':
      return <WorkoutReportTemplate title={title || 'LAPORAN PENDAFTARAN LATIHAN (PT)'} data={data} onClose={onClose} />;
    case 'thermal-receipt':
      return <ThermalReceiptTemplate data={data} onClose={onClose} />;
    default:
      return null;
  }
}

