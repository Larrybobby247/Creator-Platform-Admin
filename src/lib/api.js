export const API_BASE_URL = import.meta.env.PROD
  ? "https://creator-server-hdsk.onrender.com"
  : "";

// Everything goes to /api/admin with the admin session cookie.
export async function api(
  path,
  { method = "GET", body, form, signal } = {}
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = `${API_BASE_URL}/api/admin${normalizedPath}`;

  // A sleeping free-tier server can take close to a minute to wake up; never wait forever.
  let r;
  try {
    r = await fetch(url, {
      method,
      credentials: "include",
      signal: signal || AbortSignal.timeout(60_000),
      headers: body
        ? { "Content-Type": "application/json" }
        : {},
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    if (e?.name === "AbortError") throw e; // a cancelled request is not a network problem
    throw Object.assign(new Error(e?.name === "TimeoutError" ? "The server took too long to respond. It may be waking up: try again in a moment." : "Cannot reach the server. Check your connection and try again."), { status: 0, code: "NETWORK" });
  }


  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    // The sign-in check itself (/auth/*) handles its own 401; only an expired session on a normal page should kick you out.
    if (r.status === 401 && data.code === "UNAUTHENTICATED" && !normalizedPath.startsWith("/auth/")) {
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
