const prisma = require('../lib/prisma');

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PROGRAM MAPPING SERVICE (KODE UNIK) ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all programs (Infaq + Wakaf) for finance module
 * Returns a unified list with type indicator
 */
const getAllPrograms = async () => {
  const [infaqPrograms, wakafPrograms] = await Promise.all([
    prisma.programDonasi.findMany({
      where: { isActive: true },
      orderBy: { urutan: 'asc' },
    }),
    prisma.programWakaf.findMany({
      where: { isActive: true },
      orderBy: { urutan: 'asc' },
    }),
  ]);

  // Map to unified format
  const programs = [
    ...infaqPrograms.map((p) => ({
      id: p.id,
      type: 'INFAQ',
      code: p.kode,
      name: p.kode ? `[${p.kode}] ${p.judul}` : p.judul,
      divisi: p.divisi || null,
      description: p.deskripsi,
      target: Number(p.target),
      collected: Number(p.terkumpul),
    })),
    ...wakafPrograms.map((p) => ({
      id: p.id,
      type: 'WAKAF',
      code: p.kode,
      name: p.kode ? `[${p.kode}] ${p.kegiatan}` : p.kegiatan,
      divisi: p.divisi || 'WAKAF',
      description: p.deskripsi,
      target: Number(p.target),
      collected: Number(p.terkumpul),
    })),
  ];

  return programs;
};

/**
 * Find program by kode unik (3 digit code)
 * Returns program info if found
 */
const findProgramByUniqueCode = async (uniqueCode) => {
  if (uniqueCode === null || uniqueCode === undefined || uniqueCode < 0 || uniqueCode > 999) {
    return null;
  }

  // Convert to 3 digit string: 0 -> "000", 1 -> "001", 42 -> "042", 123 -> "123"
  const codeStr = String(uniqueCode).padStart(3, '0');

  // Search in program_donasi
  const infaqProgram = await prisma.programDonasi.findFirst({
    where: { kode: codeStr, isActive: true },
  });

  if (infaqProgram) {
    return {
      id: infaqProgram.id,
      type: 'INFAQ',
      code: infaqProgram.kode,
      name: infaqProgram.kode ? `[${infaqProgram.kode}] ${infaqProgram.judul}` : infaqProgram.judul,
      description: infaqProgram.deskripsi,
      target: Number(infaqProgram.target),
      collected: Number(infaqProgram.terkumpul),
    };
  }

  // Search in program_wakaf
  const wakafProgram = await prisma.programWakaf.findFirst({
    where: { kode: codeStr, isActive: true },
  });

  if (wakafProgram) {
    return {
      id: wakafProgram.id,
      type: 'WAKAF',
      code: wakafProgram.kode,
      name: wakafProgram.kode ? `[${wakafProgram.kode}] ${wakafProgram.kegiatan}` : wakafProgram.kegiatan,
      description: wakafProgram.deskripsi,
      target: Number(wakafProgram.target),
      collected: Number(wakafProgram.terkumpul),
    };
  }

  return null;
};

/**
 * Parse nominal with kode unik
 * Example: 500001 -> { amount: 500001, uniqueCode: 1, actualAmount: 500000, program: {...} }
 */
const parseAmountWithUniqueCode = async (amount) => {
  const amountNum = Number(amount);
  const amountStr = String(amountNum);

  // Extract last 3 digits
  const lastThreeDigits = parseInt(amountStr.slice(-3));

  // Check if it has a 3-digit suffix that may correspond to a kode unik
  if (lastThreeDigits >= 0 && lastThreeDigits <= 999) {
    const uniqueCode = lastThreeDigits;
    const actualAmount = amountNum - uniqueCode;

    // Find program by kode
    const program = await findProgramByUniqueCode(uniqueCode);
    const hasUniqueCode = program !== null;

    return {
      amount: amountNum,
      uniqueCode,
      actualAmount,
      program,
      hasUniqueCode,
    };
  }

  return {
    amount: amountNum,
    uniqueCode: null,
    actualAmount: amountNum,
    program: null,
    hasUniqueCode: false,
  };
};

/**
 * Map transaction to program automatically based on kode unik
 * This is called during transaction creation or bank import
 */
const mapTransactionToProgram = async (transaction) => {
  if (transaction.type !== 'IN' || !transaction.amount) {
    return transaction;
  }

  const parsed = await parseAmountWithUniqueCode(transaction.amount);

  if (parsed.hasUniqueCode && parsed.program) {
    return {
      ...transaction,
      uniqueCode: parsed.uniqueCode,
      actualAmount: parsed.actualAmount,
      programType: parsed.program.type,
      programId: parsed.program.id,
      programName: parsed.program.name,
    };
  }

  return transaction;
};

/**
 * Get program statistics (for reporting)
 */
const getProgramStatistics = async () => {
  const programs = await getAllPrograms();

  // Get transactions per program
  const stats = await Promise.all(
    programs.map(async (program) => {
      const transactions = await prisma.financeTransaction.findMany({
        where: {
          programType: program.type,
          programId: program.id,
        },
        select: { type: true, amount: true },
      });

      const totalIn = transactions
        .filter((t) => t.type === 'IN')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalOut = transactions
        .filter((t) => t.type === 'OUT')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        ...program,
        totalIn,
        totalOut,
        balance: totalIn - totalOut,
        transactionCount: transactions.length,
      };
    })
  );

  return stats;
};

/**
 * Update program collected amount from finance transactions
 * This should be called periodically or after transaction verification
 */
const syncProgramCollectedAmount = async (programType, programId) => {
  // Calculate total from finance_transactions
  const transactions = await prisma.financeTransaction.findMany({
    where: {
      programType,
      programId,
      type: 'IN',
    },
    select: { actualAmount: true, amount: true },
  });

  const totalCollected = transactions.reduce((sum, t) => {
    const amount = t.actualAmount ? Number(t.actualAmount) : Number(t.amount);
    return sum + amount;
  }, 0);

  // Update program
  if (programType === 'INFAQ') {
    await prisma.programDonasi.update({
      where: { id: programId },
      data: { terkumpul: totalCollected },
    });
  } else if (programType === 'WAKAF') {
    await prisma.programWakaf.update({
      where: { id: programId },
      data: { terkumpul: totalCollected },
    });
  }

  return totalCollected;
};

/**
 * Sync all programs collected amount
 */
const syncAllProgramsCollectedAmount = async () => {
  const programs = await getAllPrograms();

  const results = await Promise.all(
    programs.map((program) => syncProgramCollectedAmount(program.type, program.id))
  );

  return {
    totalPrograms: programs.length,
    synced: results.length,
  };
};

module.exports = {
  getAllPrograms,
  findProgramByUniqueCode,
  parseAmountWithUniqueCode,
  mapTransactionToProgram,
  getProgramStatistics,
  syncProgramCollectedAmount,
  syncAllProgramsCollectedAmount,
};
