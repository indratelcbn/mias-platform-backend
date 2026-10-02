const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Inject Arabic + Latin fonts via Google Fonts if not already present
const FONT_INJECT = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Amiri&family=Noto+Naskh+Arabic&family=Noto+Sans&display=swap" rel="stylesheet">`;

function injectFonts(html) {
  if (html.includes('fonts.googleapis.com')) return html;
  return html.replace('</head>', `${FONT_INJECT}\n</head>`);
}

async function saveMateriPdf(htmlBuffer) {
  // Dynamic import required — puppeteer v25+ is ESM-only
  const { default: puppeteer } = await import('puppeteer');

  const html = injectFonts(htmlBuffer.toString('utf8'));

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  let pdfBuffer;
  try {
    const page = await browser.newPage();
    // networkidle2 waits for fonts (Google Fonts) to finish loading
    await page.setContent(html, { waitUntil: 'networkidle2', timeout: 30000 });
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
    });
  } finally {
    await browser.close();
  }

  const dir = path.join(__dirname, '../../uploads/kajian_materi');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${uuidv4()}.pdf`;
  fs.writeFileSync(path.join(dir, filename), pdfBuffer);
  return filename;
}

module.exports = { saveMateriPdf };
