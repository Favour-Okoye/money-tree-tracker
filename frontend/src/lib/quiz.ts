import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { awardCustom } from "./xp";
import { brusselsDay } from "./format";
import { QUIZ_BANK, type BankQuestion } from "./quizBank";
import type { Catalog } from "./types";
import type { StatusMap } from "./queries";

export interface QuizQuestion {
  id: string;
  kind: "recall_watch" | "recall_note" | "knowledge";
  question: string;
  context?: string;
  options: string[];
  correct: number;
  explain: string;
}

export interface QuizResultRow {
  week_key: string;
  score: number;
  total: number;
  grade: string | null;
  status: "done" | "missed";
  taken_at: string;
}

export interface WeekNote {
  id: string;
  source_type: string;
  source_id: string | null;
  body: string;
}

// ---------- week helpers (all Brussels-local days) ----------

/** Most recent Saturday on or before today. */
export function lastSaturday(todayStr = brusselsDay()): string {
  const d = new Date(`${todayStr}T00:00:00Z`);
  const sinceSat = (d.getUTCDay() - 6 + 7) % 7;
  d.setUTCDate(d.getUTCDate() - sinceSat);
  return d.toISOString().slice(0, 10);
}

/** The 7 days a Saturday quiz covers: previous Saturday .. Friday. */
export function weekWindow(saturday: string): { from: string; to: string } {
  const d = new Date(`${saturday}T00:00:00Z`);
  const to = new Date(d);
  to.setUTCDate(to.getUTCDate() - 1);
  const from = new Date(d);
  from.setUTCDate(from.getUTCDate() - 7);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function saturdaysBetween(afterExclusive: string, beforeExclusive: string): string[] {
  const out: string[] = [];
  const d = new Date(`${afterExclusive}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  while (d.toISOString().slice(0, 10) < beforeExclusive) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

function isoWeekNumber(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

// deterministic PRNG so the same week always builds the same quiz
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function gradeFor(score: number, total: number): string {
  if (total === 0) return "—";
  const pct = score / total;
  if (pct >= 0.9) return "A";
  if (pct >= 0.75) return "B";
  if (pct >= 0.6) return "C";
  if (pct >= 0.4) return "D";
  return "F";
}

// ---------- quiz construction ----------

export function buildQuiz(
  weekKey: string,
  catalog: Catalog,
  statuses: StatusMap,
  weekNotes: WeekNote[]
): QuizQuestion[] {
  const rnd = seededRandom(weekKey);
  const questions: QuizQuestion[] = [];
  const { from, to } = weekWindow(weekKey);
  const videosById = new Map(catalog.videos.map((v) => [v.id, v]));

  const allStatuses = Object.values(statuses);
  const watchedSet = new Set(
    allStatuses.filter((s) => s.status === "watched").map((s) => s.media_id)
  );
  const watchedThisWeek = allStatuses.filter(
    (s) =>
      s.status === "watched" &&
      s.watched_at &&
      s.watched_at.slice(0, 10) >= from &&
      s.watched_at.slice(0, 10) <= to &&
      videosById.has(s.media_id)
  );
  const unwatchedPool = catalog.videos.filter((v) => !watchedSet.has(v.id)).slice(0, 200);

  // Up to 2: "which of these did you actually watch?"
  for (const s of shuffle(watchedThisWeek, rnd).slice(0, 2)) {
    const title = videosById.get(s.media_id)!.title;
    const distractors = shuffle(unwatchedPool, rnd)
      .slice(0, 3)
      .map((v) => v.title);
    if (distractors.length < 3) break;
    const options = shuffle([title, ...distractors], rnd);
    questions.push({
      id: `watch-${s.media_id}`,
      kind: "recall_watch",
      question: "Which of these videos did you ACTUALLY watch this week?",
      options,
      correct: options.indexOf(title),
      explain: "Straight from your own watch history 👀",
    });
  }

  // Up to 2: "you wrote this — which video was it about?"
  const videoNotes = weekNotes.filter(
    (n) => n.source_type === "video" && n.source_id && videosById.has(n.source_id)
  );
  for (const note of shuffle(videoNotes, rnd).slice(0, 2)) {
    const correctTitle = videosById.get(note.source_id!)!.title;
    const distractors = shuffle(
      catalog.videos.filter((v) => v.id !== note.source_id),
      rnd
    )
      .slice(0, 3)
      .map((v) => v.title);
    const options = shuffle([correctTitle, ...distractors], rnd);
    const snippet = note.body.length > 110 ? `${note.body.slice(0, 110)}…` : note.body;
    questions.push({
      id: `note-${note.id}`,
      kind: "recall_note",
      question: "You wrote this reflection — which video was it about?",
      context: `“${snippet}”`,
      options,
      correct: options.indexOf(correctTitle),
      explain: "Your own words, your own lesson ✍️",
    });
  }

  // 5 knowledge questions, rotating through the bank by ISO week
  const start = (isoWeekNumber(weekKey) * 5) % QUIZ_BANK.length;
  const bankQs: BankQuestion[] = Array.from(
    { length: 5 },
    (_, i) => QUIZ_BANK[(start + i) % QUIZ_BANK.length]
  );
  for (const q of bankQs) {
    const order = shuffle([0, 1, 2, 3], rnd);
    questions.push({
      id: `bank-${q.id}`,
      kind: "knowledge",
      question: q.question,
      options: order.map((i) => q.options[i]),
      correct: order.indexOf(q.correct),
      explain: q.explain,
    });
  }

  return questions;
}

// ---------- hooks ----------

export function useQuizResults() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["quiz_results", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<QuizResultRow[]> => {
      const { data, error } = await supabase!
        .from("quiz_results")
        .select("week_key, score, total, grade, status, taken_at")
        .order("week_key", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuizResultRow[];
    },
  });
}

/** Notes written in the quiz week, for recall questions. */
export function useWeekNotes(weekKey: string | null) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["week_notes", weekKey, session?.user.id],
    enabled: !!supabase && !!session && !!weekKey,
    queryFn: async (): Promise<WeekNote[]> => {
      const { from, to } = weekWindow(weekKey!);
      const { data, error } = await supabase!
        .from("notes")
        .select("id, source_type, source_id, body")
        .gte("created_at", `${from}T00:00:00Z`)
        .lte("created_at", `${to}T23:59:59Z`);
      if (error) throw error;
      return (data ?? []) as WeekNote[];
    },
  });
}

/** Is a quiz due? Also backfills 'missed' rows for fully skipped weeks. */
export function useQuizDue(profileCreatedAt: string | undefined) {
  const { session } = useAuth();
  const resultsQ = useQuizResults();
  const qc = useQueryClient();
  const backfilled = useRef(false);

  const dueWeek = lastSaturday();
  const createdDay = profileCreatedAt ? profileCreatedAt.slice(0, 10) : null;
  const results = resultsQ.data;

  // Account must have existed before this quiz's Saturday for it to count.
  const eligible = !!createdDay && createdDay < dueWeek;
  const hasResult = results?.some((r) => r.week_key === dueWeek) ?? false;
  const due = eligible && results !== undefined && !hasResult;

  useEffect(() => {
    if (backfilled.current || !supabase || !session || !results || !createdDay) return;
    backfilled.current = true;
    const anchor = results.length
      ? results.reduce((m, r) => (r.week_key > m ? r.week_key : m), results[0].week_key)
      : lastSaturday(createdDay) === createdDay
        ? createdDay
        : lastSaturday(createdDay);
    const missed = saturdaysBetween(anchor, dueWeek).filter((s) => s > createdDay);
    if (missed.length === 0) return;
    void supabase
      .from("quiz_results")
      .upsert(
        missed.map((week) => ({
          week_key: week,
          score: 0,
          total: 0,
          grade: "missed",
          status: "missed" as const,
        })),
        { onConflict: "user_id,week_key", ignoreDuplicates: true }
      )
      .then(() => void qc.invalidateQueries({ queryKey: ["quiz_results", session.user.id] }));
  }, [results, createdDay, dueWeek, session, qc]);

  return { due, dueWeek, resultsQ };
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      weekKey: string;
      score: number;
      total: number;
      details: unknown;
    }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const grade = gradeFor(input.score, input.total);
      const { error } = await supabase.from("quiz_results").upsert(
        {
          week_key: input.weekKey,
          score: input.score,
          total: input.total,
          grade,
          status: "done",
          details: input.details,
        },
        { onConflict: "user_id,week_key" }
      );
      if (error) throw error;
      // +30 for showing up, +5 per correct answer
      await awardCustom("weekly_quiz", "quiz", input.weekKey, 30 + input.score * 5);
      return grade;
    },
    onSettled: () =>
      void qc.invalidateQueries({ queryKey: ["quiz_results", session?.user.id] }),
  });
}
