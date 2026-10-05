const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Compress a PDF buffer using Ghostscript.
 * Falls back to the original buffer if gs is unavailable or produces a larger output.
 *
 * @param {Buffer} inputBuffer - Raw PDF bytes
 * @param {'screen'|'ebook'|'printer'|'prepress'} [quality='ebook']
 *   screen  ~72 dpi  — smallest file, suited for on-screen reading
 *   ebook   ~150 dpi — good balance of quality and size (default)
 *   printer ~300 dpi — near-print quality, less compression
 * @returns {Promise<Buffer>} Compressed (or original) PDF bytes
 */
async function compressPdfBuffer(inputBuffer, quality = 'ebook') {
  const tmpIn  = path.join(os.tmpdir(), `${uuidv4()}-in.pdf`);
  const tmpOut = path.join(os.tmpdir(), `${uuidv4()}-out.pdf`);

  fs.writeFileSync(tmpIn, inputBuffer);

  return new Promise((resolve) => {
    const cmd = [
      'gs',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=/${quality}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile="${tmpOut}"`,
      `"${tmpIn}"`,
    ].join(' ');

    exec(cmd, (err) => {
      try { fs.unlinkSync(tmpIn); } catch {}

      if (err || !fs.existsSync(tmpOut)) {
        // gs not installed or failed — return original unchanged
        try { fs.unlinkSync(tmpOut); } catch {}
        return resolve(inputBuffer);
      }

      const compressed = fs.readFileSync(tmpOut);
      try { fs.unlinkSync(tmpOut); } catch {}

      // Only use the compressed version if it is actually smaller
      resolve(compressed.length < inputBuffer.length ? compressed : inputBuffer);
    });
  });
}

module.exports = { compressPdfBuffer };
