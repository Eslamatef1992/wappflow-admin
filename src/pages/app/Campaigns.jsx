import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/api.js';
import { useRealtime } from '../../lib/session.jsx';
import { Button, Empty, Loading, PageHeader, StatusBadge, Table } from '../../components/ui.jsx';
import { dateTime, num, pct } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

export function Progress({ c }) {
  const total = c.total || 0;
  if (!total) return <span className="text-ink-3">—</span>;
  const done = (c.sent || 0) + (c.failed || 0);
  return (
    <div className="w-36">
      <div className="h-1.5 rounded-full bg-paper overflow-hidden flex">
        <div className="bg-signal" style={{ width: `${(c.read / total) * 100}%` }} />
        <div className="bg-signal/50" style={{ width: `${((c.delivered - c.read) / total) * 100}%` }} />
        <div className="bg-ink-3/40" style={{ width: `${((c.sent - c.delivered) / total) * 100}%` }} />
        <div className="bg-danger" style={{ width: `${(c.failed / total) * 100}%` }} />
      </div>
      <p className="text-[12px] text-ink-3 mt-1 tabular-nums">{num(done)} / {num(total)}</p>
    </div>
  );
}

export default function Campaigns() {
  const tr = useT();
  const nav = useNavigate();
  const { data, loading, reload } = useApi('/api/app/campaigns');
  useRealtime((e) => { if (e.startsWith('campaign.')) reload(); });
  return (
    <>
      <PageHeader title={tr('Campaigns')} subtitle="Send an approved template to a tagged group of customers, now or on a schedule."
        actions={<Link to="/app/campaigns/new"><Button variant="primary" icon="plus">{tr('New campaign')}</Button></Link>} />
      <div className="bg-white border border-line rounded-lg">
        {loading ? <Loading /> : (
          <Table rows={data}
            empty={<Empty icon="megaphone" title={tr('No campaigns yet')} body="Announce an offer, a new collection or Eid opening hours to everyone who opted in." action={<Link to="/app/campaigns/new"><Button variant="primary">{tr('Create your first campaign')}</Button></Link>} />}
            onRowClick={(c) => nav(c.status === 'draft' ? `/app/campaigns/${c.id}/edit` : `/app/campaigns/${c.id}`)}
            columns={[
              { label: 'Campaign', key: 'name', render: (c) => <div><p className="font-medium">{c.name}</p><p className="text-ink-3 text-[12px] font-mono">{c.template_name || 'No template'}</p></div> },
              { label: 'Status', key: 'status', render: (c) => <StatusBadge status={c.status} /> },
              { label: 'Progress', key: 'progress', render: (c) => <Progress c={c} /> },
              { label: 'Read', key: 'read', render: (c) => (c.sent ? <span className="tabular-nums">{pct(c.read / c.sent)}</span> : '—') },
              { label: 'Replied', key: 'replied', render: (c) => (c.sent ? <span className="tabular-nums">{num(c.replied)}</span> : '—') },
              { label: 'When', key: 'when', render: (c) => <span className="text-ink-3">{dateTime(c.started_at || c.scheduled_at || c.created_at)}</span> },
            ]} />
        )}
      </div>
    </>
  );
}
