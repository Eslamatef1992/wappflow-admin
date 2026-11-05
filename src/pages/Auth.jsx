import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../lib/session.jsx';
import { Button, Field, Input, ErrorNote, Select } from '../components/ui.jsx';
import { money } from '../lib/format.js';
import { useT, LangToggle } from '../lib/i18n.jsx';

function Frame({ children }) {
  const tr = useT();
  const { config } = useSession();
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_520px]">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-12 chat-ground !bg-ink" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)' }}>
        <Link to="/"><img src="/brand/wappflow-logo-white.png" alt={config?.brand || 'WappFlow'} className="h-9 w-auto" /></Link>
        {/* a real-looking exchange tells the story better than a slogan */}
        <div className="max-w-[420px] space-y-3 text-[15px]">
          <div className="bg-white text-ink rounded-xl rounded-ss-sm px-4 py-2.5 w-fit max-w-[85%]">{tr('Hi, is my order ready?')}</div>
          <div className="bg-bubble-out text-ink rounded-xl rounded-se-sm px-4 py-2.5 w-fit max-w-[85%] ms-auto">
            {tr('Yes! Order #1042 left the shop 10 minutes ago 🚚')}
            <span className="block text-end text-[11px] text-signal-deep mt-0.5" dir="ltr">10:42 ✓✓</span>
          </div>
          <div className="bg-white text-ink rounded-xl rounded-ss-sm px-4 py-2.5 w-fit">{tr('Thank you 🙏')}</div>
        </div>
        <p className="text-white/60 max-w-[44ch]">{tr('Answer every customer on WhatsApp from one team inbox, send campaigns, and let a chatbot handle the routine questions.')}</p>
      </div>
      <div className="relative flex items-center justify-center p-6 sm:p-12 bg-white">
        <LangToggle className="absolute top-4 end-4 h-9 px-3 rounded-md text-[14px] font-medium text-ink-2 hover:bg-paper" />
        <div className="w-full max-w-[380px]">
          <img src="/brand/wappflow-logo.png" alt={config?.brand || 'WappFlow'} className="h-8 w-auto mb-10 lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const tr = useT();
  const { login, me } = useSession();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  if (me) return <Navigate to="/app" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { await login(f.email, f.password); nav('/app'); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <Frame>
      <h1 className="text-2xl font-semibold mb-1">{tr('Sign in')}</h1>
      <p className="text-ink-3 mb-6">{tr('Welcome back. Your customers are waiting.')}</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><Input type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><Input type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <ErrorNote error={err} />
        <Button variant="primary" className="w-full" loading={busy}>{tr('Sign in')}</Button>
      </form>
      <p className="text-ink-3 mt-6 text-center">{tr('New business?')} <Link to="/signup" className="text-ink font-medium underline">{tr('Start a free trial')}</Link></p>
    </Frame>
  );
}

export function Signup() {
  const tr = useT();
  const { signup, me, config } = useSession();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const [f, setF] = useState({ company: '', name: '', email: '', password: '', planId: q.get('plan') || '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  if (me) return <Navigate to="/app" replace />;
  if (config && !config.allowSignup) {
    return <Frame><h1 className="text-2xl font-semibold mb-2">{tr('Accounts by invitation')}</h1><p className="text-ink-3">{tr('Contact us and we\'ll set up your workspace.')}</p><Link to="/login" className="underline mt-6 block">{tr('Sign in')}</Link></Frame>;
  }
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { await signup({ ...f, planId: f.planId || undefined }); nav('/app/settings?tab=numbers&welcome=1'); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Frame>
      {config?.trialDays > 0 ? <>
        <h1 className="text-2xl font-semibold mb-1">{tr('Start your {days}-day trial', { days: config.trialDays })}</h1>
        <p className="text-ink-3 mb-6">{tr('No card needed. Connect your WhatsApp number after signing up.')}</p>
      </> : <>
        <h1 className="text-2xl font-semibold mb-1">{tr('Create your workspace')}</h1>
        <p className="text-ink-3 mb-6">{tr('Explore every feature free with a demo number. Choose a plan when you are ready to connect your WhatsApp number.')}</p>
      </>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Business name"><Input required value={f.company} onChange={set('company')} /></Field>
        <Field label="Your name"><Input required value={f.name} onChange={set('name')} /></Field>
        <Field label="Work email"><Input type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Password" hint="At least 8 characters"><Input type="password" minLength={8} required value={f.password} onChange={set('password')} /></Field>
        {!!config?.plans?.length && (
          <Field label="Plan">
            <Select value={f.planId} onChange={set('planId')} placeholder={tr('Starter (default)')}
              options={config.plans.map((p) => ({ value: p.id, label: `${p.name} · ${money(p.price_monthly, p.currency)} ${tr('/ month')}` }))} />
          </Field>
        )}
        <ErrorNote error={err} />
        <Button variant="primary" className="w-full" loading={busy}>{tr('Create workspace')}</Button>
      </form>
      <p className="text-ink-3 mt-6 text-center">{tr('Have an account?')} <Link to="/login" className="text-ink font-medium underline">{tr('Sign in')}</Link></p>
    </Frame>
  );
}
