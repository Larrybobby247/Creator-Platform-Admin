import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { api, qs } from '../lib/api';
import { Skeleton, ErrorState, Empty } from './ui.jsx';

// Server-side search / filters / sort / pagination. All state lives in the URL, so a filtered view can be refreshed or shared with another admin.
//  columns: [{ key, label, sort?: 'field', render?: (row) => node }]   filters: [{ key, label, options: [[value, label]] }]
// Text inputs that filter by a name/username (debounced into the URL like everything else).
function TextFilter({ f, value, onSet }) { const [t, setT] = useState(value); useEffect(() => setT(value), [value]); useEffect(() => { const x = setTimeout(() => t !== value && onSet(t.trim()), 400); return () => clearTimeout(x); }, [t]); return <input className="input !w-40" placeholder={f.label} value={t} onChange={(e) => setT(e.target.value)} aria-label={f.label} />; }
export default function DataTable({ endpoint, columns, filters = [], textFilters = [], search, dates, fixed = {}, onRow, summary, empty, toolbar, tableKey }) {
  const [sp, setSp] = useSearchParams(); const page = Number(sp.get('page')) || 1; const sort = sp.get('sort') || '';
  const [text, setText] = useState(sp.get('q') || '');
  const params = { page, sort, q: sp.get('q') || '', from: sp.get('from') || '', to: sp.get('to') || '', ...Object.fromEntries([...filters, ...textFilters].map((f) => [f.key, sp.get(f.key) || ''])), ...fixed };
  const set = (k, v) => setSp((p) => { const n = new URLSearchParams(p); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); return n; }, { replace: true });
  useEffect(() => { const t = setTimeout(() => (text !== (sp.get('q') || '')) && set('q', text.trim()), 350); return () => clearTimeout(t); }, [text]);
  const q = useQuery({ queryKey: ['admin', 'table', tableKey || endpoint, params], queryFn: ({ signal }) => api(`${endpoint}${qs(params)}`, { signal }), placeholderData: keepPreviousData, staleTime: 15_000 });
  const d = q.data; const active = [...sp.keys()].some((k) => k !== 'page' && !(k in fixed));
  const toggleSort = (field) => set('sort', sort === field ? `-${field}` : sort === `-${field}` ? '' : field);
  return <div className="space-y-3">
    {summary && d && summary(d)}
    <div className="flex flex-wrap gap-2 items-center">
      {search && <div className="relative flex-1 min-w-[200px] max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input !pl-9" placeholder={search} value={text} onChange={(e) => setText(e.target.value)} aria-label="Search" /></div>}
      {filters.map((f) => <select key={f.key} className="input !w-auto" value={sp.get(f.key) || ''} onChange={(e) => set(f.key, e.target.value)} aria-label={f.label}><option value="">{f.label}: all</option>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>)}
      {textFilters.map((f) => <TextFilter key={f.key} f={f} value={sp.get(f.key) || ''} onSet={(v) => set(f.key, v)} />)}
      {dates && <><input type="date" className="input !w-auto" value={sp.get('from') || ''} onChange={(e) => set('from', e.target.value)} aria-label="From date" /><input type="date" className="input !w-auto" value={sp.get('to') || ''} onChange={(e) => set('to', e.target.value)} aria-label="To date" /></>}
      {active && <button className="btn-ghost btn-sm" onClick={() => { setText(''); setSp({}, { replace: true }); }}><RotateCcw size={13} />Reset filters</button>}{toolbar}</div>
    {q.isPending ? <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}</div> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : d.items.length === 0 ? (empty || <Empty>{active ? 'No records match these filters.' : 'No records yet.'}</Empty>) : <>
      <div className={`hidden md:block card !p-0 overflow-x-auto transition-opacity ${q.isPlaceholderData ? 'opacity-60' : ''}`}><table className="w-full"><thead className="border-b border-line"><tr>{columns.map((c) => <th key={c.key} className="th" aria-sort={c.sort && (sort === c.sort ? 'ascending' : sort === `-${c.sort}` ? 'descending' : 'none')}>{c.sort ? <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => toggleSort(c.sort)}>{c.label}{sort === c.sort ? <ChevronUp size={12} /> : sort === `-${c.sort}` ? <ChevronDown size={12} /> : null}</button> : c.label}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{d.items.map((r, i) => <tr key={r._id || i} tabIndex={onRow ? 0 : undefined} onClick={() => onRow?.(r)} onKeyDown={(e) => e.key === 'Enter' && onRow?.(r)} className={`${i % 2 ? 'bg-white/[0.015]' : ''} ${onRow ? 'cursor-pointer hover:bg-card2' : ''}`}>{columns.map((c) => <td key={c.key} className="td">{c.render ? c.render(r) : r[c.key] ?? '–'}</td>)}</tr>)}</tbody></table></div>
      <div className={`md:hidden space-y-2 ${q.isPlaceholderData ? 'opacity-60' : ''}`}>{d.items.map((r, i) => <div key={r._id || i} onClick={() => onRow?.(r)} className={`card !p-3 space-y-1.5 ${onRow ? 'cursor-pointer active:bg-card2' : ''}`}>{columns.map((c, ci) => <div key={c.key} className={ci === 0 ? 'font-semibold' : 'flex justify-between gap-3 text-sm'}>{ci === 0 ? (c.render ? c.render(r) : r[c.key]) : <><span className="text-muted text-xs">{c.label}</span><span className="text-right min-w-0 break-words">{c.render ? c.render(r) : r[c.key] ?? '–'}</span></>}</div>)}</div>)}</div>
      <div className="flex items-center justify-between text-sm text-ink2"><span>{d.total.toLocaleString()} record{d.total === 1 ? '' : 's'} · page {d.page} of {d.pages}</span><div className="flex gap-2"><button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => set('page', String(page - 1))}>← Previous</button><button className="btn-ghost btn-sm" disabled={page >= d.pages} onClick={() => set('page', String(page + 1))}>Next →</button></div></div></>}
  </div>;
}
