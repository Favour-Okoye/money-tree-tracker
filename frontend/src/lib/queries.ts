import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { award, awardCustom, watchPoints } from "./xp";
import type { MediaStatusRow, MediaType, NoteRow, WatchStatus } from "./types";

export type StatusMap = Record<string, MediaStatusRow>;

export const statusKey = (mediaType: MediaType, mediaId: string) => `${mediaType}:${mediaId}`;

export function useStatuses() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["statuses", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<StatusMap> => {
      const { data, error } = await supabase!
        .from("media_status")
        .select("media_type, media_id, status, watched_at, liked, commented, rating");
      if (error) throw error;
      const map: StatusMap = {};
      for (const row of (data ?? []) as MediaStatusRow[]) {
        map[statusKey(row.media_type, row.media_id)] = row;
      }
      return map;
    },
  });
}

export interface StatusPatch {
  mediaType: MediaType;
  mediaId: string;
  status?: WatchStatus;
  liked?: boolean;
  commented?: boolean;
  rating?: number | null;
  durationS?: number | null;
  isShort?: boolean | null;
}

function mergePatch(existing: MediaStatusRow | undefined, patch: StatusPatch): MediaStatusRow {
  const status = patch.status ?? existing?.status ?? "watched";
  return {
    media_type: patch.mediaType,
    media_id: patch.mediaId,
    status,
    watched_at:
      existing?.watched_at ?? (status === "watched" ? new Date().toISOString() : null),
    liked: patch.liked ?? existing?.liked ?? false,
    commented: patch.commented ?? existing?.commented ?? false,
    rating: patch.rating !== undefined ? patch.rating : (existing?.rating ?? null),
  };
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const key = ["statuses", session?.user.id];

  return useMutation({
    mutationFn: async (patch: StatusPatch) => {
      if (!supabase || !session) throw new Error("not signed in");
      const existing = (qc.getQueryData<StatusMap>(key) ?? {})[
        statusKey(patch.mediaType, patch.mediaId)
      ];
      const row = mergePatch(existing, patch);
      const { error } = await supabase
        .from("media_status")
        .upsert(row, { onConflict: "user_id,media_type,media_id" });
      if (error) throw error;
      return row;
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<StatusMap>(key);
      // Snapshot the row BEFORE the optimistic update: XP decisions use this.
      const before = prev?.[statusKey(patch.mediaType, patch.mediaId)];
      qc.setQueryData<StatusMap>(key, (old = {}) => ({
        ...old,
        [statusKey(patch.mediaType, patch.mediaId)]: mergePatch(
          old[statusKey(patch.mediaType, patch.mediaId)],
          patch
        ),
      }));
      return { prev, before };
    },
    onSuccess: async (_row, patch, ctx) => {
      const before = ctx?.before;
      if (patch.status === "watched" && before?.status !== "watched") {
        if (patch.mediaType === "hub_resource") {
          await award("complete_training", patch.mediaType, patch.mediaId);
        } else {
          await awardCustom("watch_video", patch.mediaType, patch.mediaId, watchPoints(patch.durationS, patch.isShort));
        }
      }
      if ((patch.liked && !before?.liked) || (patch.commented && !before?.commented)) {
        await award("engage_video", patch.mediaType, patch.mediaId);
      }
      void qc.invalidateQueries({ queryKey: ["xp_days", session?.user.id] });
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useNotes(sourceType: string, sourceId: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["notes", sourceType, sourceId, session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<NoteRow[]> => {
      const { data, error } = await supabase!
        .from("notes")
        .select("id, source_type, source_id, body, takeaways, created_at")
        .eq("source_type", sourceType)
        .eq("source_id", sourceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NoteRow[];
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      sourceType: string;
      sourceId: string;
      body: string;
      takeaways: string[];
    }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { data, error } = await supabase
        .from("notes")
        .insert({
          source_type: input.sourceType,
          source_id: input.sourceId,
          body: input.body,
          takeaways: input.takeaways.length ? input.takeaways : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      await award("write_note", "note_source", `${input.sourceType}:${input.sourceId}`);
      return data;
    },
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: ["notes", input.sourceType, input.sourceId] });
    },
  });
}

export interface ProfileRow {
  user_id: string;
  display_name: string;
  timezone: string;
  last_seen_catalog_at: string;
  xp_total: number;
  current_streak: number;
  longest_streak: number;
  last_activity_on: string | null;
}

export function useProfile() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["profile", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase!.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data as ProfileRow | null;
    },
  });
}
