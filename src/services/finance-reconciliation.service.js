const prisma = require('../lib/prisma');
const financeProgramService = require('./finance-program.service');

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RECONCILIATION SERVICE (MATCHING) ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Auto-match bank transactions with internal transactions
 * Matching criteria:
 * 1. Same amount (exact match or with unique code)
 * 2. Same date (or within tolerance)
 * 3. Type: bank credit = internal IN
 */
const autoMatch = async (accountId, options = {}) => {
  const { dateTolerance = 1, autoCreate = false } = options; // dateTolerance in days

  // Get unmatched bank transactions (BOTH credit = IN AND debit = OUT)
  const bankTransactions = await prisma.financeBankImportDetail.findMany({
    where: {
      accountId,
      OR: [
        { credit: { not: null } },
        { debit: { not: null } },
      ],
      reconciliations: {
        none: {
          status: 'MATCHED',
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
  });

  // Get unmatched internal transactions (BOTH IN and OUT)
  const internalTransactions = await prisma.financeTransaction.findMany({
    where: {
      accountId,
      reconciliations: {
        none: {
          status: 'MATCHED',
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
  });

  const matches = [];
  const unmatched = [];

  for (const bankTx of bankTransactions) {
    // Determine direction & amount: credit = IN (pemasukan), debit = OUT (pengeluaran)
    const creditAmt = bankTx.credit != null ? Number(bankTx.credit) : 0;
    const debitAmt = bankTx.debit != null ? Number(bankTx.debit) : 0;
    const isCredit = creditAmt > 0;
    const bankAmount = isCredit ? creditAmt : debitAmt;
    const bankType = isCredit ? 'IN' : 'OUT';
    const bankDate = new Date(bankTx.transactionDate);

    // Find matching internal transaction with matching direction
    const match = internalTransactions.find((internalTx) => {
      if (internalTx.type !== bankType) return false;

      const internalAmount = Number(internalTx.amount);
      const internalDate = new Date(internalTx.transactionDate);

      // Check date tolerance
      const daysDiff = Math.abs((bankDate - internalDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > dateTolerance) return false;

      // Check amount (exact match or with unique code)
      if (internalAmount === bankAmount) return true;

      // Check with unique code (only relevant for IN with unique-code flow)
      if (internalTx.uniqueCode && internalTx.actualAmount) {
        return Number(internalTx.actualAmount) === bankAmount;
      }

      return false;
    });

    if (match) {
      matches.push({
        bankTransaction: bankTx,
        internalTransaction: match,
      });

      // Remove from available internal transactions
      const index = internalTransactions.indexOf(match);
      if (index > -1) {
        internalTransactions.splice(index, 1);
      }
    } else {
      unmatched.push(bankTx);
    }
  }

  // Create or update reconciliation records for matches
  const reconciliations = await Promise.all(
    matches.map(async ({ bankTransaction, internalTransaction }) => {
      const existingRecon = await prisma.financeReconciliation.findFirst({
        where: { bankImportDetailId: bankTransaction.id, status: { in: ['PENDING', 'UNMATCHED'] } },
      });

      if (existingRecon) {
        return prisma.financeReconciliation.update({
          where: { id: existingRecon.id },
          data: {
            transactionId: internalTransaction.id,
            status: 'MATCHED',
            matchedBy: 'AUTO',
            matchedAt: new Date(),
            notes: 'Auto-matched by system',
          },
          include: { transaction: true, bankImportDetail: true },
        });
      }

      return prisma.financeReconciliation.create({
        data: {
          transactionId: internalTransaction.id,
          bankImportDetailId: bankTransaction.id,
          status: 'MATCHED',
          matchedBy: 'AUTO',
          matchedAt: new Date(),
          notes: 'Auto-matched by system',
        },
      });
    })
  );

  // If autoCreate is enabled, create internal transactions for unmatched bank transactions
  let createdTransactions = [];
  if (autoCreate && unmatched.length > 0) {
    createdTransactions = await Promise.all(
      unmatched.map(async (bankTx) => {
        const creditAmt = bankTx.credit != null ? Number(bankTx.credit) : 0;
        const debitAmt = bankTx.debit != null ? Number(bankTx.debit) : 0;
        const isCredit = creditAmt > 0;
        const amount = isCredit ? creditAmt : debitAmt;
        const type = isCredit ? 'IN' : 'OUT';

        // Parse unique code (3-digit suffix) and map to program for both IN and OUT
        const parsed = await financeProgramService.parseAmountWithUniqueCode(amount);

        const transaction = await prisma.financeTransaction.create({
          data: {
            accountId,
            transactionDate: bankTx.transactionDate,
            Waktu: bankTx.waktu || (bankTx.transactionDate ? bankTx.transactionDate.toTimeString().slice(0,8) : null),
            type,
            amount,
            transactionCode: bankTx.transactionId,
            uniqueCode: parsed.uniqueCode,
            actualAmount: parsed.actualAmount,
            programType: parsed.program ? parsed.program.type : null,
            programId: parsed.program ? parsed.program.id : null,
            programName: parsed.program ? parsed.program.name : null,
            description: bankTx.description,
            notes: 'Auto-created from bank import',
            createdBy: 'SYSTEM',
          },
        });

        // Create reconciliation
        await prisma.financeReconciliation.create({
          data: {
            transactionId: transaction.id,
            bankImportDetailId: bankTx.id,
            status: 'MATCHED',
            matchedBy: 'AUTO',
            matchedAt: new Date(),
            notes: 'Auto-created and matched',
          },
        });

        return transaction;
      })
    );
  }

  return {
    totalBankTransactions: bankTransactions.length,
    matched: matches.length,
    unmatched: unmatched.length - createdTransactions.length,
    created: createdTransactions.length,
    reconciliations,
    createdTransactions,
  };
};

/**
 * Manual match: link a bank transaction with an internal transaction
 */
const manualMatch = async (bankImportDetailId, transactionId, userId = null) => {
  // Validate both exist
  const [bankTx, internalTx] = await Promise.all([
    prisma.financeBankImportDetail.findUnique({ where: { id: bankImportDetailId } }),
    prisma.financeTransaction.findUnique({ where: { id: transactionId } }),
  ]);

  if (!bankTx) {
    const err = new Error('Transaksi bank tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  if (!internalTx) {
    const err = new Error('Transaksi internal tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Check if already matched
  const existing = await prisma.financeReconciliation.findFirst({
    where: {
      OR: [
        { bankImportDetailId, status: 'MATCHED' },
        { transactionId, status: 'MATCHED' },
      ],
    },
  });

  if (existing) {
    const err = new Error('Salah satu transaksi sudah di-match.');
    err.statusCode = 400;
    throw err;
  }

  if (!internalTx.transactionCode && bankTx.transactionId) {
    // Cek apakah transactionCode sudah ada di transaksi lain
    const duplicate = await prisma.financeTransaction.findFirst({
      where: {
        transactionCode: bankTx.transactionId,
        id: { not: internalTx.id },
      },
    });
    if (duplicate) {
      const err = new Error('Kode transaksi sudah digunakan pada transaksi lain. Tidak boleh duplikat.');
      err.statusCode = 400;
      throw err;
    }
    await prisma.financeTransaction.update({
      where: { id: internalTx.id },
      data: { transactionCode: bankTx.transactionId },
    });
  }

  const existingRecon = await prisma.financeReconciliation.findFirst({
    where: { bankImportDetailId },
  });

  let reconciliation;
  if (existingRecon) {
    reconciliation = await prisma.financeReconciliation.update({
      where: { id: existingRecon.id },
      data: {
        transactionId,
        status: 'MATCHED',
        matchedBy: userId || 'MANUAL',
        matchedAt: new Date(),
        notes: 'Manually matched',
      },
      include: {
        transaction: true,
        bankImportDetail: true,
      },
    });
  } else {
    reconciliation = await prisma.financeReconciliation.create({
      data: {
        transactionId,
        bankImportDetailId,
        status: 'MATCHED',
        matchedBy: userId || 'MANUAL',
        matchedAt: new Date(),
        notes: 'Manually matched',
      },
      include: {
        transaction: true,
        bankImportDetail: true,
      },
    });
  }

  return reconciliation;

  return reconciliation;
};

/**
 * Unmatch a reconciliation
 */
const unmatch = async (reconciliationId, userId = null) => {
  const reconciliation = await prisma.financeReconciliation.findUnique({
    where: { id: reconciliationId },
  });

  if (!reconciliation) {
    const err = new Error('Rekonsiliasi tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Update status to PENDING
  return prisma.financeReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: 'PENDING',
      matchedBy: null,
      matchedAt: null,
      notes: `Unmatched by ${userId || 'user'} at ${new Date().toISOString()}`,
    },
  });
};

/**
 * Mark as unmatched (no pair found)
 */
const markAsUnmatched = async (bankImportDetailId, userId = null) => {
  const bankTx = await prisma.financeBankImportDetail.findUnique({
    where: { id: bankImportDetailId },
  });

  if (!bankTx) {
    const err = new Error('Transaksi bank tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Create reconciliation with UNMATCHED status
  const reconciliation = await prisma.financeReconciliation.create({
    data: {
      bankImportDetailId,
      status: 'UNMATCHED',
      matchedBy: userId || 'MANUAL',
      matchedAt: new Date(),
      notes: 'Marked as unmatched - no internal transaction found',
    },
  });

  return reconciliation;
};

/**
 * Get reconciliation summary
 */
const getSummary = async (accountId) => {
  // Get total bank transactions
  const totalBankTx = await prisma.financeBankImportDetail.count({
    where: { accountId },
  });

  // Get matched count
  const matched = await prisma.financeReconciliation.count({
    where: {
      status: 'MATCHED',
      bankImportDetail: { accountId },
    },
  });

  // Get unmatched count
  const unmatched = await prisma.financeReconciliation.count({
    where: {
      status: 'UNMATCHED',
      bankImportDetail: { accountId },
    },
  });

  // Get pending count
  const pending = totalBankTx - matched - unmatched;

  return {
    totalBankTransactions: totalBankTx,
    matched,
    unmatched,
    pending,
    matchRate: totalBankTx > 0 ? ((matched / totalBankTx) * 100).toFixed(2) : 0,
  };
};

/**
 * Get all reconciliations
 */
const getAllReconciliations = async ({
  page = 1,
  limit = 20,
  accountId,
  status,
} = {}) => {
  // Support special value 'all' (or numeric 0) to return all rows without pagination
  const wantAll = (String(limit).toLowerCase() === 'all' || Number(limit) === 0);
  const parsedLimit = wantAll ? undefined : Number(limit || 20);
  const skip = wantAll ? undefined : (Number(page) - 1) * Number(parsedLimit || 20);
  const where = {};

  if (status) where.status = status;
  if (accountId) {
    where.bankImportDetail = { accountId };
  }

  // Build base query args
  const findArgs = {
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      transaction: {
        include: {
          account: { select: { id: true, name: true } },
        },
      },
      bankImportDetail: {
        include: {
          account: { select: { id: true, name: true } },
        },
      },
    },
  };

  if (!wantAll) {
    findArgs.take = Number(parsedLimit);
    findArgs.skip = skip;
  }

  const [data, total] = await Promise.all([
    prisma.financeReconciliation.findMany(findArgs),
    prisma.financeReconciliation.count({ where }),
  ]);

  // Resolve matchedBy UUIDs to user display names (matchedBy can be 'AUTO', 'MANUAL', or a userId)
  const userIds = [
    ...new Set(
      data
        .map((r) => r.matchedBy)
        .filter((v) => v && v !== 'AUTO' && v !== 'MANUAL')
    ),
  ];
  let userMap = {};
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nama: true, username: true },
    });
    userMap = Object.fromEntries(users.map((u) => [u.id, u.nama || u.username]));
  }
  const dataWithUser = data.map((r) => ({
    ...r,
    matchedByName: r.matchedBy && userMap[r.matchedBy] ? userMap[r.matchedBy] : null,
  }));

  const metaLimit = wantAll ? 'all' : Number(limit);
  const totalPages = wantAll ? 1 : Math.ceil(total / Number(limit || parsedLimit || 20));

  return {
    data: dataWithUser,
    meta: { total, page: Number(page), limit: metaLimit, totalPages },
  };
};

/**
 * Get suggestions for matching
 * Find potential matches for a bank transaction
 */
const getSuggestions = async (bankImportDetailId) => {
  const bankTx = await prisma.financeBankImportDetail.findUnique({
    where: { id: bankImportDetailId },
  });

  if (!bankTx) {
    const err = new Error('Transaksi bank tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  const amount = Number(bankTx.credit || bankTx.debit);
  const date = new Date(bankTx.transactionDate);

  // Find internal transactions with similar amount and date
  const suggestions = await prisma.financeTransaction.findMany({
    where: {
      accountId: bankTx.accountId,
      transactionDate: {
        gte: new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before
        lte: new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after
      },
      amount: {
        gte: amount * 0.99, // Allow 1% variance
        lte: amount * 1.01,
      },
      reconciliations: {
        none: {
          status: 'MATCHED',
        },
      },
    },
    orderBy: { transactionDate: 'asc' },
    take: 10,
  });

  return suggestions;
};

/**
 * Assign / change program for a reconciliation row (UNMATCHED or PENDING).
 * If recon has no internal transaction yet, create one from the bank detail.
 * Always sets status to MATCHED on success.
 */
const assignProgram = async (reconciliationId, payload = {}, userId = null) => {
  const { programType, programId, description, notes } = payload;

  const recon = await prisma.financeReconciliation.findUnique({
    where: { id: reconciliationId },
    include: { bankImportDetail: true, transaction: true },
  });

  if (!recon) {
    const err = new Error('Rekonsiliasi tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Resolve program name
  let programName = null;
  if (programType && programId) {
    if (programType === 'INFAQ') {
      const p = await prisma.programDonasi.findUnique({ where: { id: programId } });
      if (!p) { const e = new Error('Program Infaq tidak ditemukan.'); e.statusCode = 404; throw e; }
      programName = p.kode ? `[${p.kode}] ${p.judul}` : p.judul;
    } else if (programType === 'WAKAF') {
      const p = await prisma.programWakaf.findUnique({ where: { id: programId } });
      if (!p) { const e = new Error('Program Wakaf tidak ditemukan.'); e.statusCode = 404; throw e; }
      programName = p.kode ? `[${p.kode}] ${p.kegiatan}` : p.kegiatan;
    } else {
      const e = new Error('programType tidak valid (INFAQ atau WAKAF).');
      e.statusCode = 400;
      throw e;
    }
  }

  // Case A: recon already has internal transaction → update its program fields
  if (recon.transactionId) {
    const updateData = {
      programType: programType || null,
      programId: programId || null,
      programName,
      description: description !== undefined ? description : undefined,
      notes: notes !== undefined ? notes : undefined,
    };

    if (!recon.transaction?.transactionCode && recon.bankImportDetail?.transactionId) {
      updateData.transactionCode = recon.bankImportDetail.transactionId;
    }

    await prisma.financeTransaction.update({
      where: { id: recon.transactionId },
      data: updateData,
    });

    return prisma.financeReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: 'MATCHED',
        matchedBy: userId || 'MANUAL',
        matchedAt: new Date(),
        notes: 'Program updated manually',
      },
      include: { transaction: true, bankImportDetail: true },
    });
  }

  // Case B: no internal transaction yet → must have a bank detail to create from
  if (!recon.bankImportDetail) {
    const e = new Error('Tidak ada data bank pada rekonsiliasi ini.');
    e.statusCode = 400;
    throw e;
  }

  const bankTx = recon.bankImportDetail;
  const creditAmt = bankTx.credit != null ? Number(bankTx.credit) : 0;
  const debitAmt = bankTx.debit != null ? Number(bankTx.debit) : 0;
  const isCredit = creditAmt > 0;
  const amount = isCredit ? creditAmt : debitAmt;
  const type = isCredit ? 'IN' : 'OUT';

  // CEK DUPLIKASI transactionCode
  const duplicate = await prisma.financeTransaction.findFirst({
    where: { transactionCode: bankTx.transactionId },
  });
  if (duplicate) {
    // Jangan buat transaksi, tetap di daftar rekonsiliasi
    const err = new Error('Kode transaksi sudah digunakan pada transaksi lain. Silakan cek daftar transaksi.');
    err.statusCode = 400;
    throw err;
  }

  const parsed = await financeProgramService.parseAmountWithUniqueCode(amount);

  const transaction = await prisma.financeTransaction.create({
    data: {
      accountId: bankTx.accountId,
      transactionDate: bankTx.transactionDate,
      Waktu: bankTx.waktu || (bankTx.transactionDate ? bankTx.transactionDate.toTimeString().slice(0,8) : null),
      type,
      amount,
      transactionCode: bankTx.transactionId,
      uniqueCode: parsed.uniqueCode,
      actualAmount: parsed.actualAmount,
      programType: programType || null,
      programId: programId || null,
      programName,
      description: description || bankTx.description || null,
      notes: notes || 'Manually assigned program from reconciliation',
      createdBy: userId ? String(userId) : 'MANUAL',
    },
  });

  return prisma.financeReconciliation.update({
    where: { id: reconciliationId },
    data: {
      transactionId: transaction.id,
      status: 'MATCHED',
      matchedBy: userId || 'MANUAL',
      matchedAt: new Date(),
      notes: 'Program assigned manually & transaction created',
    },
    include: { transaction: true, bankImportDetail: true },
  });
};

module.exports = {
  autoMatch,
  manualMatch,
  unmatch,
  markAsUnmatched,
  assignProgram,
  getSummary,
  getAllReconciliations,
  getSuggestions,
};
