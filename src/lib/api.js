const API_BASE_URL = import.meta.env.PROD
  ? "https://creator-server-hdsk.onrender.com"
  : "";

// Everything goes to /api/admin with the admin session cookie.
export async function api(
  path,
  { method = "GET", body, form, signal } = {}
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = `${API_BASE_URL}/api/admin${normalizedPath}`;

  console.log("[Admin API] Request URL:", url);

  const r = await fetch(url, {
    method,
    credentials: "include",
    signal,
    headers: body
      ? { "Content-Type": "application/json" }
      : {},
    body: form || (body ? JSON.stringify(body) : undefined),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    if (r.status === 401 && data.code === "UNAUTHENTICATED") {
      window.dispatchEvent(new Event("admin:unauth"));
    }

    throw Object.assign(
      new Error(
        data.error ||
        data.details?.[0]?.message ||
        "Request failed"
      ),
      {
        status: r.status,
        code: data.code,
        data,
      }
    );
  }

  return data;
}

// Build query strings while ignoring empty or undefined values.
export const qs = (o) => {
  const p = new URLSearchParams();

  Object.entries(o).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      p.set(k, v);
    }
  });

  const s = p.toString();
  return s ? `?${s}` : "";
};
