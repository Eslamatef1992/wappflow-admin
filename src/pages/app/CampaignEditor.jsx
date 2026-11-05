import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, post, put, useApi } from '../../lib/api.js';
import { Button, Field, Input, Loading, PageHeader, Panel, Select, cx, useAction } from '../../components/ui.jsx';
import { Icon } from '../../components/icons.jsx';
import { TemplateVariables, emptyVariables } from './Templates.jsx';
import { num } from '../../lib/format.js';

function Step({ n, title, children, done }) {
  return (
    <Panel className="mb-4" padded={false}>
      <div className="flex gap-4 p-5">
        <span className={cx('w-7 h-7 rounded-full grid place-items-center text-[13px] font-semibold shrink-0', done ? 'bg-signal text-white' : 'bg-paper text-ink-3 border border-line')}>
          {done ? <Icon name="check" size={15} /> : n}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[15px] mb-3">{title}</h2>
          {children}
        </div>
      </div>
    </Panel>
  );
}

export default function CampaignEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const templates = useApi('/api/app/templates?status=APPROVED');
  const tags = useApi('/api/app/tags');
  const numbers = useApi('/api/app/numbers');
  const [c, setC] = useState({ name: '', templateId: '', numberId: '', audience: { all: false, tagIds: [], excludeTagIds: [] }, variables: {}, when: 'now', scheduledAt: '' });
  const [count, setCount] = useState(null);
  const [loaded, setLoaded] = useState(!id);
  const [run, busy] = useAction();

  useEffect(() => {
    if (!id) return;
    get(`/api/app/campaigns/${id}`).then((x) => {
      setC({ name: x.name, templateId: x.template_id || '', numberId: x.wa_number_id || '', audience: { tagIds: [], excludeTagIds: [], ...x.audience }, variables: x.variables || {},
        when: x.scheduled_at ? 'later' : 'now', scheduledAt: x.scheduled_at ? new Date(x.scheduled_at - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '' });
      setLoaded(true);
    });
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => post('/api/app/campaigns/audience-count', { audience: c.audience }).then((r) => setCount(r.count)), 250);
    return () => clearTimeout(t);
  }, [c.audience]);

  const template = templates.data?.find((t) => String(t.id) === String(c.templateId));
  const setTemplate = (tid) => {
    const t = templates.data.find((x) => String(x.id) === String(tid));
    setC({ ...c, templateId: tid, variables: t ? emptyVariables(t) : {} });
  };
  const toggleTag = (key, tagId) => {
    const list = c.audience[key] || [];
    setC({ ...c, audience: { ...c.audience, all: key === 'tagIds' ? false : c.audience.all, [key]: list.includes(tagId) ? list.filter((x) => x !== tagId) : [...list, tagId] } });
  };

  const body = () => ({ name: c.name || 'Untitled campaign', templateId: c.templateId || null, numberId: c.numberId || null, audience: c.audience, variables: c.variables, scheduledAt: c.when === 'later' && c.scheduledAt ? new Date(c.scheduledAt).toISOString() : null });
  const save = async () => (id ? put(`/api/app/campaigns/${id}`, body()) : post('/api/app/campaigns', body()));
  const saveDraft = () => run(async () => { const x = await save(); nav(`/app/campaigns/${x.id}/edit`, { replace: true }); }, 'Draft saved');
  const launch = () => run(async () => {
    const x = await save();
    await post(`/api/app/campaigns/${x.id}/launch`, { scheduledAt: body().scheduledAt });
    nav(`/app/campaigns/${x.id}`);
  }, c.when === 'later' ? 'Campaign scheduled' : 'Campaign is sending');

  if (!loaded || templates.loading) return <Loading />;
  const tagList = tags.data || [];
  const audienceChosen = c.audience.all || c.audience.tagIds?.length;

  return (
    <div className="max-w-[860px]">
      <PageHeader title={id ? 'Edit campaign' : 'New campaign'} back={<Link to="/app/campaigns" className="text-[13px] text-ink-3 hover:text-ink inline-flex items-center gap-1 mb-2"><Icon name="arrowLeft" size={14} />Campaigns</Link>} />

      <Step n={1} title="Message" done={!!c.name && !!template}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Campaign name" hint="Only your team sees this"><Input value={c.name} placeholder="Eid weekend offer" onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
          <Field label="Template">
            <Select value={c.templateId} onChange={(e) => setTemplate(e.target.value)} placeholder="Choose an approved template"
              options={(templates.data || []).map((t) => ({ value: t.id, label: `${t.name} (${t.language})` }))} />
          </Field>
          {(numbers.data?.data?.length || 0) > 1 && (
            <Field label="Send from"><Select value={c.numberId} onChange={(e) => setC({ ...c, numberId: e.target.value })} placeholder="Default number" options={numbers.data.data.map((n) => ({ value: n.id, label: `${n.label} ${n.display_phone}` }))} /></Field>
          )}
        </div>
        {!templates.data?.length && <p className="text-[13px] text-ink-3 mt-2">You need an approved template first. <Link to="/app/templates" className="underline">Create one</Link>.</p>}
      </Step>

      <Step n={2} title="Audience" done={!!audienceChosen && count > 0}>
        <div className="flex flex-wrap gap-2 mb-3">
          <button type="button" onClick={() => setC({ ...c, audience: { ...c.audience, all: true, tagIds: [] } })}
            className={cx('rounded-md border px-3 py-1.5 text-[13px] font-medium', c.audience.all ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>All opted-in contacts</button>
          {tagList.map((t) => (
            <button key={t.id} type="button" onClick={() => toggleTag('tagIds', t.id)}
              className={cx('rounded-md border px-3 py-1.5 text-[13px] font-medium', c.audience.tagIds?.includes(t.id) ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>
              {t.name} <span className="opacity-60">{t.contacts}</span>
            </button>
          ))}
        </div>
        {tagList.length > 0 && (
          <details className="mb-3">
            <summary className="text-[13px] text-ink-3 cursor-pointer">Exclude tags</summary>
            <div className="flex flex-wrap gap-2 mt-2">
              {tagList.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag('excludeTagIds', t.id)}
                  className={cx('rounded-md border px-3 py-1 text-[13px]', c.audience.excludeTagIds?.includes(t.id) ? 'border-danger text-danger bg-danger-wash' : 'border-line bg-white')}>{t.name}</button>
              ))}
            </div>
          </details>
        )}
        <p className="text-[13px]"><b className="tabular-nums">{count == null ? '…' : num(count)}</b> people will receive this. Contacts who replied STOP are always skipped.</p>
      </Step>

      <Step n={3} title="Personalise" done={!!template}>
        {template ? <TemplateVariables template={template} value={c.variables} onChange={(v) => setC({ ...c, variables: v })} /> : <p className="text-ink-3 text-[13px]">Choose a template to fill in names and details.</p>}
      </Step>

      <Step n={4} title="Send" done={false}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex gap-2">
            {[['now', 'Send now'], ['later', 'Schedule']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setC({ ...c, when: v })} className={cx('rounded-md border px-3 py-1.5 text-[13px] font-medium', c.when === v ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>{l}</button>
            ))}
          </div>
          {c.when === 'later' && <Field label="Date and time (your timezone)"><Input type="datetime-local" value={c.scheduledAt} onChange={(e) => setC({ ...c, scheduledAt: e.target.value })} /></Field>}
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="primary" icon={c.when === 'later' ? 'clock' : 'send'} loading={busy} disabled={!template || !audienceChosen || !count || (c.when === 'later' && !c.scheduledAt)} onClick={launch}>
            {c.when === 'later' ? 'Schedule campaign' : `Send to ${count ? num(count) : ''} people`}
          </Button>
          <Button loading={busy} onClick={saveDraft}>Save draft</Button>
        </div>
      </Step>
    </div>
  );
}
