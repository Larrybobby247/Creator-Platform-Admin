const API_BASE_URL = "https://creator-server-hdsk.onrender.com";

export async function api(path, { method = "GET", body, form, signal } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = `${API_BASE_URL}/api/admin${normalizedPath}`;

  console.log("API REQUEST:", url);

  const r = await fetch(url, {
    method,
    credentials: "include",
    signal,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: form || (body ? JSON.stringify(body) : undefined),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    if (r.status === 401 && data.code === "UNAUTHENTICATED") {
      window.dispatchEvent(new Event("admin:unauth"));
    }

    throw Object.assign(
      new Error(data.error || data.details?.[0]?.message || "Request failed"),
      { status: r.status, code: data.code, data }
    );
  }

  return data;
}
