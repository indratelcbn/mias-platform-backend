const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─── Label maps ───────────────────────────────────────────────────────────────
const KATEGORI_LABEL = {
  YATIM: 'Yatim',
  JANDA: 'Janda',
  FAKIR: 'Fakir',
  MISKIN: 'Miskin',
  GHARIM: 'Gharim',
  FII_SABILILLAH: 'Fii Sabilillah',
  MUSAFIR: 'Musafir',
};
const BERHAK_LABEL = {
  PENERIMA_ZAKAT_MAL: 'Penerima Zakat Mal',
  PENERIMA_ZAKAT_FITRI: 'Penerima Zakat Fitri',
  PENERIMA_BANTUAN_MIAS: 'Penerima Bantuan MIAS',
  SEMUA: 'Semua',
};
const STATUS_LABEL = {
  JAMAAH: 'Jamaah',
  WARGA: 'Warga',
  WARGA_LUAR: 'Warga Luar',
};
const PRIORITAS_LABEL = {
  PRIORITAS_1: 'Prioritas 1',
  PRIORITAS_2: 'Prioritas 2',
  PRIORITAS_3: 'Prioritas 3',
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EXCEL ─────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const generateMustahikExcel = async (rows) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MIAS - Masjid Imam Asy Syafi'i";
  wb.created = new Date();

  const ws = wb.addWorksheet('Data Mustahik');

  // Title
  ws.mergeCells('A1:L1');
  ws.getCell('A1').value = 'DATA MUSTAHIK';
  ws.getCell('A1').font = { size: 16, bold: true };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:L2');
  ws.getCell('A2').value = "Masjid Imam Asy Syafi'i - Depok";
  ws.getCell('A2').alignment = { horizontal: 'center' };
  ws.getCell('A2').font = { size: 11, italic: true };

  ws.mergeCells('A3:L3');
  ws.getCell('A3').value = `Dicetak: ${formatDate(new Date())}  |  Total: ${rows.length} mustahik`;
  ws.getCell('A3').alignment = { horizontal: 'center' };
  ws.getCell('A3').font = { size: 10 };

  ws.addRow([]);

  // Header row (row 5)
  const headers = ['No', 'Nama', 'Alamat', 'RT', 'RW', 'Kab/Kota', 'Provinsi', 'Telepon', 'Kategori', 'Berhak', 'Status', 'Prioritas'];
  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  ws.columns = [
    { width: 5 }, { width: 28 }, { width: 36 }, { width: 6 }, { width: 6 },
    { width: 18 }, { width: 18 }, { width: 16 }, { width: 16 }, { width: 22 },
    { width: 14 }, { width: 14 },
  ];

  rows.forEach((m, idx) => {
    const r = ws.addRow([
      idx + 1,
      m.nama || '-',
      m.alamat || '-',
      m.rt || '-',
      m.rw || '-',
      m.kabKota || '-',
      m.provinsi || '-',
      m.telepon || '-',
      KATEGORI_LABEL[m.kategori] || m.kategori || '-',
      BERHAK_LABEL[m.berhak] || m.berhak || '-',
      m.status ? (STATUS_LABEL[m.status] || m.status) : '-',
      m.prioritas ? (PRIORITAS_LABEL[m.prioritas] || m.prioritas) : '-',
    ]);
    r.alignment = { vertical: 'middle' };
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(4).alignment = { horizontal: 'center' };
    r.getCell(5).alignment = { horizontal: 'center' };
    r.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      };
    });
  });

  // ─── Sheet 2: Ringkasan per Kategori ─────────────────────────────────────────
  const wsSummary = wb.addWorksheet('Ringkasan');
  wsSummary.columns = [{ width: 28 }, { width: 14 }];

  wsSummary.mergeCells('A1:B1');
  wsSummary.getCell('A1').value = 'RINGKASAN MUSTAHIK';
  wsSummary.getCell('A1').font = { size: 14, bold: true };
  wsSummary.getCell('A1').alignment = { horizontal: 'center' };
  wsSummary.addRow([]);

  const addSection = (title, counts) => {
    wsSummary.addRow([title, 'Jumlah']).eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
      c.alignment = { horizontal: 'center' };
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    Object.entries(counts).forEach(([k, v]) => {
      const r = wsSummary.addRow([k, v]);
      r.eachCell((c) => {
        c.border = { top: { style: 'thin', color: { argb: 'FFDDDDDD' } }, bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } } };
      });
      r.getCell(2).alignment = { horizontal: 'center' };
    });
    wsSummary.addRow([]);
  };

  const groupCount = (key, labelMap) => {
    const out = {};
    for (const m of rows) {
      const v = m[key];
      if (!v) continue;
      const label = labelMap[v] || v;
      out[label] = (out[label] || 0) + 1;
    }
    return out;
  };

  addSection('Kategori', groupCount('kategori', KATEGORI_LABEL));
  addSection('Hak Penerima', groupCount('berhak', BERHAK_LABEL));
  addSection('Status', groupCount('status', STATUS_LABEL));
  addSection('Prioritas', groupCount('prioritas', PRIORITAS_LABEL));

  return wb.xlsx.writeBuffer();
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PDF ───────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const generateMustahikPDF = (rows) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ─── Header ───
      doc.fontSize(15).font('Helvetica-Bold').text('DATA MUSTAHIK', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text("Masjid Imam Asy Syafi'i - Depok", { align: 'center' });
      doc.fontSize(9).fillColor('#666')
        .text(`Dicetak: ${formatDate(new Date())}  |  Total: ${rows.length} mustahik`, { align: 'center' });
      doc.fillColor('#000');
      doc.moveDown(0.5);

      // ─── Table ───
      const headers = ['No', 'Nama', 'Alamat', 'RT/RW', 'Telepon', 'Kategori', 'Berhak', 'Status', 'Prio'];
      const widths = [25, 110, 160, 45, 75, 75, 110, 60, 50];
      const align  = ['center', 'left', 'left', 'center', 'left', 'left', 'left', 'left', 'center'];
      const startX = 30;
      const rowHeight = 18;

      const drawHeader = () => {
        const totalW = widths.reduce((a, b) => a + b, 0);
        const y = doc.y;
        doc.rect(startX, y, totalW, rowHeight).fill('#1976D2');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
        let x = startX;
        headers.forEach((h, i) => {
          doc.text(h, x + 4, y + 5, { width: widths[i] - 8, align: align[i], lineBreak: false });
          x += widths[i];
        });
        doc.fillColor('#000');
        doc.y = y + rowHeight;
      };

      drawHeader();

      doc.font('Helvetica').fontSize(8.5);

      rows.forEach((m, idx) => {
        if (doc.y + rowHeight > doc.page.height - 50) {
          doc.addPage();
          drawHeader();
          doc.font('Helvetica').fontSize(8.5);
        }
        const y = doc.y;
        const totalW = widths.reduce((a, b) => a + b, 0);
        if (idx % 2 === 1) {
          doc.rect(startX, y, totalW, rowHeight).fill('#F7F9FC');
          doc.fillColor('#000');
        }

        const cells = [
          String(idx + 1),
          m.nama || '-',
          m.alamat || '-',
          `${m.rt || '-'}/${m.rw || '-'}`,
          m.telepon || '-',
          KATEGORI_LABEL[m.kategori] || m.kategori || '-',
          BERHAK_LABEL[m.berhak] || m.berhak || '-',
          m.status ? (STATUS_LABEL[m.status] || m.status) : '-',
          m.prioritas ? m.prioritas.replace('PRIORITAS_', 'P') : '-',
        ];

        let x = startX;
        cells.forEach((c, i) => {
          doc.text(String(c), x + 4, y + 5, {
            width: widths[i] - 8,
            align: align[i],
            ellipsis: true,
            height: rowHeight - 4,
            lineBreak: false,
          });
          x += widths[i];
        });

        // Borders
        doc.strokeColor('#DDDDDD').lineWidth(0.4);
        doc.moveTo(startX, y + rowHeight).lineTo(startX + totalW, y + rowHeight).stroke();
        let bx = startX;
        widths.forEach((w) => {
          doc.moveTo(bx, y).lineTo(bx, y + rowHeight).stroke();
          bx += w;
        });
        doc.moveTo(bx, y).lineTo(bx, y + rowHeight).stroke();

        doc.y = y + rowHeight;
      });

      // ─── Footer ───
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i += 1) {
        doc.switchToPage(range.start + i);
        doc.fontSize(8).fillColor('#888').text(
          `Halaman ${i + 1} dari ${range.count}  |  Dicetak otomatis oleh sistem MIAS`,
          30, doc.page.height - 25,
          { align: 'center', width: doc.page.width - 60 }
        );
        doc.fillColor('#000');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateMustahikExcel,
  generateMustahikPDF,
};
