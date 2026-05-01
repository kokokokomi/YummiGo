import { apiGet, apiPost, apiPut, http } from "@/src/lib/http";
import type { UserLoginVO } from "@/src/types/api";

export function loginByPassword(email: string, password: string) {
  return apiPost<UserLoginVO>("/user/login", { email, password });
}

export function loginByGoogle(idToken: string) {
  return apiPost<UserLoginVO>("/user/google-login", { idToken });
}

export function getUserInfo() {
  return apiGet<any>("/user/info");
}

export function updateUserInfo(payload: { name: string; avatar?: string }) {
  return apiPut<void>("/user/updateInfo", payload);
}

export function updateUserPassword(newPassword: string) {
  return apiPut<void>("/user/resetPwd", { newPassword });
}

export async function uploadAvatar(uri: string) {
  const filename = uri.split("/").pop() || `avatar-${Date.now()}.jpg`;
  const ext = filename.toLowerCase().endsWith(".png") ? "png" : "jpg";
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: filename,
    type: ext === "png" ? "image/png" : "image/jpeg",
  } as any);
  const { data } = await http.post("/common/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (data.code !== 1) throw new Error(data.message || data.msg || "upload failed");
  return data.data as string;
}

