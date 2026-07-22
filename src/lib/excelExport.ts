import * as XLSX from 'xlsx';

export interface ExportExcelOptions {
  filename: string;
  title: string;
  headers: string[];
  data: (string | number | boolean | null | undefined)[][];
}

export function exportToExcel({
  filename,
  title,
  headers,
  data,
}: ExportExcelOptions) {
  // Format sheet content with header title, export timestamp, and data table
  const sheetData = [
    [title.toUpperCase()],
    [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`],
    [], // Empty line
    headers,
    ...data.map((row) =>
      row.map((val) => (val === null || val === undefined || val === '' ? '-' : val))
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Calculate dynamic column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    data.forEach((row) => {
      const cellVal = String(row[colIdx] ?? '');
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Export');

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}
