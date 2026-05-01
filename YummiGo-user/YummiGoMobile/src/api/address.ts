import { apiGet, apiPost, apiPut, apiDelete } from "@/src/lib/http";
import type { Address } from "@/src/types/api";

export function getAddressList() {
  return apiGet<Address[]>("/address/list");
}

export function getDefaultAddress() {
  return apiGet<Address>("/address/default");
}

export function createAddress(payload: Partial<Address>) {
  return apiPost<void>("/address", payload);
}

export function updateAddress(payload: Partial<Address>) {
  return apiPut<void>("/address", payload);
}

export function setDefaultAddress(id: string) {
  return apiPut<void>("/address/default", { id });
}

export function deleteAddress(id: string) {
  return apiDelete<void>(`/address/${id}`);
}

export function reverseGeocode(lat: number, lon: number) {
  return apiGet<{
    displayName?: string;
    provinceName?: string;
    cityName?: string;
    districtName?: string;
    detail?: string;
  }>("/address/reverse-geocode", { lat, lon });
}

