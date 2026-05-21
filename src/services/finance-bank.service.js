const prisma = require('../lib/prisma');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');
const financeProgramService = require('./finance-program.service');
const crypto = require('crypto');

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

const normalizeField = (value) => {
  const normalized = String(value || '').trim();
  return normalized === '' ? null : normalized;
};

const extractLastThreeDigitsFromRaw = (raw) => {
  if (!raw) return null;
  // keep only digits
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  const last3 = digits.slice(-3);
  const parsed = parseInt(last3, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
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
        // preserve raw fields so we can extract trailing digits before numeric parsing
        const rawDebit = normalizeField(row['Debit'] || row['debit']);
        const rawCredit = normalizeField(row['Credit'] || row['Kredit'] || row['credit']);
        const programCodeRaw = normalizeField(row['Kode'] || row['kode'] || row['Code'] || row['code'] || '');

        const rawDateStr = row['Date'] || row['Tanggal'] || row['transaction_date'];
        const parsedDate = parseDate(rawDateStr);
        const waktu = parsedDate ? parsedDate.toTimeString().slice(0,8) : null;
        normalized = {
          transactionId: normalizeField(row['Transaction ID'] || row['transaction_id'] || row['Nomor Referensi'] || ''),
          transactionDate: parsedDate,
          waktu,
          description: row['Description'] || row['Keterangan'] || row['description'] || '',
          rawDebit,
          rawCredit,
          debit: parseAmount(rawDebit),
          credit: parseAmount(rawCredit),
          balance: parseAmount(row['Balance'] || row['Saldo'] || row['balance']),
          programCode: programCodeRaw,
          programCodeCandidate: programCodeRaw || extractLastThreeDigitsFromRaw(rawCredit || rawDebit),
        };
    }
    // BCA Format
    else if (bankFormat === 'BCA') {
      const rawDebit = normalizeField(row['MUTASI DEBET'] || row['DEBET']);
      const rawCredit = normalizeField(row['MUTASI KREDIT'] || row['KREDIT']);
      const programCodeRaw = normalizeField(row['Kode'] || row['kode'] || row['Code'] || row['code'] || '');

      const rawDateStr = row['TANGGAL'];
      const parsedDate = parseDate(rawDateStr);
      const waktu = parsedDate ? parsedDate.toTimeString().slice(0,8) : null;
      normalized = {
        transactionId: normalizeField(row['NOMOR REFERENSI'] || row['NO REFERENSI'] || ''),
        transactionDate: parsedDate,
        waktu,
        description: row['KETERANGAN'] || '',
        rawDebit,
        rawCredit,
        debit: parseAmount(rawDebit),
        credit: parseAmount(rawCredit),
        balance: parseAmount(row['SALDO']),
        programCode: programCodeRaw,
        programCodeCandidate: programCodeRaw || extractLastThreeDigitsFromRaw(rawCredit || rawDebit),
      };
    }
    // Mandiri Format
    else if (bankFormat === 'MANDIRI') {
      const rawDebit = normalizeField(row['DEBET']);
      const rawCredit = normalizeField(row['KREDIT']);
      const programCodeRaw = normalizeField(row['Kode'] || row['kode'] || row['Code'] || row['code'] || '');

      const rawDateStr = row['TGL TRANSAKSI'];
      const parsedDate = parseDate(rawDateStr);
      const waktu = parsedDate ? parsedDate.toTimeString().slice(0,8) : null;
      normalized = {
        transactionId: normalizeField(row['TXN ID'] || row['NO REFERENSI'] || ''),
        transactionDate: parsedDate,
        waktu,
        description: row['KETERANGAN'] || '',
        rawDebit,
        rawCredit,
        debit: parseAmount(rawDebit),
        credit: parseAmount(rawCredit),
        balance: parseAmount(row['SALDO']),
        programCode: programCodeRaw,
        programCodeCandidate: programCodeRaw || extractLastThreeDigitsFromRaw(rawCredit || rawDebit),
      };
    }
    // BNI Format
    else if (bankFormat === 'BNI') {
      const rawDebit = normalizeField(row['DEBIT']);
      const rawCredit = normalizeField(row['CREDIT'] || row['KREDIT']);
      const programCodeRaw = normalizeField(row['Kode'] || row['kode'] || row['Code'] || row['code'] || '');

      const rawDateStr = row['DATE'] || row['TANGGAL'];
      const parsedDate = parseDate(rawDateStr);
      const waktu = parsedDate ? parsedDate.toTimeString().slice(0,8) : null;
      normalized = {
        transactionId: normalizeField(row['REFERENCE'] || row['NO REFERENSI'] || ''),
        transactionDate: parsedDate,
        waktu,
        description: row['DESCRIPTION'] || row['KETERANGAN'] || '',
        rawDebit,
        rawCredit,
        debit: parseAmount(rawDebit),
        credit: parseAmount(rawCredit),
        balance: parseAmount(row['BALANCE'] || row['SALDO']),
        programCode: programCodeRaw,
        programCodeCandidate: programCodeRaw || extractLastThreeDigitsFromRaw(rawCredit || rawDebit),
      };
    }
    // BRI Format  
    else if (bankFormat === 'BRI') {
      const rawDebit = normalizeField(row['DEBIT']);
      const rawCredit = normalizeField(row['KREDIT']);
      const programCodeRaw = normalizeField(row['Kode'] || row['kode'] || row['Code'] || row['code'] || '');

      const rawDateStr = row['TANGGAL'];
      const parsedDate = parseDate(rawDateStr);
      const waktu = parsedDate ? parsedDate.toTimeString().slice(0,8) : null;
      normalized = {
        transactionId: row['NO REFERENSI'] || '',
        transactionDate: parsedDate,
        waktu,
        description: row['KETERANGAN'] || '',
        rawDebit,
        rawCredit,
        debit: parseAmount(rawDebit),
        credit: parseAmount(rawCredit),
        balance: parseAmount(row['SALDO']),
        programCode: programCodeRaw,
        programCodeCandidate: programCodeRaw || extractLastThreeDigitsFromRaw(rawCredit || rawDebit),
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

      const parsedDate = parseDate(rawDate);
      const waktu = parsedDate ? parsedDate.toTimeString().slice(0,8) : null;

      const rawDebit = normalizeField(get('Debet', 'Debit'));
      const rawCredit = normalizeField(get('Kredit', 'Credit'));
      const programCodeRaw = normalizeField(String(get('Kode', 'kode', 'Code', 'code') || ''));

      normalized = {
        transactionId: String(
          get('No.Referensi', 'No Referensi', 'Nomor Referensi', 'Reference')
        ).trim(),
        transactionDate: parsedDate,
        waktu,
        description: String(get('Deskripsi', 'Keterangan', 'Description') || '').trim(),
        rawDebit,
        rawCredit,
        debit: parseAmount(rawDebit),
        credit: parseAmount(rawCredit),
        balance: parseAmount(get('Saldo Riil', 'Saldo', 'Balance')),
        programCode: programCodeRaw,
        programCodeCandidate: programCodeRaw || extractLastThreeDigitsFromRaw(rawCredit || rawDebit),
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

  // Accept only explicit ISO-like input for direct Date parsing
  if (/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(raw)) {
    const date = new Date(raw);
    if (!isNaN(date.getTime())) return date;
  }

  const [datePart, timePart] = raw.split(/[\sT]+/);
  const parts = datePart.split(/[/\-.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
      return null;
    }

    let hour = 0;
    let minute = 0;
    let second = 0;
    if (timePart) {
      const timeParts = timePart.split(/[:.]/);
      if (timeParts.length >= 2) {
        hour = parseInt(timeParts[0], 10) || 0;
        minute = parseInt(timeParts[1], 10) || 0;
        second = parseInt(timeParts[2], 10) || 0;
      }
    }

    if (!timePart) {
      const utcNoon = new Date(Date.UTC(year, month, day, 12, 0, 0));
      if (!isNaN(utcNoon.getTime())) return utcNoon;
    }

    const date = new Date(year, month, day, hour, minute, second);
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

  // Create import header first so we can store counts later
  const importHeader = await prisma.financeBankImport.create({
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
      // Build a deterministic fingerprint for the row so we can reliably detect duplicates
      const descNorm = String(row.description || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const txDate = row.transactionDate ? new Date(row.transactionDate) : null;
      const txDateKey = txDate ? txDate.toISOString().slice(0, 19) : '';
      const debitVal = Number(row.debit || 0).toFixed(2);
      const creditVal = Number(row.credit || 0).toFixed(2);
      const balanceVal = Number(row.balance || 0).toFixed(2);
      const fingerprint = `${txDateKey}|${descNorm}|${debitVal}|${creditVal}|${balanceVal}|${row.transactionId || ''}`;
      const rowHash = crypto.createHash('md5').update(fingerprint).digest('hex');

      // Check duplicates by transactionId (if present) or by accountId+rowHash
      let existing = null;
      if (row.transactionId) {
        existing = await prisma.financeBankImportDetail.findUnique({
          where: { transactionId_accountId: { transactionId: row.transactionId, accountId } },
        });
      }

      if (!existing) {
        // try by hash
        existing = await prisma.financeBankImportDetail.findUnique({
          where: { accountId_rowHash: { accountId, rowHash } },
        }).catch(() => null);
      }

      if (existing) {
        skippedCount++;
        continue; // Skip duplicate
      }

      // Insert new row
      const isCredit = row.credit != null && Number(row.credit) > 0;
      const amount = isCredit ? Number(row.credit) : Number(row.debit || 0);
      // prefer explicit programCode, then candidate extracted from raw fields
      const programCodeToUse = row.programCode || row.programCodeCandidate || null;
      const parsed = await financeProgramService.parseAmountWithUniqueCode(amount, programCodeToUse);
      const fallbackProgram = await financeProgramService.getOperationalFallbackProgram();
      const program = parsed.program || fallbackProgram;
      if (program?.id === '000') {
        program.name = '[000] Operasional dan Dakwah';
      }

      const detail = await prisma.financeBankImportDetail.create({
        data: {
          importId: importHeader.id,
          accountId,
          transactionId: row.transactionId || null,
          transactionDate: row.transactionDate,
          description: row.description,
          debit: row.debit,
          credit: row.credit,
          balance: row.balance,
          programCode: row.programCodeCandidate || row.programCode || null,
          programType: program?.type || null,
          programId: program?.id || null,
          programName: program?.name || null,
          rowHash,
          divisiId: program?.divisiId || null,
          divisiNama: program?.divisiNama || null,
        },
      });

      await prisma.financeReconciliation.create({
        data: {
          bankImportDetailId: detail.id,
          status: 'PENDING',
          matchedBy: 'SYSTEM',
          matchedAt: null,
          notes: 'Imported and pending reconciliation',
        },
      });

      insertedCount++;
    } catch (error) {
      errors.push({ row, error: error.message });
      skippedCount++;
    }
  }

  // Update header with counts
  await prisma.financeBankImport.update({
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

  const importIds = data.map((row) => row.id);
  const pendingCounts = importIds.length > 0
    ? await prisma.financeReconciliation.findMany({
        where: {
          status: 'PENDING',
          bankImportDetail: { importId: { in: importIds } },
        },
        select: {
          bankImportDetail: { select: { importId: true } },
        },
      })
    : [];

  const countMap = pendingCounts.reduce((acc, recon) => {
    const importId = recon.bankImportDetail.importId;
    acc[importId] = (acc[importId] || 0) + 1;
    return acc;
  }, {});

  const enrichedData = data.map((row) => ({
    ...row,
    pendingCount: countMap[row.id] || 0,
  }));

  return {
    data: enrichedData,
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
const confirmBankImport = async (importId, userId = null) => {
  const importHeader = await prisma.financeBankImport.findUnique({
    where: { id: importId },
  });

  if (!importHeader) {
    const err = new Error('Import tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  const pendingRecons = await prisma.financeReconciliation.findMany({
    where: {
      bankImportDetail: {
        importId,
      },
      status: 'PENDING',
    },
    include: {
      bankImportDetail: true,
    },
  });

  if (!pendingRecons.length) {
    return { importId, processed: 0, created: 0 };
  }

  const results = [];
  const skipped = [];
  for (const recon of pendingRecons) {
    const bankTx = recon.bankImportDetail;
    if (!bankTx) continue;

    const creditAmt = bankTx.credit != null ? Number(bankTx.credit) : 0;
    const debitAmt = bankTx.debit != null ? Number(bankTx.debit) : 0;
    const isCredit = creditAmt > 0;
    const amount = isCredit ? creditAmt : debitAmt;
    const type = isCredit ? 'IN' : 'OUT';

    const parsed = await financeProgramService.parseAmountWithUniqueCode(amount, bankTx.programCode || null);
    const fallbackProgram = await financeProgramService.getOperationalFallbackProgram();
    const program = parsed.program || fallbackProgram;
    if (program?.id === '000') {
      program.name = '[000] Operasional dan Dakwah';
    }

    let transaction = await prisma.financeTransaction.findFirst({
      where: {
        accountId: bankTx.accountId,
        transactionCode: bankTx.transactionId,
      },
    });

    if (!transaction) {
      transaction = await prisma.financeTransaction.create({
        data: {
          accountId: bankTx.accountId,
          transactionDate: bankTx.transactionDate,
          type,
          amount,
          transactionCode: bankTx.transactionId,
          uniqueCode: isCredit ? parsed.uniqueCode : null,
          actualAmount: isCredit ? parsed.actualAmount : null,
          programType: bankTx.programType || program?.type || null,
          programId: bankTx.programId || program?.id || null,
          programName: bankTx.programName || program?.name || null,
          description: bankTx.description,
          notes: 'Created from confirmed bank import',
          createdBy: userId ? String(userId) : 'SYSTEM',
        },
      });
      await prisma.financeReconciliation.update({
        where: { id: recon.id },
        data: {
          transactionId: transaction.id,
          status: 'MATCHED',
          matchedBy: userId ? String(userId) : 'SYSTEM',
          matchedAt: new Date(),
          notes: 'Confirmed import and transaction created',
        },
      });
      results.push({ reconciliationId: recon.id, transactionId: transaction.id });
    } else {
      // Duplicate transactionCode, skip and record
      skipped.push({ reconciliationId: recon.id, transactionCode: bankTx.transactionId });
    }
  }

  return {
    importId,
    processed: pendingRecons.length,
    created: results.length,
    skippedCount: skipped.length,
    skippedTransactionCodes: skipped.map(s => s.transactionCode),
    skippedDetails: skipped, // for more detail if needed
  };
};

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
  confirmBankImport,
  getAllBankImports,
  getBankImportDetails,
  deleteBankImport,
  getUnmatchedBankTransactions,
};
