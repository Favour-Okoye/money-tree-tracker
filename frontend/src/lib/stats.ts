import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { brusselsDay } from "./format";
import { awardCustom } from "./xp";
import { XP_POINTS } from "./xp";
import { BADGES, type BadgeContext } from "./badges";
import { useStatuses } from "./queries";
import { useCatalog } from "./catalog";
import { useQuizResults } from "./quiz";

export interface XpDay {
  happened_on: string;
  points: number;
}

export function useXpDays() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["xp_days", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<XpDay[]> => {
      const { data, error } = await supabase!
        .from("v_xp_by_day")
        .select("happened_on, points")
        .order("happened_on");
      if (error) throw error;
      return (data ?? []) as XpDay[];
    },
  });
}

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function computeStreak(days: string[], today = brusselsDay()) {
  const set = new Set(days);
  // current: consecutive run ending today (or yesterday, so mornings don't scare you)
  let anchor = set.has(today) ? today : set.has(shiftDay(today, -1)) ? shiftDay(today, -1) : null;
  let current = 0;
  while (anchor && set.has(anchor)) {
    current++;
    anchor = shiftDay(anchor, -1);
  }
  // longest ever
  let longest = 0;
  for (const day of set) {
    if (set.has(shiftDay(day, -1))) continue; // not a run start
    let len = 0;
    let cursor = day;
    while (set.has(cursor)) {
      len++;
      cursor = shiftDay(cursor, 1);
    }
    if (len > longest) longest = len;
  }
  return { current, longest };
}

export interface ProgressCounts {
  notesCount: number;
  chaptersDone: number;
  bookFinished: boolean;
  assignmentsDone: number;
  postsCount: number;
  movesRegistered: boolean;
  earnedBadges: string[];
  termsLearned: number;
}

export function useProgressCounts() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["progress_counts", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<ProgressCounts> => {
      const sb = supabase!;
      const [notes, chapters, books, assigns, posts, moves, badges, terms] = await Promise.all([
        sb.from("notes").select("id", { count: "exact", head: true }),
        sb.from("book_chapters").select("id", { count: "exact", head: true }).eq("status", "done"),
        sb.from("book_progress").select("book_slug", { count: "exact", head: true }).eq("status", "finished"),
        sb.from("assignments").select("id", { count: "exact", head: true }).eq("status", "done"),
        sb.from("posts_log").select("id", { count: "exact", head: true }),
        sb
          .from("mentor_moves")
          .select("id", { count: "exact", head: true })
          .in("my_status", ["registered", "attended"]),
        sb.from("badges").select("badge_id"),
        sb.from("learned_terms").select("term_id", { count: "exact", head: true }),
      ]);
      return {
        notesCount: notes.count ?? 0,
        chaptersDone: chapters.count ?? 0,
        bookFinished: (books.count ?? 0) > 0,
        assignmentsDone: assigns.count ?? 0,
        postsCount: posts.count ?? 0,
        movesRegistered: (moves.count ?? 0) > 0,
        earnedBadges: ((badges.data ?? []) as { badge_id: string }[]).map((b) => b.badge_id),
        termsLearned: terms.count ?? 0,
      };
    },
  });
}

/** The growth engine: totals, streaks (+ bonuses), badge evaluation.
 *  Runs wherever the dashboard mounts; everything it writes is idempotent. */
export function useGrowth() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const xpDaysQ = useXpDays();
  const statusesQ = useStatuses();
  const catalogQ = useCatalog();
  const countsQ = useProgressCounts();
  const quizzesQ = useQuizResults();
  const maintained = useRef(false);

  const totalXp = (xpDaysQ.data ?? []).reduce((sum, d) => sum + d.points, 0);
  const streak = computeStreak((xpDaysQ.data ?? []).map((d) => d.happened_on));

  const statuses = statusesQ.data ?? {};
  const watchedRows = Object.values(statuses).filter((s) => s.status === "watched");
  const watchedCount = watchedRows.length;
  const byDay = new Map<string, number>();
  for (const row of watchedRows) {
    if (!row.watched_at) continue;
    const day = row.watched_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const maxWatchedInADay = Math.max(0, ...byDay.values());

  let earlyBird = false;
  if (catalogQ.data) {
    const publishedById = new Map(
      catalogQ.data.videos.map((v) => [v.id, v.published_at] as const)
    );
    earlyBird = watchedRows.some((row) => {
      const published = publishedById.get(row.media_id);
      return (
        !!published &&
        !!row.watched_at &&
        Date.parse(row.watched_at) - Date.parse(published) < 24 * 3600 * 1000 &&
        Date.parse(row.watched_at) >= Date.parse(published)
      );
    });
  }

  const quizzesDone = (quizzesQ.data ?? []).filter((r) => r.status === "done").length;

  const ready =
    !!session && xpDaysQ.isSuccess && statusesQ.isSuccess && countsQ.isSuccess && quizzesQ.isSuccess;

  const badgeCtx: BadgeContext | null = ready
    ? {
        totalXp,
        watchedCount,
        maxWatchedInADay,
        earlyBird,
        notesCount: countsQ.data!.notesCount,
        chaptersDone: countsQ.data!.chaptersDone,
        bookFinished: countsQ.data!.bookFinished,
        assignmentsDone: countsQ.data!.assignmentsDone,
        postsCount: countsQ.data!.postsCount,
        movesRegistered: countsQ.data!.movesRegistered,
        longestStreak: streak.longest,
        quizzesDone,
        termsLearned: countsQ.data!.termsLearned,
      }
    : null;

  // one maintenance pass per app load: profile cache, streak bonuses, new badges
  useEffect(() => {
    if (!ready || !badgeCtx || maintained.current || !supabase || !session) return;
    maintained.current = true;
    const run = async () => {
      const sb = supabase!;
      await sb
        .from("profiles")
        .update({
          xp_total: totalXp,
          current_streak: streak.current,
          longest_streak: streak.longest,
          last_activity_on: brusselsDay(),
        })
        .eq("user_id", session.user.id);

      if (streak.current >= 7) {
        const runStart = shiftDay(brusselsDay(), -(streak.current - 1));
        await awardCustom("streak_bonus_7", "streak", `7-${runStart}`, XP_POINTS.streak_bonus_7);
      }
      if (streak.current >= 30) {
        const runStart = shiftDay(brusselsDay(), -(streak.current - 1));
        await awardCustom("streak_bonus_30", "streak", `30-${runStart}`, XP_POINTS.streak_bonus_30);
      }

      const owned = new Set(countsQ.data!.earnedBadges);
      const fresh = BADGES.filter((b) => !owned.has(b.id) && b.earned(badgeCtx));
      if (fresh.length) {
        await sb
          .from("badges")
          .upsert(
            fresh.map((b) => ({ badge_id: b.id })),
            { onConflict: "user_id,badge_id", ignoreDuplicates: true }
          );
        void qc.invalidateQueries({ queryKey: ["progress_counts", session.user.id] });
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return {
    loading: !!session && !ready,
    totalXp,
    streak,
    watchedCount,
    counts: countsQ.data,
    quizzesDone,
    xpDays: xpDaysQ.data ?? [],
    earnedBadges: new Set(countsQ.data?.earnedBadges ?? []),
  };
}
