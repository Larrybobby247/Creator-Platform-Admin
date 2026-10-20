import { useEffect } from 'react';
import { X } from 'lucide-react';
import { label } from '../lib/fmt';

const TONE = { ok: 'bg-ok/15 text-ok', warn: 'bg-warn/15 text-warn', bad: 'bg-bad/15 text-bad', info: 'bg-info/15 text-info', violet: 'bg-violet/20 text-violet-light', pink: 'bg-pink/20 text-pink', mute: 'bg-card2 text-ink2' };
const STATUS = { COMPLETED: 'ok', VERIFIED: 'ok', ACTIVE: 'ok', PAID: 'ok', RESOLVED: 'ok', VISIBLE: 'ok', OK: 'ok', APPROVED: 'ok', SENT: 'ok', EARNINGS_RELEASED: 'ok', configured: 'ok', ok: 'ok',
  PENDING: 'warn', PROCESSING: 'warn', NEW: 'warn', UNDER_REVIEW: 'warn', REQUIRES_REVIEW: 'warn', REPORTED: 'warn', RESTRICTED: 'warn', PAUSED: 'warn', ACTION_REQUIRED: 'warn', REQUESTED: 'warn', PAID_AND_RESERVED: 'info', HIGH: 'bad', DISPUTED: 'bad',
  FAILED: 'bad', REJECTED: 'bad', SUSPENDED: 'bad', REMOVED: 'bad', REVERSED: 'info', DISMISSED: 'mute', EXPIRED: 'mute', CANCELLED: 'mute', REFUNDED: 'info', NORMAL: 'mute', LOW: 'mute', DRAFT: 'mute', PRO: 'pink', CREATOR: 'violet', USER: 'mute', DEFAULT: 'mute' };
// Status is always text + colour (never colour alone).
export const Badge = ({ value, tone }) => <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TONE[tone || STATUS[value] || 'mute']}`}>{label(value)}</span>;
export const Skeleton = ({ className = 'h-24' }) => <div className={`rounded-card bg-card animate-pulse ${className}`} aria-hidden />;
export const ErrorState = ({ error, onRetry }) => <div role="alert" className="card flex items-center justify-between gap-3 text-sm"><span className="text-ink2">{error?.message === 'Failed to fetch' ? 'Network problem. Check your connection.' : error?.message || 'Something went wrong.'}</span>{onRetry && <button className="btn-ghost btn-sm" onClick={onRetry}>Retry</button>}</div>;
export const Empty = ({ children = 'Nothing to show.' }) => <div className="card text-center text-sm text-ink2 py-10">{children}</div>;
export function Section({ q, height = 'h-28', isEmpty, empty, children }) {
  if (q.isPending) return <Skeleton className={height} />; if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (isEmpty?.(q.data)) return empty || <Empty />; return typeof children === 'function' ? children(q.data) : children;
}
export const PageHeader = ({ title, desc, actions }) => <div className="flex flex-wrap items-start justify-between gap-3 mb-5"><div><h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>{desc && <p className="text-ink2 text-sm mt-1 max-w-2xl">{desc}</p>}</div>{actions && <div className="flex gap-2 flex-wrap">{actions}</div>}</div>;
export const Metric = ({ label: l, value, sub, change, tone, note }) => <div className="card !p-4 animate-rise" title={note}><p className="text-xs text-ink2">{l}</p><p className={`text-2xl font-bold mt-1 ${tone || ''}`}>{value}</p>
  <p className="text-xs text-muted mt-1 flex items-center gap-2">{sub}{change !== undefined && change !== null && <span className={change >= 0 ? 'text-ok' : 'text-bad'}>{change >= 0 ? '▲' : '▼'} {Math.abs(change)}%</span>}</p></div>;
export function Drawer({ open, onClose, title, children, wide }) {
  useEffect(() => { if (!open) return; const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-40 flex justify-end bg-black/60 animate-fade" onClick={onClose}><aside role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className={`h-full w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-xl'} bg-bg border-l border-line overflow-y-auto animate-slide-in`}>
    <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-line px-5 py-4 flex items-center justify-between"><h2 className="font-semibold text-lg truncate">{title}</h2><button onClick={onClose} aria-label="Close" className="p-1 text-ink2 hover:text-ink"><X size={20} /></button></div><div className="p-5 space-y-5">{children}</div></aside></div>;
}
export function Modal({ open, onClose, title, children }) {
  useEffect(() => { if (!open) return; const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid items-end sm:place-items-center bg-black/70 p-0 sm:p-4 animate-fade" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="bg-card border border-line rounded-t-modal sm:rounded-modal w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5 animate-rise">
    <div className="flex justify-between items-center mb-4"><h2 className="font-semibold text-lg">{title}</h2><button onClick={onClose} aria-label="Close" className="text-ink2"><X size={18} /></button></div>{children}</div></div>;
}
export const KV = ({ items }) => <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">{items.filter(Boolean).map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs text-muted">{k}</dt><dd className="break-words">{v ?? '–'}</dd></div>)}</dl>;
export const Tabs = ({ tabs, value, onChange }) => <div className="flex gap-1 border-b border-line overflow-x-auto" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)} className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${value === k ? 'border-violet text-ink' : 'border-transparent text-ink2 hover:text-ink'}`}>{l}</button>)}</div>;
export const Avatar = ({ u, size = 32 }) => u?.avatarUrl ? <img src={u.avatarUrl} alt="" width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} /> : <span className="inline-grid place-items-center rounded-full bg-gradient-to-br from-violet to-pink text-white font-semibold shrink-0" style={{ width: size, height: size, fontSize: size / 2.4 }}>{(u?.displayName || u?.username || '?')[0].toUpperCase()}</span>;
