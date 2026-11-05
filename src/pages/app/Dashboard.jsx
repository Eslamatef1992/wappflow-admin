import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApi } from '../../lib/api.js';
import { useSession } from '../../lib/session.jsx';
import { Button, Loading, Meter, PageHeader, Panel, Select } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { duration, money, num, pct } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

function Stat({ label, value, note, to }) {
  const tr = useT();
  const body = (
    <div className="bg-white border border-line rounded-lg px-4 py-3.5 h-full hover:border-ink-3 transition-colors">
      <p className="text-ink-3 text-[13px]">{tr(label)}</p>
      <p className="text-[26px] font-semibold tabular-nums mt-0.5 leading-tight">{value}</p>
      {note && <p className="text-ink-3 text-[12px] mt-1">{tr(note)}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function Setup({ me }) {
  const tr = useT();
  const steps = [
    { done: me.usage.numbers > 0, label: 'Connect your WhatsApp number', to: '/app/settings?tab=numbers' },
    { done: me.usage.contacts > 0, label: 'Import your customers', to: '/app/contacts' },
    { done: me.usage.flows > 0, label: 'Turn on a welcome chatbot', to: '/app/flows' },
    { done: me.usage.templates_sent > 0, label: 'Send your first campaign', to: '/app/campaigns/new' },
  ];
  if (steps.every((s) => s.done)) return null;
  return (
    <Panel title={tr('Get set up')} className="mb-6">
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link to={s.to} className="flex gap-3 items-start rounded-md p-2 -m-2 hover:bg-paper">
              <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 text-[12px] font-semibold ${s.done ? 'bg-signal text-white' : 'border border-line text-ink-3'}`}>
                {s.done ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className={s.done ? 'text-ink-3 line-through' : 'font-medium'}>{tr(s.label)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export default function Dashboard() {
  const tr = useT();
  const { me } = useSession();
  const [days, setDays] = useState(30);
  const { data } = useApi(`/api/app/analytics?days=${days}`);
  const limits = me.plan?.limits || {};
  if (!data) return <Loading />;
  const k = data.kpis;
  const c = data.campaigns;
  return (
    <>
      <PageHeader title={tr('Hello, {name}', { name: me.user.name.split(' ')[0] })} subtitle={me.tenant.name}
        actions={<><Select className="!w-auto" value={days} onChange={(e) => setDays(+e.target.value)} options={[{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 90, label: 'Last 90 days' }]} />
          <Link to="/app/campaigns/new"><Button variant="primary" icon="megaphone">{tr('New campaign')}</Button></Link></>} />
      <Setup me={me} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Open conversations" value={num(k.openConversations)} note={k.unassigned ? tr('{n} waiting for an agent', { n: k.unassigned }) : tr('All assigned')} to="/app/inbox" />
        <Stat label="Median first reply" value={duration(k.medianFirstResponseMs)} note="From a customer's first message" />
        <Stat label="Messages sent" value={num(k.messagesOut)} note={tr('{read} read · {delivered} delivered', { read: pct(k.readRate), delivered: pct(k.deliveryRate) })} />
        <Stat label="Orders" value={num(k.orders)} note={money(k.revenue, k.currency)} to="/app/commerce" />
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Panel title={tr('Conversations by day')}>
          <div className="h-64 -ml-3">
            <ResponsiveContainer>
              <AreaChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 12, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid var(--color-line)', fontSize: 13 }} />
                <Area type="monotone" dataKey="in" name="Received" stroke="#0f2a2e" fill="#0f2a2e" fillOpacity={0.08} strokeWidth={2} />
                <Area type="monotone" dataKey="out" name="Sent" stroke="#1faf6a" fill="#1faf6a" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-[13px] text-ink-3 mt-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-ink" />{tr('Received')} {num(k.messagesIn)}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-signal" />{tr('Sent')} {num(k.messagesOut)}</span>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title={tr('Plan usage')} actions={<Link to="/app/billing" className="text-[13px] underline">{me.plan?.name}</Link>}>
            <div className="space-y-3">
              <Meter label="Messages this month" value={me.usage.monthly_messages} max={limits.monthly_messages} />
              <Meter label="Contacts" value={me.usage.contacts} max={limits.contacts} />
              <Meter label="Team members" value={me.usage.agents} max={limits.agents} />
            </div>
          </Panel>
          <Panel title={tr('Campaign results')}>
            {c.sent ? (
              <dl className="grid grid-cols-2 gap-y-3 text-[13px]">
                <dt className="text-ink-3">{tr('Sent')}</dt><dd className="text-end tabular-nums font-medium">{num(c.sent)}</dd>
                <dt className="text-ink-3">{tr('Read')}</dt><dd className="text-end tabular-nums font-medium">{num(c.read)} <span className="text-ink-3 font-normal">({pct(c.read / c.sent)})</span></dd>
                <dt className="text-ink-3">{tr('Replied')}</dt><dd className="text-end tabular-nums font-medium">{num(c.replied)} <span className="text-ink-3 font-normal">({pct(c.replied / c.sent)})</span></dd>
                <dt className="text-ink-3">{tr('Failed')}</dt><dd className="text-end tabular-nums font-medium">{num(c.failed)}</dd>
              </dl>
            ) : <p className="text-ink-3 text-[13px]">{tr('No campaigns sent in this period.')}</p>}
          </Panel>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Panel title={tr('Busiest chatbots')}>
          {data.topFlows.length ? (
            <ul className="space-y-2 text-[13px]">
              {data.topFlows.map((f) => <li key={f.id} className="flex justify-between"><Link to={`/app/flows/${f.id}`} className="hover:underline">{f.name}</Link><span className="text-ink-3 tabular-nums">{tr('{n} runs', { n: num(f.runs) })}</span></li>)}
            </ul>
          ) : <p className="text-ink-3 text-[13px]">{tr('No chatbots yet.')}</p>}
        </Panel>
        <Panel title={tr('Replies by agent')}>
          {data.agents.length ? (
            <ul className="space-y-2 text-[13px]">
              {data.agents.map((a) => <li key={a.id} className="flex justify-between"><span>{a.name}</span><span className="text-ink-3 tabular-nums">{tr('{n} messages', { n: num(a.c) })}</span></li>)}
            </ul>
          ) : <p className="text-ink-3 text-[13px]">{tr('Agents haven\'t replied to anyone in this period.')}</p>}
        </Panel>
      </div>
    </>
  );
}
