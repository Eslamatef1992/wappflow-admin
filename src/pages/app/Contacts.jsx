import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, del, download, patch, post, useApi } from '../../lib/api.js';
import { Avatar, Badge, Button, Confirm, Empty, Field, IconButton, Input, Loading, Modal, PageHeader, Pager, Select, Table, Toggle, cx, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { date, phone } from '../../lib/format.js';

const COLORS = ['#16a34a', '#0ea5e9', '#a855f7', '#e11d48', '#f59e0b', '#0f766e', '#64748b'];

function TagChip({ tag }) {
  return <span className="rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap" style={{ background: `${tag.color}1f`, color: tag.color }}>{tag.name}</span>;
}

function ContactForm({ open, onClose, contact, tags, onSaved }) {
  const [f, setF] = useState({});
  const [attrs, setAttrs] = useState([]);
  const [run, busy] = useAction();
  useEffect(() => {
    if (!open) return;
    setF({ phone: contact ? phone(contact.wa_id) : '', name: contact?.name || '', email: contact?.email || '', opted_in: contact?.opted_in ?? true, tagIds: contact?.tags?.map((t) => t.id) || [] });
    setAttrs(Object.entries(contact?.attributes || {}).map(([k, v]) => ({ k, v })));
  }, [open, contact]);
  const save = () => run(async () => {
    const body = { ...f, attributes: Object.fromEntries(attrs.filter((a) => a.k).map((a) => [a.k.trim().toLowerCase().replace(/\s+/g, '_'), a.v])) };
    const saved = contact ? await patch(`/api/app/contacts/${contact.id}`, body) : await post('/api/app/contacts', body);
    onSaved(saved);
  }, contact ? 'Contact saved' : 'Contact added');
  return (
    <Modal open={open} onClose={onClose} title={contact ? 'Edit contact' : 'Add contact'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>{contact ? 'Save contact' : 'Add contact'}</Button></>}>
      <Field label="WhatsApp number" hint="Include the country code, e.g. +965 5000 0000"><Input disabled={!!contact} value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><Input dir="auto" value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      </div>
      <Field label="Tags">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const on = f.tagIds?.includes(t.id);
            return (
              <button key={t.id} type="button" onClick={() => setF({ ...f, tagIds: on ? f.tagIds.filter((x) => x !== t.id) : [...(f.tagIds || []), t.id] })}
                className={cx('rounded px-2 py-1 text-xs font-medium border', on ? 'border-transparent' : 'border-line text-ink-3 bg-white')} style={on ? { background: `${t.color}1f`, color: t.color } : undefined}>
                {t.name}
              </button>
            );
          })}
          {!tags.length && <span className="text-ink-3 text-[13px]">Create tags from the Tags button first.</span>}
        </div>
      </Field>
      <div>
        <p className="text-[13px] font-medium mb-1">Custom fields</p>
        <p className="text-[12px] text-ink-3 mb-2">Use them in templates and chatbots, e.g. city or membership level.</p>
        {attrs.map((a, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input placeholder="Field" value={a.k} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} />
            <Input placeholder="Value" dir="auto" value={a.v} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
            <IconButton icon="trash" label="Remove field" onClick={() => setAttrs(attrs.filter((_, j) => j !== i))} />
          </div>
        ))}
        <Button size="sm" icon="plus" onClick={() => setAttrs([...attrs, { k: '', v: '' }])}>Add field</Button>
      </div>
      <div className="flex items-center justify-between">
        <div><p className="font-medium text-[13px]">Receives marketing</p><p className="text-ink-3 text-[12px]">Off if the customer replied STOP</p></div>
        <Toggle checked={f.opted_in} onChange={(v) => setF({ ...f, opted_in: v })} label="Receives marketing" />
      </div>
    </Modal>
  );
}

function ImportModal({ open, onClose, tags, onDone }) {
  const [file, setFile] = useState(null);
  const [tagId, setTagId] = useState('');
  const [result, setResult] = useState(null);
  const [run, busy] = useAction();
  const go = () => run(async () => {
    const form = new FormData();
    form.append('file', file);
    if (tagId) form.append('tagIds', tagId);
    const r = await api('/api/app/contacts/import', { method: 'POST', form });
    setResult(r); onDone();
  });
  return (
    <Modal open={open} onClose={() => { setResult(null); setFile(null); onClose(); }} title="Import contacts from CSV"
      footer={result ? <Button variant="primary" onClick={() => { setResult(null); setFile(null); onClose(); }}>Done</Button> : <><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} disabled={!file} onClick={go}>Import</Button></>}>
      {result ? (
        <div className="space-y-2">
          <p><b>{result.created}</b> added, <b>{result.updated}</b> updated, <b>{result.skipped}</b> skipped.</p>
          {result.errors.length > 0 && <ul className="text-[13px] text-danger list-disc pl-5">{result.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      ) : (
        <>
          <p className="text-ink-3 text-[13px]">The file needs a <b>phone</b> column. Optional: <b>name</b>, <b>email</b>, <b>tags</b> (separate with |). Any other column becomes a custom field. Local 8-digit numbers are treated as Kuwaiti (+965).</p>
          <label className="block border-2 border-dashed border-line rounded-lg p-6 text-center cursor-pointer hover:border-signal">
            <Icon name="upload" className="mx-auto text-ink-3 mb-2" size={22} />
            <span className="font-medium">{file ? file.name : 'Choose a CSV file'}</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <Field label="Also tag everyone in this file"><Select value={tagId} onChange={(e) => setTagId(e.target.value)} placeholder="No extra tag" options={tags.map((t) => ({ value: t.id, label: t.name }))} /></Field>
        </>
      )}
    </Modal>
  );
}

function TagsModal({ open, onClose, tags, reload }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [run, busy] = useAction();
  return (
    <Modal open={open} onClose={onClose} title="Tags">
      <div className="flex gap-2">
        <Input placeholder="New tag name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-1 items-center">{COLORS.slice(0, 5).map((c) => <button key={c} type="button" aria-label={`Color ${c}`} onClick={() => setColor(c)} className={cx('w-5 h-5 rounded-full', color === c && 'ring-2 ring-offset-1 ring-ink')} style={{ background: c }} />)}</div>
        <Button variant="primary" loading={busy} disabled={!name} onClick={() => run(async () => { await post('/api/app/tags', { name, color }); setName(''); reload(); })}>Add</Button>
      </div>
      <ul className="divide-y divide-line">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2"><TagChip tag={t} /><span className="text-ink-3 text-[13px]">{t.contacts} contacts</span></span>
            <IconButton icon="trash" label={`Delete ${t.name}`} onClick={() => run(async () => { await del(`/api/app/tags/${t.id}`); reload(); })} />
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default function Contacts() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [edit, setEdit] = useState(null);
  const [modal, setModal] = useState(null);
  const [run, busy] = useAction();
  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const params = new URLSearchParams({ page, limit: 50, ...(debounced ? { q: debounced } : {}), ...(tag ? { tag } : {}) });
  const { data, loading, reload } = useApi(`/api/app/contacts?${params}`);
  const tags = useApi('/api/app/tags');
  const all = data?.data || [];
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const bulk = (action, tagId) => run(async () => {
    await post('/api/app/contacts/bulk', { action, contactIds: selected, tagId });
    setSelected([]); reload(); tags.reload();
  }, action === 'delete' ? 'Contacts deleted' : 'Tags updated');

  const chat = (c) => run(async () => nav(`/app/inbox/${(await post('/api/app/conversations/start', { contactId: c.id })).id}`));

  return (
    <>
      <PageHeader title="Contacts" subtitle={data ? `${data.total.toLocaleString()} people who can receive your WhatsApp messages` : ' '}
        actions={<>
          <Button icon="tag" onClick={() => setModal('tags')}>Tags</Button>
          <Button icon="download" onClick={() => download('/api/app/contacts/export', 'contacts.csv')}>Export</Button>
          <Button icon="upload" onClick={() => setModal('import')}>Import CSV</Button>
          <Button variant="primary" icon="plus" onClick={() => { setEdit(null); setModal('form'); }}>Add contact</Button>
        </>} />
      <div className="bg-white border border-line rounded-lg">
        <div className="flex flex-wrap gap-2 p-3 border-b border-line items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="field pl-8" placeholder="Search name, number or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select className="!w-48" value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }} placeholder="All tags" options={(tags.data || []).map((t) => ({ value: t.id, label: `${t.name} (${t.contacts})` }))} />
          {selected.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-[13px] text-ink-3">{selected.length} selected</span>
              <Select className="!w-40" value="" onChange={(e) => e.target.value && bulk('tag', +e.target.value)} placeholder="Add tag…" options={(tags.data || []).map((t) => ({ value: t.id, label: t.name }))} />
              <Button size="sm" variant="danger" loading={busy} onClick={() => setModal('bulkdel')}>Delete</Button>
            </div>
          )}
        </div>
        {loading && !data ? <Loading /> : (
          <Table rows={all}
            empty={<Empty icon="users" title={debounced || tag ? 'No contacts match' : 'No contacts yet'} body="Import a CSV of your customers, or they'll be added automatically when they message you." action={!debounced && <Button variant="primary" icon="upload" onClick={() => setModal('import')}>Import CSV</Button>} />}
            columns={[
              { label: <input type="checkbox" aria-label="Select all" checked={all.length > 0 && selected.length === all.length} onChange={(e) => setSelected(e.target.checked ? all.map((c) => c.id) : [])} />, key: 'sel', className: 'w-8',
                render: (c) => <input type="checkbox" aria-label={`Select ${c.name || c.wa_id}`} checked={selected.includes(c.id)} onChange={() => toggle(c.id)} onClick={(e) => e.stopPropagation()} /> },
              { label: 'Name', key: 'name', render: (c) => <span className="flex items-center gap-2.5"><Avatar name={c.name || c.wa_id} size={28} /><span dir="auto" className="font-medium">{c.name || '—'}</span></span> },
              { label: 'WhatsApp', key: 'wa', render: (c) => <span dir="ltr" className="tabular-nums">{phone(c.wa_id)}</span> },
              { label: 'Tags', key: 'tags', render: (c) => <span className="flex flex-wrap gap-1">{c.tags.map((t) => <TagChip key={t.id} tag={t} />)}{!c.opted_in && <Badge tone="red">Opted out</Badge>}</span> },
              { label: 'Source', key: 'source', render: (c) => <span className="text-ink-3 capitalize">{c.source}</span> },
              { label: 'Added', key: 'created', render: (c) => <span className="text-ink-3">{date(c.created_at)}</span> },
              { label: '', key: 'act', className: 'text-right', render: (c) => (
                <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
                  <IconButton icon="inbox" label="Open chat" onClick={() => chat(c)} />
                  <IconButton icon="edit" label="Edit" onClick={() => { setEdit(c); setModal('form'); }} />
                </span>
              ) },
            ]}
            onRowClick={(c) => { setEdit(c); setModal('form'); }} />
        )}
        {data && <Pager page={page} total={data.total} limit={50} onChange={setPage} />}
      </div>
      <ContactForm open={modal === 'form'} contact={edit} tags={tags.data || []} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); tags.reload(); }} />
      <ImportModal open={modal === 'import'} tags={tags.data || []} onClose={() => setModal(null)} onDone={() => { reload(); tags.reload(); }} />
      <TagsModal open={modal === 'tags'} tags={tags.data || []} onClose={() => setModal(null)} reload={() => { tags.reload(); reload(); }} />
      <Confirm open={modal === 'bulkdel'} title={`Delete ${selected.length} contacts?`} body="Their conversation history will be deleted too. This can't be undone." busy={busy}
        onClose={() => setModal(null)} onConfirm={async () => { await bulk('delete'); setModal(null); }} />
    </>
  );
}
