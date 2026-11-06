import { useState } from 'react';
import { del, patch, post, put, useApi } from '../../lib/api.js';
import { Badge, Button, Field, Input, Loading, Modal, PageHeader, Panel, Select, Table, Textarea, Toggle, useAction } from '../../components/ui.jsx';
import { money, num } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

const LIMITS = [['contacts', 'Contacts'], ['monthly_messages', 'Messages per month'], ['agents', 'Team members'], ['numbers', 'WhatsApp numbers'], ['flows', 'Live chatbots']];
const FEATURES = [['campaigns', 'Campaigns'], ['inbox', 'Team inbox'], ['flows', 'Chatbots'], ['commerce', 'Commerce'], ['api', 'API & webhooks'], ['otp', 'WhatsApp OTP']];
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
      <OtpPacks />
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

/** WhatsApp OTP credit packs that workspaces can buy (on plans that include OTP). */
function OtpPacks() {
  const tr = useT();
  const { data, reload } = useApi('/api/admin/otp-packs');
  const [f, setF] = useState(null);
  const [run, busy] = useAction();
  const save = () => run(async () => {
    const body = { ...f, credits: +f.credits, price: +f.price, sort: +f.sort || 0 };
    if (f.id) await patch(`/api/admin/otp-packs/${f.id}`, body); else await post('/api/admin/otp-packs', body);
    setF(null); reload();
  }, 'Pack saved');
  return (
    <Panel className="mt-6" padded={false} title={tr('WhatsApp OTP credit packs')}
      actions={<Button size="sm" icon="plus" onClick={() => setF({ name: '', name_ar: '', credits: '', price: '', currency: 'KWD', sort: 0, is_active: true })}>{tr('New pack')}</Button>}>
      <p className="px-4 pt-3 text-[13px] text-ink-3">{tr('Workspaces buy these to send verification codes. One credit = one code.')}</p>
      {!data ? <Loading /> : (
        <Table rows={data.data} onRowClick={(p) => setF({ ...p })} columns={[
          { label: 'Pack', key: 'n', render: (p) => <div><p className="font-medium">{p.name}</p>{p.name_ar && <p className="text-ink-3 text-[12px]" dir="rtl">{p.name_ar}</p>}</div> },
          { label: 'Credits', key: 'c', render: (p) => num(p.credits) },
          { label: 'Price', key: 'p', render: (p) => money(p.price, p.currency) },
          { label: 'Per code', key: 'u', render: (p) => <span className="text-ink-3">{money(p.price / p.credits, p.currency)}</span> },
          { label: 'Status', key: 's', render: (p) => <Badge tone={p.is_active ? 'green' : 'gray'}>{tr(p.is_active ? 'On sale' : 'Hidden')}</Badge> },
        ]} />
      )}
      <Modal open={!!f} onClose={() => setF(null)} title={f?.id ? tr('Edit {name}', { name: f.name }) : tr('New pack')}
        footer={<>{f?.id && f.is_active && <Button variant="danger" className="me-auto" onClick={() => run(async () => { await del(`/api/admin/otp-packs/${f.id}`); setF(null); reload(); }, 'Pack hidden')}>{tr('Stop selling')}</Button>}<Button onClick={() => setF(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} onClick={save}>{tr('Save')}</Button></>}>
        {f && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name (English)"><Input dir="ltr" placeholder="2,000 codes" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Name (Arabic)"><Input dir="rtl" placeholder="2,000 رمز" value={f.name_ar || ''} onChange={(e) => setF({ ...f, name_ar: e.target.value })} /></Field>
            <Field label="Credits"><Input type="number" min="1" value={f.credits} onChange={(e) => setF({ ...f, credits: e.target.value })} /></Field>
            <Field label="Price"><Input type="number" step="0.001" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
            <Field label="Currency"><Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} options={['KWD', 'SAR', 'AED', 'BHD', 'QAR', 'OMR', 'USD']} /></Field>
            <Field label="Order"><Input type="number" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} /></Field>
            {f.id && !f.is_active && <label className="col-span-2 flex items-center gap-2 text-[13px]"><Toggle checked={!!f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label={tr('On sale')} />{tr('On sale')}</label>}
          </div>
        )}
      </Modal>
    </Panel>
  );
}
