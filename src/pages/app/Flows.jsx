import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { del, post, useApi } from '../../lib/api.js';
import { Badge, Button, Confirm, Empty, Field, Input, Loading, Modal, PageHeader, Select, Table, Toggle, useAction } from '../../components/ui.jsx';
import { dateTime, num } from '../../lib/format.js';

export const TRIGGERS = [
  { value: 'keyword', label: 'Customer sends a keyword' },
  { value: 'new_contact', label: 'A new customer writes for the first time' },
  { value: 'any_message', label: 'Any message (when no other chatbot matches)' },
];

export default function Flows() {
  const nav = useNavigate();
  const { data, loading, reload } = useApi('/api/app/flows');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', trigger_type: 'keyword', trigger_value: 'hi, hello, مرحبا' });
  const [toDelete, setToDelete] = useState(null);
  const [run, busy] = useAction();
  return (
    <>
      <PageHeader title="Chatbots" subtitle="Automatic replies with buttons and questions. A chatbot hands the chat to your team whenever it reaches a hand-over step."
        actions={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>New chatbot</Button>} />
      <div className="bg-white border border-line rounded-lg">
        {loading ? <Loading /> : (
          <Table rows={data} onRowClick={(x) => nav(`/app/flows/${x.id}`)}
            empty={<Empty icon="bot" title="No chatbots yet" body="Start with a welcome menu: greet customers, show options, and hand over to an agent when needed." action={<Button variant="primary" onClick={() => setOpen(true)}>Create a welcome menu</Button>} />}
            columns={[
              { label: 'Name', key: 'name', render: (x) => <span className="font-medium">{x.name}</span> },
              { label: 'Starts when', key: 'trigger', render: (x) => (x.trigger_type === 'keyword' ? <span className="flex flex-wrap gap-1">{String(x.trigger_value).split(',').filter(Boolean).slice(0, 4).map((k) => <Badge key={k} dir="auto">{k.trim()}</Badge>)}</span> : TRIGGERS.find((t) => t.value === x.trigger_type)?.label) },
              { label: 'Steps', key: 'nodes', render: (x) => x.nodes },
              { label: 'Runs', key: 'runs', render: (x) => <span className="tabular-nums">{num(x.runs)}</span> },
              { label: 'Edited', key: 'up', render: (x) => <span className="text-ink-3">{dateTime(x.updated_at)}</span> },
              { label: 'Live', key: 'live', render: (x) => <span onClick={(e) => e.stopPropagation()}><Toggle label="Live" checked={x.is_active} onChange={(v) => run(async () => { await post(`/api/app/flows/${x.id}/toggle`, { active: v }); reload(); }, v ? 'Chatbot is live' : 'Chatbot turned off')} /></span> },
              { label: '', key: 'del', className: 'text-right', render: (x) => <button className="text-[13px] text-ink-3 hover:text-danger" onClick={(e) => { e.stopPropagation(); setToDelete(x); }}>Delete</button> },
            ]} />
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New chatbot"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" loading={busy} disabled={!f.name} onClick={() => run(async () => nav(`/app/flows/${(await post('/api/app/flows', f)).id}`))}>Create and edit</Button></>}>
        <Field label="Name"><Input value={f.name} placeholder="Welcome menu" onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Starts when"><Select value={f.trigger_type} onChange={(e) => setF({ ...f, trigger_type: e.target.value })} options={TRIGGERS} /></Field>
        {f.trigger_type === 'keyword' && <Field label="Keywords" hint="Separate with commas. Arabic works too."><Input dir="auto" value={f.trigger_value} onChange={(e) => setF({ ...f, trigger_value: e.target.value })} /></Field>}
      </Modal>
      <Confirm open={!!toDelete} title="Delete chatbot?" body={`"${toDelete?.name}" will stop answering customers.`} busy={busy}
        onClose={() => setToDelete(null)} onConfirm={() => run(async () => { await del(`/api/app/flows/${toDelete.id}`); setToDelete(null); reload(); }, 'Chatbot deleted')} />
    </>
  );
}
