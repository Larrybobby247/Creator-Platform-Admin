// Everything goes to /api/admin with the admin session cookie (separate from the public app's session).
export async function api(path, { method = 'GET', body, form, signal } = {}) {
  const r = await fetch(`/api/admin${path}`, { method, credentials: 'include', signal, headers: body ? { 'Content-Type': 'application/json' } : {}, body: form || (body ? JSON.stringify(body) : undefined) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && data.code === 'UNAUTHENTICATED') window.dispatchEvent(new Event('admin:unauth')); throw Object.assign(new Error(data.error || data.details?.[0]?.message || 'Request failed'), { status: r.status, code: data.code, data }); }
  return data;
}
export const qs = (o) => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && p.set(k, v)); const s = p.toString(); return s ? `?${s}` : ''; };
