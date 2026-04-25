import crypto from 'crypto';

/**
 * Generate a transaction reference ID like REF-TFR-20260425-A4F2C9
 * @param {'TFR'|'BIL'|'BAL'} type
 */
export function generateRefId(type = 'TFR') {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REF-${type}-${ymd}-${rand}`;
}

export function formatPKR(amount) {
  return 'PKR ' + Number(amount).toLocaleString('en-PK', { maximumFractionDigits: 0 });
}
