export const toast = (message, tone = 'ok') => window.dispatchEvent(new CustomEvent('admin:toast', { detail: { message, tone } }));
