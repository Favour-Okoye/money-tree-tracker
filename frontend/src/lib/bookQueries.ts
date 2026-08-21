import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { award } from "./xp";
import { brusselsDay } from "./format";

export type BookStatus = "wishlist" | "owned" | "reading" | "finished";
export type ChapterStatus = "todo" | "reading" | "done";
export type ActionStatus = "open" | "done" | "dropped";

export interface BookProgressRow {
  book_slug: string;
  status: BookStatus;
  format: string | null;
  total_chapters: number | null;
  started_on: string | null;
  finished_on: string | null;
}

export interface ChapterRow {
  id: string;
  book_slug: string;
  chapter_no: number;
  title: string | null;
  status: ChapterStatus;
  completed_at: string | null;
}

export interface ActionItemRow {
  id: string;
  title: string;
  source_type: string | null;
  source_id: string | null;
  due_on: string | null;
  status: ActionStatus;
  completed_at: string | null;
  created_at: string;
}

export function useBookProgress() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["book_progress", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<Record<string, BookProgressRow>> => {
      const { data, error } = await supabase!
        .from("book_progress")
        .select("book_slug, status, format, total_chapters, started_on, finished_on");
      if (error) throw error;
      const map: Record<string, BookProgressRow> = {};
      for (const row of (data ?? []) as BookProgressRow[]) map[row.book_slug] = row;
      return map;
    },
  });
}

export function useSetBookStatus() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { bookSlug: string; status: BookStatus }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const today = brusselsDay();
      const patch: Record<string, unknown> = { book_slug: input.bookSlug, status: input.status };
      if (input.status === "reading") patch.started_on = today;
      if (input.status === "finished") patch.finished_on = today;
      const { error } = await supabase
        .from("book_progress")
        .upsert(patch, { onConflict: "user_id,book_slug" });
      if (error) throw error;
      if (input.status === "finished") await award("finish_book", "book", input.bookSlug);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["book_progress", session?.user.id] }),
  });
}

export function useChapters(bookSlug: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["chapters", bookSlug, session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<ChapterRow[]> => {
      const { data, error } = await supabase!
        .from("book_chapters")
        .select("id, book_slug, chapter_no, title, status, completed_at")
        .eq("book_slug", bookSlug)
        .order("chapter_no");
      if (error) throw error;
      return (data ?? []) as ChapterRow[];
    },
  });
}

export function useAddChapter(bookSlug: string) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { chapterNo: number; title: string }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase.from("book_chapters").insert({
        book_slug: bookSlug,
        chapter_no: input.chapterNo,
        title: input.title || null,
      });
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["chapters", bookSlug] }),
  });
}

export function useSetChapterStatus(bookSlug: string) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { chapter: ChapterRow; status: ChapterStatus }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase
        .from("book_chapters")
        .update({
          status: input.status,
          completed_at:
            input.status === "done"
              ? (input.chapter.completed_at ?? new Date().toISOString())
              : input.chapter.completed_at,
        })
        .eq("id", input.chapter.id);
      if (error) throw error;
      if (input.status === "done") await award("finish_chapter", "book_chapter", input.chapter.id);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["chapters", bookSlug] }),
  });
}

export function useActionItems() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["action_items", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<ActionItemRow[]> => {
      const { data, error } = await supabase!
        .from("action_items")
        .select("id, title, source_type, source_id, due_on, status, completed_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActionItemRow[];
    },
  });
}

export function useAddActionItem() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      dueOn: string | null;
      sourceType?: string;
      sourceId?: string;
    }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase.from("action_items").insert({
        title: input.title,
        due_on: input.dueOn,
        source_type: input.sourceType ?? null,
        source_id: input.sourceId ?? null,
      });
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["action_items", session?.user.id] }),
  });
}

export function useToggleActionItem() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { item: ActionItemRow; done: boolean }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase
        .from("action_items")
        .update({
          status: input.done ? "done" : "open",
          completed_at: input.done ? new Date().toISOString() : null,
        })
        .eq("id", input.item.id);
      if (error) throw error;
      if (input.done) await award("complete_action_item", "action_item", input.item.id);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["action_items", session?.user.id] }),
  });
}
