import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApi } from '../../lib/api.js';
import { Loading, PageHeader, Panel } from '../../components/ui.jsx';
import { money, num } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

function Stat({ label, value, note, to }) {
  const tr = useT();
  const body = (
    <div className="bg-white border border-line rounded-lg px-4 py-3.5 h-full hover:border-ink-3">
      <p className="text-ink-3 text-[13px]">{tr(label)}</p>
      <p className="text-[26px] font-semibold tabular-nums leading-tight mt-0.5">{value}</p>
      {note && <p className="text-ink-3 text-[12px] mt-1">{tr(note)}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Overview() {
  const tr = useT();
  const { data: s } = useApi('/api/admin/stats');
  if (!s) return <Loading />;
  const st = s.tenantsByStatus;
  return (
    <>
      <PageHeader title={tr('Platform overview')} subtitle="Your WhatsApp platform business at a glance." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Monthly recurring revenue" value={money(s.mrr)} note={tr('{n} paying workspaces', { n: num(st.active || 0) })} />
        <Stat label="Workspaces" value={num(s.tenants)} note={tr('{trial} on trial · {new} new in 30 days', { trial: num(st.trial || 0), new: num(s.signups30d) })} to="/admin/tenants" />
        <Stat label="Unpaid invoices" value={num(s.unpaidInvoices)} note={tr('{n} past due or suspended', { n: num((st.past_due || 0) + (st.suspended || 0)) })} to="/admin/invoices" />
        <Stat label="Messages this month" value={num(s.messagesThisMonth.sent)} note={tr('{n} received', { n: num(s.messagesThisMonth.received) })} />
      </div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <Panel title={tr('Revenue collected, last 12 months')}>
          <div className="h-64 -ml-2">
            <ResponsiveContainer>
              <BarChart data={s.revenueByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="month" tickFormatter={(m) => m.slice(2)} tick={{ fontSize: 12, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 6, border: '1px solid var(--color-line)', fontSize: 13 }} />
                <Bar dataKey="amount" name="Revenue" fill="#1faf6a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={tr('Platform')}>
          <dl className="grid grid-cols-2 gap-y-3 text-[13px]">
            <dt className="text-ink-3">{tr('Workspace users')}</dt><dd className="text-end tabular-nums">{num(s.users)}</dd>
            <dt className="text-ink-3">{tr('WhatsApp numbers')}</dt><dd className="text-end tabular-nums">{num(s.numbers)}</dd>
            <dt className="text-ink-3">{tr('Contacts stored')}</dt><dd className="text-end tabular-nums">{num(s.contacts)}</dd>
            <dt className="text-ink-3">{tr('Failed jobs')}</dt><dd className={`text-end tabular-nums ${s.failedJobs ? 'text-danger font-semibold' : ''}`}><Link to="/admin/system">{num(s.failedJobs)}</Link></dd>
          </dl>
        </Panel>
      </div>
    </>
  );
}
