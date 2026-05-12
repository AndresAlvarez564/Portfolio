import { apiGet, apiPut } from "./api";
import type { ProfileData } from "../types/profile";

export async function getProfile(): Promise<ProfileData> {
  return apiGet<ProfileData>("/profile");
}

export async function updateProfile(data: Partial<ProfileData>, token: string): Promise<ProfileData> {
  return apiPut<ProfileData>("/profile", data, token);
}
