import { useState } from 'react';
import { Link } from 'react-router-dom';
import { patch, post, put, useApi } from '../../lib/api.js';
import { Badge, Button, CopyField, Empty, Field, IconButton, Input, Loading, Modal, PageHeader, Pager, Panel, Select, StatusBadge, Table, Tabs, Textarea, useAction, useToast } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { dateTime, money, phone } from '../../lib/format.js';
import { useSession } from '../../lib/session.jsx';
import { useT } from '../../lib/i18n.jsx';
import { TemplateVariables, emptyVariables } from './Templates.jsx';

export const INVOICE_FIELDS = [
  { value: 'invoice.number', label: 'Invoice number' }, { value: 'invoice.total', label: 'Invoice total' },
  { value: 'invoice.due_date', label: 'Due date' }, { value: 'invoice.link', label: 'Invoice link' },
  { value: 'invoice.token', label: 'Invoice link code (for link buttons)' }, { value: 'invoice.pay_url', label: 'Payment link' },
  { value: 'business.name', label: 'Your business name' },
];
const STATUSES = ['unpaid', 'paid', 'void'];
const STATUS_TEXT = { unpaid: 'Unpaid', paid: 'Paid', void: 'Canceled' };

function WhatsAppState({ inv }) {
  const tr = useT();
  if (inv.send_error) return <span className="inline-flex items-start gap-1 text-danger text-[12px] max-w-[30ch]" title={inv.send_error}><Icon name="x" size={14} className="mt-0.5 shrink-0" />{tr('Not sent')}</span>;
  if (!inv.sent_at) return <span className="text-ink-3 text-[12px]">—</span>;
  const s = inv.message_status || 'sent';
  return <span className="inline-flex items-center gap-1 text-[12px]"><Icon name={s === 'read' ? 'checks' : 'check'} size={14} className={s === 'read' ? 'text-signal' : 'text-ink-3'} />{tr({ sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Failed' }[s] || 'Sent')}</span>;
}

const blankInvoice = () => ({
  number: `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`,
  phone: '', name: '', due_date: '', pay_url: '', notes: '', currency: 'KWD', items: [{ name: '', quantity: 1, price: '' }],
});

function NewInvoice({ open, onClose, onDone }) {
  const tr = useT();
  const toast = useToast();
  const [f, setF] = useState(blankInvoice);
  const [run, busy] = useAction();
  const total = f.items.reduce((a, it) => a + (+it.quantity || 0) * (+it.price || 0), 0);
  const setItem = (i, k, v) => setF({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });
  const submit = () => run(async () => {
    const items = f.items.filter((it) => it.name.trim()).map((it) => ({ name: it.name.trim(), quantity: +it.quantity || 1, price: +it.price || 0 }));
    if (!items.length) throw new Error(tr('Add at least one item.'));
    const r = await post('/api/app/invoices', { ...f, items, due_date: f.due_date || undefined, pay_url: f.pay_url || undefined });
    if (r.whatsapp?.sent) toast(tr('Invoice {number} sent on WhatsApp.', { number: r.number }));
    else toast(tr('Invoice saved but not sent: {reason}', { reason: tr(r.whatsapp?.error || '') }), 'error');
    setF(blankInvoice()); onDone();
  });
  return (
    <Modal open={open} onClose={onClose} title={tr('New invoice')} width={640}
      footer={<><Button onClick={onClose}>{tr('Cancel')}</Button><Button variant="primary" icon="send" loading={busy} onClick={submit}>{tr('Send on WhatsApp')}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Customer WhatsApp"><Input dir="ltr" placeholder="+965 5xxx xxxx" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Customer name"><Input dir="auto" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Invoice number"><Input dir="ltr" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>
        <Field label="Due date" hint="Optional"><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
      </div>
      <div className="mt-4">
        <div className="grid grid-cols-[1fr_64px_96px_32px] gap-2 text-[12px] text-ink-3 mb-1 px-0.5"><span>{tr('Item')}</span><span>{tr('Qty')}</span><span>{tr('Price')}</span><span /></div>
        {f.items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_64px_96px_32px] gap-2 mb-2">
            <Input dir="auto" aria-label={tr('Item')} value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} />
            <Input type="number" min="1" aria-label={tr('Qty')} value={it.quantity} onChange={(e) => setItem(i, 'quantity', e.target.value)} />
            <Input type="number" step="0.001" min="0" aria-label={tr('Price')} value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} />
            <IconButton icon="trash" label="Remove" disabled={f.items.length === 1} onClick={() => setF({ ...f, items: f.items.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <div className="flex justify-between items-center">
          <Button size="sm" variant="ghost" icon="plus" onClick={() => setF({ ...f, items: [...f.items, { name: '', quantity: 1, price: '' }] })}>{tr('Add item')}</Button>
          <p className="font-semibold tabular-nums">{tr('Total')}: <span dir="ltr">{money(total, f.currency)}</span></p>
        </div>
      </div>
      <div className="grid gap-3 mt-4">
        <Field label="Payment link" hint="Optional. Shown as a Pay now button on the invoice page."><Input dir="ltr" placeholder="https://" value={f.pay_url} onChange={(e) => setF({ ...f, pay_url: e.target.value })} /></Field>
        <Field label="Notes" hint="Optional"><Textarea rows={2} dir="auto" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function InvoiceList({ ready, onSetup }) {
  const tr = useT();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data, reload } = useApi(`/api/app/invoices?page=${page}${status ? `&status=${status}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
  const [open, setOpen] = useState(false);
  const [run] = useAction();
  return (
    <>
      {ready === false && (
        <div className="mb-4 rounded-lg border border-amber/40 bg-amber-wash px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <p className="text-[13px] text-[#7a4d0c] max-w-[70ch]">{tr('WhatsApp only lets you message customers who have not written to you in the last 24 hours with an approved template. Set up your invoice message so every invoice is delivered.')}</p>
          <Button size="sm" variant="dark" onClick={onSetup}>{tr('Set up invoice message')}</Button>
        </div>
      )}
      <div className="bg-white border border-line rounded-lg">
        <div className="flex flex-wrap justify-between gap-2 p-3 border-b border-line">
          <div className="flex flex-wrap gap-2">
            <Input className="!w-56" placeholder={tr('Search number, name or phone')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            <Select className="!w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder={tr('All statuses')} options={STATUSES.map((s) => ({ value: s, label: STATUS_TEXT[s] }))} />
          </div>
          <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>{tr('New invoice')}</Button>
        </div>
        {!data ? <Loading /> : (
          <>
            <Table rows={data.data}
              empty={<Empty icon="receipt" title={tr('No invoices yet')} body="Create one here, or connect your POS or website so every invoice is sent to the customer on WhatsApp automatically." />}
              columns={[
                { label: 'Invoice', key: 'n', render: (i) => <div><p className="font-medium" dir="ltr">{i.number}</p><p className="text-ink-3 text-[12px]">{tr(i.source === 'api' ? 'From your system' : 'Created here')}</p></div> },
                { label: 'Customer', key: 'c', render: (i) => <div><p dir="auto">{i.contact_name || '—'}</p><p className="text-ink-3 text-[12px]" dir="ltr">{phone(i.wa_id)}</p></div> },
                { label: 'Total', key: 't', render: (i) => <span className="tabular-nums" dir="ltr">{money(i.total, i.currency)}</span> },
                { label: 'Status', key: 's', render: (i) => (
                  <Select className="!w-32 !py-1 text-[13px]" value={i.status} aria-label={tr('Status')}
                    onChange={(e) => run(async () => { await patch(`/api/app/invoices/${i.id}`, { status: e.target.value }); reload(); }, 'Invoice updated')}
                    options={STATUSES.map((s) => ({ value: s, label: STATUS_TEXT[s] }))} />
                ) },
                { label: 'WhatsApp', key: 'w', render: (i) => <WhatsAppState inv={i} /> },
                { label: 'Date', key: 'd', render: (i) => <span className="text-ink-3 whitespace-nowrap">{dateTime(i.created_at)}</span> },
                { label: '', key: 'x', className: 'text-end', render: (i) => (
                  <span className="inline-flex">
                    <a href={i.link} target="_blank" rel="noreferrer" className="w-8 h-8 grid place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-paper" title={tr('Open invoice page')} aria-label={tr('Open invoice page')}><Icon name="link" size={16} /></a>
                    <IconButton icon="send" label={tr('Send again')} onClick={() => run(async () => {
                      const r = await post(`/api/app/invoices/${i.id}/send`); reload();
                      if (!r.whatsapp?.sent) throw new Error(tr(r.whatsapp?.error || 'Message failed'));
                    }, 'Invoice sent on WhatsApp')} />
                  </span>
                ) },
              ]} />
            <Pager page={page} total={data.total} limit={25} onChange={setPage} />
          </>
        )}
      </div>
      <NewInvoice open={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />
    </>
  );
}

function MessageSetup({ event, title, body, current, templates, onSaved, recommended }) {
  const tr = useT();
  const [form, setForm] = useState(null);
  const [run, busy] = useAction();
  const tpl = templates?.find((t) => String(t.id) === String(form?.templateId));
  return (
    <Panel title={tr(title)} actions={current && <Badge tone={current.template_status === 'APPROVED' ? 'green' : 'amber'}>{tr(current.template_status === 'APPROVED' ? 'On' : 'Waiting for Meta approval')}</Badge>}>
      <p className="text-ink-3 text-[13px] mb-4 max-w-[70ch]">{tr(body)}</p>
      {current && !form && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-paper px-3 py-2.5 mb-4">
          <p className="text-[13px]">{tr('Template')}: <span className="font-mono">{current.template_name}</span> <span className="text-ink-3">({current.template_language})</span>{current.runs ? <span className="text-ink-3"> · {tr('{n} sent', { n: current.runs })}</span> : null}</p>
          <span className="inline-flex gap-2">
            <Button size="sm" onClick={() => setForm({ templateId: String(current.template_id), variables: current.variables })}>{tr('Change')}</Button>
            <Button size="sm" variant="ghost" loading={busy} onClick={() => run(async () => { await put(`/api/app/invoices-setup/${event}`, { templateId: null }); onSaved(); }, 'Turned off')}>{tr('Turn off')}</Button>
          </span>
        </div>
      )}
      {!current && !form && (
        <div className="flex flex-wrap gap-2">
          {recommended && <>
            <Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/app/invoices-setup/recommended', { language: 'en' }); onSaved(); }, 'Template sent to Meta for approval')}>{tr('Use ready-made template (English)')}</Button>
            <Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/app/invoices-setup/recommended', { language: 'ar' }); onSaved(); }, 'Template sent to Meta for approval')}>{tr('Use ready-made template (Arabic)')}</Button>
          </>}
          <Button onClick={() => setForm({ templateId: '', variables: {} })}>{tr('Choose one of my templates')}</Button>
        </div>
      )}
      {recommended && !current && !form && (
        <div className="mt-4 rounded-md bg-[#e7f6ec] p-3 max-w-[420px]">
          <p className="text-[13px] whitespace-pre-line">{tr('Hello Ahmad, your invoice INV-1042 from {business} is ready.\nTotal: 12.500 KWD', { business: tr('your business') })}</p>
          <p className="mt-2 pt-2 border-t border-black/10 text-center text-[13px] text-[#1f7aec] font-medium inline-flex w-full justify-center gap-1"><Icon name="link" size={14} />{tr('View invoice')}</p>
          <p className="text-[11px] text-ink-3 mt-2">{tr('Meta usually approves this utility template within minutes.')}</p>
        </div>
      )}
      {form && (
        <div className="space-y-3">
          <Field label="Send template">
            <Select value={form.templateId} placeholder={tr('Choose…')} onChange={(e) => { const t = templates.find((x) => String(x.id) === e.target.value); setForm({ templateId: e.target.value, variables: t ? emptyVariables(t) : {} }); }}
              options={(templates || []).map((t) => ({ value: String(t.id), label: `${t.name} (${t.language})` }))} />
          </Field>
          {tpl && <TemplateVariables template={tpl} value={form.variables} onChange={(v) => setForm({ ...form, variables: v })} extraFields={INVOICE_FIELDS} />}
          {tpl && <p className="text-[12px] text-ink-3">{tr('For a "View invoice" link button, make the button URL end with {{1}} and fill it with "Invoice link code". For a PDF header, leave the link empty and send pdf_url from your system.')}</p>}
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setForm(null)}>{tr('Cancel')}</Button>
            <Button variant="primary" loading={busy} disabled={!tpl} onClick={() => run(async () => { await put(`/api/app/invoices-setup/${event}`, form); setForm(null); onSaved(); }, 'Saved')}>{tr('Save')}</Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Setup({ setup, reload }) {
  const templates = useApi('/api/app/templates?status=APPROVED');
  if (!setup) return <Loading />;
  const byEvent = Object.fromEntries(setup.data.map((a) => [a.event, a]));
  return (
    <div className="space-y-6">
      <MessageSetup event="invoice.created" title="New invoice" recommended current={byEvent['invoice.created']} templates={templates.data} onSaved={reload}
        body="Sent the moment an invoice is created here or by your POS or website. It works even if the customer never messaged you." />
      <MessageSetup event="invoice.paid" title="Payment received (optional)" current={byEvent['invoice.paid']} templates={templates.data} onSaved={reload}
        body="Sent when an invoice is marked paid. Leave it off if you don't need a payment confirmation." />
    </div>
  );
}

function Connect() {
  const tr = useT();
  const { me } = useSession();
  const hasApi = me.plan?.features?.api !== false;
  const base = window.location.origin;
  const create = `curl -X POST ${base}/api/v1/invoices \\
  -H "X-API-Key: wsk_…" -H "Content-Type: application/json" \\
  -d '{
    "number": "INV-1042",
    "phone": "+96550000000",
    "name": "Ahmad",
    "currency": "KWD",
    "items": [{ "name": "Latte", "quantity": 2, "price": 1.750 }],
    "due_date": "2026-11-30",
    "pdf_url": "https://your-pos.com/invoices/INV-1042.pdf",
    "pay_url": "https://your-shop.com/pay/INV-1042"
  }'`;
  const paid = `curl -X PATCH ${base}/api/v1/invoices/INV-1042 \\
  -H "X-API-Key: wsk_…" -H "Content-Type: application/json" \\
  -d '{ "status": "paid" }'`;
  const fields = [
    ['number', 'Required. Your invoice number. Sending the same number again will not send a duplicate.'],
    ['phone', 'Required. Customer WhatsApp number, with country code.'],
    ['total', 'Optional when items are sent; calculated from items.'],
    ['items', 'Optional list of { name, quantity, price }.'],
    ['pdf_url', 'Optional https link to your PDF. Sent as a document when possible.'],
    ['pay_url', 'Optional payment link, shown as Pay now on the invoice page.'],
    ['due_date', 'Optional, as YYYY-MM-DD.'],
    ['resend', 'Optional. true sends an existing invoice number again.'],
  ];
  if (!hasApi) {
    return <Empty icon="key" title={tr('Connecting your POS needs API access')} body="API access is included in the Growth and Business plans. You can still create and send invoices from this page." action={<Link to="/app/billing"><Button variant="primary">{tr('See plans')}</Button></Link>} />;
  }
  return (
    <div className="space-y-6">
      <Panel title={tr('1. Create an API key')}>
        <p className="text-[13px] text-ink-2">{tr('Create a key in Settings → API & webhooks, then give it to your POS or website developer. Keep it secret: anyone with it can send messages as your business.')}</p>
        <Link to="/app/settings?tab=dev" className="inline-block mt-3"><Button size="sm">{tr('Open API keys')}</Button></Link>
      </Panel>
      <Panel title={tr('2. Send each new invoice')}>
        <p className="text-[13px] text-ink-2 mb-3">{tr('When your system creates an invoice, it sends this request. The customer receives it on WhatsApp right away, with a link to the invoice page.')}</p>
        <pre className="bg-ink text-white/90 rounded-md p-3 text-[12px] overflow-x-auto" dir="ltr">{create}</pre>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[13px]">
            <tbody>
              {fields.map(([k, v]) => <tr key={k} className="border-b border-line last:border-0"><td className="py-2 pe-4 font-mono text-[12px] align-top whitespace-nowrap" dir="ltr">{k}</td><td className="py-2 text-ink-2">{tr(v)}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-ink-3 mt-3">{tr('The response includes the invoice link and a whatsapp object telling you whether it was sent and, if not, why.')}</p>
      </Panel>
      <Panel title={tr('3. Mark it paid (optional)')}>
        <pre className="bg-ink text-white/90 rounded-md p-3 text-[12px] overflow-x-auto" dir="ltr">{paid}</pre>
        <p className="text-[12px] text-ink-3 mt-2">{tr('Also available: GET /api/v1/invoices/:number and POST /api/v1/invoices/:number/send.')}</p>
      </Panel>
      <Panel title={tr('API address')}><CopyField value={`${base}/api/v1`} /></Panel>
    </div>
  );
}

export default function Invoices() {
  const tr = useT();
  const [tab, setTab] = useState('list');
  const setup = useApi('/api/app/invoices-setup');
  const ready = setup.data ? setup.data.data.some((a) => a.event === 'invoice.created' && a.is_active) : null;
  return (
    <>
      <PageHeader title={tr('Invoices')} subtitle="Send invoices to your customers on WhatsApp, from your POS, your website or right here." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'list', label: 'Invoices' }, { value: 'setup', label: 'WhatsApp message' }, { value: 'connect', label: 'Connect your POS or website' }]} />
      {tab === 'list' && <InvoiceList ready={ready} onSetup={() => setTab('setup')} />}
      {tab === 'setup' && <Setup setup={setup.data} reload={setup.reload} />}
      {tab === 'connect' && <Connect />}
    </>
  );
}
