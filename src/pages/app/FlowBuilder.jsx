import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, Handle, Position, addEdge, useEdgesState, useNodesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { get, post, put, useApi } from '../../lib/api.js';
import { Button, Field, IconButton, Input, Loading, Select, Textarea, Toggle, cx, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { TRIGGERS } from './Flows.jsx';

// ---------- node catalogue ----------
const KINDS = {
  start: { label: 'Start', icon: 'play', color: '#0f2a2e', help: 'Where the chatbot begins' },
  message: { label: 'Send message', icon: 'send', color: '#1faf6a', help: 'Plain text, emoji and links' },
  buttons: { label: 'Buttons', icon: 'more', color: '#1faf6a', help: 'Up to 3 tappable replies' },
  list: { label: 'List menu', icon: 'file', color: '#1faf6a', help: 'Up to 10 options in a menu' },
  question: { label: 'Ask a question', icon: 'note', color: '#2f8ae0', help: 'Wait for a typed answer and save it' },
  media: { label: 'Image or file', icon: 'image', color: '#1faf6a', help: 'Send a picture, PDF or video' },
  condition: { label: 'Condition', icon: 'flow', color: '#a855f7', help: 'Branch on an answer or contact detail' },
  tag: { label: 'Tag contact', icon: 'tag', color: '#e39b2d', help: 'Add or remove a tag' },
  attribute: { label: 'Save detail', icon: 'edit', color: '#e39b2d', help: 'Set a custom field on the contact' },
  webhook: { label: 'Call your system', icon: 'link', color: '#64748b', help: 'POST to a URL, use the response' },
  delay: { label: 'Wait', icon: 'clock', color: '#64748b', help: 'Pause before the next step' },
  assign: { label: 'Hand over to team', icon: 'users', color: '#c8412f', help: 'Stop the bot and assign an agent' },
  end: { label: 'End', icon: 'x', color: '#5a7176', help: 'Finish quietly or with a goodbye' },
};
const NO_OUT = ['assign', 'end'];

const uid = () => Math.random().toString(36).slice(2, 8);

function summary(type, d) {
  switch (type) {
    case 'buttons': case 'list': return d.text;
    case 'question': return `${d.text || ''}${d.saveTo ? `\n→ saves to ${d.saveTo}` : ''}`;
    case 'condition': return `If ${d.field || 'vars.last_reply'} ${(d.operator || 'equals').replace('_', ' ')} "${d.value || ''}"`;
    case 'tag': return `${d.action === 'remove' ? 'Remove' : 'Add'} tag "${d.tag || ''}"`;
    case 'attribute': return `${d.key || 'field'} = ${d.value || ''}`;
    case 'webhook': return `${d.method || 'POST'} ${d.url || ''}`;
    case 'delay': return `${d.seconds || 60} seconds`;
    case 'media': return `${d.mediaType || 'image'}: ${d.caption || d.url || ''}`;
    default: return d.text;
  }
}

function FlowNode({ type, data, selected }) {
  const k = KINDS[type];
  const options = type === 'buttons' ? data.buttons || [] : type === 'list' ? data.rows || [] : null;
  const branches = type === 'condition' ? [{ id: 'true', title: 'Yes' }, { id: 'false', title: 'No' }] : type === 'webhook' ? [{ id: 'success', title: 'Success' }, { id: 'error', title: 'Failed' }] : null;
  const text = summary(type, data);
  return (
    <div className={cx('bg-white rounded-lg border w-[240px] shadow-sm text-[13px]', selected ? 'border-ink ring-2 ring-ink/15' : 'border-line')}>
      {type !== 'start' && <Handle type="target" position={Position.Left} />}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <span className="w-6 h-6 rounded grid place-items-center text-white shrink-0" style={{ background: k.color }}><Icon name={k.icon} size={13} /></span>
        <span className="font-semibold truncate">{data.label || k.label}</span>
      </div>
      {text && <p className="px-3 py-2 text-ink-3 whitespace-pre-wrap line-clamp-4" dir="auto">{text}</p>}
      {(options || branches) && (
        <div className="px-3 pb-2 space-y-1">
          {(options || branches).map((o) => (
            <div key={o.id} className="relative rounded border border-line px-2 py-1 bg-paper text-[12px] font-medium truncate pr-4" dir="auto">
              {o.title || 'Untitled'}
              <Handle type="source" id={o.id} position={Position.Right} className="opt" style={{ right: -17 }} />
            </div>
          ))}
        </div>
      )}
      {!options && !branches && !NO_OUT.includes(type) && <Handle type="source" position={Position.Right} />}
      {(type === 'webhook') && <p className="px-3 pb-2 text-[11px] text-ink-3">Unconnected branches continue from the right edge</p>}
    </div>
  );
}

const nodeTypes = Object.fromEntries(Object.keys(KINDS).map((k) => [k, FlowNode]));

function defaults(type) {
  switch (type) {
    case 'message': return { text: 'Thanks for your message!' };
    case 'buttons': return { text: 'Please choose:', buttons: [{ id: uid(), title: 'Option 1' }, { id: uid(), title: 'Option 2' }] };
    case 'list': return { text: 'How can we help?', buttonText: 'View options', rows: [{ id: uid(), title: 'Option 1' }] };
    case 'question': return { text: 'What is your name?', variable: 'answer', saveTo: 'name' };
    case 'condition': return { field: 'vars.last_reply', operator: 'contains', value: '' };
    case 'tag': return { tag: '', action: 'add' };
    case 'attribute': return { key: '', value: '{{vars.last_reply}}' };
    case 'webhook': return { url: 'https://', method: 'POST' };
    case 'delay': return { seconds: 60 };
    case 'media': return { mediaType: 'image', url: '', caption: '' };
    case 'assign': return { text: 'Connecting you with our team…', strategy: 'least_busy' };
    case 'end': return { text: '' };
    default: return {};
  }
}

// ---------- inspector ----------
function OptionsEditor({ items, onChange, max, label, withDescription }) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {items.map((o, i) => (
          <div key={o.id} className="flex gap-1.5">
            <div className="flex-1 space-y-1">
              <Input dir="auto" maxLength={withDescription ? 24 : 20} value={o.title} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              {withDescription && <Input dir="auto" maxLength={72} placeholder="Description (optional)" value={o.description || ''} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />}
            </div>
            <IconButton icon="trash" label="Remove option" onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </div>
        ))}
        {items.length < max && <Button size="sm" icon="plus" onClick={() => onChange([...items, { id: uid(), title: `Option ${items.length + 1}` }])}>Add option</Button>}
      </div>
    </Field>
  );
}

const VARS_HINT = 'Use {{contact.first_name}}, {{contact.attributes.city}} or {{vars.answer}}';

function Inspector({ node, onChange, onDelete, team }) {
  if (!node) {
    return <div className="p-5 text-ink-3 text-[13px]">Select a step to edit it. Drag from a dot on the right of a step to connect it to the next one.</div>;
  }
  const d = node.data;
  const set = (patch) => onChange({ ...d, ...patch });
  const k = KINDS[node.type];
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded grid place-items-center text-white" style={{ background: k.color }}><Icon name={k.icon} size={13} /></span>{k.label}</p>
        {node.type !== 'start' && <IconButton icon="trash" label="Delete step" onClick={onDelete} />}
      </div>
      {node.type !== 'start' && <Field label="Step name"><Input value={d.label || ''} placeholder={k.label} onChange={(e) => set({ label: e.target.value })} /></Field>}
      {['message', 'buttons', 'list', 'question', 'assign', 'end'].includes(node.type) && (
        <Field label={node.type === 'end' || node.type === 'assign' ? 'Message (optional)' : 'Message'} hint={VARS_HINT}>
          <Textarea rows={4} dir="auto" value={d.text || ''} onChange={(e) => set({ text: e.target.value })} />
        </Field>
      )}
      {node.type === 'buttons' && <>
        <Field label="Header (optional)"><Input dir="auto" maxLength={60} value={d.header || ''} onChange={(e) => set({ header: e.target.value })} /></Field>
        <OptionsEditor label="Buttons (max 3, 20 characters)" max={3} items={d.buttons || []} onChange={(buttons) => set({ buttons })} />
        <Field label="Footer (optional)"><Input dir="auto" maxLength={60} value={d.footer || ''} onChange={(e) => set({ footer: e.target.value })} /></Field>
      </>}
      {node.type === 'list' && <>
        <Field label="Menu button text"><Input dir="auto" maxLength={20} value={d.buttonText || ''} onChange={(e) => set({ buttonText: e.target.value })} /></Field>
        <OptionsEditor label="Rows (max 10)" max={10} withDescription items={d.rows || []} onChange={(rows) => set({ rows })} />
      </>}
      {node.type === 'question' && <>
        <Field label="Remember the answer as" hint="Use it later as {{vars.NAME}}"><Input value={d.variable || ''} onChange={(e) => set({ variable: e.target.value.replace(/\W/g, '_') })} /></Field>
        <Field label="Also save to contact">
          <Select value={d.saveTo || ''} onChange={(e) => set({ saveTo: e.target.value })} placeholder="Don't save"
            options={[{ value: 'name', label: 'Name' }, { value: 'email', label: 'Email' }, ...(d.saveTo && !['name', 'email'].includes(d.saveTo) ? [{ value: d.saveTo, label: `Custom field: ${d.saveTo}` }] : [])]} />
        </Field>
        <Field label="…or custom field"><Input placeholder="e.g. city" value={!['name', 'email'].includes(d.saveTo) ? d.saveTo || '' : ''} onChange={(e) => set({ saveTo: e.target.value.trim().toLowerCase().replace(/\s+/g, '_') })} /></Field>
      </>}
      {node.type === 'media' && <>
        <Field label="Type"><Select value={d.mediaType} onChange={(e) => set({ mediaType: e.target.value })} options={[{ value: 'image', label: 'Image' }, { value: 'document', label: 'Document' }, { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }]} /></Field>
        <Field label="Public link"><Input value={d.url || ''} placeholder="https://…" onChange={(e) => set({ url: e.target.value })} /></Field>
        <Field label="Caption"><Input dir="auto" value={d.caption || ''} onChange={(e) => set({ caption: e.target.value })} /></Field>
        {d.mediaType === 'document' && <Field label="File name"><Input value={d.filename || ''} onChange={(e) => set({ filename: e.target.value })} /></Field>}
      </>}
      {node.type === 'condition' && <>
        <Field label="Check" hint="vars.last_reply is the customer's latest message">
          <Select value={d.field} onChange={(e) => set({ field: e.target.value })}
            options={[{ value: 'vars.last_reply', label: 'Last reply' }, { value: 'vars.choice', label: 'Last button chosen' }, { value: 'contact.name', label: 'Contact name' }, { value: 'contact.email', label: 'Contact email' }, ...(d.field?.startsWith('contact.attributes.') || d.field?.startsWith('vars.') && !['vars.last_reply', 'vars.choice'].includes(d.field) ? [{ value: d.field, label: d.field }] : [])]} />
        </Field>
        <Field label="…or any value"><Input placeholder="contact.attributes.city" value={d.field} onChange={(e) => set({ field: e.target.value })} /></Field>
        <Field label="Operator"><Select value={d.operator} onChange={(e) => set({ operator: e.target.value })} options={[['equals', 'equals'], ['not_equals', 'is not'], ['contains', 'contains'], ['starts_with', 'starts with'], ['is_set', 'has a value'], ['is_not_set', 'is empty'], ['gt', 'greater than'], ['lt', 'less than']].map(([value, label]) => ({ value, label }))} /></Field>
        {!['is_set', 'is_not_set'].includes(d.operator) && <Field label="Value"><Input dir="auto" value={d.value || ''} onChange={(e) => set({ value: e.target.value })} /></Field>}
      </>}
      {node.type === 'tag' && <>
        <Field label="Action"><Select value={d.action} onChange={(e) => set({ action: e.target.value })} options={[{ value: 'add', label: 'Add tag' }, { value: 'remove', label: 'Remove tag' }]} /></Field>
        <Field label="Tag name" hint="Created automatically if new"><Input dir="auto" value={d.tag || ''} onChange={(e) => set({ tag: e.target.value })} /></Field>
      </>}
      {node.type === 'attribute' && <>
        <Field label="Custom field"><Input value={d.key || ''} placeholder="city" onChange={(e) => set({ key: e.target.value.trim().toLowerCase().replace(/\s+/g, '_') })} /></Field>
        <Field label="Value" hint={VARS_HINT}><Input dir="auto" value={d.value || ''} onChange={(e) => set({ value: e.target.value })} /></Field>
      </>}
      {node.type === 'webhook' && <>
        <Field label="URL"><Input value={d.url || ''} onChange={(e) => set({ url: e.target.value })} /></Field>
        <Field label="Method"><Select value={d.method} onChange={(e) => set({ method: e.target.value })} options={['POST', 'GET']} /></Field>
        <p className="text-[12px] text-ink-3">We send the contact and answers as JSON. Fields in the JSON response are available as {'{{vars.webhook.FIELD}}'}.</p>
      </>}
      {node.type === 'delay' && <Field label="Wait (seconds)"><Input type="number" min={1} value={d.seconds || 60} onChange={(e) => set({ seconds: +e.target.value })} /></Field>}
      {node.type === 'assign' && (
        <Field label="Assign to">
          <Select value={d.userId || d.strategy || 'least_busy'} onChange={(e) => (/^\d+$/.test(e.target.value) ? set({ userId: +e.target.value, strategy: undefined }) : set({ userId: undefined, strategy: e.target.value }))}
            options={[{ value: 'least_busy', label: 'Least busy agent' }, { value: 'unassigned', label: 'Leave unassigned' }, ...team.map((u) => ({ value: u.id, label: u.name }))]} />
        </Field>
      )}
    </div>
  );
}

// ---------- page ----------
export default function FlowBuilder() {
  const { id } = useParams();
  const [flow, setFlow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [run, busy] = useAction();
  const team = useApi('/api/app/team');

  useEffect(() => {
    get(`/api/app/flows/${id}`).then((f) => {
      setFlow(f);
      setNodes(f.graph.nodes || []);
      setEdges((f.graph.edges || []).map((e) => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } })));
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = nodes.find((n) => n.id === selectedId);
  const onConnect = useCallback((c) => {
    // one outgoing edge per handle
    setEdges((es) => addEdge({ ...c, id: `e${uid()}`, markerEnd: { type: MarkerType.ArrowClosed } }, es.filter((e) => !(e.source === c.source && (e.sourceHandle || null) === (c.sourceHandle || null)))));
    setDirty(true);
  }, [setEdges]);

  const addNode = (type) => {
    const nid = `${type}_${uid()}`;
    const maxX = nodes.reduce((m, n) => Math.max(m, n.position.x), 0);
    setNodes((ns) => [...ns, { id: nid, type, position: { x: maxX + 300, y: 120 + (ns.length % 4) * 60 }, data: { label: KINDS[type].label, ...defaults(type) } }]);
    setSelectedId(nid); setDirty(true);
  };
  const updateNode = (data) => {
    setNodes((ns) => ns.map((n) => (n.id === selectedId ? { ...n, data } : n)));
    // drop edges from options that no longer exist
    const opts = data.buttons || data.rows;
    if (opts) setEdges((es) => es.filter((e) => e.source !== selectedId || !e.sourceHandle || opts.some((o) => o.id === e.sourceHandle)));
    setDirty(true);
  };
  const deleteNode = () => {
    setNodes((ns) => ns.filter((n) => n.id !== selectedId));
    setEdges((es) => es.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null); setDirty(true);
  };
  const graph = () => ({ nodes: nodes.map(({ id: nid, type, position, data }) => ({ id: nid, type, position, data })), edges: edges.map(({ id: eid, source, target, sourceHandle }) => ({ id: eid, source, target, sourceHandle: sourceHandle || undefined })) });
  const save = () => run(async () => { const f = await put(`/api/app/flows/${id}`, { graph: graph(), name: flow.name, trigger_type: flow.trigger_type, trigger_value: flow.trigger_value }); setFlow(f); setDirty(false); }, 'Chatbot saved');
  const toggle = (active) => run(async () => {
    if (dirty) await put(`/api/app/flows/${id}`, { graph: graph(), name: flow.name, trigger_type: flow.trigger_type, trigger_value: flow.trigger_value });
    setFlow(await post(`/api/app/flows/${id}/toggle`, { active })); setDirty(false);
  }, active ? 'Chatbot is live' : 'Chatbot turned off');

  const palette = useMemo(() => Object.entries(KINDS).filter(([k]) => k !== 'start'), []);
  if (!flow) return <Loading />;

  return (
    <div className="h-full flex flex-col">
      <header className="flex flex-wrap items-center gap-3 justify-between px-4 py-2.5 bg-white border-b border-line">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/app/flows" className="text-ink-3 hover:text-ink" aria-label="Back to chatbots"><Icon name="arrowLeft" /></Link>
          <input className="font-semibold text-[16px] bg-transparent border-0 focus:outline-none focus:bg-paper rounded px-1 min-w-0" value={flow.name} onChange={(e) => { setFlow({ ...flow, name: e.target.value }); setDirty(true); }} aria-label="Chatbot name" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="!w-auto !py-1.5 text-[13px]" value={flow.trigger_type} onChange={(e) => { setFlow({ ...flow, trigger_type: e.target.value }); setDirty(true); }} options={TRIGGERS} />
          {flow.trigger_type === 'keyword' && <input className="field !py-1.5 text-[13px] !w-56" value={flow.trigger_value || ''} onChange={(e) => { setFlow({ ...flow, trigger_value: e.target.value }); setDirty(true); }} placeholder="hi, hello, مرحبا" aria-label="Keywords" />}
          <span className="flex items-center gap-2 text-[13px] px-2"><Toggle checked={flow.is_active} onChange={toggle} label="Live" />{flow.is_active ? 'Live' : 'Off'}</span>
          <Button variant="primary" loading={busy} disabled={!dirty} onClick={save}>{dirty ? 'Save changes' : 'Saved'}</Button>
        </div>
      </header>
      <div className="flex-1 flex min-h-0">
        <aside className="w-[200px] shrink-0 bg-white border-r border-line overflow-y-auto p-3 hidden md:block">
          <p className="text-[12px] text-ink-3 mb-2 px-1">Add a step</p>
          {palette.map(([type, k]) => (
            <button key={type} onClick={() => addNode(type)} title={k.help} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-paper text-left text-[13px]">
              <span className="w-6 h-6 rounded grid place-items-center text-white shrink-0" style={{ background: k.color }}><Icon name={k.icon} size={13} /></span>{k.label}
            </button>
          ))}
        </aside>
        <div className="flex-1 min-w-0 bg-paper">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={(c) => { onNodesChange(c); if (c.some((x) => x.type === 'position' && x.dragging === false)) setDirty(true); }}
            onEdgesChange={(c) => { onEdgesChange(c); if (c.some((x) => x.type === 'remove')) setDirty(true); }}
            onConnect={onConnect} onNodeClick={(_, n) => setSelectedId(n.id)} onPaneClick={() => setSelectedId(null)}
            deleteKeyCode={['Backspace', 'Delete']} fitView fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
            defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: '#5a7176' } }}>
            <Background gap={18} size={1} color="#cfd8d5" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="w-[320px] shrink-0 bg-white border-l border-line overflow-y-auto">
          <Inspector node={selected} onChange={updateNode} onDelete={deleteNode} team={team.data || []} />
          <div className="md:hidden p-4 border-t border-line">
            <Select value="" onChange={(e) => e.target.value && addNode(e.target.value)} placeholder="Add a step…" options={palette.map(([v, k]) => ({ value: v, label: k.label }))} />
          </div>
        </aside>
      </div>
    </div>
  );
}
