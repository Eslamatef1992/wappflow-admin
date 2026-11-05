import { useState } from 'react';
import { del, patch, post, put, useApi } from '../../lib/api.js';
import { Button, CopyField, Empty, Field, IconButton, Input, Loading, Modal, PageHeader, Pager, Select, StatusBadge, Table, Tabs, Textarea, Toggle, useAction } from '../../components/ui.jsx';
import { dateTime, money, num, phone } from '../../lib/format.js';
import { ORDER_FIELDS, TemplateVariables, emptyVariables } from './Templates.jsx';
import { useT } from '../../lib/i18n.jsx';

const EVENT_LABEL = {
  'order.created': 'Order placed', 'order.paid': 'Payment received', 'order.shipped': 'Order shipped',
  'order.delivered': 'Order delivered', 'order.canceled': 'Order canceled',
};
const STATUSES = ['created', 'paid', 'shipped', 'delivered', 'canceled'];

function Orders() {
  const tr = useT();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, reload } = useApi(`/api/app/orders?page=${page}${status ? `&status=${status}` : ''}`);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ phone: '', name: '', total: '', externalId: '' });
  const [run, busy] = useAction();
  return (
    <div className="bg-white border border-line rounded-lg">
      <div className="flex flex-wrap justify-between gap-2 p-3 border-b border-line">
        <Select className="!w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder={tr('All statuses')} options={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
        <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>{tr('Add order')}</Button>
      </div>
      {!data ? <Loading /> : (
        <>
          <Table rows={data.data}
            empty={<Empty icon="cart" title={tr('No orders yet')} body="Orders arrive from your Shopify or WooCommerce store, the API, or customers' WhatsApp carts." />}
            columns={[
              { label: 'Order', key: 'id', render: (o) => <span className="font-medium">#{o.external_id || o.id}</span> },
              { label: 'Customer', key: 'c', render: (o) => <div><p dir="auto">{o.contact_name || '—'}</p><p className="text-ink-3 text-[12px]" dir="ltr">{phone(o.wa_id)}</p></div> },
              { label: 'Total', key: 't', render: (o) => <span className="tabular-nums">{money(o.total, o.currency)}</span> },
              { label: 'Source', key: 's', render: (o) => <span className="capitalize text-ink-3">{tr(o.source)}</span> },
              { label: 'Status', key: 'st', render: (o) => (
                <Select className="!w-32 !py-1 text-[13px]" value={o.status} onChange={(e) => run(async () => { await patch(`/api/app/orders/${o.id}`, { status: e.target.value }); reload(); }, 'Status updated — matching automations sent')}
                  options={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
              ) },
              { label: 'Date', key: 'd', render: (o) => <span className="text-ink-3">{dateTime(o.created_at)}</span> },
            ]} />
          <Pager page={page} total={data.total} limit={25} onChange={setPage} />
        </>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={tr('Add order')}
        footer={<><Button onClick={() => setOpen(false)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/app/orders', { ...f, total: +f.total }); setOpen(false); reload(); }, 'Order added')}>{tr('Add order')}</Button></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer WhatsApp"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Customer name"><Input dir="auto" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Order number"><Input value={f.externalId} onChange={(e) => setF({ ...f, externalId: e.target.value })} /></Field>
          <Field label="Total (KWD)"><Input type="number" step="0.001" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} /></Field>
        </div>
        <p className="text-ink-3 text-[13px]">{tr('If an "Order placed" automation is on, the customer gets the confirmation template right away.')}</p>
      </Modal>
    </div>
  );
}

function Products() {
  const tr = useT();
  const { data, reload } = useApi('/api/app/products');
  const [edit, setEdit] = useState(null);
  const [run, busy] = useAction();
  const save = () => run(async () => {
    if (edit.id) await put(`/api/app/products/${edit.id}`, edit); else await post('/api/app/products', edit);
    setEdit(null); reload();
  }, 'Product saved');
  return (
    <div className="bg-white border border-line rounded-lg">
      <div className="flex justify-between items-center gap-2 p-3 border-b border-line">
        <p className="text-ink-3 text-[13px] px-1">{tr('Match "Catalog ID" to your Meta Commerce catalog to send product messages and receive WhatsApp carts.')}</p>
        <Button variant="primary" icon="plus" onClick={() => setEdit({ name: '', price: '', currency: 'KWD', is_active: true })}>{tr('Add product')}</Button>
      </div>
      {!data ? <Loading /> : (
        <Table rows={data} onRowClick={setEdit} empty={<Empty icon="cart" title={tr('No products')} body="Add the items you sell so carts and orders show real names." />}
          columns={[
            { label: 'Product', key: 'n', render: (p) => <span className="flex items-center gap-3">{p.image_url ? <img src={p.image_url} alt="" className="w-9 h-9 rounded object-cover" /> : <span className="w-9 h-9 rounded bg-paper" />}<span dir="auto" className="font-medium">{p.name}</span></span> },
            { label: 'Price', key: 'p', render: (p) => <span className="tabular-nums">{money(p.price, p.currency)}</span> },
            { label: 'SKU', key: 's', render: (p) => <span className="font-mono text-[12px]">{p.sku || '—'}</span> },
            { label: 'Catalog ID', key: 'r', render: (p) => <span className="font-mono text-[12px]">{p.retailer_id || '—'}</span> },
            { label: 'Active', key: 'a', render: (p) => (p.is_active ? tr('Yes') : tr('No')) },
          ]} />
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? tr('Edit product') : tr('Add product')}
        footer={<>{edit?.id && <Button variant="danger" className="me-auto" onClick={() => run(async () => { await del(`/api/app/products/${edit.id}`); setEdit(null); reload(); }, 'Product deleted')}>{tr('Delete')}</Button>}<Button onClick={() => setEdit(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} onClick={save}>{tr('Save product')}</Button></>}>
        {edit && <>
          <Field label="Name"><Input dir="auto" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price" className="col-span-2"><Input type="number" step="0.001" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></Field>
            <Field label="Currency"><Select value={edit.currency} onChange={(e) => setEdit({ ...edit, currency: e.target.value })} options={['KWD', 'SAR', 'AED', 'BHD', 'QAR', 'OMR', 'USD']} /></Field>
            <Field label="SKU"><Input value={edit.sku || ''} onChange={(e) => setEdit({ ...edit, sku: e.target.value })} /></Field>
            <Field label="Catalog ID" className="col-span-2"><Input value={edit.retailer_id || ''} onChange={(e) => setEdit({ ...edit, retailer_id: e.target.value })} /></Field>
          </div>
          <Field label="Image link"><Input value={edit.image_url || ''} placeholder={tr('https://…')} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} /></Field>
          <Field label="Description"><Textarea dir="auto" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          <div className="flex items-center gap-2"><Toggle checked={edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} label="Active" /><span>{tr('Active')}</span></div>
        </>}
      </Modal>
    </div>
  );
}

function Automations() {
  const tr = useT();
  const { data, reload } = useApi('/api/app/automations');
  const templates = useApi('/api/app/templates?status=APPROVED');
  const [form, setForm] = useState(null);
  const [run, busy] = useAction();
  const tpl = templates.data?.find((t) => String(t.id) === String(form?.templateId));
  return (
    <>
      <div className="bg-white border border-line rounded-lg">
        <div className="flex justify-between items-center gap-2 p-3 border-b border-line">
          <p className="text-ink-3 text-[13px] px-1">{tr('Send an approved template automatically when an order changes status.')}</p>
          <Button variant="primary" icon="plus" onClick={() => setForm({ event: 'order.created', templateId: '', variables: {} })}>{tr('Add automation')}</Button>
        </div>
        {!data ? <Loading /> : (
          <Table rows={data.data} empty={<Empty icon="zap" title={tr('No automations')} body="A good first one: send an order confirmation the moment an order is placed." />}
            columns={[
              { label: 'When', key: 'e', render: (a) => <span className="font-medium">{EVENT_LABEL[a.event]}</span> },
              { label: 'Send template', key: 't', render: (a) => <span className="font-mono text-[12px]">{a.template_name}</span> },
              { label: 'Sent', key: 'r', render: (a) => <span className="tabular-nums">{num(a.runs)}</span> },
              { label: 'On', key: 'on', render: (a) => <Toggle checked={a.is_active} label="Active" onChange={(v) => run(async () => { await put(`/api/app/automations/${a.id}`, { is_active: v }); reload(); })} /> },
              { label: '', key: 'x', className: 'text-end', render: (a) => <IconButton icon="trash" label="Delete" onClick={() => run(async () => { await del(`/api/app/automations/${a.id}`); reload(); }, 'Automation deleted')} /> },
            ]} />
        )}
      </div>
      <Modal open={!!form} onClose={() => setForm(null)} title={tr('New automation')} width={620}
        footer={<><Button onClick={() => setForm(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} disabled={!tpl} onClick={() => run(async () => { await post('/api/app/automations', form); setForm(null); reload(); }, 'Automation on')}>{tr('Turn on')}</Button></>}>
        {form && <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="When"><Select value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} options={Object.entries(EVENT_LABEL).map(([value, label]) => ({ value, label }))} /></Field>
            <Field label="Send template"><Select value={form.templateId} onChange={(e) => { const t = templates.data.find((x) => String(x.id) === e.target.value); setForm({ ...form, templateId: e.target.value, variables: t ? emptyVariables(t) : {} }); }} placeholder={tr('Choose…')} options={(templates.data || []).map((t) => ({ value: t.id, label: `${t.name} (${t.language})` }))} /></Field>
          </div>
          {tpl && <TemplateVariables template={tpl} value={form.variables} onChange={(v) => setForm({ ...form, variables: v })} extraFields={ORDER_FIELDS} />}
        </>}
      </Modal>
    </>
  );
}

const STORE_HELP = {
  shopify: 'In Shopify admin: Settings → Notifications → Webhooks. Create webhooks for "Order creation", "Order payment", "Order fulfillment" and "Order cancellation" (JSON) pointing to this URL. Paste the signing secret shown at the bottom of that page.',
  woocommerce: 'In WordPress: WooCommerce → Settings → Advanced → Webhooks. Add "Order created" and "Order updated" webhooks pointing to this URL, and use the same secret here.',
};

function Integrations() {
  const tr = useT();
  const { data, reload } = useApi('/api/app/integrations');
  const [form, setForm] = useState(null);
  const [created, setCreated] = useState(null);
  const [run, busy] = useAction();
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {['shopify', 'woocommerce'].map((type) => {
        const list = (data || []).filter((i) => i.type === type);
        return (
          <section key={type} className="bg-white border border-line rounded-lg p-5">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="font-semibold">{type === 'shopify' ? 'Shopify' : 'WooCommerce'}</h3>
                <p className="text-ink-3 text-[13px] mt-1">{tr('Turn store orders into WhatsApp confirmations and shipping updates.')}</p>
              </div>
              <Button size="sm" icon="plus" onClick={() => setForm({ type, name: '', secret: '' })}>{tr('Connect')}</Button>
            </div>
            {list.map((i) => (
              <div key={i.id} className="mt-4 pt-4 border-t border-line space-y-2">
                <div className="flex justify-between items-center"><span className="font-medium">{i.name}</span><IconButton icon="trash" label="Disconnect" onClick={() => run(async () => { await del(`/api/app/integrations/${i.id}`); reload(); }, 'Disconnected')} /></div>
                <CopyField value={i.webhook_url} />
                <p className="text-[12px] text-ink-3">{i.last_event_at ? tr('Last order received {date}', { date: dateTime(i.last_event_at) }) : tr('No orders received yet')}</p>
              </div>
            ))}
          </section>
        );
      })}
      <Modal open={!!form} onClose={() => setForm(null)} title={`Connect ${form?.type === 'shopify' ? 'Shopify' : 'WooCommerce'}`}
        footer={<><Button onClick={() => setForm(null)}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} disabled={!form?.secret} onClick={() => run(async () => { setCreated(await post('/api/app/integrations', form)); setForm(null); reload(); })}>{tr('Create webhook URL')}</Button></>}>
        {form && <>
          <p className="text-[13px] text-ink-3">{STORE_HELP[form.type]}</p>
          <Field label="Store name"><Input value={form.name} placeholder={tr('My store')} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Webhook signing secret"><Input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} /></Field>
        </>}
      </Modal>
      <Modal open={!!created} onClose={() => setCreated(null)} title={tr('Paste this URL in your store')} footer={<Button variant="primary" onClick={() => setCreated(null)}>{tr('Done')}</Button>}>
        {created && <><CopyField value={created.webhook_url} /><p className="text-[13px] text-ink-3">{STORE_HELP[created.type]}</p></>}
      </Modal>
    </div>
  );
}

export default function Commerce() {
  const tr = useT();
  const [tab, setTab] = useState('orders');
  return (
    <>
      <PageHeader title={tr('Commerce')} subtitle="Orders from your store, product catalog and automatic WhatsApp order updates." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'orders', label: 'Orders' }, { value: 'automations', label: 'Order updates' }, { value: 'products', label: 'Products' }, { value: 'stores', label: 'Store connections' }]} />
      {tab === 'orders' && <Orders />}
      {tab === 'products' && <Products />}
      {tab === 'automations' && <Automations />}
      {tab === 'stores' && <Integrations />}
    </>
  );
}
