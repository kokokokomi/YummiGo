import axios from "axios";
import { API_BASE_URL } from "@/src/config/env";
import { getToken } from "@/src/lib/storage";
import type { ApiResult } from "@/src/types/api";

export const http = axios.create({
  baseURL: `${API_BASE_URL}/user`,
  timeout: 15000,
});

http.interceptors.request.use(async (config) => {
  // 中文注释：统一在请求头注入用户 token，后端通过 Bearer 鉴权
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const { data } = await http.get<ApiResult<T>>(url, { params });
  return unwrap(data);
}

export async function apiPost<T>(url: string, payload?: unknown) {
  const { data } = await http.post<ApiResult<T>>(url, payload);
  return unwrap(data);
}

export async function apiPut<T>(url: string, payload?: unknown) {
  const { data } = await http.put<ApiResult<T>>(url, payload);
  return unwrap(data);
}

export async function apiDelete<T>(url: string) {
  const { data } = await http.delete<ApiResult<T>>(url);
  return unwrap(data);
}

function unwrap<T>(res: ApiResult<T>) {
  if (res.code !== 1) {
    throw new Error(res.message || res.msg || "API error");
  }
  return res.data;
}

