export function formatPKR(amount) {
  const n = Math.abs(Number(amount) || 0);
  return 'PKR ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const time = d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${d.getDate()} ${months[d.getMonth()]} · ${time}`;
}

export function formatDate(iso) {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/** mm:ss countdown for the session timer */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export const TXN_ICON = {
  credit:   '↘',
  transfer: '↗',
  bill:     '⚡',
  debit:    '−'
};
