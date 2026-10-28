import { createContext, useContext, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
const Ctx = createContext(null); export const useAdmin = () => useContext(Ctx);
const KEY = ['admin-me'];
export function AdminProvider({ children }) {
  const qc = useQueryClient();
  // "Not signed in" (401) is a normal answer here, not an error: it resolves to null so the login screen shows.
  // Only real failures (server asleep or unreachable) stay errors, and the app shows a Retry screen for those.
  const q = useQuery({ queryKey: KEY, queryFn: async () => { try { return await api('/auth/me'); } catch (e) { if (e.status === 401) return null; throw e; } }, retry: false, staleTime: 5 * 60_000 });
  // Forget everything except the session query. Never clear the session query itself: that detaches the hook that is watching it and the screen stops updating.
  const wipe = useCallback(() => qc.removeQueries({ predicate: (x) => x.queryKey[0] !== KEY[0] }), [qc]);
  useEffect(() => { const f = () => { qc.setQueryData(KEY, null); wipe(); }; window.addEventListener('admin:unauth', f); return () => window.removeEventListener('admin:unauth', f); }, [qc, wipe]);
  const admin = q.data?.admin || null; const perms = new Set(admin?.permissions || []);
  const login = async (email, password) => { const d = await api('/auth/login', { method: 'POST', body: { email, password } }); wipe(); qc.setQueryData(KEY, d); };
  const logout = useCallback(async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); qc.setQueryData(KEY, null); wipe(); }, [qc, wipe]);
  return <Ctx.Provider value={{ admin, loading: q.isPending, error: q.isError ? q.error : null, retry: () => q.refetch(), can: (p) => perms.has(p), login, logout }}>{children}</Ctx.Provider>;
}
