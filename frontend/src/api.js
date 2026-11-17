const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const getToken = () => localStorage.getItem("token");
export const setToken = (t) =>
  t ? localStorage.setItem("token", t) : localStorage.removeItem("token");

// body can be a plain object (sent as JSON) or a FormData (for file uploads).
export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

// A user counts as online if they made a request in the last 2 minutes.
export const isOnline = (lastSeen) =>
  !!lastSeen && Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
