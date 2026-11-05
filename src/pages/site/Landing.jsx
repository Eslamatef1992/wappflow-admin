import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../lib/session.jsx';
import { Icon } from '../../components/icons.jsx';
import { cx } from '../../components/ui.jsx';
import { CONTENT, CONTACT } from './content.js';
import './site.css';

// ---------------- language ----------------
function useLang() {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('wf_lang');
      if (saved === 'ar' || saved === 'en') return saved;
    } catch { /* storage unavailable */ }
    return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  });
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = CONTENT[lang].dir;
    try { localStorage.setItem('wf_lang', lang); } catch { /* ignore */ }
    return () => { el.lang = 'en'; el.dir = 'ltr'; };
  }, [lang]);
  return [lang, setLang];
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const salesLink = () => `https://wa.me/${CONTACT.whatsapp}`;

// ---------------- chat pieces ----------------
function Bubble({ m, tapped }) {
  const out = m.from === 'out';
  return (
    <div className={cx('flex', out ? 'justify-start' : 'justify-end')}>
      <div className={cx('wf-bubble max-w-[82%] rounded-2xl px-3 py-2 text-[13.5px] leading-snug shadow-[0_1px_0_rgba(12,27,51,.08)]',
        out ? 'bg-white rounded-ss-md' : 'bg-[#d9fdd3] rounded-se-md')}>
        <p dir="auto">{m.text}</p>
        {m.buttons && (
          <div className="mt-2 -mx-1 grid gap-1">
            {m.buttons.map((b, i) => (
              <span key={b} className={cx('rounded-lg border px-2 py-1.5 text-center text-[12.5px] font-medium transition-colors',
                tapped === i ? 'bg-signal-wash border-signal/40 text-signal-deep' : 'bg-white/70 border-black/5 text-[#1f7ae0]')}>{b}</span>
            ))}
          </div>
        )}
        <span className="block text-end text-[10px] text-ink-3 mt-0.5">{out ? '9:41' : '9:41 ✓✓'}</span>
      </div>
    </div>
  );
}

function PhoneDemo({ t }) {
  const script = t.phone.script;
  const [step, setStep] = useState(() => (prefersReducedMotion() ? script.length : 0));
  const [typing, setTyping] = useState(false);
  const body = useRef(null);

  useEffect(() => { setStep(prefersReducedMotion() ? script.length : 0); }, [script]);
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let timer;
    if (step >= script.length) {
      timer = setTimeout(() => setStep(0), 4200);
    } else if (script[step].from === 'out') {
      setTyping(true);
      timer = setTimeout(() => { setTyping(false); setStep((s) => s + 1); }, step === 0 ? 700 : 1300);
    } else {
      timer = setTimeout(() => setStep((s) => s + 1), step === 0 ? 600 : 1100);
    }
    return () => clearTimeout(timer);
  }, [step, script]);
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' }); }, [step, typing]);

  const shown = script.slice(0, step);
  // which bot button the customer "tapped"
  const tapFor = (i) => (script[i + 1]?.tap !== undefined && i + 1 < step ? script[i + 1].tap : undefined);
  const done = step >= script.length;

  return (
    <div className="relative mx-auto w-[300px] sm:w-[320px]">
      {/* speed lines from the WappFlow mark */}
      <div aria-hidden="true" className="wf-lines absolute top-[22%] -start-24 hidden md:flex flex-col gap-3 items-end">
        <span className="h-3 w-24 rounded-full" /><span className="h-3 w-36 rounded-full" /><span className="h-3 w-16 rounded-full" /><span className="h-3 w-28 rounded-full" />
      </div>
      <div className="relative rounded-[42px] bg-ink p-2.5 shadow-[0_30px_80px_-20px_rgba(12,27,51,.45)]">
        <div className="rounded-[34px] overflow-hidden bg-[#efeae2]">
          <div className="flex items-center gap-2.5 bg-[#0b5f3a] text-white px-4 pt-6 pb-3">
            <span className="w-8 h-8 rounded-full bg-white/90 grid place-items-center text-[15px]">☕</span>
            <div className="leading-tight">
              <p className="font-semibold text-[14px]">{t.phone.business}</p>
              <p className="text-[11px] text-white/75">{typing ? '…' : t.phone.status}</p>
            </div>
          </div>
          <div ref={body} className="wf-chat h-[430px] overflow-y-auto px-3 py-3 space-y-2" aria-label="Example WhatsApp conversation" role="img">
            {shown.map((m, i) => <Bubble key={`${i}-${m.text}`} m={m} tapped={tapFor(i)} />)}
            {typing && (
              <div className="flex justify-start"><span className="wf-typing bg-white rounded-2xl rounded-ss-md px-3 py-2.5"><i /><i /><i /></span></div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-[#efeae2] px-3 pb-4 pt-1">
            <span className="flex-1 h-9 rounded-full bg-white" />
            <span className="w-9 h-9 rounded-full bg-[#0b5f3a] grid place-items-center text-white"><Icon name="send" size={15} /></span>
          </div>
        </div>
      </div>
      <div className={cx('wf-chip absolute -end-3 sm:-end-16 bottom-3 rounded-xl bg-white shadow-lg border border-line px-3 py-2 text-[12.5px] font-medium flex items-center gap-2', done && 'is-on')}>
        <span className="w-6 h-6 rounded-full bg-signal text-white grid place-items-center"><Icon name="bot" size={13} /></span>
        <span>{t.phone.chips[0]}<span className="block text-ink-3 font-normal">{t.phone.chips[1]}</span></span>
      </div>
    </div>
  );
}

function MiniChat({ chat }) {
  return (
    <div className="wf-chat rounded-2xl bg-[#efeae2] p-4 space-y-2 border border-line">
      {chat.map((m, i) => <Bubble key={i} m={m} />)}
    </div>
  );
}

const SHOT_SIZE = { inbox: [1680, 1012], campaign: [1680, 728], flow: [1680, 733], commerce: [1680, 506] };

function Shot({ name, alt }) {
  const [w, h] = SHOT_SIZE[name] || [1680, 1012];
  return (
    <div className="rounded-xl border border-line bg-white shadow-[0_24px_60px_-28px_rgba(12,27,51,.35)] overflow-hidden" dir="ltr">
      <div className="flex gap-1.5 px-3 py-2.5 border-b border-line bg-paper">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" /><span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" /><span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
      </div>
      <img src={`/site/${name}.webp`} alt={alt} loading="lazy" width={w} height={h} className="block w-full h-auto" />
    </div>
  );
}

// ---------------- sections ----------------
function Nav({ t, lang, setLang, me }) {
  const [open, setOpen] = useState(false);
  const links = [['#product', t.nav.product], ['#solutions', t.nav.solutions], ['#pricing', t.nav.pricing], ['#faq', t.nav.faq]];
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-line/70">
      <div className="wf-wrap flex items-center gap-6 h-16">
        <a href="#top" className="shrink-0"><img src="/brand/wappflow-logo.png" alt="WappFlow" className="h-8 w-auto" /></a>
        <nav className="hidden lg:flex gap-6 text-[15px] text-ink-2">
          {links.map(([href, label]) => <a key={href} href={href} className="hover:text-signal-deep">{label}</a>)}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="h-9 px-3 rounded-md text-[14px] font-medium text-ink-2 hover:bg-paper" lang={lang === 'en' ? 'ar' : 'en'}>{t.switchTo}</button>
          {me ? (
            <Link to={me.user.role === 'superadmin' ? '/admin' : '/app'} className="wf-btn wf-btn-primary">{t.nav.dashboard}</Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex h-9 px-3 items-center rounded-md text-[14px] font-medium text-ink hover:bg-paper">{t.nav.login}</Link>
              <Link to="/signup" className="wf-btn wf-btn-primary hidden sm:inline-flex">{t.nav.trial}</Link>
            </>
          )}
          <button className="lg:hidden w-9 h-9 grid place-items-center rounded-md hover:bg-paper" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'x' : 'more'} /></button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-line bg-white px-4 py-3 grid gap-1" onClick={() => setOpen(false)}>
          {links.map(([href, label]) => <a key={href} href={href} className="py-2 font-medium">{label}</a>)}
          {!me && <><Link to="/login" className="py-2 font-medium">{t.nav.login}</Link><Link to="/signup" className="wf-btn wf-btn-primary mt-1">{t.nav.trial}</Link></>}
        </nav>
      )}
    </header>
  );
}

function Hero({ t, trialDays }) {
  return (
    <section id="top" className="wf-hero relative overflow-hidden">
      <div className="wf-wrap grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 items-center pt-14 pb-20 lg:pt-20 lg:pb-28">
        <div>
          <h1 className="wf-display text-[38px] sm:text-[52px] lg:text-[58px] font-bold text-ink">{t.hero.title}</h1>
          <p className="mt-5 text-[18px] text-ink-2 max-w-[54ch] leading-relaxed">{t.hero.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="wf-btn wf-btn-primary wf-btn-lg">{t.hero.primary}</Link>
            <a href={salesLink()} target="_blank" rel="noreferrer" className="wf-btn wf-btn-ghost wf-btn-lg"><Icon name="phone" size={17} />{t.hero.secondary}</a>
          </div>
          <p className="mt-4 text-[14px] text-ink-3">{t.hero.note(trialDays)}</p>
        </div>
        <PhoneDemo t={t} />
      </div>
    </section>
  );
}

function Facts({ t }) {
  return (
    <section className="border-y border-line bg-white">
      <div className="wf-wrap grid sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
        {t.facts.map((f) => (
          <div key={f.title} className="flex gap-3">
            <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-signal-wash text-signal-deep grid place-items-center"><Icon name="check" size={15} /></span>
            <div><p className="font-semibold text-[15px]">{f.title}</p><p className="text-ink-3 text-[14px] mt-0.5">{f.body}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Solutions({ t }) {
  const [tab, setTab] = useState(0);
  const s = t.solutions.tabs[tab];
  return (
    <section id="solutions" className="wf-section">
      <div className="wf-wrap">
        <h2 className="wf-h2 max-w-[22ch]">{t.solutions.title}</h2>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist">
          {t.solutions.tabs.map((x, i) => (
            <button key={x.key} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}
              className={cx('h-10 px-4 rounded-full text-[15px] font-medium border transition-colors', tab === i ? 'bg-ink text-white border-ink' : 'bg-white border-line text-ink-2 hover:border-ink-3')}>{x.label}</button>
          ))}
        </div>
        <div key={s.key} className="wf-fade mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center rounded-3xl bg-white border border-line p-6 sm:p-10">
          <div>
            <h3 className="text-[26px] font-bold">{s.heading}</h3>
            <p className="mt-3 text-ink-2 text-[16px] leading-relaxed max-w-[52ch]">{s.body}</p>
            <ul className="mt-6 grid gap-3">
              {s.points.map((p) => <li key={p} className="flex gap-2.5 text-[15px]"><Icon name="check" size={18} className="text-signal shrink-0 mt-0.5" />{p}</li>)}
            </ul>
          </div>
          <div className="max-w-[420px] w-full mx-auto"><MiniChat chat={s.chat} /></div>
        </div>
      </div>
    </section>
  );
}

function Features({ t }) {
  return (
    <section id="product" className="wf-section bg-white border-y border-line">
      <div className="wf-wrap">
        <h2 className="wf-h2 max-w-[24ch]">{t.features.title}</h2>
        <div className="mt-14 grid gap-20">
          {t.features.items.map((f, i) => (
            <div key={f.img} className={cx('grid grid-cols-1 gap-10 items-center', i % 2 === 1 ? 'lg:grid-cols-[1.35fr_1fr]' : 'lg:grid-cols-[1fr_1.35fr]')}>
              <div className={cx(i % 2 === 1 && 'lg:order-2')}>
                <h3 className="text-[26px] font-bold">{f.title}</h3>
                <p className="mt-3 text-ink-2 text-[16px] leading-relaxed max-w-[50ch]">{f.body}</p>
                <ul className="mt-5 grid gap-2.5">
                  {f.points.map((p) => <li key={p} className="flex gap-2.5 text-[15px]"><Icon name="check" size={18} className="text-signal shrink-0 mt-0.5" />{p}</li>)}
                </ul>
              </div>
              <Shot name={f.img} alt={f.title} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Industries({ t }) {
  return (
    <section className="wf-section">
      <div className="wf-wrap">
        <h2 className="wf-h2 max-w-[22ch]">{t.industries.title}</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-2xl overflow-hidden border border-line">
          {t.industries.items.map((x) => (
            <div key={x.title} className="bg-white p-6">
              <Icon name={x.icon} size={22} className="text-signal-deep" />
              <p className="mt-4 font-semibold text-[17px]">{x.title}</p>
              <p className="mt-1 text-ink-3 text-[15px]">{x.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps({ t }) {
  return (
    <section className="wf-section bg-ink text-white">
      <div className="wf-wrap">
        <h2 className="wf-h2 text-white max-w-[20ch]">{t.steps.title}</h2>
        <ol className="mt-12 grid md:grid-cols-3 gap-10">
          {t.steps.items.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="text-[44px] font-bold text-signal-glow leading-none">{i + 1}</span>
              <p className="mt-4 text-[19px] font-semibold">{s.title}</p>
              <p className="mt-2 text-white/70 text-[15px] leading-relaxed max-w-[36ch]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Integrations({ t }) {
  return (
    <section className="wf-section">
      <div className="wf-wrap grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="wf-h2">{t.integrations.title}</h2>
          <p className="mt-4 text-ink-2 text-[17px] leading-relaxed max-w-[50ch]">{t.integrations.body}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {t.integrations.items.map((x) => <span key={x} className="rounded-full bg-white border border-line px-3.5 py-1.5 text-[14px] font-medium">{x}</span>)}
          </div>
        </div>
        <div className="rounded-2xl bg-ink text-white/90 p-5 shadow-xl" dir="ltr">
          <p className="text-[13px] text-white/50 mb-3">{t.integrations.code}</p>
          <pre className="text-[12.5px] leading-relaxed overflow-x-auto"><code>{`POST /api/v1/messages
X-API-Key: wsk_••••••••

{
  "to": "+96550000000",
  "template": "order_shipped",
  "variables": { "body": ["Reem", "A-1042"] }
}`}</code></pre>
          <p className="mt-4 text-[13px] text-signal-glow">201 Created · status: sent</p>
        </div>
      </div>
    </section>
  );
}

const FALLBACK_PLANS = [
  { id: 's', name: 'Starter', price_monthly: 15, price_yearly: 150, currency: 'KWD', limits: { contacts: 1000, monthly_messages: 2000, agents: 2, numbers: 1, flows: 2 }, features: { commerce: false, api: false } },
  { id: 'g', name: 'Growth', price_monthly: 35, price_yearly: 350, currency: 'KWD', limits: { contacts: 10000, monthly_messages: 20000, agents: 5, numbers: 2, flows: 10 }, features: {} },
  { id: 'b', name: 'Business', price_monthly: 79, price_yearly: 790, currency: 'KWD', limits: { contacts: -1, monthly_messages: 100000, agents: 20, numbers: 5, flows: -1 }, features: {} },
];

function Pricing({ t, plans, lang }) {
  const [yearly, setYearly] = useState(false);
  const list = plans?.length ? plans : FALLBACK_PLANS;
  const mid = list.length >= 3 ? Math.floor(list.length / 2) : -1;
  const fmt = (v) => (v == null || v < 0 ? t.pricing.unlimited : (+v).toLocaleString(lang === 'ar' ? 'ar-KW' : 'en'));
  const price = (p) => (yearly ? +p.price_yearly || +p.price_monthly * 12 : +p.price_monthly);
  const cur = (c) => (lang === 'ar' && c === 'KWD' ? 'د.ك' : c);
  return (
    <section id="pricing" className="wf-section bg-white border-y border-line">
      <div className="wf-wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="wf-h2">{t.pricing.title}</h2>
            <p className="mt-3 text-ink-2 text-[17px]">{t.pricing.body}</p>
          </div>
          <div className="inline-flex rounded-full border border-line bg-paper p-1 text-[14px] font-medium">
            <button onClick={() => setYearly(false)} className={cx('px-4 h-9 rounded-full', !yearly && 'bg-white shadow-sm')}>{t.pricing.monthly}</button>
            <button onClick={() => setYearly(true)} className={cx('px-4 h-9 rounded-full', yearly && 'bg-white shadow-sm')}>{t.pricing.yearly} <span className="text-signal-deep">· {t.pricing.yearlyNote}</span></button>
          </div>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {list.map((p, i) => (
            <div key={p.id} className={cx('relative rounded-2xl border p-7 flex flex-col', i === mid ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>
              {i === mid && <span className="absolute -top-3 start-7 rounded-full bg-signal text-white text-[12px] font-semibold px-2.5 py-1">{t.pricing.recommended}</span>}
              <p className="text-[20px] font-bold">{p.name}</p>
              <p className="mt-4"><span className="text-[40px] font-bold tabular-nums">{price(p).toLocaleString(lang === 'ar' ? 'ar-KW' : 'en')}</span> <span className={i === mid ? 'text-white/70' : 'text-ink-3'}>{cur(p.currency)} {yearly ? t.pricing.perYear : t.pricing.perMonth}</span></p>
              <ul className={cx('mt-6 grid gap-2.5 text-[14.5px] flex-1', i === mid ? 'text-white/85' : 'text-ink-2')}>
                {Object.entries(t.pricing.limits).map(([k, label]) => <li key={k}><b className={i === mid ? 'text-white' : 'text-ink'}>{fmt(p.limits?.[k])}</b> {label}</li>)}
                {Object.entries(t.pricing.features).map(([k, label]) => (
                  <li key={k} className={cx('flex items-center gap-2', p.features?.[k] === false && 'opacity-45 line-through')}>
                    <Icon name={p.features?.[k] === false ? 'x' : 'check'} size={16} className={p.features?.[k] === false ? '' : 'text-signal-glow'} />{label}
                  </li>
                ))}
              </ul>
              <Link to={`/signup${typeof p.id === 'number' ? `?plan=${p.id}` : ''}`} className={cx('wf-btn mt-7 w-full', i === mid ? 'wf-btn-primary' : 'wf-btn-ghost')}>{t.pricing.cta}</Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13.5px] text-ink-3 max-w-[80ch]">{t.pricing.metaNote}</p>
      </div>
    </section>
  );
}

function Faq({ t }) {
  return (
    <section id="faq" className="wf-section">
      <div className="wf-wrap grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10">
        <h2 className="wf-h2 max-w-[14ch]">{t.faq.title}</h2>
        <div className="divide-y divide-line border-y border-line">
          {t.faq.items.map((x) => (
            <details key={x.q} className="wf-faq group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                {x.q}<Icon name="plus" size={20} className="shrink-0 text-ink-3 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-ink-2 text-[15.5px] leading-relaxed max-w-[68ch]">{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta({ t }) {
  return (
    <section className="wf-wrap pb-20">
      <div className="wf-cta rounded-3xl px-6 py-14 sm:px-14 text-white grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
        <div>
          <h2 className="wf-h2 text-white">{t.cta.title}</h2>
          <p className="mt-3 text-white/85 text-[17px]">{t.cta.body}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link to="/signup" className="wf-btn wf-btn-lg bg-white text-ink hover:bg-white/90">{t.cta.primary}</Link>
          <a href={salesLink()} target="_blank" rel="noreferrer" className="wf-btn wf-btn-lg border border-white/50 text-white hover:bg-white/10">{t.cta.secondary}</a>
        </div>
      </div>
    </section>
  );
}

function Footer({ t }) {
  const f = t.footer;
  return (
    <footer className="bg-ink text-white/75">
      <div className="wf-wrap py-14 grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <img src="/brand/wappflow-logo-white.png" alt="WappFlow" className="h-9 w-auto" />
          <p className="mt-4 max-w-[36ch] text-[14.5px]">{f.tagline}</p>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">{f.product}</p>
          <ul className="grid gap-2 text-[14.5px]">
            <li><a href="#product" className="hover:text-white">{f.links.inbox}</a></li>
            <li><a href="#product" className="hover:text-white">{f.links.campaigns}</a></li>
            <li><a href="#product" className="hover:text-white">{f.links.chatbots}</a></li>
            <li><a href="#product" className="hover:text-white">{f.links.commerce}</a></li>
            <li><a href="#pricing" className="hover:text-white">{f.links.pricing}</a></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">{f.company}</p>
          <ul className="grid gap-2 text-[14.5px]">
            <li><a href={`mailto:${CONTACT.email}`} className="hover:text-white">{f.links.contact}</a></li>
            <li><a href={salesLink()} className="hover:text-white">WhatsApp</a></li>
            <li><Link to="/login" className="hover:text-white">{f.links.login}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">{f.legal}</p>
          <ul className="grid gap-2 text-[14.5px]">
            {/* TODO: publish your terms and privacy pages and update these links */}
            <li><a href="/terms" className="hover:text-white">{f.links.terms}</a></li>
            <li><a href="/privacy" className="hover:text-white">{f.links.privacy}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wf-wrap py-5 flex flex-wrap justify-between gap-3 text-[13px] text-white/50">
          <span>© {new Date().getFullYear()} WappFlow. {f.rights}</span>
          <span>{f.meta}</span>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { me, config } = useSession();
  const [lang, setLang] = useLang();
  const t = useMemo(() => CONTENT[lang], [lang]);
  return (
    <div className={cx('wf-site bg-paper text-ink', lang === 'ar' && 'is-ar')}>
      <Nav t={t} lang={lang} setLang={setLang} me={me} />
      <main>
        <Hero t={t} trialDays={config?.trialDays || 14} />
        <Facts t={t} />
        <Solutions t={t} />
        <Features t={t} />
        <Industries t={t} />
        <Steps t={t} />
        <Integrations t={t} />
        <Pricing t={t} plans={config?.plans} lang={lang} />
        <Faq t={t} />
        <Cta t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}
