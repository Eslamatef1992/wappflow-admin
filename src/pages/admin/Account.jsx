import { useState } from 'react';
import { post } from '../../lib/api.js';
import { useSession } from '../../lib/session.jsx';
import { useT } from '../../lib/i18n.jsx';
import { Button, Field, Input, PageHeader, Panel, useAction } from '../../components/ui.jsx';

export default function Account() {
  const tr = useT();
  const { me } = useSession();
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
  const [run, busy] = useAction();
  const mismatch = pw.confirm && pw.password !== pw.confirm;
  const save = () => run(async () => {
    if (pw.password !== pw.confirm) throw new Error(tr('The new passwords do not match'));
    await post('/api/auth/change-password', { current: pw.current, password: pw.password });
    setPw({ current: '', password: '', confirm: '' });
  }, 'Password changed');
  return (
    <>
      <PageHeader title="Account" subtitle={me.user.email} />
      <Panel title="Your password" className="max-w-[480px]">
        <div className="space-y-4">
          <Field label="Current password"><Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="New password" hint="At least 8 characters"><Input type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
          <Field label="Repeat new password" error={mismatch ? 'The new passwords do not match' : undefined}><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          <Button variant="primary" loading={busy} disabled={!pw.current || pw.password.length < 8 || pw.password !== pw.confirm} onClick={save}>Change password</Button>
        </div>
      </Panel>
    </>
  );
}
