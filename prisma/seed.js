const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding database...');

  // ─── Hapus data lama ──────────────────────────────────────────────────────
  await prisma.pesan.deleteMany();
  await prisma.donasi.deleteMany();
  await prisma.artikel.deleteMany();
  await prisma.kajian.deleteMany();
  await prisma.rekening.deleteMany();
  await prisma.user.deleteMany();

  // ─── User Admin ───────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      nama: "Admin Masjid Imam Asy Syafi'i",
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ Admin user dibuat:', admin.username);

  // ─── Rekening Donasi ──────────────────────────────────────────────────────
  await prisma.rekening.createMany({
    data: [
      {
        namaBank: 'Bank Syariah Indonesia (BSI)',
        noRekening: '7012345678',
        atasNama: "DKM Masjid Imam Asy Syafi'i",
        keterangan: 'Rekening utama donasi',
      },
      {
        namaBank: 'Bank Muamalat',
        noRekening: '3012345678',
        atasNama: "DKM Masjid Imam Asy Syafi'i",
        keterangan: 'Rekening alternatif',
      },
    ],
  });
  console.log('✅ Data rekening dibuat');

  // ─── Kajian ───────────────────────────────────────────────────────────────
  await prisma.kajian.createMany({
    data: [
      {
        judul: 'Kajian Rutin Ahad Pagi: Tafsir Al-Quran',
        ustadz: 'Ust. Ahmad Fauzi, Lc.',
        tanggal: new Date('2026-04-06T07:00:00'),
        waktu: '07:00 - 09:00 WIB',
        lokasi: "Masjid Imam Asy Syafi'i, Depok",
        deskripsi: 'Kajian tafsir Al-Quran surat Al-Baqarah ayat 1-10. Terbuka untuk umum, jamaah putra dan putri.',
        isPublished: true,
        createdBy: admin.id,
      },
      {
        judul: 'Kajian Fiqih Shalat',
        ustadz: 'Ust. Hasan Basri, S.Ag.',
        tanggal: new Date('2026-04-13T19:30:00'),
        waktu: '19:30 - 21:00 WIB (setelah Isya)',
        lokasi: "Masjid Imam Asy Syafi'i, Depok",
        deskripsi: 'Kajian membahas tata cara shalat yang benar sesuai sunnah Nabi ﷺ.',
        isPublished: true,
        createdBy: admin.id,
      },
      {
        judul: 'Kajian Ramadhan: Keistimewaan Malam Lailatul Qadar',
        ustadz: 'Ust. Mahmud Ibrahim, M.Pd.',
        tanggal: new Date('2026-04-20T20:00:00'),
        waktu: '20:00 - 22:00 WIB',
        lokasi: "Masjid Imam Asy Syafi'i, Depok",
        deskripsi: 'Kajian spesial Ramadhan membahas keutamaan dan amalan di malam Lailatul Qadar.',
        isPublished: true,
        createdBy: admin.id,
      },
    ],
  });
  console.log('✅ Data kajian dibuat');

  // ─── Artikel ──────────────────────────────────────────────────────────────
  await prisma.artikel.createMany({
    data: [
      {
        judul: 'Keutamaan Shalat Berjamaah di Masjid',
        slug: 'keutamaan-shalat-berjamaah-di-masjid',
        konten: `<p>Shalat berjamaah merupakan salah satu syiar Islam yang sangat dianjurkan, terutama bagi kaum laki-laki...</p>
        <p>Rasulullah ﷺ bersabda: "Shalat berjamaah lebih utama daripada shalat sendirian sebanyak 27 derajat." (HR. Bukhari & Muslim)</p>
        <p>Oleh karena itu, marilah kita senantiasa memakmurkan masjid dengan mendirikan shalat berjamaah.</p>`,
        ringkasan: 'Shalat berjamaah memiliki keutamaan 27 derajat dibanding shalat sendirian. Mari makmurkan masjid!',
        isPublished: true,
        createdBy: admin.id,
      },
      {
        judul: 'Program Tahfizh Al-Quran untuk Anak',
        slug: 'program-tahfizh-al-quran-untuk-anak',
        konten: `<p>Alhamdulillah, Masjid Imam Asy Syafi'i Depok kembali membuka pendaftaran program Tahfizh Al-Quran untuk anak...</p>
        <p>Program ini ditujukan untuk anak usia 6-15 tahun yang ingin menghafal Al-Quran dengan metode yang menyenangkan.</p>
        <p>Pendaftaran dibuka setiap hari Sabtu-Ahad pukul 09:00-12:00 WIB.</p>`,
        ringkasan: "Program Tahfizh Al-Quran untuk anak 6-15 tahun dibuka kembali di Masjid Imam Asy Syafi'i Depok.",
        isPublished: true,
        createdBy: admin.id,
      },
      {
        judul: 'Pembangunan Lantai 2 Masjid: Laporan Perkembangan',
        slug: 'pembangunan-lantai-2-masjid-laporan-perkembangan',
        konten: `<p>Bismillahirrahmanirrahim. Alhamdulillah, pembangunan lantai 2 Masjid Imam Asy Syafi'i telah mencapai 60%...</p>
        <p>Kami mengucapkan terima kasih yang sebesar-besarnya kepada seluruh donatur yang telah berinfaq untuk pembangunan ini.</p>
        <p>Insya Allah pembangunan akan selesai pada bulan Ramadhan 1447 H.</p>`,
        ringkasan: "Update pembangunan lantai 2 Masjid Imam Asy Syafi'i Depok telah mencapai 60%.",
        isPublished: true,
        createdBy: admin.id,
      },
    ],
  });
  console.log('✅ Data artikel dibuat');

  console.log('\n🎉 Seeding selesai!');
  console.log('📌 Login: username=admin | password=admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
