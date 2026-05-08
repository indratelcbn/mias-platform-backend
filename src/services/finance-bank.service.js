const prisma = require('../lib/prisma');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');
const financeProgramService = require('./finance-program.service');

// ═══════════════════════════════════════════════════════════════════════════════
// ─── BANK IMPORT & CSV PARSING SERVICE ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect CSV delimiter by inspecting the first non-empty line.
 * Supports comma, semicolon, and tab. Defaults to comma.
 */
const detectDelimiter = (sampleText) => {
  const firstLine = (sampleText.split(/\r?\n/).find((l) => l.trim().length > 0)) || '';
  const counts = {
    '\t': (firstLine.match(/\t/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length,
    ',': (firstLine.match(/,/g) || []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ',';
};

/**
 * Parse CSV file to array of objects.
 * Auto-detects delimiter (comma / semicolon / tab) unless explicitly provided.
 */
const parseCSV = async (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const csvOptions = { ...options };
    if (!csvOptions.separator) {
      try {
        const fd = fs.openSync(filePath, 'r');
        const buf = Buffer.alloc(4096);
        const bytes = fs.readSync(fd, buf, 0, 4096, 0);
        fs.closeSync(fd);
        csvOptions.separator = detectDelimiter(buf.slice(0, bytes).toString('utf8'));
      } catch (_e) {
        csvOptions.separator = ',';
      }
    }

    const results = [];
    const stream = fs.createReadStream(filePath);

    stream
      .pipe(csv(csvOptions))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Parse CSV from buffer (for direct upload).
 * Auto-detects delimiter unless explicitly provided.
 */
const parseCSVFromBuffer = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const text = buffer.toString();
    const csvOptions = { ...options };
    if (!csvOptions.separator) {
      csvOptions.separator = detectDelimiter(text);
    }

    const results = [];
    const stream = Readable.from(text);

    stream
      .pipe(csv(csvOptions))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Normalize bank CSV data to standard format
 * This function maps different bank formats to our standard format
 * 
 * Expected output format:
 * {
 *   transactionId: string,
 *   transactionDate: Date,
 *   description: string,
 *   debit: number | null,
 *   credit: number | null,
 *   balance: number
 * }
 */
const normalizeBankData = (row, bankFormat = 'STANDARD') => {
  let normalized = {};

  try {
    // Standard format (customizable)
    if (bankFormat === 'STANDARD') {
      normalized = {
        transactionId: row['Transaction ID'] || row['transaction_id'] || row['Nomor Referensi'] || '',
        transactionDate: parseDate(row['Date'] || row['Tanggal'] || row['transaction_date']),
        description: row['Description'] || row['Keterangan'] || row['description'] || '',
        debit: parseAmount(row['Debit'] || row['debit']),
        credit: parseAmount(row['Credit'] || row['Kredit'] || row['credit']),
        balance: parseAmount(row['Balance'] || row['Saldo'] || row['balance']),
      };
    }
    // BCA Format
    else if (bankFormat === 'BCA') {
      normalized = {
        transactionId: row['NOMOR REFERENSI'] || row['NO REFERENSI'] || '',
        transactionDate: parseDate(row['TANGGAL']),
        description: row['KETERANGAN'] || '',
        debit: parseAmount(row['MUTASI DEBET'] || row['DEBET']),
        credit: parseAmount(row['MUTASI KREDIT'] || row['KREDIT']),
        balance: parseAmount(row['SALDO']),
      };
    }
    // Mandiri Format
    else if (bankFormat === 'MANDIRI') {
      normalized = {
        transactionId: row['TXN ID'] || row['NO REFERENSI'] || '',
        transactionDate: parseDate(row['TGL TRANSAKSI']),
        description: row['KETERANGAN'] || '',
        debit: parseAmount(row['DEBET']),
        credit: parseAmount(row['KREDIT']),
        balance: parseAmount(row['SALDO']),
      };
    }
    // BNI Format
    else if (bankFormat === 'BNI') {
      normalized = {
        transactionId: row['REFERENCE'] || row['NO REFERENSI'] || '',
        transactionDate: parseDate(row['DATE'] || row['TANGGAL']),
        description: row['DESCRIPTION'] || row['KETERANGAN'] || '',
        debit: parseAmount(row['DEBIT']),
        credit: parseAmount(row['CREDIT'] || row['KREDIT']),
        balance: parseAmount(row['BALANCE'] || row['SALDO']),
      };
    }
    // BRI Format  
    else if (bankFormat === 'BRI') {
      normalized = {
        transactionId: row['NO REFERENSI'] || '',
        transactionDate: parseDate(row['TANGGAL']),
        description: row['KETERANGAN'] || '',
        debit: parseAmount(row['DEBIT']),
        credit: parseAmount(row['KREDIT']),
        balance: parseAmount(row['SALDO']),
      };
    }
    // BSI Format (Bank Syariah Indonesia)
    // Header (TAB-separated, ada kolom kosong ekstra):
    //   No, Waktu Transaksi, No.Referensi, , Nama Pengirim, , Bank Pengirim,
    //   Nama Penerima, Bank Penerima, Deskripsi, Debet, Kredit, Saldo Riil, Kode
    // "Waktu Transaksi" sering multi-baris dalam quotes: "01-12-2025\n00.15"
    else if (bankFormat === 'BSI') {
      // Lookup case-insensitive yang mengabaikan spasi & titik
      const norm = (s) => String(s || '').toLowerCase().replace(/[\s.]+/g, '');
      const lookup = {};
      for (const k of Object.keys(row)) {
        if (k) lookup[norm(k)] = row[k];
      }
      const get = (...names) => {
        for (const n of names) {
          const v = lookup[norm(n)];
          if (v !== undefined && v !== null && String(v).trim() !== '') return v;
        }
        return '';
      };

      // Tanggal bisa multi-baris: "01-12-2025\n00.15" → ganti newline jadi spasi
      const rawDate = String(get('Waktu Transaksi', 'Tanggal') || '')
        .replace(/[\r\n]+/g, ' ')
        .trim();

      normalized = {
        transactionId: String(
          get('No.Referensi', 'No Referensi', 'Nomor Referensi', 'Reference')
        ).trim(),
        transactionDate: parseDate(rawDate),
        description: String(get('Deskripsi', 'Keterangan', 'Description') || '')
          .replace(/[\r\n]+/g, ' ')
          .trim(),
        debit: parseAmount(get('Debet', 'Debit')),
        credit: parseAmount(get('Kredit', 'Credit')),
        balance: parseAmount(get('Saldo Riil', 'Saldo', 'Balance')),
      };
    }

    // Validate required fields
    if (!normalized.transactionId || !normalized.transactionDate || normalized.balance === null) {
      throw new Error('Invalid row format: missing required fields');
    }

    return normalized;
  } catch (error) {
    console.error('Error normalizing bank data:', error.message);
    return null;
  }
};

/**
 * Parse date from various formats
 * Supports: ISO, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY,
 *           and combined date+time like "DD-MM-YYYY HH.MM" / "DD-MM-YYYY HH:MM:SS"
 */
const parseDate = (dateStr) => {
  if (!dateStr) return null;

  const raw = String(dateStr).trim();

  // Try ISO format directly
  let date = new Date(raw);
  if (!isNaN(date.getTime())) return date;

  // Split off optional time portion (separated by space or 'T')
  const [datePart, timePart] = raw.split(/[\sT]+/);

  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = datePart.split(/[/\-.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    let hour = 0;
    let minute = 0;
    let second = 0;
    if (timePart) {
      // Time can use ':' or '.' as separator (BSI uses '.')
      const timeParts = timePart.split(/[:.]/);
      if (timeParts.length >= 2) {
        hour = parseInt(timeParts[0], 10) || 0;
        minute = parseInt(timeParts[1], 10) || 0;
        second = parseInt(timeParts[2], 10) || 0;
      }
    }

    date = new Date(year, month, day, hour, minute, second);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};

/**
 * Parse amount (handle various formats: 1,000.00 or 1.000,00)
 */
const parseAmount = (amountStr) => {
  if (!amountStr || amountStr === '' || amountStr === '-') return null;

  // Remove currency symbols and spaces
  let cleaned = String(amountStr).replace(/[Rp\s$€£]/g, '');

  // Handle Indonesian format (1.000.000,00)
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  // Handle standard format (1,000,000.00)
  else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
};

/**
 * Import bank CSV mutations
 * This is the main function to import bank statements
 */
const importBankCSV = async ({
  accountId,
  filePath,
  fileName,
  bankFormat = 'STANDARD',
  uploadedBy = null,
}) => {
  // Validate account
  const account = await prisma.financeAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    const err = new Error('Akun tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  if (account.type !== 'BANK') {
    const err = new Error('Import CSV hanya untuk akun BANK.');
    err.statusCode = 400;
    throw err;
  }

  // Parse CSV
  const rows = await parseCSV(filePath);
  const normalizedRows = rows.map((row) => normalizeBankData(row, bankFormat)).filter(Boolean);

  if (normalizedRows.length === 0) {
    const err = new Error('File CSV tidak memiliki data yang valid.');
    err.statusCode = 400;
    throw err;
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create import header
    const importHeader = await tx.financeBankImport.create({
      data: {
        accountId,
        fileName,
        uploadedBy,
        totalRows: normalizedRows.length,
        insertedRows: 0,
        skippedRows: 0,
      },
    });

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Insert each row (with duplicate check)
    for (const row of normalizedRows) {
      try {
        // Check if already exists
        const existing = await tx.financeBankImportDetail.findUnique({
          where: {
            transactionId_accountId: {
              transactionId: row.transactionId,
              accountId,
            },
          },
        });

        if (existing) {
          skippedCount++;
          continue; // Skip duplicate
        }

        // Insert new row
        await tx.financeBankImportDetail.create({
          data: {
            importId: importHeader.id,
            accountId,
            transactionId: row.transactionId,
            transactionDate: row.transactionDate,
            description: row.description,
            debit: row.debit,
            credit: row.credit,
            balance: row.balance,
          },
        });

        insertedCount++;
      } catch (error) {
        errors.push({ row, error: error.message });
        skippedCount++;
      }
    }

    // Update header with counts
    await tx.financeBankImport.update({
      where: { id: importHeader.id },
      data: {
        insertedRows: insertedCount,
        skippedRows: skippedCount,
      },
    });

    return {
      importId: importHeader.id,
      totalRows: normalizedRows.length,
      insertedRows: insertedCount,
      skippedRows: skippedCount,
      errors,
    };
  });

  return result;
};

/**
 * Get all bank imports
 */
const getAllBankImports = async ({ page = 1, limit = 20, accountId } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (accountId) where.accountId = accountId;

  const [data, total] = await Promise.all([
    prisma.financeBankImport.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { uploadedAt: 'desc' },
      include: {
        account: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.financeBankImport.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get bank import details
 */
const getBankImportDetails = async (importId, { page = 1, limit = 50 } = {}) => {
  const skip = (page - 1) * limit;

  const [details, total, header] = await Promise.all([
    prisma.financeBankImportDetail.findMany({
      where: { importId },
      skip,
      take: Number(limit),
      orderBy: { transactionDate: 'desc' },
    }),
    prisma.financeBankImportDetail.count({ where: { importId } }),
    prisma.financeBankImport.findUnique({
      where: { id: importId },
      include: { account: true },
    }),
  ]);

  if (!header) {
    const err = new Error('Import tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  return {
    header,
    details,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Delete bank import (cascade delete details)
 */
const deleteBankImport = async (importId) => {
  const importData = await prisma.financeBankImport.findUnique({ where: { id: importId } });

  if (!importData) {
    const err = new Error('Import tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Delete will cascade to details
  await prisma.financeBankImport.delete({ where: { id: importId } });

  return { success: true };
};

/**
 * Get unmatched bank transactions (for reconciliation)
 */
const getUnmatchedBankTransactions = async (accountId) => {
  // Get all bank import details that don't have a reconciliation match
  const unmatched = await prisma.financeBankImportDetail.findMany({
    where: {
      accountId,
      reconciliations: {
        none: {
          status: 'MATCHED',
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
    take: 100,
  });

  return unmatched;
};

module.exports = {
  parseCSV,
  parseCSVFromBuffer,
  normalizeBankData,
  parseDate,
  parseAmount,
  importBankCSV,
  getAllBankImports,
  getBankImportDetails,
  deleteBankImport,
  getUnmatchedBankTransactions,
};
