const NGN = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });
export const naira = (n) => NGN.format(Number(n || 0));            // ₦125,000.00
export const pts = (n) => `${Number(n || 0).toLocaleString()} pts`;
export const num = (n) => Number(n || 0).toLocaleString();
export const dt = (d) => (d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '–');
export const day = (d) => (d ? new Date(d).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : '–');
export const ago = (d) => { if (!d) return '–'; const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };
export const label = (s) => String(s || '').replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
