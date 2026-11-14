// Admin: set a new password for a workspace user, then show it once so it can be copied and shared.
import { useEffect, useState } from 'react';
import { post } from '../../lib/api.js';
import { Button, Field, Input, Modal, useAction } from '../../components/ui.jsx';
import { useT } from '../../lib/i18n.jsx';

export default function ResetPassword({ user, onClose }) {
  const tr = useT();
  const [pw, setPw] = useState('');
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);
  const [run, busy] = useAction();
  useEffect(() => { setPw(''); setDone(null); setCopied(false); }, [user?.id]);
  const save = (password) => run(async () => setDone(await post(`/api/admin/users/${user.id}/password`, { password })));
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/login\n${done.email}\n${done.password}`); setCopied(true); } catch { setCopied(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} title={tr('Reset password')}
      footer={done
        ? <><Button onClick={copy} icon="copy">{copied ? tr('Copied') : tr('Copy login')}</Button><Button variant="primary" onClick={onClose}>{tr('Done')}</Button></>
        : <><Button onClick={onClose}>{tr('Cancel')}</Button><Button loading={busy} onClick={() => save('')}>{tr('Generate a password')}</Button><Button variant="primary" loading={busy} disabled={pw.trim().length < 8} onClick={() => save(pw)}>{tr('Set password')}</Button></>}>
      {user && !done && <>
        <p className="text-[13px] text-ink-2 mb-3">{tr('Set a new password for {name} ({email}). Their old password stops working right away.', { name: user.name || '', email: user.email })}</p>
        <Field label="New password" hint={tr('At least 8 characters. Or leave it empty and generate one.')}>
          <Input dir="ltr" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
      </>}
      {done && <>
        <p className="text-[13px] text-ink-2 mb-3">{tr('Password changed. Share these login details with the customer; the password is not shown again.')}</p>
        <div dir="ltr" className="rounded-lg bg-paper border border-line p-3 text-[14px] space-y-1">
          <p><span className="text-ink-3">Login:</span> {window.location.origin}/login</p>
          <p><span className="text-ink-3">Email:</span> {done.email}</p>
          <p><span className="text-ink-3">Password:</span> <span className="font-mono font-semibold">{done.password}</span></p>
        </div>
      </>}
    </Modal>
  );
}
