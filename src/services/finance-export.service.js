// Mapping label divisi
const divisiLabelMap = {
  SOSIAL: 'Sosial',
  PENDIDIKAN: 'Pendidikan',
  USAHA: 'Usaha',
  MULTIMEDIA: 'Multimedia',
  OPERASIONAL: 'Operasional dan Dakwah',
  WAKAF: 'Wakaf',
};

const getDivisiLabel = (divisi, nama) => {
  if (nama) return nama;
  return divisiLabelMap[divisi] || divisi;
};
// Export all transactions as Excel
const generateTransactionsExcel = async (transactions) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MIAS - Masjid Imam Asy Syafi\'i';
  workbook.created = new Date();
  const ws = workbook.addWorksheet('Transaksi Keuangan');
  ws.columns = [
    { header: 'Tanggal', key: 'transactionDate', width: 14 },
    { header: 'Waktu', key: 'waktu', width: 10 },
    { header: 'Kode Transaksi', key: 'transactionCode', width: 18 },
    { header: 'Akun', key: 'account', width: 24 },
    { header: 'Tipe', key: 'type', width: 10 },
    { header: 'Jumlah', key: 'amount', width: 18 },
    { header: 'Program', key: 'programName', width: 24 },
    { header: 'Kategori', key: 'category', width: 18 },
    { header: 'Deskripsi', key: 'description', width: 40 },
  ];
  transactions.forEach((t) => {
    ws.addRow({
      transactionDate: formatDateShort(t.transactionDate),
      waktu: t.Waktu || t.waktu || '-',
      transactionCode: t.transactionCode || '-',
      account: t.account?.name || '-',
      type: t.type === 'IN' ? 'Masuk' : 'Keluar',
      amount: Number(t.amount) || 0,
      programName: t.programName || '-',
      category: t.category || '-',
      description: t.description || '-',
    });
  });
  ws.getColumn('E').numFmt = '"Rp" #,##0';
  return workbook.xlsx.writeBuffer();
};

// Export all transactions as PDF
const generateTransactionsPDF = (transactions) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).font('Helvetica-Bold').text('Transaksi Keuangan', { align: 'center' });
      doc.fontSize(10).fillColor('#666').text(`Dicetak: ${formatDateShort(new Date())}`, { align: 'center' });
      doc.fillColor('#000');
      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).strokeColor('#999').stroke();
      doc.moveDown(1);

      // Table
      drawTable(doc, {
        headers: ['Tanggal', 'Waktu', 'Kode', 'Akun', 'Tipe', 'Jumlah', 'Program', 'Kategori', 'Deskripsi'],
        widths: [60, 40, 100, 80, 35, 60, 120, 50, 150],
        align: ['left', 'center', 'left', 'left', 'center', 'right', 'left', 'left', 'left'],
        rows: transactions.map((t) => [
          formatDateShort(t.transactionDate),
          t.Waktu || t.waktu || '-',
          t.transactionCode || '-',
          t.account?.name || '-',
          t.type === 'IN' ? 'Masuk' : 'Keluar',
          formatCurrency(t.amount),
          t.programName || '-',
          t.category || '-',
          t.description || '-',
        ]),
      });

      // Footer
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i += 1) {
        doc.switchToPage(range.start + i);
        const bottom = doc.page.height - 30;
        doc.fontSize(8).fillColor('#888')
          .text(
            `Laporan dibuat oleh sistem MIAS  |  Halaman ${i + 1} dari ${range.count}`,
            40,
            bottom,
            { align: 'center', width: doc.page.width - 80 }
          );
        doc.fillColor('#000');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatCurrency = (n) => {
  const num = Number(n) || 0;
  return 'Rp ' + num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatDateShort = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const periodLabel = (year, month) => `${MONTH_NAMES[(month || 1) - 1]} ${year}`;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EXCEL ─────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const generateMonthlyReportExcel = async (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MIAS - Masjid Imam Asy Syafi\'i';
  workbook.created = new Date();

  const summary = report.summary || {};
  const period = periodLabel(report.year, report.month);

  // ─── Sheet 1: Ringkasan ──────────────────────────────────────────────────────
  const wsSummary = workbook.addWorksheet('Ringkasan');
  wsSummary.columns = [
    { width: 32 },
    { width: 28 },
  ];

  wsSummary.mergeCells('A1:B1');
  wsSummary.getCell('A1').value = 'LAPORAN KEUANGAN';
  wsSummary.getCell('A1').font = { size: 16, bold: true };
  wsSummary.getCell('A1').alignment = { horizontal: 'center' };

  wsSummary.mergeCells('A2:B2');
  wsSummary.getCell('A2').value = "Masjid Imam Asy Syafi'i - Depok";
  wsSummary.getCell('A2').alignment = { horizontal: 'center' };
  wsSummary.getCell('A2').font = { size: 11, italic: true };

  wsSummary.mergeCells('A3:B3');
  wsSummary.getCell('A3').value = `Periode: ${period}`;
  wsSummary.getCell('A3').alignment = { horizontal: 'center' };

  wsSummary.addRow([]);

  const summaryRows = [
    ['Saldo Awal', Number(summary.openingBalance) || 0],
    ['Total Pemasukan', Number(summary.totalIn) || 0],
    ['Total Pengeluaran', Number(summary.totalOut) || 0],
    ['Net Cashflow', Number(summary.netCashflow) || 0],
    ['Saldo Akhir', Number(summary.closingBalance) || 0],
    ['Jumlah Transaksi', Number(summary.totalTransactions) || 0],
    ['Transaksi Masuk', Number(summary.countIn) || 0],
    ['Transaksi Keluar', Number(summary.countOut) || 0],
  ];
  summaryRows.forEach((row, idx) => {
    const r = wsSummary.addRow(row);
    r.getCell(1).font = { bold: true };
    if (idx < 5) {
      r.getCell(2).numFmt = '"Rp" #,##0';
    }
    r.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      };
    });
  });

  // ─── Sheet 2: Mutasi Harian ──────────────────────────────────────────────────
  const wsDaily = workbook.addWorksheet('Mutasi Harian');
  wsDaily.columns = [
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Transaksi', key: 'count', width: 12 },
    { header: 'Pemasukan', key: 'totalIn', width: 18 },
    { header: 'Pengeluaran', key: 'totalOut', width: 18 },
    { header: 'Saldo Berjalan', key: 'balance', width: 20 },
  ];
  styleHeaderRow(wsDaily.getRow(1));

  (report.dailyData || []).forEach((d) => {
    wsDaily.addRow({
      date: formatDateShort(d.date),
      count: d.count,
      totalIn: Number(d.totalIn) || 0,
      totalOut: Number(d.totalOut) || 0,
      balance: Number(d.balance) || 0,
    });
  });
  ['C', 'D', 'E'].forEach((col) => {
    wsDaily.getColumn(col).numFmt = '"Rp" #,##0';
  });
  if ((report.dailyData || []).length) {
    const totalRow = wsDaily.addRow({
      date: 'TOTAL',
      count: summary.totalTransactions || 0,
      totalIn: Number(summary.totalIn) || 0,
      totalOut: Number(summary.totalOut) || 0,
      balance: Number(summary.closingBalance) || 0,
    });
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    });
  }

  // ─── Sheet 3: Per Akun ───────────────────────────────────────────────────────
  const wsAccount = workbook.addWorksheet('Per Akun');
  wsAccount.columns = [
    { header: 'Akun', key: 'accountName', width: 30 },
    { header: 'Tipe', key: 'accountType', width: 10 },
    { header: 'Transaksi', key: 'count', width: 12 },
    { header: 'Pemasukan', key: 'totalIn', width: 18 },
    { header: 'Pengeluaran', key: 'totalOut', width: 18 },
    { header: 'Selisih', key: 'balance', width: 18 },
  ];
  styleHeaderRow(wsAccount.getRow(1));
  (report.accountBreakdown || []).forEach((a) => {
    wsAccount.addRow({
      accountName: a.accountName,
      accountType: a.accountType === 'CASH' ? 'Kas' : 'Bank',
      count: a.count,
      totalIn: Number(a.totalIn) || 0,
      totalOut: Number(a.totalOut) || 0,
      balance: Number(a.balance) || 0,
    });
  });
  ['D', 'E', 'F'].forEach((col) => {
    wsAccount.getColumn(col).numFmt = '"Rp" #,##0';
  });

  // ─── Sheet 4: Per Divisi ─────────────────────────────────────────────────────
  const wsDivisi = workbook.addWorksheet('Per Divisi');
  wsDivisi.columns = [
    { header: 'Divisi', key: 'divisi', width: 18 },
    { header: 'Transaksi', key: 'count', width: 12 },
    { header: 'Pemasukan', key: 'totalIn', width: 18 },
    { header: 'Pengeluaran', key: 'totalOut', width: 18 },
    { header: 'Saldo Bersih', key: 'net', width: 18 },
  ];
  styleHeaderRow(wsDivisi.getRow(1));
  (report.divisiBreakdown || []).forEach((d) => {
    wsDivisi.addRow({
      divisi: d.divisi,
      count: d.count,
      totalIn: Number(d.totalIn) || 0,
      totalOut: Number(d.totalOut) || 0,
      net: (Number(d.totalIn) || 0) - (Number(d.totalOut) || 0),
    });
  });
  ['C', 'D', 'E'].forEach((col) => {
    wsDivisi.getColumn(col).numFmt = '"Rp" #,##0';
  });

  // ─── Sheet 5: Per Program ────────────────────────────────────────────────────
  const wsProgram = workbook.addWorksheet('Per Program');
  wsProgram.columns = [
    { header: 'Program', key: 'programName', width: 32 },
    { header: 'Nama Akun', key: 'accountName', width: 24 },
    { header: 'Tipe', key: 'programType', width: 12 },
    { header: 'Transaksi', key: 'count', width: 12 },
    { header: 'Pemasukan', key: 'totalIn', width: 18 },
    { header: 'Pengeluaran', key: 'totalOut', width: 18 },
    { header: 'Saldo Bersih', key: 'net', width: 18 },
  ];
  styleHeaderRow(wsProgram.getRow(1));
  (report.programBreakdown || []).forEach((p) => {
    wsProgram.addRow({
      programName: p.programName,
      accountName: p.accountName || '-',
      programType: p.programType,
      count: p.count,
      totalIn: Number(p.totalIn) || 0,
      totalOut: Number(p.totalOut) || 0,
      net: (Number(p.totalIn) || 0) - (Number(p.totalOut) || 0),
    });
  });
  ['D', 'E', 'F'].forEach((col) => {
    wsProgram.getColumn(col).numFmt = '"Rp" #,##0';
  });

  // ─── Sheet 6: Per Kategori ───────────────────────────────────────────────────
  const wsCategory = workbook.addWorksheet('Per Kategori');
  wsCategory.columns = [
    { header: 'Kategori', key: 'category', width: 30 },
    { header: 'Transaksi', key: 'count', width: 12 },
    { header: 'Pemasukan', key: 'totalIn', width: 18 },
    { header: 'Pengeluaran', key: 'totalOut', width: 18 },
  ];
  styleHeaderRow(wsCategory.getRow(1));
  (report.categoryBreakdown || []).forEach((c) => {
    wsCategory.addRow({
      category: c.category,
      count: c.count,
      totalIn: Number(c.totalIn) || 0,
      totalOut: Number(c.totalOut) || 0,
    });
  });
  ['C', 'D'].forEach((col) => {
    wsCategory.getColumn(col).numFmt = '"Rp" #,##0';
  });

  // ─── Sheet 7: Detail Transaksi ───────────────────────────────────────────────
  const wsTx = workbook.addWorksheet('Detail Transaksi');
  wsTx.columns = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Akun', key: 'account', width: 24 },
    { header: 'Tipe Akun', key: 'accountType', width: 12 },
    { header: 'Deskripsi', key: 'description', width: 40 },
    { header: 'Tipe', key: 'type', width: 10 },
    { header: 'Program', key: 'program', width: 24 },
    { header: 'Kategori', key: 'category', width: 18 },
    { header: 'Jumlah', key: 'amount', width: 18 },
  ];
  styleHeaderRow(wsTx.getRow(1));

  (report.transactions || []).forEach((t) => {
    wsTx.addRow({
      date: formatDateShort(t.transactionDate),
      account: t.account?.name || '-',
      accountType: t.account?.type === 'CASH' ? 'Kas' : (t.account?.type === 'BANK' ? 'Bank' : '-'),
      description: t.description || '-',
      type: t.type === 'IN' ? 'Masuk' : 'Keluar',
      program: t.programName ? `${t.programType} - ${t.programName}` : '-',
      category: t.category || '-',
      amount: Number(t.amount) || 0,
    });
  });
  wsTx.getColumn('H').numFmt = '"Rp" #,##0';

  return workbook.xlsx.writeBuffer();
};

const styleHeaderRow = (row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 22;
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PDF ───────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const generateMonthlyReportPDF = (report) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const summary = report.summary || {};
      const period = periodLabel(report.year, report.month);

      // ─── Header ───
      doc.fontSize(16).font('Helvetica-Bold').text('LAPORAN KEUANGAN', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text("Masjid Imam Asy Syafi'i - Depok", { align: 'center' });
      doc.fontSize(10).text(`Periode: ${period}`, { align: 'center' });
      doc.fontSize(9).fillColor('#666').text(`Dicetak: ${formatDateShort(new Date())}`, { align: 'center' });
      doc.fillColor('#000');
      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).strokeColor('#999').stroke();
      doc.moveDown(1);

      // ─── Ringkasan ───
      doc.fontSize(12).font('Helvetica-Bold').text('RINGKASAN');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      const summaryItems = [
        ['Saldo Awal', formatCurrency(summary.openingBalance)],
        ['Total Pemasukan', formatCurrency(summary.totalIn)],
        ['Total Pengeluaran', formatCurrency(summary.totalOut)],
        ['Net Cashflow', formatCurrency(summary.netCashflow)],
        ['Saldo Akhir', formatCurrency(summary.closingBalance)],
        ['Jumlah Transaksi', `${summary.totalTransactions || 0} (Masuk: ${summary.countIn || 0}, Keluar: ${summary.countOut || 0})`],
      ];
      summaryItems.forEach(([label, value]) => {
        doc.font('Helvetica').text(label, 50, doc.y, { continued: true, width: 200 });
        doc.font('Helvetica-Bold').text(`: ${value}`);
      });
      doc.moveDown(0.8);

      // ─── Mutasi Harian ───
      const dailyData = report.dailyData || [];
      if (dailyData.length) {
        ensureSpace(doc, 80);
        doc.fontSize(12).font('Helvetica-Bold').text('MUTASI HARIAN');
        doc.moveDown(0.3);
        drawTable(doc, {
          headers: ['Tanggal', 'Trx', 'Pemasukan', 'Pengeluaran', 'Saldo'],
          widths: [70, 40, 110, 110, 130],
          align: ['left', 'center', 'right', 'right', 'right'],
          rows: dailyData.map((d) => [
            formatDateShort(d.date),
            String(d.count || 0),
            formatCurrency(d.totalIn),
            formatCurrency(d.totalOut),
            formatCurrency(d.balance),
          ]),
          totalRow: [
            'TOTAL',
            String(summary.totalTransactions || 0),
            formatCurrency(summary.totalIn),
            formatCurrency(summary.totalOut),
            formatCurrency(summary.closingBalance),
          ],
        });
        doc.moveDown(0.8);
      }

      // ─── Per Akun ───
      const accountBreakdown = report.accountBreakdown || [];
      if (accountBreakdown.length) {
        ensureSpace(doc, 80);
        doc.fontSize(12).font('Helvetica-Bold').text('RINCIAN PER AKUN');
        doc.moveDown(0.3);
        drawTable(doc, {
          headers: ['Akun', 'Tipe', 'Trx', 'Pemasukan', 'Pengeluaran', 'Selisih'],
          widths: [120, 45, 35, 90, 90, 90],
          align: ['left', 'center', 'center', 'right', 'right', 'right'],
          rows: accountBreakdown.map((a) => [
            a.accountName,
            a.accountType === 'CASH' ? 'Kas' : 'Bank',
            String(a.count || 0),
            formatCurrency(a.totalIn),
            formatCurrency(a.totalOut),
            formatCurrency(a.balance),
          ]),
        });
        doc.moveDown(0.8);
      }

      // ─── Per Divisi ───
      const divisiBreakdown = (report.divisiBreakdown || []).filter((d) => d.count > 0);
      if (divisiBreakdown.length) {
        ensureSpace(doc, 80);
        doc.fontSize(12).font('Helvetica-Bold').text('RINCIAN PER DIVISI');
        doc.moveDown(0.3);
        drawTable(doc, {
          headers: ['Divisi', 'Trx', 'Pemasukan', 'Pengeluaran', 'Saldo Bersih'],
          widths: [110, 40, 110, 110, 100],
          align: ['left', 'center', 'right', 'right', 'right'],
          rows: divisiBreakdown.map((d) => [
            getDivisiLabel(d.divisi, d.divisiNama),
            String(d.count || 0),
            formatCurrency(d.totalIn),
            formatCurrency(d.totalOut),
            formatCurrency((Number(d.totalIn) || 0) - (Number(d.totalOut) || 0)),
          ]),
        });
        doc.moveDown(0.8);
      }

      // ─── Per Program ───
      const programBreakdown = report.programBreakdown || [];
      if (programBreakdown.length) {
        ensureSpace(doc, 80);
        doc.fontSize(12).font('Helvetica-Bold').text('RINCIAN PER PROGRAM');
        doc.moveDown(0.3);
        drawTable(doc, {
          headers: ['Program', 'Nama Akun', 'Tipe', 'Trx', 'Pemasukan', 'Pengeluaran'],
          widths: [150, 120, 50, 40, 90, 90],
          align: ['left', 'left', 'center', 'center', 'right', 'right'],
          rows: programBreakdown.map((p) => [
            p.programName,
            p.accountName || '-',
            p.programType,
            String(p.count || 0),
            formatCurrency(p.totalIn),
            formatCurrency(p.totalOut),
          ]),
        });
        doc.moveDown(0.8);
      }

      // ─── Per Kategori ───
      const categoryBreakdown = report.categoryBreakdown || [];
      if (categoryBreakdown.length) {
        ensureSpace(doc, 80);
        doc.fontSize(12).font('Helvetica-Bold').text('RINCIAN PER KATEGORI');
        doc.moveDown(0.3);
        drawTable(doc, {
          headers: ['Kategori', 'Trx', 'Pemasukan', 'Pengeluaran'],
          widths: [200, 50, 110, 110],
          align: ['left', 'center', 'right', 'right'],
          rows: categoryBreakdown.map((c) => [
            c.category,
            String(c.count || 0),
            formatCurrency(c.totalIn),
            formatCurrency(c.totalOut),
          ]),
        });
        doc.moveDown(0.8);
      }

      // ─── Detail Transaksi ───
      const transactions = report.transactions || [];
      if (transactions.length) {
        ensureSpace(doc, 80);
        doc.fontSize(12).font('Helvetica-Bold').text('DETAIL TRANSAKSI');
        doc.moveDown(0.3);
        drawTable(doc, {
          headers: ['Tgl', 'Akun', 'Deskripsi', 'Tipe', 'Jumlah'],
          widths: [60, 90, 200, 45, 110],
          align: ['left', 'left', 'left', 'center', 'right'],
          rows: transactions.map((t) => [
            formatDateShort(t.transactionDate),
            t.account?.name || '-',
            t.description || '-',
            t.type === 'IN' ? 'Masuk' : 'Keluar',
            formatCurrency(t.amount),
          ]),
        });
      }

      // ─── Footer di setiap halaman ───
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i += 1) {
        doc.switchToPage(range.start + i);
        const bottom = doc.page.height - 30;
        doc.fontSize(8).fillColor('#888')
          .text(
            `Laporan dibuat oleh sistem MIAS  |  Halaman ${i + 1} dari ${range.count}`,
            40,
            bottom,
            { align: 'center', width: doc.page.width - 80 }
          );
        doc.fillColor('#000');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ─── PDF helpers ───────────────────────────────────────────────────────────────

const ensureSpace = (doc, needed) => {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
  }
};

const drawTable = (doc, { headers, widths, align, rows, totalRow }) => {
  const startX = 40;
  let y = doc.y;
  const rowHeight = 18;

  const drawRow = (cells, isHeader = false, isTotal = false) => {
    if (y + rowHeight > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
      // Re-draw header on new page
      drawRow(headers, true);
    }
    let x = startX;
    if (isHeader) {
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowHeight)
        .fill('#1976D2');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
    } else if (isTotal) {
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowHeight)
        .fill('#F0F0F0');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(9);
    } else {
      doc.fillColor('#000').font('Helvetica').fontSize(9);
    }

    cells.forEach((cell, i) => {
      const w = widths[i];
      const text = String(cell ?? '');
      doc.text(text, x + 4, y + 5, {
        width: w - 8,
        align: align[i] || 'left',
        ellipsis: true,
        height: rowHeight - 4,
        lineBreak: false,
      });
      x += w;
    });

    // Borders
    doc.strokeColor('#CCCCCC').lineWidth(0.5);
    let bx = startX;
    doc.moveTo(startX, y + rowHeight).lineTo(startX + widths.reduce((a, b) => a + b, 0), y + rowHeight).stroke();
    widths.forEach((w) => {
      doc.moveTo(bx, y).lineTo(bx, y + rowHeight).stroke();
      bx += w;
    });
    doc.moveTo(bx, y).lineTo(bx, y + rowHeight).stroke();

    y += rowHeight;
    doc.y = y;
    doc.fillColor('#000');
  };

  // Header
  doc.strokeColor('#CCCCCC').lineWidth(0.5)
    .moveTo(startX, y).lineTo(startX + widths.reduce((a, b) => a + b, 0), y).stroke();
  drawRow(headers, true);

  rows.forEach((r) => drawRow(r));
  if (totalRow) drawRow(totalRow, false, true);
};

module.exports = {
  generateMonthlyReportExcel,
  generateMonthlyReportPDF,
  generateTransactionsExcel,
  generateTransactionsPDF,
};
