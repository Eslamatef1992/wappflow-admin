import { useState } from 'react';
import { del, post, put, useApi } from '../../lib/api.js';
import { Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Textarea, Toggle, useAction } from '../../components/ui.jsx';
import { money, num } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

const LIMITS = [['contacts', 'Contacts'], ['monthly_messages', 'Messages per month'], ['agents', 'Team members'], ['numbers', 'WhatsApp numbers'], ['flows', 'Live chatbots']];
const FEATURES = [['campaigns', 'Campaigns'], ['inbox', 'Team inbox'], ['flows', 'Chatbots'], ['commerce', 'Commerce'], ['api', 'API & webhooks']];
const blank = { name: '', description: '', description_ar: '', price_monthly: '', price_yearly: '', currency: 'KWD', sort: 0, is_active: true, limits: {}, features: Object.fromEntries(FEATURES.map(([k]) => [k, true])) };

export default function Plans() {
  const tr = useT();
  const { data, reload } = useApi('/api/admin/plans');
  const [f, setF] = useState(null);
  const [run, busy] = useAction();
  if (!data) return <Loading />;
  const save = () => run(async () => { if (f.id) await put(`/api/admin/plans/${f.id}`, f); else await post('/api/admin/plans', f); setF(null); reload(); }, 'Plan saved');
  const lim = (v) => (v == null || v < 0 ? '∞' : num(v));
  return (
    <>
      <PageHeader title={tr('Plans')} subtitle="What you sell. Limits are enforced automatically in every workspace."
        actions={<Button variant="primary" icon="plus" onClick={() => setF(blank)}>{tr('New plan')}</Button>} />
      <div className="bg-white border border-line rounded-lg">
        <Table rows={data} onRowClick={(p) => setF(p)} columns={[
          { label: 'Plan', key: 'n', render: (p) => <div><p className="font-medium">{p.name}</p><p className="text-ink-3 text-[12px]">{p.is_active ? tr('Visible to customers') : tr('Hidden')}</p></div> },
          { label: 'Monthly', key: 'm', render: (p) => money(p.price_monthly, p.currency) },
          { label: 'Yearly', key: 'y', render: (p) => money(p.price_yearly, p.currency) },
          { label: 'Contacts', key: 'c', render: (p) => lim(p.limits.contacts) },
          { label: 'Messages', key: 'ms', render: (p) => lim(p.limits.monthly_messages) },
          { label: 'Agents', key: 'a', render: (p) => lim(p.limits.agents) },
          { label: 'Workspaces', key: 't', render: (p) => num(p.tenants) },
        ]} />
      </div>
      <Modal open={!!f} onClose={() => setF(null)} title={f?.id ? tr('Edit {name}', { name: f.name }) : tr('New plan')} width={640}
        footer={<>{f?.id && !f.tenants && <Button variant="danger" className="me-auto" onClick={() => run(async () => { await del(`/api/admin/plans/${f.id}`); setF(null); reload(); }, 'Plan deleted')}>{tr('Delete')}</Button>}<Button onClick={() => setF(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} onClick={save}>{tr('Save plan')}</Button></>}>
        {f && <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Currency"><Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} options={['KWD', 'SAR', 'AED', 'BHD', 'QAR', 'OMR', 'USD']} /></Field>
            <Field label="Monthly price"><Input type="number" step="0.001" value={f.price_monthly} onChange={(e) => setF({ ...f, price_monthly: e.target.value })} /></Field>
            <Field label="Yearly price"><Input type="number" step="0.001" value={f.price_yearly} onChange={(e) => setF({ ...f, price_yearly: e.target.value })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Description (English)"><Textarea rows={2} dir="ltr" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <Field label="Description (Arabic)"><Textarea rows={2} dir="rtl" value={f.description_ar || ''} onChange={(e) => setF({ ...f, description_ar: e.target.value })} /></Field>
          </div>
          <div>
            <p className="text-[13px] font-medium mb-2">{tr('Limits')} <span className="text-ink-3 font-normal">{tr('(-1 or empty = unlimited)')}</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LIMITS.map(([k, l]) => <Field key={k} label={l}><Input type="number" value={f.limits[k] ?? ''} onChange={(e) => setF({ ...f, limits: { ...f.limits, [k]: e.target.value } })} /></Field>)}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-medium mb-2">{tr('Included features')}</p>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-[13px]"><Toggle checked={f.features[k] !== false} onChange={(v) => setF({ ...f, features: { ...f.features, [k]: v } })} label={l} />{tr(l)}</label>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="Order on pricing page"><Input type="number" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-[13px] pb-2"><Toggle checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label="Visible" />{tr('Visible to customers')}</label>
          </div>
        </>}
      </Modal>
    </>
  );
}
