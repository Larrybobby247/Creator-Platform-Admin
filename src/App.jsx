import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from './context/Auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import { Skeleton } from './components/ui.jsx';

const L = (file, name) => lazy(() => import(`./pages/${file}.jsx`).then((m) => ({ default: m[name] || m.default })));
const Dashboard = L('Dashboard'), Users = L('People', 'Users'), Creators = L('People', 'Creators'), Verification = L('People', 'Verification'), Reports = L('People', 'Reports');
const Content = L('Platform', 'Content'), Communities = L('Platform', 'Communities'), Gifts = L('Platform', 'Gifts'), Ratings = L('Platform', 'Ratings');
const Transactions = L('Revenue', 'Transactions'), Packages = L('Revenue', 'Packages'), Payouts = L('Revenue', 'Payouts'), Subscriptions = L('Revenue', 'Subscriptions'), Referrals = L('Revenue', 'Referrals'), Promotions = L('Revenue', 'Promotions');
const Meetups = L('Ops', 'Meetups'), Announcements = L('Ops', 'Announcements');
const Settings = L('Config', 'Settings'), Pricing = L('Config', 'Pricing'), Roles = L('Config', 'Roles'), Audit = L('Config', 'Audit'), Health = L('Config', 'Health');
const Fallback = () => <div className="space-y-3" aria-busy="true"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-56" /></div>;

// Hiding a menu item is cosmetic; every API route enforces the same permission on the server.
function Guard({ perm, children }) { const { can } = useAdmin(); return can(perm) ? children : <div className="card text-center py-12"><h1 className="text-xl font-bold">No access</h1><p className="text-ink2 text-sm mt-1">Your role does not include permission <code>{perm}</code>.</p></div>; }
function Boot({ error, retry }) {
  const [slow, setSlow] = useState(false); useEffect(() => { const t = setTimeout(() => setSlow(true), 5000); return () => clearTimeout(t); }, []);
  return <div className="min-h-screen grid place-items-center p-4 text-center"><div className="space-y-3 max-w-sm">
    {error ? <><p className="text-lg font-semibold">Cannot reach the server</p><p className="text-ink2 text-sm">{error.message}</p><button className="btn-primary" onClick={retry}>Try again</button></>
      : <><div className="w-8 h-8 mx-auto rounded-full border-2 border-violet border-t-transparent animate-spin" /><p className="text-ink2">Loading…</p>{slow && <p className="text-xs text-muted">The server is waking up. This can take up to a minute the first time.</p>}</>}</div></div>;
}
export default function App() {
  const { admin, loading, error, retry } = useAdmin();
  if (loading || error) return <Boot error={error} retry={retry} />;
  if (!admin) return <Login />;
  const g = (perm, el) => <Guard perm={perm}>{el}</Guard>;
  return <Layout><Suspense fallback={<Fallback />}><Routes>
    <Route path="/" element={g('dashboard.read', <Dashboard />)} />
    <Route path="/users" element={g('users.read', <Users />)} /><Route path="/creators" element={g('creators.read', <Creators />)} /><Route path="/verification" element={g('verification.read', <Verification />)} />
    <Route path="/reports" element={g('reports.read', <Reports />)} /><Route path="/message-reports" element={g('reports.read', <Reports messages />)} />
    <Route path="/content" element={g('content.read', <Content />)} /><Route path="/communities" element={g('communities.read', <Communities />)} /><Route path="/gifts" element={g('gifts.manage', <Gifts />)} /><Route path="/ratings" element={g('ratings.read', <Ratings />)} />
    <Route path="/transactions" element={g('transactions.read', <Transactions />)} /><Route path="/packages" element={g('packages.manage', <Packages />)} /><Route path="/payouts" element={g('payouts.read', <Payouts />)} />
    <Route path="/subscriptions" element={g('subscriptions.read', <Subscriptions />)} /><Route path="/referrals" element={g('referrals.read', <Referrals />)} /><Route path="/promotions" element={g('promotions.read', <Promotions />)} />
    <Route path="/meetups" element={g('meetups.read', <Meetups />)} /><Route path="/disputes" element={g('meetups.read', <Meetups disputes />)} /><Route path="/announcements" element={g('notifications.send', <Announcements />)} />
    <Route path="/settings" element={g('settings.read', <Settings />)} /><Route path="/pricing" element={g('settings.read', <Pricing />)} /><Route path="/roles" element={g('admins.manage', <Roles />)} /><Route path="/audit" element={g('audit_logs.read', <Audit />)} /><Route path="/health" element={g('health.read', <Health />)} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></Suspense></Layout>;
}
