import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { post, useApi } from '../../lib/api.js';
import { useRealtime } from '../../lib/session.jsx';
import { Button, Loading, PageHeader, Pager, Panel, StatusBadge, Table, Tabs, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { dateTime, num, pct, phone } from '../../lib/format.js';

/** Sent → delivered → read → replied, as a horizontal funnel. */
function Funnel({ c }) {
  const base = Math.max(c.total, 1);
  const steps = [
    { label: 'Sent', value: c.sent, tone: 'bg-ink' },
    { label: 'Delivered', value: c.delivered, tone: 'bg-ink-2' },
    { label: 'Read', value: c.read, tone: 'bg-signal' },
    { label: 'Replied', value: c.replied, tone: 'bg-signal-deep' },
  ];
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <div key={s.label} className="grid grid-cols-[90px_1fr_110px] items-center gap-3">
          <span className="text-[13px]">{s.label}</span>
          <div className="h-6 bg-paper rounded overflow-hidden"><div className={`h-full ${s.tone} rounded transition-[width] duration-500`} style={{ width: `${(s.value / base) * 100}%` }} /></div>
          <span className="text-right tabular-nums text-[13px]"><b>{num(s.value)}</b> <span className="text-ink-3">{pct(s.value / base)}</span></span>
        </div>
      ))}
      {c.failed > 0 && <p className="text-[13px] text-danger">{num(c.failed)} could not be delivered. See the Failed tab for reasons.</p>}
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const { data: c, reload } = useApi(`/api/app/campaigns/${id}`);
  const rec = useApi(`/api/app/campaigns/${id}/recipients?page=${page}&limit=50${tab ? `&status=${tab}` : ''}`);
  const [run, busy] = useAction();
  useRealtime((e, d) => { if (e.startsWith('campaign.') && String(d.id) === id) { reload(); rec.reload(); } });
  if (!c) return <Loading />;
  const act = (path, msg) => run(async () => { await post(`/api/app/campaigns/${id}/${path}`); reload(); rec.reload(); }, msg);

  return (
    <>
      <PageHeader title={c.name}
        back={<Link to="/app/campaigns" className="text-[13px] text-ink-3 hover:text-ink inline-flex items-center gap-1 mb-2"><Icon name="arrowLeft" size={14} />Campaigns</Link>}
        subtitle={<span className="flex flex-wrap items-center gap-2"><StatusBadge status={c.status} /><span className="font-mono text-[12px]">{c.template_name}</span><span>· {c.status === 'scheduled' ? `Sends ${dateTime(c.scheduled_at)}` : `Started ${dateTime(c.started_at)}`}</span></span>}
        actions={<>
          {c.status === 'running' && <Button icon="pause" loading={busy} onClick={() => act('pause', 'Paused')}>Pause</Button>}
          {c.status === 'paused' && <Button variant="primary" icon="play" loading={busy} onClick={() => act('resume', 'Resumed')}>Resume</Button>}
          {['running', 'paused', 'scheduled'].includes(c.status) && <Button variant="danger" loading={busy} onClick={() => act('cancel', 'Campaign canceled')}>Cancel</Button>}
          <Button icon="copy" loading={busy} onClick={() => run(async () => nav(`/app/campaigns/${(await post(`/api/app/campaigns/${id}/duplicate`)).id}/edit`))}>Duplicate</Button>
        </>} />
      <Panel title={`Results · ${num(c.total)} recipients`} className="mb-6"><Funnel c={c} /></Panel>
      <div className="bg-white border border-line rounded-lg">
        <div className="px-4 pt-2">
          <Tabs value={tab} onChange={(v) => { setTab(v); setPage(1); }} tabs={[{ value: '', label: 'All' }, { value: 'pending', label: 'Waiting' }, { value: 'sent', label: 'Sent' }, { value: 'delivered', label: 'Delivered' }, { value: 'read', label: 'Read' }, { value: 'failed', label: 'Failed' }]} />
        </div>
        {rec.data && (
          <>
            <Table rows={rec.data.data} empty={<p className="px-4 pb-6 text-ink-3">No recipients in this group.</p>}
              columns={[
                { label: 'Contact', key: 'name', render: (r) => <span dir="auto">{r.name || '—'}</span> },
                { label: 'WhatsApp', key: 'wa', render: (r) => <span dir="ltr" className="tabular-nums">{phone(r.wa_id)}</span> },
                { label: 'Status', key: 'status', render: (r) => <StatusBadge status={r.status} /> },
                { label: 'Replied', key: 'rep', render: (r) => (r.replied_at ? dateTime(r.replied_at) : '—') },
                { label: 'Note', key: 'err', render: (r) => <span className="text-danger text-[13px]">{r.error}</span> },
              ]} />
            <Pager page={page} total={rec.data.total} limit={50} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
