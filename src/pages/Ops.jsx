import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { naira, pts, num, dt, ago, label } from '../lib/fmt';
import DataTable from '../components/DataTable.jsx';
import { PageHeader, Badge, Drawer, KV, Section, Modal } from '../components/ui.jsx';
import { useAdmin } from '../context/Auth.jsx';
import { useReason } from '../components/Reason.jsx';
import { useDo } from '../components/actions.js';
import { toast } from '../lib/toast';

const useOpen = () => { const [sp, setSp] = useSearchParams(); return [sp.get('open'), (v) => setSp((p) => { const n = new URLSearchParams(p); v ? n.set('open', v) : n.delete('open'); return n; })]; };
const STATES = ['REQUESTED', 'PAID_AND_RESERVED', 'CREATOR_ACCEPTED', 'MEETUP_PENDING_USER_ACCEPTANCE', 'USER_ACCEPTED', 'COMPLETED', 'EARNINGS_RELEASED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DISPUTED', 'REFUNDED'];

function MeetupDrawer({ id, onClose }) {
  const { can } = useAdmin(); const ask = useReason(); const run = useDo(); const q = useQuery({ queryKey: ['admin', 'meetup', id], queryFn: () => api(`/meetups/${id}`), enabled: !!id }); const b = q.data?.booking;
  const resolve = async (outcome) => { const r = await ask({ title: outcome === 'refund' ? 'Refund the user?' : 'Release funds to the creator?', description: outcome === 'refund' ? 'The meetup fee and the transport fee are returned to the user.' : 'The meetup fee is released to the creator as earnings (minus platform commission).', confirmLabel: outcome === 'refund' ? 'Refund user' : 'Release to creator', danger: outcome === 'refund' }); if (r) await run(`/meetups/${id}/resolve`, { outcome, reason: r.reason }, 'Dispute resolved'); };
  return <Drawer open={!!id} onClose={onClose} title="Meetup booking" wide><Section q={q} height="h-64">{() => <>
    <div className="flex justify-between items-center"><span className="text-sm">@{b.userId?.username} → @{b.creatorId?.username}</span><Badge value={b.status} /></div>
    <KV items={[['Requested time', dt(b.slotAt)], ['Area', b.area], ['Duration', `${b.durationMin} min`], ['Meetup fee', pts(b.feePoints)], ['Transport fee (separate)', pts(b.transportPoints)], ['Creator verified', q.data.creatorVerified ? 'Yes' : 'No'], ['Creator accepted', dt(b.creatorAcceptedAt)], ['User accepted', dt(b.userAcceptedAt)], ['Completed', dt(b.completedAt)], ['Release after', dt(b.releaseAfter)], ['Fee transaction', b.feeTxId ? String(b.feeTxId).slice(-10) : '–'], ['Transport transaction', b.transportTxId ? String(b.transportTxId).slice(-10) : '–']]} />
    <p className="text-xs text-muted bg-card2 rounded-btn p-3">{q.data.fundsNote}</p>
    {can('meetups.manage') && b.status === 'DISPUTED' && <div className="flex gap-2"><button className="btn-danger btn-sm" onClick={() => resolve('refund')}>Refund user</button><button className="btn-primary btn-sm" onClick={() => resolve('release')}>Release to creator</button></div>}
    <section><h3 className="font-semibold text-sm mb-2">Status history</h3><ol className="space-y-1.5 border-l border-line pl-4">{(b.history || []).map((h, i) => <li key={i} className="text-sm relative"><i className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-violet" />{label(h.status)}<span className="text-xs text-muted"> · {dt(h.at)}{h.by?.username ? ` · @${h.by.username}` : ' · system'}</span></li>)}</ol></section></>}</Section></Drawer>;
}
export function Meetups({ disputes }) {
  const [id, open] = useOpen();
  return <div><PageHeader title={disputes ? 'Disputes' : 'Meetups'} desc={disputes ? 'Bookings a user reported a problem with. Resolve each by refunding the user or releasing to the creator; every decision needs a reason.' : 'All meetup bookings. Fees are held on the platform ledger until completion plus a dispute window (this is not a bank escrow).'} />
    <DataTable endpoint="/meetups" tableKey={disputes ? 'disputes' : 'meetups'} fixed={disputes ? { status: 'DISPUTED' } : {}} dates onRow={(r) => open(r._id)} textFilters={[{ key: 'creator', label: 'Creator' }, { key: 'user', label: 'User' }]} filters={disputes ? [] : [{ key: 'status', label: 'Status', options: STATES.map((s) => [s, label(s)]) }]}
      columns={[{ key: 'id', label: 'Booking', render: (r) => <code className="text-xs">{r._id.slice(-8)}</code> }, { key: 'u', label: 'User', render: (r) => `@${r.userId?.username}` }, { key: 'c', label: 'Creator', render: (r) => `@${r.creatorId?.username}` }, { key: 'slotAt', label: 'Requested for', sort: 'slotAt', render: (r) => dt(r.slotAt) }, { key: 'fee', label: 'Meetup fee', render: (r) => pts(r.feePoints) }, { key: 't', label: 'Transport fee', render: (r) => pts(r.transportPoints) }, { key: 'pay', label: 'Payment', render: (r) => <Badge value={r.feeTxId ? 'PAID' : 'PENDING'} /> }, { key: 'status', label: 'Status', sort: 'status', render: (r) => <Badge value={r.status} /> }]} />
    <MeetupDrawer id={id} onClose={() => open(null)} /></div>;
}

export function Announcements() {
  const run = useDo(); const [f, setF] = useState({ title: '', message: '', audience: 'all' }); const [confirm, setConfirm] = useState(null); const [busy, setBusy] = useState(false);
  const preview = async () => { setBusy(true); try { const d = await api('/announcements/preview', { method: 'POST', body: { audience: f.audience } }); setConfirm(d.recipients); } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); } };
  const send = async () => { setBusy(true); const r = await run('/announcements', { ...f, confirmRecipients: confirm }, 'Announcement sent'); setBusy(false); if (r) { setConfirm(null); setF({ title: '', message: '', audience: 'all' }); } };
  const AUD = { all: 'All users', creators: 'Creators', pro: 'Pro creators' };
  return <div><PageHeader title="Notifications" desc="Send an in-app announcement. Emails and push are not used for announcements, and private data is never shown here." />
    <div className="grid lg:grid-cols-3 gap-4"><div className="card space-y-3 lg:col-span-1 h-fit"><h2 className="font-semibold">New announcement</h2>
      <label className="block text-sm">Audience<select className="input mt-1" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>{Object.entries(AUD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label className="block text-sm">Title<input className="input mt-1" maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="block text-sm">Message<textarea className="input mt-1 min-h-[100px]" maxLength={400} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /><span className="text-xs text-muted">{f.message.length}/400</span></label>
      <button className="btn-primary w-full" disabled={busy || f.title.trim().length < 3 || f.message.trim().length < 5} onClick={preview}>{busy ? 'Checking…' : 'Review and send'}</button></div>
      <div className="lg:col-span-2"><DataTable endpoint="/announcements" columns={[{ key: 'title', label: 'Title', render: (r) => <span><b>{r.title}</b><span className="block text-xs text-muted line-clamp-1">{r.message}</span></span> }, { key: 'audience', label: 'Audience', render: (r) => AUD[r.audience] || r.audience }, { key: 'recipientCount', label: 'Delivered to', render: (r) => num(r.recipientCount) }, { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> }, { key: 'by', label: 'Sent by', render: (r) => `@${r.sentBy?.username}` }, { key: 'createdAt', label: 'Sent', sort: 'createdAt', render: (r) => ago(r.createdAt) }]} /></div></div>
    <Modal open={confirm !== null} onClose={() => !busy && setConfirm(null)} title="Confirm announcement"><div className="space-y-3"><p className="text-sm">This will notify <b className="text-lg">{num(confirm)}</b> {AUD[f.audience].toLowerCase()} immediately. It cannot be recalled.</p><div className="bg-card2 rounded-btn p-3 text-sm"><b>{f.title}</b><p className="text-ink2 mt-1">{f.message}</p></div><div className="flex gap-2"><button className="btn-ghost flex-1" onClick={() => setConfirm(null)} disabled={busy}>Cancel</button><button className="btn-primary flex-1" disabled={busy || !confirm} onClick={send}>{busy ? 'Sending…' : `Send to ${num(confirm)}`}</button></div></div></Modal></div>;
}
