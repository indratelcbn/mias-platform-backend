const https = require('https');
const querystring = require('querystring');

// Agent khusus untuk menangani self-signed certificate di lingkungan proxy/corporate network
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Verifikasi Google reCAPTCHA v3 token ke server Google.
 * @param {string} token - Token dari klien
 * @returns {Promise<{success: boolean, score: number, action: string}>}
 */
const verifyRecaptcha = (token) => {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new Error('Token reCAPTCHA tidak ditemukan.'));
    }

    const postData = querystring.stringify({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    });

    const options = {
      hostname: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Gagal mem-parsing respons reCAPTCHA dari Google.'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

module.exports = { verifyRecaptcha };
