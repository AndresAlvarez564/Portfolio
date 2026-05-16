import { apiDelete, apiGet, apiPost, apiPut } from "./api";
import type { Certification, CertificationInput } from "../types/certification";

export async function listCertifications(): Promise<Certification[]> {
  return apiGet<Certification[]>("/certifications");
}

export async function createCertification(
  data: CertificationInput,
  token: string,
): Promise<Certification> {
  return apiPost<Certification>("/certifications", data, token);
}

export async function updateCertification(
  id: string,
  data: CertificationInput,
  token: string,
): Promise<Certification> {
  return apiPut<Certification>(`/certifications/${id}`, data, token);
}

export async function deleteCertification(id: string, token: string): Promise<void> {
  return apiDelete(`/certifications/${id}`, token);
}
