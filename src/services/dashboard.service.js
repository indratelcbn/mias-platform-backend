const prisma = require('../lib/prisma');

const getSummary = async ({ bulan, tahun } = {}) => {
  const now = new Date();
  const month = bulan ? Number(bulan) : now.getMonth() + 1;
  const year = tahun ? Number(tahun) : now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const [totalKajian, kajianBulanIni, totalArtikel, artikelBulanIni, donasiTotal, donasiVerified, donasiPending, upcomingKajian] = await Promise.all([
    prisma.kajian.count(),
    prisma.kajian.count({ where: { tanggal: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.artikel.count(),
    prisma.artikel.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.donasi.aggregate({ _sum: { jumlah: true } }),
    prisma.donasi.aggregate({ where: { status: 'VERIFIED' }, _sum: { jumlah: true } }),
    prisma.donasi.count({ where: { status: 'PENDING' } }),
    prisma.kajian.findMany({
      where: { isPublished: true, tanggal: { gte: now } },
      orderBy: { tanggal: 'asc' },
      take: 5,
    }),
  ]);

  return {
    totalKajian,
    kajianBulanIni,
    totalArtikel,
    artikelBulanIni,
    totalInfaq: donasiTotal._sum.jumlah || 0,
    terverifikasi: donasiVerified._sum.jumlah || 0,
    pendingKonfirmasi: donasiPending,
    upcomingKajian,
  };
};

module.exports = { getSummary };
