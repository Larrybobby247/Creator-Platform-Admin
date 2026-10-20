import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { pts, num, dt, day, ago, label } from '../lib/fmt';
import DataTable from '../components/DataTable.jsx';
import { PageHeader, Badge, Drawer, KV, Section, Avatar, Empty, Modal } from '../components/ui.jsx';
import { useAdmin } from '../context/Auth.jsx';
import { useReason } from '../components/Reason.jsx';
import { useDo } from '../components/actions.js';
import { toast } from '../lib/toast';

const useOpen = () => { const [sp, setSp] = useSearchParams(); return [sp.get('open'), (v) => setSp((p) => { const n = new URLSearchParams(p); v ? n.set('open', v) : n.delete('open'); return n; })]; };
const Person = ({ u }) => <span className="flex items-center gap-2"><Avatar u={u} size={26} /><span className="text-sm">@{u?.username || '–'}</span></span>;

function ContentDrawer({ id, onClose }) {
  const { can } = useAdmin(); const ask = useReason(); const run = useDo(); const [media, setMedia] = useState(null);
  const q = useQuery({ queryKey: ['admin', 'content', id], queryFn: () => api(`/content/${id}`), enabled: !!id }); const p = q.data?.post;
  const moderate = async (action, title, description, danger) => { const r = await ask({ title, description, confirmLabel: title, danger }); if (r) await run(`/content/${id}/moderate`, { action, reason: r.reason }, 'Moderation recorded'); };
  const view = async () => { try { setMedia((await api(`/content/${id}/media`)).url); } catch (e) { toast(e.message, 'bad'); } };
  return <Drawer open={!!id} onClose={onClose} title="Content" wide><Section q={q} height="h-64">{() => <>
    <div className="flex items-center justify-between"><Person u={p.authorId} /><div className="flex gap-1"><Badge value={p.access} tone="mute" /><Badge value={p.status} /><Badge value={p.moderation?.status || 'OK'} /></div></div>
    <p className="bg-card2 rounded-btn p-3 text-sm whitespace-pre-wrap">{p.content || '(no caption)'}</p>
    {p.hasMedia && (media ? (p.mediaTypeHint === 'VIDEO' ? <video src={media} controls className="w-full rounded-card max-h-80 bg-black" /> : <img src={media} alt="" className="w-full rounded-card max-h-80 object-contain bg-black" />) : <button className="btn-ghost btn-sm" onClick={view}>Load media (short-lived secure link)</button>)}
    <KV items={[['Published', dt(p.createdAt)], ['Visibility', label(p.access)], ['Unlock price', p.access === 'EXCLUSIVE' ? pts(p.unlockPricePoints) : '–'], ['Moderation reason', p.moderation?.reason], ['Tags', (p.tags || []).map((t) => `#${t}`).join(' ')]]} />
    {can('content.moderate') && <div className="flex gap-2 flex-wrap">{p.moderation?.status !== 'UNDER_REVIEW' && <button className="btn-ghost btn-sm" onClick={() => moderate('review', 'Mark for review', 'Flags the post for another moderator. It stays visible.')}>Mark for review</button>}{p.moderation?.status !== 'RESTRICTED' && <button className="btn-ghost btn-sm" onClick={() => moderate('restrict', 'Restrict access', 'Hides the post from everyone. Reversible.', true)}>Restrict</button>}{p.moderation?.status !== 'REMOVED' && <button className="btn-danger btn-sm" onClick={() => moderate('remove', 'Remove from public view', 'The post disappears from the platform. Nothing is erased and purchase records stay.', true)}>Remove</button>}{['RESTRICTED', 'REMOVED', 'UNDER_REVIEW'].includes(p.moderation?.status) && <button className="btn-primary btn-sm" onClick={() => moderate('restore', 'Restore', 'Makes the post visible again.')}>Restore</button>}</div>}
    <section><h3 className="font-semibold text-sm mb-1">Reports ({q.data.reports.length})</h3>{q.data.reports.length === 0 ? <p className="text-sm text-muted">None.</p> : q.data.reports.map((r) => <p key={r._id} className="text-sm flex justify-between py-0.5"><span>{label(r.category)}: <span className="text-ink2">{r.reason}</span></span><Badge value={r.status} /></p>)}</section>
    <section><h3 className="font-semibold text-sm mb-1">Moderation history</h3>{q.data.history.length === 0 ? <p className="text-sm text-muted">No moderation actions yet.</p> : <ul className="text-sm space-y-1">{q.data.history.map((h) => <li key={h._id} className="flex justify-between"><span>{label(h.action.replace('CONTENT_', ''))} — {h.reason} <span className="text-xs text-muted">· {h.actorId?.username}</span></span><span className="text-xs text-muted">{ago(h.createdAt)}</span></li>)}</ul>}</section></>}</Section></Drawer>;
}
export function Content() {
  const [id, open] = useOpen();
  return <div><PageHeader title="Content" desc="Search and moderate posts. Actions are reversible and need a reason." />
    <DataTable endpoint="/content" search="Search caption text" dates onRow={(r) => open(r._id)} filters={[{ key: 'type', label: 'Type', options: [['text', 'Text'], ['image', 'Image'], ['video', 'Video']] }, { key: 'access', label: 'Visibility', options: [['PUBLIC', 'Public'], ['EXCLUSIVE', 'Exclusive'], ['SUBSCRIBERS', 'Subscribers']] }, { key: 'moderation', label: 'Moderation', options: [['OK', 'OK'], ['UNDER_REVIEW', 'Under review'], ['RESTRICTED', 'Restricted'], ['REMOVED', 'Removed']] }, { key: 'reported', label: 'Reports', options: [['true', 'Has open reports']] }]}
      textFilters={[{ key: 'creator', label: 'Creator username' }]}
      columns={[{ key: 'c', label: 'Content', render: (r) => <span className="line-clamp-2 max-w-xs">{r.content || `(${(r.mediaTypeHint || 'media').toLowerCase()} post)`}</span> }, { key: 'a', label: 'Creator', render: (r) => <Person u={r.authorId} /> }, { key: 't', label: 'Type', render: (r) => label(r.mediaTypeHint || 'TEXT') }, { key: 'access', label: 'Visibility', render: (r) => <Badge value={r.access} tone="mute" /> }, { key: 'createdAt', label: 'Published', sort: 'createdAt', render: (r) => day(r.createdAt) }, { key: 'rc', label: 'Reports', render: (r) => (r.reportCount ? <b className="text-bad">{r.reportCount}</b> : 0) }, { key: 'm', label: 'Moderation', render: (r) => <Badge value={r.moderation?.status || 'OK'} /> }]} />
    <ContentDrawer id={id} onClose={() => open(null)} /></div>;
}

function CommunityDrawer({ id, onClose }) {
  const { can } = useAdmin(); const ask = useReason(); const run = useDo(); const q = useQuery({ queryKey: ['admin', 'community', id], queryFn: () => api(`/communities/${id}`), enabled: !!id }); const c = q.data?.community;
  const go = async (action) => { const r = await ask({ title: action === 'restrict' ? 'Restrict this community?' : 'Restore this community?', description: action === 'restrict' ? 'It disappears from discovery and members cannot open it. Reversible.' : 'It becomes visible again.', confirmLabel: label(action), danger: action === 'restrict' }); if (r) await run(`/communities/${id}/moderate`, { action, reason: r.reason }, 'Community updated'); };
  return <Drawer open={!!id} onClose={onClose} title={c?.name || 'Community'} wide><Section q={q} height="h-56">{() => <>
    <div className="flex gap-1"><Badge value={c.visibility} tone="mute" /><Badge value={c.status || 'ACTIVE'} />{c.accessFeePoints > 0 && <Badge value={`PAID ${c.accessFeePoints} pts`} tone="pink" />}</div><p className="text-sm text-ink2">{c.description}</p>
    <KV items={[['Owner', `@${c.ownerId?.username}`], ['Members', num(c.memberCount)], ['Created', day(c.createdAt)], ['Restriction reason', c.statusReason]]} />
    {can('communities.moderate') && <button className={c.status === 'RESTRICTED' ? 'btn-primary btn-sm' : 'btn-danger btn-sm'} onClick={() => go(c.status === 'RESTRICTED' ? 'restore' : 'restrict')}>{c.status === 'RESTRICTED' ? 'Restore' : 'Restrict'}</button>}
    <section><h3 className="font-semibold text-sm mb-1">Recent posts</h3>{q.data.posts.length === 0 ? <p className="text-sm text-muted">No posts.</p> : q.data.posts.map((p) => <p key={p._id} className="text-sm py-1 border-b border-line flex justify-between gap-2"><span className="line-clamp-1">@{p.authorId?.username}: {p.content}</span><Badge value={p.moderation?.status || 'OK'} /></p>)}</section>
    <section><h3 className="font-semibold text-sm mb-1">Reports</h3>{q.data.reports.length === 0 ? <p className="text-sm text-muted">None.</p> : q.data.reports.map((r) => <p key={r._id} className="text-sm flex justify-between"><span>{label(r.category)} · {ago(r.createdAt)}</span><Badge value={r.status} /></p>)}</section></>}</Section></Drawer>;
}
export function Communities() {
  const [id, open] = useOpen();
  return <div><PageHeader title="Communities" desc="Review communities, reports and abuse. Restrictions are reversible; nothing is deleted." />
    <DataTable endpoint="/communities" search="Search community name" onRow={(r) => open(r._id)} filters={[{ key: 'visibility', label: 'Visibility', options: [['PUBLIC', 'Public'], ['PRIVATE', 'Private']] }, { key: 'paid', label: 'Pricing', options: [['true', 'Paid'], ['false', 'Free']] }, { key: 'status', label: 'Status', options: [['ACTIVE', 'Active'], ['RESTRICTED', 'Restricted']] }, { key: 'reported', label: 'Reports', options: [['true', 'Has open reports']] }]}
      columns={[{ key: 'name', label: 'Community', sort: 'name' }, { key: 'o', label: 'Owner', render: (r) => `@${r.ownerId?.username}` }, { key: 'memberCount', label: 'Members', sort: 'memberCount', render: (r) => num(r.memberCount) }, { key: 'createdAt', label: 'Created', sort: 'createdAt', render: (r) => day(r.createdAt) }, { key: 'v', label: 'Visibility', render: (r) => <Badge value={r.visibility} tone="mute" /> }, { key: 'p', label: 'Pricing', render: (r) => (r.accessFeePoints > 0 ? pts(r.accessFeePoints) : 'Free') }, { key: 'rc', label: 'Reports', render: (r) => (r.reportCount ? <b className="text-bad">{r.reportCount}</b> : 0) }, { key: 's', label: 'Status', render: (r) => <Badge value={r.status || 'ACTIVE'} /> }]} />
    <CommunityDrawer id={id} onClose={() => open(null)} /></div>;
}

export function Ratings() {
  const { can } = useAdmin(); const ask = useReason(); const run = useDo();
  const go = async (r, action) => { const x = await ask({ title: label(action.replace('_', ' ')), description: 'The original review text and history are kept. Star values are never edited.', confirmLabel: 'Confirm', danger: action === 'remove' }); if (x) await run(`/ratings/${r._id}/moderate`, { action, reason: x.reason }, 'Review updated'); };
  return <div><PageHeader title="Ratings and Reviews" desc="Investigate abusive, duplicate or fraudulent reviews. You can hide a review but never change a star rating." />
    <DataTable endpoint="/ratings" search="Creator username" filters={[{ key: 'status', label: 'Status', options: [['VISIBLE', 'Visible'], ['REPORTED', 'Reported'], ['REMOVED', 'Removed']] }]}
      columns={[{ key: 'id', label: 'Review', render: (r) => <code className="text-xs">{r._id.slice(-8)}</code> }, { key: 'c', label: 'Creator', render: (r) => `@${r.creatorId?.username}` }, { key: 'r', label: 'Reviewer', render: (r) => `@${r.reviewerId?.username}` }, { key: 'stars', label: 'Rating', sort: 'stars', render: (r) => <span className="text-warn">{'★'.repeat(r.stars)}<span className="text-line">{'★'.repeat(5 - r.stars)}</span></span> }, { key: 'text', label: 'Review', render: (r) => <span className="line-clamp-2 max-w-xs">{r.text || '–'}</span> }, { key: 'k', label: 'Qualifying', render: (r) => <span className="text-xs">{label(r.qualifyingKind)} <code>{String(r.qualifyingId).slice(-6)}</code>{r.reviewerReviewsOfCreator > 1 && <b className="text-warn"> · {r.reviewerReviewsOfCreator} from same user</b>}</span> }, { key: 'createdAt', label: 'Date', sort: 'createdAt', render: (r) => day(r.createdAt) }, { key: 's', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'a', label: '', render: (r) => can('ratings.moderate') && <span className="flex gap-1">{r.status !== 'REMOVED' && <button className="btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); go(r, 'remove'); }}>Remove</button>}{r.status === 'REPORTED' && <button className="btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); go(r, 'dismiss_report'); }}>Dismiss report</button>}{r.status === 'REMOVED' && <button className="btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); go(r, 'restore'); }}>Restore</button>}</span> }]} /></div>;
}

function GiftModal({ gift, onClose }) {
  const run = useDo(); const [f, setF] = useState({ name: gift?.name || '', pricePoints: gift?.pricePoints || 1, order: gift?.order ?? 0, active: gift?.active ?? true, imageUrl: gift?.imageUrl || '', description: gift?.description || '' }); const [busy, setBusy] = useState(false);
  const up = async (file) => { if (!file) return; const fd = new FormData(); fd.append('file', file); try { setF({ ...f, imageUrl: (await api('/gifts/image', { method: 'POST', form: fd })).url }); } catch (e) { toast(e.message, 'bad'); } };
  const save = async () => { setBusy(true); const body = { ...f, pricePoints: Number(f.pricePoints), order: Number(f.order) }; const r = gift?._id ? await run(`/gifts/${gift._id}`, body, 'Gift saved', 'PATCH') : await run('/gifts', body, 'Gift created'); setBusy(false); if (r) onClose(); };
  return <Modal open onClose={onClose} title={gift?._id ? 'Edit gift' : 'New gift'}><div className="space-y-3">
    <label className="block text-sm">Name<input className="input mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
    <div className="grid grid-cols-2 gap-2"><label className="block text-sm">Price (points)<input type="number" min={1} className="input mt-1" value={f.pricePoints} onChange={(e) => setF({ ...f, pricePoints: e.target.value })} /></label><label className="block text-sm">Display order<input type="number" min={0} className="input mt-1" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></label></div>
    <label className="block text-sm">Description<input className="input mt-1" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
    <div className="flex items-center gap-3">{f.imageUrl && <img src={f.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}<label className="btn-ghost btn-sm cursor-pointer">Upload artwork<input type="file" accept="image/*" hidden onChange={(e) => up(e.target.files[0])} /></label></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Active (disabling stops new purchases; history is kept)</label>
    <p className="text-xs text-muted">Creators receive the gift value minus the platform commission (set in Pricing and Fees). The commission is separate from the point price.</p>
    <button className="btn-primary w-full" disabled={busy || f.name.trim().length < 2 || Number(f.pricePoints) < 1} onClick={save}>{busy ? 'Saving…' : 'Save gift'}</button></div></Modal>;
}
export function Gifts() {
  const [edit, setEdit] = useState(null);
  return <div><PageHeader title="Gifts" desc="The virtual gift catalogue. Price changes apply to new gifts only." actions={<button className="btn-primary" onClick={() => setEdit({})}>New gift</button>} />
    <DataTable endpoint="/gifts" onRow={(r) => setEdit(r)} columns={[{ key: 'i', label: 'Gift', render: (r) => <span className="flex items-center gap-2">{r.imageUrl ? <img src={r.imageUrl} alt="" className="w-8 h-8 rounded object-cover" /> : <span className="text-xl">🎁</span>}<b>{r.name}</b></span> }, { key: 'pricePoints', label: 'Price', render: (r) => pts(r.pricePoints) }, { key: 'active', label: 'Status', render: (r) => <Badge value={r.active ? 'ACTIVE' : 'DISABLED'} tone={r.active ? 'ok' : 'mute'} /> }, { key: 'order', label: 'Order' }, { key: 'sent', label: 'Times sent', render: (r) => num(r.sent) }]} />
    {edit && <GiftModal key={edit._id || 'new'} gift={edit} onClose={() => setEdit(null)} />}</div>;
}
