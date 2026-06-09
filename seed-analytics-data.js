// seed-analytics-data.js
// Script untuk generate sample visitor data untuk analytics dashboard
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const browsers = [
  { name: 'Chrome', version: '120.0' },
  { name: 'Firefox', version: '121.0' },
  { name: 'Safari', version: '17.2' },
  { name: 'Edge', version: '120.0' },
  { name: 'Opera', version: '106.0' },
];

const os = [
  { name: 'Windows', version: '10' },
  { name: 'Windows', version: '11' },
  { name: 'macOS', version: '14.2' },
  { name: 'Linux', version: 'Ubuntu 22.04' },
  { name: 'Android', version: '14' },
  { name: 'iOS', version: '17.2' },
];

const devices = [
  { type: 'desktop', name: 'Desktop' },
  { type: 'mobile', name: 'Mobile' },
  { type: 'tablet', name: 'Tablet' },
];

const pages = [
  '/',
  '/tentang',
  '/program/infaq',
  '/program/wakaf',
  '/artikel',
  '/kontak',
  '/donasi',
  '/galeri',
  '/kajian',
];

const referrers = [
  null, // Direct
  'https://google.com',
  'https://facebook.com',
  'https://instagram.com',
  'https://twitter.com',
  'https://wa.me',
];

const ips = [
  '103.127.96.10',
  '182.253.45.23',
  '202.67.43.12',
  '114.79.12.56',
  '36.72.89.34',
  '125.164.32.78',
];

const languages = ['id-ID', 'en-US', 'id', 'en'];

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedAnalyticsData() {
  console.log('🌱 Starting analytics data seeding...');

  const now = new Date();
  const logsToCreate = [];

  // Generate data untuk 30 hari terakhir
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);

    // Lebih banyak visitor di weekend
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseVisitors = isWeekend ? getRandomInt(80, 150) : getRandomInt(40, 100);

    console.log(`📅 Generating ${baseVisitors} visitors for ${date.toDateString()}`);

    for (let v = 0; v < baseVisitors; v++) {
      const sessionId = uuidv4();
      const browser = getRandomItem(browsers);
      const operatingSystem = getRandomItem(os);
      const device = getRandomItem(devices);
      const referrer = getRandomItem(referrers);
      const ip = getRandomItem(ips);
      const language = getRandomItem(languages);

      // Setiap visitor mengunjungi 1-5 halaman
      const pagesVisited = getRandomInt(1, 5);

      for (let p = 0; p < pagesVisited; p++) {
        const visitTime = new Date(date);
        visitTime.setHours(getRandomInt(0, 23), getRandomInt(0, 59), getRandomInt(0, 59));

        logsToCreate.push({
          id: uuidv4(),
          ipAddress: ip,
          pagePath: getRandomItem(pages),
          fullUrl: `https://masjid-ias.or.id${getRandomItem(pages)}`,
          browser: browser.name,
          browserVersion: browser.version,
          operatingSystem: operatingSystem.name,
          osVersion: operatingSystem.version,
          deviceType: device.type,
          deviceName: device.name,
          referrer: referrer,
          userAgent: `Mozilla/5.0 (${operatingSystem.name}) ${browser.name}/${browser.version}`,
          language: language,
          screenWidth: device.type === 'mobile' ? getRandomInt(360, 430) : getRandomInt(1280, 1920),
          screenHeight: device.type === 'mobile' ? getRandomInt(640, 932) : getRandomInt(720, 1080),
          sessionId: sessionId,
          createdAt: visitTime,
        });
      }
    }
  }

  console.log(`📊 Creating ${logsToCreate.length} visitor log entries...`);

  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < logsToCreate.length; i += batchSize) {
    const batch = logsToCreate.slice(i, i + batchSize);
    await prisma.visitorLog.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`   ✓ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(logsToCreate.length / batchSize)}`);
  }

  console.log('✅ Analytics data seeding completed!');
  console.log(`   Total visitor logs: ${logsToCreate.length}`);
  console.log(`   Date range: ${new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toDateString()} - ${now.toDateString()}`);
}

seedAnalyticsData()
  .catch((e) => {
    console.error('❌ Error seeding analytics data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
