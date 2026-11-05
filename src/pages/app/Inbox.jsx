import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, get, post, patch, useApi } from '../../lib/api.js';
import { useRealtime, useSession } from '../../lib/session.jsx';
import { Avatar, Badge, Button, Empty, Field, IconButton, Input, Loading, Modal, Select, Spinner, StatusBadge, Textarea, cx, useAction, useToast } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { ago, dateTime, money, phone, time, isRtl } from '../../lib/format.js';
import { TemplateVariables, emptyVariables } from './Templates.jsx';

// ---------------- 24-hour window meter ----------------
// WhatsApp only allows free-form replies within 24h of the customer's last message.
function WindowMeter({ expiresAt }) {
  const [nowTs, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  const left = expiresAt ? expiresAt - nowTs : 0;
  const open = left > 0;
  const ratio = open ? left / 86_400_000 : 0;
  const r = 15; const c = 2 * Math.PI * r;
  const urgent = open && left < 3 * 3600_000;
  const h = Math.floor(left / 3600_000); const m = Math.floor((left % 3600_000) / 60_000);
  return (
    <div className="flex items-center gap-2.5" title="Free-form replies are allowed for 24 hours after the customer's last message">
      <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true" className="-rotate-90">
        <circle cx="19" cy="19" r={r} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        {open && <circle cx="19" cy="19" r={r} fill="none" stroke={urgent ? 'var(--color-amber)' : 'var(--color-signal)'} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${c * ratio} ${c}`} />}
      </svg>
      <div className="leading-tight">
        <p className={cx('text-[13px] font-semibold tabular-nums', !open && 'text-ink-3', urgent && 'text-[#9a6210]')}>{open ? `${h}h ${String(m).padStart(2, '0')}m left` : 'Window closed'}</p>
        <p className="text-[12px] text-ink-3">{open ? 'to reply freely' : 'Templates only'}</p>
      </div>
    </div>
  );
}

// ---------------- message rendering ----------------
function Ticks({ status }) {
  if (status === 'failed') return <Icon name="x" size={14} className="text-danger" />;
  if (status === 'queued') return <Icon name="clock" size={13} className="text-ink-3" />;
  if (status === 'sent') return <Icon name="check" size={14} className="text-ink-3" />;
  return <Icon name="checks" size={15} className={status === 'read' ? 'text-[#2f8ae0]' : 'text-ink-3'} />;
}

function MediaImage({ messageId, caption }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let url;
    api(`/api/app/media/${messageId}`, { raw: true }).then(async (res) => {
      if (!res.ok) throw new Error();
      url = URL.createObjectURL(await res.blob());
      setSrc(url);
    }).catch(() => setFailed(true));
    return () => url && URL.revokeObjectURL(url);
  }, [messageId]);
  if (failed) return <p className="text-ink-3 italic">[image{caption ? `: ${caption}` : ''}]</p>;
  return src ? <img src={src} alt={caption || 'Image from customer'} className="rounded-md max-h-72 mb-1" /> : <div className="w-48 h-32 grid place-items-center text-ink-3"><Spinner /></div>;
}

function MessageBody({ m, onTap }) {
  const c = m.content || {};
  if (m.type === 'image' && m.direction === 'in') return <><MediaImage messageId={m.id} caption={c.image?.caption} />{c.image?.caption && <p>{c.image.caption}</p>}</>;
  if (m.type === 'image' && c.image?.link) return <><img src={c.image.link} alt={c.image.caption || ''} className="rounded-md max-h-72 mb-1" />{c.image.caption && <p>{c.image.caption}</p>}</>;
  if (m.type === 'interactive' && m.direction === 'out') {
    const i = c.interactive || {};
    const opts = i.type === 'button' ? i.action?.buttons?.map((b) => ({ id: b.reply.id, title: b.reply.title })) : i.action?.sections?.flatMap((s) => s.rows) || [];
    return (
      <>
        {i.header?.text && <p className="font-semibold">{i.header.text}</p>}
        <p className="whitespace-pre-wrap" dir="auto">{i.body?.text}</p>
        {i.footer?.text && <p className="text-[12px] text-ink-3 mt-1">{i.footer.text}</p>}
        <div className="mt-2 -mx-1 grid gap-1">
          {i.type === 'list' && <p className="text-[12px] text-ink-3 px-1">List · {i.action?.button}</p>}
          {opts?.map((o) => (
            <button key={o.id} type="button" disabled={!onTap} onClick={() => onTap?.(o, i.type)}
              className={cx('rounded-md bg-white/70 border border-black/5 px-2 py-1.5 text-[13px] text-[#2f8ae0] font-medium text-center', onTap && 'hover:bg-white')}
              title={onTap ? 'Demo number: tap to reply as the customer' : undefined}>
              {o.title}
            </button>
          ))}
        </div>
      </>
    );
  }
  if (m.type === 'template') {
    const comps = c.template?.components || [];
    return (
      <>
        <p className="whitespace-pre-wrap" dir="auto">{m.body}</p>
        <p className="text-[11px] text-ink-3 mt-1 flex items-center gap-1"><Icon name="file" size={12} />{c.template?.name}{comps.length ? '' : ''}</p>
      </>
    );
  }
  return <p className="whitespace-pre-wrap break-words" dir="auto">{m.body || `[${m.type}]`}</p>;
}

function Bubble({ m, onTap }) {
  if (m.direction === 'note') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-note border border-[#f1e2a6] rounded-md px-3 py-2 max-w-[80%] text-[13px]">
          <p className="text-[12px] text-[#8a6d12] font-medium mb-0.5 flex items-center gap-1"><Icon name="note" size={12} />Internal note · {m.sender_name}</p>
          <p className="whitespace-pre-wrap">{m.body}</p>
        </div>
      </div>
    );
  }
  const out = m.direction === 'out';
  return (
    <div className={cx('flex my-1', out ? 'justify-end' : 'justify-start')}>
      <div className={cx('rounded-xl px-3 py-2 max-w-[78%] sm:max-w-[65%] shadow-[0_1px_0_rgba(0,0,0,.06)] text-[14px]',
        out ? 'bg-bubble-out rounded-tr-sm' : 'bg-white rounded-tl-sm', isRtl(m.body) && 'text-right')}>
        <MessageBody m={m} onTap={onTap} />
        <div className="flex items-center justify-end gap-1 mt-0.5 text-[11px] text-ink-3">
          {out && (m.campaign_id ? <span>Campaign ·</span> : m.flow_id ? <span className="flex items-center gap-0.5"><Icon name="bot" size={11} />Bot ·</span> : m.sender_name ? <span>{m.sender_name} ·</span> : null)}
          <span>{time(m.created_at)}</span>
          {out && <Ticks status={m.status} />}
        </div>
        {m.status === 'failed' && m.error && <p className="text-[12px] text-danger mt-1">{m.error}</p>}
      </div>
    </div>
  );
}

// ---------------- composer ----------------
function Composer({ conv, onSent, quickReplies, templates }) {
  const [mode, setMode] = useState('reply'); // reply | note
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [attach, setAttach] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const toast = useToast();
  const ref = useRef(null);
  const slash = text.startsWith('/') ? text.slice(1).toLowerCase() : null;
  const matches = slash !== null ? quickReplies.filter((q) => q.shortcut.toLowerCase().startsWith(slash)).slice(0, 6) : [];

  const send = async (body) => {
    setBusy(true);
    try {
      const msg = mode === 'note'
        ? await post(`/api/app/conversations/${conv.id}/notes`, { text: body.text })
        : await post(`/api/app/conversations/${conv.id}/messages`, body);
      onSent(msg);
      setText('');
      return true;
    } catch (e) { toast(e.message, 'error'); return false; } finally { setBusy(false); ref.current?.focus(); }
  };
  const submit = (e) => { e?.preventDefault(); if (text.trim()) send({ type: 'text', text: text.trim() }); };

  if (!conv.window_open && mode === 'reply') {
    return (
      <div className="border-t border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <p className="text-ink-3 text-[13px] max-w-[52ch]">This customer hasn't written in the last 24 hours. WhatsApp requires an approved template to start the conversation again.</p>
          <div className="flex gap-2">
            <Button variant="ghost" icon="note" onClick={() => setMode('note')}>Add note</Button>
            <Button variant="primary" icon="file" onClick={() => setTplOpen(true)}>Send template</Button>
          </div>
        </div>
        <TemplateSender open={tplOpen} onClose={() => setTplOpen(false)} templates={templates} onSend={async (b) => { if (await send(b)) setTplOpen(false); }} busy={busy} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cx('border-t border-line p-3', mode === 'note' ? 'bg-note' : 'bg-white')}>
      <div className="flex gap-1 mb-2">
        {['reply', 'note'].map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={cx('px-2.5 py-1 rounded text-[13px] font-medium', mode === m ? 'bg-ink text-white' : 'text-ink-3 hover:text-ink')}>
            {m === 'reply' ? 'Reply' : 'Internal note'}
          </button>
        ))}
      </div>
      <div className="relative">
        {matches.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-line rounded-md shadow-lg overflow-hidden z-10">
            {matches.map((q) => (
              <button key={q.id} type="button" onClick={() => setText(q.body)} className="w-full text-left px-3 py-2 hover:bg-paper flex gap-3">
                <span className="font-mono text-[12px] text-signal-deep shrink-0">/{q.shortcut}</span><span className="truncate text-ink-3">{q.body}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          {mode === 'reply' && (
            <>
              <IconButton icon="paperclip" label="Send image or document" onClick={() => setAttach(true)} />
              <IconButton icon="file" label="Send template" onClick={() => setTplOpen(true)} />
            </>
          )}
          <textarea ref={ref} rows={1} value={text} dir="auto"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={mode === 'note' ? 'Only your team sees notes' : 'Type a message · "/" for quick replies'}
            className="field flex-1 max-h-40 min-h-[38px]" style={{ fieldSizing: 'content' }} />
          <Button variant={mode === 'note' ? 'dark' : 'primary'} icon={mode === 'note' ? 'note' : 'send'} loading={busy} disabled={!text.trim()}>{mode === 'note' ? 'Save' : 'Send'}</Button>
        </div>
      </div>
      <AttachModal open={attach} onClose={() => setAttach(false)} onSend={async (b) => { if (await send(b)) setAttach(false); }} busy={busy} />
      <TemplateSender open={tplOpen} onClose={() => setTplOpen(false)} templates={templates} onSend={async (b) => { if (await send(b)) setTplOpen(false); }} busy={busy} />
    </form>
  );
}

function AttachModal({ open, onClose, onSend, busy }) {
  const [f, setF] = useState({ kind: 'image', url: '', caption: '', filename: '' });
  return (
    <Modal open={open} onClose={onClose} title="Send a file"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => onSend({ type: 'media', ...f })}>Send</Button></>}>
      <Field label="Type"><Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} options={[{ value: 'image', label: 'Image' }, { value: 'document', label: 'Document (PDF)' }, { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }]} /></Field>
      <Field label="Public file link" hint="WhatsApp downloads the file from this link"><Input placeholder="https://…" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
      {f.kind !== 'audio' && <Field label="Caption"><Input value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /></Field>}
      {f.kind === 'document' && <Field label="File name"><Input placeholder="invoice.pdf" value={f.filename} onChange={(e) => setF({ ...f, filename: e.target.value })} /></Field>}
    </Modal>
  );
}

function TemplateSender({ open, onClose, templates, onSend, busy }) {
  const approved = templates.filter((t) => t.status === 'APPROVED');
  const [id, setId] = useState('');
  const t = approved.find((x) => String(x.id) === String(id));
  const [vars, setVars] = useState({});
  useEffect(() => { if (t) setVars(emptyVariables(t)); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal open={open} onClose={onClose} title="Send a template" width={600}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!t} loading={busy} onClick={() => onSend({ type: 'template', templateId: t.id, variables: vars })}>Send template</Button></>}>
      {!approved.length ? <p className="text-ink-3">No approved templates yet. Create one in <Link className="underline" to="/app/templates">Templates</Link>.</p> : (
        <>
          <Field label="Template"><Select value={id} onChange={(e) => setId(e.target.value)} placeholder="Choose…" options={approved.map((x) => ({ value: x.id, label: `${x.name} (${x.language})` }))} /></Field>
          {t && <TemplateVariables template={t} value={vars} onChange={setVars} />}
        </>
      )}
    </Modal>
  );
}

// ---------------- side panel ----------------
function ContactPanel({ conv, team, onUpdate }) {
  const c = conv.contact;
  const session = conv.flow_session;
  return (
    <aside className="hidden xl:block w-[300px] shrink-0 border-l border-line bg-white overflow-y-auto">
      <div className="p-5 text-center border-b border-line">
        <div className="flex justify-center"><Avatar name={c.name || c.wa_id} size={56} /></div>
        <p className="font-semibold mt-2">{c.name || 'Unknown'}</p>
        <p className="text-ink-3 text-[13px]" dir="ltr">{phone(c.wa_id)}</p>
        {!c.opted_in && <Badge tone="red" className="mt-2">Opted out of marketing</Badge>}
      </div>
      <div className="p-5 space-y-5 text-[13px]">
        <div>
          <p className="font-medium mb-1.5">Assigned to</p>
          <Select value={conv.assigned_user_id || ''} onChange={(e) => onUpdate({ assigned_user_id: e.target.value ? +e.target.value : null })}
            placeholder="Unassigned" options={team.filter((u) => u.is_active).map((u) => ({ value: u.id, label: u.name }))} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Chatbot</p>
            <p className="text-ink-3">{conv.bot_active ? (session ? 'In a flow now' : 'Will answer keywords') : 'Paused for this chat'}</p>
          </div>
          <button onClick={() => onUpdate({ bot_active: !conv.bot_active })} className="text-[13px] underline">{conv.bot_active ? 'Pause' : 'Resume'}</button>
        </div>
        <div>
          <p className="font-medium mb-1.5">Tags</p>
          <div className="flex flex-wrap gap-1">
            {c.tags?.length ? c.tags.map((t) => <span key={t.id} className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: `${t.color}1f`, color: t.color }}>{t.name}</span>) : <span className="text-ink-3">None</span>}
          </div>
        </div>
        {!!Object.keys(c.attributes || {}).length && (
          <div>
            <p className="font-medium mb-1.5">Details</p>
            <dl className="space-y-1">
              {Object.entries(c.attributes).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ink-3">{k.replace(/_/g, ' ')}</dt><dd className="text-right break-all">{String(v)}</dd></div>)}
            </dl>
          </div>
        )}
        {!!conv.orders?.length && (
          <div>
            <p className="font-medium mb-1.5">Recent orders</p>
            <ul className="space-y-1.5">
              {conv.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <span>#{o.external_id || o.id}</span><span className="text-ink-3">{money(o.total, o.currency)}</span><StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-ink-3">Customer since {dateTime(c.created_at)}</p>
      </div>
    </aside>
  );
}

// ---------------- simulator ----------------
function Simulator({ open, onClose, onDone }) {
  const [f, setF] = useState({ phone: '+96550001234', name: 'Test Customer', text: 'hi' });
  const [run, busy] = useAction();
  return (
    <Modal open={open} onClose={onClose} title="Message as a customer"
      footer={<><Button onClick={onClose}>Close</Button><Button variant="primary" icon="send" loading={busy} onClick={() => run(async () => { const r = await post('/api/app/simulate/inbound', f); onDone(r.conversation_id); })}>Send to inbox</Button></>}>
      <p className="text-ink-3 text-[13px]">Uses your demo number to test chatbots and the inbox without a real phone. Try "hi" to trigger the welcome flow.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Customer name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      </div>
      <Field label="Message"><Textarea dir="auto" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
    </Modal>
  );
}

function NewChat({ open, onClose, onDone }) {
  const [f, setF] = useState({ phone: '', name: '' });
  const [run, busy] = useAction();
  return (
    <Modal open={open} onClose={onClose} title="New conversation"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(async () => onDone((await post('/api/app/conversations/start', f)).id))}>Open chat</Button></>}>
      <Field label="Phone number" hint="International format, e.g. +965 5000 0000"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <Field label="Name (optional)"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <p className="text-ink-3 text-[13px]">The first message to a new contact must be an approved template.</p>
    </Modal>
  );
}

// ---------------- page ----------------
const FILTERS = [
  { value: 'open', label: 'Open' }, { value: 'pending', label: 'Pending' }, { value: 'resolved', label: 'Resolved' },
];

export default function Inbox() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useSession();
  const [status, setStatus] = useState('open');
  const [assigned, setAssigned] = useState('all');
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const [counts, setCounts] = useState({});
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [simOpen, setSimOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const bottomRef = useRef(null);
  const toast = useToast();

  const { data: team } = useApi('/api/app/team');
  const { data: quick } = useApi('/api/app/quick-replies');
  const { data: templates } = useApi('/api/app/templates');
  const { data: numbers } = useApi('/api/app/numbers');
  const hasMock = numbers?.data?.some((n) => n.mode === 'mock');

  const loadList = async () => {
    const params = new URLSearchParams({ status, assigned, ...(q ? { q } : {}) });
    const r = await get(`/api/app/conversations?${params}`);
    setList(r.data); setCounts(r.counts);
  };
  useEffect(() => { loadList(); }, [status, assigned]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(loadList, 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConv = async (cid = id) => {
    if (!cid) { setConv(null); return; }
    const [c, m] = await Promise.all([get(`/api/app/conversations/${cid}`), get(`/api/app/conversations/${cid}/messages`)]);
    setConv(c); setMessages(m);
    if (c.unread_count) { post(`/api/app/conversations/${cid}/read`); setList((l) => l?.map((x) => (x.id === c.id ? { ...x, unread_count: 0 } : x))); }
  };
  useEffect(() => { loadConv(id).catch(() => nav('/app/inbox')); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length, conv?.id]);

  useRealtime((event, d) => {
    if (['message.received', 'message.sent', 'message.note'].includes(event)) {
      const cid = d.conversation?.id || d.conversation_id;
      if (conv && cid === conv.id) {
        setMessages((ms) => (ms.some((x) => x.id === d.message.id) ? ms : [...ms, d.message]));
        if (event === 'message.received') { post(`/api/app/conversations/${cid}/read`); loadConv(cid); }
      }
      loadList();
    }
    if (event === 'message.status' && conv && d.conversation_id === conv.id) {
      setMessages((ms) => ms.map((x) => (x.id === d.id ? { ...x, status: d.status, error: d.error || x.error } : x)));
    }
    if (event === 'conversation.updated') { loadList(); if (conv && d.id === conv.id) loadConv(conv.id); }
  });

  const update = async (body) => {
    try { await patch(`/api/app/conversations/${conv.id}`, body); await loadConv(conv.id); loadList(); } catch (e) { toast(e.message, 'error'); }
  };

  const tapAsCustomer = async (opt, kind) => {
    try { await post('/api/app/simulate/inbound', { phone: conv.contact.wa_id, replyId: opt.id, text: opt.title, replyKind: kind }); } catch (e) { toast(e.message, 'error'); }
  };
  const isMockConv = useMemo(() => numbers?.data?.find((n) => n.id === conv?.wa_number_id)?.mode === 'mock', [numbers, conv]);

  const filterAssigned = me.user.role === 'agent'
    ? [{ value: 'all', label: 'Mine & unassigned' }, { value: 'me', label: 'Mine' }]
    : [{ value: 'all', label: 'Everyone' }, { value: 'me', label: 'Mine' }, { value: 'unassigned', label: 'Unassigned' }, { value: 'bot', label: 'With chatbot' }];

  return (
    <div className="flex h-full">
      {/* conversation list */}
      <section className={cx('w-full md:w-[330px] shrink-0 border-r border-line bg-white flex flex-col', id && 'hidden md:flex')}>
        <div className="p-3 border-b border-line space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold pl-1">Inbox</h1>
            <div className="flex">
              {hasMock && <IconButton icon="sparkle" label="Message as a customer (demo)" onClick={() => setSimOpen(true)} />}
              <IconButton icon="plus" label="New conversation" onClick={() => setNewOpen(true)} />
            </div>
          </div>
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="field pl-8" placeholder="Search name, number, message" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button key={f.value} onClick={() => setStatus(f.value)} className={cx('px-2.5 py-1 rounded text-[13px] font-medium', status === f.value ? 'bg-ink text-white' : 'text-ink-3 hover:bg-paper')}>
                {f.label} <span className="opacity-60">{counts[f.value] || 0}</span>
              </button>
            ))}
          </div>
          <Select value={assigned} onChange={(e) => setAssigned(e.target.value)} options={filterAssigned} className="!py-1.5 text-[13px]" />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {!list ? <Loading /> : !list.length ? (
            <Empty title="Nothing here" body={status === 'open' ? 'New WhatsApp messages from customers will appear here.' : 'No conversations with this status.'} />
          ) : list.map((c) => (
            <li key={c.id}>
              <Link to={`/app/inbox/${c.id}`} className={cx('flex gap-3 px-3 py-3 border-b border-line hover:bg-paper', String(c.id) === id && 'bg-signal-wash')}>
                <Avatar name={c.contact_name || c.wa_id} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className={cx('truncate', c.unread_count ? 'font-semibold' : 'font-medium')}>{c.contact_name || phone(c.wa_id)}</p>
                    <span className={cx('text-[12px] shrink-0', c.unread_count ? 'text-signal-deep font-semibold' : 'text-ink-3')}>{ago(c.last_message_at)}</span>
                  </div>
                  <div className="flex justify-between gap-2 items-center">
                    <p className="truncate text-[13px] text-ink-3" dir="auto">{c.last_message_preview}</p>
                    {c.unread_count > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-signal text-white text-[11px] font-semibold grid place-items-center">{c.unread_count}</span>}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {c.bot_active && <Badge tone="blue"><Icon name="bot" size={11} />Bot</Badge>}
                    {!c.assigned_user_id && <Badge>Unassigned</Badge>}
                    {!c.window_open && <Badge tone="amber">Window closed</Badge>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* thread */}
      <section className={cx('flex-1 min-w-0 flex flex-col', !id && 'hidden md:flex')}>
        {!conv ? (
          <div className="flex-1 grid place-items-center chat-ground">
            <Empty icon="inbox" title="Pick a conversation" body={hasMock ? 'Or use the ✦ button to send yourself a test message from a pretend customer.' : 'Customer messages arrive here in real time.'} />
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center gap-3 justify-between px-4 py-2.5 border-b border-line bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <IconButton icon="arrowLeft" label="Back" className="md:hidden" onClick={() => nav('/app/inbox')} />
                <Avatar name={conv.contact.name || conv.contact.wa_id} />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{conv.contact.name || phone(conv.contact.wa_id)}</p>
                  <p className="text-[12px] text-ink-3" dir="ltr">{phone(conv.contact.wa_id)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <WindowMeter expiresAt={conv.window_expires_at} />
                {conv.status !== 'resolved'
                  ? <Button size="sm" icon="check" onClick={() => update({ status: 'resolved' })}>Resolve</Button>
                  : <Button size="sm" onClick={() => update({ status: 'open' })}>Reopen</Button>}
              </div>
            </header>
            <div className="flex-1 overflow-y-auto chat-ground px-4 sm:px-8 py-4">
              {messages.map((m) => <Bubble key={m.id} m={m} onTap={isMockConv ? tapAsCustomer : undefined} />)}
              <div ref={bottomRef} />
            </div>
            <Composer conv={conv} quickReplies={quick || []} templates={templates || []}
              onSent={(m) => setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]))} />
          </>
        )}
      </section>
      {conv && <ContactPanel conv={conv} team={team || []} onUpdate={update} />}

      <Simulator open={simOpen} onClose={() => setSimOpen(false)} onDone={(cid) => { setSimOpen(false); nav(`/app/inbox/${cid}`); loadList(); }} />
      <NewChat open={newOpen} onClose={() => setNewOpen(false)} onDone={(cid) => { setNewOpen(false); nav(`/app/inbox/${cid}`); loadList(); }} />
    </div>
  );
}
