import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { post, put, useApi } from '../../lib/api.js';
import { Badge, Button, CopyField, Empty, Field, Input, Loading, Modal, PageHeader, Pager, Panel, Select, StatusBadge, Table, Tabs, cx, useAction, useToast } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { dateTime, money, num } from '../../lib/format.js';
import { useT, useLang } from '../../lib/i18n.jsx';

const STATUS_TEXT = { pending: 'Waiting', verified: 'Verified', expired: 'Expired', failed: 'Not sent', blocked: 'Blocked' };
const STATUS_TONE = { pending: 'amber', verified: 'green', expired: 'gray', failed: 'red', blocked: 'red' };

/** Buy credits: pick a pack, then go straight to the card payment page. */
function BuyCredits({ open, onClose, packs }) {
  const tr = useT();
  const { lang } = useLang();
  const [packId, setPackId] = useState(null);
  const [run, busy] = useAction();
  const chosen = packs.find((p) => p.id === packId) || packs[1] || packs[0];
  const pay = () => run(async () => {
    const inv = await post('/api/app/otp/buy', { packId: chosen.id });
    const { url } = await post(`/api/app/billing/invoices/${inv.id}/pay`, {});
    window.location.href = url;
  });
  return (
    <Modal open={open} onClose={onClose} title={tr('Buy OTP credits')} width={520}>
      <p className="text-[13px] text-ink-2 mb-4">{tr('One credit sends one verification code. Credits never expire.')}</p>
      <div className="grid gap-2" role="radiogroup" aria-label={tr('Credit packs')}>
        {packs.map((p) => {
          const on = chosen?.id === p.id;
          return (
            <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPackId(p.id)}
              className={cx('flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-start transition-colors', on ? 'border-signal bg-signal/5 ring-1 ring-signal' : 'border-line hover:border-ink-3')}>
              <span>
                <span className="block font-semibold">{lang === 'ar' && p.name_ar ? p.name_ar : p.name}</span>
                <span className="block text-[12px] text-ink-3" dir="ltr">{tr('{price} per code', { price: money(p.price / p.credits, p.currency) })}</span>
              </span>
              <span className="text-[18px] font-semibold tabular-nums" dir="ltr">{money(p.price, p.currency)}</span>
            </button>
          );
        })}
      </div>
      <Button variant="primary" icon="card" className="w-full h-11 mt-4" loading={busy} disabled={!chosen} onClick={pay}>{tr('Pay with Visa / Mastercard')}</Button>
      <p className="text-[12px] text-ink-3 mt-2">{tr('The credits are added as soon as the payment goes through.')}</p>
    </Modal>
  );
}

function Activity() {
  const tr = useT();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data } = useApi(`/api/app/otp/activity?page=${page}${status ? `&status=${status}` : ''}`);
  return (
    <div className="bg-white border border-line rounded-lg">
      <div className="p-3 border-b border-line flex justify-end">
        <Select className="!w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder={tr('All statuses')}
          options={Object.entries(STATUS_TEXT).map(([value, label]) => ({ value, label }))} />
      </div>
      {!data ? <Loading /> : (
        <>
          <Table rows={data.data} empty={<Empty icon="shield" title={tr('No codes sent yet')} body="Codes your app sends through the API appear here, with whether the customer entered them." />}
            columns={[
              { label: 'Phone', key: 'p', render: (o) => <span dir="ltr" className="tabular-nums">{o.phone}</span> },
              { label: 'Status', key: 's', render: (o) => <span title={o.error || ''}><Badge tone={STATUS_TONE[o.status]}>{tr(STATUS_TEXT[o.status] || o.status)}</Badge></span> },
              { label: 'Tries', key: 'a', render: (o) => o.attempts },
              { label: 'Reference', key: 'r', render: (o) => <span className="text-ink-3 text-[12px]">{o.reference || '—'}</span> },
              { label: 'Sent', key: 'c', render: (o) => <span className="text-ink-3 whitespace-nowrap">{dateTime(o.created_at)}</span> },
            ]} />
          <Pager page={page} total={data.total} limit={25} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function Setup({ data, reload }) {
  const tr = useT();
  const [run, busy] = useAction();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const s = data.setup;
  const approved = s?.template_status === 'APPROVED';
  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="space-y-6">
        <Panel title={tr('1. OTP template')} actions={s && <Badge tone={approved ? 'green' : 'amber'}>{tr(approved ? 'Approved' : 'Waiting for Meta approval')}</Badge>}>
          <p className="text-[13px] text-ink-2 mb-4 max-w-[60ch]">{tr('WhatsApp only delivers verification codes with an approved authentication template. Meta writes the text; you only choose the language.')}</p>
          {s && <p className="text-[13px] mb-4">{tr('Template')}: <span className="font-mono">{s.template_name}</span> <span className="text-ink-3">({s.template_language})</span></p>}
          <div className="flex flex-wrap gap-2">
            <Button variant={s ? 'secondary' : 'primary'} loading={busy} onClick={() => run(async () => { await post('/api/app/otp/setup/recommended', { language: 'en' }); reload(); }, 'Template sent to Meta for approval')}>{tr('Use the English template')}</Button>
            <Button variant={s ? 'secondary' : 'primary'} loading={busy} onClick={() => run(async () => { await post('/api/app/otp/setup/recommended', { language: 'ar' }); reload(); }, 'Template sent to Meta for approval')}>{tr('Use the Arabic template')}</Button>
          </div>
          {data.templates.length > 1 && (
            <Field label={tr('Or choose one of your authentication templates')} className="mt-4 max-w-sm">
              <Select value={s?.template_id ? String(s.template_id) : ''} placeholder={tr('Choose…')}
                onChange={(e) => run(async () => { await put('/api/app/otp/setup', { templateId: +e.target.value }); reload(); }, 'Saved')}
                options={data.templates.map((t) => ({ value: String(t.id), label: `${t.name} (${t.language}) · ${t.status}` }))} />
            </Field>
          )}
        </Panel>
        <Panel title={tr('2. Send yourself a test code')}>
          <p className="text-[13px] text-ink-2 mb-3">{tr('Uses 1 credit. The code is sent to the number you enter, exactly as your customers will receive it.')}</p>
          <div className="flex flex-wrap gap-2">
            <Input className="!w-60" dir="ltr" placeholder="+965 5xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label={tr('WhatsApp number')} />
            <Button icon="send" loading={busy} disabled={!phone || !approved}
              onClick={() => run(async () => { await post('/api/app/otp/test', { phone }); toast(tr('Code sent. Check WhatsApp.')); reload(); })}>{tr('Send test code')}</Button>
          </div>
          {!approved && <p className="text-[12px] text-ink-3 mt-2">{tr('Available once the template is approved.')}</p>}
        </Panel>
        <Panel title={tr('3. Connect your app')}>
          <p className="text-[13px] text-ink-2">{tr('Give your developer an API key and the instructions in the API tab.')}</p>
        </Panel>
      </div>
      <div className="rounded-xl bg-[#efeae2] p-4" aria-label={tr('Preview')}>
        <p className="text-[12px] text-ink-3 mb-2">{tr('What your customer receives')}</p>
        <div className="bg-white rounded-lg shadow-sm max-w-[280px]">
          <p className="px-3 pt-2.5 text-[14px]"><b dir="ltr">482913</b> {tr('is your verification code. For your security, do not share this code.')}</p>
          <p className="px-3 pt-1 pb-2 text-[12px] text-ink-3">{tr('This code expires in 10 minutes.')}</p>
          <p className="border-t border-line py-2 text-center text-[13px] font-medium text-[#1f7aec] inline-flex w-full justify-center gap-1.5"><Icon name="copy" size={14} />{tr('Copy code')}</p>
        </div>
      </div>
    </div>
  );
}

function ApiDocs() {
  const tr = useT();
  const base = window.location.origin;
  const send = `curl -X POST ${base}/api/v1/otp/send \\
  -H "X-API-Key: wsk_…" -H "Content-Type: application/json" \\
  -d '{ "phone": "+96550000000", "reference": "user-42" }'`;
  const sendOut = `{ "id": 812, "status": "sent", "expires_at": 1762430400000, "credits_left": 1499 }`;
  const verify = `curl -X POST ${base}/api/v1/otp/verify \\
  -H "X-API-Key: wsk_…" -H "Content-Type: application/json" \\
  -d '{ "phone": "+96550000000", "code": "482913" }'`;
  const verifyOut = `{ "valid": true, "reference": "user-42" }
{ "valid": false, "reason": "invalid_code", "attempts_left": 4 }`;
  const pre = 'bg-ink text-white/90 rounded-md p-3 text-[12px] overflow-x-auto';
  const options = [
    ['phone', 'Required. The customer\'s WhatsApp number with country code.'],
    ['length', 'Optional. 4 to 8 digits (default 6).'],
    ['expiry_minutes', 'Optional. 1 to 60 (default 10).'],
    ['language', 'Optional. en or ar, if you set up both templates.'],
    ['reference', 'Optional. Your own id (user, session…), returned when the code is verified.'],
  ];
  const reasons = [['invalid_code', 'Wrong code. The customer can try again.'], ['expired', 'The code is too old. Send a new one.'], ['too_many_attempts', '5 wrong tries. Send a new code.'], ['already_used', 'The code was already verified.'], ['not_found', 'No code was sent to this number.']];
  return (
    <div className="space-y-6">
      <Panel title={tr('Send a code')}>
        <pre className={pre} dir="ltr">{send}</pre>
        <p className="text-[12px] text-ink-3 mt-2 mb-1">{tr('Response')}</p>
        <pre className={pre} dir="ltr">{sendOut}</pre>
        <table className="w-full text-[13px] mt-4"><tbody>
          {options.map(([k, v]) => <tr key={k} className="border-b border-line last:border-0"><td className="py-2 pe-4 font-mono text-[12px] align-top whitespace-nowrap" dir="ltr">{k}</td><td className="py-2 text-ink-2">{tr(v)}</td></tr>)}
        </tbody></table>
      </Panel>
      <Panel title={tr('Check the code the customer typed')}>
        <pre className={pre} dir="ltr">{verify}</pre>
        <p className="text-[12px] text-ink-3 mt-2 mb-1">{tr('Response')}</p>
        <pre className={pre} dir="ltr">{verifyOut}</pre>
        <table className="w-full text-[13px] mt-4"><tbody>
          {reasons.map(([k, v]) => <tr key={k} className="border-b border-line last:border-0"><td className="py-2 pe-4 font-mono text-[12px] align-top whitespace-nowrap" dir="ltr">{k}</td><td className="py-2 text-ink-2">{tr(v)}</td></tr>)}
        </tbody></table>
      </Panel>
      <Panel title={tr('Good to know')}>
        <ul className="text-[13px] text-ink-2 space-y-1.5 list-disc ps-5">
          <li>{tr('Each code sent uses 1 credit. If WhatsApp rejects the number, the credit is given back.')}</li>
          <li>{tr('One code per number every 30 seconds, and at most 5 per hour.')}</li>
          <li>{tr('Sending a new code cancels the previous one.')}</li>
          <li>{tr('With no credits left, sending returns HTTP 402. Check the balance with GET /api/v1/otp/balance.')}</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <Link to="/app/settings?tab=dev"><Button size="sm" icon="key">{tr('Create an API key')}</Button></Link>
        </div>
      </Panel>
      <Panel title={tr('API address')}><CopyField value={`${base}/api/v1`} /></Panel>
    </div>
  );
}

export default function Otp() {
  const tr = useT();
  const [q] = useSearchParams();
  const [tab, setTab] = useState('activity');
  const [buying, setBuying] = useState(false);
  const [run, busy] = useAction();
  const { data, reload } = useApi('/api/app/otp');
  if (!data) return <Loading />;
  const low = data.credits < 50;
  const payment = q.get('payment');
  return (
    <>
      <PageHeader title={tr('WhatsApp OTP')} subtitle="Send login and verification codes on WhatsApp from your app or website."
        actions={<Button variant="primary" icon="plus" onClick={() => setBuying(true)}>{tr('Buy credits')}</Button>} />
      {payment === 'success' && <div className="mb-4 rounded-lg border border-signal/30 bg-signal/10 px-4 py-3 text-[13px]">{tr('Payment received. Your credits were added.')}</div>}
      {payment === 'pending' && <div className="mb-4 rounded-lg border border-line bg-white px-4 py-3 text-[13px]">{tr('Your payment is not confirmed yet. If you completed it, the credits appear within a minute.')}</div>}
      {payment === 'canceled' && <div className="mb-4 rounded-lg border border-line bg-white px-4 py-3 text-[13px]">{tr('Payment canceled. You can try again any time.')}</div>}
      {data.openInvoice && (
        <div className="mb-4 rounded-lg border border-amber/40 bg-amber-wash px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-[#7a4d0c]">{tr('Invoice {number} for {credits} credits is waiting for payment.', { number: data.openInvoice.number, credits: num(data.openInvoice.credits) })}</p>
          <Button size="sm" variant="primary" icon="card" loading={busy} onClick={() => run(async () => { const { url } = await post(`/api/app/billing/invoices/${data.openInvoice.id}/pay`, {}); window.location.href = url; })}>
            {tr('Pay {amount}', { amount: money(data.openInvoice.amount, data.openInvoice.currency) })}</Button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className={cx('rounded-lg border px-4 py-3 col-span-2 lg:col-span-1', low ? 'border-amber/50 bg-amber-wash' : 'border-line bg-white')}>
          <p className="text-ink-3 text-[13px]">{tr('Credits left')}</p>
          <p className="text-3xl font-semibold tabular-nums">{num(data.credits)}</p>
          {low && <button type="button" className="text-[12px] font-medium underline text-[#7a4d0c]" onClick={() => setBuying(true)}>{tr(data.credits ? 'Running low. Buy more' : 'Buy credits to start sending')}</button>}
        </div>
        {[['sent', 'Sent (30 days)'], ['verified', 'Verified'], ['failed', 'Not sent']].map(([k, label]) => (
          <div key={k} className="bg-white border border-line rounded-lg px-4 py-3">
            <p className="text-ink-3 text-[13px]">{tr(label)}</p>
            <p className="text-2xl font-semibold tabular-nums">{num(data.stats[k])}</p>
            {k === 'verified' && data.stats.sent > 0 && <p className="text-[12px] text-ink-3">{tr('{pct}% of codes sent', { pct: Math.round((data.stats.verified / data.stats.sent) * 100) })}</p>}
          </div>
        ))}
      </div>
      {!data.setup && (
        <div className="mb-4 rounded-lg border border-line bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-ink-2">{tr('Start by setting up the OTP template. It takes one click.')}</p>
          <Button size="sm" variant="dark" onClick={() => setTab('setup')}>{tr('Set up')}</Button>
        </div>
      )}
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'activity', label: 'Activity' }, { value: 'setup', label: 'Setup' }, { value: 'api', label: 'API' }]} />
      {tab === 'activity' && <Activity />}
      {tab === 'setup' && <Setup data={data} reload={reload} />}
      {tab === 'api' && <ApiDocs />}
      <BuyCredits open={buying} onClose={() => setBuying(false)} packs={data.packs} />
    </>
  );
}
