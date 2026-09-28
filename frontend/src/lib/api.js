import axios from "axios";

const PROD_API = "https://prepify-api.onrender.com";
export const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API : "http://localhost:5000")
).replace(/\/$/, "");

const ACCESS = "prepify.accessToken";
const REFRESH = "prepify.refreshToken";

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  get refresh() {
    return localStorage.getItem(REFRESH);
  },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 90_000 });

api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// On a 401, refresh the access token once (shared across concurrent requests) and retry.
let refreshing = null;
const listeners = new Set();
export const onSessionExpired = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Login/signup/refresh 401s are real failures, not an expired access token.
    const isCredentialCall = /^\/auth\/(login|signup|refresh)/.test(original?.url ?? "");
    if (error.response?.status !== 401 || original?._retried || isCredentialCall || !tokens.refresh) {
      throw error;
    }
    original._retried = true;
    try {
      refreshing ??= axios
        .post(`${API_URL}/api/auth/refresh`, { refreshToken: tokens.refresh })
        .then(({ data }) => tokens.set(data))
        .finally(() => {
          refreshing = null;
        });
      await refreshing;
      return api(original);
    } catch {
      tokens.clear();
      listeners.forEach((fn) => fn());
      throw error;
    }
  }
);

export function errorMessage(err, fallback = "Something went wrong") {
  if (err?.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
  if (!err?.response && err?.message === "Network Error") {
    return "Can't reach the Prepify server. It may be waking up — try again in a few seconds.";
  }
  return err?.response?.data?.message || err?.message || fallback;
}
