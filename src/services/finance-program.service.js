const prisma = require('../lib/prisma');

/**
 * Get operational fallback program (kode 000)
 * This is used when a transaction doesn't map to any specific program
 * Returns the "Infaq Operasional dan Dakwah" program (always kode '000')
 * 
 * @returns {Object} Program object with type INFAQ, code 000
 */
const getOperationalFallbackProgram = async () => {
  // Fetch actual program with kode '000' from database
  const operationalProgram = await prisma.programDonasi.findFirst({
    where: { kode: '000', isActive: true },
    include: { divisi: true },
  });

  if (operationalProgram) {
    return {
      id: operationalProgram.id,
      type: 'INFAQ',
      code: operationalProgram.kode,
      name: operationalProgram.kode ? `[${operationalProgram.kode}] ${operationalProgram.judul}` : operationalProgram.judul,
      divisi: operationalProgram.divisi?.id || null,
      divisiId: operationalProgram.divisi?.id || null,
      divisiNama: operationalProgram.divisi?.nama || null,
      description: operationalProgram.deskripsi,
      target: Number(operationalProgram.target),
      collected: Number(operationalProgram.terkumpul),
    };
  }

  // Fallback if kode 000 not found (shouldn't happen in normal operation)
  return {
    id: null,
    type: 'INFAQ',
    code: '000',
    name: '[000] Operasional dan Dakwah',
    divisi: null,
    divisiId: null,
    divisiNama: 'Operasional dan Dakwah',
    description: null,
    target: 0,
    collected: 0,
  };
};

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
      include: { divisi: true },
    }),
    prisma.programWakaf.findMany({
      where: { isActive: true },
      orderBy: { urutan: 'asc' },
      include: { divisi: true },
    }),
  ]);

  // Map to unified format
  const programs = [
    ...infaqPrograms.map((p) => ({
      id: p.id,
      type: 'INFAQ',
      code: p.kode,
      name: p.kode ? `[${p.kode}] ${p.judul}` : p.judul,
      divisi: p.divisi?.id || null,
      divisiId: p.divisi?.id || null,
      divisiNama: p.divisi?.nama || null,
      description: p.deskripsi,
      target: Number(p.target),
      collected: Number(p.terkumpul),
    })),
    ...wakafPrograms.map((p) => ({
      id: p.id,
      type: 'WAKAF',
      code: p.kode,
      name: p.kode ? `[${p.kode}] ${p.kegiatan}` : p.kegiatan,
      divisi: p.divisi?.id || null,
      divisiId: p.divisi?.id || null,
      divisiNama: p.divisi?.nama || null,
      description: p.deskripsi,
      target: Number(p.target),
      collected: Number(p.terkumpul),
    })),
  ];

  return programs;
};

/**
 * Find program by kode unik (3 digit code)
 * Searches both INFAQ (ProgramDonasi) and WAKAF (ProgramWakaf) with matching kode field.
 * Returns program info if found, null otherwise.
 * 
 * @param {number|null} uniqueCode - 3-digit unique code (0-999)
 * @returns {Object|null} Program object with type INFAQ or WAKAF, or null if not found
 */
const findProgramByUniqueCode = async (uniqueCode) => {
  if (uniqueCode === null || uniqueCode === undefined || uniqueCode < 0 || uniqueCode > 999) {
    return null;
  }

  // Convert to 3 digit string: 0 -> "000", 1 -> "001", 42 -> "042", 123 -> "123"
  const codeStr = String(uniqueCode).padStart(3, '0');

  // Search in program_donasi (INFAQ programs)
  const infaqProgram = await prisma.programDonasi.findFirst({
    where: { kode: codeStr, isActive: true },
    include: { divisi: true },
  });

  if (infaqProgram) {
    return {
      id: infaqProgram.id,
      type: 'INFAQ',
      code: infaqProgram.kode,
      name: infaqProgram.kode ? `[${infaqProgram.kode}] ${infaqProgram.judul}` : infaqProgram.judul,
      divisi: infaqProgram.divisi?.id || null,
      divisiId: infaqProgram.divisi?.id || null,
      divisiNama: infaqProgram.divisi?.nama || null,
      description: infaqProgram.deskripsi,
      target: Number(infaqProgram.target),
      collected: Number(infaqProgram.terkumpul),
    };
  }

  // Search in program_wakaf (WAKAF programs may also carry unique codes)
  const wakafProgram = await prisma.programWakaf.findFirst({
    where: { kode: codeStr, isActive: true },
    include: { divisi: true },
  });

  if (wakafProgram) {
    return {
      id: wakafProgram.id,
      type: 'WAKAF',
      code: wakafProgram.kode,
      name: wakafProgram.kode ? `[${wakafProgram.kode}] ${wakafProgram.kegiatan}` : wakafProgram.kegiatan,
      divisi: wakafProgram.divisi?.id || null,
      divisiId: wakafProgram.divisi?.id || null,
      divisiNama: wakafProgram.divisi?.nama || null,
      description: wakafProgram.deskripsi,
      target: Number(wakafProgram.target),
      collected: Number(wakafProgram.terkumpul),
    };
  }

  return null;
};

/**
 * Find program by code string or name snippet.
 * Searches both INFAQ (ProgramDonasi.judul) and WAKAF (ProgramWakaf.kegiatan) programs.
 * Accepts values like:
 * - Numeric: '000', '001', 42
 * - Formatted: '[000]', '[001]'
 * - INFAQ name: 'Operasional', 'Pendidikan', 'Kesehatan'
 * - WAKAF name: 'Pembangunan Musholla', 'Beasiswa'
 * 
 * @param {string|number|null} codeInput - Code or name to search
 * @returns {Object|null} Program object with type INFAQ or WAKAF, or null if not found
 */
const findProgramByCodeOrName = async (codeInput) => {
  if (!codeInput) return null;
  const raw = String(codeInput).trim();

  // Try exact kode match first (normalize to 3-digit if numeric)
  const digits = (raw.match(/(\d{1,3})/) || [null])[0];
  if (digits) {
    const codeStr = String(digits).padStart(3, '0');
    // Search in INFAQ programs (ProgramDonasi.judul)
    const infaqProgram = await prisma.programDonasi.findFirst({ where: { kode: codeStr, isActive: true }, include: { divisi: true } });
    if (infaqProgram) {
      return {
        id: infaqProgram.id,
        type: 'INFAQ',
        code: infaqProgram.kode,
        name: infaqProgram.kode ? `[${infaqProgram.kode}] ${infaqProgram.judul}` : infaqProgram.judul,
        divisi: infaqProgram.divisi?.id || null,
        divisiId: infaqProgram.divisi?.id || null,
        divisiNama: infaqProgram.divisi?.nama || null,
        description: infaqProgram.deskripsi,
        target: Number(infaqProgram.target),
        collected: Number(infaqProgram.terkumpul),
      };
    }
    // Search in WAKAF programs (ProgramWakaf.kegiatan)
    const wakafProgram = await prisma.programWakaf.findFirst({ where: { kode: codeStr, isActive: true }, include: { divisi: true } });
    if (wakafProgram) {
      return {
        id: wakafProgram.id,
        type: 'WAKAF',
        code: wakafProgram.kode,
        name: wakafProgram.kode ? `[${wakafProgram.kode}] ${wakafProgram.kegiatan}` : wakafProgram.kegiatan,
        divisi: wakafProgram.divisi?.id || null,
        divisiId: wakafProgram.divisi?.id || null,
        divisiNama: wakafProgram.divisi?.nama || null,
        description: wakafProgram.deskripsi,
        target: Number(wakafProgram.target),
        collected: Number(wakafProgram.terkumpul),
      };
    }
  }

  // If not numeric, try fuzzy search in judul/kegiatan
  const snippet = raw.replace(/\[|\]|"|'/g, '').trim();
  if (snippet.length > 0) {
    // Search in INFAQ (judul field)
    const infaqProgram = await prisma.programDonasi.findFirst({ where: { judul: { contains: snippet, mode: 'insensitive' }, isActive: true }, include: { divisi: true } });
    if (infaqProgram) {
      return {
        id: infaqProgram.id,
        type: 'INFAQ',
        code: infaqProgram.kode,
        name: infaqProgram.kode ? `[${infaqProgram.kode}] ${infaqProgram.judul}` : infaqProgram.judul,
        divisi: infaqProgram.divisi?.id || null,
        divisiId: infaqProgram.divisi?.id || null,
        divisiNama: infaqProgram.divisi?.nama || null,
        description: infaqProgram.deskripsi,
        target: Number(infaqProgram.target),
        collected: Number(infaqProgram.terkumpul),
      };
    }

    // Search in WAKAF (kegiatan field)
    const wakafProgram = await prisma.programWakaf.findFirst({ where: { kegiatan: { contains: snippet, mode: 'insensitive' }, isActive: true }, include: { divisi: true } });
    if (wakafProgram) {
      return {
        id: wakafProgram.id,
        type: 'WAKAF',
        code: wakafProgram.kode,
        name: wakafProgram.kode ? `[${wakafProgram.kode}] ${wakafProgram.kegiatan}` : wakafProgram.kegiatan,
        divisi: wakafProgram.divisi?.id || null,
        divisiId: wakafProgram.divisi?.id || null,
        divisiNama: wakafProgram.divisi?.nama || null,
        description: wakafProgram.deskripsi,
        target: Number(wakafProgram.target),
        collected: Number(wakafProgram.terkumpul),
      };
    }
  }

  return null;
};

/**
 * Parse nominal with kode unik
 * Example: 500001 -> { amount: 500001, uniqueCode: 1, actualAmount: 500000, program: {...} }
 * Supports both INFAQ (ProgramDonasi.judul) and WAKAF (ProgramWakaf.kegiatan) programs
 * 
 * Priority order:
 * 1. If code parameter provided and maps to existing program → use that program's code
 * 2. Otherwise, extract last 3 digits from amount (fallback)
 * 
 * @param {number|string} amount - Total amount to parse (may include unique code)
 * @param {string|null} code - Optional program code/name hint (e.g., '001', 'INFAQ Operasional', 'WAKAF Pembangunan')
 * @returns {Object} Parsed result with amount, uniqueCode, actualAmount, program, and hasUniqueCode flag
 */
const parseAmountWithUniqueCode = async (amount, code = null) => {
  const amountNum = Number(amount);
  const amountStr = String(amountNum);

  let uniqueCode = null;
  let programFromCode = null;
  
  // First, try to parse code parameter if provided
  // IMPORTANT: Only use extracted code if it maps to an actual program
  if (code !== null && code !== undefined && String(code).trim() !== '') {
    const raw = String(code).trim();
    // Try to find program by kode or name snippet in DB (works for both INFAQ and WAKAF)
    programFromCode = await findProgramByCodeOrName(raw);
    
    // Only set uniqueCode if we found a matching program
    if (programFromCode && programFromCode.code) {
      const parsedCode = parseInt(String(programFromCode.code).trim(), 10);
      if (!Number.isNaN(parsedCode) && parsedCode >= 0 && parsedCode <= 999) {
        uniqueCode = parsedCode;
      }
    }
    // IMPORTANT: If code doesn't map to a program, do NOT extract from code string
    // Instead, fall through to extract from amount (last 3 digits)
  }

  // If still no unique code, extract from last 3 digits of amount
  if (uniqueCode === null) {
    const lastThreeDigits = parseInt(amountStr.slice(-3), 10);
    if (!Number.isNaN(lastThreeDigits) && lastThreeDigits >= 0 && lastThreeDigits <= 999) {
      uniqueCode = lastThreeDigits;
    }
  }

  // If unique code found, lookup program and calculate actual amount
  if (uniqueCode !== null) {
    const actualAmount = amountNum - uniqueCode;

    // Prefer program resolved from provided code, else lookup by uniqueCode (checks both INFAQ and WAKAF)
    let program = programFromCode || await findProgramByUniqueCode(uniqueCode);
    const hasUniqueCode = true;

    // Fallback to operational program if no specific program found
    if (!program) {
      program = await getOperationalFallbackProgram();
    }

    return {
      amount: amountNum,
      uniqueCode,
      actualAmount,
      program,
      hasUniqueCode,
    };
  }

  // No unique code found
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

  const parsed = await parseAmountWithUniqueCode(transaction.amount, transaction.programCode || null);

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
  getOperationalFallbackProgram,
  getProgramStatistics,
  syncProgramCollectedAmount,
  syncAllProgramsCollectedAmount,
};
