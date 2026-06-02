// src/Components/api.js
import axios from "axios";

const isDev = import.meta.env.DEV;

// En dev usa la API local; en prod usa el proxy /api (Vercel rewrites)
const baseURL =
  import.meta.env.VITE_API_BASE ??
  (isDev ? "https://localhost:7288/api" : "/api");

const api = axios.create({
  baseURL,
  timeout: 45000,
  withCredentials: true,   
});

export const WORKSHOP_STORAGE_KEY = "tc_workshop_id";

export function getCurrentWorkshopId() {
  return localStorage.getItem(WORKSHOP_STORAGE_KEY) || "";
}

export function setCurrentWorkshopId(workshopId) {
  if (workshopId) {
    localStorage.setItem(WORKSHOP_STORAGE_KEY, String(workshopId));
  } else {
    localStorage.removeItem(WORKSHOP_STORAGE_KEY);
  }
  window.dispatchEvent(new Event("tc:workshop-changed"));
}

export function resolveApiAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const root = baseURL.replace(/\/api\/?$/i, "");
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

if (!isDev) console.log("[API baseURL]", baseURL);

// -------- Auth: arranque con token si ya existe --------
const bootToken = localStorage.getItem("fa_token");
if (bootToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${bootToken}`;
}

// Mantiene el header sincronizado cuando se inyecta el token (p.ej. TrialGate)
window.addEventListener("fa:token:set", (ev) => {
  try {
    const detail = ev?.detail || {};
    const t = detail.token || localStorage.getItem("fa_token");
    if (t) {
      api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  } catch {
    // no-op
  }
});

// -------- Interceptors --------
api.interceptors.request.use((config) => {
  // Doble check por si otro codigo actualizo localStorage.
  const t = localStorage.getItem("fa_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  const workshopId = getCurrentWorkshopId();
  if (workshopId) config.headers["X-Workshop-Id"] = workshopId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Limpieza local y aviso global.
      localStorage.removeItem("fa_token");
      localStorage.removeItem("fa_user");
      localStorage.removeItem(WORKSHOP_STORAGE_KEY);
      delete api.defaults.headers.common["Authorization"];
      window.dispatchEvent(new Event("fa:unauthorized"));
    }
    return Promise.reject(err);
  }
);

export default api;

