const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const d1 = await prisma.$queryRawUnsafe("select column_name from information_schema.columns where table_name='program_donasi' and column_name='divisi_id'");
    const d2 = await prisma.$queryRawUnsafe("select column_name from information_schema.columns where table_name='program_wakaf' and column_name='divisi_id'");
    console.log('program_donasi', d1);
    console.log('program_wakaf', d2);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();