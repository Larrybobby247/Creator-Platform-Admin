import { createContext, useCallback, useContext, useState } from 'react';
import { Modal } from './ui.jsx';
const Ctx = createContext(null);
// Consequential actions always go through this: a clear description, a mandatory reason, an explicit confirm.
//   const r = await ask({ title, description, confirmLabel, danger, fields?: [{ name, label, type?, options?, placeholder? }], needReason: true });  -> null if cancelled, else { reason, ...fields }
export const useReason = () => useContext(Ctx);
function Dialog({ req, close }) {
  const [v, setV] = useState(() => Object.fromEntries((req.fields || []).map((f) => [f.name, f.default ?? '']))); const [reason, setReason] = useState(''); const need = req.needReason !== false;
  const ok = (!need || reason.trim().length >= 5) && (req.fields || []).every((f) => !f.required || String(v[f.name]).trim());
  return <Modal open onClose={() => close(null)} title={req.title}><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); ok && close({ reason: reason.trim(), ...v }); }}>
    {req.description && <p className="text-sm text-ink2">{req.description}</p>}
    {(req.fields || []).map((f) => <label key={f.name} className="block text-sm">{f.label}{f.options ? <select className="input mt-1" value={v[f.name]} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}>{f.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select> : <input className="input mt-1" type={f.type || 'text'} placeholder={f.placeholder} value={v[f.name]} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />}</label>)}
    {need && <label className="block text-sm">Reason <span className="text-muted">(recorded in the audit log)</span><textarea autoFocus className="input mt-1 min-h-[90px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="At least 5 characters" /></label>}
    <div className="flex gap-2 pt-1"><button type="button" className="btn-ghost flex-1" onClick={() => close(null)}>Cancel</button><button className={`${req.danger ? 'btn-danger' : 'btn-primary'} flex-1`} disabled={!ok}>{req.confirmLabel || 'Confirm'}</button></div></form></Modal>;
}
export function ReasonProvider({ children }) {
  const [req, setReq] = useState(null); const ask = useCallback((o) => new Promise((resolve) => setReq({ ...o, resolve })), []); const close = (v) => { req.resolve(v); setReq(null); };
  return <Ctx.Provider value={ask}>{children}{req && <Dialog req={req} close={close} />}</Ctx.Provider>;
}
