import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { award } from "./xp";

export type Platform =
  | "instagram"
  | "facebook"
  | "youtube_community"
  | "skool"
  | "tiktok"
  | "other";
export type AssignmentSource = "whatsapp" | "skool" | "hub" | "other";
export type AssignmentStatus = "todo" | "doing" | "done" | "missed";

export interface PostLogRow {
  id: string;
  platform: Platform;
  url: string | null;
  posted_on: string | null;
  summary: string | null;
  takeaway: string | null;
  liked: boolean;
  commented: boolean;
  saved: boolean;
  created_at: string;
}

export interface AssignmentRow {
  id: string;
  source: AssignmentSource;
  title: string;
  details: string | null;
  assigned_on: string;
  due_on: string | null;
  status: AssignmentStatus;
  completed_at: string | null;
  attachment_path: string | null;
  created_at: string;
}

async function uploadAttachment(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase!.storage.from("attachments").upload(path, file);
  if (error) throw error;
  return path;
}

/** Open a private attachment via a short-lived signed URL.
 *  The blank tab is opened synchronously so popup blockers stay calm. */
export async function openAttachment(path: string): Promise<void> {
  const win = window.open("", "_blank");
  const { data, error } = await supabase!.storage
    .from("attachments")
    .createSignedUrl(path, 3600);
  if (error || !data) {
    win?.close();
    throw error ?? new Error("no signed url");
  }
  if (win) win.location.href = data.signedUrl;
  else window.location.href = data.signedUrl;
}

export function usePosts() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["posts_log", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<PostLogRow[]> => {
      const { data, error } = await supabase!
        .from("posts_log")
        .select("id, platform, url, posted_on, summary, takeaway, liked, commented, saved, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PostLogRow[];
    },
  });
}

export function useAddPost() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      platform: Platform;
      url: string;
      postedOn: string;
      summary: string;
      takeaway: string;
      liked: boolean;
      commented: boolean;
      saved: boolean;
    }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { data, error } = await supabase
        .from("posts_log")
        .insert({
          platform: input.platform,
          url: input.url || null,
          posted_on: input.postedOn || null,
          summary: input.summary || null,
          takeaway: input.takeaway || null,
          liked: input.liked,
          commented: input.commented,
          saved: input.saved,
        })
        .select("id")
        .single();
      if (error) throw error;
      await award("log_post", "post", (data as { id: string }).id);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["posts_log", session?.user.id] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase.from("posts_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["posts_log", session?.user.id] }),
  });
}

export function useAssignments() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["assignments", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<AssignmentRow[]> => {
      const { data, error } = await supabase!
        .from("assignments")
        .select(
          "id, source, title, details, assigned_on, due_on, status, completed_at, attachment_path, created_at"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssignmentRow[];
    },
  });
}

export function useAddAssignment() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      details: string;
      source: AssignmentSource;
      dueOn: string;
      file: File | null;
    }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const attachmentPath = input.file
        ? await uploadAttachment(input.file, session.user.id)
        : null;
      const { error } = await supabase.from("assignments").insert({
        title: input.title,
        details: input.details || null,
        source: input.source,
        due_on: input.dueOn || null,
        attachment_path: attachmentPath,
      });
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["assignments", session?.user.id] }),
  });
}

export function useSetAssignmentStatus() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { assignment: AssignmentRow; status: AssignmentStatus }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase
        .from("assignments")
        .update({
          status: input.status,
          completed_at:
            input.status === "done"
              ? (input.assignment.completed_at ?? new Date().toISOString())
              : input.assignment.completed_at,
        })
        .eq("id", input.assignment.id);
      if (error) throw error;
      if (input.status === "done") {
        await award("complete_assignment", "assignment", input.assignment.id);
      }
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["assignments", session?.user.id] }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (assignment: AssignmentRow) => {
      if (!supabase || !session) throw new Error("not signed in");
      if (assignment.attachment_path) {
        await supabase.storage.from("attachments").remove([assignment.attachment_path]);
      }
      const { error } = await supabase.from("assignments").delete().eq("id", assignment.id);
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["assignments", session?.user.id] }),
  });
}
