import { supabase } from "./supabase";

const LOCAL_KEY = "mt_last_seen_catalog_at";

export function localWatermark(): string | null {
  return localStorage.getItem(LOCAL_KEY);
}

/** Prefer the later of the cross-device (profile) and local watermarks. */
export function resolveWatermark(profileWatermark: string | null | undefined): string | null {
  const local = localWatermark();
  if (profileWatermark && local) return profileWatermark > local ? profileWatermark : local;
  return profileWatermark ?? local;
}

export async function advanceWatermark(userId: string | undefined): Promise<void> {
  const now = new Date().toISOString();
  localStorage.setItem(LOCAL_KEY, now);
  if (supabase && userId) {
    await supabase.from("profiles").update({ last_seen_catalog_at: now }).eq("user_id", userId);
  }
}
