import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { del, patch, post, put, useApi } from '../../lib/api.js';
import { useSession, can } from '../../lib/session.jsx';
import { Avatar, Badge, Button, CopyField, Empty, Field, IconButton, Input, Loading, Modal, PageHeader, Panel, Select, StatusBadge, Table, Tabs, Textarea, Toggle, useAction } from '../../components/ui.jsx';
import { ago, dateTime } from '../../lib/format.js';

function Numbers() {
  const { data, reload } = useApi('/api/app/numbers');
  const [modal, setModal] = useState(null);
  const [f, setF] = useState({});
  const [run, busy] = useAction();
  const [q] = useSearchParams();
  if (!data) return <Loading />;
  const list = data.data;
  return (
    <div className="space-y-6">
      {q.get('welcome') && !list.length && (
        <div className="rounded-lg bg-signal-wash border border-signal/30 p-4">
          <p className="font-semibold">Welcome! Connect a WhatsApp number to start.</p>
          <p className="text-[13px] mt-1">No Meta account yet? Add a demo number to try the inbox, chatbots and campaigns right away.</p>
        </div>
      )}
      <Panel title="WhatsApp numbers" padded={false} actions={<>
        <Button size="sm" onClick={() => setModal('mock')}>Add demo number</Button>
        <Button size="sm" variant="primary" icon="plus" onClick={() => { setF({}); setModal('live'); }}>Connect number</Button>
      </>}>
        <Table rows={list} empty={<Empty icon="phone" title="No number connected" body="Connect the WhatsApp Business number your customers already message." />}
          columns={[
            { label: 'Number', key: 'n', render: (n) => <div><p className="font-medium" dir="ltr">{n.display_phone}</p><p className="text-ink-3 text-[12px]">{n.label}</p></div> },
            { label: 'Type', key: 'm', render: (n) => <StatusBadge status={n.mode} /> },
            { label: 'Quality', key: 'q', render: (n) => (n.quality_rating ? <Badge tone={n.quality_rating === 'GREEN' ? 'green' : n.quality_rating === 'YELLOW' ? 'amber' : 'red'}>{n.quality_rating.toLowerCase()}</Badge> : '—') },
            { label: 'Phone number ID', key: 'p', render: (n) => <span className="font-mono text-[12px]">{n.phone_number_id}</span> },
            { label: 'Default', key: 'd', render: (n) => (n.is_default ? <Badge tone="ink">Default</Badge> : <button className="text-[13px] underline" onClick={() => run(async () => { await patch(`/api/app/numbers/${n.id}`, { is_default: true }); reload(); })}>Make default</button>) },
            { label: '', key: 'x', className: 'text-right', render: (n) => (
              <span className="inline-flex">
                <IconButton icon="refresh" label="Refresh status" onClick={() => run(async () => { await post(`/api/app/numbers/${n.id}/refresh`); reload(); }, 'Status refreshed')} />
                <IconButton icon="trash" label="Remove" onClick={() => run(async () => { await del(`/api/app/numbers/${n.id}`); reload(); }, 'Number removed')} />
              </span>
            ) },
          ]} />
      </Panel>
      <Panel title="Webhook for your Meta app">
        <p className="text-[13px] text-ink-3 mb-3">Only needed if you connect numbers through your own Meta app. In Meta for Developers → WhatsApp → Configuration, set this callback URL and verify token, and subscribe to the "messages" field.</p>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Callback URL"><CopyField value={data.webhook.url} /></Field>
          <Field label="Verify token"><CopyField value={data.webhook.verifyToken} /></Field>
        </div>
      </Panel>
      <Modal open={modal === 'live'} onClose={() => setModal(null)} title="Connect a WhatsApp Business number" width={560}
        footer={<><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/app/numbers', { ...f, mode: 'live' }); setModal(null); reload(); }, 'Number connected')}>Connect</Button></>}>
        <ol className="text-[13px] text-ink-3 list-decimal pl-5 space-y-1">
          <li>Open Meta Business Suite → WhatsApp Manager and copy the <b>Phone number ID</b> and <b>WhatsApp Business Account ID</b>.</li>
          <li>In Business Settings → System users, create a permanent token with <i>whatsapp_business_messaging</i> and <i>whatsapp_business_management</i>.</li>
        </ol>
        <Field label="Phone number ID"><Input value={f.phone_number_id || ''} onChange={(e) => setF({ ...f, phone_number_id: e.target.value })} /></Field>
        <Field label="WhatsApp Business Account ID"><Input value={f.waba_id || ''} onChange={(e) => setF({ ...f, waba_id: e.target.value })} /></Field>
        <Field label="Permanent access token" hint="Stored encrypted. Never shown again."><Input type="password" value={f.access_token || ''} onChange={(e) => setF({ ...f, access_token: e.target.value })} /></Field>
        <Field label="Label (optional)"><Input value={f.label || ''} placeholder="Main store" onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
      </Modal>
      <Modal open={modal === 'mock'} onClose={() => setModal(null)} title="Add a demo number"
        footer={<><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/app/numbers', { mode: 'mock', label: 'Demo number' }); setModal(null); reload(); }, 'Demo number added')}>Add demo number</Button></>}>
        <p className="text-ink-3">A demo number doesn't send real WhatsApp messages. Messages are marked delivered and read automatically, and you can play the customer from the inbox. Perfect for trying chatbots and showing the platform to your team.</p>
      </Modal>
    </div>
  );
}

function Team() {
  const { me } = useSession();
  const { data, reload } = useApi('/api/app/team');
  const [f, setF] = useState(null);
  const [run, busy] = useAction();
  const admin = can(me, 'owner', 'admin');
  return (
    <Panel title="Team" padded={false} actions={admin && <Button size="sm" variant="primary" icon="plus" onClick={() => setF({ name: '', email: '', password: '', role: 'agent' })}>Add member</Button>}>
      {!data ? <Loading /> : (
        <Table rows={data} columns={[
          { label: 'Name', key: 'n', render: (u) => <span className="flex items-center gap-2.5"><span className="relative"><Avatar name={u.name} size={30} />{u.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-signal ring-2 ring-white" title="Online" />}</span><span><p className="font-medium">{u.name}</p><p className="text-ink-3 text-[12px]">{u.email}</p></span></span> },
          { label: 'Role', key: 'r', render: (u) => (admin && u.role !== 'owner' && u.id !== me.user.id
            ? <Select className="!w-28 !py-1 text-[13px]" value={u.role} onChange={(e) => run(async () => { await patch(`/api/app/team/${u.id}`, { role: e.target.value }); reload(); })} options={[{ value: 'admin', label: 'Admin' }, { value: 'agent', label: 'Agent' }]} />
            : <span className="capitalize">{u.role}</span>) },
          { label: 'Open chats', key: 'o', render: (u) => u.open_conversations },
          { label: 'Last seen', key: 'l', render: (u) => <span className="text-ink-3">{u.online ? 'Online' : u.last_seen_at ? `${ago(u.last_seen_at)} ago` : 'Never'}</span> },
          { label: 'Active', key: 'a', render: (u) => <Toggle checked={u.is_active} disabled={!admin || u.role === 'owner' || u.id === me.user.id} label="Active" onChange={(v) => run(async () => { await patch(`/api/app/team/${u.id}`, { is_active: v }); reload(); })} /> },
          { label: '', key: 'x', className: 'text-right', render: (u) => admin && u.role !== 'owner' && u.id !== me.user.id && <IconButton icon="trash" label="Remove" onClick={() => run(async () => { await del(`/api/app/team/${u.id}`); reload(); }, 'Member removed')} /> },
        ]} />
      )}
      <Modal open={!!f} onClose={() => setF(null)} title="Add team member"
        footer={<><Button onClick={() => setF(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/app/team', f); setF(null); reload(); }, 'Member added')}>Add member</Button></>}>
        {f && <>
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Temporary password" hint="Share it with them; they can change it after signing in"><Input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Field label="Role" hint="Agents see their own and unassigned chats. Admins manage everything except billing ownership.">
            <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} options={[{ value: 'agent', label: 'Agent' }, { value: 'admin', label: 'Admin' }]} />
          </Field>
        </>}
      </Modal>
    </Panel>
  );
}

function QuickReplies() {
  const { data, reload } = useApi('/api/app/quick-replies');
  const [f, setF] = useState(null);
  const [run, busy] = useAction();
  return (
    <Panel title="Quick replies" padded={false} actions={<Button size="sm" variant="primary" icon="plus" onClick={() => setF({ shortcut: '', body: '' })}>Add reply</Button>}>
      {!data ? <Loading /> : (
        <Table rows={data} onRowClick={setF} empty={<Empty icon="zap" title="No quick replies" body='Save answers you type often. Agents insert them by typing "/" in the inbox.' />}
          columns={[
            { label: 'Shortcut', key: 's', render: (r) => <span className="font-mono text-signal-deep">/{r.shortcut}</span> },
            { label: 'Message', key: 'b', render: (r) => <span dir="auto" className="line-clamp-2">{r.body}</span> },
          ]} />
      )}
      <Modal open={!!f} onClose={() => setF(null)} title={f?.id ? 'Edit quick reply' : 'New quick reply'}
        footer={<>{f?.id && <Button variant="danger" className="mr-auto" onClick={() => run(async () => { await del(`/api/app/quick-replies/${f.id}`); setF(null); reload(); })}>Delete</Button>}<Button onClick={() => setF(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { if (f.id) await put(`/api/app/quick-replies/${f.id}`, f); else await post('/api/app/quick-replies', f); setF(null); reload(); }, 'Saved')}>Save</Button></>}>
        {f && <>
          <Field label="Shortcut"><Input value={f.shortcut} placeholder="hours" onChange={(e) => setF({ ...f, shortcut: e.target.value.replace(/\s/g, '') })} /></Field>
          <Field label="Message"><Textarea rows={4} dir="auto" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        </>}
      </Modal>
    </Panel>
  );
}

function Developers() {
  const keys = useApi('/api/app/api-keys');
  const hooks = useApi('/api/app/webhooks');
  const [newKey, setNewKey] = useState(null);
  const [hook, setHook] = useState(null);
  const [run, busy] = useAction();
  const base = window.location.origin;
  if (keys.error?.status === 402) return <Empty icon="key" title="API access isn't in your plan" body="Upgrade to connect your website, ERP or app to WhatsApp." />;
  return (
    <div className="space-y-6">
      <Panel title="API keys" padded={false} actions={<Button size="sm" variant="primary" icon="plus" loading={busy} onClick={() => run(async () => { setNewKey(await post('/api/app/api-keys', { name: `Key ${new Date().toLocaleDateString('en-GB')}` })); keys.reload(); })}>Create key</Button>}>
        <Table rows={keys.data || []} empty={<p className="p-4 text-ink-3 text-[13px]">No keys yet.</p>}
          columns={[
            { label: 'Name', key: 'name' },
            { label: 'Key', key: 'p', render: (k) => <span className="font-mono text-[12px]">{k.prefix}…</span> },
            { label: 'Last used', key: 'l', render: (k) => <span className="text-ink-3">{k.last_used_at ? dateTime(k.last_used_at) : 'Never'}</span> },
            { label: '', key: 'x', className: 'text-right', render: (k) => <IconButton icon="trash" label="Revoke" onClick={() => run(async () => { await del(`/api/app/api-keys/${k.id}`); keys.reload(); }, 'Key revoked')} /> },
          ]} />
        <div className="p-4 border-t border-line">
          <p className="text-[13px] font-medium mb-2">Send a template from your system</p>
          <pre className="bg-ink text-white/90 rounded-md p-3 text-[12px] overflow-x-auto" dir="ltr">{`curl -X POST ${base}/api/v1/messages \\
  -H "X-API-Key: wsk_…" -H "Content-Type: application/json" \\
  -d '{"to":"+96550000000","template":"order_shipped","variables":{"body":["Ali","#1042"]}}'`}</pre>
          <p className="text-[12px] text-ink-3 mt-2">Also available: POST /api/v1/contacts, POST /api/v1/orders, PATCH /api/v1/orders/:id, GET /api/v1/templates.</p>
        </div>
      </Panel>
      <Panel title="Webhooks to your system" padded={false} actions={<Button size="sm" variant="primary" icon="plus" onClick={() => setHook({ url: '', events: [] })}>Add endpoint</Button>}>
        <Table rows={hooks.data?.data || []} empty={<p className="p-4 text-ink-3 text-[13px]">Get notified in real time when customers message you or orders change.</p>}
          columns={[
            { label: 'URL', key: 'u', render: (h) => <span className="font-mono text-[12px] break-all">{h.url}</span> },
            { label: 'Events', key: 'e', render: (h) => <span className="text-[13px]">{h.events.includes('*') ? 'All events' : `${h.events.length} events`}</span> },
            { label: 'Signing secret', key: 's', render: (h) => <span className="font-mono text-[12px]">{h.secret}</span> },
            { label: 'Health', key: 'f', render: (h) => (h.failures ? <Badge tone="red">{h.failures} failures</Badge> : <Badge tone="green">OK</Badge>) },
            { label: '', key: 'x', className: 'text-right', render: (h) => (
              <span className="inline-flex">
                <Button size="sm" variant="ghost" onClick={() => run(async () => post(`/api/app/webhooks/${h.id}/test`), 'Test event sent')}>Test</Button>
                <IconButton icon="trash" label="Delete" onClick={() => run(async () => { await del(`/api/app/webhooks/${h.id}`); hooks.reload(); })} />
              </span>
            ) },
          ]} />
        <p className="p-4 border-t border-line text-[12px] text-ink-3">Each request carries an <span className="font-mono">X-WappFlow-Signature</span> header: HMAC-SHA256 of the raw body using the endpoint's signing secret.</p>
      </Panel>
      <Modal open={!!newKey} onClose={() => setNewKey(null)} title="Your new API key" footer={<Button variant="primary" onClick={() => setNewKey(null)}>I've copied it</Button>}>
        {newKey && <><p className="text-[13px] text-ink-3">Copy it now. For your security it won't be shown again.</p><CopyField value={newKey.key} /></>}
      </Modal>
      <Modal open={!!hook} onClose={() => setHook(null)} title="Add webhook endpoint"
        footer={<><Button onClick={() => setHook(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(async () => { await post('/api/app/webhooks', hook); setHook(null); hooks.reload(); }, 'Endpoint added')}>Add endpoint</Button></>}>
        {hook && <>
          <Field label="URL"><Input placeholder="https://your-system.com/whatsapp-events" value={hook.url} onChange={(e) => setHook({ ...hook, url: e.target.value })} /></Field>
          <Field label="Events" hint="Leave all unchecked to receive everything">
            <div className="grid grid-cols-2 gap-1.5 text-[13px]">
              {(hooks.data?.events || []).map((ev) => (
                <label key={ev} className="flex items-center gap-2"><input type="checkbox" checked={hook.events.includes(ev)} onChange={(e) => setHook({ ...hook, events: e.target.checked ? [...hook.events, ev] : hook.events.filter((x) => x !== ev) })} /><span className="font-mono text-[12px]">{ev}</span></label>
              ))}
            </div>
          </Field>
        </>}
      </Modal>
    </div>
  );
}

function Workspace() {
  const { me, refresh } = useSession();
  const [f, setF] = useState({ name: me.tenant.name, timezone: me.tenant.timezone || 'Asia/Kuwait' });
  const [pw, setPw] = useState({ current: '', password: '' });
  const [run, busy] = useAction();
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {can(me, 'owner', 'admin') && (
        <Panel title="Workspace">
          <div className="space-y-4">
            <Field label="Business name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Timezone"><Select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} options={['Asia/Kuwait', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Bahrain', 'Asia/Qatar', 'Asia/Muscat', 'Africa/Cairo', 'Europe/London']} /></Field>
            <Button variant="primary" loading={busy} onClick={() => run(async () => { await patch('/api/app/workspace', f); await refresh(); }, 'Workspace saved')}>Save workspace</Button>
          </div>
        </Panel>
      )}
      <Panel title="Your password">
        <div className="space-y-4">
          <Field label="Current password"><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="New password" hint="At least 8 characters"><Input type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
          <Button loading={busy} onClick={() => run(async () => { await post('/api/auth/change-password', pw); setPw({ current: '', password: '' }); }, 'Password changed')}>Change password</Button>
        </div>
      </Panel>
    </div>
  );
}

export default function Settings() {
  const { me } = useSession();
  const [q, setQ] = useSearchParams();
  const admin = can(me, 'owner', 'admin');
  const tabs = [
    admin && { value: 'numbers', label: 'WhatsApp numbers' },
    { value: 'team', label: 'Team' },
    { value: 'quick', label: 'Quick replies' },
    admin && me.plan?.features?.api !== false && { value: 'dev', label: 'API & webhooks' },
    { value: 'workspace', label: 'Account' },
  ].filter(Boolean);
  const tab = q.get('tab') || tabs[0].value;
  return (
    <>
      <PageHeader title="Settings" />
      <Tabs value={tab} onChange={(v) => setQ({ tab: v })} tabs={tabs} />
      {tab === 'numbers' && <Numbers />}
      {tab === 'team' && <Team />}
      {tab === 'quick' && <QuickReplies />}
      {tab === 'dev' && <Developers />}
      {tab === 'workspace' && <Workspace />}
    </>
  );
}
