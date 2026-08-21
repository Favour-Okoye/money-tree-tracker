import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { awardCustom } from "./xp";
import { brusselsDay } from "./format";
import { QUIZ_BANK, type BankQuestion } from "./quizBank";
import { WEALTH_TERMS, TERM_BY_ID } from "./wealthTerms";
import type { Catalog } from "./types";
import type { StatusMap } from "./queries";

export interface QuizQuestion {
  id: string;
  kind: "cloze_note" | "cloze_term" | "recall_term" | "knowledge";
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

const STOPWORDS = new Set(("a about above after again against all also although always am among an and any are as at be because been before being below between both but by can cannot could did do does doing done down during each either enough especially even ever every few for from further had has have having he her here hers herself him himself his how however i if in into is it its itself just least less like many may me might more most much must my myself need neither never no nor not nothing now of off often on once one only onto or other others ought our ours ourselves out over own per perhaps quite rather really same several shall she should since so some something still such than that the their theirs them themselves then there therefore these they this those though through thus to too toward under until up upon us very was we were what whatever when whenever where whether which while who whom whose why will with within without would yes yet you your yours yourself yourselves video videos grace watched watch learned learn thing things people really think thought also going want wants make makes made say says said see seen seeing know knows knew get gets got take takes took give gives gave good great big small today week").split(" "));

const FALLBACK_WORDS = ["asset", "liability", "leverage", "equity", "income", "yield", "capital", "inflation", "compounding", "budget", "discipline", "investment", "property", "business", "mindset", "freedom", "value", "problem", "systems", "patience"];

function clozeFromText(text: string, rnd: () => number, extraPool: string[]): { blanked: string; answer: string; options: string[] } | null {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 0);
  const candidates: { sentence: string; word: string }[] = [];
  for (const sentence of sentences) {
    for (const raw of sentence.split(/\s+/)) {
      const word = raw.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
      if (word.length >= 5 && !STOPWORDS.has(word.toLowerCase()) && /^[A-Za-z]+$/.test(word)) {
        candidates.push({ sentence, word });
      }
    }
  }
  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(rnd() * candidates.length)];
  const blanked = pick.sentence.replace(new RegExp(`\\b${pick.word}\\b`), "______");
  const answer = pick.word.toLowerCase();
  const pool = Array.from(new Set([...extraPool, ...FALLBACK_WORDS].map((w) => w.toLowerCase()).filter((w) => w !== answer && w.length >= 4)));
  const distractors = shuffle(pool, rnd).slice(0, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([answer, ...distractors], rnd);
  return { blanked: blanked.length > 220 ? `…${blanked.slice(0, 220)}…` : blanked, answer, options };
}

export function buildQuiz(
  weekKey: string,
  _catalog: Catalog,
  _statuses: StatusMap,
  weekNotes: WeekNote[],
  learnedTermIds: string[] = []
): QuizQuestion[] {
  const rnd = seededRandom(weekKey);
  const questions: QuizQuestion[] = [];

  // Word pool for distractors: meaningful words from all of this week's notes
  const notePool = weekNotes
    .flatMap((n) => n.body.split(/\s+/))
    .map((w) => w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w.toLowerCase()));

  // Up to 2: fill the blank in YOUR OWN reflection (no titles needed)
  const richNotes = weekNotes.filter((n) => n.body.split(/\s+/).length >= 8);
  for (const note of shuffle(richNotes, rnd).slice(0, 2)) {
    const cloze = clozeFromText(note.body, rnd, notePool);
    if (!cloze) continue;
    questions.push({
      id: `cloze-${note.id}`,
      kind: "cloze_note",
      question: "Fill the blank in your own reflection:",
      context: `“${cloze.blanked}”`,
      options: cloze.options,
      correct: cloze.options.indexOf(cloze.answer),
      explain: "Your own words from this week — the idea matters, not the video title ✍️",
    });
  }

  // Up to 2 Wealth Words: blank the term inside its own explanation when it appears there,
  // otherwise ask for its definition.
  const learnedTerms = learnedTermIds.map((id) => TERM_BY_ID.get(id)).filter((t): t is NonNullable<typeof t> => !!t);
  for (const term of shuffle(learnedTerms, rnd).slice(0, 2)) {
    const headword = term.term.split(" (")[0];
    const prose = `${term.explain} ${term.example} ${term.why}`;
    const sentence = prose.split(/(?<=[.!?])\s+/).find((x) => new RegExp(`\\b${headword}\\b`, "i").test(x));
    const otherNames = shuffle(WEALTH_TERMS.filter((t) => t.id !== term.id), rnd).slice(0, 3).map((t) => t.term.split(" (")[0]);
    if (sentence) {
      const options = shuffle([headword, ...otherNames], rnd);
      questions.push({
        id: `term-cloze-${term.id}`,
        kind: "cloze_term",
        question: "Which Wealth Word completes this?",
        context: `“${sentence.replace(new RegExp(`\\b${headword}\\b`, "i"), "______")}”`,
        options,
        correct: options.indexOf(headword),
        explain: `${term.term}: ${term.short}.`,
      });
    } else {
      const distractors = shuffle(WEALTH_TERMS.filter((t) => t.id !== term.id), rnd).slice(0, 3).map((t) => t.short);
      const options = shuffle([term.short, ...distractors], rnd);
      questions.push({
        id: `term-${term.id}`,
        kind: "recall_term",
        question: `What does “${term.term}” mean?`,
        options,
        correct: options.indexOf(term.short),
        explain: `${term.explain} (You learned this as a Wealth Word.)`,
      });
    }
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
