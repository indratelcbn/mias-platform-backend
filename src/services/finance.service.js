const prisma = require('../lib/prisma');
const { Prisma } = require('@prisma/client');

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ACCOUNT MANAGEMENT ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all accounts with optional filtering
 */
const getAllAccounts = async ({ page = 1, limit = 100, type, isActive } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

  const [data, total] = await Promise.all([
    prisma.financeAccount.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.financeAccount.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get account by ID
 */
const getAccountById = async (id) => {
  const account = await prisma.financeAccount.findUnique({ where: { id } });
  if (!account) {
    const err = new Error('Akun tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return account;
};

const MONTH_ROMAN = [null, 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const generateTransactionCode = async (accountId, transactionDate) => {
  const date = new Date(transactionDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const romanMonth = MONTH_ROMAN[month] || String(month);
  const suffix = `/${romanMonth}/${year}`;

  const lastTransaction = await prisma.financeTransaction.findFirst({
    where: {
      accountId,
      transactionCode: { endsWith: suffix },
    },
    orderBy: { transactionCode: 'desc' },
    select: { transactionCode: true },
  });

  let nextSequence = 1;
  if (lastTransaction?.transactionCode) {
    const match = lastTransaction.transactionCode.match(/^(\d{1,3})\//);
    if (match) nextSequence = Number(match[1]) + 1;
  }

  return `${String(nextSequence).padStart(3, '0')}/${romanMonth}/${year}`;
};

/**
 * Create new account
 */
const createAccount = async (data) => {
  return prisma.financeAccount.create({
    data: {
      name: data.name,
      type: data.type,
      accountNumber: data.accountNumber || null,
      description: data.description || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
};

/**
 * Update account
 */
const updateAccount = async (id, data) => {
  await getAccountById(id); // Check if exists

  return prisma.financeAccount.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      accountNumber: data.accountNumber,
      description: data.description,
      isActive: data.isActive,
    },
  });
};

/**
 * Delete account (soft delete by setting isActive = false)
 */
const deleteAccount = async (id) => {
  await getAccountById(id); // Check if exists

  // Check if account has transactions
  const transactionCount = await prisma.financeTransaction.count({
    where: { accountId: id },
  });

  if (transactionCount > 0) {
    const err = new Error('Akun tidak dapat dihapus karena memiliki transaksi.');
    err.statusCode = 400;
    throw err;
  }

  return prisma.financeAccount.update({
    where: { id },
    data: { isActive: false },
  });
};

/**
 * Calculate balance for an account
 * CASH: dari transactions
 * BANK: dari bank_import_details (SOURCE OF TRUTH)
 */
const getAccountBalance = async (accountId) => {
  const account = await getAccountById(accountId);

  let balance = 0;

  if (account.type === 'CASH') {
    // Calculate from transactions
    const transactions = await prisma.financeTransaction.findMany({
      where: { accountId },
      select: { type: true, amount: true },
    });

    for (const t of transactions) {
      if (t.type === 'IN') {
        balance += Number(t.amount);
      } else {
        balance -= Number(t.amount);
      }
    }
  } else if (account.type === 'BANK') {
    // Get latest balance from bank import details
    const latestImport = await prisma.financeBankImportDetail.findFirst({
      where: { accountId },
      orderBy: { transactionDate: 'desc' },
      select: { balance: true },
    });

    if (latestImport) {
      balance = Number(latestImport.balance);
    }
  }

  return balance;
};

/**
 * Get all accounts with balance
 */
const getAllAccountsWithBalance = async () => {
  const accounts = await prisma.financeAccount.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const accountsWithBalance = await Promise.all(
    accounts.map(async (account) => {
      const balance = await getAccountBalance(account.id);
      return { ...account, balance };
    })
  );

  return accountsWithBalance;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TRANSACTION MANAGEMENT ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all transactions with filtering
 */
const getAllTransactions = async ({
  page = 1,
  limit = 20,
  accountId,
  type,
  programType,
  startDate,
  endDate,
  search,
} = {}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (accountId) where.accountId = accountId;
  if (type) where.type = type;
  if (programType) where.programType = programType;

  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = new Date(startDate);
    if (endDate) where.transactionDate.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { programName: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.financeTransaction.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { transactionDate: 'desc' },
      include: {
        account: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.financeTransaction.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get transaction by ID
 */
const getTransactionById = async (id) => {
  const transaction = await prisma.financeTransaction.findUnique({
    where: { id },
    include: {
      account: true,
    },
  });

  if (!transaction) {
    const err = new Error('Transaksi tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  return transaction;
};

/**
 * Create new transaction with kode unik handling
 */
const createTransaction = async (data) => {
  // Validate account exists
  const account = await getAccountById(data.accountId);

  // Parse kode unik if present
  let uniqueCode = null;
  let actualAmount = Number(data.amount);

  if (data.type === 'IN' && data.amount) {
    const amountStr = String(data.amount);
    const lastThreeDigits = parseInt(amountStr.slice(-3));

    // Check if last 3 digits are between 001-999 (kode unik pattern)
    if (lastThreeDigits >= 1 && lastThreeDigits <= 999) {
      uniqueCode = lastThreeDigits;
      actualAmount = Number(data.amount) - uniqueCode;
    }
  }

  let transactionCode = data.transactionCode || null;
  if (!transactionCode && account.type === 'CASH') {
    transactionCode = await generateTransactionCode(data.accountId, data.transactionDate);
  }

  const transaction = await prisma.financeTransaction.create({
    data: {
      accountId: data.accountId,
      transactionDate: new Date(data.transactionDate),
      type: data.type,
      amount: data.amount,
      transactionCode,
      uniqueCode,
      actualAmount: uniqueCode ? actualAmount : null,
      programType: data.programType || null,
      programId: data.programId || null,
      programName: data.programName || null,
      category: data.category || null,
      description: data.description || null,
      notes: data.notes || null,
      attachment: data.attachment || null,
      createdBy: data.createdBy || null,
    },
    include: {
      account: true,
    },
  });

  return transaction;
};

/**
 * Update transaction
 */
const updateTransaction = async (id, data) => {
  const existing = await getTransactionById(id); // Check if exists
  const account = await getAccountById(data.accountId || existing.accountId);

  // Recalculate kode unik if amount changed
  let uniqueCode = null;
  let actualAmount = null;

  if (data.type === 'IN' && data.amount) {
    const amountStr = String(data.amount);
    const lastThreeDigits = parseInt(amountStr.slice(-3));

    if (lastThreeDigits >= 1 && lastThreeDigits <= 999) {
      uniqueCode = lastThreeDigits;
      actualAmount = Number(data.amount) - uniqueCode;
    }
  }

  let transactionCode = data.transactionCode ?? existing.transactionCode ?? null;
  if (!transactionCode && account.type === 'CASH') {
    transactionCode = await generateTransactionCode(data.accountId || existing.accountId, data.transactionDate || existing.transactionDate);
  }

  return prisma.financeTransaction.update({
    where: { id },
    data: {
      accountId: data.accountId,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
      type: data.type,
      amount: data.amount,
      transactionCode,
      uniqueCode,
      actualAmount,
      programType: data.programType,
      programId: data.programId,
      programName: data.programName,
      category: data.category,
      description: data.description,
      notes: data.notes,
      attachment: data.attachment,
    },
    include: {
      account: true,
    },
  });
};

/**
 * Delete transaction
 */
const deleteTransaction = async (id) => {
  await getTransactionById(id); // Check if exists

  return prisma.financeTransaction.delete({
    where: { id },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD & REPORTS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get dashboard summary
 */
const getDashboardSummary = async ({ startDate, endDate } = {}) => {
  const where = {};

  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = new Date(startDate);
    if (endDate) where.transactionDate.lte = new Date(endDate);
  }

  // Get all accounts with balance
  const accountsWithBalance = await getAllAccountsWithBalance();

  // Calculate totals
  const totalCash = accountsWithBalance
    .filter((a) => a.type === 'CASH')
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalBank = accountsWithBalance
    .filter((a) => a.type === 'BANK')
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalBalance = totalCash + totalBank;

  // Get transaction summary
  const transactions = await prisma.financeTransaction.findMany({
    where,
    select: { type: true, amount: true },
  });

  const totalIn = transactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOut = transactions
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const cashflow = totalIn - totalOut;

  // ─── Saldo per Divisi ──────────────────────────────────────────────────────
  // Hitung saldo per divisi berdasarkan program yang terkait pada transaksi.
  const [activeDivisi, allInfaq, allWakaf] = await Promise.all([
    prisma.divisi.findMany({ where: { isActive: true }, orderBy: { urutan: 'asc' } }),
    prisma.programDonasi.findMany({
      select: { id: true, divisi: { select: { id: true, nama: true } } },
    }),
    prisma.programWakaf.findMany({
      select: { id: true, divisi: { select: { id: true, nama: true } } },
    }),
  ]);

  const programDivisiMap = {};
  for (const p of allInfaq) programDivisiMap[`INFAQ|${p.id}`] = p.divisi || null;
  for (const p of allWakaf) programDivisiMap[`WAKAF|${p.id}`] = p.divisi || null;

  const divisiTxs = await prisma.financeTransaction.findMany({
    where: { ...where, programId: { not: null }, programType: { not: null } },
    select: { type: true, amount: true, programId: true, programType: true },
  });

  const divisiAcc = {};
  for (const d of activeDivisi) {
    divisiAcc[d.id] = { divisi: d.id, divisiNama: d.nama, totalIn: 0, totalOut: 0, balance: 0 };
  }

  for (const t of divisiTxs) {
    const divisi = programDivisiMap[`${t.programType}|${t.programId}`];
    let divisiKey = null;
    if (divisi && typeof divisi === 'object') divisiKey = divisi.id;
    else if (typeof divisi === 'string') divisiKey = divisi;

    if (!divisiKey && t.programId === '000') {
      const operational = activeDivisi.find((d) => d.nama === 'Operasional dan Dakwah');
      divisiKey = operational?.id || null;
    }

    if (!divisiKey || !divisiAcc[divisiKey]) continue;
    if (t.type === 'IN') divisiAcc[divisiKey].totalIn += Number(t.amount);
    else divisiAcc[divisiKey].totalOut += Number(t.amount);
  }
  for (const key of Object.keys(divisiAcc)) {
    divisiAcc[key].balance = divisiAcc[key].totalIn - divisiAcc[key].totalOut;
  }
  const divisiBalances = Object.values(divisiAcc);

  return {
    totalBalance,
    totalCash,
    totalBank,
    totalIn,
    totalOut,
    cashflow,
    accounts: accountsWithBalance,
    divisiBalances,
  };
};

/**
 * Get fund tracking per program
 */
const getFundTracking = async () => {
  // Get all transactions grouped by program
  const transactions = await prisma.financeTransaction.findMany({
    where: {
      programType: { not: null },
      programId: { not: null },
    },
    select: {
      programType: true,
      programId: true,
      programName: true,
      type: true,
      amount: true,
    },
  });

  // Group by program
  const programMap = {};

  for (const t of transactions) {
    const key = `${t.programType}|${t.programId}`;
    
    if (!programMap[key]) {
      programMap[key] = {
        programType: t.programType,
        programId: t.programId,
        programName: t.programName,
        totalIn: 0,
        totalOut: 0,
        balance: 0,
      };
    }

    if (t.type === 'IN') {
      programMap[key].totalIn += Number(t.amount);
    } else {
      programMap[key].totalOut += Number(t.amount);
    }

    programMap[key].balance = programMap[key].totalIn - programMap[key].totalOut;
  }

  return Object.values(programMap);
};

/**
 * Get monthly report - comprehensive
 */
const getMonthlyReport = async ({ year, month, accountId } = {}) => {
  const currentYear = Number(year) || new Date().getFullYear();
  const currentMonth = Number(month) || new Date().getMonth() + 1;

  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const where = {
    transactionDate: { gte: startDate, lte: endDate },
  };
  if (accountId) where.accountId = accountId;

  const transactions = await prisma.financeTransaction.findMany({
    where,
    include: {
      account: { select: { id: true, name: true, type: true } },
    },
    orderBy: { transactionDate: 'asc' },
  });

  // ─── Summary ────────────────────────────────────────────────────────────────
  let totalIn = 0;
  let totalOut = 0;
  let countIn = 0;
  let countOut = 0;

  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.type === 'IN') {
      totalIn += amt;
      countIn += 1;
    } else {
      totalOut += amt;
      countOut += 1;
    }
  }

  // ─── Saldo Awal & Akhir ─────────────────────────────────────────────────────
  const prevTransactions = await prisma.financeTransaction.findMany({
    where: {
      transactionDate: { lt: startDate },
      ...(accountId ? { accountId } : {}),
    },
    select: { type: true, amount: true },
  });

  let openingBalance = 0;
  for (const t of prevTransactions) {
    if (t.type === 'IN') openingBalance += Number(t.amount);
    else openingBalance -= Number(t.amount);
  }
  const closingBalance = openingBalance + totalIn - totalOut;

  // ─── Daily Breakdown ────────────────────────────────────────────────────────
  const dailyData = {};
  for (const t of transactions) {
    const date = t.transactionDate.toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { date, totalIn: 0, totalOut: 0, balance: 0, count: 0 };
    }
    if (t.type === 'IN') dailyData[date].totalIn += Number(t.amount);
    else dailyData[date].totalOut += Number(t.amount);
    dailyData[date].count += 1;
  }

  const dailyArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  let runningBalance = openingBalance;
  for (const day of dailyArray) {
    runningBalance += day.totalIn - day.totalOut;
    day.balance = runningBalance;
  }

  // ─── Breakdown per Akun ────────────────────────────────────────────────────
  const accountMap = {};
  for (const t of transactions) {
    const key = t.accountId;
    if (!accountMap[key]) {
      accountMap[key] = {
        accountId: t.accountId,
        accountName: t.account?.name || 'Unknown',
        accountType: t.account?.type || 'CASH',
        totalIn: 0,
        totalOut: 0,
        balance: 0,
        count: 0,
      };
    }
    if (t.type === 'IN') accountMap[key].totalIn += Number(t.amount);
    else accountMap[key].totalOut += Number(t.amount);
    accountMap[key].count += 1;
  }
  const accountBreakdown = Object.values(accountMap).map((a) => ({
    ...a,
    balance: a.totalIn - a.totalOut,
  }));

  // ─── Breakdown per Kategori ────────────────────────────────────────────────
  const categoryMap = {};
  for (const t of transactions) {
    const key = t.category || 'Lainnya';
    if (!categoryMap[key]) {
      categoryMap[key] = { category: key, totalIn: 0, totalOut: 0, count: 0 };
    }
    if (t.type === 'IN') categoryMap[key].totalIn += Number(t.amount);
    else categoryMap[key].totalOut += Number(t.amount);
    categoryMap[key].count += 1;
  }
  const categoryBreakdown = Object.values(categoryMap);

  // ─── Breakdown per Program ─────────────────────────────────────────────────
  const normalizeProgramKey = (programType, programId, accountId) =>
    `${String(programType || '').trim().toUpperCase()}|${String(programId || '').trim()}|${String(accountId || '').trim()}`;

  const programMap = {};
  for (const t of transactions) {
    if (!t.programId) continue;
    const programType = String(t.programType || '').trim().toUpperCase();
    const programId = String(t.programId || '').trim();
    const accountId = String(t.accountId || '').trim();
    const key = normalizeProgramKey(programType, programId, accountId);
    if (!programMap[key]) {
      programMap[key] = {
        programType,
        programId,
        accountId,
        accountName: t.account?.name?.trim() || 'Unknown',
        programName: t.programName?.trim() || 'Unknown',
        totalIn: 0,
        totalOut: 0,
        count: 0,
      };
    }
    if (t.type === 'IN') programMap[key].totalIn += Number(t.amount);
    else programMap[key].totalOut += Number(t.amount);
    programMap[key].count += 1;
  }
  const programBreakdown = Object.values(programMap);

  // ─── Breakdown per Divisi ──────────────────────────────────────────────────
  const [activeDivisi, allInfaq, allWakaf] = await Promise.all([
    prisma.divisi.findMany({ where: { isActive: true }, orderBy: { urutan: 'asc' } }),
    prisma.programDonasi.findMany({ select: { id: true, divisi: { select: { id: true, nama: true } } } }),
    prisma.programWakaf.findMany({ select: { id: true, divisi: { select: { id: true, nama: true } } } }),
  ]);
  const programDivisiMap = {};

  for (const p of allInfaq) programDivisiMap[normalizeProgramKey('INFAQ', p.id)] = p.divisi || null;
  for (const p of allWakaf) programDivisiMap[normalizeProgramKey('WAKAF', p.id)] = p.divisi || null;

  const divisiAcc = {};
  for (const d of activeDivisi) divisiAcc[d.id] = { divisi: d.id, divisiNama: d.nama, totalIn: 0, totalOut: 0, count: 0 };
  for (const t of transactions) {
    if (!t.programId) continue;
    const divisi = programDivisiMap[normalizeProgramKey(t.programType, t.programId)];
    let divisiKey = null;
    if (divisi && typeof divisi === 'object') divisiKey = divisi.id;
    else if (typeof divisi === 'string') divisiKey = divisi;

    if (!divisiKey && t.programId === '000') {
      const operational = activeDivisi.find((d) => d.nama === 'Operasional dan Dakwah');
      divisiKey = operational?.id || null;
    }

    if (!divisiKey || !divisiAcc[divisiKey]) continue;
    if (t.type === 'IN') divisiAcc[divisiKey].totalIn += Number(t.amount);
    else divisiAcc[divisiKey].totalOut += Number(t.amount);
    divisiAcc[divisiKey].count += 1;
  }
  const divisiBreakdown = Object.values(divisiAcc);

  return {
    year: currentYear,
    month: currentMonth,
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary: {
      openingBalance,
      closingBalance,
      totalIn,
      totalOut,
      netCashflow: totalIn - totalOut,
      countIn,
      countOut,
      totalTransactions: transactions.length,
    },
    dailyData: dailyArray,
    accountBreakdown,
    categoryBreakdown,
    programBreakdown,
    divisiBreakdown,
    transactions,
  };
};

module.exports = {
  // Account
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  getAllAccountsWithBalance,

  // Transaction
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,

  // Dashboard & Reports
  getDashboardSummary,
  getFundTracking,
  getMonthlyReport,
};
