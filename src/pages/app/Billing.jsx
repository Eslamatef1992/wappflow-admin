import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { post, useApi } from '../../lib/api.js';
import { useSession } from '../../lib/session.jsx';
import { Button, Loading, Meter, Modal, PageHeader, Panel, StatusBadge, Table, cx, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { date, money, num } from '../../lib/format.js';
import { useT, useLang } from '../../lib/i18n.jsx';

const LIMIT_LABEL = { contacts: 'contacts', monthly_messages: 'messages / month', agents: 'team members', numbers: 'WhatsApp numbers', flows: 'live chatbots' };
const FEATURE_LABEL = { campaigns: 'Broadcast campaigns', inbox: 'Team inbox', flows: 'Chatbot builder', commerce: 'Store orders & automations', api: 'API & webhooks' };
const lim = (v) => (v == null || v < 0 ? 'Unlimited' : num(v));

export default function Billing() {
  const tr = useT();
  const { lang } = useLang();
  const { refresh } = useSession();
  const { data, reload } = useApi('/api/app/billing');
  const [interval, setInterval_] = useState('monthly');
  const [run, busy] = useAction();
  const [payFor, setPayFor] = useState(null); // invoice waiting for the customer to pick a payment method
  const [q] = useSearchParams();
  if (!data) return <Loading />;
  const { plan, subscription: sub, usage, invoices, plans, tenant } = data;
  const unpaid = invoices.find((i) => i.status === 'unpaid');

  const methods = data.paymentMethods || {};
  const online = ['card', 'paypal', 'tap'].filter((m) => methods[m]);
  // picking a plan goes straight to payment: one method → redirect, several → choose in a popup
  const choose = (p) => run(async () => {
    const inv = await post('/api/app/billing/subscribe', { planId: p.id, interval });
    await reload(); await refresh();
    if (online.length === 1) { const { url } = await post(`/api/app/billing/invoices/${inv.id}/pay`, { method: online[0] }); window.location.href = url; return; }
    if (online.length) setPayFor({ ...inv, plan: p });
  }, online.length ? undefined : 'Invoice created. Pay it to activate the plan.');
  const pay = (inv, method) => run(async () => { const { url } = await post(`/api/app/billing/invoices/${inv.id}/pay`, { method }); window.location.href = url; });
  const check = (inv) => run(async () => {
    const r = await post(`/api/app/billing/invoices/${inv.id}/check`);
    if (!r.paid) throw new Error(tr('We could not find a completed payment for this invoice yet.'));
    await reload(); await refresh();
  }, 'Payment received. Thank you, your plan is active.');
  const quote = unpaid && data.paypalQuotes?.[unpaid.id];

  return (
    <>
      <PageHeader title={tr('Plan & billing')} />
      {q.get('payment') === 'success' && <div className="mb-4 rounded-md bg-signal-wash text-signal-deep px-4 py-3">{tr('Payment received. Thank you, your plan is active.')}</div>}
      {q.get('payment') === 'pending' && unpaid && <div className="mb-4 rounded-md bg-amber-wash text-[#7a4d0c] px-4 py-3">{tr('Your payment is not confirmed yet. If you completed it on PayPal, use "I already paid" below in a minute.')}</div>}
      {q.get('payment') === 'canceled' && <div className="mb-4 rounded-md bg-paper border border-line text-ink-2 px-4 py-3">{tr('Payment canceled. You can try again any time.')}</div>}
      {unpaid && (
        <div className="mb-6 rounded-lg border border-amber/40 bg-amber-wash p-4 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <p className="font-semibold">{tr('Invoice {number}', { number: unpaid.number })} · {money(unpaid.amount, unpaid.currency)}</p>
            <p className="text-[13px] text-[#7a4d0c]">{tr('Due {date}.', { date: date(unpaid.due_at) })} {unpaid.notes}</p>
          </div>
          {data.onlinePayments ? (
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <div className="flex flex-wrap gap-2">
                {methods.card && <Button variant="primary" icon="card" loading={busy} onClick={() => pay(unpaid, 'card')}>{tr('Pay with Visa / Mastercard')}</Button>}
                {methods.paypal && <Button variant="dark" loading={busy} onClick={() => pay(unpaid, 'paypal')}>{tr('Pay with PayPal')}</Button>}
                {methods.tap && <Button variant={methods.card ? 'secondary' : 'primary'} icon="card" loading={busy} onClick={() => pay(unpaid, 'tap')}>{tr('Pay with KNET or card')}</Button>}
              </div>
              {methods.paypal && quote?.converted && (
                <p className="text-[12px] text-[#7a4d0c]">{tr('Card and PayPal payments are charged {amount} (converted from {original}).', { amount: `${quote.value} ${quote.currency}`, original: money(unpaid.amount, unpaid.currency) })}</p>
              )}
              {unpaid.provider === 'paypal' && <button className="text-[12px] underline text-[#7a4d0c]" onClick={() => check(unpaid)}>{tr('I already paid')}</button>}
            </div>
          ) : <p className="text-[13px] max-w-[48ch]">{data.bankDetails || tr('Online payment is not switched on yet. Contact us to pay this invoice and we will activate your plan.')}</p>}
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-8">
        <Panel title={tr('Current plan')}>
          <div className="flex flex-wrap items-baseline gap-3 mb-1">
            <p className="text-2xl font-semibold">{plan?.name || 'No plan'}</p>
            <StatusBadge status={tenant.status} />
          </div>
          <p className="text-ink-3 text-[13px] mb-5">
            {tenant.status === 'trial' ? tr('Free trial until {date}', { date: date(tenant.trial_ends_at) }) : sub ? tr('{interval} · renews {date}', { interval: tr(sub.billing_interval === 'yearly' ? tr('Yearly') : tr('Monthly')), date: date(sub.current_period_end) }) : ''}
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            <Meter label="Messages this month" value={usage.monthly_messages} max={plan?.limits.monthly_messages} />
            <Meter label="Contacts" value={usage.contacts} max={plan?.limits.contacts} />
            <Meter label="Team members" value={usage.agents} max={plan?.limits.agents} />
            <Meter label="WhatsApp numbers" value={usage.numbers} max={plan?.limits.numbers} />
            <Meter label="Live chatbots" value={usage.flows} max={plan?.limits.flows} />
          </div>
          <p className="text-[12px] text-ink-3 mt-5">{tr('WhatsApp conversation charges from Meta are billed by Meta to your WhatsApp Business Account and are not included in the plan price.')}</p>
        </Panel>
        <Panel title={tr('Invoices')} padded={false}>
          <Table rows={invoices} empty={<p className="p-4 text-ink-3 text-[13px]">{tr('No invoices yet.')}</p>}
            columns={[
              { label: 'Invoice', key: 'n', render: (i) => <div><p className="font-medium text-[13px]">{i.number}</p><p className="text-ink-3 text-[12px]">{date(i.created_at)}</p></div> },
              { label: 'Amount', key: 'a', render: (i) => <span className="tabular-nums text-[13px]">{money(i.amount, i.currency)}</span> },
              { label: '', key: 's', render: (i) => <StatusBadge status={i.status} /> },
            ]} />
        </Panel>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{tr('Plans')}</h2>
        <div className="flex rounded-md border border-line bg-white p-0.5 text-[13px]">
          {['monthly', 'yearly'].map((v) => <button key={v} onClick={() => setInterval_(v)} className={cx('px-3 py-1 rounded', interval === v ? 'bg-ink text-white' : 'text-ink-3')}>{v === 'monthly' ? tr('Monthly') : tr('Yearly (2 months free)')}</button>)}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const current = plan?.id === p.id;
          const price = interval === 'yearly' ? p.price_yearly || p.price_monthly * 12 : p.price_monthly;
          return (
            <section key={p.id} className={cx('rounded-lg border bg-white p-5 flex flex-col', current ? 'border-ink' : 'border-line')}>
              <p className="font-semibold text-[16px]">{p.name}</p>
              <p className="text-ink-3 text-[13px] min-h-[2.5em]">{(lang === 'ar' && p.description_ar) || p.description}</p>
              <p className="mt-3"><span className="text-[28px] font-semibold tabular-nums">{money(price, p.currency)}</span><span className="text-ink-3"> / {interval === 'yearly' ? tr('year') : tr('month')}</span></p>
              <ul className="mt-4 space-y-1.5 text-[13px] flex-1">
                {Object.entries(LIMIT_LABEL).map(([k, l]) => <li key={k}><b className="tabular-nums">{tr(lim(p.limits[k]))}</b> {tr(l)}</li>)}
                {Object.entries(FEATURE_LABEL).map(([k, l]) => (
                  <li key={k} className={cx('flex items-center gap-1.5', p.features[k] === false && 'text-ink-3 line-through')}>
                    <Icon name={p.features[k] === false ? 'x' : 'check'} size={14} className={p.features[k] === false ? '' : 'text-signal'} />{tr(l)}
                  </li>
                ))}
              </ul>
              <Button className="mt-5" variant={current ? 'secondary' : 'primary'} loading={busy} onClick={() => choose(p)}>
                {current ? (tenant.status === 'active' ? tr('Renew now') : tr('Activate this plan')) : 'Switch to this plan'}
              </Button>
            </section>
          );
        })}
      </div>
      <Modal open={!!payFor} onClose={() => setPayFor(null)} title={tr('Pay for the {plan} plan', { plan: payFor?.plan?.name || '' })} width={440}>
        {payFor && (
          <div className="space-y-3">
            <p className="text-[28px] font-semibold tabular-nums" dir="ltr">{money(payFor.amount, payFor.currency)}</p>
            <p className="text-ink-3 text-[13px] -mt-2">{payFor.notes}</p>
            {payFor.paypalQuote?.converted && (methods.card || methods.paypal) && (
              <p className="text-[12px] text-ink-3">{tr('Card and PayPal payments are charged {amount} (converted from {original}).', { amount: `${payFor.paypalQuote.value} ${payFor.paypalQuote.currency}`, original: money(payFor.amount, payFor.currency) })}</p>
            )}
            <div className="grid gap-2 pt-1">
              {methods.card && <Button variant="primary" icon="card" className="h-11" loading={busy} onClick={() => pay(payFor, 'card')}>{tr('Pay with Visa / Mastercard')}</Button>}
              {methods.paypal && <Button variant="dark" className="h-11" loading={busy} onClick={() => pay(payFor, 'paypal')}>{tr('Pay with PayPal')}</Button>}
              {methods.tap && <Button className="h-11" icon="card" loading={busy} onClick={() => pay(payFor, 'tap')}>{tr('Pay with KNET or card')}</Button>}
            </div>
            <p className="text-[12px] text-ink-3">{tr('Your plan starts as soon as the payment goes through.')}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
