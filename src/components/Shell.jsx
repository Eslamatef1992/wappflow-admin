import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useSession, useRealtime } from '../lib/session.jsx';
import { Icon } from './icons.jsx';
import { Avatar, cx } from './ui.jsx';
import { date } from '../lib/format.js';
import { useT, LangToggle } from '../lib/i18n.jsx';

function Rail({ items, footer, brand, badge }) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 h-12 shrink-0 bg-ink text-white flex items-center gap-2 px-2">
        <button className="w-9 h-9 rounded-md grid place-items-center hover:bg-white/10" aria-label={tr('Open menu')} onClick={() => setOpen(true)}>
          <Icon name="more" />
        </button>
        <img src="/brand/wappflow-logo-white.png" alt={brand} className="h-6 w-auto" />
      </div>
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-ink/40" onClick={() => setOpen(false)} />}
      <aside className={cx('fixed lg:sticky top-0 start-0 z-50 h-screen w-[232px] shrink-0 bg-ink text-white/80 flex flex-col transition-transform', !open && 'max-lg:-translate-x-full max-lg:rtl:translate-x-full')}>
        <div className="flex items-center gap-2.5 px-5 h-16 text-white">
          <img src="/brand/wappflow-logo-white.png" alt={brand} className="h-7 w-auto" />
          {badge && <span className="text-[11px] font-semibold rounded px-1.5 py-0.5 bg-white/10 text-white/80">{tr(badge)}</span>}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5" onClick={() => setOpen(false)}>
          {items.map((it) => it.section ? (
            <p key={it.section} className="px-3 pt-5 pb-1 text-[12px] text-white/40">{tr(it.section)}</p>
          ) : (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => cx('flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                isActive || (it.match && loc.pathname.startsWith(it.match)) ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white')}>
              <Icon name={it.icon} size={18} />
              <span className="flex-1">{tr(it.label)}</span>
              {!!it.badge && <span className="min-w-5 h-5 px-1.5 rounded-full bg-signal text-white text-[11px] font-semibold grid place-items-center">{it.badge}</span>}
            </NavLink>
          ))}
        </nav>
        {footer}
      </aside>
    </>
  );
}

function UserFooter() {
  const tr = useT();
  const { me, logout } = useSession();
  return (
    <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
      <Avatar name={me.user.name} size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-white text-[13px] font-medium truncate">{me.user.name}</p>
        <p className="text-white/50 text-[12px] truncate">{me.tenant?.name || tr('Platform admin')}</p>
      </div>
      <LangToggle className="px-1.5 py-1 rounded text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10" />
      <button onClick={logout} className="p-1.5 rounded hover:bg-white/10 rtl:-scale-x-100" aria-label={tr('Sign out')} title={tr('Sign out')}><Icon name="logout" size={17} /></button>
    </div>
  );
}

function StatusBanner() {
  const tr = useT();
  const { me, stopImpersonating } = useSession();
  const impersonatedBy = me?.impersonatedBy;
  const t = me?.tenant;
  return (
    <>
      {impersonatedBy && (
        <div className="bg-ink-2 text-white text-[13px] px-6 py-2 flex items-center justify-between gap-3">
          <span>{tr('You are viewing {name} as its owner (support mode).', { name: t?.name })}</span>
          <button className="underline" onClick={stopImpersonating}>{tr('Back to admin')}</button>
        </div>
      )}
      {t?.status === 'trial' && (
        <div className="bg-amber-wash text-[#7a4d0c] text-[13px] px-6 py-2 flex items-center justify-between gap-3">
          <span>{tr('Free trial ends {date}. Choose a plan to keep your number and contacts active.', { date: date(t.trial_ends_at) })}</span>
          <Link to="/app/billing" className="font-semibold underline">{tr('Choose a plan')}</Link>
        </div>
      )}
      {['past_due', 'suspended'].includes(t?.status) && (
        <div className="bg-danger text-white text-[13px] px-6 py-2 flex items-center justify-between gap-3">
          <span>{t.status === 'suspended' ? tr('Your plan has ended. Pay the invoice below to keep using your workspace.') : tr('Your subscription renewal is unpaid.')}</span>
          <Link to="/app/billing" className="font-semibold underline">{tr('Pay invoice')}</Link>
        </div>
      )}
    </>
  );
}

export function AppShell() {
  const { me, config } = useSession();
  const [unread, setUnread] = useState(0);
  const loc = useLocation();
  useRealtime((e) => { if (e === 'message.received' && !loc.pathname.startsWith('/app/inbox')) setUnread((n) => n + 1); });
  useEffect(() => { if (loc.pathname.startsWith('/app/inbox')) setUnread(0); }, [loc.pathname]);
  const isAgent = me.user.role === 'agent';
  const features = me.plan?.features || {};
  const items = [
    { to: '/app', end: true, icon: 'home', label: 'Overview' },
    { to: '/app/inbox', icon: 'inbox', label: 'Inbox', match: '/app/inbox', badge: unread },
    { to: '/app/contacts', icon: 'users', label: 'Contacts' },
    { section: 'Marketing' },
    features.campaigns !== false && { to: '/app/campaigns', icon: 'megaphone', label: 'Campaigns', match: '/app/campaigns' },
    { to: '/app/templates', icon: 'file', label: 'Templates' },
    features.flows !== false && { to: '/app/flows', icon: 'flow', label: 'Chatbots', match: '/app/flows' },
    features.commerce !== false && { to: '/app/commerce', icon: 'cart', label: 'Commerce' },
    !isAgent && features.invoices !== false && { to: '/app/invoices', icon: 'receipt', label: 'Invoices' },
    { section: 'Workspace' },
    { to: '/app/settings', icon: 'settings', label: 'Settings' },
    !isAgent && { to: '/app/billing', icon: 'card', label: 'Plan & billing' },
  ].filter(Boolean);
  // plan ended unpaid: only Plan & billing is usable until the invoice is paid
  const locked = me.tenant?.status === 'suspended';
  if (locked && !loc.pathname.startsWith('/app/billing')) return <Navigate to="/app/billing" replace />;
  const full = loc.pathname.startsWith('/app/inbox') || /^\/app\/flows\/\d+/.test(loc.pathname);
  return (
    <div className={cx('flex flex-col lg:flex-row', full ? 'h-[100dvh]' : 'min-h-screen')}>
      <Rail items={locked ? [{ to: '/app/billing', icon: 'card', label: 'Plan & billing' }] : items} brand={config?.brand || 'WappFlow'} footer={<UserFooter />} />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        <StatusBanner />
        {full ? <div className="flex-1 min-h-0"><Outlet /></div> : <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1240px] w-full mx-auto"><Outlet /></div>}
      </main>
    </div>
  );
}

export function AdminShell() {
  const { config } = useSession();
  const items = [
    { to: '/admin', end: true, icon: 'chart', label: 'Overview' },
    { to: '/admin/tenants', icon: 'building', label: 'Workspaces', match: '/admin/tenants' },
    { to: '/admin/plans', icon: 'card', label: 'Plans' },
    { to: '/admin/invoices', icon: 'receipt', label: 'Invoices' },
    { to: '/admin/system', icon: 'server', label: 'System' },
    { to: '/admin/account', icon: 'key', label: 'Account' },
  ];
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Rail items={items} brand={config?.brand || 'WappFlow'} badge="Admin" footer={<UserFooter />} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8 max-w-[1240px] mx-auto w-full"><Outlet /></main>
    </div>
  );
}
