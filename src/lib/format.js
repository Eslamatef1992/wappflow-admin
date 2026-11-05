export const money = (v, cur = 'KWD') => `${(+v || 0).toLocaleString('en', { minimumFractionDigits: cur === 'KWD' ? 3 : 2, maximumFractionDigits: 3 })} ${cur}`;

export const num = (v) => (+v || 0).toLocaleString('en');

export const pct = (v) => `${Math.round((+v || 0) * 100)}%`;

export function date(ts, opts = {}) {
  if (!ts) return '—';
  return new Date(+ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...opts });
}

export function dateTime(ts) {
  if (!ts) return '—';
  return new Date(+ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function time(ts) {
  return ts ? new Date(+ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
}

export function ago(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - +ts) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return date(ts, { year: undefined });
}

export const phone = (wa) => (wa ? `+${wa}` : '');

export const initials = (name = '?') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

export function duration(ms) {
  if (ms == null) return '—';
  const m = Math.round(ms / 60000);
  if (m < 1) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Arabic text detection for right-to-left bubbles. */
export const isRtl = (t) => /[؀-ۿ]/.test(String(t || '').slice(0, 40));
