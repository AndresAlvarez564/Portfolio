import { apiGet, apiPatch, apiPost } from "./api";
import type { ContactFormData, ContactMessage, ContactStatus } from "../types/contact";

export async function submitContact(data: ContactFormData): Promise<void> {
  await apiPost<{ message: string }>("/contact", data);
}

export async function listMessages(
  token: string,
  status?: ContactStatus,
): Promise<ContactMessage[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiGet<ContactMessage[]>(`/contact${query}`, token);
}

export async function getMessage(id: string, token: string): Promise<ContactMessage> {
  return apiGet<ContactMessage>(`/contact/${id}`, token);
}

export async function updateMessageStatus(
  id: string,
  status: ContactStatus,
  token: string,
): Promise<ContactMessage> {
  return apiPatch<ContactMessage>(`/contact/${id}`, { status }, token);
}
