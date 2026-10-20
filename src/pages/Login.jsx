import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../context/Auth.jsx';
export default function Login() {
  const { login } = useAdmin(); const [f, setF] = useState({ email: '', password: '' }); const [show, setShow] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const p = useQuery({ queryKey: ['platform'], queryFn: () => fetch('/api/platform').then((r) => r.json()), staleTime: 10 * 60_000 }); const name = p.data?.name || 'Platform';
  const go = async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await login(f.email, f.password); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return <div className="min-h-screen grid place-items-center p-4 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,246,.18),transparent)]"><form onSubmit={go} className="card w-full max-w-sm space-y-4 !p-6 animate-rise" aria-busy={busy}>
    <div className="text-center space-y-2">{p.data?.logoUrl ? <img src={p.data.logoUrl} alt="" width="48" height="48" className="mx-auto rounded-xl" /> : <span className="mx-auto grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet to-pink text-xl font-bold">{name[0]}</span>}<h1 className="text-xl font-bold">{name}</h1><p className="text-[11px] tracking-widest text-pink font-semibold flex items-center justify-center gap-1"><ShieldCheck size={12} />ADMINISTRATION</p></div>
    <label className="block text-sm">Email<input type="email" autoComplete="username" required className="input mt-1" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
    <label className="block text-sm">Password<span className="relative block"><input type={show ? 'text' : 'password'} autoComplete="current-password" required className="input mt-1 pr-10" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
    {err && <p role="alert" className="text-bad text-sm">{err}</p>}
    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    <p className="text-xs text-muted text-center">Administrator accounts are created by an authorised person. There is no public sign-up. Forgot your password? Ask a Super Admin to reset it.</p></form></div>;
}
