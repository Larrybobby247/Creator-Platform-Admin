import { useState } from 'react';
const PAL = ['#8B5CF6', '#EC4899', '#60A5FA', '#22C55E', '#F59E0B', '#A78BFA', '#EF4444'];
// series: [{ name, color?, points: [{ label, value }] }]   -- consistent labels, legend and tooltip
export function LineChart({ series, height = 220, format = (v) => v.toLocaleString() }) {
  const [hover, setHover] = useState(null); const W = 640, H = height, P = { l: 44, r: 12, t: 12, b: 24 };
  const n = Math.max(...series.map((s) => s.points.length), 2); const max = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.value)));
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (n - 1), y = (v) => H - P.b - (v / max) * (H - P.t - P.b);
  const labels = series[0]?.points || []; const step = Math.max(1, Math.ceil(labels.length / 7));
  return <div><div className="flex gap-4 text-xs text-ink2 mb-2 flex-wrap">{series.map((s, i) => <span key={s.name} className="flex items-center gap-1.5"><i className="w-3 h-1.5 rounded-full" style={{ background: s.color || PAL[i] }} />{s.name}</span>)}</div>
    <div className="relative"><svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Line chart" onMouseLeave={() => setHover(null)} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left) / r.width * W - P.l) / ((W - P.l - P.r) / (n - 1))); setHover(Math.max(0, Math.min(n - 1, i))); }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => <g key={f}><line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke="#292935" /><text x={P.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="#77778D">{format(Math.round(max * f))}</text></g>)}
      {series.map((s, si) => <path key={s.name} d={s.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')} fill="none" stroke={s.color || PAL[si]} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />)}
      {labels.map((p, i) => i % step === 0 && <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#77778D">{p.label}</text>)}
      {hover !== null && <g><line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#30303D" />{series.map((s, si) => s.points[hover] && <circle key={s.name} cx={x(hover)} cy={y(s.points[hover].value)} r="4" fill={s.color || PAL[si]} />)}</g>}</svg>
      {hover !== null && labels[hover] && <div className="absolute top-0 right-0 bg-card2 border border-line rounded-btn px-3 py-2 text-xs space-y-0.5 pointer-events-none"><b>{labels[hover].label}</b>{series.map((s, si) => <p key={s.name} style={{ color: s.color || PAL[si] }}>{s.name}: {format(s.points[hover]?.value || 0)}</p>)}</div>}</div></div>;
}
export function Donut({ parts, format = (v) => v.toLocaleString() }) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1; let acc = 0; const R = 40, C = 2 * Math.PI * R;
  return <div className="flex items-center gap-5 flex-wrap"><svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90" role="img" aria-label="Breakdown">{parts.map((p, i) => { const len = (p.value / total) * C; const el = <circle key={p.label} cx="50" cy="50" r={R} fill="none" stroke={PAL[i % PAL.length]} strokeWidth="14" strokeDasharray={`${len} ${C}`} strokeDashoffset={-acc}><title>{p.label}: {format(p.value)}</title></circle>; acc += len; return el; })}</svg>
    <ul className="text-sm space-y-1.5 min-w-0 flex-1">{parts.map((p, i) => <li key={p.label} className="flex items-center gap-2"><i className="w-3 h-3 rounded-full shrink-0" style={{ background: PAL[i % PAL.length] }} /><span className="truncate flex-1">{p.label}</span><b>{format(p.value)}</b><span className="text-muted text-xs w-9 text-right">{Math.round((p.value / total) * 100)}%</span></li>)}</ul></div>;
}
