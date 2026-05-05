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

  // Get unmatched bank transactions (credit only = income)
  const bankTransactions = await prisma.financeBankImportDetail.findMany({
    where: {
      accountId,
      credit: { not: null },
      reconciliations: {
        none: {
          status: 'MATCHED',
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
  });

  // Get unmatched internal transactions
  const internalTransactions = await prisma.financeTransaction.findMany({
    where: {
      accountId,
      type: 'IN',
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
    const bankAmount = Number(bankTx.credit);
    const bankDate = new Date(bankTx.transactionDate);

    // Find matching internal transaction
    const match = internalTransactions.find((internalTx) => {
      const internalAmount = Number(internalTx.amount);
      const internalDate = new Date(internalTx.transactionDate);

      // Check date tolerance
      const daysDiff = Math.abs((bankDate - internalDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > dateTolerance) return false;

      // Check amount (exact match or with unique code)
      if (internalAmount === bankAmount) return true;

      // Check with unique code
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

  // Create reconciliation records for matches
  const reconciliations = await Promise.all(
    matches.map(async ({ bankTransaction, internalTransaction }) => {
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
        const amount = Number(bankTx.credit);

        // Try to parse unique code and map to program
        const parsed = await financeProgramService.parseAmountWithUniqueCode(amount);

        const transaction = await prisma.financeTransaction.create({
          data: {
            accountId,
            transactionDate: bankTx.transactionDate,
            type: 'IN',
            amount,
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

  // Create reconciliation
  const reconciliation = await prisma.financeReconciliation.create({
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
  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (accountId) {
    where.bankImportDetail = { accountId };
  }

  const [data, total] = await Promise.all([
    prisma.financeReconciliation.findMany({
      where,
      skip,
      take: Number(limit),
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
    }),
    prisma.financeReconciliation.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
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

module.exports = {
  autoMatch,
  manualMatch,
  unmatch,
  markAsUnmatched,
  getSummary,
  getAllReconciliations,
  getSuggestions,
};
