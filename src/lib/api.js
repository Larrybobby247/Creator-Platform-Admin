const API_BASE_URL = "https://creator-server-hdsk.onrender.com";

export async function api(
  path,
  { method = "GET", body, form, signal } = {}
) {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  // Admin API requests go directly to Render.
  const url = new URL(
    `/api/admin${normalizedPath}`,
    API_BASE_URL
  ).toString();

  console.log("[Admin API] Request URL:", url);

  let response;

  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      signal,
      headers: {
        ...(body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        form ??
        (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (error) {
    console.error("[Admin API] Network error:", error);
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  console.log("[Admin API] Response:", response.status, data);

  if (!response.ok) {
    if (
      response.status === 401 &&
      data.code === "UNAUTHENTICATED"
    ) {
      window.dispatchEvent(new Event("admin:unauth"));
    }

    throw Object.assign(
      new Error(
        data.error ||
          data.details?.[0]?.message ||
          `Request failed (${response.status})`
      ),
      {
        status: response.status,
        code: data.code,
        data,
      }
    );
  }

  return data;
}
