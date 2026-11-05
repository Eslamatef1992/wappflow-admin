import { post, useApi } from '../../lib/api.js';
import { useState } from 'react';
import { Badge, Button, Input, Loading, PageHeader, Panel, Table, useAction } from '../../components/ui.jsx';
import { useSession } from '../../lib/session.jsx';
import { dateTime, num } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

export default function System() {
  const tr = useT();
  const jobs = useApi('/api/admin/jobs');
  const audit = useApi('/api/admin/audit');
  const email = useApi('/api/admin/email');
  const { me } = useSession();
  const [to, setTo] = useState('');
  const [run, busy] = useAction();
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
      <Panel title={tr('Account emails')} className="mb-6" actions={email.data && <Badge tone={email.data.enabled ? 'green' : 'gray'}>{tr(email.data.enabled ? 'On' : 'Off')}</Badge>}>
        {!email.data ? <Loading /> : email.data.enabled ? (
          <>
            <p className="text-[13px] text-ink-2 mb-3">{tr('Workspace owners get a welcome email when they sign up, the invoice when one is issued, and a receipt when they pay. Sent from {from}.', { from: email.data.from })}</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Input className="!w-64" type="email" dir="ltr" placeholder={me?.user?.email} value={to} onChange={(e) => setTo(e.target.value)} aria-label={tr('Send test to')} />
              {[['welcome', 'Send test welcome'], ['invoice', 'Send test invoice'], ['receipt', 'Send test receipt']].map(([kind, label]) => (
                <Button key={kind} size="sm" loading={busy} onClick={() => run(() => post('/api/admin/email/test', { to: to || me?.user?.email, kind }), 'Test email sent. Check the inbox (and spam).')}>{tr(label)}</Button>
              ))}
            </div>
          </>
        ) : <p className="text-[13px] text-ink-3">{tr('Email is off. Add MAILGUN_API_KEY and MAILGUN_DOMAIN to the server settings to send welcome, invoice and receipt emails.')}</p>}
      </Panel>
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
