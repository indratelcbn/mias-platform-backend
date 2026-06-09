const prisma = require('../lib/prisma');

const safe = (promise, fallback) => promise.catch(() => fallback);

const getSummary = async ({ bulan, tahun } = {}) => {
  const now = new Date();
  const month = bulan ? Number(bulan) : now.getMonth() + 1;
  const year = tahun ? Number(tahun) : now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const monthRange = { gte: startOfMonth, lte: endOfMonth };

  const [
    totalKajian,
    kajianBulanIni,
    kajianMendatang,
    totalArtikel,
    artikelPublished,
    artikelBulanIni,
    donasiTotalAll,
    donasiTotalBulan,
    donasiVerifiedAll,
    donasiVerifiedBulan,
    donasiPending,
    donasiCountBulan,
    programInfaqAktif,
    programWakafAktif,
    mustahikTotal,
    pesanBelumDibaca,
    pesanBelumDitindaklanjuti,
    galeriTotal,
    pemateriAktif,
    financeAccountsAktif,
    financeIn,
    financeOut,
    financeAllIn,
    financeAllOut,
    upcomingKajian,
    recentPesan,
    topPrograms,
  ] = await Promise.all([
    prisma.kajian.count(),
    prisma.kajian.count({ where: { tanggal: monthRange } }),
    prisma.kajian.count({ where: { isPublished: true, tanggal: { gte: now } } }),
    prisma.artikel.count(),
    prisma.artikel.count({ where: { isPublished: true } }),
    prisma.artikel.count({ where: { createdAt: monthRange } }),
    prisma.donasi.aggregate({ _sum: { jumlah: true } }),
    prisma.donasi.aggregate({ where: { createdAt: monthRange }, _sum: { jumlah: true } }),
    prisma.donasi.aggregate({ where: { status: 'VERIFIED' }, _sum: { jumlah: true } }),
    prisma.donasi.aggregate({ where: { status: 'VERIFIED', createdAt: monthRange }, _sum: { jumlah: true } }),
    prisma.donasi.count({ where: { status: 'PENDING' } }),
    prisma.donasi.count({ where: { createdAt: monthRange } }),
    safe(prisma.programDonasi.count({ where: { isActive: true } }), 0),
    safe(prisma.programWakaf.count({ where: { isActive: true } }), 0),
    safe(prisma.mustahik.count(), 0),
    safe(prisma.pesan.count({ where: { isRead: false } }), 0),
    safe(prisma.pesan.count({ where: { status: 'BELUM_DITINDAKLANJUTI' } }), 0),
    safe(prisma.galeri.count(), 0),
    safe(prisma.profilPemateri.count({ where: { isActive: true } }), 0),
    safe(prisma.financeAccount.count({ where: { isActive: true } }), 0),
    safe(
      prisma.financeTransaction.aggregate({
        where: { type: 'IN', transactionDate: monthRange },
        _sum: { amount: true },
        _count: true,
      }),
      { _sum: { amount: 0 }, _count: 0 }
    ),
    safe(
      prisma.financeTransaction.aggregate({
        where: { type: 'OUT', transactionDate: monthRange },
        _sum: { amount: true },
        _count: true,
      }),
      { _sum: { amount: 0 }, _count: 0 }
    ),
    safe(
      prisma.financeTransaction.aggregate({ where: { type: 'IN' }, _sum: { amount: true } }),
      { _sum: { amount: 0 } }
    ),
    safe(
      prisma.financeTransaction.aggregate({ where: { type: 'OUT' }, _sum: { amount: true } }),
      { _sum: { amount: 0 } }
    ),
    prisma.kajian.findMany({
      where: { isPublished: true, tanggal: { gte: now } },
      orderBy: { tanggal: 'asc' },
      take: 5,
      select: {
        id: true, judul: true, ustadz: true, tanggal: true, waktu: true, lokasi: true, thumbnail: true,
      },
    }),
    safe(
      prisma.pesan.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, nama: true, kategori: true, subjek: true, isRead: true, status: true, createdAt: true,
        },
      }),
      []
    ),
    safe(
      (async () => {
        const [infaqPrograms, wakafPrograms] = await Promise.all([
          prisma.programDonasi.findMany({
            where: { isActive: true },
            orderBy: { terkumpul: 'desc' },
            take: 3,
            select: { 
              id: true, 
              judul: true, 
              divisiId: true,
              target: true, 
              terkumpul: true,
              divisi: {
                select: { id: true, nama: true }
              }
            },
          }),
          prisma.programWakaf.findMany({
            where: { isActive: true },
            orderBy: { terkumpul: 'desc' },
            take: 2,
            select: { 
              id: true, 
              kegiatan: true, 
              divisiId: true,
              target: true, 
              terkumpul: true,
              divisi: {
                select: { id: true, nama: true }
              }
            },
          }),
        ]);

        const combined = [
          ...infaqPrograms.map(p => ({
            id: p.id,
            judul: p.judul,
            type: 'INFAQ',
            divisi: p.divisi?.nama || null,
            target: p.target,
            terkumpul: p.terkumpul,
          })),
          ...wakafPrograms.map(p => ({
            id: p.id,
            judul: p.kegiatan,
            type: 'WAKAF',
            divisi: p.divisi?.nama || null,
            target: p.target,
            terkumpul: p.terkumpul,
          })),
        ];

        // Sort by terkumpul desc and limit to 5
        return combined
          .sort((a, b) => (Number(b.terkumpul) || 0) - (Number(a.terkumpul) || 0))
          .slice(0, 5);
      })(),
      []
    ),
  ]);

  // ─── Tren donasi 6 bulan terakhir (verified) ────────────────────────────────
  const sixMonthsStart = new Date(year, month - 6, 1);
  const donasiTrenRows = await safe(
    prisma.donasi.findMany({
      where: { status: 'VERIFIED', createdAt: { gte: sixMonthsStart, lte: endOfMonth } },
      select: { jumlah: true, createdAt: true },
    }),
    []
  );
  const trenMap = {};
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(year, month - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trenMap[key] = { period: key, total: 0, count: 0 };
  }
  for (const row of donasiTrenRows) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (trenMap[key]) {
      trenMap[key].total += Number(row.jumlah || 0);
      trenMap[key].count += 1;
    }
  }
  const donasiTren = Object.values(trenMap);

  const totalSaldoFinance =
    (Number(financeAllIn._sum.amount) || 0) - (Number(financeAllOut._sum.amount) || 0);

  return {
    period: {
      month,
      year,
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    },

    totalKajian,
    kajianBulanIni,
    kajianMendatang,

    totalArtikel,
    artikelPublished,
    artikelBulanIni,

    totalInfaq: Number(donasiTotalAll._sum.jumlah) || 0,
    totalInfaqBulan: Number(donasiTotalBulan._sum.jumlah) || 0,
    terverifikasi: Number(donasiVerifiedAll._sum.jumlah) || 0,
    terverifikasiBulan: Number(donasiVerifiedBulan._sum.jumlah) || 0,
    pendingKonfirmasi: donasiPending,
    donasiCountBulan,

    programInfaqAktif,
    programWakafAktif,
    mustahikTotal,

    pesanBelumDibaca,
    pesanBelumDitindaklanjuti,

    galeriTotal,
    pemateriAktif,

    finance: {
      accountsAktif: financeAccountsAktif,
      totalSaldo: totalSaldoFinance,
      pemasukanBulan: Number(financeIn._sum.amount) || 0,
      pengeluaranBulan: Number(financeOut._sum.amount) || 0,
      countPemasukan: financeIn._count || 0,
      countPengeluaran: financeOut._count || 0,
      netCashflowBulan:
        (Number(financeIn._sum.amount) || 0) - (Number(financeOut._sum.amount) || 0),
    },

    upcomingKajian,
    recentPesan,
    topPrograms: topPrograms.map((p) => ({
      ...p,
      target: Number(p.target) || 0,
      terkumpul: Number(p.terkumpul) || 0,
      progress:
        Number(p.target) > 0
          ? Math.min(100, Math.round((Number(p.terkumpul) / Number(p.target)) * 100))
          : 0,
    })),

    donasiTren,
  };
};

module.exports = { getSummary };
