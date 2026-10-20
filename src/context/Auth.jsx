import { createContext, useContext, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
const Ctx = createContext(null); export const useAdmin = () => useContext(Ctx);
export function AdminProvider({ children }) {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['admin-me'], queryFn: () => api('/auth/me'), retry: false, staleTime: 5 * 60_000 });
  useEffect(() => { const f = () => { qc.clear(); qc.setQueryData(['admin-me'], null); }; window.addEventListener('admin:unauth', f); return () => window.removeEventListener('admin:unauth', f); }, [qc]);
  const admin = q.data?.admin || null; const perms = new Set(admin?.permissions || []);
  const login = async (email, password) => { const d = await api('/auth/login', { method: 'POST', body: { email, password } }); qc.clear(); qc.setQueryData(['admin-me'], d); };
  const logout = useCallback(async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); qc.clear(); qc.setQueryData(['admin-me'], null); }, [qc]);
  return <Ctx.Provider value={{ admin, loading: q.isPending, can: (p) => perms.has(p), login, logout }}>{children}</Ctx.Provider>;
}
