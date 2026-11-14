import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { del, patch, post, useApi } from '../../lib/api.js';
import { useSession } from '../../lib/session.jsx';
import { Button, Field, Input, Loading, Meter, Modal, PageHeader, Panel, Select, StatusBadge, Table, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { date, dateTime, money, num } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

export default function Tenant() {
  const tr = useT();
  const { id } = useParams();
  const nav = useNavigate();
  const { impersonate } = useSession();
  const { data, reload } = useApi(`/api/admin/tenants/${id}`);
  const plans = useApi('/api/admin/plans');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [run, busy] = useAction();
  if (!data || !plans.data) return <Loading />;
  const { tenant: t, users, numbers, subscription: sub, invoices, usage } = data;
  const plan = plans.data.find((p) => p.id === t.plan_id);
  const update = (body, msg) => run(async () => { await patch(`/api/admin/tenants/${id}`, body); reload(); }, msg);
  const priceOf = (pid, iv) => { const p = plans.data.find((x) => x.id === +pid); if (!p) return 0; return iv === 'yearly' ? (+p.price_yearly || +p.price_monthly * 12) : +p.price_monthly; };
  const openActivate = () => {
    const pid = t.plan_id || plans.data[0]?.id;
    setForm({ planId: pid, interval: 'monthly', periods: 1, mode: 'periods', until: '', amount: String(priceOf(pid, 'monthly')), reference: '', sendReceipt: true });
    setModal('activate');
  };
  const runningEnd = sub?.status === 'active' && sub.current_period_end > Date.now() ? sub.current_period_end : Date.now();
  const previewEnd = () => {
    if (form.mode === 'until') return form.until ? Date.parse(form.until + 'T12:00:00Z') : null;
    const d = new Date(runningEnd); const n = Math.max(1, +form.periods || 1);
    if (form.interval === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + n); else d.setUTCMonth(d.getUTCMonth() + n);
    return d.getTime();
  };
  const setPlanOrPeriod = (patchF) => { const f = { ...form, ...patchF }; setForm({ ...f, amount: f.mode === 'until' ? f.amount : String(priceOf(f.planId, f.interval) * Math.max(1, +f.periods || 1)) }); };

  return (
    <>
      <PageHeader title={t.name}
        back={<Link to="/admin/tenants" className="text-[13px] text-ink-3 hover:text-ink inline-flex items-center gap-1 mb-2"><Icon name="arrowLeft" size={14} className="rtl:-scale-x-100" />{tr('Workspaces')}</Link>}
        subtitle={<span className="flex items-center gap-2"><StatusBadge status={t.status} /><span>{tr('{plan} · joined {date}', { plan: plan?.name || '', date: date(t.created_at) })}</span></span>}
        actions={<>
          <Button icon="shield" loading={busy} onClick={() => run(async () => { const r = await post(`/api/admin/tenants/${id}/impersonate`); impersonate(r.token); })}>{tr('Open as owner')}</Button>
          <Button variant="primary" icon="check" onClick={openActivate}>{tr('Activate as paid')}</Button>
          {t.status !== 'suspended' && <Button variant="danger" onClick={() => update({ status: 'suspended' }, 'Workspace suspended')}>{tr('Suspend')}</Button>}
        </>} />
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tr('Subscription')}>
          <dl className="grid grid-cols-2 gap-y-2 text-[13px] mb-4">
            <dt className="text-ink-3">{tr('Plan')}</dt>
            <dd><Select className="!py-1" value={t.plan_id || ''} onChange={(e) => update({ planId: +e.target.value }, 'Plan changed')} options={plans.data.map((p) => ({ value: p.id, label: `${p.name} (${money(p.price_monthly, p.currency)})` }))} /></dd>
            <dt className="text-ink-3">{tr('Status')}</dt><dd>{sub ? <StatusBadge status={sub.status} /> : '—'}</dd>
            <dt className="text-ink-3">{tr('Billing')}</dt><dd className="capitalize">{sub?.billing_interval ? tr(sub.billing_interval) : '—'}</dd>
            <dt className="text-ink-3">{tr('Period ends')}</dt><dd>{date(sub?.current_period_end)}</dd>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => update({ extendDays: 14 }, 'Extended by 14 days')}>{tr('Extend 14 days')}</Button>
            <Button size="sm" onClick={() => update({ extendDays: 30 }, 'Extended by 30 days')}>{tr('Extend 30 days')}</Button>
            <Button size="sm" variant="primary" onClick={() => { setForm({ planId: t.plan_id, interval: 'monthly', notes: '' }); setModal('invoice'); }}>{tr('Issue invoice')}</Button>
          </div>
        </Panel>
        <Panel title={tr('Usage this month')}>
          <div className="space-y-3">
            <Meter label="Messages" value={usage.monthly_messages} max={plan?.limits.monthly_messages} />
            <Meter label="Contacts" value={usage.contacts} max={plan?.limits.contacts} />
            <Meter label="Team members" value={usage.agents} max={plan?.limits.agents} />
            <Meter label="Numbers" value={usage.numbers} max={plan?.limits.numbers} />
          </div>
          <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-end gap-3">
            <div className="me-auto">
              <p className="text-ink-3 text-[13px]">{tr('WhatsApp OTP credits')}</p>
              <p className="text-2xl font-semibold tabular-nums">{num(t.otp_credits || 0)}</p>
            </div>
            <Input className="!w-28" type="number" placeholder="500" aria-label={tr('Credits to add')} value={form.credits ?? ''} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
            <Button size="sm" loading={busy} disabled={!+form.credits} onClick={() => run(async () => { await post(`/api/admin/tenants/${id}/credits`, { credits: +form.credits, note: 'admin' }); setForm({ ...form, credits: '' }); reload(); }, 'Credits updated')}>{tr('Add credits')}</Button>
          </div>
          <p className="text-[12px] text-ink-3 mt-1">{tr('Use a negative number to remove credits.')}</p>
        </Panel>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tr('Team')} padded={false}>
          <Table rows={users} columns={[
            { label: 'Name', key: 'n', render: (u) => <div><p className="font-medium">{u.name}</p><p className="text-ink-3 text-[12px]">{u.email}</p></div> },
            { label: 'Role', key: 'r', render: (u) => <span className="capitalize">{tr(u.role)}</span> },
            { label: 'Last seen', key: 'l', render: (u) => <span className="text-ink-3">{dateTime(u.last_seen_at)}</span> },
          ]} />
        </Panel>
        <Panel title={tr('WhatsApp numbers')} padded={false}>
          <Table rows={numbers} empty={<p className="p-4 text-ink-3 text-[13px]">{tr('No numbers connected.')}</p>} columns={[
            { label: 'Number', key: 'n', render: (n) => <span dir="ltr">{n.display_phone}</span> },
            { label: 'Type', key: 'm', render: (n) => <StatusBadge status={n.mode} /> },
            { label: 'Quality', key: 'q', render: (n) => (n.quality_rating ? tr(n.quality_rating.toLowerCase()) : '—') },
          ]} />
        </Panel>
      </div>
      <Panel title={tr('Invoices')} padded={false} className="mb-6">
        <Table rows={invoices} empty={<p className="p-4 text-ink-3 text-[13px]">{tr('No invoices.')}</p>} columns={[
          { label: 'Invoice', key: 'n', render: (i) => i.number },
          { label: 'Amount', key: 'a', render: (i) => money(i.amount, i.currency) },
          { label: 'Status', key: 's', render: (i) => <StatusBadge status={i.status} /> },
          { label: 'Due', key: 'd', render: (i) => date(i.due_at) },
          { label: '', key: 'x', className: 'text-end', render: (i) => i.status === 'unpaid' && (
            <span className="inline-flex gap-1">
              <Button size="sm" variant="primary" onClick={() => run(async () => { await post(`/api/admin/invoices/${i.id}/mark-paid`); reload(); }, 'Marked paid, workspace active')}>{tr('Mark paid')}</Button>
              <Button size="sm" variant="ghost" onClick={() => run(async () => { await post(`/api/admin/invoices/${i.id}/void`); reload(); })}>{tr('Void')}</Button>
            </span>
          ) },
        ]} />
      </Panel>
      <Panel title={tr('Danger zone')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-ink-3">{tr('Deleting removes all contacts, messages and settings of this workspace permanently.')}</p>
          <Button variant="danger" icon="trash" onClick={() => { setForm({ confirm: '' }); setModal('delete'); }}>{tr('Delete workspace')}</Button>
        </div>
      </Panel>

      <Modal open={modal === 'invoice'} onClose={() => setModal(null)} title={tr('Issue invoice')}
        footer={<><Button onClick={() => setModal(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/admin/invoices', { tenantId: +id, ...form }); setModal(null); reload(); }, 'Invoice issued')}>{tr('Issue invoice')}</Button></>}>
        <Field label="Plan"><Select value={form.planId || ''} onChange={(e) => setForm({ ...form, planId: +e.target.value })} options={plans.data.map((p) => ({ value: p.id, label: p.name }))} /></Field>
        <Field label="Billing period"><Select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} /></Field>
        <Field label="Note (optional)"><Input value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </Modal>
      <Modal open={modal === 'activate'} onClose={() => setModal(null)} title={tr('Activate as paid')}
        footer={<><Button onClick={() => setModal(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} disabled={form.mode === 'until' && !form.until} onClick={() => run(async () => {
          await post(`/api/admin/tenants/${id}/activate`, { planId: +form.planId, interval: form.interval, periods: form.mode === 'periods' ? +form.periods : undefined, until: form.mode === 'until' ? form.until : undefined, amount: form.amount === '' ? 0 : +form.amount, reference: form.reference, sendReceipt: form.sendReceipt });
          setModal(null); reload();
        }, 'Workspace activated')}>{tr('Activate workspace')}</Button></>}>
        <p className="text-[13px] text-ink-3 mb-4">{tr('For customers who paid by cash, KNET or bank transfer, or for a free account. The workspace unlocks right away: it can connect a real WhatsApp number and send messages.')}</p>
        <Field label="Plan"><Select value={form.planId || ''} onChange={(e) => setPlanOrPeriod({ planId: +e.target.value })} options={plans.data.map((p) => ({ value: p.id, label: `${p.name} · ${money(p.price_monthly, p.currency)} / ${tr('month')}` }))} /></Field>
        <Field label="How long">
          <div className="flex flex-wrap gap-2">
            {[['periods', 'Number of months / years'], ['until', 'Until a date']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setPlanOrPeriod({ mode: v })} className={`px-3 h-9 rounded-lg border text-[13px] ${form.mode === v ? 'bg-ink text-white border-ink' : 'border-line hover:bg-paper'}`}>{tr(l)}</button>
            ))}
          </div>
        </Field>
        {form.mode === 'periods' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Count"><Input type="number" min="1" max="36" value={form.periods ?? 1} onChange={(e) => setPlanOrPeriod({ periods: e.target.value })} /></Field>
            <Field label="Billing period"><Select value={form.interval} onChange={(e) => setPlanOrPeriod({ interval: e.target.value })} options={[{ value: 'monthly', label: tr('Monthly') }, { value: 'yearly', label: tr('Yearly') }]} /></Field>
          </div>
        ) : (
          <Field label="Active until"><Input type="date" value={form.until || ''} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, until: e.target.value })} /></Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount received" hint={tr('0 for a free account')}><Input type="number" min="0" step="0.001" value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <Field label="Payment reference (optional)"><Input placeholder="KNET 5521 / cash" value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-[13px] mb-3"><input type="checkbox" checked={!!form.sendReceipt} onChange={(e) => setForm({ ...form, sendReceipt: e.target.checked })} />{tr('Email the owner a receipt')}</label>
        {previewEnd() && <p className="rounded-lg bg-paper p-3 text-[13px]">{tr('Active until {date}', { date: date(previewEnd()) })}{+form.amount > 0 ? ` · ${money(+form.amount, plans.data.find((p) => p.id === +form.planId)?.currency || 'KWD')}` : ` · ${tr('free')}`}</p>}
      </Modal>
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title={tr('Delete workspace')}
        footer={<><Button onClick={() => setModal(null)}>{tr('Cancel')}</Button><Button variant="dark" className="!bg-danger" loading={busy} disabled={form.confirm !== t.slug} onClick={() => run(async () => { await del(`/api/admin/tenants/${id}`, { confirm: form.confirm }); nav('/admin/tenants'); }, 'Workspace deleted')}>{tr('Delete permanently')}</Button></>}>
        <Field label={`Type "${t.slug}" to confirm`}><Input value={form.confirm || ''} onChange={(e) => setForm({ confirm: e.target.value })} /></Field>
      </Modal>
    </>
  );
}
