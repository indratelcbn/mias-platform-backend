/**
 * In-memory login attempt limiter per username.
 * 3 failed attempts → 5-minute lockout.
 */

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 menit

// Map<username, { count: number, lockedUntil: number | null }>
const attempts = new Map();

function getAttempt(username) {
  const key = username.toLowerCase();
  if (!attempts.has(key)) {
    attempts.set(key, { count: 0, lockedUntil: null });
  }
  return attempts.get(key);
}

/**
 * Cek apakah username sedang di-lock.
 * @returns {{ locked: boolean, remainingMs: number }}
 */
function isLocked(username) {
  const entry = getAttempt(username);
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { locked: true, remainingMs: entry.lockedUntil - Date.now() };
  }
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    entry.count = 0;
    entry.lockedUntil = null;
  }
  return { locked: false, remainingMs: 0 };
}

/**
 * Catat gagal login. Jika sudah 3x → aktifkan lock 5 menit.
 * @returns {{ locked: boolean, attemptsLeft: number, remainingMs: number }}
 */
function recordFailure(username) {
  const entry = getAttempt(username);
  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    return { locked: true, attemptsLeft: 0, remainingMs: LOCKOUT_MS };
  }

  return { locked: false, attemptsLeft: MAX_ATTEMPTS - entry.count, remainingMs: 0 };
}

/**
 * Reset counter setelah login berhasil.
 */
function resetAttempts(username) {
  attempts.delete(username.toLowerCase());
}

module.exports = { isLocked, recordFailure, resetAttempts, MAX_ATTEMPTS, LOCKOUT_MS };
