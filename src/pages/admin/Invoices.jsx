import { useState } from 'react';
import { Link } from 'react-router-dom';
import { post, useApi } from '../../lib/api.js';
import { Button, Field, Input, Loading, Modal, PageHeader, Pager, Select, StatusBadge, Table, useAction } from '../../components/ui.jsx';
import { date, money } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

export default function Invoices() {
  const tr = useT();
  const [status, setStatus] = useState('unpaid');
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState(null);
  const [ref, setRef] = useState('');
  const { data, reload } = useApi(`/api/admin/invoices?page=${page}${status ? `&status=${status}` : ''}`);
  const [run, busy] = useAction();
  return (
    <>
      <PageHeader title={tr('Invoices')} subtitle="Bank transfers are confirmed here. Online payments (Tap) are marked paid automatically." />
      <div className="bg-white border border-line rounded-lg">
        <div className="p-3 border-b border-line">
          <Select className="!w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder={tr('All invoices')} options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'paid', label: 'Paid' }, { value: 'void', label: 'Void' }]} />
        </div>
        {!data ? <Loading /> : (
          <>
            <Table rows={data.data} empty={<p className="p-6 text-ink-3">{tr('No invoices here.')}</p>} columns={[
              { label: 'Invoice', key: 'n', render: (i) => <span className="font-medium">{i.number}</span> },
              { label: 'Workspace', key: 't', render: (i) => <Link className="hover:underline" to={`/admin/tenants/${i.tenant_id}`}>{i.tenant_name}</Link> },
              { label: 'Amount', key: 'a', render: (i) => <span className="tabular-nums">{money(i.amount, i.currency)}</span> },
              { label: 'Status', key: 's', render: (i) => <StatusBadge status={i.status} /> },
              { label: 'Due / paid', key: 'd', render: (i) => <span className="text-ink-3">{i.status === 'paid' ? `Paid ${date(i.paid_at)}${i.provider ? ` · ${i.provider}` : ''}` : date(i.due_at)}</span> },
              { label: '', key: 'x', className: 'text-end', render: (i) => i.status === 'unpaid' && <Button size="sm" variant="primary" onClick={() => { setRef(''); setPaying(i); }}>{tr('Mark paid')}</Button> },
            ]} />
            <Pager page={page} total={data.total} limit={25} onChange={setPage} />
          </>
        )}
      </div>
      <Modal open={!!paying} onClose={() => setPaying(null)} title={tr('Confirm payment for {number}', { number: paying?.number })}
        footer={<><Button onClick={() => setPaying(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { await post(`/api/admin/invoices/${paying.id}/mark-paid`, { reference: ref }); setPaying(null); reload(); }, 'Payment recorded, subscription active')}>{tr('Mark paid')}</Button></>}>
        <p className="text-ink-3">{paying?.tenant_name} · {paying && money(paying.amount, paying.currency)}</p>
        <Field label="Bank reference (optional)"><Input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
      </Modal>
    </>
  );
}
