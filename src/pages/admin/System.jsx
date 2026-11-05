import { post, useApi } from '../../lib/api.js';
import { Button, Loading, PageHeader, Panel, Table, useAction } from '../../components/ui.jsx';
import { dateTime, num } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

export default function System() {
  const tr = useT();
  const jobs = useApi('/api/admin/jobs');
  const audit = useApi('/api/admin/audit');
  const [run] = useAction();
  if (!jobs.data) return <Loading />;
  const s = jobs.data.byStatus;
  return (
    <>
      <PageHeader title={tr('System')} subtitle="Background work (webhooks, campaigns, chatbot delays, billing) and admin activity." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {['pending', 'running', 'done', 'failed'].map((k) => (
          <div key={k} className="bg-white border border-line rounded-lg px-4 py-3">
            <p className="text-ink-3 text-[13px] capitalize">{tr(k)}</p>
            <p className={`text-2xl font-semibold tabular-nums ${k === 'failed' && s[k] ? 'text-danger' : ''}`}>{num(s[k] || 0)}</p>
          </div>
        ))}
      </div>
      <Panel title={tr('Failed jobs')} padded={false} className="mb-6">
        <Table rows={jobs.data.failed} empty={<p className="p-4 text-ink-3 text-[13px]">{tr('Nothing failed. 🎉')}</p>}
          columns={[
            { label: 'Job', key: 't', render: (j) => <span className="font-mono text-[12px]">{j.type} #{j.id}</span> },
            { label: 'Error', key: 'e', render: (j) => <span className="text-danger text-[13px] break-all">{j.last_error}</span> },
            { label: 'Attempts', key: 'a', render: (j) => j.attempts },
            { label: '', key: 'x', className: 'text-end', render: (j) => <Button size="sm" onClick={() => run(async () => { await post(`/api/admin/jobs/${j.id}/retry`); jobs.reload(); }, 'Queued again')}>{tr('Retry')}</Button> },
          ]} />
      </Panel>
      <Panel title={tr('Admin activity')} padded={false}>
        <Table rows={audit.data || []} empty={<p className="p-4 text-ink-3 text-[13px]">{tr('No activity yet.')}</p>}
          columns={[
            { label: 'When', key: 'w', render: (a) => <span className="text-ink-3">{dateTime(a.created_at)}</span> },
            { label: 'Who', key: 'u', render: (a) => a.user_email },
            { label: 'Action', key: 'a', render: (a) => <span className="font-mono text-[12px]">{a.action}</span> },
            { label: 'Workspace', key: 't', render: (a) => a.tenant_name },
          ]} />
      </Panel>
    </>
  );
}
