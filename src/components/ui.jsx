import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

// ---------- buttons ----------
const variants = {
  primary: 'bg-signal text-white hover:bg-signal-deep border-transparent',
  dark: 'bg-ink text-white hover:bg-ink-2 border-transparent',
  secondary: 'bg-white text-ink border-line hover:border-ink-3',
  ghost: 'bg-transparent text-ink-3 hover:text-ink hover:bg-black/5 border-transparent',
  danger: 'bg-white text-danger border-line hover:border-danger',
};
export function Button({ variant = 'secondary', size = 'md', icon, loading, className, children, ...rest }) {
  return (
    <button
      className={cx('inline-flex items-center justify-center gap-1.5 rounded-md border font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5', variants[variant], className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, className, ...rest }) {
  return (
    <button aria-label={label} title={label} className={cx('inline-grid place-items-center w-8 h-8 rounded-md text-ink-3 hover:text-ink hover:bg-black/5', className)} {...rest}>
      <Icon name={icon} size={17} />
    </button>
  );
}

export const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" aria-label="Loading">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" fill="none" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

// ---------- form ----------
export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="block text-[13px] font-medium mb-1">{label}</span>}
      {children}
      {(error || hint) && <span className={cx('block text-xs mt-1', error ? 'text-danger' : 'text-ink-3')}>{error || hint}</span>}
    </label>
  );
}
export const Input = (p) => <input {...p} className={cx('field', p.className)} />;
export const Textarea = (p) => <textarea rows={3} {...p} className={cx('field', p.className)} />;
export function Select({ options = [], placeholder, className, ...rest }) {
  return (
    <select {...rest} className={cx('field pr-8', className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === 'object' ? <option key={o.value} value={o.value}>{o.label}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  );
}
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cx('relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-50', checked ? 'bg-signal' : 'bg-line')}>
      <span className={cx('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
    </button>
  );
}

// ---------- layout ----------
export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        {back}
        <h1 className="text-[22px] font-semibold">{title}</h1>
        {subtitle && <p className="text-ink-3 mt-1 max-w-[70ch]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className, padded = true }) {
  return (
    <section className={cx('bg-white border border-line rounded-lg', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <h2 className="font-semibold text-[15px]">{title}</h2>
          <div className="flex gap-2">{actions}</div>
        </div>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

export function Empty({ icon = 'inbox', title, body, action }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="mx-auto w-11 h-11 rounded-full bg-paper grid place-items-center text-ink-3 mb-3"><Icon name={icon} size={20} /></div>
      <p className="font-semibold">{title}</p>
      {body && <p className="text-ink-3 mt-1 max-w-[46ch] mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading() {
  return <div className="py-16 grid place-items-center text-ink-3"><Spinner /></div>;
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <div className="rounded-md bg-danger-wash text-danger px-3 py-2 text-[13px]">{error.message || String(error)}</div>;
}

const badgeTone = {
  green: 'bg-signal-wash text-signal-deep', amber: 'bg-amber-wash text-[#9a6210]', red: 'bg-danger-wash text-danger',
  gray: 'bg-paper text-ink-3 border border-line', ink: 'bg-ink text-white', blue: 'bg-[#e6f0fb] text-[#2563a8]',
};
export function Badge({ tone = 'gray', children, className }) {
  return <span className={cx('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', badgeTone[tone], className)}>{children}</span>;
}

const STATUS_TONE = {
  active: 'green', trial: 'amber', trialing: 'amber', past_due: 'red', suspended: 'red', canceled: 'gray',
  paid: 'green', unpaid: 'amber', void: 'gray',
  APPROVED: 'green', PENDING: 'amber', REJECTED: 'red', PAUSED: 'gray', DISABLED: 'gray',
  draft: 'gray', scheduled: 'blue', running: 'green', paused: 'amber', completed: 'ink', failed: 'red',
  open: 'green', pending: 'amber', resolved: 'gray',
  created: 'blue', shipped: 'amber', delivered: 'green', sent: 'gray', read: 'green',
  connected: 'green', live: 'green', mock: 'blue',
};
const STATUS_LABEL = { past_due: 'Past due', trialing: 'Trial', mock: 'Demo' };
export function StatusBadge({ status }) {
  const label = STATUS_LABEL[status] || String(status || '').toLowerCase().replace(/_/g, ' ');
  return <Badge tone={STATUS_TONE[status] || 'gray'}>{label.charAt(0).toUpperCase() + label.slice(1)}</Badge>;
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-line mb-5 overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('px-3 py-2 -mb-px border-b-2 font-medium whitespace-nowrap', value === t.value ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>
          {t.label}{t.count != null && <span className="ml-1.5 text-ink-3 font-normal">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Table({ columns, rows, empty, onRowClick, rowKey = 'id' }) {
  if (!rows?.length) return empty || null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-ink-3 text-[13px] border-b border-line">
            {columns.map((c) => <th key={c.key || c.label} className={cx('font-medium px-4 py-2.5', c.className)}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[rowKey]} onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cx('border-b border-line last:border-0', onRowClick && 'cursor-pointer hover:bg-paper')}>
              {columns.map((c) => <td key={c.key || c.label} className={cx('px-4 py-2.5 align-middle', c.className)}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, total, limit, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-line text-ink-3 text-[13px]">
      <span>Page {page} of {pages} · {total.toLocaleString()} total</span>
      <div className="flex gap-2">
        <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

// ---------- modal ----------
export function Modal({ open, onClose, title, children, footer, width = 520 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector('input,textarea,select,button')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-ink/40 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-lg shadow-xl w-full my-8" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-semibold text-base">{title}</h2>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-line bg-paper rounded-b-lg">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- toasts ----------
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random();
    setItems((x) => [...x, { id, message, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-[min(380px,calc(100vw-2rem))]" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx('rounded-md px-4 py-3 shadow-lg text-[13px] flex gap-2 items-start', t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-white')}>
            <Icon name={t.tone === 'error' ? 'x' : 'check'} size={16} className="mt-0.5 shrink-0" />{t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** Run an async action with a toast on success/failure. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, success) => {
    setBusy(true);
    try {
      const out = await fn();
      if (success) toast(success);
      return out;
    } catch (e) {
      toast(e.message || 'Something went wrong', 'error');
      return undefined;
    } finally { setBusy(false); }
  }, [toast]);
  return [run, busy];
}

export function Confirm({ open, title, body, confirmLabel = 'Delete', onConfirm, onClose, busy }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="dark" className="!bg-danger" loading={busy} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="text-ink-3">{body}</p>
    </Modal>
  );
}

export function Meter({ value, max, label }) {
  const unlimited = max == null || max < 0;
  const ratio = unlimited ? 0 : Math.min(1, value / Math.max(1, max));
  return (
    <div>
      <div className="flex justify-between text-[13px] mb-1">
        <span>{label}</span>
        <span className="text-ink-3 tabular-nums">{(+value).toLocaleString()} / {unlimited ? 'Unlimited' : (+max).toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-paper overflow-hidden">
        <div className={cx('h-full rounded-full', ratio > 0.9 ? 'bg-danger' : ratio > 0.7 ? 'bg-amber' : 'bg-signal')} style={{ width: `${unlimited ? 4 : Math.max(2, ratio * 100)}%` }} />
      </div>
    </div>
  );
}

export function Avatar({ name, size = 32 }) {
  const hue = [...String(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const initials = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => [...p][0]).join('').toUpperCase();
  return (
    <span className="inline-grid place-items-center rounded-full font-semibold shrink-0 text-[12px]"
      style={{ width: size, height: size, background: `hsl(${hue} 35% 90%)`, color: `hsl(${hue} 40% 28%)` }}>{initials || '?'}</span>
  );
}

export function CopyField({ value }) {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className="field font-mono text-[12px]" onFocus={(e) => e.target.select()} />
      <Button icon="copy" onClick={() => { navigator.clipboard?.writeText(value); toast('Copied'); }}>Copy</Button>
    </div>
  );
}
