import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../lib/toast';
// Runs an admin mutation, shows the result, and refreshes every admin list/detail so nothing stays stale.
export function useDo() {
  const qc = useQueryClient();
  return async (path, body, ok = 'Done', method = 'POST') => { try { const r = await api(path, { method, body }); toast(ok); qc.invalidateQueries({ queryKey: ['admin'] }); return r; } catch (e) { toast(e.message, 'bad'); return null; } };
}
