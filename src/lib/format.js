import { getLang } from './i18n.jsx';

// Arabic UI keeps Western digits (common in Gulf business software) but Arabic month names.
const loc = () => (getLang() === 'ar' ? 'ar-u-nu-latn' : 'en-GB');
const numLoc = () => (getLang() === 'ar' ? 'ar-u-nu-latn' : 'en');
const isAr = () => getLang() === 'ar';

const CUR_AR = { KWD: 'د.ك', SAR: 'ر.س', AED: 'د.إ', BHD: 'د.ب', QAR: 'ر.ق', OMR: 'ر.ع' };

export const money = (v, cur = 'KWD') => {
  const n = (+v || 0).toLocaleString(numLoc(), { minimumFractionDigits: ['KWD', 'BHD', 'OMR'].includes(cur) ? 3 : 2, maximumFractionDigits: 3 });
  return `${n} ${isAr() ? CUR_AR[cur] || cur : cur}`;
};

export const num = (v) => (+v || 0).toLocaleString(numLoc());

export const pct = (v) => `${Math.round((+v || 0) * 100)}%`;

export function date(ts, opts = {}) {
  if (!ts) return '—';
  return new Date(+ts).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric', ...opts });
}

export function dateTime(ts) {
  if (!ts) return '—';
  return new Date(+ts).toLocaleString(loc(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function time(ts) {
  return ts ? new Date(+ts).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' }) : '';
}

export function ago(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - +ts) / 1000);
  const ar = isAr();
  if (s < 60) return ar ? 'الآن' : 'now';
  if (s < 3600) return `${Math.floor(s / 60)}${ar ? ' د' : 'm'}`;
  if (s < 86400) return `${Math.floor(s / 3600)}${ar ? ' س' : 'h'}`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}${ar ? ' ي' : 'd'}`;
  return date(ts, { year: undefined });
}

export const phone = (wa) => (wa ? `+${wa}` : '');

export const initials = (name = '?') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

export function duration(ms) {
  if (ms == null) return '—';
  const ar = isAr();
  const m = Math.round(ms / 60000);
  if (m < 1) return `${Math.max(1, Math.round(ms / 1000))}${ar ? ' ث' : 's'}`;
  if (m < 60) return `${m} ${ar ? 'د' : 'min'}`;
  return ar ? `${Math.floor(m / 60)} س ${m % 60} د` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Arabic text detection for right-to-left bubbles. */
export const isRtl = (t) => /[؀-ۿ]/.test(String(t || '').slice(0, 40));
