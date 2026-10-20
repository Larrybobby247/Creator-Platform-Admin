import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Sparkles, Wallet, TrendingUp, Banknote, Clock, ShieldCheck, Flag } from 'lucide-react';
import { api, qs } from '../lib/api';
import { naira, pts, num, ago, label } from '../lib/fmt';
import { PageHeader, Metric, Section, Skeleton, Empty, Tabs, Badge } from '../components/ui.jsx';
import { LineChart, Donut } from '../components/Charts.jsx';
import { useAdmin } from '../context/Auth.jsx';

const RANGES = [['today', 'Today'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days'], ['custom', 'Custom range']];
const METRICS = [['volume', 'Payment volume'], ['revenue', 'Platform revenue'], ['earnings', 'Creator earnings'], ['refunds', 'Refunds']];

export default function Dashboard() {
  const { admin } = useAdmin(); const [sp, setSp] = useSearchParams(); const range = sp.get('range') || '30d'; const from = sp.get('from') || '', to = sp.get('to') || ''; const [metric, setMetric] = useState('volume');
  const set = (o) => setSp((p) => { const n = new URLSearchParams(p); Object.entries(o).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); return n; }, { replace: true });
  const P = { range, ...(range === 'custom' ? { from, to } : {}) }; const ready = range !== 'custom' || (from && to);
  const m = useQuery({ queryKey: ['admin', 'dash', P], queryFn: () => api(`/dashboard${qs(P)}`), enabled: !!ready });
  const series = useQuery({ queryKey: ['admin', 'series', P, metric], queryFn: () => api(`/dashboard/series${qs({ ...P, metric })}`), enabled: !!ready });
  const growth = useQuery({ queryKey: ['admin', 'growth', P], queryFn: () => api(`/dashboard/growth${qs(P)}`), enabled: !!ready });
  const brk = useQuery({ queryKey: ['admin', 'breakdown', P], queryFn: () => api(`/dashboard/breakdown${qs(P)}`), enabled: !!ready });
  const pend = useQuery({ queryKey: ['admin', 'pending'], queryFn: () => api('/dashboard/pending'), refetchInterval: 60_000 }); const act = useQuery({ queryKey: ['admin', 'activity'], queryFn: () => api('/dashboard/activity'), refetchInterval: 120_000 });
  const d = m.data; const fmtSeries = (u) => (u === 'NGN' ? (v) => naira(v) : (v) => `${num(v)} pts`);
  return <div className="space-y-6">
    <PageHeader title="Platform Overview" desc="Monitor platform activity, financial performance, and outstanding operations." actions={<div className="flex gap-2 flex-wrap items-center"><select className="input !w-auto" value={range} onChange={(e) => set({ range: e.target.value, from: '', to: '' })} aria-label="Date range">{RANGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>{range === 'custom' && <><input type="date" className="input !w-auto" value={from} onChange={(e) => set({ from: e.target.value })} aria-label="From" /><input type="date" className="input !w-auto" value={to} onChange={(e) => set({ to: e.target.value })} aria-label="To" /></>}</div>} />
    {!ready ? <Empty>Pick a start and end date.</Empty> : <>
    <Section q={m} height="h-48">{() => <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Metric label="Total users" value={num(d.users.total)} sub={`+${num(d.users.new)} new`} change={d.users.changePct} />
      <Metric label="Active creators" value={num(d.creators.total)} sub={`+${num(d.creators.new)} activated`} change={d.creators.changePct} />
      <Metric label="Successful payment volume" value={naira(d.paymentVolume.naira)} sub={`${num(d.paymentVolume.count)} payments`} change={d.paymentVolume.changePct} note={d.paymentVolume.note} />
      <Metric label="Platform revenue" value={naira(d.platformRevenue.naira)} sub={pts(d.platformRevenue.points)} change={d.platformRevenue.changePct} note={d.platformRevenue.note} tone="text-ok" />
      <Metric label="Creator earnings payable" value={naira(d.creatorEarningsPayable.naira)} sub={pts(d.creatorEarningsPayable.points)} note={d.creatorEarningsPayable.note} />
      <Metric label="Pending payouts" value={naira(d.pendingPayouts.naira)} sub={`${num(d.pendingPayouts.count)} request${d.pendingPayouts.count === 1 ? '' : 's'}`} tone={d.pendingPayouts.count ? 'text-warn' : ''} />
      <Metric label="Pending verification" value={num(d.pendingVerification)} sub="awaiting provider or review" tone={d.pendingVerification ? 'text-warn' : ''} />
      <Metric label="Open reports" value={num(d.openReports)} sub="unresolved cases" tone={d.openReports ? 'text-bad' : ''} /></div>}</Section>
    {d && <p className="text-xs text-muted -mt-3">Payment volume is money collected, not profit. Revenue = creator commission + promotions + Pro plans at ₦{d.nairaPerPoint}/point (current rate). Creator earnings and refunds are tracked separately and never added together.</p>}

    <div className="grid lg:grid-cols-3 gap-4">
      <div className="card lg:col-span-2 space-y-3"><div className="flex items-center justify-between flex-wrap gap-2"><h2 className="font-semibold">Revenue analytics</h2></div><Tabs tabs={METRICS} value={metric} onChange={setMetric} />
        <Section q={series} height="h-56" isEmpty={(s) => s.points.every((p) => !p.value)} empty={<Empty>No {label(metric).toLowerCase()} in this period.</Empty>}>{(s) => <LineChart series={[{ name: METRICS.find((x) => x[0] === metric)[1], points: s.points.map((p) => ({ label: p.date.slice(5), value: p.value })) }]} format={fmtSeries(s.unit)} />}</Section></div>
      <div className="card space-y-3"><h2 className="font-semibold">Pending actions</h2>
        <Section q={pend} height="h-48" isEmpty={(x) => x.items.length === 0} empty={<p className="text-sm text-ink2 py-6 text-center">Nothing needs attention 🎉</p>}>{(x) => <ul className="space-y-1 max-h-72 overflow-y-auto">{x.items.map((i, k) => <li key={k}><Link to={i.link} className="flex items-start gap-2 text-sm px-2 py-2 rounded hover:bg-card2"><span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${i.urgent ? 'bg-bad' : 'bg-warn'}`} /><span className="flex-1 min-w-0">{i.label}<span className="block text-xs text-muted">{ago(i.since)}{i.urgent ? ' · urgent' : ''}</span></span></Link></li>)}</ul>}</Section></div></div>

    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card space-y-3"><h2 className="font-semibold">User growth</h2><Section q={growth} height="h-56" isEmpty={(g) => g.days.every((x) => !x.registrations && !x.creatorActivations)} empty={<Empty>No sign-ups in this period.</Empty>}>{(g) => <><LineChart series={[{ name: 'New registrations', points: g.days.map((x) => ({ label: x.date.slice(5), value: x.registrations })) }, { name: 'Creator activations', points: g.days.map((x) => ({ label: x.date.slice(5), value: x.creatorActivations })) }]} /><p className="text-xs text-muted">Returning active users: not tracked (only the latest activity time is stored).</p></>}</Section></div>
      <div className="card space-y-3"><h2 className="font-semibold">Revenue breakdown</h2><Section q={brk} height="h-56" isEmpty={(b) => !b.spendByType.length && !b.pointPurchasesNaira} empty={<Empty>No activity in this period.</Empty>}>{(b) => <>
        {b.spendByType.length > 0 && <Donut parts={b.spendByType.map((s) => ({ label: label(s.type), value: s.points }))} format={(v) => `${num(v)} pts`} />}
        <dl className="text-sm grid grid-cols-2 gap-2 border-t border-line pt-3"><div><dt className="text-xs text-muted">Point purchases (money in)</dt><dd className="font-semibold">{naira(b.pointPurchasesNaira)}</dd></div><div><dt className="text-xs text-muted">Creator sales (gross)</dt><dd className="font-semibold">{pts(b.creatorSales.gross)}</dd></div><div><dt className="text-xs text-muted">Creator earnings (net)</dt><dd className="font-semibold">{pts(b.creatorSales.net)}</dd></div><div><dt className="text-xs text-muted">Platform commission</dt><dd className="font-semibold text-ok">{pts(b.creatorSales.commission)}</dd></div></dl></>}</Section></div></div>

    </>}
    <div className="card space-y-3"><h2 className="font-semibold">Recent activity</h2><Section q={act} height="h-48" isEmpty={(x) => x.items.length === 0}>{(x) => <ul className="divide-y divide-line">{x.items.map((i, k) => <li key={k} className="py-2 flex items-center gap-3 text-sm"><Badge value={i.type} tone="mute" /><span className="flex-1 min-w-0 break-words">{i.text}</span><span className="text-xs text-muted shrink-0">{ago(i.at)}</span></li>)}</ul>}</Section></div>
  </div>;
}
