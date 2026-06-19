import axios from "axios";

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL?: string;
    };
  }
}

export const api = axios.create({
  baseURL: window.__APP_CONFIG__?.API_URL ?? import.meta.env.VITE_API_URL ?? "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function downloadExport(path: string, filename: string) {
  const { data } = await api.get(path, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
