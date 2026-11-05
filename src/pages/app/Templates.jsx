import { useMemo, useState } from 'react';
import { del, post, useApi } from '../../lib/api.js';
import { Button, Confirm, Empty, Field, IconButton, Input, Loading, Modal, PageHeader, Select, StatusBadge, Textarea, cx, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { isRtl } from '../../lib/format.js';
import { useT } from '../../lib/i18n.jsx';

// ---------- shared helpers used by inbox, campaigns and automations ----------
const varCount = (text) => (String(text || '').match(/\{\{\d+\}\}/g) || []).length;

export function templateParts(t) {
  const comps = t?.components || [];
  return {
    header: comps.find((c) => c.type === 'HEADER'),
    body: comps.find((c) => c.type === 'BODY'),
    footer: comps.find((c) => c.type === 'FOOTER'),
    buttons: comps.find((c) => c.type === 'BUTTONS')?.buttons || [],
  };
}

export function emptyVariables(t) {
  const { header, body, buttons } = templateParts(t);
  const v = {
    header: header?.format === 'TEXT' ? Array.from({ length: varCount(header.text) }, () => ({ source: 'field', value: 'contact.first_name' })) : [],
    body: Array.from({ length: varCount(body?.text) }, (_, i) => (i === 0 ? { source: 'field', value: 'contact.first_name' } : { source: 'static', value: '' })),
    buttons: buttons.map((b, index) => (b.type === 'URL' && /\{\{1\}\}/.test(b.url || '') ? { index, source: 'static', value: '' } : null)).filter(Boolean),
  };
  if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header?.format)) v.headerMedia = '';
  return v;
}

export const CONTACT_FIELDS = [
  { value: 'contact.first_name', label: 'First name' }, { value: 'contact.name', label: 'Full name' },
  { value: 'contact.phone', label: 'Phone' }, { value: 'contact.email', label: 'Email' },
];
export const ORDER_FIELDS = [
  { value: 'order.number', label: 'Order number' }, { value: 'order.total', label: 'Order total' },
  { value: 'order.status', label: 'Order status' }, { value: 'order.items_count', label: 'Item count' }, { value: 'order.tracking_url', label: 'Tracking link' },
];

function ParamInput({ param, onChange, fields }) {
  return (
    <div className="flex gap-2">
      <Select className="!w-[150px] shrink-0" value={param.source} onChange={(e) => onChange({ ...param, source: e.target.value, value: e.target.value === 'field' ? fields[0].value : '' })}
        options={[{ value: 'field', label: 'Contact data' }, { value: 'attribute', label: 'Custom field' }, { value: 'static', label: 'Fixed text' }]} />
      {param.source === 'field'
        ? <Select value={param.value} onChange={(e) => onChange({ ...param, value: e.target.value })} options={fields} />
        : <Input dir="auto" value={param.value} placeholder={param.source === 'attribute' ? 'e.g. city' : 'Text'} onChange={(e) => onChange({ ...param, value: e.target.value })} />}
    </div>
  );
}

/** Fill {{1}}, {{2}}… of a template with contact data, custom fields or fixed text. */
export function TemplateVariables({ template, value, onChange, extraFields = [] }) {
  const tr = useT();
  const fields = [...CONTACT_FIELDS, ...extraFields];
  const { header, buttons } = templateParts(template);
  const setList = (key, i, p) => { const arr = [...(value[key] || [])]; arr[i] = p; onChange({ ...value, [key]: arr }); };
  return (
    <div className="space-y-3">
      <TemplatePreview template={template} />
      {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header?.format) && (
        <Field label={`Header ${header.format.toLowerCase()} link`}><Input placeholder={tr('https://…')} value={value.headerMedia || ''} onChange={(e) => onChange({ ...value, headerMedia: e.target.value })} /></Field>
      )}
      {(value.header || []).map((p, i) => <Field key={`h${i}`} label={`Header {{${i + 1}}}`}><ParamInput param={p} fields={fields} onChange={(x) => setList('header', i, x)} /></Field>)}
      {(value.body || []).map((p, i) => <Field key={`b${i}`} label={`Body {{${i + 1}}}`}><ParamInput param={p} fields={fields} onChange={(x) => setList('body', i, x)} /></Field>)}
      {(value.buttons || []).map((p, i) => <Field key={`u${i}`} label={tr('Link suffix for "{text}"', { text: buttons[p.index]?.text })}><ParamInput param={p} fields={fields} onChange={(x) => setList('buttons', i, x)} /></Field>)}
      {!(value.header?.length || value.body?.length || value.buttons?.length || 'headerMedia' in value) && <p className="text-ink-3 text-[13px]">{tr('This template has no variables.')}</p>}
    </div>
  );
}

/** WhatsApp-style bubble preview of a template. */
export function TemplatePreview({ template, compact }) {
  const { header, body, footer, buttons } = templateParts(template);
  const hi = (txt) => String(txt || '').split(/(\{\{\d+\}\})/).map((p, i) => (/\{\{\d+\}\}/.test(p) ? <span key={i} className="bg-signal/15 text-signal-deep rounded px-0.5">{p}</span> : p));
  return (
    <div className={cx('chat-ground rounded-md', compact ? 'p-3' : 'p-4')}>
      <div className={cx('bg-white rounded-xl rounded-tl-sm shadow-[0_1px_0_rgba(0,0,0,.06)] max-w-[320px]', isRtl(body?.text) && 'ml-auto text-right')} dir="auto">
        <div className="px-3 py-2">
          {header?.format === 'TEXT' && <p className="font-semibold mb-1">{hi(header.text)}</p>}
          {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header?.format) && (
            <div className="h-28 rounded-md bg-paper grid place-items-center text-ink-3 mb-2"><Icon name={header.format === 'DOCUMENT' ? 'file' : 'image'} size={26} /></div>
          )}
          <p className={cx('whitespace-pre-wrap text-[14px]', compact && 'line-clamp-4')}>{hi(body?.text)}</p>
          {footer?.text && <p className="text-[12px] text-ink-3 mt-1">{footer.text}</p>}
        </div>
        {buttons.length > 0 && (
          <div className="border-t border-line divide-y divide-line">
            {buttons.map((b, i) => (
              <p key={i} className="text-center text-[13px] text-[#2f8ae0] font-medium py-1.5 flex items-center justify-center gap-1">
                {b.type === 'URL' && <Icon name="link" size={13} />}{b.type === 'PHONE_NUMBER' && <Icon name="phone" size={13} />}{b.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- create template ----------
const LANGS = [
  { value: 'en', label: 'English' }, { value: 'en_US', label: 'English (US)' }, { value: 'en_GB', label: 'English (UK)' },
  { value: 'ar', label: 'Arabic' }, { value: 'fr', label: 'French' }, { value: 'hi', label: 'Hindi' }, { value: 'ur', label: 'Urdu' },
];

function CreateTemplate({ open, onClose, onCreated }) {
  const tr = useT();
  const [f, setF] = useState({ name: '', category: 'MARKETING', language: 'en', headerFormat: 'NONE', headerText: '', body: '', footer: '', buttonType: 'NONE', buttons: [{ text: '' }], examples: [] });
  const [run, busy] = useAction();
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const vars = varCount(f.body);

  const components = useMemo(() => {
    const c = [];
    if (f.headerFormat === 'TEXT' && f.headerText) c.push({ type: 'HEADER', format: 'TEXT', text: f.headerText });
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(f.headerFormat)) c.push({ type: 'HEADER', format: f.headerFormat });
    c.push({ type: 'BODY', text: f.body, examples: f.examples });
    if (f.footer) c.push({ type: 'FOOTER', text: f.footer });
    const btns = f.buttons.filter((b) => b.text);
    if (f.buttonType === 'QUICK_REPLY' && btns.length) c.push({ type: 'BUTTONS', buttons: btns.map((b) => ({ type: 'QUICK_REPLY', text: b.text })) });
    if (f.buttonType === 'CTA' && btns.length) c.push({ type: 'BUTTONS', buttons: btns.map((b) => (b.phone ? { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phone } : { type: 'URL', text: b.text, url: b.url })) });
    return c;
  }, [f]);

  const submit = () => run(async () => {
    const t = await post('/api/app/templates', { name: f.name, category: f.category, language: f.language, components });
    onCreated(t);
  }, 'Template submitted to WhatsApp for review');

  return (
    <Modal open={open} onClose={onClose} title={tr('New message template')} width={920}
      footer={<><Button onClick={onClose}>{tr('Cancel')}</Button><Button variant="primary" loading={busy} disabled={!f.name || !f.body} onClick={submit}>{tr('Submit for review')}</Button></>}>
      <div className="grid md:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Name" hint="Lowercase and underscores" className="sm:col-span-3"><Input value={f.name} placeholder={tr('eid_offer_2026')} onChange={(e) => set('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} /></Field>
            <Field label="Category"><Select value={f.category} onChange={(e) => set('category', e.target.value)} options={[{ value: 'MARKETING', label: 'Marketing' }, { value: 'UTILITY', label: 'Utility (orders, updates)' }, { value: 'AUTHENTICATION', label: 'Authentication' }]} /></Field>
            <Field label="Language"><Select value={f.language} onChange={(e) => set('language', e.target.value)} options={LANGS} /></Field>
            <Field label="Header"><Select value={f.headerFormat} onChange={(e) => set('headerFormat', e.target.value)} options={[{ value: 'NONE', label: 'None' }, { value: 'TEXT', label: 'Text' }, { value: 'IMAGE', label: 'Image' }, { value: 'VIDEO', label: 'Video' }, { value: 'DOCUMENT', label: 'Document' }]} /></Field>
          </div>
          {f.headerFormat === 'TEXT' && <Field label="Header text"><Input dir="auto" maxLength={60} value={f.headerText} onChange={(e) => set('headerText', e.target.value)} /></Field>}
          <Field label="Body" hint="Use {{1}}, {{2}} for personal details like the customer's name">
            <Textarea rows={5} dir="auto" maxLength={1024} value={f.body} onChange={(e) => set('body', e.target.value)} />
            <button type="button" className="text-[13px] text-signal-deep font-medium mt-1" onClick={() => set('body', `${f.body}{{${vars + 1}}}`)}>{tr('+ Add variable')}</button>
          </Field>
          {vars > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: vars }, (_, i) => (
                <Field key={i} label={tr('Example for {v}', { v: `{{${i + 1}}}` })} hint="Meta reviewers see this">
                  <Input value={f.examples[i] || ''} onChange={(e) => { const ex = [...f.examples]; ex[i] = e.target.value; set('examples', ex); }} />
                </Field>
              ))}
            </div>
          )}
          <Field label="Footer (optional)"><Input dir="auto" maxLength={60} value={f.footer} placeholder={tr('Reply STOP to unsubscribe')} onChange={(e) => set('footer', e.target.value)} /></Field>
          <Field label="Buttons">
            <Select value={f.buttonType} onChange={(e) => set('buttonType', e.target.value)} options={[{ value: 'NONE', label: 'None' }, { value: 'QUICK_REPLY', label: 'Quick replies (up to 3)' }, { value: 'CTA', label: 'Website or call button' }]} />
          </Field>
          {f.buttonType !== 'NONE' && f.buttons.map((b, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder={tr('Button text')} maxLength={25} value={b.text} onChange={(e) => { const x = [...f.buttons]; x[i] = { ...b, text: e.target.value }; set('buttons', x); }} />
              {f.buttonType === 'CTA' && <Input placeholder={tr('https://… or +965…')} value={b.url || b.phone || ''} onChange={(e) => { const v = e.target.value; const x = [...f.buttons]; x[i] = { text: b.text, ...(v.startsWith('+') ? { phone: v } : { url: v }) }; set('buttons', x); }} />}
              <IconButton icon="trash" label="Remove button" onClick={() => set('buttons', f.buttons.filter((_, j) => j !== i))} />
            </div>
          ))}
          {f.buttonType !== 'NONE' && f.buttons.length < (f.buttonType === 'CTA' ? 2 : 3) && <Button size="sm" icon="plus" onClick={() => set('buttons', [...f.buttons, { text: '' }])}>{tr('Add button')}</Button>}
        </div>
        <div>
          <p className="text-[13px] font-medium mb-1.5">{tr('Preview')}</p>
          <TemplatePreview template={{ components }} />
          <p className="text-ink-3 text-[12px] mt-3">{tr('Meta usually reviews templates within minutes, sometimes up to 24 hours. Marketing templates are charged at a higher WhatsApp rate than utility ones.')}</p>
        </div>
      </div>
    </Modal>
  );
}

export default function Templates() {
  const tr = useT();
  const { data, loading, reload } = useApi('/api/app/templates');
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [toDelete, setToDelete] = useState(null);
  const [run, busy] = useAction();
  const rows = (data || []).filter((t) => filter === 'ALL' || t.status === filter);

  return (
    <>
      <PageHeader title={tr('Templates')} subtitle="Pre-approved messages for campaigns, order updates and restarting conversations after 24 hours."
        actions={<>
          <Button icon="refresh" loading={busy} onClick={() => run(async () => { const r = await post('/api/app/templates/sync'); await reload(); return r; }, 'Synced with WhatsApp')}>{tr('Sync from WhatsApp')}</Button>
          <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>{tr('New template')}</Button>
        </>} />
      <div className="flex gap-1 mb-4">
        {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cx('px-3 py-1 rounded-md text-[13px] font-medium', filter === s ? 'bg-ink text-white' : 'text-ink-3 hover:bg-white')}>
            {tr(s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase())}
          </button>
        ))}
      </div>
      {loading ? <Loading /> : !rows.length ? (
        <div className="bg-white border border-line rounded-lg"><Empty icon="file" title={tr('No templates yet')} body="Create one here, or sync templates you already made in WhatsApp Manager." action={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>{tr('New template')}</Button>} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((t) => (
            <article key={t.id} className="bg-white border border-line rounded-lg flex flex-col">
              <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate font-mono text-[13px]">{t.name}</p>
                  <p className="text-ink-3 text-[12px] mt-0.5">{tr(t.category.charAt(0) + t.category.slice(1).toLowerCase())} · {t.language}</p>
                </div>
                <div className="flex items-center gap-1"><StatusBadge status={t.status} /><IconButton icon="trash" label="Delete template" onClick={() => setToDelete(t)} /></div>
              </div>
              <div className="px-4 pb-4 flex-1"><TemplatePreview template={t} compact /></div>
              {t.rejected_reason && <p className="px-4 pb-3 text-danger text-[12px]">{tr('Rejected:')} {t.rejected_reason}</p>}
            </article>
          ))}
        </div>
      )}
      <CreateTemplate open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); reload(); }} />
      <Confirm open={!!toDelete} title={tr('Delete template?')} body={tr('"{name}" will also be deleted from WhatsApp. Campaigns already sent are not affected.', { name: toDelete?.name })}
        busy={busy} onClose={() => setToDelete(null)} onConfirm={() => run(async () => { await del(`/api/app/templates/${toDelete.id}`); setToDelete(null); reload(); }, 'Template deleted')} />
    </>
  );
}
