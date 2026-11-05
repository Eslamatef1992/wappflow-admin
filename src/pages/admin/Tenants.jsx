import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, useApi } from '../../lib/api.js';
import { Button, Field, Input, Loading, Modal, PageHeader, Pager, Select, StatusBadge, Table, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { date, num } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

export default function Tenants() {
  const tr = useT();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ company: '', name: '', email: '', password: '', planId: '' });
  const [run, busy] = useAction();
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, reload } = useApi(`/api/admin/tenants?page=${page}${dq ? `&q=${encodeURIComponent(dq)}` : ''}${status ? `&status=${status}` : ''}`);
  const plans = useApi('/api/admin/plans');
  return (
    <>
      <PageHeader title={tr('Workspaces')} subtitle="Every business using your platform."
        actions={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>{tr('Create workspace')}</Button>} />
      <div className="bg-white border border-line rounded-lg">
        <div className="flex flex-wrap gap-2 p-3 border-b border-line">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" size={16} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="field ps-8" placeholder={tr('Search by business name')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select className="!w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder={tr('All statuses')}
            options={[{ value: 'trial', label: 'Trial' }, { value: 'active', label: 'Active' }, { value: 'past_due', label: 'Past due' }, { value: 'suspended', label: 'Suspended' }]} />
        </div>
        {!data ? <Loading /> : (
          <>
            <Table rows={data.data} onRowClick={(t) => nav(`/admin/tenants/${t.id}`)} empty={<p className="p-6 text-ink-3">{tr('No workspaces found.')}</p>}
              columns={[
                { label: 'Business', key: 'n', render: (t) => <div><p className="font-medium">{t.name}</p><p className="text-ink-3 text-[12px]">{t.owner?.email}</p></div> },
                { label: 'Plan', key: 'p', render: (t) => t.plan_name || '—' },
                { label: 'Status', key: 's', render: (t) => <StatusBadge status={t.status} /> },
                { label: 'Messages (month)', key: 'm', render: (t) => <span className="tabular-nums">{num(t.messages_this_month)}</span> },
                { label: 'Joined', key: 'c', render: (t) => <span className="text-ink-3">{date(t.created_at)}</span> },
              ]} />
            <Pager page={page} total={data.total} limit={25} onChange={setPage} />
          </>
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={tr('Create workspace')}
        footer={<><Button onClick={() => setOpen(false)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { const t = await post('/api/admin/tenants', f); setOpen(false); reload(); nav(`/admin/tenants/${t.id}`); }, 'Workspace created')}>{tr('Create')}</Button></>}>
        <Field label="Business name"><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Owner email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Temporary password"><Input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Field label="Plan"><Select value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value })} placeholder={tr('Choose…')} options={(plans.data || []).map((p) => ({ value: p.id, label: p.name }))} /></Field>
        </div>
        <p className="text-ink-3 text-[13px]">{tr('The workspace starts on a free trial of the chosen plan.')}</p>
      </Modal>
    </>
  );
}
